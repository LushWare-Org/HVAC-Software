import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Plus, Info } from 'lucide-react'
import api from '../../lib/api'
import { fmtMoney, ProgressBar } from './shared'

export interface ProjectMoney {
  currency: string
  budget: number | null
  invoiced: number
  paid: number
  outstanding: number
  costs: {
    expenses: { total: number; byCategory: Record<string, number> }
    parts: { total: number; unpriced: number }
    labour: { hours: number; rate: number | null; total: number; openCheckIns: number }
    total: number
  }
  profit: number
  marginPct: number | null
  budgetUsedPct: number | null
  overBudget: boolean
  notes: string[]
}

/** Cost so far, profit and budget use (finance /projects/:id/money). Money roles only: others get nothing. */
export function useProjectMoney(projectId: string) {
  return useQuery<ProjectMoney | null>({
    queryKey: ['projects', projectId, 'money'],
    queryFn: async () => {
      try {
        return (await api.get(`/finance/projects/${projectId}/money`)).data
      } catch (e: any) {
        if (e?.response?.status === 403) return null
        throw e
      }
    },
    staleTime: 60_000,
  })
}

const label = { fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' } as const

/**
 * What the project has cost so far against its budget, where that cost came
 * from, and what it leaves as profit after what was invoiced.
 */
export default function ProjectMoneyCard({ projectId, onAddExpense }: { projectId: string; onAddExpense: () => void }) {
  const { data: m, isLoading, isError } = useProjectMoney(projectId)
  if (m === null) return null
  if (isLoading) return <div className="card" style={{ padding: '14px 18px', fontSize: 12.5, color: 'var(--t4)' }}>Working out costs…</div>
  if (isError || !m) return <div className="card" style={{ padding: '14px 18px', fontSize: 12.5, color: 'var(--t4)' }}>Costs couldn't be loaded just now.</div>

  const pct = m.budgetUsedPct ?? 0
  const barColor = m.overBudget ? 'var(--red)' : pct > 85 ? 'var(--amber)' : 'var(--green)'
  const labour = m.costs.labour
  const parts = [
    { name: 'Expenses', value: m.costs.expenses.total },
    { name: 'Parts used', value: m.costs.parts.total },
    { name: labour.rate != null ? `Labour · ${labour.hours} h at ${fmtMoney(labour.rate)}/h` : `Labour · ${labour.hours} h (no rate set)`, value: labour.total },
  ]

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={label}>Cost &amp; profit</span>
        <button className="btn btn-secondary btn-sm" onClick={onAddExpense}><Plus size={12} /> Add expense</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <div>
          <p style={{ ...label, fontSize: 10.5 }}>Cost so far</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: m.overBudget ? 'var(--red)' : 'var(--t1)', margin: '4px 0 0' }}>{fmtMoney(m.costs.total)}</p>
        </div>
        <div>
          <p style={{ ...label, fontSize: 10.5 }}>Profit</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: m.profit < 0 ? 'var(--red)' : 'var(--green)', margin: '4px 0 0' }}>
            {fmtMoney(m.profit)}
            {m.marginPct != null && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', marginLeft: 6 }}>{m.marginPct}% margin</span>}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: '2px 0 0' }}>Invoiced {fmtMoney(m.invoiced)} less cost</p>
        </div>
      </div>

      {m.budget != null && m.budget > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>Budget used</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: m.overBudget ? 'var(--red)' : 'var(--t1)' }}>
              {fmtMoney(m.costs.total)} of {fmtMoney(m.budget)} ({pct}%)
            </span>
          </div>
          <ProgressBar pct={Math.min(pct, 100)} color={barColor} height={8} />
          {m.overBudget && (
            <p role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--red)', margin: '8px 0 0' }}>
              <AlertTriangle size={13} /> Over budget by {fmtMoney(m.costs.total - m.budget)}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {parts.map(p => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, gap: 8 }}>
            <span style={{ color: 'var(--t2)' }}>{p.name}</span>
            <span style={{ fontWeight: 600, color: 'var(--t1)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(p.value)}</span>
          </div>
        ))}
      </div>

      {m.notes.length > 0 && (
        <ul style={{ margin: 0, padding: '8px 10px', listStyle: 'none', borderRadius: 8, background: 'var(--bg-card-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {m.notes.map(n => (
            <li key={n} style={{ display: 'flex', gap: 6, fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.45 }}>
              <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} /> {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
