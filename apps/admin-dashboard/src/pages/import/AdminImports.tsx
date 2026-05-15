import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, RefreshCw, RotateCcw, CheckCircle,
  XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Upload, Trash2,
} from 'lucide-react'
import {
  useAdminImportStats,
  useAdminImportCompanies,
  useAdminImportBatches,
  useAdminImportRollback,
  type AdminImportBatch,
  type ImportStatus,
} from '../../hooks/useImport'
import { useAuth } from '../../contexts/AuthContext'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<ImportStatus, { label: string; color: string; Icon: any }> = {
  VALIDATING: { label: 'Validating', color: '#f59e0b', Icon: Clock },
  READY:      { label: 'Ready',      color: '#3b82f6', Icon: Clock },
  IMPORTING:  { label: 'Importing',  color: '#8b5cf6', Icon: RefreshCw },
  DONE:       { label: 'Done',       color: '#10b981', Icon: CheckCircle },
  FAILED:     { label: 'Failed',     color: '#ef4444', Icon: XCircle },
  ROLLED_BACK:{ label: 'Rolled Back',color: '#6b7280', Icon: RotateCcw },
}

function StatusBadge({ status }: { status: ImportStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.FAILED
  const { Icon } = meta
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px',
      borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: meta.color + '18', color: meta.color, border: `1px solid ${meta.color}33`,
    }}>
      <Icon size={11} />
      {meta.label}
    </span>
  )
}

function fmt(n: number) { return n.toLocaleString() }

function fmtDate(d: string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function platformLabel(p: string) {
  return { jobber: 'Jobber', hcp: 'HCP', generic: 'Generic', equipment: 'Equipment' }[p] ?? p
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const { data, isLoading } = useAdminImportStats()
  const cards = [
    { label: 'Total Batches',     value: data?.totalBatches ?? 0,  color: '#3b82f6', icon: BarChart3 },
    { label: 'Records Imported',  value: data?.totalImported ?? 0, color: '#10b981', icon: CheckCircle },
    { label: 'Records Skipped',   value: data?.totalSkipped ?? 0,  color: '#f59e0b', icon: AlertTriangle },
    { label: 'Records Failed',    value: data?.totalFailed ?? 0,   color: '#ef4444', icon: XCircle },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
      {cards.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--t1)' }}>
                {isLoading ? '—' : fmt(value)}
              </p>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={color} />
            </div>
          </div>
          {data && (
            <div style={{ marginTop: 8 }}>
              {Object.entries(data.byStatus).map(([s, n]) => (
                <span key={s} style={{ fontSize: 11, color: 'var(--t3)', marginRight: 8 }}>
                  {s}: <strong style={{ color: 'var(--t2)' }}>{n}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminImports() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [confirmRollback, setConfirmRollback] = useState<AdminImportBatch | null>(null)

  const companiesQ  = useAdminImportCompanies()
  const batchesQ    = useAdminImportBatches(page, selectedCompany || undefined)
  const rollbackMut = useAdminImportRollback()

  if (user?.role !== 'super_admin') {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <XCircle size={40} color="#ef4444" style={{ marginBottom: 12 }} />
        <p style={{ color: 'var(--t1)', fontWeight: 600 }}>Super Admin access required</p>
      </div>
    )
  }

  const batches = batchesQ.data?.data ?? []
  const total   = batchesQ.data?.total ?? 0
  const pages   = Math.ceil(total / 20)

  async function doRollback() {
    if (!confirmRollback) return
    await rollbackMut.mutateAsync(confirmRollback.id)
    setConfirmRollback(null)
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <button
          onClick={() => navigate('/import')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--t3)', fontSize: 13, padding: 0,
          }}
        >
          <ChevronLeft size={16} /> Back to Import
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
            White-Glove Import Panel
          </h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>
            Super-admin view — all companies, all imports, rollback any batch
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginTop: 28 }}>
        <StatsRow />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={15} color="var(--t3)" />
          <select
            className="form-input"
            style={{ minWidth: 220, height: 36, fontSize: 13 }}
            value={selectedCompany}
            onChange={e => { setSelectedCompany(e.target.value); setPage(1) }}
          >
            <option value="">All Companies</option>
            {(companiesQ.data ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-secondary"
          style={{ height: 36, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          onClick={() => batchesQ.refetch()}
        >
          <RefreshCw size={13} /> Refresh
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--t3)' }}>
          {total} batch{total !== 1 ? 'es' : ''} total
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--bd)' }}>
              {['Company', 'Source', 'Status', 'Rows', 'Imported', 'Skipped', 'Failed', 'Created', 'By', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: 'var(--t3)', fontWeight: 600, fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: 'var(--bg-surface)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batchesQ.isLoading && (
              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>Loading…</td></tr>
            )}
            {!batchesQ.isLoading && batches.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 48, textAlign: 'center' }}>
                  <Upload size={32} color="var(--t4)" style={{ marginBottom: 8 }} />
                  <p style={{ color: 'var(--t3)', margin: 0 }}>No import batches yet</p>
                </td>
              </tr>
            )}
            {batches.map((b, i) => (
              <tr key={b.id} style={{
                borderBottom: i < batches.length - 1 ? '1px solid var(--bd)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'var(--bg-surface)',
              }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--t1)' }}>
                  {b.companyName}
                  <div style={{ fontSize: 10, color: 'var(--t4)', fontWeight: 400 }}>
                    {b.companyId.slice(0, 8)}…
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    background: 'var(--bg-card-2)', fontSize: 11, fontWeight: 600,
                    color: 'var(--t2)',
                  }}>
                    {platformLabel(b.source)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={b.status} />
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--t2)' }}>{fmt(b.totalRows)}</td>
                <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{fmt(b.imported)}</td>
                <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{fmt(b.skipped)}</td>
                <td style={{ padding: '12px 16px', color: b.failed > 0 ? '#ef4444' : 'var(--t3)' }}>{fmt(b.failed)}</td>
                <td style={{ padding: '12px 16px', color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                  {fmtDate(b.createdAt)}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--t3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.createdBy}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {(b.status === 'DONE' && b.imported > 0) && (
                    <button
                      onClick={() => setConfirmRollback(b)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 6, border: '1px solid #ef444444',
                        background: '#ef444410', color: '#ef4444', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      <Trash2 size={11} /> Rollback
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: '16px', borderTop: '1px solid var(--bd)',
          }}>
            <button
              className="btn btn-secondary"
              style={{ height: 32, padding: '0 12px', fontSize: 12 }}
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--t2)' }}>
              Page {page} of {pages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ height: 32, padding: '0 12px', fontSize: 12 }}
              disabled={page >= pages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Rollback confirmation modal */}
      {confirmRollback && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div className="card" style={{ width: 440, padding: 32 }}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#ef444415',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
                  Rollback Import?
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--t3)', lineHeight: 1.5 }}>
                  This will permanently delete <strong style={{ color: 'var(--t1)' }}>
                    {confirmRollback.imported} record{confirmRollback.imported !== 1 ? 's' : ''}
                  </strong> imported for <strong style={{ color: 'var(--t1)' }}>
                    {confirmRollback.companyName}
                  </strong> on {fmtDate(confirmRollback.createdAt)}.
                  This cannot be undone.
                </p>
              </div>
            </div>

            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: 'var(--bg-surface)', marginBottom: 20,
              fontSize: 12, color: 'var(--t3)',
            }}>
              <strong>Batch:</strong> {confirmRollback.id}<br />
              <strong>Source:</strong> {platformLabel(confirmRollback.source)}<br />
              <strong>Company:</strong> {confirmRollback.companyName}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmRollback(null)}
                disabled={rollbackMut.isPending}
              >
                Cancel
              </button>
              <button
                onClick={doRollback}
                disabled={rollbackMut.isPending}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer', opacity: rollbackMut.isPending ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Trash2 size={13} />
                {rollbackMut.isPending ? 'Rolling back…' : 'Yes, Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
