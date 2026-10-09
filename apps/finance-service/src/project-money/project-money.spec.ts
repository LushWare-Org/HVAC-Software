import { NotFoundException } from '@nestjs/common';
import { ProjectMoneyService, summarise } from './project-money.service';

const base = {
  project: { name: 'Colombo Mall', budget: '20000', labourRatePerHour: '25' },
  invoices: { invoiced: '9000', paid: '6000', outstanding: '3000', currency: 'USD' },
  expenses: [{ category: 'SUBCONTRACTOR', total: '2500' }, { category: 'FUEL', total: '300.5' }],
  parts: { cost: '1200', unpriced: 2 },
  labour: { hours: '120', open: 1 },
};

describe('summarise', () => {
  it('adds up costs, profit, margin and budget use', () => {
    const m = summarise(base);
    expect(m).toMatchObject({
      currency: 'USD', budget: 20000, invoiced: 9000, paid: 6000, outstanding: 3000,
      costs: {
        expenses: { total: 2800.5, byCategory: { SUBCONTRACTOR: 2500, FUEL: 300.5 } },
        parts: { total: 1200, unpriced: 2 },
        labour: { hours: 120, rate: 25, total: 3000, openCheckIns: 1 },
        total: 7000.5,
      },
      profit: 1999.5, marginPct: 22, budgetUsedPct: 35, overBudget: false,
    });
  });

  it('labour without a rate counts hours only, and says so', () => {
    const m = summarise({ ...base, project: { ...base.project, labourRatePerHour: null } });
    expect(m.costs.labour).toEqual({ hours: 120, rate: null, total: 0, openCheckIns: 1 });
    expect(m.costs.total).toBe(4000.5);
    expect(m.notes).toContain('Set a labour rate on the project to include 120 person-hours in cost.');
  });

  it('flags overspend, and copes with no budget or no invoices', () => {
    expect(summarise({ ...base, project: { ...base.project, budget: '5000' } })).toMatchObject({ budgetUsedPct: 140, overBudget: true });
    const empty = summarise({ project: { name: 'P', budget: null, labourRatePerHour: null }, invoices: {}, expenses: [], parts: {}, labour: {} });
    expect(empty).toMatchObject({ budget: null, invoiced: 0, costs: { total: 0 }, profit: 0, marginPct: null, budgetUsedPct: null, overBudget: false });
  });

  it('says when no cost is recorded yet, so a 100% margin is not taken at face value', () => {
    const m = summarise({ ...base, expenses: [], parts: {}, labour: {} });
    expect(m.notes).toContain('No costs recorded yet. Log expenses, take parts from van stock, or check in on visits to track cost.');
    expect(summarise(base).notes.join(' ')).not.toContain('No costs recorded');
  });

  it('notes parts used without a cost, so the figure is not mistaken for complete', () => {
    expect(summarise(base).notes).toContain('2 parts used have no cost in inventory, so they are not counted.');
  });
});

describe('ProjectMoneyService', () => {
  function prisma(rows: Record<string, unknown[]>) {
    const calls: Array<{ sql: string; values: unknown[] }> = [];
    return {
      calls,
      $queryRawUnsafe: jest.fn(async (sql: string, ...values: unknown[]) => {
        calls.push({ sql, values });
        const key = Object.keys(rows).find((k) => sql.includes(k));
        return key ? rows[key] : [];
      }),
    };
  }

  it('reads every figure scoped to the company and the project', async () => {
    const p = prisma({
      'crm"."projects': [base.project], 'finance"."Invoice': [base.invoices], 'finance"."Expense': base.expenses,
      stock_movements: [base.parts], checkinAt: [base.labour],
    });
    const m = await new ProjectMoneyService(p as any).forProject('co', 'p-mall');
    expect(m.costs.total).toBe(7000.5);
    for (const c of p.calls) expect(c.values.slice(0, 2)).toEqual(['co', 'p-mall']);
    // Expenses count both direct project costs and those on the project's jobs.
    expect(p.calls.find((c) => c.sql.includes('Expense'))!.sql).toMatch(/"projectId"::text = \$2 OR e\."jobId"::text IN/);
  });

  it('404s for a project outside the company', async () => {
    await expect(new ProjectMoneyService(prisma({}) as any).forProject('co', 'nope')).rejects.toThrow(NotFoundException);
  });
});
