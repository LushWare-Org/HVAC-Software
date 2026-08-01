/**
 * MyHouse — hero-card home for a Housing Scheme home owner: equipment, service
 * history, self-service "Add equipment," issue reporting, and the status of
 * any reports already filed. Leads with a hero card (never bare text directly
 * on the page background) so it reads correctly in every theme, matching the
 * pattern established by Dashboard.tsx's "Live Visit" hero.
 */
import { useState } from 'react'
import {
  Home, MapPin, Wind, CalendarClock, ShieldCheck, Wrench,
  AlertTriangle, Send, Loader2, ChevronDown, ChevronUp, ChevronRight, Tag, Plus, X, Check,
  FileSignature, Receipt, FileText,
} from 'lucide-react'
import {
  useMyHouses, useMyHouseEquipment, useMyHouseServiceLog, useMyIssueReports, useReportIssue,
  useAddMyEquipment, type MyHouse as MyHouseType, type MyIssueStatus, type AddMyEquipmentInput,
  type MyHouseEquipment as MyHouseEquipmentType,
} from '../hooks/useMyHouse'
import { useMyAgreements } from '../hooks/useMyAgreements'
import { useMyQuotes, useMyInvoices } from '../hooks/useMyFinance'
import { formatMoney } from '../lib/format'
import BookServiceModal from './jobs/BookServiceModal'

const ISSUE_STATUS_META: Record<MyIssueStatus, { label: string; color: string; dim: string }> = {
  OPEN: { label: 'Open', color: 'var(--red)', dim: 'var(--red-dim)' },
  ACKNOWLEDGED: { label: 'Being looked at', color: 'var(--amber)', dim: 'var(--amber-dim)' },
  RESOLVED: { label: 'Resolved', color: 'var(--green)', dim: 'var(--green-dim)' },
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-card)', color: 'var(--t1)',
  fontFamily: 'inherit', boxSizing: 'border-box',
}
const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'block', marginBottom: 5,
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(String(iso).length === 10 ? `${iso}T12:00:00` : iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const JOB_STATUS_META: Record<string, { label: string; done: boolean }> = {
  PENDING: { label: 'Pending', done: false }, SCHEDULED: { label: 'Scheduled', done: false },
  EN_ROUTE: { label: 'On the way', done: false }, ON_SITE: { label: 'On site', done: false },
  COMPLETED: { label: 'Completed', done: true }, INVOICED: { label: 'Completed', done: true },
  PAID: { label: 'Completed', done: true }, CANCELLED: { label: 'Cancelled', done: false },
}

export default function MyHouse() {
  const { data: houses, isLoading } = useMyHouses()
  const [activeId, setActiveId] = useState<string | null>(null)

  const active = activeId ?? houses?.[0]?.id ?? null

  if (isLoading) {
    return (
      <div style={{ borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)', height: 180, opacity: 0.6 }} />
    )
  }

  if (!houses || houses.length === 0) {
    return (
      <div style={{
        borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
          background: 'var(--bg-card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Home size={20} style={{ color: 'var(--t4)' }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>No house on file yet</p>
        <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: '4px 0 0' }}>
          Once your service company links you to a house, it'll show up here.
        </p>
      </div>
    )
  }

  const house = houses.find(h => h.id === active) ?? houses[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="anim-fade-up">
      {houses.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {houses.map(h => (
            <button key={h.id} onClick={() => setActiveId(h.id)}
              className={`btn btn-sm ${active === h.id ? 'btn-primary' : 'btn-secondary'}`}>
              <Home size={12} /> {h.label}
            </button>
          ))}
        </div>
      )}
      <HouseHero house={house} />
      <HouseSection house={house} />
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────

function HouseHero({ house }: { house: MyHouseType }) {
  const [showReport, setShowReport] = useState(false)
  const [showBook, setShowBook] = useState(false)
  const equipmentQ = useMyHouseEquipment(house.id)

  return (
    <div style={{
      borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)',
      overflow: 'hidden', padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Home size={22} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--blue-dim)', color: 'var(--blue)',
            fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 99, marginBottom: 8,
          }}>
            YOUR HOUSE
          </span>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>{house.label}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--t3)' }}>{house.projectName}</span>
            {house.address && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 500, color: 'var(--t3)' }}>
                <MapPin size={12} /> {house.address}
              </span>
            )}
          </div>
          {house.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
              {house.tags.map(t => (
                <span key={t} style={{
                  fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                  background: 'var(--bg-card-2)', border: '1px solid var(--bd)', color: 'var(--t3)',
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                }}>
                  <Tag size={9} /> {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, whiteSpace: 'nowrap' }}
            onClick={() => setShowBook(true)}>
            <Wrench size={14} /> Book a service
          </button>
          <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700, whiteSpace: 'nowrap' }}
            onClick={() => setShowReport(true)}>
            <AlertTriangle size={14} /> Report an issue
          </button>
        </div>
      </div>

      {showReport && (
        <ReportIssueModal houseId={house.id} equipment={equipmentQ.data} onClose={() => setShowReport(false)} />
      )}

      {showBook && (
        <BookServiceModal
          onClose={() => setShowBook(false)}
          projectId={house.projectId}
          projectName={house.projectName}
          houseId={house.id}
          houseLabel={house.label}
        />
      )}
    </div>
  )
}

// ── Body ──────────────────────────────────────────────────────────────────

function HouseSection({ house }: { house: MyHouseType }) {
  const equipmentQ = useMyHouseEquipment(house.id)
  const serviceLogQ = useMyHouseServiceLog(house.id)
  const issuesQ = useMyIssueReports()
  const addEquipment = useAddMyEquipment(house.id)
  const [showAddEquipment, setShowAddEquipment] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewingEquipment, setViewingEquipment] = useState<MyHouseEquipmentType | null>(null)

  const equipment = equipmentQ.data ?? []
  const myIssues = (issuesQ.data ?? []).filter(i => i.houseId === house.id)
  const openIssues = myIssues.filter(i => i.status !== 'RESOLVED')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Open reports — stays visible until resolved, same visual language as admin's alert */}
      {openIssues.length > 0 && (
        <div style={{
          borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)',
          border: '1px solid var(--bd)', borderLeft: '4px solid var(--red)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 10px' }}>
            <span style={{
              width: 30, height: 30, borderRadius: 9, background: 'var(--red-dim)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={15} style={{ color: 'var(--red)' }} />
            </span>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                {openIssues.length} report{openIssues.length === 1 ? '' : 's'} in progress
              </p>
              <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: '2px 0 0' }}>
                We'll update the status here as your service company looks into it.
              </p>
            </div>
          </div>
          <div>
            {openIssues.map(i => {
              const meta = ISSUE_STATUS_META[i.status]
              return (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', borderTop: '1px solid var(--bd)' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>
                      {i.errorCode ? `Error ${i.errorCode}` : 'Issue reported'}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--t4)' }}> — reported {fmtDate(i.createdAt)}</span>
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: meta.dim, color: meta.color, whiteSpace: 'nowrap' }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Equipment */}
      <div style={{ borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '16px 18px 12px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wind size={12} /> Equipment
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddEquipment(true)}>
            <Plus size={12} /> Add equipment
          </button>
        </div>
        <div style={{ padding: '0 18px 16px' }}>
          {equipment.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>
              Nothing on file yet — add your thermostat or any other unit so we can track it here.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {equipment.map(eq => (
                <button key={eq.id} onClick={() => setViewingEquipment(eq)} style={{
                  padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wind size={12} style={{ color: 'var(--blue)' }} />
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', margin: 0, flex: 1 }}>{eq.type}</p>
                    <ChevronRight size={13} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                  </div>
                  {(eq.brand || eq.model) && (
                    <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 4px' }}>{[eq.brand, eq.model].filter(Boolean).join(' ')}</p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--t4)', margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {eq.installDate && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarClock size={10} /> Installed {fmtDate(eq.installDate)}</span>}
                    {eq.warrantyEnd && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={10} /> Warranty to {fmtDate(eq.warrantyEnd)}</span>}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service history */}
      <div style={{ borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)', overflow: 'hidden' }}>
        <button onClick={() => setHistoryOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
          padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Wrench size={13} style={{ color: 'var(--t3)' }} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service history</span>
          {historyOpen ? <ChevronUp size={15} style={{ color: 'var(--t4)' }} /> : <ChevronDown size={15} style={{ color: 'var(--t4)' }} />}
        </button>
        {historyOpen && (
          <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 18px 16px' }}>
            {serviceLogQ.isLoading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
            ) : (serviceLogQ.data ?? []).length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No visits logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(serviceLogQ.data ?? []).map(j => {
                  const meta = JOB_STATUS_META[j.status] ?? { label: j.status, done: false }
                  return (
                    <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{fmtDate(j.scheduledStart)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', background: meta.done ? 'var(--green-dim)' : 'var(--blue-dim)', color: meta.done ? 'var(--green)' : 'var(--blue)' }}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agreements */}
      <HouseAgreementsSection houseId={house.id} />

      {/* Billing */}
      <HouseBillingSection houseId={house.id} />

      {showAddEquipment && (
        <AddEquipmentModal
          saving={addEquipment.isPending}
          onSubmit={(input) => addEquipment.mutate(input, { onSuccess: () => setShowAddEquipment(false) })}
          onClose={() => setShowAddEquipment(false)}
        />
      )}

      {viewingEquipment && (
        <EquipmentDetailModal equipment={viewingEquipment} onClose={() => setViewingEquipment(null)} />
      )}
    </div>
  )
}

// ── Agreements ────────────────────────────────────────────────────────────

const DOC_STATUS_META: Record<string, { color: string; dim: string }> = {
  DRAFT: { color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  SENT: { color: 'var(--blue)', dim: 'var(--blue-dim)' },
  VIEWED: { color: 'var(--blue)', dim: 'var(--blue-dim)' },
  ACTIVE: { color: 'var(--green)', dim: 'var(--green-dim)' },
  ACCEPTED: { color: 'var(--green)', dim: 'var(--green-dim)' },
  PAID: { color: 'var(--green)', dim: 'var(--green-dim)' },
  PENDING_RENEWAL: { color: 'var(--amber)', dim: 'var(--amber-dim)' },
  PARTIALLY_PAID: { color: 'var(--amber)', dim: 'var(--amber-dim)' },
  OVERDUE: { color: 'var(--red)', dim: 'var(--red-dim)' },
  EXPIRED: { color: 'var(--red)', dim: 'var(--red-dim)' },
  DECLINED: { color: 'var(--red)', dim: 'var(--red-dim)' },
  REJECTED: { color: 'var(--red)', dim: 'var(--red-dim)' },
  CANCELLED: { color: 'var(--red)', dim: 'var(--red-dim)' },
  VOID: { color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  RENEWED: { color: 'var(--t3)', dim: 'var(--bg-card-2)' },
  CONVERTED: { color: 'var(--blue)', dim: 'var(--blue-dim)' },
}

function DocStatusBadge({ status }: { status: string }) {
  const meta = DOC_STATUS_META[status] ?? { color: 'var(--t3)', dim: 'var(--bg-card-2)' }
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap', background: meta.dim, color: meta.color }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function HouseAgreementsSection({ houseId }: { houseId: string }) {
  const [open, setOpen] = useState(false)
  const agreementsQ = useMyAgreements()
  const agreements = (agreementsQ.data?.data ?? []).filter(a => a.houseId === houseId)

  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
        padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <FileSignature size={13} style={{ color: 'var(--t3)' }} />
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Agreements{agreements.length > 0 ? ` · ${agreements.length}` : ''}
        </span>
        {open ? <ChevronUp size={15} style={{ color: 'var(--t4)' }} /> : <ChevronDown size={15} style={{ color: 'var(--t4)' }} />}
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 18px 16px' }}>
          {agreementsQ.isLoading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
          ) : agreements.length === 0 ? (
            <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No agreements for this house yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agreements.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>
                      {a.serviceType ?? '—'}{a.nextServiceDate ? ` · next visit ${fmtDate(a.nextServiceDate)}` : ''}
                    </p>
                  </div>
                  <DocStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Billing ───────────────────────────────────────────────────────────────

function HouseBillingSection({ houseId }: { houseId: string }) {
  const [open, setOpen] = useState(false)
  const quotesQ = useMyQuotes({ houseId, limit: 50 })
  const invoicesQ = useMyInvoices({ houseId, limit: 50 })
  const quotes = quotesQ.data?.data ?? []
  const invoices = invoicesQ.data?.data ?? []
  const total = quotes.length + invoices.length

  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--bd)', background: 'var(--bg-card)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
        padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        <Receipt size={13} style={{ color: 'var(--t3)' }} />
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Billing{total > 0 ? ` · ${total}` : ''}
        </span>
        {open ? <ChevronUp size={15} style={{ color: 'var(--t4)' }} /> : <ChevronDown size={15} style={{ color: 'var(--t4)' }} />}
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={11} /> Quotes
            </p>
            {quotesQ.isLoading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
            ) : quotes.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No quotes yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {quotes.map(q => (
                  <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>{q.quoteNumber}</p>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(Number(q.total ?? 0))}</span>
                    <DocStatusBadge status={q.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Receipt size={11} /> Invoices
            </p>
            {invoicesQ.isLoading ? (
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--t3)' }} />
            ) : invoices.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No invoices yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {invoices.map(i => (
                  <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.invoiceNumber}</p>
                      <p style={{ fontSize: 11, color: 'var(--t4)', margin: '2px 0 0' }}>{i.dueDate ? `Due ${fmtDate(i.dueDate)}` : ''}</p>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)' }}>{formatMoney(Number(i.total ?? 0))}</span>
                    <DocStatusBadge status={i.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Equipment detail (view-only) ─────────────────────────────────────────

function EquipmentDetailModal({ equipment, onClose }: { equipment: MyHouseEquipmentType; onClose: () => void }) {
  const rows: [string, string | null | undefined][] = [
    ['Brand', equipment.brand],
    ['Model', equipment.model],
    ['Serial number', equipment.serialNo],
    ['Install date', equipment.installDate ? fmtDate(equipment.installDate) : null],
    ['Warranty end', equipment.warrantyEnd ? fmtDate(equipment.warrantyEnd) : null],
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card" role="dialog" aria-modal="true" aria-label={equipment.type} style={{ width: 400, maxWidth: '100%', padding: '18px 20px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wind size={15} style={{ color: 'var(--blue)' }} />
          </span>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0, flex: 1 }}>{equipment.type}</p>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)' }}><X size={16} /></button>
        </div>
        {rows.filter(([, v]) => v).length === 0 ? (
          <p style={{ fontSize: 12.5, color: 'var(--t4)', margin: 0 }}>No further details recorded for this unit.</p>
        ) : rows.map(([label, value]) => value && (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', fontSize: 13, borderTop: '1px solid var(--bd)' }}>
            <span style={{ color: 'var(--t3)' }}>{label}</span>
            <span style={{ color: 'var(--t1)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Add equipment (customer self-service) ────────────────────────────────

function AddEquipmentModal({ onSubmit, onClose, saving }: {
  onSubmit: (input: AddMyEquipmentInput) => void
  onClose: () => void
  saving: boolean
}) {
  const [form, setForm] = useState({ type: 'Thermostat', brand: '', model: '', serialNo: '', installDate: '' })
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Add equipment" style={{ width: 420, maxWidth: '100%', padding: '18px 20px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Add equipment</p>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 14px' }}>Add a thermostat or any other unit you'd like us to track.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={fieldLabel}>Type</label>
            <input style={fieldStyle} value={form.type} placeholder="Thermostat, AC Unit, Heat Pump…" onChange={e => set('type', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={fieldLabel}>Brand</label>
              <input style={fieldStyle} value={form.brand} onChange={e => set('brand', e.target.value)} />
            </div>
            <div>
              <label style={fieldLabel}>Model</label>
              <input style={fieldStyle} value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={fieldLabel}>Serial number</label>
            <input style={fieldStyle} value={form.serialNo} onChange={e => set('serialNo', e.target.value)} />
          </div>
          <div>
            <label style={fieldLabel}>Install date</label>
            <input type="date" style={fieldStyle} value={form.installDate} onChange={e => set('installDate', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => onSubmit({
            type: form.type.trim() || undefined, brand: form.brand.trim() || undefined, model: form.model.trim() || undefined,
            serialNo: form.serialNo.trim() || undefined, installDate: form.installDate || undefined,
          })}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Report an issue ───────────────────────────────────────────────────────

function ReportIssueModal({ houseId, equipment, onClose }: {
  houseId: string
  equipment: ReturnType<typeof useMyHouseEquipment>['data']
  onClose: () => void
}) {
  const reportIssue = useReportIssue(houseId)
  const [equipmentId, setEquipmentId] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!errorCode.trim() && !description.trim()) {
      setError('Add the error code you see, or describe what\'s happening.')
      return
    }
    setError('')
    try {
      await reportIssue.mutateAsync({
        equipmentId: equipmentId || undefined,
        errorCode: errorCode.trim() || undefined,
        description: description.trim() || undefined,
      })
      setDone(true)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not send this report — try again.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px' }} onClick={onClose}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Report an issue" style={{ width: 420, maxWidth: '100%', padding: '18px 20px' }} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px', background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} style={{ color: 'var(--green)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Report sent</p>
            <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '4px 0 14px' }}>Your service company has been notified and will follow up.</p>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 4px' }}>Report an issue</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', margin: '0 0 14px' }}>
              Seeing an error code on your thermostat? Let us know and we'll take a look.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {equipment && equipment.length > 0 && (
                <div>
                  <label style={fieldLabel}>Which unit?</label>
                  <select className="select" style={{ width: '100%' }} value={equipmentId} onChange={e => setEquipmentId(e.target.value)}>
                    <option value="">Not sure / general</option>
                    {equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.type}{eq.brand ? ` · ${eq.brand}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={fieldLabel}>Error code</label>
                <input style={fieldStyle} value={errorCode} placeholder="e.g. E5" onChange={e => setErrorCode(e.target.value)} />
              </div>
              <div>
                <label style={fieldLabel}>What's happening?</label>
                <textarea style={{ ...fieldStyle, minHeight: 70, resize: 'vertical' }} value={description}
                  placeholder="Blinking light, no heat, screen is blank…" onChange={e => setDescription(e.target.value)} />
              </div>
              {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={submit} disabled={reportIssue.isPending}>
                {reportIssue.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
