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
} from 'lucide-react'
import { useCustomers, useCustomer } from '../../hooks/useCustomers'
import { useToast } from '../../contexts/ToastContext'
import {
  useHouses, useHouse, useCreateHouse, useUpdateHouse, useAssignOwner,
  useGenerateOwnerAccount, useHouseEquipment, useAddHouseEquipment, useHouseIssues,
  useUpdateIssueStatus, useHouseServiceLog, invalidateHouseServiceLog, prefetchHouseDetail,
  ACCOUNT_STATUS_META, ISSUE_STATUS_META,
  type House, type HouseAccountStatus, type IssueStatus, type HouseEquipment, type HouseIssueReport,
} from './housesApi'
import { fmtDate } from './shared'
import CreateJobModal from '../dispatch/CreateJobModal'
import type { Job } from '../../types/api'
import { useTechnicians } from '../../hooks/useScheduling'
import Avatar from '../../components/Avatar'

// Consistent with every other consumer of this modal app-wide (ProjectDetail,
// DayPlanner, Finance, AgreementDrawer, Topbar).
const JobDetailModal = lazy(() => import('../jobs/JobDetailModal'))

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
  const [error, setError] = useState('')

  const save = async () => {
    if (!label.trim()) { setError('Give this house a name or unit number.'); return }
    try {
      await createHouse.mutateAsync({
        label: label.trim(),
        address: address.trim() || undefined,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not add this house')
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label="Add house" style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">Add a house</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>House / unit *</label>
            <input style={inp} value={label} placeholder="House 12, Lot 4B, Unit 201…" onChange={e => setLabel(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={lbl}>Address</label>
            <input style={inp} value={address} placeholder="Optional — street address or plot number" onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Tags</label>
            <input style={inp} value={tagsInput} placeholder="Comma-separated, e.g. Phase 1, Corner unit" onChange={e => setTagsInput(e.target.value)} />
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0 }}>You can assign an owner and add equipment after creating the house.</p>
          {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
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

type DetailTab = 'overview' | 'equipment' | 'servicelog' | 'issues'

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
  const [tab, setTab] = useState<DetailTab>('overview')

  const house = houseQ.data
  const equipment = equipmentQ.data ?? []
  const issues = issuesQ.data ?? []
  const openIssues = issues.filter(i => i.status !== 'RESOLVED').length

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'equipment', label: 'Equipment', count: equipment.length },
    { key: 'servicelog', label: 'Service log' },
    { key: 'issues', label: 'Issues', count: openIssues || undefined },
  ]

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={house?.label ?? 'House'}
        style={{ width: 720, maxWidth: '100%', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'min(720px, calc(100vh - 48px))' }}
        onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Home size={15} style={{ color: 'var(--blue)' }} /> {house?.label ?? 'Loading…'}
            </div>
            <div className="card-subtitle">{projectName}{house?.address ? ` · ${house.address}` : ''}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
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
              {tab === 'overview' && <OverviewSection house={house} projectId={projectId} />}
              {tab === 'equipment' && <EquipmentSection house={house} equipment={equipment} projectId={projectId} projectName={projectName} />}
              {tab === 'servicelog' && <ServiceLogSection house={house} equipment={equipment} />}
              {tab === 'issues' && <IssuesSection house={house} issues={issues} />}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Overview ──────────────────────────────────────────────────────────────

function OverviewSection({ house, projectId }: { house: House; projectId: string }) {
  const assignOwner = useAssignOwner(projectId)
  const generateAccount = useGenerateOwnerAccount(projectId)
  const updateHouse = useUpdateHouse(projectId)
  const { showSuccess, showError } = useToast()
  const [pickingOwner, setPickingOwner] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const customersQ = useCustomers({ limit: 30, search: customerSearch || undefined })
  const { data: owner } = useCustomer(house.ownerCustomerId ?? '')
  // Which specific candidate is being assigned — shows a spinner on just that row
  // instead of a global "everything is disabled" state with no feedback.
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const generate = async () => {
    try {
      const res = await generateAccount.mutateAsync(house.id)
      showSuccess(res.message, res.alreadyProvisioned ? 'Already has access' : 'Account generated')
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not generate an account', 'Generate account failed')
    }
  }

  const pickOwner = async (c: { id: string; firstName: string; lastName: string }) => {
    setAssigningId(c.id)
    try {
      await assignOwner.mutateAsync({ houseId: house.id, customerId: c.id })
      showSuccess(`${house.label} is now owned by ${c.firstName} ${c.lastName}.`.trim(), 'Owner assigned')
      setPickingOwner(false)
      setCustomerSearch('')
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Could not assign this owner', 'Assign owner failed')
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <input style={{ ...inp, marginBottom: 8 }} value={customerSearch} placeholder="Search customers by name or email…"
              onChange={e => setCustomerSearch(e.target.value)} autoFocus disabled={!!assigningId} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {customersQ.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 2px' }}>
                  <Loader2 size={13} className="animate-spin" style={{ color: 'var(--t3)' }} />
                  <span style={{ fontSize: 12, color: 'var(--t4)' }}>Searching…</span>
                </div>
              ) : (customersQ.data?.data ?? []).map((c: any) => {
                const isAssigning = assigningId === c.id
                return (
                  <button key={c.id} className="btn btn-secondary btn-sm"
                    style={{ justifyContent: 'flex-start', gap: 8, opacity: assigningId && !isAssigning ? 0.5 : 1 }}
                    disabled={!!assigningId}
                    onClick={() => pickOwner(c)}>
                    {isAssigning
                      ? <Loader2 size={12} className="animate-spin" style={{ flexShrink: 0 }} />
                      : <User size={12} style={{ flexShrink: 0, color: 'var(--t4)' }} />}
                    <span>
                      {c.firstName} {c.lastName} {c.email ? `· ${c.email}` : ''}
                      {isAssigning ? ' — assigning…' : ''}
                    </span>
                  </button>
                )
              })}
              {!customersQ.isLoading && customersQ.data?.data?.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--t4)', margin: 0 }}>No matching customers. Add them via Customers first.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '14px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tag size={11} /> Tags &amp; notes
        </p>
        <TagsAndNotesEditor house={house} onSave={(patch) => updateHouse.mutate({ id: house.id, ...patch })} saving={updateHouse.isPending} />
      </div>
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

// ── Equipment ─────────────────────────────────────────────────────────────

function EquipmentSection({ house, equipment, projectId, projectName }: {
  house: House; equipment: HouseEquipment[]
  projectId: string; projectName: string
}) {
  const addEquipment = useAddHouseEquipment(house.id)
  const [showAdd, setShowAdd] = useState(false)
  const [visitFor, setVisitFor] = useState<{ id?: string } | null>(null)
  const [viewing, setViewing] = useState<HouseEquipment | null>(null)

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
            <button key={eq.id} onClick={() => setViewing(eq)} style={{
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

      {showAdd && <AddEquipmentModal onSubmit={(input) => addEquipment.mutate(input, { onSuccess: () => setShowAdd(false) })} onClose={() => setShowAdd(false)} saving={addEquipment.isPending} />}

      {viewing && (
        <EquipmentDetailModal
          equipment={viewing}
          onClose={() => setViewing(null)}
          onServiceVisit={() => { setVisitFor({ id: viewing.id }); setViewing(null) }}
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

function AddEquipmentModal({ onSubmit, onClose, saving }: {
  onSubmit: (input: { type?: string; brand?: string; model?: string; serialNo?: string; installDate?: string; warrantyEnd?: string; notes?: string }) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ type: 'Thermostat', brand: '', model: '', serialNo: '', installDate: '', warrantyEnd: '' })
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }))

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label="Add equipment" style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">Add equipment</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={lbl}>Type</label>
            <input style={inp} value={form.type} placeholder="Thermostat, AC Unit, Heat Pump…" onChange={e => set('type', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Brand</label>
              <input style={inp} value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Model</label>
              <input style={inp} value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={lbl}>Serial number</label>
            <input style={inp} value={form.serialNo} onChange={e => set('serialNo', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Install date</label>
              <input type="date" style={inp} value={form.installDate} onChange={e => set('installDate', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Warranty end</label>
              <input type="date" style={inp} value={form.warrantyEnd} onChange={e => set('warrantyEnd', e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => onSubmit({
            type: form.type.trim() || undefined, brand: form.brand.trim() || undefined, model: form.model.trim() || undefined,
            serialNo: form.serialNo.trim() || undefined, installDate: form.installDate || undefined, warrantyEnd: form.warrantyEnd || undefined,
          })}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function EquipmentDetailModal({ equipment, onClose, onServiceVisit }: {
  equipment: HouseEquipment
  onClose: () => void
  onServiceVisit: () => void
}) {
  const rows: [string, string | null | undefined][] = [
    ['Brand', equipment.brand],
    ['Model', equipment.model],
    ['Serial number', equipment.serialNo],
    ['Install date', equipment.installDate ? fmtDate(equipment.installDate) : null],
    ['Warranty end', equipment.warrantyEnd ? fmtDate(equipment.warrantyEnd) : null],
  ]

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1002, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card anim-fade-up" role="dialog" aria-modal="true" aria-label={equipment.type} style={{ width: 420, maxWidth: '100%', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wind size={15} style={{ color: 'var(--blue)' }} />
            </span>
            <div className="card-title">{equipment.type}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
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
