import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_SCOPE = 'com.intuit.quickbooks.accounting';

@Injectable()
export class QuickBooksService {
  private readonly logger = new Logger(QuickBooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ── Config helpers ────────────────────────────────────────────────────────

  private get clientId(): string {
    return this.config.get<string>('quickbooks.clientId') ?? '';
  }

  private get clientSecret(): string {
    return this.config.get<string>('quickbooks.clientSecret') ?? '';
  }

  private get redirectUri(): string {
    return this.config.get<string>('quickbooks.redirectUri') ?? '';
  }

  private get environment(): string {
    return this.config.get<string>('quickbooks.environment') ?? 'sandbox';
  }

  private get apiBase(): string {
    return this.environment === 'production'
      ? 'https://quickbooks.api.intuit.com/v3/company'
      : 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  }

  private get basicAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`;
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────

  getAuthUri(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: QB_SCOPE,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      state,
    });
    return `${QB_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, realmId: string, companyId: string): Promise<void> {
    const response = await axios.post(
      QB_TOKEN_URL,
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: this.redirectUri }),
      {
        headers: {
          Authorization: this.basicAuthHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.quickBooksConnection.upsert({
      where: { companyId },
      create: { companyId, realmId, accessToken: access_token, refreshToken: refresh_token, tokenExpiresAt },
      update: { realmId, accessToken: access_token, refreshToken: refresh_token, tokenExpiresAt },
    });

    this.logger.log(`QuickBooks connected for company ${companyId} (realmId: ${realmId})`);
  }

  async getStatus(companyId: string): Promise<{ connected: boolean; realmId?: string; expiresAt?: Date }> {
    const conn = await this.prisma.quickBooksConnection.findUnique({ where: { companyId } });
    if (!conn) return { connected: false };
    return { connected: true, realmId: conn.realmId, expiresAt: conn.tokenExpiresAt };
  }

  async disconnect(companyId: string): Promise<void> {
    await this.prisma.quickBooksConnection.deleteMany({ where: { companyId } });
    await this.prisma.quickBooksCustomerMap.deleteMany({ where: { companyId } });
    this.logger.log(`QuickBooks disconnected for company ${companyId}`);
  }

  // ── Token management ──────────────────────────────────────────────────────

  async getValidToken(companyId: string): Promise<{ token: string; realmId: string } | null> {
    const conn = await this.prisma.quickBooksConnection.findUnique({ where: { companyId } });
    if (!conn) return null;

    // Refresh when fewer than 5 minutes remain
    if (conn.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      return this.refreshToken(conn);
    }

    return { token: conn.accessToken, realmId: conn.realmId };
  }

  private async refreshToken(conn: {
    companyId: string;
    refreshToken: string;
    realmId: string;
  }): Promise<{ token: string; realmId: string }> {
    const response = await axios.post(
      QB_TOKEN_URL,
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: conn.refreshToken }),
      {
        headers: {
          Authorization: this.basicAuthHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.quickBooksConnection.update({
      where: { companyId: conn.companyId },
      data: { accessToken: access_token, refreshToken: refresh_token, tokenExpiresAt },
    });

    this.logger.debug(`QB token refreshed for company ${conn.companyId}`);
    return { token: access_token, realmId: conn.realmId };
  }

  // ── QB API helpers ────────────────────────────────────────────────────────

  private async qbGet<T>(token: string, realmId: string, path: string): Promise<T> {
    const url = `${this.apiBase}/${realmId}/${path}`;
    const response = await axios.get<T>(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return response.data;
  }

  private async qbPost<T>(token: string, realmId: string, path: string, body: object): Promise<T> {
    const url = `${this.apiBase}/${realmId}/${path}`;
    const response = await axios.post<T>(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  }

  // ── Customer sync ─────────────────────────────────────────────────────────

  async findOrCreateQbCustomer(
    token: string,
    realmId: string,
    companyId: string,
    crmCustomerId: string,
    displayName: string,
    email: string,
  ): Promise<string> {
    // Check local mapping first — avoids redundant QB queries
    const existing = await this.prisma.quickBooksCustomerMap.findUnique({
      where: { companyId_crmCustomerId: { companyId, crmCustomerId } },
    });
    if (existing) return existing.qbCustomerId;

    // Look up by email in QB
    const safeEmail = email.replace(/'/g, "\\'");
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${safeEmail}'`;
    const result = await this.qbGet<any>(
      token,
      realmId,
      `query?query=${encodeURIComponent(query)}&minorversion=65`,
    );

    let qbCustomerId: string;

    if (result?.QueryResponse?.Customer?.length > 0) {
      qbCustomerId = result.QueryResponse.Customer[0].Id as string;
    } else {
      const created = await this.qbPost<any>(token, realmId, 'customer?minorversion=65', {
        DisplayName: displayName || email,
        PrimaryEmailAddr: { Address: email },
      });
      qbCustomerId = created.Customer.Id as string;
    }

    await this.prisma.quickBooksCustomerMap.upsert({
      where: { companyId_crmCustomerId: { companyId, crmCustomerId } },
      create: { companyId, crmCustomerId, qbCustomerId },
      update: { qbCustomerId },
    });

    return qbCustomerId;
  }

  // ── Invoice sync ──────────────────────────────────────────────────────────

  async createQbInvoice(
    token: string,
    realmId: string,
    qbCustomerId: string,
    invoice: {
      invoiceNumber: string;
      dueDate?: Date | null;
      taxAmount?: unknown;
      discountAmount?: unknown;
      lineItems: Array<{
        description: string;
        quantity: unknown;
        unitPrice: unknown;
        lineTotal: unknown;
      }>;
    },
  ): Promise<string> {
    const lines: object[] = invoice.lineItems.map((li) => ({
      Amount: Number(li.lineTotal),
      DetailType: 'SalesItemLineDetail',
      Description: li.description,
      SalesItemLineDetail: {
        ItemRef: { value: '1', name: 'Services' },
        Qty: Number(li.quantity),
        UnitPrice: Number(li.unitPrice),
      },
    }));

    const discountAmount = Number(invoice.discountAmount ?? 0);
    if (discountAmount > 0) {
      lines.push({
        Amount: discountAmount,
        DetailType: 'DiscountLineDetail',
        DiscountLineDetail: { PercentBased: false },
      });
    }

    const taxAmount = Number(invoice.taxAmount ?? 0);
    if (taxAmount > 0) {
      lines.push({
        Amount: taxAmount,
        DetailType: 'SalesItemLineDetail',
        Description: 'Tax',
        SalesItemLineDetail: {
          ItemRef: { value: '1', name: 'Services' },
          Qty: 1,
          UnitPrice: taxAmount,
        },
      });
    }

    const body: Record<string, unknown> = {
      Line: lines,
      CustomerRef: { value: qbCustomerId },
      DocNumber: invoice.invoiceNumber,
    };

    if (invoice.dueDate) {
      body['DueDate'] = new Date(invoice.dueDate).toISOString().split('T')[0];
    }

    const result = await this.qbPost<any>(token, realmId, 'invoice?minorversion=65', body);
    return result.Invoice.Id as string;
  }

  async voidQbInvoice(
    token: string,
    realmId: string,
    qbInvoiceId: string,
  ): Promise<void> {
    // Fetch current SyncToken before voiding (QB requires it for updates)
    const result = await this.qbGet<any>(
      token,
      realmId,
      `invoice/${qbInvoiceId}?minorversion=65`,
    );
    const syncToken = result?.Invoice?.SyncToken;
    if (!syncToken) return;

    await this.qbPost<any>(token, realmId, 'invoice?minorversion=65&operation=void', {
      Id: qbInvoiceId,
      SyncToken: syncToken,
      sparse: true,
    });
  }

  // ── Payment sync ──────────────────────────────────────────────────────────

  async createQbPayment(
    token: string,
    realmId: string,
    qbCustomerId: string,
    qbInvoiceId: string,
    amount: number,
  ): Promise<string> {
    const body = {
      CustomerRef: { value: qbCustomerId },
      TotalAmt: amount,
      Line: [
        {
          Amount: amount,
          LinkedTxn: [{ TxnId: qbInvoiceId, TxnType: 'Invoice' }],
        },
      ],
    };

    const result = await this.qbPost<any>(token, realmId, 'payment?minorversion=65', body);
    return result.Payment.Id as string;
  }
}
