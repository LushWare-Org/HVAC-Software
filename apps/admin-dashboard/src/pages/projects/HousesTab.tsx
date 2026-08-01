/**
 * HousesTab — the "Housing Scheme" project template's signature surface: a grid of
 * houses, each with an owner, equipment, service history, and issue reports.
 * Spec: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md
 */
import { useEffect, useState, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import {
  Home, Plus, X, Check, Loader2, Wrench, AlertTriangle, Mail,
  MapPin, Tag, User, Wind, CalendarClock, ShieldCheck, MessageSquareWarning, ChevronRight,
  Image as ImageIcon, RefreshCw, Sparkles, UserCheck, Trash2, FileSignature, Receipt, FileText,
} from 'lucide-react'
import { useCustomer } from '../../hooks/useCustomers'
import { useToast } from '../../contexts/ToastContext'
import {
  useHouses, useHouse, useCreateHouse, useUpdateHouse, useAssignOwner, useDeleteHouse,
  useGenerateOwnerAccount, useHouseEquipment, useAddHouseEquipment, useHouseIssues,
  useUpdateIssueStatus, useHouseServiceLog, invalidateHouseServiceLog, prefetchHouseDetail,
  useUploadEquipmentImage, useAddErrorCode, useDeleteErrorCode, useUpdateHouseEquipment,
  ACCOUNT_STATUS_META, ISSUE_STATUS_META,
  type House, type HouseAccountStatus, type IssueStatus, type HouseEquipment, type HouseIssueReport,
} from './housesApi'
import { fmtDate } from './shared'
import { SectionLabel, AgreementStatusBadge, fmtMoney as fmtAgreementMoney } from '../agreements/shared'
import { useServiceAgreements, type Agreement } from '../../hooks/useAgreements'
import { useQuotes, useInvoices } from '../../hooks/useFinance'
import AgreementEditorModal from '../agreements/AgreementEditorModal'
import AddQuoteModal from '../finance/AddQuoteModal'
import AddInvoiceModal from '../finance/AddInvoiceModal'
import CreateJobModal from '../dispatch/CreateJobModal'
import type { Job } from '../../types/api'
import { useTechnicians } from '../../hooks/useScheduling'
import Avatar from '../../components/Avatar'
import CustomerPickerWithCreate, { type PickedCustomer } from '../../components/CustomerPickerWithCreate'

// Consistent with every other consumer of this modal app-wide (ProjectDetail,
// DayPlanner, Finance, AgreementDrawer, Topbar).
const JobDetailModal = lazy(() => import('../jobs/JobDetailModal'))

// Matches AgreementEditorModal's card language — the design being standardized
// across every modal in the app, starting here and in Projects/Equipment next.
const sectionCardStyle: React.CSSProperties = {
  padding: 16, borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
  display: 'flex', flexDirection: 'column', gap: 12,
}
const fieldRowStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: 6,
}

function AccountStatusBadge({ status }: { status: HouseAccountStatus }) {
  const m = ACCOUNT_STATUS_META[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
      padding: '2px 8px', borderRadius: 999, background: m.dim, color: m.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const m = ISSUE_STATUS_META[status]
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: m.dim, color: m.color }}>{m.label}</span>
}

// ── Tab entry point ──────────────────────────────────────────────────────────

export default function HousesTab({ projectId, projectName, initialOpenHouseId, onInitialHouseConsumed }: {
  projectId: string
  projectName: string
  /** Deep-link from an alert row — opens this house's detail modal on mount. */
  initialOpenHouseId?: string | null
  onInitialHouseConsumed?: () => void
}) {
  const housesQ = useHouses(projectId)
  const houses = housesQ.data ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [openHouseId, setOpenHouseId] = useState<string | null>(initialOpenHouseId ?? null)

  useEffect(() => {
    if (initialOpenHouseId) {
      setOpenHouseId(initialOpenHouseId)
      onInitialHouseConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenHouseId])

  const totalOpenIssues = houses.reduce((s, h) => s + (h.openIssueCount ?? 0), 0)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Home size={15} style={{ color: 'var(--blue)' }} /> Houses
          </div>
          <div className="card-subtitle">
            Each house has its own owner, equipment, and portal login
            {totalOpenIssues > 0 && (
              <span style={{ color: 'var(--red)', fontWeight: 600 }}> · {totalOpenIssues} open issue{totalOpenIssues === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={12} /> Add house
        </button>
      </div>

      {housesQ.isLoading ? (
        <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : houses.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <Home size={22} style={{ color: 'var(--t4)', marginBottom: 8 }} />
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No houses yet</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>Add the first house to start assigning owners and equipment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, padding: 16 }}>
          {houses.map(h => {
            const hasOpenIssue = (h.openIssueCount ?? 0) > 0
            return (
            <button key={h.id} onClick={() => setOpenHouseId(h.id)} onMouseEnter={() => prefetchHouseDetail(h.id)} onFocus={() => prefetchHouseDetail(h.id)} style={{
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${hasOpenIssue ? 'var(--red)' : 'var(--bd)'}`,
              borderLeft: `3px solid ${hasOpenIssue ? 'var(--red)' : 'var(--bd)'}`,
              background: 'var(--bg-card-2)',
              boxShadow: hasOpenIssue ? '0 0 0 1px var(--red-dim)' : 'none',
              display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{h.label}</span>
                {hasOpenIssue && (
                  <span title={`${h.openIssueCount} open issue${h.openIssueCount === 1 ? '' : 's'}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700,
                      color: 'var(--red)', background: 'var(--red-dim)', padding: '2px 7px', borderRadius: 999,
                    }}>
                    <MessageSquareWarning size={11} /> {h.openIssueCount}
                  </span>
                )}
              </div>
              {h.address && (
                <span style={{ fontSize: 11.5, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={10} /> {h.address}
                </span>
              )}
              <span style={{ fontSize: 12, color: h.ownerName ? 'var(--t2)' : 'var(--t4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={11} /> {h.ownerName ?? 'No owner assigned'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                <AccountStatusBadge status={h.accountStatus} />
                <span style={{ fontSize: 10.5, color: 'var(--t4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Wind size={10} /> {h.equipmentCount ?? 0}
                </span>
              </div>
              {h.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {h.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                      background: 'var(--bg-card)', border: '1px solid var(--bd)', color: 'var(--t3)',
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                    }}>
                      <Tag size={9} /> {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
            )
          })}
        </div>
      )}

      {showAdd && <AddHouseModal projectId={projectId} onClose={() => setShowAdd(false)} />}
      {openHouseId && (
        <HouseDetailModal houseId={openHouseId} projectId={projectId} projectName={projectName} onClose={() => setOpenHouseId(null)} />
      )}
    </div>
  )
}

// ── Add house ─────────────────────────────────────────────────────────────

function AddHouseModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const createHouse = useCreateHouse(projectId)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // ── Owner: either pick an existing customer, or create a brand-new one ──
  const [owner, setOwner] = useState<PickedCustomer | null>(null)

  const save = async () => {
    if (!label.trim()) { setError('Give this house a name or unit number.'); return }
    try {
      await createHouse.mutateAsync({
        label: label.trim(),
        address: address.trim() || undefined,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
        ownerCustomerId: owner?.id,
      })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not add this house')
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card anim-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="Add house"
        style={{
          width: 900, maxWidth: '95vw', padding: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Home size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="card-title">Add a house</div>
              <div className="card-subtitle">Set up the unit, and optionally assign or create its owner</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'var(--red-dim)', borderRadius: 'var(--r-md)', color: 'var(--red)', fontSize: 13,
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* ── House details ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={Home}>House details</SectionLabel>
            <div style={fieldRowStyle}>
              <div className="form-group">
                <label className="form-label">House / unit *</label>
                <input className="form-input" placeholder="House 12, Lot 4B, Unit 201…" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="Optional — street address or plot number" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input className="form-input" placeholder="Comma-separated, e.g. Phase 1, Corner unit" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} placeholder="Gate code, access instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          {/* ── Owner ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={User}>Owner (optional)</SectionLabel>

            {owner ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--green)', background: 'var(--green-dim)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>
                  <UserCheck size={14} style={{ color: 'var(--green)' }} /> {owner.firstName} {owner.lastName}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setOwner(null)}>Remove</button>
              </div>
            ) : (
              <CustomerPickerWithCreate onPick={setOwner} />
            )}
            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>
              {owner ? 'You can change the owner or add equipment after creating the house.' : "Optional — skip this and assign an owner later from the house's Overview tab."}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={createHouse.isPending}>
            {createHouse.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add house
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── House detail ──────────────────────────────────────────────────────────

type DetailTab = 'overview' | 'equipment' | 'servicelog' | 'issues' | 'agreements' | 'billing'

function HouseDetailModal({ houseId, projectId, projectName, onClose }: {
  houseId: string; projectId: string; projectName: string; onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const houseQ = useHouse(houseId)
  const equipmentQ = useHouseEquipment(houseId)
  const issuesQ = useHouseIssues(houseId)
  const deleteHouse = useDeleteHouse(projectId)
  const { showSuccess, showError } = useToast()
  const [tab, setTab] = useState<DetailTab>('overview')

  const handleDelete = () => {
    if (!house) return
    const equipmentNote = (house.equipmentCount ?? 0) > 0
      ? ` Its ${house.equipmentCount} equipment record${house.equipmentCount === 1 ? '' : 's'} will stay on file, unlinked from this house.`
      : ''
    if (!confirm(`Delete ${house.label}? This also removes its issue reports.${equipmentNote}`)) return
    deleteHouse.mutate(houseId, {
      onSuccess: () => { showSuccess(`${house.label} was removed`, 'House deleted'); onClose() },
      onError: (e: any) => showError(e?.response?.data?.message ?? 'Could not delete this house', 'Delete failed'),
    })
  }

  const house = houseQ.data
  const equipment = equipmentQ.data ?? []
  const issues = issuesQ.data ?? []
  const openIssues = issues.filter(i => i.status !== 'RESOLVED').length

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'equipment', label: 'Equipment', count: equipment.length },
    { key: 'servicelog', label: 'Service log' },
    { key: 'issues', label: 'Issues', count: openIssues || undefined },
    { key: 'agreements', label: 'Agreements' },
    { key: 'billing', label: 'Billing' },
  ]

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={house?.label ?? 'House'}
        style={{ width: 980, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'min(840px, calc(100vh - 48px))' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Home size={15} style={{ color: 'var(--blue)' }} /> {house?.label ?? 'Loading…'}
            </div>
            <div className="card-subtitle">{projectName}{house?.address ? ` · ${house.address}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleDelete} disabled={!house || deleteHouse.isPending} aria-label="Delete house" title="Delete house" style={{ color: 'var(--red)' }}>
              {deleteHouse.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', flexShrink: 0 }}>
          {tabs.map(t => {
            const active = tab === t.key
            const isAlertTab = t.key === 'issues' && openIssues > 0
            return (
              <button key={t.key} className="btn btn-sm" onClick={() => setTab(t.key)} style={active
                ? { background: isAlertTab ? 'var(--red)' : 'var(--blue)', color: '#fff', border: `1px solid ${isAlertTab ? 'var(--red)' : 'var(--blue)'}` }
                : isAlertTab
                  ? { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)' }
                  : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                {t.label}{t.count != null ? ` · ${t.count}` : ''}
              </button>
            )
          })}
        </div>

        {openIssues > 0 && tab !== 'issues' && (
          <button onClick={() => setTab('issues')} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: 'calc(100% - 40px)', margin: '10px 20px 0',
            padding: '9px 12px', borderRadius: 9, background: 'var(--red-dim)', border: '1px solid var(--red)',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, textAlign: 'left',
          }}>
            <MessageSquareWarning size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', flex: 1 }}>
              {openIssues} unresolved issue{openIssues === 1 ? '' : 's'} reported on this house — view details
            </span>
            <ChevronRight size={13} style={{ color: 'var(--red)', flexShrink: 0 }} />
          </button>
        )}

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {!house ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} />
            </div>
          ) : (
            <>
              {tab === 'overview' && <OverviewSection house={house} projectId={projectId} equipment={equipment} onViewAllJobs={() => setTab('servicelog')} />}
              {tab === 'equipment' && <EquipmentSection house={house} equipment={equipment} projectId={projectId} projectName={projectName} />}
              {tab === 'servicelog' && <ServiceLogSection house={house} equipment={equipment} />}
              {tab === 'issues' && <IssuesSection house={house} issues={issues} />}
              {tab === 'agreements' && <HouseAgreementsSection house={house} projectId={projectId} />}
              {tab === 'billing' && <HouseBillingSection house={house} projectId={projectId} projectName={projectName} />}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection({ house, projectId, equipment, onViewAllJobs }: {
  house: House; projectId: string; equipment: HouseEquipment[]; onViewAllJobs: () => void
}) {
  const assignOwner = useAssignOwner(projectId)
  const generateAccount = useGenerateOwnerAccount(projectId)
  const updateHouse = useUpdateHouse(projectId)
  const { showSuccess, showError } = useToast()
  const [pickingOwner, setPickingOwner] = useState(false)
  const { data: owner } = useCustomer(house.ownerCustomerId ?? '')
  const [assigning, setAssigning] = useState(false)
  const { jobs, isLoading: jobsLoading } = useHouseServiceLog(house.id, equipment.map(e => e.id))
  const [visitFor, setVisitFor] = useState<{ id?: string } | null>(null)
  const techniciansQuery = useTechnicians()
  const recentJobs = [...jobs]
    .sort((a: any, b: any) => new Date(b.scheduledStart ?? b.createdAt ?? 0).getTime() - new Date(a.scheduledStart ?? a.createdAt ?? 0).getTime())
    .slice(0, 4)

  const generate = async () => {
    try {
      const res = await generateAccount.mutateAsync(house.id)
      showSuccess(res.message, res.alreadyProvisioned ? 'Already has access' : 'Account generated')
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not generate an account', 'Generate account failed')
    }
  }

  const pickOwner = async (c: PickedCustomer) => {
    setAssigning(true)
    try {
      await assignOwner.mutateAsync({ houseId: house.id, customerId: c.id })
      showSuccess(`${house.label} is now owned by ${c.firstName} ${c.lastName}.`.trim(), 'Owner assigned')
      setPickingOwner(false)
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not assign this owner', 'Assign owner failed')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* At-a-glance stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Equipment', value: house.equipmentCount ?? equipment.length, icon: Wind, tone: 'var(--blue)' },
          { label: 'Open issues', value: house.openIssueCount ?? 0, icon: MessageSquareWarning, tone: (house.openIssueCount ?? 0) > 0 ? 'var(--red)' : 'var(--t3)' },
          { label: 'Total visits', value: jobsLoading ? '…' : jobs.length, icon: Wrench, tone: 'var(--t2)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <s.icon size={11} /> {s.label}
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.tone, margin: '4px 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <User size={11} /> Owner
        </p>
        {house.ownerCustomerId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{house.ownerName}</p>
                <p style={{ fontSize: 12, color: 'var(--t4)', margin: '2px 0 0' }}>{house.ownerEmail ?? owner?.email ?? '—'}</p>
              </div>
              <AccountStatusBadge status={house.accountStatus} />
            </div>
            {house.accountStatus === 'NO_ACCOUNT' && (
              <button className="btn btn-primary btn-sm" onClick={generate} disabled={generateAccount.isPending} style={{ alignSelf: 'flex-start' }}>
                {generateAccount.isPending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                {generateAccount.isPending ? 'Generating…' : 'Generate client account'}
              </button>
            )}
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setPickingOwner(v => !v)}>
              Change owner
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '0 0 10px' }}>No owner assigned yet.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => setPickingOwner(v => !v)}>
              <User size={12} /> Assign owner
            </button>
          </div>
        )}

        {pickingOwner && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
            {assigning ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 2px' }}>
                <Loader2 size={13} className="animate-spin" style={{ color: 'var(--t3)' }} />
                <span style={{ fontSize: 12, color: 'var(--t4)' }}>Assigning…</span>
              </div>
            ) : (
              <CustomerPickerWithCreate autoFocus onPick={pickOwner} onCancel={() => setPickingOwner(false)} />
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Wrench size={11} /> Recent jobs
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setVisitFor({})}>
              <Plus size={11} /> New service visit
            </button>
            {jobs.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={onViewAllJobs}>
                View all{jobs.length > 4 ? ` (${jobs.length})` : ''} <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
        {jobsLoading ? (
          <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : recentJobs.length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0, textAlign: 'center', padding: '8px 0' }}>
            No service visits logged for this house yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentJobs.map((j: any) => (
              <div key={j.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
                background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
              }}>
                {j.assignedToName ? (
                  <Avatar name={j.assignedToName} avatarUrl={techniciansQuery.data?.find(t => t.userId === j.assignedToId)?.avatarUrl} size={28} radius={7} fontSize={11} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Wrench size={12} style={{ color: 'var(--t3)' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>
                    {fmtDate(j.scheduledStart)}{j.assignedToName ? ` · ${j.assignedToName}` : ' · Unassigned'}
                  </p>
                </div>
                <span className={`badge ${JOB_BADGE[j.status] ?? 'badge-neutral'}`} style={{ flexShrink: 0 }}>{String(j.status).replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tag size={11} /> Tags &amp; notes
        </p>
        <TagsAndNotesEditor house={house} onSave={(patch) => updateHouse.mutate({ id: house.id, ...patch })} saving={updateHouse.isPending} />
      </div>

      <CreateJobModal
        isOpen={!!visitFor}
        onClose={() => setVisitFor(null)}
        presetCustomer={house.ownerCustomerId ? { id: house.ownerCustomerId, name: house.ownerName ?? 'Owner', address: house.address ?? undefined } : undefined}
        projectId={projectId}
        houseId={house.id}
        contextLabel={house.label}
        onCreated={() => invalidateHouseServiceLog(house.id, projectId)}
      />
    </div>
  )
}

function TagsAndNotesEditor({ house, onSave, saving }: { house: House; onSave: (patch: { tags?: string[]; notes?: string }) => void; saving: boolean }) {
  const [tagsInput, setTagsInput] = useState(house.tags.join(', '))
  const [notes, setNotes] = useState(house.notes ?? '')
  const dirty = tagsInput !== house.tags.join(', ') || notes !== (house.notes ?? '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={lbl}>Tags</label>
        <input style={inp} value={tagsInput} placeholder="Comma-separated" onChange={e => setTagsInput(e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Notes</label>
        <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={notes} placeholder="Gate code, access instructions…" onChange={e => setNotes(e.target.value)} />
      </div>
      {dirty && (
        <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} disabled={saving}
          onClick={() => onSave({ tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean), notes: notes.trim() || undefined })}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
        </button>
      )}
    </div>
  )
}

// ── Agreements ────────────────────────────────────────────────────────────

function HouseAgreementsSection({ house, projectId }: { house: House; projectId: string }) {
  const agreementsQ = useServiceAgreements({ houseId: house.id, limit: 100 })
  const agreements = agreementsQ.data?.data ?? []
  const [showCreate, setShowCreate] = useState(false)

  if (!house.ownerCustomerId) {
    return (
      <div style={{ padding: '28px 16px', textAlign: 'center' }}>
        <AlertTriangle size={18} style={{ color: 'var(--amber)', marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>Assign an owner first</p>
        <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>Agreements belong to the house's owner — set one from the Overview tab.</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div>
          <div className="card-title">Agreements</div>
          <div className="card-subtitle">Recurring maintenance for {house.label}</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Plus size={12} /> Add agreement
        </button>
      </div>

      {agreementsQ.isLoading ? (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : agreements.length === 0 ? (
        <p style={{ padding: '28px 20px', fontSize: 13, color: 'var(--t4)', textAlign: 'center' }}>
          No agreements for this house yet.
        </p>
      ) : (
        <div>
          {agreements.map((a: Agreement) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: '1px solid var(--bd)' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, background: 'var(--green-dim)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileSignature size={14} style={{ color: 'var(--green)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{a.name}</p>
                <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
                  {a.serviceType ?? '—'}{a.nextServiceDate ? ` · next visit ${fmtDate(a.nextServiceDate)}` : ''}
                </p>
              </div>
              {a.billingAmount != null && (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)' }}>{fmtAgreementMoney(a.billingAmount)}</span>
              )}
              <AgreementStatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <AgreementEditorModal
          presetCustomerId={house.ownerCustomerId ?? undefined}
          presetCustomerName={house.ownerName ?? undefined}
          presetProjectId={projectId}
          presetHouseId={house.id}
          onClose={() => setShowCreate(false)}
          onSaved={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

// ── Billing ───────────────────────────────────────────────────────────────

function HouseBillingSection({ house, projectId, projectName }: { house: House; projectId: string; projectName: string }) {
  const quotesQ = useQuotes({ houseId: house.id, limit: 100 })
  const invoicesQ = useInvoices({ houseId: house.id, limit: 100 })
  const quotes = quotesQ.data?.data ?? []
  const invoices = invoicesQ.data?.data ?? []
  const [showCreateQuote, setShowCreateQuote] = useState(false)
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)

  if (!house.ownerCustomerId) {
    return (
      <div style={{ padding: '28px 16px', textAlign: 'center' }}>
        <AlertTriangle size={18} style={{ color: 'var(--amber)', marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>Assign an owner first</p>
        <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>Quotes and invoices belong to the house's owner — set one from the Overview tab.</p>
      </div>
    )
  }

  const presetCustomer = { id: house.ownerCustomerId, name: house.ownerName ?? 'Owner', email: house.ownerEmail ?? undefined }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <HouseBillingList
          title="Quotes" icon={FileText} loading={quotesQ.isLoading}
          docs={quotes.map((q: any) => ({ id: q.id, title: q.title ?? q.quoteNumber, number: q.quoteNumber, date: q.createdAt, total: q.total, status: q.status }))}
          paidStatus="ACCEPTED" actionLabel="New quote" onAction={() => setShowCreateQuote(true)}
        />
        <HouseBillingList
          title="Invoices" icon={Receipt} loading={invoicesQ.isLoading}
          docs={invoices.map((i: any) => ({ id: i.id, title: i.invoiceNumber, number: i.invoiceNumber, date: i.createdAt, total: i.total, status: i.status }))}
          paidStatus="PAID" actionLabel="New invoice" onAction={() => setShowCreateInvoice(true)}
        />
      </div>

      <AddQuoteModal
        isOpen={showCreateQuote}
        onClose={() => setShowCreateQuote(false)}
        presetCustomer={presetCustomer}
        projectId={projectId}
        houseId={house.id}
        contextLabel={`${projectName} — ${house.label}`}
        onCreated={() => { quotesQ.refetch() }}
      />
      <AddInvoiceModal
        isOpen={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        presetCustomer={presetCustomer}
        projectId={projectId}
        houseId={house.id}
        contextLabel={`${projectName} — ${house.label}`}
        onCreated={() => { invoicesQ.refetch() }}
      />
    </div>
  )
}

function HouseBillingList({ title, icon: Icon, loading, docs, paidStatus, actionLabel, onAction }: {
  title: string; icon: typeof FileText; loading: boolean
  docs: { id: string; title: string; number: string; date: string; total: string | number; status: string }[]
  paidStatus: string; actionLabel: string; onAction: () => void
}) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={13} /> {title}
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          <Plus size={12} /> {actionLabel}
        </button>
      </div>
      {loading ? (
        <div style={{ padding: '22px 0', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={15} className="animate-spin" style={{ color: 'var(--t3)' }} />
        </div>
      ) : docs.length === 0 ? (
        <p style={{ padding: '22px 18px', fontSize: 12.5, color: 'var(--t4)', textAlign: 'center' }}>None yet.</p>
      ) : (
        docs.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderTop: '1px solid var(--bd)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
              <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '2px 0 0' }}>{d.number} · {fmtDate(d.date)}</p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{fmtAgreementMoney(d.total)}</span>
            <span className={`badge ${d.status === paidStatus ? 'badge-green' : 'badge-amber'}`}>{d.status}</span>
          </div>
        ))
      )}
    </div>
  )
}

// ── Equipment ─────────────────────────────────────────────────────────────

function EquipmentSection({ house, equipment, projectId, projectName }: {
  house: House; equipment: HouseEquipment[]
  projectId: string; projectName: string
}) {
  const addEquipment = useAddHouseEquipment(house.id)
  const [showAdd, setShowAdd] = useState(false)
  const [visitFor, setVisitFor] = useState<{ id?: string } | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const viewing = equipment.find(e => e.id === viewingId) ?? null

  if (!house.ownerCustomerId) {
    return (
      <div style={{ padding: '28px 16px', textAlign: 'center' }}>
        <AlertTriangle size={18} style={{ color: 'var(--amber)', marginBottom: 8 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>Assign an owner first</p>
        <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>Equipment belongs to the house's owner — set one from the Overview tab.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setVisitFor({})}>
          <Wrench size={12} /> New service visit
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
          <Plus size={12} /> Add equipment
        </button>
      </div>

      {equipment.length === 0 ? (
        <p style={{ padding: '20px 0', fontSize: 12.5, color: 'var(--t4)', textAlign: 'center' }}>No equipment added yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {equipment.map((eq) => (
            <button key={eq.id} onClick={() => setViewingId(eq.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10,
              background: 'var(--bg-card-2)', border: '1px solid var(--bd)', cursor: 'pointer',
              textAlign: 'left', width: '100%', fontFamily: 'inherit',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wind size={14} style={{ color: 'var(--blue)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>
                  {eq.type}{eq.brand ? ` · ${eq.brand}` : ''}{eq.model ? ` ${eq.model}` : ''}
                </p>
                <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {eq.serialNo && <span>SN {eq.serialNo}</span>}
                  {eq.installDate && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><CalendarClock size={10} /> Installed {fmtDate(eq.installDate)}</span>}
                  {eq.warrantyEnd && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><ShieldCheck size={10} /> Warranty to {fmtDate(eq.warrantyEnd)}</span>}
                </p>
              </div>
              <span title="New service visit for this unit" onClick={e => { e.stopPropagation(); setVisitFor({ id: eq.id }) }}
                style={{ padding: 6, borderRadius: 8, display: 'flex' }}>
                <Wrench size={12} style={{ color: 'var(--t4)' }} />
              </span>
              <ChevronRight size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <AddEquipmentModal
          houseId={house.id}
          onSubmit={(input) => addEquipment.mutateAsync(input)}
          onClose={() => setShowAdd(false)}
          saving={addEquipment.isPending}
        />
      )}

      {viewing && (
        <EquipmentDetailModal
          houseId={house.id}
          equipment={viewing}
          onClose={() => setViewingId(null)}
          onServiceVisit={() => { setVisitFor({ id: viewing.id }); setViewingId(null) }}
        />
      )}

      <CreateJobModal
        isOpen={!!visitFor}
        onClose={() => setVisitFor(null)}
        presetCustomer={{ id: house.ownerCustomerId, name: house.ownerName ?? 'Owner', address: house.address ?? undefined }}
        projectId={projectId}
        houseId={house.id}
        equipmentId={visitFor?.id}
        contextLabel={`${projectName} — ${house.label}`}
        onCreated={() => invalidateHouseServiceLog(house.id, projectId)}
      />
    </div>
  )
}

function AddEquipmentModal({ houseId, onSubmit, onClose, saving }: {
  houseId: string
  onSubmit: (input: { type?: string; brand?: string; model?: string; serialNo?: string; installDate?: string; warrantyEnd?: string; notes?: string }) => Promise<{ id: string }>
  onClose: () => void
  saving: boolean
}) {
  const uploadImage = useUploadEquipmentImage(houseId)
  const { showError } = useToast()
  const [form, setForm] = useState({ type: 'Thermostat', brand: '', model: '', serialNo: '', installDate: '', warrantyEnd: '', notes: '' })
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }))

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(file)
    setPhotoPreviewUrl(url => { if (url) URL.revokeObjectURL(url); return URL.createObjectURL(file) })
  }
  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreviewUrl(url => { if (url) URL.revokeObjectURL(url); return null })
  }

  const submit = async () => {
    const created = await onSubmit({
      type: form.type.trim() || undefined, brand: form.brand.trim() || undefined, model: form.model.trim() || undefined,
      serialNo: form.serialNo.trim() || undefined, installDate: form.installDate || undefined, warrantyEnd: form.warrantyEnd || undefined,
      notes: form.notes.trim() || undefined,
    })
    if (photo && created?.id) {
      setUploadingPhoto(true)
      try {
        await uploadImage.mutateAsync({ equipmentId: created.id, file: photo })
      } catch (e: any) {
        showError(e?.response?.data?.message ?? 'Equipment was added, but the photo upload failed', 'Photo upload failed')
      } finally {
        setUploadingPhoto(false)
      }
    }
    onClose()
  }

  const busy = saving || uploadingPhoto

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card anim-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="Add equipment"
        style={{
          width: 640, maxWidth: '95vw', padding: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wind size={16} style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <div className="card-title">Add equipment</div>
              <div className="card-subtitle">Record the unit, and optionally attach a photo for AI-assisted scanning</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Equipment details ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={Wind}>Equipment details</SectionLabel>
            <div style={fieldRowStyle}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <input className="form-input" placeholder="Thermostat, AC Unit, Heat Pump…" value={form.type} onChange={e => set('type', e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-input" value={form.brand} onChange={e => set('brand', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" value={form.model} onChange={e => set('model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Serial number</label>
                <input className="form-input" value={form.serialNo} onChange={e => set('serialNo', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Install date</label>
                <input type="date" className="form-input" value={form.installDate} onChange={e => set('installDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty end</label>
                <input type="date" className="form-input" value={form.warrantyEnd} onChange={e => set('warrantyEnd', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} placeholder="Anything worth noting about this unit…" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          {/* ── Photo (optional) ── */}
          <div style={sectionCardStyle}>
            <SectionLabel icon={ImageIcon}>Photo (optional)</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="Selected equipment photo" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--bd)' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 10, background: 'var(--bg-card-2)', border: '1px dashed var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} style={{ color: 'var(--t4)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', width: 'fit-content' }}>
                  <ImageIcon size={12} /> {photo ? 'Replace photo' : 'Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} style={{ display: 'none' }} />
                </label>
                {photo && (
                  <button className="btn btn-ghost btn-sm" onClick={removePhoto}>Remove</button>
                )}
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>
              Skip this and add a photo later, or attach one now — it'll be uploaded and scanned automatically for brand/model/serial and error codes once the equipment is added.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            {uploadingPhoto ? 'Uploading photo…' : saving ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EquipmentDetailModal({ houseId, equipment, onClose, onServiceVisit }: {
  houseId: string
  equipment: HouseEquipment
  onClose: () => void
  onServiceVisit: () => void
}) {
  const uploadImage = useUploadEquipmentImage(houseId)
  const updateEquipment = useUpdateHouseEquipment(houseId)
  const addErrorCode = useAddErrorCode(houseId)
  const deleteErrorCode = useDeleteErrorCode(houseId)
  const { showSuccess, showError } = useToast()
  const [manualCode, setManualCode] = useState('')
  const [manualMeaning, setManualMeaning] = useState('')

  const rows: [string, string | null | undefined][] = [
    ['Brand', equipment.brand],
    ['Model', equipment.model],
    ['Serial number', equipment.serialNo],
    ['Install date', equipment.installDate ? fmtDate(equipment.installDate) : null],
    ['Warranty end', equipment.warrantyEnd ? fmtDate(equipment.warrantyEnd) : null],
  ]

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadImage.mutate({ equipmentId: equipment.id, file }, {
      onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not upload this photo', 'Upload failed'),
    })
  }

  const suggestion = equipment.imageScanStatus === 'DONE' ? equipment.imageScanResult : null
  const hasNameplateSuggestion = !!(suggestion?.brand || suggestion?.model || suggestion?.serialNo)
  const applySuggestedField = (field: 'brand' | 'model' | 'serialNo', value: string) => {
    updateEquipment.mutate({ equipmentId: equipment.id, [field]: value })
  }
  const applyAllSuggested = () => {
    if (!suggestion) return
    updateEquipment.mutate({
      equipmentId: equipment.id,
      ...(suggestion.brand ? { brand: suggestion.brand } : {}),
      ...(suggestion.model ? { model: suggestion.model } : {}),
      ...(suggestion.serialNo ? { serialNo: suggestion.serialNo } : {}),
    })
  }

  // Per-code status, tracked independently so the UI reflects each code's own
  // request as it resolves — not the batch as a whole. Combined with the cache-patch
  // mutations in housesApi.ts (no full-list refetch per add), this is what makes
  // both "Add" and "Add all" feel instant instead of blocking on a network round-trip.
  const [addedCodes, setAddedCodes] = useState<Set<string>>(new Set())
  const [pendingCodes, setPendingCodes] = useState<Set<string>>(new Set())
  const [failedCodes, setFailedCodes] = useState<Set<string>>(new Set())
  const [addingAllCodes, setAddingAllCodes] = useState(false)

  const pendingSuggestedCodes = suggestion
    ? suggestion.errorCodes.filter(c => !addedCodes.has(c.code) && !equipment.errorCodes.some(e => e.code === c.code))
    : []

  /** Fires the add, updating this one code's status the instant its own request settles. */
  const addOneCode = (code: string, meaning: string) => {
    setPendingCodes(s => new Set(s).add(code))
    setFailedCodes(s => { if (!s.has(code)) return s; const n = new Set(s); n.delete(code); return n })
    return addErrorCode.mutateAsync({ equipmentId: equipment.id, code, meaning, source: 'AI_SCAN' })
      .then(() => { setAddedCodes(s => new Set(s).add(code)) })
      .catch((e) => { setFailedCodes(s => new Set(s).add(code)); throw e })
      .finally(() => { setPendingCodes(s => { const n = new Set(s); n.delete(code); return n }) })
  }

  const addSuggestedCode = (code: string, meaning: string) => {
    addOneCode(code, meaning)
      .then(() => showSuccess(`${code} added`, 'Error code added'))
      .catch((e: any) => showError(e?.response?.data?.message ?? `Could not add ${code}`, 'Add failed'))
  }

  const addAllSuggestedCodes = async () => {
    if (pendingSuggestedCodes.length === 0) return
    setAddingAllCodes(true)
    const results = await Promise.allSettled(pendingSuggestedCodes.map(c => addOneCode(c.code, c.meaning)))
    setAddingAllCodes(false)
    const failedCount = results.filter(r => r.status === 'rejected').length
    if (failedCount === 0) {
      showSuccess(`${results.length} error code${results.length === 1 ? '' : 's'} added`, 'Codes added')
    } else {
      showError(`${failedCount} of ${results.length} error codes could not be added`, 'Add all incomplete')
    }
  }
  const addManualCode = () => {
    if (!manualCode.trim()) return
    const code = manualCode.trim()
    addErrorCode.mutate(
      { equipmentId: equipment.id, code, meaning: manualMeaning.trim() || undefined, source: 'MANUAL' },
      {
        onSuccess: () => { setManualCode(''); setManualMeaning(''); showSuccess(`${code} added`, 'Error code added') },
        onError: (e: any) => showError(e?.response?.data?.message ?? `Could not add ${code}`, 'Add failed'),
      },
    )
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={equipment.type}
        style={{ width: 460, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wind size={15} style={{ color: 'var(--blue)' }} />
            </span>
            <div className="card-title">{equipment.type}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.filter(([, v]) => v).length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '0 0 8px' }}>No further details recorded for this unit.</p>
          ) : rows.map(([label, value]) => value && (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', fontSize: 13, borderTop: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--t3)' }}>{label}</span>
              <span style={{ color: 'var(--t1)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          {equipment.notes && (
            <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--bd)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Notes</p>
              <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{equipment.notes}</p>
            </div>
          )}

          {/* Photo */}
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={12} /> Photo
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {equipment.imageUrl ? (
                <img src={equipment.imageUrl} alt={equipment.type} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--bd)' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--bg-card-2)', border: '1px dashed var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={18} style={{ color: 'var(--t4)' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {equipment.imageScanStatus === 'SCANNING' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--blue)' }}>
                    <Loader2 size={12} className="animate-spin" /> Scanning photo…
                  </span>
                )}
                {equipment.imageScanStatus === 'DONE' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--green)' }}>
                    <Check size={12} /> Scanned
                  </span>
                )}
                {equipment.imageScanStatus === 'FAILED' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--red)' }}>
                    <AlertTriangle size={12} /> Scan failed{equipment.imageScanError ? ` — ${equipment.imageScanError}` : ''}
                  </span>
                )}
                <label className="btn btn-secondary btn-sm" style={{ cursor: uploadImage.isPending ? 'default' : 'pointer', opacity: uploadImage.isPending ? 0.6 : 1, width: 'fit-content' }}>
                  {uploadImage.isPending ? <Loader2 size={12} className="animate-spin" /> : equipment.imageUrl ? <RefreshCw size={12} /> : <ImageIcon size={12} />}
                  {equipment.imageUrl ? ' Replace / retry' : ' Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickFile} disabled={uploadImage.isPending} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>

          {/* AI suggestion — nameplate */}
          {hasNameplateSuggestion && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--blue-dim)', border: '1px solid var(--blue)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> Suggested from photo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(['brand', 'model', 'serialNo'] as const).map(field => suggestion?.[field] && (
                  <div key={field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                      {field === 'serialNo' ? 'Serial' : field[0].toUpperCase() + field.slice(1)}: <strong>{suggestion[field]}</strong>
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => applySuggestedField(field, suggestion[field] as string)} disabled={updateEquipment.isPending}>
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={applyAllSuggested} disabled={updateEquipment.isPending}>
                {updateEquipment.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Apply all
              </button>
            </div>
          )}

          {/* AI suggestion — error codes not yet added */}
          {pendingSuggestedCodes.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--blue-dim)', border: '1px solid var(--blue)' }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} /> Detected error codes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pendingSuggestedCodes.map(c => {
                  const isPending = pendingCodes.has(c.code)
                  const isFailed = failedCodes.has(c.code)
                  return (
                    <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                        <strong>{c.code}</strong>{c.meaning ? ` — ${c.meaning}` : ''}
                        {isFailed && (
                          <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--red)' }}>Failed — try again</span>
                        )}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ minWidth: 56, justifyContent: 'center' }}
                        onClick={() => addSuggestedCode(c.code, c.meaning)}
                        disabled={isPending || addingAllCodes}
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : isFailed ? 'Retry' : 'Add'}
                      </button>
                    </div>
                  )
                })}
              </div>
              {pendingSuggestedCodes.length > 1 && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={addAllSuggestedCodes} disabled={addingAllCodes}>
                  {addingAllCodes ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {addingAllCodes ? `Adding ${pendingCodes.size} of ${pendingSuggestedCodes.length}…` : `Add all (${pendingSuggestedCodes.length})`}
                </button>
              )}
            </div>
          )}

          {/* Persisted error codes */}
          <div style={{ marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--bd)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Error codes</p>
            {equipment.errorCodes.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--t4)', margin: '0 0 10px' }}>No error codes recorded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {equipment.errorCodes.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--t1)' }}>
                      <strong>{c.code}</strong>{c.meaning ? ` — ${c.meaning}` : ''}
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: c.source === 'AI_SCAN' ? 'var(--blue)' : 'var(--t4)' }}>
                        {c.source === 'AI_SCAN' ? 'AI' : 'Manual'}
                      </span>
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteErrorCode.mutate({ equipmentId: equipment.id, codeId: c.id }, {
                      onSuccess: () => showSuccess(`${c.code} removed`, 'Error code removed'),
                      onError: (e: any) => showError(e?.response?.data?.message ?? `Could not remove ${c.code}`, 'Remove failed'),
                    })} disabled={deleteErrorCode.isPending}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <input style={{ ...inp, flex: '0 0 90px' }} value={manualCode} placeholder="Code" onChange={e => setManualCode(e.target.value)} />
              <input style={inp} value={manualMeaning} placeholder="Meaning (optional)" onChange={e => setManualMeaning(e.target.value)} />
              <button className="btn btn-secondary btn-sm" onClick={addManualCode} disabled={!manualCode.trim() || addErrorCode.isPending}>
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={onServiceVisit}>
            <Wrench size={12} /> New service visit
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Service log ───────────────────────────────────────────────────────────

const JOB_BADGE: Record<string, string> = {
  PENDING: 'badge-amber', SCHEDULED: 'badge-violet', EN_ROUTE: 'badge-blue',
  ON_SITE: 'badge-blue', COMPLETED: 'badge-green', INVOICED: 'badge-cyan',
  PAID: 'badge-green', CANCELLED: 'badge-red',
}

function ServiceLogSection({ house, equipment }: { house: House; equipment: HouseEquipment[] }) {
  const { jobs, isLoading } = useHouseServiceLog(house.id, equipment.map(e => e.id))
  const [viewJob, setViewJob] = useState<Job | null>(null)
  const techniciansQuery = useTechnicians()

  if (isLoading) {
    return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Loader2 size={18} className="animate-spin" style={{ color: 'var(--t3)' }} /></div>
  }
  if (jobs.length === 0) {
    return <p style={{ padding: '28px 0', fontSize: 12.5, color: 'var(--t4)', textAlign: 'center' }}>No service visits logged for this house yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {jobs.map((j: any) => (
        <button key={j.id} onClick={() => setViewJob(j as Job)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10,
          background: 'var(--bg-card-2)', border: '1px solid var(--bd)', cursor: 'pointer',
          textAlign: 'left', width: '100%', fontFamily: 'inherit',
        }}>
          {j.assignedToName ? (
            <Avatar
              name={j.assignedToName}
              avatarUrl={techniciansQuery.data?.find(t => t.userId === j.assignedToId)?.avatarUrl}
              size={32}
              radius={8}
              fontSize={12}
            />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wrench size={14} style={{ color: 'var(--t3)' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>{j.title}</p>
            <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
              {fmtDate(j.scheduledStart)}{j.assignedToName ? ` · ${j.assignedToName}` : ' · Unassigned'}
              {j.equipmentId ? ' · unit-specific' : ' · general visit'}
            </p>
          </div>
          <span className={`badge ${JOB_BADGE[j.status] ?? 'badge-neutral'}`}>{String(j.status).replace('_', ' ')}</span>
          <ChevronRight size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
        </button>
      ))}

      {viewJob && (
        <Suspense fallback={null}>
          <JobDetailModal isOpen={!!viewJob} onClose={() => setViewJob(null)} job={viewJob} />
        </Suspense>
      )}
    </div>
  )
}

// ── Issues ────────────────────────────────────────────────────────────────

function IssuesSection({ house, issues }: { house: House; issues: HouseIssueReport[] }) {
  const updateStatus = useUpdateIssueStatus(house.id)

  if (issues.length === 0) {
    return <p style={{ padding: '28px 0', fontSize: 12.5, color: 'var(--t4)', textAlign: 'center' }}>No issues reported by the owner.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {issues.map((i: any) => (
        <div key={i.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
              {i.errorCode ? `Error ${i.errorCode}` : 'Issue reported'}
            </span>
            <IssueStatusBadge status={i.status} />
          </div>
          {i.description && <p style={{ fontSize: 12.5, color: 'var(--t2)', margin: '0 0 8px' }}>{i.description}</p>}
          <p style={{ fontSize: 11, color: 'var(--t4)', margin: '0 0 8px' }}>Reported {fmtDate(i.createdAt)}</p>
          {i.status !== 'RESOLVED' && (
            <div style={{ display: 'flex', gap: 6 }}>
              {i.status === 'OPEN' && (
                <button className="btn btn-secondary btn-sm" disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ issueId: i.id, status: 'ACKNOWLEDGED' })}>
                  Acknowledge
                </button>
              )}
              <button className="btn btn-primary btn-sm" disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ issueId: i.id, status: 'RESOLVED' })}>
                Mark resolved
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
