/**
 * CompletedLedger — "Completed" sub-view, redesigned per the approved
 * mockup (Completed · A — revenue funnel + statement-style ledger). Same
 * underlying completed-jobs data as the Dispatch board's Completed tab,
 * grouped by date and totalled — only the presentation is new.
 */
import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { formatMoney } from '../../lib/format'

interface CompletedRow {
  job: any
  assignment: any
}

function dayKey(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dd = new Date(d); dd.setHours(0, 0, 0, 0)
  if (dd.getTime() === today.getTime()) return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()} · TODAY`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined }).toUpperCase()
}

export default function CompletedLedger({ rows, onOpen }: { rows: CompletedRow[]; onOpen: (job: any, assignment: any) => void }) {
  const { completed, invoiced, paid, groups } = useMemo((): {
    completed: CompletedRow[]; invoiced: CompletedRow[]; paid: CompletedRow[]
    groups: Array<[string, { rows: CompletedRow[]; total: number }]>
  } => {
    const amountOf = (j: any) => Number(j.finalAmount ?? j.estimatedAmount ?? 0)
    const completed = rows.filter(r => r.job?.status === 'COMPLETED')
    const invoiced = rows.filter(r => r.job?.status === 'INVOICED')
    const paid = rows.filter(r => r.job?.status === 'PAID')

    const byDay = new Map<string, { rows: CompletedRow[]; total: number }>()
    const sorted = [...rows].sort((a, b) => {
      const da = a.job?.completedAt ?? a.job?.updatedAt ?? a.job?.createdAt
      const db = b.job?.completedAt ?? b.job?.updatedAt ?? b.job?.createdAt
      return new Date(db ?? 0).getTime() - new Date(da ?? 0).getTime()
    })
    for (const r of sorted) {
      const at = r.job?.completedAt ?? r.job?.updatedAt ?? r.job?.createdAt
      const key = at ? dayKey(new Date(at)) : 'UNDATED'
      if (!byDay.has(key)) byDay.set(key, { rows: [], total: 0 })
      const g = byDay.get(key)!
      g.rows.push(r)
      g.total += amountOf(r.job)
    }

    return { completed, invoiced, paid, groups: Array.from(byDay.entries()) }
  }, [rows])

  const completedAmt = completed.reduce((s, r) => s + Number(r.job.finalAmount ?? r.job.estimatedAmount ?? 0), 0)
  const invoicedAmt = invoiced.reduce((s, r) => s + Number(r.job.finalAmount ?? r.job.estimatedAmount ?? 0), 0)
  const paidAmt = paid.reduce((s, r) => s + Number(r.job.finalAmount ?? r.job.estimatedAmount ?? 0), 0)
  const totalCompletedValue = completedAmt + invoicedAmt + paidAmt

  const STATUS_TONE: Record<string, { color: string; bg: string }> = {
    COMPLETED: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    INVOICED: { color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
    PAID: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  }

  if (rows.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
        <CheckCircle2 size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#10b981', opacity: 0.4 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>No completed jobs yet</div>
        <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 4 }}>Completed, invoiced, and paid jobs will appear here.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Funnel strip */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <div style={{ flex: 1, background: 'linear-gradient(135deg,#10B981,#059669)', borderRadius: '13px 4px 4px 13px', padding: '16px 20px', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{completed.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 2 }}>{formatMoney(completedAmt, { decimals: 0 })} booked</div>
        </div>
        <div style={{ flex: 0.82, background: 'linear-gradient(135deg,#0891B2,#0e7490)', borderRadius: 4, padding: '16px 20px', color: '#fff', marginLeft: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>Invoiced</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{invoiced.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 2 }}>{formatMoney(invoicedAmt, { decimals: 0 })} billed</div>
        </div>
        <div style={{ flex: 0.62, background: 'linear-gradient(135deg,#7C3AED,#6d28d9)', borderRadius: '4px 13px 13px 4px', padding: '16px 20px', color: '#fff', marginLeft: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>Paid</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{paid.length}</div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 2 }}>{formatMoney(paidAmt, { decimals: 0 })} collected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* Ledger */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.3fr 1fr 0.9fr', gap: 10, padding: '11px 18px', background: 'var(--bg-card-2)', borderBottom: '1px solid var(--bd)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--t4)', textTransform: 'uppercase' }}>
            <span>Job</span><span>Customer</span><span>Technician</span><span>Status</span><span style={{ textAlign: 'right' }}>Amount</span>
          </div>
          <div style={{ maxHeight: 460, overflowY: 'auto' }}>
            {groups.map(([label, g]) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px', background: 'var(--bg-card-2)', borderBottom: '1px solid var(--bd)' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.03em' }}>{label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(g.total, { decimals: 0 })}</span>
                </div>
                {g.rows.map(({ job, assignment }) => {
                  const tone = STATUS_TONE[job.status] ?? STATUS_TONE.COMPLETED
                  const at = job.completedAt ?? job.updatedAt
                  return (
                    <div key={job.id} onClick={() => onOpen(job, assignment)}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1.3fr 1fr 0.9fr', gap: 10, padding: '11px 18px', borderBottom: '1px solid var(--bd)', alignItems: 'center', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }}>{job.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--t4)' }}>{at ? new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                      </div>
                      <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{job.customerName ?? '—'}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{assignment?.technicianName ?? job.assignedToName ?? '—'}</span>
                      <span><span style={{ fontSize: 9, fontWeight: 700, color: tone.color, background: tone.bg, padding: '2px 8px', borderRadius: 8 }}>{job.status}</span></span>
                      <span style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(job.finalAmount ?? job.estimatedAmount ?? 0, { decimals: 0 })}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue summary rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#111827', borderRadius: 14, padding: 16, color: '#fff' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collected</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#34D399', marginTop: 5 }}>{formatMoney(paidAmt, { decimals: 0 })}</div>
            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 4 }}>of {formatMoney(totalCompletedValue, { decimals: 0 })} completed</div>
            <div style={{ height: 6, borderRadius: 99, background: '#1E293B', overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${totalCompletedValue > 0 ? Math.min(100, (paidAmt / totalCompletedValue) * 100) : 0}%`, height: '100%', background: '#34D399' }} />
            </div>
          </div>
          <div className="card" style={{ padding: 15 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Awaiting payment</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--amber)' }}>{formatMoney(invoicedAmt, { decimals: 0 })}</div>
            <div style={{ fontSize: 10.5, color: 'var(--t4)', marginTop: 2 }}>{invoiced.length} invoice{invoiced.length === 1 ? '' : 's'} open</div>
          </div>
          <div className="card" style={{ padding: 15 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Avg ticket</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{formatMoney(rows.length ? totalCompletedValue / rows.length : 0, { decimals: 0 })}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
