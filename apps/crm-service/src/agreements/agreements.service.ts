import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { clampPagination } from '@tscrm/types';

const INTERVAL_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  BI_MONTHLY: 2,
  QUARTERLY: 3,
  BI_ANNUAL: 6,
  ANNUAL: 12,
};

/** Fields that trigger an amendment record when changed on an ACTIVE agreement. */
const AMENDABLE_FIELDS = [
  'name', 'description', 'value', 'billingCycle', 'billingAmount',
  'serviceType', 'serviceInterval', 'serviceIntervalDays', 'visitsIncluded',
  'startDate', 'endDate', 'autoRenew',
] as const;

export function addServiceInterval(
  from: Date,
  interval?: string | null,
  intervalDays?: number | null,
): Date | null {
  if (!interval) return null;
  const next = new Date(from);
  if (interval === 'CUSTOM') {
    if (!intervalDays || intervalDays <= 0) return null;
    next.setDate(next.getDate() + intervalDays);
    return next;
  }
  const months = INTERVAL_MONTHS[interval];
  if (!months) return null;
  next.setMonth(next.getMonth() + months);
  return next;
}

@Injectable()
export class AgreementsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async findAll(
    companyId: string,
    opts: { status?: string; customerId?: string; page?: number; limit?: number } = {},
  ) {
    const { page, limit } = clampPagination({ page: opts.page, limit: opts.limit });
    const where = {
      companyId,
      ...(opts.status && { status: opts.status as any }),
      ...(opts.customerId && { customerId: opts.customerId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.serviceAgreement.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceAgreement.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Customer-portal listing — always scoped to the caller's customerId. */
  async findMine(companyId: string, customerId: string) {
    const data = await this.prisma.serviceAgreement.findMany({
      where: { companyId, customerId },
      include: { amendments: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async findOne(companyId: string, id: string) {
    const agreement = await this.prisma.serviceAgreement.findFirst({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        amendments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    return agreement;
  }

  async create(companyId: string, data: any) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: data.customerId, companyId },
      select: { id: true },
    });
    if (!customer) throw new BadRequestException('Customer not found in this company');

    const startDate = new Date(data.startDate);
    const nextServiceDate =
      data.nextServiceDate != null
        ? new Date(data.nextServiceDate)
        : addServiceInterval(startDate, data.serviceInterval, data.serviceIntervalDays);

    return this.prisma.serviceAgreement.create({
      data: {
        companyId,
        customerId: data.customerId,
        name: data.name,
        description: data.description,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        value: data.value,
        billingCycle: data.billingCycle,
        billingAmount: data.billingAmount,
        nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
        serviceType: data.serviceType,
        serviceInterval: data.serviceInterval,
        serviceIntervalDays: data.serviceIntervalDays,
        visitsIncluded: data.visitsIncluded,
        nextServiceDate,
        autoCreateJobs: data.autoCreateJobs ?? true,
        leadDays: data.leadDays ?? 7,
        jobTemplateId: data.jobTemplateId,
        autoRenew: data.autoRenew ?? false,
      },
    });
  }

  async update(companyId: string, id: string, data: any, user: { id: string; name?: string }) {
    const existing = await this.findOne(companyId, id);

    // Amendment trail: material changes to an ACTIVE agreement are snapshotted
    // and the customer is asked to re-confirm.
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    if (existing.status === 'ACTIVE') {
      for (const field of AMENDABLE_FIELDS) {
        if (data[field] === undefined) continue;
        const oldVal = (existing as any)[field];
        const newVal = ['startDate', 'endDate'].includes(field) && data[field]
          ? new Date(data[field])
          : data[field];
        const a = oldVal instanceof Date ? oldVal.toISOString() : String(oldVal ?? '');
        const b = newVal instanceof Date ? newVal.toISOString() : String(newVal ?? '');
        if (a !== b) changed[field] = { from: oldVal, to: data[field] };
      }
    }

    const updateData: any = { ...data };
    for (const key of ['startDate', 'endDate', 'nextBillingDate', 'nextServiceDate', 'lastServiceDate']) {
      if (updateData[key]) updateData[key] = new Date(updateData[key]);
    }
    delete updateData.customerId; // agreements don't move between customers

    // Recompute next service date if the schedule changed and none was given
    if (
      (data.serviceInterval !== undefined || data.serviceIntervalDays !== undefined) &&
      data.nextServiceDate === undefined
    ) {
      const base = existing.lastServiceDate ?? existing.startDate;
      updateData.nextServiceDate = addServiceInterval(
        base,
        data.serviceInterval ?? existing.serviceInterval,
        data.serviceIntervalDays ?? existing.serviceIntervalDays,
      );
    }

    const updated = await this.prisma.serviceAgreement.update({
      where: { id },
      data: updateData,
    });

    if (Object.keys(changed).length > 0) {
      await this.prisma.agreementAmendment.create({
        data: {
          agreementId: id,
          changedFields: changed as any,
          changedBy: user.id,
          changedByName: user.name,
        },
      });
      await this.notifyAmendment(updated).catch(() => undefined);
    }

    return updated;
  }

  /** Email the agreement to the customer with a one-time confirm link. */
  async send(companyId: string, id: string) {
    const agreement = await this.findOne(companyId, id);
    if (!agreement.customer?.email) {
      throw new BadRequestException('Customer has no email address on file');
    }

    const confirmToken = agreement.confirmToken ?? randomBytes(24).toString('hex');
    const updated = await this.prisma.serviceAgreement.update({
      where: { id },
      data: { confirmToken, status: agreement.status === 'DRAFT' ? 'SENT' : agreement.status },
    });

    const portalUrl = process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174';
    const confirmUrl = `${portalUrl}/agreements/confirm/${confirmToken}`;
    await this.email.sendMail({
      to: agreement.customer.email,
      subject: `Please review your service agreement: ${agreement.name}`,
      html: this.agreementEmailHtml(agreement, confirmUrl),
    });

    return updated;
  }

  /** Public confirm — customer clicked the email/portal link. */
  async getByToken(token: string) {
    const agreement = await this.prisma.serviceAgreement.findUnique({
      where: { confirmToken: token },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
      },
    });
    if (!agreement) throw new NotFoundException('Invalid or expired confirmation link');
    return agreement;
  }

  async confirmByToken(token: string, confirmedByName?: string) {
    const agreement = await this.prisma.serviceAgreement.findUnique({
      where: { confirmToken: token },
    });
    if (!agreement) throw new NotFoundException('Invalid or expired confirmation link');

    const now = new Date();
    const updated = await this.prisma.serviceAgreement.update({
      where: { id: agreement.id },
      data: {
        status: ['DRAFT', 'SENT'].includes(agreement.status) ? 'ACTIVE' : agreement.status,
        customerConfirmedAt: now,
        signedAt: agreement.signedAt ?? now,
        signedByName: confirmedByName ?? agreement.signedByName,
        confirmToken: null, // one-time use
      },
    });

    // Confirming the agreement also confirms any outstanding amendment
    await this.prisma.agreementAmendment.updateMany({
      where: { agreementId: agreement.id, customerConfirmedAt: null },
      data: { customerConfirmedAt: now },
    });

    return updated;
  }

  /** Admin one-click renew: clone terms into a new DRAFT agreement. */
  async renew(companyId: string, id: string) {
    const existing = await this.findOne(companyId, id);

    const durationMs = existing.endDate
      ? existing.endDate.getTime() - existing.startDate.getTime()
      : null;
    const newStart = existing.endDate ?? new Date();
    const newEnd = durationMs ? new Date(newStart.getTime() + durationMs) : null;

    const renewed = await this.prisma.serviceAgreement.create({
      data: {
        companyId,
        customerId: existing.customerId,
        name: existing.name,
        description: existing.description,
        startDate: newStart,
        endDate: newEnd,
        value: existing.value,
        billingCycle: existing.billingCycle,
        billingAmount: existing.billingAmount,
        serviceType: existing.serviceType,
        serviceInterval: existing.serviceInterval,
        serviceIntervalDays: existing.serviceIntervalDays,
        visitsIncluded: existing.visitsIncluded,
        nextServiceDate: addServiceInterval(newStart, existing.serviceInterval, existing.serviceIntervalDays),
        autoCreateJobs: existing.autoCreateJobs,
        leadDays: existing.leadDays,
        jobTemplateId: existing.jobTemplateId,
        autoRenew: existing.autoRenew,
        renewedFromId: existing.id,
      },
    });

    if (existing.status === 'ACTIVE' || existing.status === 'PENDING_RENEWAL') {
      await this.prisma.serviceAgreement.update({
        where: { id: existing.id },
        data: { status: 'RENEWED' },
      });
    }

    return renewed;
  }

  async cancel(companyId: string, id: string) {
    await this.findOne(companyId, id);
    return this.prisma.serviceAgreement.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Called when an agreement job completes (Phase 2 hook).
   * Advances the service schedule and flags exhausted agreements for renewal.
   */
  async recordVisit(companyId: string, id: string, serviceDate = new Date()) {
    const agreement = await this.findOne(companyId, id);
    const visitsUsed = agreement.visitsUsed + 1;
    const exhausted =
      agreement.visitsIncluded != null && visitsUsed >= agreement.visitsIncluded;

    return this.prisma.serviceAgreement.update({
      where: { id },
      data: {
        lastServiceDate: serviceDate,
        visitsUsed,
        nextServiceDate: exhausted
          ? null
          : addServiceInterval(serviceDate, agreement.serviceInterval, agreement.serviceIntervalDays),
        ...(exhausted && agreement.status === 'ACTIVE' && { status: 'PENDING_RENEWAL' }),
      },
    });
  }

  private async notifyAmendment(agreement: { id: string; companyId: string; name: string; customerId: string }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: agreement.customerId },
      select: { email: true, firstName: true },
    });
    if (!customer?.email) return;

    const confirmToken = randomBytes(24).toString('hex');
    await this.prisma.serviceAgreement.update({
      where: { id: agreement.id },
      data: { confirmToken },
    });
    await this.prisma.agreementAmendment.updateMany({
      where: { agreementId: agreement.id, customerNotifiedAt: null },
      data: { customerNotifiedAt: new Date() },
    });

    const portalUrl = process.env.CUSTOMER_PORTAL_URL ?? 'http://localhost:5174';
    await this.email.sendMail({
      to: customer.email,
      subject: `Your service agreement "${agreement.name}" has been updated`,
      html: `
<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2>Agreement updated</h2>
  <p>Hi ${customer.firstName},</p>
  <p>The terms of your service agreement <strong>${agreement.name}</strong> have been updated.
     Please review and confirm the new terms.</p>
  <p><a href="${portalUrl}/agreements/confirm/${confirmToken}"
        style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
     Review &amp; confirm</a></p>
  <p style="color:#666;font-size:13px;">You can also view your agreements any time in your customer portal.</p>
</div>`,
    });
  }

  private agreementEmailHtml(agreement: any, confirmUrl: string): string {
    const fmt = (d?: Date | null) => (d ? new Date(d).toLocaleDateString() : '—');
    const money = (v?: any) => (v != null ? `$${Number(v).toFixed(2)}` : '—');
    return `
<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
  <h2>${agreement.name}</h2>
  <p>Hi ${agreement.customer.firstName},</p>
  <p>Please review your service agreement below and confirm to activate it.</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${agreement.serviceType ? `<tr><td style="padding:6px 0;color:#666;">Service</td><td>${agreement.serviceType}</td></tr>` : ''}
    ${agreement.serviceInterval ? `<tr><td style="padding:6px 0;color:#666;">Frequency</td><td>${agreement.serviceInterval.replace(/_/g, ' ').toLowerCase()}</td></tr>` : ''}
    ${agreement.visitsIncluded != null ? `<tr><td style="padding:6px 0;color:#666;">Visits included</td><td>${agreement.visitsIncluded}</td></tr>` : ''}
    <tr><td style="padding:6px 0;color:#666;">Start date</td><td>${fmt(agreement.startDate)}</td></tr>
    <tr><td style="padding:6px 0;color:#666;">End date</td><td>${fmt(agreement.endDate)}</td></tr>
    ${agreement.value != null ? `<tr><td style="padding:6px 0;color:#666;">Total value</td><td>${money(agreement.value)}</td></tr>` : ''}
    ${agreement.billingCycle ? `<tr><td style="padding:6px 0;color:#666;">Billing</td><td>${agreement.billingCycle.toLowerCase()}${agreement.billingAmount != null ? ` — ${money(agreement.billingAmount)} per period` : ''}</td></tr>` : ''}
  </table>
  ${agreement.description ? `<p style="white-space:pre-wrap;border-left:3px solid #e5e7eb;padding-left:12px;color:#444;">${agreement.description}</p>` : ''}
  <p style="margin-top:24px;">
    <a href="${confirmUrl}"
       style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
       Confirm agreement</a>
  </p>
  <p style="color:#666;font-size:13px;">Questions? Just reply to this email or call our office.</p>
</div>`;
  }
}
