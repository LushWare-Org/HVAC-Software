import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const JOBS_URL = process.env.JOBS_SERVICE_URL ?? 'http://localhost:3002';

/** Job statuses that count as "already scheduled" — don't create a duplicate. */
const OPEN_JOB_STATUSES = ['PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'ON_HOLD'];

/**
 * AgreementsCron — twice a day:
 *  1. Auto-creates service jobs from ACTIVE agreements whose nextServiceDate
 *     falls within the agreement's leadDays window.
 *  2. Expires agreements past their endDate.
 *  3. Sends a renewal-reminder email when an agreement is inside 30 days of
 *     its endDate (once per agreement).
 */
@Injectable()
export class AgreementsCron implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AgreementsCron.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => void this.runOnce(), TWELVE_HOURS_MS);
    void this.runOnce();
  }

  onModuleDestroy(): void {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
  }

  async runOnce(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      if (!(await this.prisma.ensureRequiredSchemaReady())) {
        this.logger.warn('Skipping agreements cycle — CRM schema not ready');
        return;
      }
      const created = await this.createDueJobs();
      const expired = await this.expireEndedAgreements();
      const reminded = await this.sendRenewalReminders();
      if (created || expired || reminded) {
        this.logger.log(`Agreements cycle: ${created} jobs created, ${expired} expired, ${reminded} renewal reminders`);
      }
    } catch (error) {
      this.logger.error('Agreements cycle failed', error instanceof Error ? error.stack : undefined);
    } finally {
      this.isRunning = false;
    }
  }

  private async createDueJobs(): Promise<number> {
    const now = new Date();
    const candidates = await this.prisma.serviceAgreement.findMany({
      where: {
        status: 'ACTIVE',
        autoCreateJobs: true,
        nextServiceDate: { not: null },
      },
      include: {
        customer: {
          select: {
            id: true, firstName: true, lastName: true, email: true, phone: true,
            address: true, city: true, state: true, zipCode: true,
          },
        },
      },
    });

    let created = 0;
    for (const agreement of candidates) {
      const due = agreement.nextServiceDate!;
      const windowStart = new Date(due);
      windowStart.setDate(windowStart.getDate() - agreement.leadDays);
      if (now < windowStart) continue;
      if (agreement.visitsIncluded != null && agreement.visitsUsed >= agreement.visitsIncluded) continue;

      // Skip if an open job already exists for this agreement
      const existing = await this.hasOpenJob(agreement.companyId, agreement.id);
      if (existing === null) continue; // job-service unreachable — retry next cycle
      if (existing) continue;

      const customer = agreement.customer;
      const address = [customer.address, customer.city, customer.state, customer.zipCode]
        .filter(Boolean)
        .join(', ');
      const jobId = await this.createJob({
        companyId: agreement.companyId,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        customerPhone: customer.phone,
        serviceAddress: address || 'Address on file',
        title: `${agreement.serviceType ?? 'Service visit'} — ${agreement.name}`,
        description:
          `Scheduled maintenance visit under service agreement "${agreement.name}". ` +
          `Visit due ${due.toISOString().slice(0, 10)}.`,
        agreementId: agreement.id,
        templateId: agreement.jobTemplateId,
        projectId: agreement.projectId,
        scheduledStart: due.toISOString(),
      });
      if (jobId) {
        created += 1;
        // Let the customer know their visit is coming up
        if (customer.email) {
          await this.email
            .sendMail({
              to: customer.email,
              subject: `Your ${agreement.serviceType ?? 'service'} visit is coming up`,
              html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2>Service visit scheduled</h2>
  <p>Hi ${customer.firstName},</p>
  <p>As part of your plan <strong>${agreement.name}</strong>, your next
     ${agreement.serviceType ?? 'service'} visit is due around
     <strong>${due.toLocaleDateString()}</strong>.</p>
  <p>Our team will confirm the exact time with you. You can also see this in your customer portal.</p>
</div>`,
            })
            .catch(() => undefined);
        }
      }
    }
    return created;
  }

  private async expireEndedAgreements(): Promise<number> {
    const result = await this.prisma.serviceAgreement.updateMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING_RENEWAL'] },
        endDate: { not: null, lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }

  private async sendRenewalReminders(): Promise<number> {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const dueForReminder = await this.prisma.serviceAgreement.findMany({
      where: {
        status: { in: ['ACTIVE', 'PENDING_RENEWAL'] },
        renewalReminderSent: false,
        endDate: { not: null, lte: in30Days, gt: new Date() },
      },
      include: { customer: { select: { firstName: true, email: true } } },
    });

    let sent = 0;
    for (const agreement of dueForReminder) {
      if (agreement.customer.email) {
        await this.email
          .sendMail({
            to: agreement.customer.email,
            subject: `Your service plan "${agreement.name}" expires soon`,
            html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2>Time to renew</h2>
  <p>Hi ${agreement.customer.firstName},</p>
  <p>Your plan <strong>${agreement.name}</strong> expires on
     <strong>${agreement.endDate!.toLocaleDateString()}</strong>.
     Renew to keep your scheduled maintenance and priority service going.</p>
  <p>Reply to this email or call our office and we'll set it up.</p>
</div>`,
          })
          .catch(() => undefined);
      }
      await this.prisma.serviceAgreement.update({
        where: { id: agreement.id },
        data: { renewalReminderSent: true },
      });
      sent += 1;
    }
    return sent;
  }

  // ── job-service HTTP helpers ──────────────────────────────────────────────

  private serviceHeaders(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'agreements-cron',
        'x-test-user-email': 'agreements@tscrm.internal',
        'x-test-user-name': 'Agreements Automation',
      };
    }
    return { Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}` };
  }

  /** true = open job exists, false = none, null = job-service unreachable. */
  private async hasOpenJob(companyId: string, agreementId: string): Promise<boolean | null> {
    try {
      const res = await axios.get(`${JOBS_URL}/jobs`, {
        params: { agreementId, limit: 50 },
        headers: this.serviceHeaders(companyId),
        timeout: 8_000,
      });
      const jobs: Array<{ status: string }> = res.data?.data ?? [];
      return jobs.some((j) => OPEN_JOB_STATUSES.includes(j.status));
    } catch (err: any) {
      this.logger.warn(`Could not check open jobs for agreement ${agreementId}: ${err.message}`);
      return null;
    }
  }

  private async createJob(input: {
    companyId: string;
    customerId: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    serviceAddress: string;
    title: string;
    description: string;
    agreementId: string;
    templateId?: string | null;
    projectId?: string | null;
    scheduledStart?: string;
  }): Promise<string | null> {
    try {
      const res = await axios.post(
        `${JOBS_URL}/jobs`,
        {
          customerId: input.customerId,
          customerName: input.customerName,
          customerEmail: input.customerEmail ?? undefined,
          customerPhone: input.customerPhone ?? undefined,
          serviceAddress: input.serviceAddress,
          title: input.title,
          description: input.description,
          priority: 'NORMAL',
          tags: ['agreement-service'],
          agreementId: input.agreementId,
          projectId: input.projectId ?? undefined,
          isAgreementJob: true,
          templateId: input.templateId ?? undefined,
          scheduledStart: input.scheduledStart,
        },
        { headers: this.serviceHeaders(input.companyId), timeout: 8_000 },
      );
      this.logger.log(`Agreement job created ${res.data?.id} for agreement ${input.agreementId}`);
      return res.data?.id ?? null;
    } catch (err: any) {
      this.logger.error(`Agreement job creation failed: ${err?.response?.status} ${err.message}`);
      return null;
    }
  }
}
