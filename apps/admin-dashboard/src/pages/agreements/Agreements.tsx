/**
 * Agreements — service agreement management for dispatchers/admins.
 * List with status filters, visit meters, detail drawer with amendment
 * history, and lifecycle actions (send / renew / cancel).
 */
import { useMemo, useState } from 'react'
import {
  FileSignature, Plus, RefreshCw, Search, AlertCircle,
  CalendarClock, DollarSign, ShieldCheck,
} from 'lucide-react'
import {
  useServiceAgreements, useSendAgreement, useRenewAgreement,
  type Agreement, type AgreementStatus,
} from '../../hooks/useAgreements'
import AgreementEditorModal from './AgreementEditorModal'
import AgreementDrawer from './AgreementDrawer'
import { formatMoney } from '../../lib/format'
import { useToast } from '../../contexts/ToastContext'
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

function Skeleton({ h = 14, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ width: w, height: h, background: 'var(--bg-hover, var(--bg-card-2))', borderRadius: 4 }} />
}

export default function Agreements() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<Agreement | null | 'new'>(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'nextVisit' | 'value' | 'name' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const listQuery = useServiceAgreements({ status: statusFilter, limit: 100 })
  const allQuery = useServiceAgreements({ limit: 100 })
  const rawAgreements = listQuery.data?.data ?? []

  const agreements = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? rawAgreements.filter(a =>
          a.name.toLowerCase().includes(q) ||
          (a.customer && `${a.customer.firstName} ${a.customer.lastName}`.toLowerCase().includes(q)),
        )
      : rawAgreements

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'value') cmp = (Number(a.value) || 0) - (Number(b.value) || 0)
      else if (sortKey === 'nextVisit') {
        const da = a.nextServiceDate ? new Date(a.nextServiceDate).getTime() : Infinity
        const db = b.nextServiceDate ? new Date(b.nextServiceDate).getTime() : Infinity
        cmp = da - db
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [rawAgreements, search, sortKey, sortDir])

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

  const statusCounts = useMemo(() => {
    const all = allQuery.data?.data ?? []
    const counts: Record<string, number> = { ALL: all.length }
    for (const a of all) counts[a.status] = (counts[a.status] ?? 0) + 1
    return counts
  }, [allQuery.data])

  const sendMut = useSendAgreement()
  const renewMut = useRenewAgreement()
  const toast = useToast()

  const selectedAgreements = agreements.filter(a => selectedIds.includes(a.id))
  const canBulkSend = selectedAgreements.some(a => a.status === 'DRAFT' || a.status === 'SENT')
  const canBulkRenew = selectedAgreements.some(a => ['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(a.status))

  const runBulk = (mut: ReturnType<typeof useSendAgreement>, ids: string[], successMsg: string) => {
    ids.forEach(id => mut.mutate(id))
    toast.showSuccess(successMsg)
    setSelectedIds([])
  }

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

      {/* Command bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-search" style={{ minWidth: 220, flex: '0 1 260px' }}>
            <Search size={13} color="var(--t4)" />
            <input
              placeholder="Search agreement or customer…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                className="btn btn-sm"
                style={statusFilter === f.value
                  ? { background: 'var(--blue)', color: 'white', border: '1px solid var(--blue)' }
                  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label} {statusCounts[f.value] != null && <span style={{ opacity: 0.75 }}>({statusCounts[f.value]})</span>}
              </button>
            ))}
          </div>
          <select
            className="select"
            style={{ fontSize: 12, padding: '0 6px', height: 32, lineHeight: '30px', width: 130, fontWeight: 600, marginLeft: 'auto', flexShrink: 0 }}
            value={`${sortKey}:${sortDir}`}
            onChange={e => {
              const [key, dir] = e.target.value.split(':')
              setSortKey(key as typeof sortKey)
              setSortDir(dir as 'asc' | 'desc')
            }}
          >
            <option value="createdAt:desc">Newest</option>
            <option value="createdAt:asc">Oldest</option>
            <option value="nextVisit:asc">Next visit</option>
            <option value="value:desc">Value ↓</option>
            <option value="value:asc">Value ↑</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: 'var(--blue-glow)', border: '1px solid var(--blue)', borderRadius: 'var(--r-md)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{selectedIds.length} selected</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!canBulkSend}
            onClick={() => runBulk(sendMut, selectedAgreements.filter(a => a.status === 'DRAFT' || a.status === 'SENT').map(a => a.id), 'Agreements sent')}
          >
            Send
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!canBulkRenew}
            onClick={() => runBulk(renewMut, selectedAgreements.filter(a => ['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(a.status)).map(a => a.id), 'Renewals drafted')}
          >
            Renew
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIds([])}>Clear</button>
        </div>
      )}

      {/* List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {listQuery.isLoading ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bd)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><Skeleton /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : listQuery.isError ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', color: 'var(--red)', fontSize: 13 }}>
            <AlertCircle size={14} /> Failed to load agreements.
            <button
              onClick={() => listQuery.refetch()}
              style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
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
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                <th style={{ padding: '10px 14px', width: 32 }}>
                  <input
                    type="checkbox"
                    checked={agreements.length > 0 && selectedIds.length === agreements.length}
                    onChange={e => setSelectedIds(e.target.checked ? agreements.map(a => a.id) : [])}
                  />
                </th>
                {(['Agreement', 'Customer', 'Status', 'Visits', 'Next visit', 'Value'] as const).map(h => {
                  const key = h === 'Next visit' ? 'nextVisit' : h === 'Value' ? 'value' : h === 'Agreement' ? 'name' : null
                  return (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--t3)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        cursor: key ? 'pointer' : 'default', userSelect: 'none',
                      }}
                      onClick={key ? () => {
                        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                        else { setSortKey(key as typeof sortKey); setSortDir('asc') }
                      } : undefined}
                    >
                      {h}{key && sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  )
                })}
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
                    <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id))}
                      />
                    </td>
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
          </div>
        )}
      </div>

      {detailId && (
        <AgreementDrawer
          id={detailId}
          variant="modal"
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
