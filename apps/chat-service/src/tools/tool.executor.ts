import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const CRM_URL = process.env.CRM_SERVICE_URL ?? 'http://localhost:3001';
const JOBS_URL = process.env.JOBS_SERVICE_URL ?? 'http://localhost:3002';
const FINANCE_URL = process.env.FINANCE_SERVICE_URL ?? 'http://localhost:3004';
const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL ?? 'http://localhost:3006';

// Dev bypass headers so chat-service can call other services without re-authing
function devHeaders(companyId: string, userId: string, role: string, email: string, customerId?: string) {
  if (process.env.BYPASS_AUTH !== 'true') return {};
  const h: Record<string, string> = {
    'x-test-company-id': companyId,
    'x-test-user-id': userId,
    'x-test-user-role': role,
    'x-test-user-email': email,
  };
  if (customerId) h['x-test-customer-id'] = customerId;
  return h;
}

export interface ExecutionContext {
  companyId: string;
  customerId?: string;
  userId: string;
  role: string;
  email: string;
  token?: string; // JWT for prod auth
}

@Injectable()
export class ToolExecutor {
  private readonly logger = new Logger(ToolExecutor.name);

  async execute(toolName: string, args: Record<string, any>, ctx: ExecutionContext): Promise<string> {
    try {
      const result = await this.dispatch(toolName, args, ctx);
      return JSON.stringify(result);
    } catch (err: any) {
      this.logger.warn(`Tool ${toolName} failed: ${err.message}`);
      return JSON.stringify({ error: 'Data temporarily unavailable', tool: toolName });
    }
  }

  private authHeaders(ctx: ExecutionContext) {
    if (process.env.BYPASS_AUTH === 'true') {
      return devHeaders(ctx.companyId, ctx.userId, ctx.role, ctx.email, ctx.customerId);
    }
    return { Authorization: `Bearer ${ctx.token}` };
  }

  private async dispatch(toolName: string, args: Record<string, any>, ctx: ExecutionContext): Promise<any> {
    const h = this.authHeaders(ctx);

    switch (toolName) {
      // ── Customer tools ─────────────────────────────────────────────────────

      case 'get_my_jobs': {
        const params: Record<string, string> = { customerId: ctx.customerId! };
        if (args.status) params.status = args.status;
        const res = await axios.get(`${JOBS_URL}/jobs`, { params, headers: h });
        const jobs = (res.data?.data ?? res.data ?? []).slice(0, 10);
        return jobs.map((j: any) => ({
          id: j.id,
          type: j.type,
          status: j.status,
          scheduledAt: j.scheduledAt,
          address: j.address,
        }));
      }

      case 'get_my_invoices': {
        const params: Record<string, string> = { customerId: ctx.customerId! };
        if (args.status) params.status = args.status;
        const res = await axios.get(`${FINANCE_URL}/invoices`, { params, headers: h });
        const invoices = (res.data?.data ?? res.data ?? []).slice(0, 10);
        return invoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          status: inv.status,
          total: inv.total,
          balanceDue: inv.balanceDue,
          dueDate: inv.dueDate,
        }));
      }

      case 'get_my_equipment': {
        const res = await axios.get(`${CRM_URL}/customers/${ctx.customerId}/equipment`, { headers: h });
        return (res.data ?? []).map((e: any) => ({
          type: e.type,
          brand: e.brand,
          model: e.model,
          serialNo: e.serialNo,
          installDate: e.installDate,
          warrantyEnd: e.warrantyEnd,
        }));
      }

      case 'get_my_next_appointment': {
        const res = await axios.get(`${JOBS_URL}/jobs`, {
          params: { customerId: ctx.customerId!, status: 'SCHEDULED', limit: 1, sortBy: 'scheduledAt', order: 'asc' },
          headers: h,
        });
        const jobs = res.data?.data ?? res.data ?? [];
        return jobs[0] ?? { message: 'No upcoming appointments found.' };
      }

      // ── Admin tools ────────────────────────────────────────────────────────

      case 'get_revenue_summary': {
        const rangeMap: Record<string, string> = { today: '7d', week: '7d', month: '30d', year: '90d' };
        const range = rangeMap[args.period] ?? '30d';
        const res = await axios.get(`${ANALYTICS_URL}/revenue/series`, { params: { range }, headers: h });
        const series = res.data?.series ?? res.data ?? [];
        const total = series.reduce((sum: number, p: any) => sum + Number(p.revenue ?? 0), 0);
        return { period: args.period, totalRevenue: total.toFixed(2), dataPoints: series.length };
      }

      case 'get_job_stats': {
        const rangeMap: Record<string, string> = { today: '7d', week: '7d', month: '30d' };
        const range = rangeMap[args.range ?? 'month'] ?? '30d';
        const res = await axios.get(`${ANALYTICS_URL}/jobs-analytics/by-status`, { params: { range }, headers: h });
        return res.data;
      }

      case 'get_customer_stats': {
        const res = await axios.get(`${ANALYTICS_URL}/dashboard/kpis`, { headers: h });
        const kpis = res.data;
        return {
          totalCustomers: kpis?.activeCustomers?.value ?? null,
          leadConversionRate: kpis?.leadConversionRate?.formattedValue ?? null,
          outstandingInvoices: kpis?.outstandingInvoices?.value ?? null,
          outstandingInvoicesValue: kpis?.outstandingInvoices?.formattedValue ?? null,
        };
      }

      case 'get_top_technicians': {
        const limit = args.limit ?? 5;
        const res = await axios.get(`${ANALYTICS_URL}/technician-metrics`, { params: { limit }, headers: h });
        return (res.data?.data ?? res.data ?? []).slice(0, limit).map((t: any) => ({
          name: t.name,
          jobsCompleted: t.jobsCompleted,
          rating: t.rating,
          utilization: t.utilization,
        }));
      }

      case 'list_overdue_invoices': {
        const res = await axios.get(`${FINANCE_URL}/invoices`, { params: { status: 'OVERDUE', limit: 20 }, headers: h });
        const invoices = res.data?.data ?? res.data ?? [];
        return invoices.map((inv: any) => ({
          customer: inv.customerName ?? inv.customerId,
          invoiceNumber: inv.invoiceNumber,
          total: inv.total,
          balanceDue: inv.balanceDue,
          dueDate: inv.dueDate,
        }));
      }

      case 'get_new_customers': {
        const days = args.period === 'week' ? 7 : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const res = await axios.get(`${CRM_URL}/customers`, { params: { since, limit: 20, sortBy: 'createdAt' }, headers: h });
        const customers = res.data?.data ?? res.data ?? [];
        return { period: args.period, count: customers.length, customers: customers.slice(0, 10).map((c: any) => ({ name: `${c.firstName} ${c.lastName}`, email: c.email, createdAt: c.createdAt })) };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }
}
