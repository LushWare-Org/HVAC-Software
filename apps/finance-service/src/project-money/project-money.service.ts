import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * A project's money in one place: what it cost so far (expenses, parts used,
 * crew hours), what was invoiced and paid, and how that compares with its
 * budget. Read across schemas like the job estimate backfill, always scoped
 * to the company and the project.
 */

const n = (v: unknown) => Number(v) || 0;
const r2 = (v: number) => Math.round(v * 100) / 100;

export interface MoneyInput {
  project: { name: string; budget: unknown; labourRatePerHour: unknown };
  invoices: { invoiced?: unknown; paid?: unknown; outstanding?: unknown; currency?: string | null };
  expenses: Array<{ category: string; total: unknown }>;
  parts: { cost?: unknown; unpriced?: unknown };
  labour: { hours?: unknown; open?: unknown };
}

export interface ProjectMoney {
  currency: string;
  budget: number | null;
  invoiced: number;
  paid: number;
  outstanding: number;
  costs: {
    expenses: { total: number; byCategory: Record<string, number> };
    parts: { total: number; unpriced: number };
    labour: { hours: number; rate: number | null; total: number; openCheckIns: number };
    total: number;
  };
  profit: number;
  /** Profit as a share of what was invoiced; null before anything is invoiced. */
  marginPct: number | null;
  /** Cost so far as a share of the budget; null without a budget. */
  budgetUsedPct: number | null;
  overBudget: boolean;
  /** Plain sentences about what the figures leave out. */
  notes: string[];
}

export function summarise(i: MoneyInput): ProjectMoney {
  const byCategory: Record<string, number> = {};
  for (const e of i.expenses) byCategory[e.category] = r2((byCategory[e.category] ?? 0) + n(e.total));
  const expenses = r2(Object.values(byCategory).reduce((a, v) => a + v, 0));
  const parts = r2(n(i.parts.cost));
  const unpriced = n(i.parts.unpriced);
  const hours = r2(n(i.labour.hours));
  const rate = i.project.labourRatePerHour == null ? null : n(i.project.labourRatePerHour);
  const labour = rate == null ? 0 : r2(hours * rate);
  const total = r2(expenses + parts + labour);
  const invoiced = r2(n(i.invoices.invoiced));
  const budget = i.project.budget == null ? null : n(i.project.budget);
  const profit = r2(invoiced - total);
  const openCheckIns = n(i.labour.open);

  const notes: string[] = [];
  if (total === 0 && hours === 0) notes.push('No costs recorded yet. Log expenses, take parts from van stock, or check in on visits to track cost.');
  if (rate == null && hours > 0) notes.push(`Set a labour rate on the project to include ${hours} person-hours in cost.`);
  if (unpriced > 0) notes.push(`${unpriced} part${unpriced === 1 ? '' : 's'} used ${unpriced === 1 ? 'has' : 'have'} no cost in inventory, so ${unpriced === 1 ? 'it is' : 'they are'} not counted.`);
  if (openCheckIns > 0) notes.push(`${openCheckIns} visit${openCheckIns === 1 ? ' is' : 's are'} still checked in; ${openCheckIns === 1 ? 'its' : 'their'} hours count once checked out.`);

  return {
    currency: i.invoices.currency || 'USD',
    budget,
    invoiced,
    paid: r2(n(i.invoices.paid)),
    outstanding: r2(n(i.invoices.outstanding)),
    costs: {
      expenses: { total: expenses, byCategory },
      parts: { total: parts, unpriced },
      labour: { hours, rate, total: labour, openCheckIns },
      total,
    },
    profit,
    marginPct: invoiced > 0 ? Math.round((profit / invoiced) * 100) : null,
    budgetUsedPct: budget && budget > 0 ? Math.round((total / budget) * 100) : null,
    overBudget: !!budget && budget > 0 && total > budget,
    notes,
  };
}

/** The project's jobs, for costs recorded against a job rather than the project. */
const PROJECT_JOBS = `SELECT id::text FROM "jobs"."jobs" WHERE "companyId"::text = $1 AND "projectId"::text = $2`;

@Injectable()
export class ProjectMoneyService {
  constructor(private readonly prisma: PrismaService) {}

  private async rows<T>(sql: string, companyId: string, projectId: string): Promise<T[]> {
    return (await this.prisma.$queryRawUnsafe(sql, companyId, projectId)) as T[];
  }

  async forProject(companyId: string, projectId: string): Promise<ProjectMoney> {
    const [project] = await this.rows<MoneyInput['project']>(
      `SELECT name, budget, "labourRatePerHour" FROM "crm"."projects" WHERE "companyId"::text = $1 AND id::text = $2`, companyId, projectId);
    if (!project) throw new NotFoundException('Project not found');

    const [invoices, expenses, parts, labour] = await Promise.all([
      this.rows<MoneyInput['invoices']>(
        `SELECT COALESCE(SUM(total), 0) AS invoiced, COALESCE(SUM("amountPaid"), 0) AS paid,
                COALESCE(SUM("balanceDue"), 0) AS outstanding, MAX(currency) AS currency
           FROM "finance"."Invoice"
          WHERE "companyId"::text = $1 AND "projectId"::text = $2 AND status::text NOT IN ('VOID', 'DRAFT')`, companyId, projectId),
      this.rows<MoneyInput['expenses'][number]>(
        `SELECT e.category::text AS category, COALESCE(SUM(e.amount), 0) AS total
           FROM "finance"."Expense" e
          WHERE e."companyId"::text = $1 AND (e."projectId"::text = $2 OR e."jobId"::text IN (${PROJECT_JOBS}))
          GROUP BY e.category`, companyId, projectId),
      // Parts taken from stock for the project's work orders, at their stock cost.
      this.rows<MoneyInput['parts']>(
        `SELECT COALESCE(SUM(m.quantity * i."unitCost"), 0) AS cost,
                COUNT(*) FILTER (WHERE i."unitCost" IS NULL)::int AS unpriced
           FROM "inventory"."stock_movements" m
           JOIN "inventory"."inventory_items" i ON i.id::text = m."inventoryItemId"::text
           JOIN "jobs"."work_orders" w ON w.id::text = m."referenceId"::text
          WHERE m."companyId"::text = $1 AND m."movementType"::text = 'CONSUME' AND m."referenceType" = 'work_order'
            AND w."jobId"::text IN (${PROJECT_JOBS})`, companyId, projectId),
      // Person-hours: each crew member's own check-in to check-out.
      this.rows<MoneyInput['labour']>(
        `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (w."checkoutAt" - w."checkinAt")) / 3600) FILTER (WHERE w."checkoutAt" IS NOT NULL), 0) AS hours,
                COUNT(*) FILTER (WHERE w."checkoutAt" IS NULL)::int AS open
           FROM "jobs"."work_orders" w
          WHERE w."checkinAt" IS NOT NULL AND w."jobId"::text IN (${PROJECT_JOBS})`, companyId, projectId),
    ]);

    return summarise({ project, invoices: invoices[0] ?? {}, expenses, parts: parts[0] ?? {}, labour: labour[0] ?? {} });
  }
}
