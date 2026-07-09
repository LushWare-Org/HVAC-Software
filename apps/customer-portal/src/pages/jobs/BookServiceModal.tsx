/**
 * BookServiceModal — 3-step booking wizard (portal redesign).
 *
 * Step 1  Service  — tile grid instead of a dropdown, brief description,
 *                    optional equipment link (auto-attach hint).
 * Step 2  When     — quick date strip + native date fallback, three arrival
 *                    windows instead of a raw time field, saved-address chip.
 * Step 3  Review   — everything on one card, notes, GPS pin, one submit.
 *
 * Critical fix from the design review: the old modal hardcoded #fff/#111827
 * and broke in dark & black themes — every surface here reads CSS tokens.
 * Submit contract unchanged: same useBookService + useSubmitJobRequest calls.
 */
import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import {
  X, CheckCircle, MapPin, ChevronLeft, ChevronRight, Home, Plus,
  Wrench, Hammer, PackagePlus, Search, AlertTriangle, Sun, Sunset, Moon, Link2,
} from 'lucide-react'
import { useBookService, useSubmitJobRequest, useCustomerProfile } from '../../hooks/useCustomerPortal'
import MapPicker from '../../components/MapPickerLazy'

interface BookServiceModalProps {
  onClose: () => void
}

type Step = 1 | 2 | 3

const SERVICE_TYPES: { value: string; label: string; icon: React.ElementType; danger?: boolean }[] = [
  { value: 'Maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'Repair', label: 'Repair', icon: Hammer },
  { value: 'Installation', label: 'Installation', icon: PackagePlus },
  { value: 'Inspection', label: 'Inspection', icon: Search },
  { value: 'Emergency', label: 'Emergency', icon: AlertTriangle, danger: true },
]

const WINDOWS: { key: string; label: string; range: string; time: string; icon: React.ElementType; recommended?: boolean }[] = [
  { key: 'morning', label: 'Morning', range: '8:00 AM – 12:00 PM', time: '09:00', icon: Sun, recommended: true },
  { key: 'afternoon', label: 'Afternoon', range: '12:00 – 4:00 PM', time: '13:00', icon: Sunset },
  { key: 'evening', label: 'Evening', range: '4:00 – 7:00 PM', time: '16:30', icon: Moon },
]

const input: React.CSSProperties = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: '1.5px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--t4)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 8,
}

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function BookServiceModal({ onClose }: BookServiceModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync: bookService, isPending } = useBookService()
  const { mutateAsync: submitJobRequest, isPending: isSubmittingJob } = useSubmitJobRequest()
  const { data: customerProfile } = useCustomerProfile()

  const [serviceType, setServiceType] = useState('Maintenance')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [windowKey, setWindowKey] = useState('morning')
  const [useSavedAddress, setUseSavedAddress] = useState(true)
  const [serviceAddress, setServiceAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [coords, setCoords] = useState({ lat: 25.2048, lng: 55.2708 })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Saved address from the customer profile (one-tap chip)
  const savedAddress = useMemo(() => {
    if (!customerProfile) return ''
    return [customerProfile.address, customerProfile.city, customerProfile.state]
      .filter(Boolean).join(', ')
  }, [customerProfile])

  useEffect(() => {
    if (useSavedAddress && savedAddress) setServiceAddress(savedAddress)
  }, [useSavedAddress, savedAddress])

  // Quick-pick strip: next 5 days
  const quickDays = useMemo(() => {
    const out: { date: string; dow: string; day: number }[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setDate(d.getDate() + 1 + i)
      out.push({
        date: toDateInput(d),
        dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: d.getDate(),
      })
    }
    return out
  }, [])

  const selectedEquipment = customerProfile?.equipment?.find(e => e.id === selectedEquipmentId)
  const selectedWindow = WINDOWS.find(w => w.key === windowKey) ?? WINDOWS[0]
  const isEmergency = serviceType === 'Emergency'

  const step1Valid = !!serviceType
  const step2Valid = !!preferredDate && !!serviceAddress.trim()
  const busy = isPending || isSubmittingJob

  const handleSubmit = async () => {
    // Local time parsing so the customer's timezone applies (unchanged contract)
    const preferredIso = preferredDate
      ? new Date(`${preferredDate}T${selectedWindow.time}:00`).toISOString()
      : ''

    const equipmentNote = selectedEquipment
      ? `Equipment: ${selectedEquipment.brand ?? ''} ${selectedEquipment.type} ${selectedEquipment.model ?? ''}`.trim()
      : ''
    const windowNote = `Preferred arrival window: ${selectedWindow.label} (${selectedWindow.range})`
    const requestTitle = `${serviceType}${title ? ` - ${title}` : ''}`

    await bookService({
      serviceType: requestTitle,
      description,
      preferredDate: preferredIso,
      notes: [notes, windowNote, equipmentNote].filter(Boolean).join('\n'),
      urgency: isEmergency ? 'EMERGENCY' : 'NORMAL',
      serviceAddress,
      serviceLatitude: coords.lat,
      serviceLongitude: coords.lng,
    })

    await submitJobRequest({
      title: requestTitle,
      description,
      serviceAddress,
      serviceLatitude: coords.lat,
      serviceLongitude: coords.lng,
      priority: isEmergency ? 'EMERGENCY' : 'NORMAL',
      notes: [notes, windowNote, equipmentNote, 'Requested via customer portal'].filter(Boolean).join('\n'),
      scheduledStart: preferredIso || undefined,
      tags: ['portal-request', serviceType.toLowerCase()],
    })

    setSubmitted(true)
    setTimeout(onClose, 1600)
  }

  const steps = ['Service', 'When', 'Review']

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cp-modal-container"
        style={{
          background: 'var(--bg-card)', borderRadius: 18, maxWidth: 640, width: '100%',
          display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
          maxHeight: 'min(680px, calc(100vh - 40px))', overflow: 'hidden',
          border: '1px solid var(--bd)',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--blue), #1D4ED8)', padding: '18px 26px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ color: '#fff' }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Request a service</h2>
            <p style={{ color: '#BFDBFE', fontSize: 12.5, margin: '3px 0 0' }}>
              Tell us what you need — we'll confirm a time &amp; estimate
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 9, border: 'none',
            background: 'rgba(255,255,255,0.16)', color: '#BFDBFE', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        {!submitted && (
          <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 26px',
            borderBottom: '1px solid var(--bd)', background: 'var(--bg-card-2)', flexShrink: 0,
          }}>
            {steps.map((s, i) => {
              const n = (i + 1) as Step
              const active = step === n
              const done = step > n
              return (
                <React.Fragment key={s}>
                  {i > 0 && <div style={{ flex: 1, height: 2, background: done || active ? 'var(--blue)' : 'var(--bd)', margin: '0 12px' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: active || done ? 'var(--blue)' : 'var(--bg-card)',
                      border: active || done ? 'none' : '1.5px solid var(--bd-md, var(--bd))',
                      color: active || done ? '#fff' : 'var(--t4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {done ? <CheckCircle size={13} /> : n}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: active || done ? 'var(--blue)' : 'var(--t4)' }}>{s}</span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>
          {submitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--green-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={32} style={{ color: 'var(--green)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 5 }}>Request submitted</div>
                <div style={{ fontSize: 13, color: 'var(--t3)' }}>
                  We'll confirm your {selectedWindow.label.toLowerCase()} visit shortly.
                </div>
              </div>
            </div>
          ) : step === 1 ? (
            <>
              <span style={lbl}>What do you need help with?</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                {SERVICE_TYPES.map(t => {
                  const active = serviceType === t.value
                  const Icon = t.icon
                  const accent = t.danger ? 'var(--red)' : 'var(--blue)'
                  return (
                    <button key={t.value} onClick={() => setServiceType(t.value)} style={{
                      border: active ? `2px solid ${accent}` : '1.5px solid var(--bd)',
                      background: active ? (t.danger ? 'var(--red-dim)' : 'var(--blue-dim)') : 'var(--bg-card)',
                      borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, margin: '0 auto 8px',
                        background: 'var(--bg-card-2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: active ? accent : t.danger ? 'var(--red)' : 'var(--t3)',
                      }}>
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? accent : 'var(--t2)' }}>{t.label}</div>
                    </button>
                  )
                })}
              </div>

              <div style={{ marginTop: 18 }}>
                <span style={lbl}>Briefly, what's happening?</span>
                <input style={input} value={title} maxLength={120}
                  placeholder="e.g. AC not cooling the upstairs bedrooms"
                  onChange={e => setTitle(e.target.value)} />
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={lbl}>Anything else we should know? (optional)</span>
                <textarea style={{ ...input, resize: 'none', lineHeight: 1.55 }} rows={3}
                  value={description} placeholder="Describe the problem in a little more detail…"
                  onChange={e => setDescription(e.target.value)} />
              </div>

              {customerProfile?.equipment && customerProfile.equipment.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <span style={lbl}>Related equipment (optional)</span>
                  <select style={input} value={selectedEquipmentId} onChange={e => setSelectedEquipmentId(e.target.value)}>
                    <option value="">— None / not applicable —</option>
                    {customerProfile.equipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {[eq.brand, eq.type, eq.model].filter(Boolean).join(' ')}
                        {eq.serialNo ? ` (S/N: ${eq.serialNo})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedEquipment && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                      padding: '10px 13px', background: 'var(--green-dim)',
                      border: '1px solid var(--bd)', borderRadius: 10,
                    }}>
                      <Link2 size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)' }}>
                        Linked to <b style={{ color: 'var(--t1)' }}>
                          {[selectedEquipment.brand, selectedEquipment.model].filter(Boolean).join(' ') || selectedEquipment.type}
                        </b> — attached to your request
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : step === 2 ? (
            <>
              <span style={lbl}>Preferred date</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {quickDays.map(d => {
                  const active = preferredDate === d.date
                  return (
                    <button key={d.date} onClick={() => setPreferredDate(d.date)} style={{
                      flex: 1, textAlign: 'center', cursor: 'pointer', fontFamily: 'inherit',
                      border: active ? '2px solid var(--blue)' : '1.5px solid var(--bd)',
                      background: active ? 'var(--blue-dim)' : 'var(--bg-card)',
                      borderRadius: 10, padding: '9px 0',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 500, color: active ? 'var(--blue)' : 'var(--t4)' }}>{d.dow}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: active ? 'var(--blue)' : 'var(--t1)' }}>{d.day}</div>
                    </button>
                  )
                })}
              </div>
              <div style={{ marginTop: 10 }}>
                <input type="date" style={{ ...input, width: 'auto' }} value={preferredDate}
                  min={toDateInput(new Date())}
                  onChange={e => setPreferredDate(e.target.value)} />
                <span style={{ fontSize: 11.5, color: 'var(--t4)', marginLeft: 10 }}>or pick another date</span>
              </div>

              <div style={{ marginTop: 20 }}>
                <span style={lbl}>Arrival window</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {WINDOWS.map(w => {
                    const active = windowKey === w.key
                    const Icon = w.icon
                    return (
                      <button key={w.key} onClick={() => setWindowKey(w.key)} style={{
                        display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left',
                        border: active ? '2px solid var(--blue)' : '1.5px solid var(--bd)',
                        background: active ? 'var(--blue-dim)' : 'var(--bg-card)',
                        borderRadius: 11, padding: '11px 14px', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Icon size={18} style={{ color: active ? 'var(--blue)' : 'var(--t3)', flexShrink: 0 }} strokeWidth={1.9} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--blue)' : 'var(--t2)' }}>{w.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{w.range}</div>
                        </div>
                        {w.recommended && (
                          <span style={{
                            fontSize: 10.5, fontWeight: 600, color: 'var(--green)',
                            background: 'var(--green-dim)', padding: '2px 8px', borderRadius: 99,
                          }}>
                            Most availability
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <span style={lbl}>Service address</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {savedAddress && (
                    <button onClick={() => setUseSavedAddress(true)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                      border: useSavedAddress ? '2px solid var(--blue)' : '1.5px solid var(--bd)',
                      background: useSavedAddress ? 'var(--blue-dim)' : 'var(--bg-card)',
                      color: useSavedAddress ? 'var(--blue)' : 'var(--t2)',
                      fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 10,
                    }}>
                      <Home size={13} /> Home · {savedAddress}
                    </button>
                  )}
                  <button onClick={() => { setUseSavedAddress(false); if (useSavedAddress) setServiceAddress('') }} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
                    border: !useSavedAddress || !savedAddress ? '2px solid var(--blue)' : '1.5px solid var(--bd)',
                    background: !useSavedAddress || !savedAddress ? 'var(--blue-dim)' : 'var(--bg-card)',
                    color: !useSavedAddress || !savedAddress ? 'var(--blue)' : 'var(--t2)',
                    fontSize: 12, fontWeight: 600, padding: '8px 12px', borderRadius: 10,
                  }}>
                    <Plus size={13} /> {savedAddress ? 'Different address' : 'Enter address'}
                  </button>
                </div>
                {(!useSavedAddress || !savedAddress) && (
                  <input style={{ ...input, marginTop: 10 }} value={serviceAddress}
                    placeholder="Street address where service is needed"
                    onChange={e => setServiceAddress(e.target.value)} />
                )}
              </div>
            </>
          ) : (
            <>
              {/* Review */}
              <div style={{
                background: 'var(--bg-card-2)', border: '1px solid var(--bd)', borderRadius: 12,
                padding: '14px 16px',
              }}>
                {[
                  ['Service', `${serviceType}${title ? ` — ${title}` : ''}`],
                  ['When', preferredDate
                    ? `${new Date(`${preferredDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} · ${selectedWindow.label} (${selectedWindow.range})`
                    : '—'],
                  ['Address', serviceAddress || '—'],
                  ...(selectedEquipment
                    ? [['Equipment', [selectedEquipment.brand, selectedEquipment.type, selectedEquipment.model].filter(Boolean).join(' ')]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 12, padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--t3)', width: 82, flexShrink: 0 }}>{k}</span>
                    <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={lbl}>Access notes (optional)</span>
                <textarea style={{ ...input, resize: 'none', lineHeight: 1.55 }} rows={2}
                  value={notes} placeholder="Gate codes, pets, parking, anything the technician should know…"
                  onChange={e => setNotes(e.target.value)} />
              </div>

              <div style={{ marginTop: 16 }}>
                <MapPicker
                  label="Pin the exact location (helps dispatch send the nearest tech)"
                  lat={coords.lat}
                  lng={coords.lng}
                  onChange={(lat, lng) => setCoords({ lat, lng })}
                  height="200px"
                />
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={12} /> We use this pin to assign the closest available technician.
                </div>
              </div>

              <div style={{
                marginTop: 16, background: 'var(--blue-dim)', border: '1px solid var(--bd)',
                borderRadius: 10, padding: '11px 14px',
              }}>
                <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--t1)' }}>What happens next:</strong> our team confirms your
                  appointment and sends an estimate before the visit — nothing is charged now.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{
            background: 'var(--bg-card-2)', borderTop: '1px solid var(--bd)', padding: '13px 26px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--t4)' }}>Step {step} of 3</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {step === 1 ? (
                <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(s => (s - 1) as Step)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ChevronLeft size={13} /> Back
                </button>
              )}
              {step < 3 ? (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={step === 1 ? !step1Valid : !step2Valid}
                  onClick={() => setStep(s => (s + 1) as Step)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, opacity: (step === 1 ? step1Valid : step2Valid) ? 1 : 0.5 }}
                >
                  Continue <ChevronRight size={13} />
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy || !step2Valid}
                  onClick={handleSubmit}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, opacity: busy || !step2Valid ? 0.6 : 1 }}
                >
                  <CheckCircle size={14} /> {busy ? 'Submitting…' : 'Submit request'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}
