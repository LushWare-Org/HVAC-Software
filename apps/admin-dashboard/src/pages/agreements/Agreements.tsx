/**
 * Agreements — service agreement management for dispatchers/admins.
 * List with status filters, visit meters, detail drawer with amendment
 * history, and lifecycle actions (send / renew / cancel).
 */
import { useMemo, useState } from 'react'
import {
  FileSignature, Plus, Loader2, RefreshCw,
  CalendarClock, DollarSign, ShieldCheck,
} from 'lucide-react'
import {
  useServiceAgreements,
  type Agreement, type AgreementStatus,
} from '../../hooks/useAgreements'
import AgreementEditorModal from './AgreementEditorModal'
import AgreementDrawer from './AgreementDrawer'
import { formatMoney } from '../../lib/format'
import {
  AgreementStatusBadge, VisitMeter, intervalLabel, fmtDate, fmtMoney, daysUntil, STATUS_STYLES,
} from './shared'

const FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SENT', label: 'Awaiting confirmation' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PENDING_RENEWAL', label: 'Pending renewal' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function KpiCard({ label, value, sub, icon: Icon, tone }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; tone: string
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-top">
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: `var(--${tone}-dim, var(--bg-card-2))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color: `var(--${tone})` }} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

export default function Agreements() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<Agreement | null | 'new'>(null)

  const listQuery = useServiceAgreements({ status: statusFilter, limit: 100 })
  const allQuery = useServiceAgreements({ limit: 100 })
  const agreements = listQuery.data?.data ?? []

  const kpis = useMemo(() => {
    const all = allQuery.data?.data ?? []
    const active = all.filter(a => a.status === 'ACTIVE')
    const dueSoon = active.filter(a => {
      const d = daysUntil(a.nextServiceDate)
      return d != null && d <= 30
    })
    const pendingRenewal = all.filter(a => a.status === 'PENDING_RENEWAL')
    const activeValue = active.reduce((sum, a) => sum + (a.value != null ? Number(a.value) : 0), 0)
    return { active: active.length, dueSoon: dueSoon.length, pendingRenewal: pendingRenewal.length, activeValue }
  }, [allQuery.data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          {/* On-canvas header: the page canvas is dark navy in every theme, so this
              text must always be light (var(--t1) is near-black in light theme). */}
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSignature size={20} style={{ color: 'var(--blue)' }} /> Service Agreements
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
            Maintenance plans and contracts — recurring visits are scheduled from these automatically
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditorTarget('new')}>
          <Plus size={13} /> New agreement
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <KpiCard label="Active agreements" value={kpis.active} icon={ShieldCheck} tone="green" />
        <KpiCard label="Visits due in 30 days" value={kpis.dueSoon} icon={CalendarClock} tone="amber" sub="From active plans" />
        <KpiCard label="Pending renewal" value={kpis.pendingRenewal} icon={RefreshCw} tone="blue" />
        <KpiCard label="Active contract value" value={formatMoney(kpis.activeValue, { decimals: 0 })} icon={DollarSign} tone="green" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            className="btn btn-sm"
            style={statusFilter === f.value
              ? { background: 'var(--blue)', color: 'white', border: '1px solid var(--blue)' }
              : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {listQuery.isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} /></div>
        ) : agreements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--t3)' }}>
            <FileSignature size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>
              {statusFilter === 'ALL'
                ? 'No agreements yet. Create the first one to start scheduling recurring service.'
                : `No ${STATUS_STYLES[statusFilter as AgreementStatus]?.label.toLowerCase() ?? statusFilter.toLowerCase()} agreements.`}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                {['Agreement', 'Customer', 'Status', 'Visits', 'Next visit', 'Value'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agreements.map(a => {
                const due = daysUntil(a.nextServiceDate)
                return (
                  <tr
                    key={a.id}
                    style={{ borderBottom: '1px solid var(--bd)', cursor: 'pointer' }}
                    onClick={() => setDetailId(a.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{a.name}</p>
                      {a.serviceType && <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0' }}>{a.serviceType} · {intervalLabel(a)}</p>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>
                      {a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}><AgreementStatusBadge status={a.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      {(a.visitsIncluded != null || a.serviceInterval) ? <VisitMeter agreement={a} /> : <span style={{ color: 'var(--t4)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {a.nextServiceDate ? (
                        <span style={{ color: due != null && due <= 7 ? 'var(--amber)' : 'var(--t2)', fontWeight: due != null && due <= 7 ? 600 : 400 }}>
                          {fmtDate(a.nextServiceDate)}
                          {due != null && due >= 0 && due <= 14 && <span style={{ fontSize: 11, color: 'var(--t4)' }}> · in {due}d</span>}
                        </span>
                      ) : <span style={{ color: 'var(--t4)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--t2)' }}>{fmtMoney(a.value)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {detailId && (
        <AgreementDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          onEdit={a => setEditorTarget(a)}
        />
      )}
      {editorTarget && (
        <AgreementEditorModal
          agreement={editorTarget === 'new' ? null : editorTarget}
          onClose={() => setEditorTarget(null)}
        />
      )}
    </div>
  )
}
