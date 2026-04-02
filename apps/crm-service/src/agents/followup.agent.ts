import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FollowupAction, FollowupJobPayload } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { ChurnClient, type ChurnPredictionInput } from '../ai/churn.client';
import { FollowupProducer } from '../queues/followup.producer';

type EntityType = 'customer' | 'lead';
type AttemptStatus = 'PENDING' | 'QUEUED' | 'FAILED';

interface CustomerCandidate {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  createdAt: Date;
  updatedAt: Date;
  engagementStatus: string;
  bookings: Array<{
    preferredDate: Date;
    status: string;
  }>;
  agreements: Array<{
    value: unknown;
  }>;
}

interface LeadCandidate {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsappNo: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FollowupRunSummary {
  processed: number;
  queued: number;
  skipped: number;
  failures: number;
}

@Injectable()
export class FollowupAgent {
  private readonly logger = new Logger(FollowupAgent.name);
  private readonly analyticsServiceUrl = process.env.ANALYTICS_SERVICE_URL ?? 'http://analytics-service:3006';

  constructor(
    private readonly prisma: PrismaService,
    private readonly churnClient: ChurnClient,
    private readonly followupProducer: FollowupProducer,
  ) {}

  async run(): Promise<FollowupRunSummary> {
    const summary: FollowupRunSummary = {
      processed: 0,
      queued: 0,
      skipped: 0,
      failures: 0,
    };

    const [customers, leads] = await Promise.all([
      this.loadCustomerCandidates(),
      this.loadLeadCandidates(),
    ]);

    for (const customer of customers) {
      summary.processed += 1;
      const result = await this.processCustomer(customer);
      summary[result] += 1;
    }

    for (const lead of leads) {
      summary.processed += 1;
      const result = await this.processLead(lead);
      summary[result] += 1;
    }

    return summary;
  }

  private async loadCustomerCandidates(): Promise<CustomerCandidate[]> {
    return this.prisma.customer.findMany({
      where: {
        isActive: true,
        NOT: {
          AND: [
            { source: 'portal' },
            { engagementStatus: 'INACTIVE' },
            { tags: { has: 'portal-signup' } },
          ],
        },
      },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        mobile: true,
        createdAt: true,
        updatedAt: true,
        engagementStatus: true,
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'CONVERTED'],
            },
          },
          orderBy: {
            preferredDate: 'desc',
          },
          take: 24,
          select: {
            preferredDate: true,
            status: true,
          },
        },
        agreements: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            value: true,
          },
        },
      },
    });
  }

  private async loadLeadCandidates(): Promise<LeadCandidate[]> {
    const cutoff = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));

    return this.prisma.lead.findMany({
      where: {
        status: {
          in: ['NEW', 'CONTACTED', 'QUALIFIED'],
        },
        createdAt: {
          lte: cutoff,
        },
      },
      select: {
        id: true,
        companyId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        whatsappNo: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async processCustomer(customer: CustomerCandidate): Promise<keyof FollowupRunSummary> {
    if (await this.hasRecentFollowup(customer.companyId, 'customer', customer.id)) {
      return 'skipped';
    }

    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, customer.updatedAt);
    const action = await this.determineCustomerAction(customer, daysSinceLastService);

    if (!action) {
      return 'skipped';
    }

    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    if (!recipientPhone && !recipientEmail) {
      this.logger.warn(`Skipping customer ${customer.id}; no contact channel available`);
      return 'skipped';
    }

    const attemptId = randomUUID();
    const payload: FollowupJobPayload = {
      companyId: customer.companyId,
      entityType: 'customer',
      entityId: customer.id,
      customerId: customer.id,
      recipientId: customer.id,
      recipientName: `${customer.firstName} ${customer.lastName}`.trim(),
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      action: action.action,
      churnProb: action.churnProb ?? undefined,
      reason: action.reason,
      triggeredAt: new Date().toISOString(),
    };

    await this.createAttempt({
      attemptId,
      payload,
      entityType: 'customer',
      entityId: customer.id,
      customerId: customer.id,
      leadId: null,
    });

    try {
      const jobId = await this.followupProducer.enqueueFollowup(payload);
      await this.markAttemptQueued(attemptId, jobId);
      await this.logAnalyticsEvent(payload);
      return 'queued';
    } catch (error) {
      await this.markAttemptFailed(attemptId, error instanceof Error ? error.message : 'Unknown queue failure');
      this.logger.error(`Failed to queue customer follow-up for ${customer.id}`, error instanceof Error ? error.stack : undefined);
      return 'failures';
    }
  }

  private async processLead(lead: LeadCandidate): Promise<keyof FollowupRunSummary> {
    if (await this.hasRecentFollowup(lead.companyId, 'lead', lead.id)) {
      return 'skipped';
    }

    const recipientPhone = lead.whatsappNo ?? lead.phone;
    const recipientEmail = lead.email;

    if (!recipientPhone && !recipientEmail) {
      this.logger.warn(`Skipping lead ${lead.id}; no contact channel available`);
      return 'skipped';
    }

    const payload: FollowupJobPayload = {
      companyId: lead.companyId,
      entityType: 'lead',
      entityId: lead.id,
      leadId: lead.id,
      recipientId: lead.id,
      recipientName: `${lead.firstName} ${lead.lastName}`.trim(),
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      action: 'LEAD_FOLLOWUP',
      reason: `Cold lead in status ${lead.status}`,
      triggeredAt: new Date().toISOString(),
    };

    const attemptId = randomUUID();
    await this.createAttempt({
      attemptId,
      payload,
      entityType: 'lead',
      entityId: lead.id,
      customerId: null,
      leadId: lead.id,
    });

    try {
      const jobId = await this.followupProducer.enqueueFollowup(payload);
      await this.markAttemptQueued(attemptId, jobId);
      await this.logAnalyticsEvent(payload);
      return 'queued';
    } catch (error) {
      await this.markAttemptFailed(attemptId, error instanceof Error ? error.message : 'Unknown queue failure');
      this.logger.error(`Failed to queue lead follow-up for ${lead.id}`, error instanceof Error ? error.stack : undefined);
      return 'failures';
    }
  }

  private async determineCustomerAction(
    customer: CustomerCandidate,
    daysSinceLastService: number,
  ): Promise<{ action: Exclude<FollowupAction, 'LEAD_FOLLOWUP'>; reason: string; churnProb?: number } | null> {
    const churnInput: ChurnPredictionInput = {
      days_since_last_service: daysSinceLastService,
      service_count_last_year: this.computeServiceCountLastYear(customer.bookings),
      avg_monthly_spend: this.computeAverageMonthlySpend(customer.agreements),
      customer_tenure_days: this.computeDaysBetween(customer.createdAt, new Date()),
    };

    let churnProb: number | null = null;
    try {
      churnProb = await this.churnClient.predictChurn(churnInput);
    } catch (error) {
      this.logger.warn(`Churn prediction unavailable for customer ${customer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (churnProb !== null && churnProb > 0.7) {
      return {
        action: 'RETENTION',
        reason: `High churn probability ${churnProb.toFixed(3)}`,
        churnProb,
      };
    }

    if (customer.engagementStatus === 'INACTIVE' || daysSinceLastService > 90) {
      return {
        action: 'REENGAGEMENT',
        reason: customer.engagementStatus === 'INACTIVE'
          ? 'Customer engagement status is INACTIVE'
          : `No recent service in ${daysSinceLastService} days`,
        ...(churnProb !== null ? { churnProb } : {}),
      };
    }

    return null;
  }

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, fallbackDate: Date): number {
    const serviceDate = bookings[0]?.preferredDate ?? fallbackDate;
    return this.computeDaysBetween(serviceDate, new Date());
  }

  private computeServiceCountLastYear(bookings: Array<{ preferredDate: Date }>): number {
    const oneYearAgo = new Date(Date.now() - (365 * 24 * 60 * 60 * 1000));
    return bookings.filter((booking) => booking.preferredDate >= oneYearAgo).length;
  }

  private computeAverageMonthlySpend(agreements: Array<{ value: unknown }>): number {
    const annualValue = agreements.reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return annualValue > 0 ? Number((annualValue / 12).toFixed(2)) : 0;
  }

  private computeDaysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private async hasRecentFollowup(companyId: string, entityType: EntityType, entityId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM followup_attempts
        WHERE company_id = $1
          AND entity_type = $2
          AND entity_id = $3
          AND status IN ('PENDING', 'QUEUED')
          AND triggered_at >= NOW() - INTERVAL '48 hours'
      `,
      companyId,
      entityType,
      entityId,
    );

    return Number(rows[0]?.count ?? 0) > 0;
  }

  private async createAttempt(params: {
    attemptId: string;
    payload: FollowupJobPayload;
    entityType: EntityType;
    entityId: string;
    customerId: string | null;
    leadId: string | null;
  }): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO followup_attempts (
          id,
          company_id,
          entity_type,
          entity_id,
          customer_id,
          lead_id,
          action,
          status,
          churn_probability,
          queue_job_id,
          reason,
          error_message,
          metadata,
          triggered_at,
          queued_at,
          failed_at,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          NULL,
          $10,
          NULL,
          CAST($11 AS JSONB),
          NOW(),
          NULL,
          NULL,
          NOW(),
          NOW()
        )
      `,
      params.attemptId,
      params.payload.companyId,
      params.entityType,
      params.entityId,
      params.customerId,
      params.leadId,
      params.payload.action,
      'PENDING' satisfies AttemptStatus,
      params.payload.churnProb ?? null,
      params.payload.reason,
      JSON.stringify({
        recipientName: params.payload.recipientName,
        recipientPhone: params.payload.recipientPhone,
        recipientEmail: params.payload.recipientEmail,
      }),
    );
  }

  private async markAttemptQueued(attemptId: string, jobId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
        UPDATE followup_attempts
        SET status = $2,
            queue_job_id = $3,
            queued_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      attemptId,
      'QUEUED' satisfies AttemptStatus,
      jobId,
    );
  }

  private async markAttemptFailed(attemptId: string, errorMessage: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
        UPDATE followup_attempts
        SET status = $2,
            failed_at = NOW(),
            error_message = $3,
            updated_at = NOW()
        WHERE id = $1
      `,
      attemptId,
      'FAILED' satisfies AttemptStatus,
      errorMessage,
    );
  }

  private async logAnalyticsEvent(payload: FollowupJobPayload): Promise<void> {
    try {
      const response = await fetch(`${this.analyticsServiceUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: payload.companyId,
          eventType: 'FOLLOWUP_TRIGGERED',
          metadata: {
            action: payload.action,
            entityType: payload.entityType,
            entityId: payload.entityId,
            customerId: payload.customerId,
            leadId: payload.leadId,
            churnProb: payload.churnProb,
            reason: payload.reason,
            triggeredAt: payload.triggeredAt,
          },
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) {
        this.logger.warn(`Analytics service rejected follow-up event with ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Analytics logging failed for ${payload.entityType}:${payload.entityId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
