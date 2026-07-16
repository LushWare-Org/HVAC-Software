import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FollowupDecisionAudit, FollowupJobPayload } from '@tscrm/types';
import { PrismaService } from '../prisma/prisma.service';
import { FollowupProducer } from '../queues/followup.producer';
import { FollowupDecisionService, type FollowupDecisionRequest } from '../followup/decision/followup-decision.service';

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
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  engagementStatus: string;
  bookings: Array<{
    preferredDate: Date;
    status: string;
    serviceType: string;
  }>;
  agreements: Array<{
    status: string;
    endDate: Date | null;
    value: unknown;
  }>;
  equipment: Array<{
    installDate: Date | null;
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

interface QuoteFact {
  status: string;
  value: number | null;
  sentAt: Date | null;
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
  private companiesTableExists?: boolean;
  private automaticFollowupColumnExists?: boolean;
  private customerAutomaticFollowupColumnExists?: boolean;
  private followupAttemptsTableExists?: boolean;
  private financeQuoteTableExists?: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly followupProducer: FollowupProducer,
    private readonly decisionService: FollowupDecisionService,
  ) {}

  async run(): Promise<FollowupRunSummary> {
    const summary: FollowupRunSummary = {
      processed: 0,
      queued: 0,
      skipped: 0,
      failures: 0,
    };

    const enabledCompanyIds = await this.getEnabledCompanyIds();
    const customers = await this.loadCustomerCandidates(enabledCompanyIds);
    const leads = await this.loadLeadCandidates(enabledCompanyIds);
    const quotesByCustomerId = await this.loadLatestQuotesByCustomer(
      enabledCompanyIds,
      customers.map((customer) => customer.id),
    );

    for (const customer of customers) {
      summary.processed += 1;
      const result = await this.processCustomer(customer, quotesByCustomerId.get(customer.id));
      summary[result] += 1;
    }

    for (const lead of leads) {
      summary.processed += 1;
      const result = await this.processLead(lead);
      summary[result] += 1;
    }

    return summary;
  }

  private async hasCompaniesTable(): Promise<boolean> {
    if (this.companiesTableExists !== undefined) {
      return this.companiesTableExists;
    }

    this.companiesTableExists = await this.prisma.tableExists('companies');
    if (!this.companiesTableExists) {
      this.logger.warn('companies table is missing; skipping automatic follow-up until the CRM migration is applied');
    }

    return this.companiesTableExists;
  }

  private async hasAutomaticFollowupColumn(): Promise<boolean> {
    if (this.automaticFollowupColumnExists !== undefined) {
      return this.automaticFollowupColumnExists;
    }

    this.automaticFollowupColumnExists = await this.prisma.columnExists('companies', 'automaticFollowupEnabled');
    if (!this.automaticFollowupColumnExists) {
      this.logger.warn('companies.automaticFollowupEnabled column is missing; automatic follow-up will remain enabled for all companies until the CRM migration is applied');
    }

    return this.automaticFollowupColumnExists;
  }

  private async hasCustomerAutomaticFollowupColumn(): Promise<boolean> {
    if (this.customerAutomaticFollowupColumnExists !== undefined) {
      return this.customerAutomaticFollowupColumnExists;
    }

    this.customerAutomaticFollowupColumnExists = await this.prisma.columnExists('customers', 'automaticFollowupEnabled');
    if (!this.customerAutomaticFollowupColumnExists) {
      this.logger.warn('customers.automaticFollowupEnabled column is missing; customer-level automatic follow-up toggles are ignored until the CRM migration is applied');
    }

    return this.customerAutomaticFollowupColumnExists;
  }

  private async hasFollowupAttemptsTable(): Promise<boolean> {
    if (this.followupAttemptsTableExists !== undefined) {
      return this.followupAttemptsTableExists;
    }

    this.followupAttemptsTableExists = await this.prisma.tableExists('followup_attempts');
    if (!this.followupAttemptsTableExists) {
      this.logger.warn('followup_attempts table is missing; duplicate suppression and follow-up audit persistence are disabled until the CRM migration is applied');
    }

    return this.followupAttemptsTableExists;
  }

  private async hasFinanceQuoteTable(): Promise<boolean> {
    if (this.financeQuoteTableExists !== undefined) {
      return this.financeQuoteTableExists;
    }

    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'finance'
              AND table_name = 'Quote'
          ) AS exists
        `,
      );
      this.financeQuoteTableExists = Boolean(rows[0]?.exists);
    } catch (error) {
      this.financeQuoteTableExists = false;
      this.logger.warn(`Unable to check finance.Quote availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!this.financeQuoteTableExists) {
      this.logger.warn('finance.Quote table is unreachable; Quote Follow-up rule is disabled for this run');
    }

    return this.financeQuoteTableExists;
  }

  private async getEnabledCompanyIds(): Promise<string[]> {
    if (!(await this.hasCompaniesTable())) {
      return [];
    }

    const hasToggleColumn = await this.hasAutomaticFollowupColumn();
    const whereClause = hasToggleColumn ? 'WHERE "automaticFollowupEnabled" = TRUE' : '';
    const companiesTable = this.prisma.tableRef('companies');

    const rows = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
        SELECT id
        FROM ${companiesTable}
        ${whereClause}
      `,
    );

    return rows.map((row) => row.id);
  }

  private async loadCustomerCandidates(enabledCompanyIds: string[]): Promise<CustomerCandidate[]> {
    if (enabledCompanyIds.length === 0) return [];
    const hasCustomerToggleColumn = await this.hasCustomerAutomaticFollowupColumn();

    return this.prisma.customer.findMany({
      where: {
        isActive: true,
        ...(hasCustomerToggleColumn && { automaticFollowupEnabled: true }),
        companyId: { in: enabledCompanyIds },
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
        notes: true,
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
            serviceType: true,
          },
        },
        agreements: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 5,
          select: {
            status: true,
            endDate: true,
            value: true,
          },
        },
        equipment: {
          select: {
            installDate: true,
          },
        },
      },
    });
  }

  private async loadLeadCandidates(enabledCompanyIds: string[]): Promise<LeadCandidate[]> {
    const cutoff = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
    if (enabledCompanyIds.length === 0) return [];

    return this.prisma.lead.findMany({
      where: {
        companyId: { in: enabledCompanyIds },
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

  /**
   * Reads the latest non-draft quote per customer from finance-service's schema.
   * Same cross-schema raw-SQL pattern analytics-service already uses (finance."Payment").
   * Guarded: if the finance.Quote table isn't reachable, Quote Follow-up is silently
   * skipped for this run rather than failing the whole agent.
   */
  private async loadLatestQuotesByCustomer(companyIds: string[], customerIds: string[]): Promise<Map<string, QuoteFact>> {
    const result = new Map<string, QuoteFact>();
    if (companyIds.length === 0 || customerIds.length === 0) return result;
    if (!(await this.hasFinanceQuoteTable())) return result;

    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ customerId: string; status: string; total: unknown; sentAt: Date | null }>>(
        `
          SELECT DISTINCT ON ("customerId") "customerId", "status"::text AS status, "total", "sentAt"
          FROM finance."Quote"
          WHERE "companyId" = ANY($1::text[])
            AND "customerId" = ANY($2::text[])
            AND "status" != 'DRAFT'
          ORDER BY "customerId", "sentAt" DESC NULLS LAST
        `,
        companyIds,
        customerIds,
      );

      for (const row of rows) {
        result.set(row.customerId, {
          status: row.status,
          value: row.total !== null ? Number(row.total) : null,
          sentAt: row.sentAt,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to load quotes for follow-up decisioning: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async runForCustomer(companyId: string, customerId: string): Promise<{ queued: boolean; action?: string; reason?: string }> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, isActive: true },
      select: {
        id: true, companyId: true, firstName: true, lastName: true,
        email: true, phone: true, mobile: true, notes: true, createdAt: true, updatedAt: true, engagementStatus: true,
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CONVERTED'] } },
          orderBy: { preferredDate: 'desc' },
          take: 24,
          select: { preferredDate: true, status: true, serviceType: true },
        },
        agreements: { orderBy: { updatedAt: 'desc' }, take: 5, select: { status: true, endDate: true, value: true } },
        equipment: { select: { installDate: true } },
      },
    });

    if (!customer) {
      return { queued: false, reason: 'Customer not found or inactive' };
    }

    const quotesByCustomerId = await this.loadLatestQuotesByCustomer([companyId], [customer.id]);
    const result = await this.processCustomer(customer, quotesByCustomerId.get(customer.id));

    if (result === 'skipped') {
      return { queued: false, reason: 'No follow-up action needed at this time' };
    }
    if (result === 'failures') {
      return { queued: false, reason: 'Failed to queue follow-up' };
    }
    return { queued: true };
  }

  async triggerRetentionForCustomer(companyId: string, customerId: string, reason: string): Promise<{ queued: boolean; reason?: string }> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, isActive: true },
      select: { id: true, companyId: true, firstName: true, lastName: true, email: true, phone: true, mobile: true },
    });

    if (!customer) {
      return { queued: false, reason: 'Customer not found' };
    }

    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    if (!recipientPhone && !recipientEmail) {
      return { queued: false, reason: 'No contact channel available' };
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
      action: 'RETENTION',
      reason,
      triggeredAt: new Date().toISOString(),
    };

    await this.createAttempt({ attemptId, payload, entityType: 'customer', entityId: customer.id, customerId: customer.id, leadId: null, decisionAudit: null });

    try {
      const jobId = await this.followupProducer.enqueueFollowup(payload);
      await this.markAttemptQueued(attemptId, jobId);
      await this.logAnalyticsEvent(payload);
      return { queued: true };
    } catch (error) {
      await this.markAttemptFailed(attemptId, error instanceof Error ? error.message : 'Unknown error');
      return { queued: false, reason: error instanceof Error ? error.message : 'Failed to queue retention action' };
    }
  }

  private async processCustomer(customer: CustomerCandidate, quote: QuoteFact | undefined): Promise<keyof FollowupRunSummary> {
    if (await this.hasRecentFollowup(customer.companyId, 'customer', customer.id)) {
      return 'skipped';
    }

    const recipientPhone = customer.mobile ?? customer.phone;
    const recipientEmail = customer.email;

    if (!recipientPhone && !recipientEmail) {
      this.logger.warn(`Skipping customer ${customer.id}; no contact channel available`);
      return 'skipped';
    }

    const daysSinceLastService = this.computeDaysSinceLastService(customer.bookings, customer.updatedAt);
    const previousFollowupAttempts = await this.countFollowupAttempts(customer.companyId, 'customer', customer.id);
    const latestAgreement = customer.agreements[0];

    const decision = await this.decisionService.decide({
      entityType: 'customer',
      entityId: customer.id,
      companyId: customer.companyId,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      automaticFollowupEnabled: true, // candidate query already filtered on this when the column exists
      previousFollowupAttempts,
      recentFollowupExists: false, // hasRecentFollowup already gated above
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      quoteStatus: quote?.status,
      quoteValue: quote?.value ?? undefined,
      daysSinceQuoteSent: quote?.sentAt ? this.computeDaysBetween(quote.sentAt, new Date()) : undefined,
      daysSinceLastService,
      engagementStatus: customer.engagementStatus,
      agreementStatus: latestAgreement?.status,
      agreementEndDate: latestAgreement?.endDate ? latestAgreement.endDate.toISOString() : null,
      equipmentAge: this.computeOldestEquipmentAgeYears(customer.equipment),
      recentServiceHistory: this.buildRecentServiceHistory(customer.bookings),
      averageMonthlySpend: this.computeAverageMonthlySpend(customer.agreements),
      notes: customer.notes ?? undefined,
    } satisfies FollowupDecisionRequest);

    if (!decision) {
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
      action: decision.action,
      reason: decision.reason,
      triggeredAt: new Date().toISOString(),
      recommendedMessage: decision.finalMessage ?? undefined,
      recommendedChannel: decision.finalChannel,
      scheduledFor: decision.scheduledFor ?? undefined,
      llmConfidence: decision.llmConfidence ?? undefined,
    };

    await this.createAttempt({
      attemptId,
      payload,
      entityType: 'customer',
      entityId: customer.id,
      customerId: customer.id,
      leadId: null,
      decisionAudit: decision.audit,
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

    const previousFollowupAttempts = await this.countFollowupAttempts(lead.companyId, 'lead', lead.id);

    const decision = await this.decisionService.decide({
      entityType: 'lead',
      entityId: lead.id,
      companyId: lead.companyId,
      name: `${lead.firstName} ${lead.lastName}`.trim(),
      automaticFollowupEnabled: true, // leads have no per-lead toggle today
      previousFollowupAttempts,
      recentFollowupExists: false,
      recipientPhone: recipientPhone ?? undefined,
      recipientEmail: recipientEmail ?? undefined,
      leadStatus: lead.status,
      daysSinceLeadCreated: this.computeDaysBetween(lead.createdAt, new Date()),
      recentServiceHistory: [],
      averageMonthlySpend: 0,
    } satisfies FollowupDecisionRequest);

    if (!decision) {
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
      action: decision.action,
      reason: decision.reason,
      triggeredAt: new Date().toISOString(),
      recommendedMessage: decision.finalMessage ?? undefined,
      recommendedChannel: decision.finalChannel,
      scheduledFor: decision.scheduledFor ?? undefined,
      llmConfidence: decision.llmConfidence ?? undefined,
    };

    const attemptId = randomUUID();
    await this.createAttempt({
      attemptId,
      payload,
      entityType: 'lead',
      entityId: lead.id,
      customerId: null,
      leadId: lead.id,
      decisionAudit: decision.audit,
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

  private computeDaysSinceLastService(bookings: Array<{ preferredDate: Date }>, fallbackDate: Date): number {
    const serviceDate = bookings[0]?.preferredDate ?? fallbackDate;
    return this.computeDaysBetween(serviceDate, new Date());
  }

  private computeAverageMonthlySpend(agreements: Array<{ status: string; value: unknown }>): number {
    const annualValue = agreements
      .filter((agreement) => agreement.status === 'ACTIVE')
      .reduce((sum, agreement) => sum + Number(agreement.value ?? 0), 0);
    return annualValue > 0 ? Number((annualValue / 12).toFixed(2)) : 0;
  }

  private computeOldestEquipmentAgeYears(equipment: Array<{ installDate: Date | null }>): number | undefined {
    const ages = equipment
      .filter((item) => item.installDate)
      .map((item) => (Date.now() - item.installDate!.getTime()) / (365 * 24 * 60 * 60 * 1000));

    if (ages.length === 0) return undefined;
    return Number(Math.max(...ages).toFixed(1));
  }

  private buildRecentServiceHistory(bookings: Array<{ preferredDate: Date; serviceType: string }>): string[] {
    return bookings.slice(0, 3).map((booking) => `${booking.serviceType} — ${booking.preferredDate.toISOString().slice(0, 10)}`);
  }

  private computeDaysBetween(start: Date, end: Date): number {
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private async hasRecentFollowup(companyId: string, entityType: EntityType, entityId: string): Promise<boolean> {
    if (!(await this.hasFollowupAttemptsTable())) {
      return false;
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('followup_attempts')}
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

  private async countFollowupAttempts(companyId: string, entityType: EntityType, entityId: string): Promise<number> {
    if (!(await this.hasFollowupAttemptsTable())) {
      return 0;
    }

    const rows = await this.prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
        SELECT COUNT(*)::INT AS count
        FROM ${this.prisma.tableRef('followup_attempts')}
        WHERE company_id = $1
          AND entity_type = $2
          AND entity_id = $3
      `,
      companyId,
      entityType,
      entityId,
    );

    return Number(rows[0]?.count ?? 0);
  }

  private async createAttempt(params: {
    attemptId: string;
    payload: FollowupJobPayload;
    entityType: EntityType;
    entityId: string;
    customerId: string | null;
    leadId: string | null;
    decisionAudit: FollowupDecisionAudit | null;
  }): Promise<void> {
    if (!(await this.hasFollowupAttemptsTable())) {
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `
        INSERT INTO ${this.prisma.tableRef('followup_attempts')} (
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
          NULL,
          NULL,
          $9,
          NULL,
          CAST($10 AS JSONB),
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
      params.payload.reason,
      JSON.stringify({
        recipientName: params.payload.recipientName,
        recipientPhone: params.payload.recipientPhone,
        recipientEmail: params.payload.recipientEmail,
        decision: params.decisionAudit,
      }),
    );
  }

  private async markAttemptQueued(attemptId: string, jobId: string): Promise<void> {
    if (!(await this.hasFollowupAttemptsTable())) {
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `
        UPDATE ${this.prisma.tableRef('followup_attempts')}
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
    if (!(await this.hasFollowupAttemptsTable())) {
      return;
    }

    await this.prisma.$executeRawUnsafe(
      `
        UPDATE ${this.prisma.tableRef('followup_attempts')}
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
