import { Injectable, Logger } from '@nestjs/common';
import { ServiceClient, unwrapList } from '../../internal/service-client.service';

interface LookupResponse {
  result: 'found' | 'not_found' | 'ambiguous';
  customer?: any;
  matches?: number;
}

export interface CallerProfile {
  result: 'found' | 'not_found' | 'ambiguous';
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    type: string;
    isVip: boolean;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zipCode: string | null;
    customerSince: string | null;
    hasServiceAgreement: boolean;
  };
  summary?: {
    openJobs: number;
    totalJobs: number;
    lastJob: { id: string; type: string | null; status: string; scheduledAt: string | null } | null;
    equipmentCount: number;
    unpaidInvoices: number;
    balanceDue: number;
    openQuotes: number;
    degraded: string[];
  };
  matches?: number;
}

@Injectable()
export class CallersService {
  private readonly logger = new Logger(CallersService.name);

  constructor(private readonly services: ServiceClient) {}

  async lookupByPhone(companyId: string, phone: string): Promise<CallerProfile> {
    const lookup = await this.services.get<LookupResponse>(
      'crm',
      '/customers/lookup/by-phone',
      companyId,
      { phone },
    );
    return this.toProfile(companyId, lookup);
  }

  async matchByNameAndAddress(
    companyId: string,
    body: { firstName: string; lastName: string; address: string; zipCode?: string },
  ): Promise<CallerProfile> {
    const lookup = await this.services.post<LookupResponse>(
      'crm',
      '/customers/lookup/match',
      companyId,
      body,
    );
    return this.toProfile(companyId, lookup);
  }

  private async toProfile(
    companyId: string,
    lookup: LookupResponse,
  ): Promise<CallerProfile> {
    if (lookup.result === 'ambiguous') {
      return { result: 'ambiguous', matches: lookup.matches };
    }
    if (lookup.result !== 'found' || !lookup.customer) {
      return { result: 'not_found' };
    }

    const c = lookup.customer;
    const summary = await this.buildSummary(companyId, c.id);

    return {
      result: 'found',
      customer: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: [c.firstName, c.lastName].filter(Boolean).join(' ').trim(),
        type: c.type,
        isVip: Boolean(c.isVip),
        email: c.email ?? null,
        phone: c.phone ?? c.mobile ?? null,
        address: c.address ?? null,
        city: c.city ?? null,
        zipCode: c.zipCode ?? null,
        customerSince: c.createdAt ?? null,
        hasServiceAgreement: Boolean(c.hasServiceAgreement),
      },
      summary,
    };
  }

  /**
   * Jobs, invoices and quotes in parallel — the caller is waiting, and none of
   * the three depends on another. Each degrades independently.
   */
  private async buildSummary(companyId: string, customerId: string) {
    const degraded: string[] = [];

    const [jobs, invoices, quotes, equipment] = await Promise.all([
      this.services.optional(
        'jobs',
        () => this.services.get('jobs', '/jobs', companyId, { customerId, limit: 50 }),
        null,
      ),
      this.services.optional(
        'invoices',
        () => this.services.get('finance', '/invoices', companyId, { customerId, limit: 50 }),
        null,
      ),
      this.services.optional(
        'quotes',
        () => this.services.get('finance', '/quotes', companyId, { customerId, limit: 50 }),
        null,
      ),
      this.services.optional(
        'equipment',
        () => this.services.get('crm', `/customers/${customerId}/equipment`, companyId),
        null,
      ),
    ]);

    if (jobs === null) degraded.push('jobs');
    if (invoices === null) degraded.push('invoices');
    if (quotes === null) degraded.push('quotes');
    if (equipment === null) degraded.push('equipment');

    const jobList = unwrapList<any>(jobs);
    const invoiceList = unwrapList<any>(invoices);
    const quoteList = unwrapList<any>(quotes);
    const equipmentList = unwrapList<any>(equipment);

    const CLOSED_JOB = new Set(['COMPLETED', 'CANCELLED', 'CLOSED']);
    const openJobs = jobList.filter((j) => !CLOSED_JOB.has(String(j.status).toUpperCase()));

    // DRAFT counts as neither owed nor settled: the customer has never been
    // sent it, so quoting it back to them on a call would be wrong.
    const SETTLED_INVOICE = new Set(['PAID', 'VOID', 'CANCELLED', 'WRITTEN_OFF']);
    const NOT_YET_BILLED = new Set(['DRAFT']);
    const unpaid = invoiceList.filter((i) => {
      const status = String(i.status).toUpperCase();
      return !SETTLED_INVOICE.has(status) && !NOT_YET_BILLED.has(status);
    });

    // Money is Decimal(10,2), serialized as a string — always Number() before
    // arithmetic. Dollars end to end; no cents anywhere.
    const balanceDue = unpaid.reduce(
      (sum, i) => sum + Number(i.balanceDue ?? i.total ?? 0),
      0,
    );

    const OPEN_QUOTE = new Set(['DRAFT', 'SENT', 'PENDING', 'VIEWED']);
    const openQuotes = quoteList.filter((q) =>
      OPEN_QUOTE.has(String(q.status).toUpperCase()),
    );

    const mostRecent = [...jobList].sort((a, b) =>
      String(b.scheduledAt ?? b.createdAt ?? '').localeCompare(
        String(a.scheduledAt ?? a.createdAt ?? ''),
      ),
    )[0];

    return {
      openJobs: openJobs.length,
      totalJobs: jobList.length,
      lastJob: mostRecent
        ? {
            id: mostRecent.id,
            type: mostRecent.type ?? null,
            status: mostRecent.status,
            scheduledAt: mostRecent.scheduledAt ?? null,
          }
        : null,
      equipmentCount: equipmentList.length,
      unpaidInvoices: unpaid.length,
      balanceDue: Math.round(balanceDue * 100) / 100,
      openQuotes: openQuotes.length,
      degraded,
    };
  }
}
