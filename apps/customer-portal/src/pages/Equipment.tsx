import { useState, type FormEvent } from 'react'
import ReactDOM from 'react-dom'
import {
  Fan, Wrench, ShoppingCart, CheckCircle2, AlertTriangle, ShieldCheck, CalendarDays,
  X, ChevronRight, Info, StickyNote, BookOpen, Plus,
} from 'lucide-react'
import { useMyEquipment, useEquipmentConsumables, useMarkConsumableReplaced, useAddEquipment } from '../hooks/useMyEquipment'
import type { CustomerEquipment, EquipmentConsumable } from '../types/api'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Filter life ring ──────────────────────────────────────────────────────────
const RING_SIZE = 44
const RING_R = 17
const RING_CIRC = 2 * Math.PI * RING_R

// Returns a CSS variable string — resolves correctly across all themes
function lifeColor(pct: number): string {
  if (pct <= 0.1) return 'var(--red)'
  if (pct <= 0.35) return 'var(--amber)'
  return 'var(--green)'
}

function FilterLifeRing({ consumable }: { consumable: EquipmentConsumable }) {
  const hasSchedule = consumable.dueInDays != null
  const pct = hasSchedule
    ? Math.max(0, Math.min(1, (consumable.dueInDays as number) / consumable.intervalDays))
    : 0
  const color = lifeColor(pct)
  const filled = RING_CIRC * pct
  const overdue = hasSchedule && (consumable.dueInDays as number) < 0

  return (
    <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, flexShrink: 0 }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
        {/* Track — currentColor inherits from nearest text color, always visible */}
        <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="4"
          strokeDasharray={hasSchedule ? undefined : '3 4'} />
        {hasSchedule && !overdue && (
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${filled} ${RING_CIRC - filled}`}
            transform={`rotate(-90, ${RING_SIZE / 2}, ${RING_SIZE / 2})`}
            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }} />
        )}
        {overdue && (
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
            fill="none" stroke={color} strokeWidth="4" className="eq-ring-overdue" />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800, color: hasSchedule ? color : 'var(--t4)', letterSpacing: '-0.02em',
      }}>
        {overdue ? '!' : hasSchedule ? `${Math.round(pct * 100)}%` : '—'}
      </div>
    </div>
  )
}

function dueLabel(c: EquipmentConsumable): { label: string; color: string } {
  if (c.dueInDays == null) return { label: 'No replacement schedule', color: 'var(--t4)' }
  if (c.dueInDays < 0) return { label: `Overdue by ${Math.abs(c.dueInDays)} days`, color: 'var(--red)' }
  if (c.dueInDays <= 14) return { label: `Due in ${c.dueInDays} days`, color: 'var(--amber)' }
  return { label: `Next due ${fmtDate(c.nextDueAt)}`, color: 'var(--green)' }
}

function ConsumableRow({ equipmentId, consumable }: { equipmentId: string; consumable: EquipmentConsumable }) {
  const markReplaced = useMarkConsumableReplaced(equipmentId)
  const due = dueLabel(consumable)
  const spec = [consumable.partNumber, consumable.sizeSpec, consumable.rating].filter(Boolean).join(' · ')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      padding: '14px 16px', borderRadius: 12, marginTop: 10,
      border: '1px solid var(--bd)',
      background: 'var(--bg-card-2)',
    }}>
      <FilterLifeRing consumable={consumable} />
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          {consumable.kind === 'FILTER' ? 'Air filter' : consumable.kind.replace(/_/g, ' ').toLowerCase()}
          {consumable.description ? ` — ${consumable.description}` : ''}
        </div>
        {spec && (
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.01em' }}>
            {spec}
          </div>
        )}
        <div style={{ fontSize: 11, color: due.color, fontWeight: 600, marginTop: 3 }}>
          {due.label}
          <span style={{ color: 'var(--t4)', fontWeight: 400 }}>
            {' '}· every {consumable.intervalDays}d
            {consumable.lastReplacedAt ? ` · last ${fmtDate(consumable.lastReplacedAt)}` : ''}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {consumable.purchaseUrl && (
          <a href={consumable.purchaseUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <ShoppingCart size={12} /> Buy replacement
          </a>
        )}
        <button onClick={() => markReplaced.mutate(consumable.id)} disabled={markReplaced.isPending}
          className="btn btn-secondary btn-sm" title="I just replaced this">
          <CheckCircle2 size={12} /> {markReplaced.isPending ? 'Saving…' : 'Mark replaced'}
        </button>
      </div>
    </div>
  )
}

// ── Equipment detail drawer ───────────────────────────────────────────────────
function EquipmentDetailDrawer({ item, onClose }: { item: CustomerEquipment; onClose: () => void }) {
  const { data: consumables = [], isLoading } = useEquipmentConsumables(item.id)
  const warrantyActive = item.warrantyEnd ? new Date(item.warrantyEnd) > new Date() : false
  const overdue = consumables.some(c => (c.dueInDays ?? 1) < 0)

  const drawer = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
        width: '100%', maxWidth: 520,
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--bd)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawerIn 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`
          @keyframes drawerIn { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
        `}</style>

        {/* Header — always branded blue, same as job modal header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--bd)',
          background: 'linear-gradient(135deg, var(--blue, #2563EB) 0%, #1D4ED8 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Fan size={22} style={{ color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                  {[item.brand, item.type].filter(Boolean).join(' ')}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                  {[item.model && `Model ${item.model}`, item.serialNo && `S/N ${item.serialNo}`]
                    .filter(Boolean).join(' · ') || 'No model details on file'}
                </div>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
                color: '#fff', borderRadius: 9, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <X size={17} />
            </button>
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
              background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)',
            }}>
              <CalendarDays size={11} /> Installed {fmtDate(item.installDate)}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
              background: warrantyActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)',
              color: warrantyActive ? '#6EE7B7' : 'rgba(255,255,255,0.7)',
            }}>
              <ShieldCheck size={11} />
              {item.warrantyEnd
                ? `Warranty ${warrantyActive ? 'active until' : 'expired'} ${fmtDate(item.warrantyEnd)}`
                : 'No warranty on file'}
            </span>
            {overdue && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                background: 'rgba(239,68,68,0.3)', color: '#FCA5A5',
              }}>
                <AlertTriangle size={11} /> Maintenance overdue
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Details grid */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Info size={11} /> Equipment details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Type', value: item.type },
                { label: 'Brand', value: item.brand },
                { label: 'Model', value: item.model },
                { label: 'Serial No.', value: item.serialNo },
                { label: 'Install Date', value: fmtDate(item.installDate) },
                { label: 'Warranty Expires', value: fmtDate(item.warrantyEnd) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '10px 12px', borderRadius: 10,
                  border: '1px solid var(--bd)',
                  background: 'var(--bg-card-2)',
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--t4)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3,
                  }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: value && value !== '—' ? 'var(--t1)' : 'var(--t4)' }}>
                    {value || '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <StickyNote size={11} /> Notes from your technician
              </div>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                border: '1px solid var(--bd)',
                background: 'var(--bg-card-2)',
                fontSize: 13, color: 'var(--t2)', lineHeight: 1.65,
              }}>
                {item.notes}
              </div>
            </div>
          )}

          {/* Manual download — contextual action card */}
          {item.manualUrl && (
            <div style={{ marginBottom: 22 }}>
              <a
                href={item.manualUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 12,
                  border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
                  transition: 'border-color 0.15s ease, background 0.15s ease',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--blue)'
                    el.style.background = 'var(--blue-dim)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--bd)'
                    el.style.background = 'var(--bg-card-2)'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'var(--blue-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={16} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>
                      Product Manual
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[item.brand, item.model].filter(Boolean).join(' ') || 'Equipment documentation'} · PDF
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                </div>
              </a>
            </div>
          )}

          {/* Filters & consumables */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 4,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Fan size={11} /> Filters &amp; consumables
            </div>
            {isLoading ? (
              <div style={{ fontSize: 12, color: 'var(--t4)', padding: '12px 0' }}>Loading…</div>
            ) : consumables.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--t4)', padding: '8px 0' }}>
                No filters or consumables registered for this system yet.
              </div>
            ) : (
              consumables.map(c => <ConsumableRow key={c.id} equipmentId={item.id} consumable={c} />)
            )}
          </div>
        </div>
      </div>
    </>
  )

  return ReactDOM.createPortal(drawer, document.body)
}

// ── Add Equipment Modal ───────────────────────────────────────────────────────
function AddEquipmentModal({ onClose }: { onClose: () => void }) {
  const addEquipment = useAddEquipment()
  const [form, setForm] = useState({
    type: '', brand: '', model: '', serialNo: '', installDate: '', warrantyEnd: '', notes: '',
  })
  const [error, setError] = useState('')

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.type.trim()) { setError('Equipment type is required'); return }
    setError('')
    try {
      await addEquipment.mutateAsync({
        type: form.type.trim() || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        serialNo: form.serialNo.trim() || undefined,
        installDate: form.installDate || undefined,
        warrantyEnd: form.warrantyEnd || undefined,
        notes: form.notes.trim() || undefined,
      })
      onClose()
    } catch {
      setError('Failed to add equipment. Please try again.')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
    color: 'var(--t1)', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--t4)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block',
  }

  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 9999, width: '100%', maxWidth: 480,
        background: 'var(--bg-card)', borderRadius: 16,
        border: '1px solid var(--bd)', boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.2s ease',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translate(-50%,-48%); } to { opacity: 1; transform: translate(-50%,-50%); } }`}</style>

        {/* Modal header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--bd)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, var(--blue, #2563EB) 0%, #1D4ED8 100%)',
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Fan size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Add Equipment</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Register a system at your property</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            color: '#fff', borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--bd)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>Type <span style={{ color: 'var(--red)' }}>*</span></span>
              <input style={inputStyle} placeholder="e.g. HVAC, Heat Pump" value={form.type} onChange={set('type')} required />
            </label>
            <label>
              <span style={labelStyle}>Brand</span>
              <input style={inputStyle} placeholder="e.g. Carrier, Trane" value={form.brand} onChange={set('brand')} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>Model</span>
              <input style={inputStyle} placeholder="Model number" value={form.model} onChange={set('model')} />
            </label>
            <label>
              <span style={labelStyle}>Serial No.</span>
              <input style={inputStyle} placeholder="Serial number" value={form.serialNo} onChange={set('serialNo')} />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={labelStyle}>Install Date</span>
              <input style={inputStyle} type="date" value={form.installDate} onChange={set('installDate')} />
            </label>
            <label>
              <span style={labelStyle}>Warranty Expires</span>
              <input style={inputStyle} type="date" value={form.warrantyEnd} onChange={set('warrantyEnd')} />
            </label>
          </div>

          <label>
            <span style={labelStyle}>Notes (optional)</span>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }}
              placeholder="Any notes about this system…"
              value={form.notes}
              onChange={set('notes')}
            />
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={addEquipment.isPending}>
              {addEquipment.isPending ? 'Saving…' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body,
  )
}

// ── Equipment card (clickable) ────────────────────────────────────────────────
function EquipmentCard({ item, index, onSelect }: { item: CustomerEquipment; index: number; onSelect: () => void }) {
  const { data: consumables = [], isLoading } = useEquipmentConsumables(item.id)
  const overdue = consumables.some(c => (c.dueInDays ?? 1) < 0)
  const warrantyActive = item.warrantyEnd ? new Date(item.warrantyEnd) > new Date() : false
  const dueCount = consumables.filter(c => c.dueInDays != null && (c.dueInDays as number) <= 14).length

  return (
    <button
      onClick={onSelect}
      className={`card card-hover anim-fade-up delay-${Math.min(index + 1, 4)}`}
      style={{
        padding: 20, width: '100%', textAlign: 'left', cursor: 'pointer',
        // Overdue left stripe uses the CSS var — adapts across themes
        boxShadow: overdue ? 'inset 3px 0 0 var(--red)' : undefined,
        background: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Icon container — uses blue-dim which is theme-aware */}
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: 'var(--blue-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Fan size={20} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>
              {[item.brand, item.type].filter(Boolean).join(' ')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
              {[item.model && `Model ${item.model}`, item.serialNo && `S/N ${item.serialNo}`]
                .filter(Boolean).join(' · ') || 'No model details on file'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {overdue && (
            <span className="eq-pulse" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
              background: 'var(--red-dim)', color: 'var(--red)',
            }}>
              <AlertTriangle size={11} /> Maintenance due
            </span>
          )}
          <ChevronRight size={16} style={{ color: 'var(--t4)', flexShrink: 0 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)' }}>
          <CalendarDays size={12} /> Installed {fmtDate(item.installDate)}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
          // Warranty active uses --green (theme-aware), expired falls back to muted
          color: warrantyActive ? 'var(--green)' : 'var(--t3)',
        }}>
          <ShieldCheck size={12} />
          {item.warrantyEnd
            ? `Warranty ${warrantyActive ? 'until' : 'expired'} ${fmtDate(item.warrantyEnd)}`
            : 'No warranty on file'}
        </span>
        {!isLoading && consumables.length > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: dueCount > 0 ? 'var(--amber)' : 'var(--t3)',
          }}>
            <Fan size={12} />
            {dueCount > 0
              ? `${dueCount} filter${dueCount > 1 ? 's' : ''} due soon`
              : `${consumables.length} filter${consumables.length > 1 ? 's' : ''} tracked`}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Equipment() {
  const { data: equipment = [], isLoading } = useMyEquipment()
  const [selected, setSelected] = useState<CustomerEquipment | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  return (
    <div>
      <style>{`
        .eq-pulse { animation: eqPulse 2.2s ease-in-out infinite; }
        @keyframes eqPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.25); }
          50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        .eq-ring-overdue { animation: eqRingBlink 1.6s ease-in-out infinite; }
        @keyframes eqRingBlink {
          0%, 100% { stroke-opacity: 1; }
          50%      { stroke-opacity: 0.35; }
        }
      `}</style>

      {/* Page header — uses white text so it's readable on the dark --bg-app background */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: 0 }}>
            My Equipment
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
            {isLoading
              ? 'Loading…'
              : equipment.length === 0
                ? 'No equipment on file'
                : `${equipment.length} system${equipment.length !== 1 ? 's' : ''} on file — tap to view details`}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0 }}
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={14} /> Add Equipment
        </button>
      </div>

      {!isLoading && equipment.length === 0 ? (
        <div className="card anim-fade-up" style={{ padding: 40, textAlign: 'center' }}>
          <Wrench size={32} style={{ color: 'var(--t4)', opacity: 0.5, marginBottom: 10 }} />
          <p style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 16 }}>
            No equipment on file yet — your contractor adds your system details after a visit.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddOpen(true)}>
            <Plus size={14} /> Add Equipment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {equipment.map((item, i) => (
            <EquipmentCard key={item.id} item={item} index={i} onSelect={() => setSelected(item)} />
          ))}
        </div>
      )}

      {selected && (
        <EquipmentDetailDrawer item={selected} onClose={() => setSelected(null)} />
      )}

      {isAddOpen && (
        <AddEquipmentModal onClose={() => setIsAddOpen(false)} />
      )}
    </div>
  )
}
