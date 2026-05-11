import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X, Wrench, Calendar, Plus, CheckCircle, MapPin } from 'lucide-react'
import { useBookService, useSubmitJobRequest, useCustomerProfile } from '../../hooks/useCustomerPortal'
import MapPicker from '../../components/MapPickerLazy'

interface BookServiceModalProps {
  onClose: () => void
}

type TabType = 'service' | 'schedule'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  borderRadius: 9,
  border: '1px solid #D1D5DB',
  background: '#fff',
  color: '#111827',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

export default function BookServiceModal({ onClose }: BookServiceModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('service')
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync: bookService, isPending } = useBookService()
  const { mutateAsync: submitJobRequest, isPending: isSubmittingJob } = useSubmitJobRequest()
  const { data: customerProfile } = useCustomerProfile()
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('')

  const [formData, setFormData] = useState({
    serviceType: 'Maintenance',
    title: '',
    description: '',
    serviceAddress: '',
    preferredDate: '',
    preferredTime: '09:00',
    urgency: 'NORMAL',
    notes: '',
    serviceLatitude: 25.2048,
    serviceLongitude: 55.2708,
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    // Use local time parsing so the customer's timezone is correctly applied
    const preferredDate = formData.preferredDate
      ? new Date(`${formData.preferredDate}T${formData.preferredTime}:00`).toISOString()
      : ''

    const selectedEquipment = customerProfile?.equipment?.find(e => e.id === selectedEquipmentId)
    const equipmentNote = selectedEquipment
      ? `Equipment: ${selectedEquipment.brand ?? ''} ${selectedEquipment.type} ${selectedEquipment.model ?? ''}`.trim()
      : ''

    const requestTitle = `${formData.serviceType}${formData.title ? ` - ${formData.title}` : ''}`

    await bookService({
      serviceType: `${formData.serviceType}${formData.title ? ` - ${formData.title}` : ''}`,
      description: formData.description,
      preferredDate,
      notes: [formData.notes, equipmentNote].filter(Boolean).join('\n'),
      urgency: formData.urgency,
      serviceAddress: formData.serviceAddress,
      serviceLatitude: formData.serviceLatitude,
      serviceLongitude: formData.serviceLongitude,
    })

    await submitJobRequest({
      title: requestTitle,
      description: formData.description,
      serviceAddress: formData.serviceAddress,
      serviceLatitude: formData.serviceLatitude,
      serviceLongitude: formData.serviceLongitude,
      priority: formData.urgency === 'EMERGENCY' ? 'EMERGENCY' : formData.urgency === 'HIGH' ? 'HIGH' : 'NORMAL',
      notes: [
        formData.notes,
        equipmentNote,
        `Requested via customer portal`,
      ].filter(Boolean).join('\n'),
      scheduledStart: preferredDate || undefined,
      tags: ['portal-request', formData.serviceType.toLowerCase()],
    })

    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        serviceType: 'Maintenance',
        title: '',
        description: '',
        serviceAddress: '',
        preferredDate: '',
        preferredTime: '09:00',
        urgency: 'NORMAL',
        notes: '',
        serviceLatitude: 25.2048,
        serviceLongitude: 55.2708,
      })
      setActiveTab('service')
      onClose()
    }, 1200)
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'service', label: 'Service Details', icon: <Wrench size={14} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={14} /> },
  ]

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cp-modal-container"
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 620,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          height: 580,
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="cp-modal-header"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            padding: '20px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Request a Service</h2>
            <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 4 }}>Tell us what you need and we will schedule a technician</p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#BFDBFE',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cp-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '13px 22px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#2563EB' : '#6B7280',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="cp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {submitted ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={32} style={{ color: '#16A34A' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 5 }}>Request Submitted!</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>We will confirm your appointment shortly.</div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'service' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    <BF label="Service Type *">
                      <select name="serviceType" value={formData.serviceType} onChange={handleChange} style={inputStyle}>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Repair">Repair</option>
                        <option value="Installation">Installation</option>
                        <option value="Inspection">Inspection</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </BF>
                    <BF label="Urgency">
                      <select name="urgency" value={formData.urgency} onChange={handleChange} style={inputStyle}>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="EMERGENCY">Emergency</option>
                      </select>
                    </BF>
                    <BF label="Brief Title" style={{ gridColumn: 'span 2' }}>
                      <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. AC not cooling" style={inputStyle} />
                    </BF>
                    <BF label="Describe the Issue" style={{ gridColumn: 'span 2' }}>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Please describe the problem in detail"
                        style={{ ...inputStyle, resize: 'none', paddingTop: 10, lineHeight: 1.55 }}
                      />
                    </BF>
                    {customerProfile?.equipment && customerProfile.equipment.length > 0 && (
                      <BF label="Related Equipment (optional)" style={{ gridColumn: 'span 2' }}>
                        <select
                          value={selectedEquipmentId}
                          onChange={e => setSelectedEquipmentId(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="">— None / Not applicable —</option>
                          {customerProfile.equipment.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {[eq.brand, eq.type, eq.model].filter(Boolean).join(' ')}
                              {eq.serialNo ? ` (S/N: ${eq.serialNo})` : ''}
                            </option>
                          ))}
                        </select>
                      </BF>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    <BF label="Preferred Date *">
                      <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange} style={inputStyle} />
                    </BF>
                    <BF label="Preferred Time">
                      <input type="time" name="preferredTime" value={formData.preferredTime} onChange={handleChange} style={inputStyle} />
                    </BF>
                    <BF label="Additional Notes" style={{ gridColumn: 'span 2' }}>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Any access instructions, gate codes, pets, etc"
                        style={{ ...inputStyle, resize: 'none', paddingTop: 10, lineHeight: 1.55 }}
                      />
                    </BF>
                    <BF label="Service Address *" style={{ gridColumn: 'span 2' }}>
                      <input
                        type="text"
                        name="serviceAddress"
                        value={formData.serviceAddress}
                        onChange={handleChange}
                        placeholder="Street address where service is needed"
                        style={inputStyle}
                      />
                    </BF>
                    <div style={{ gridColumn: 'span 2' }}>
                      <MapPicker
                        label="Service Location (GPS for dispatch)"
                        lat={formData.serviceLatitude}
                        lng={formData.serviceLongitude}
                        onChange={(lat, lng) => setFormData(prev => ({ ...prev, serviceLatitude: lat, serviceLongitude: lng }))}
                        height="220px"
                      />
                      <div style={{ marginTop: 8, fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} /> Admin dispatch uses this GPS pin to assign nearby technicians.
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.6 }}>
                      <strong>Note:</strong> Our team will confirm your appointment and provide an estimate before the visit.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!submitted && (
          <div
            className="cp-modal-footer"
            style={{
              background: '#F9FAFB',
              borderTop: '1px solid #E5E7EB',
              padding: '14px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: 5 }}>
              {tabs.map(t => (
                <div key={t.id} style={{ width: 8, height: 8, borderRadius: '50%', background: activeTab === t.id ? '#2563EB' : '#D1D5DB', transition: 'background 0.2s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  padding: '9px 20px',
                  borderRadius: 9,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              {activeTab === 'service' ? (
                <button
                  onClick={() => setActiveTab('schedule')}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending || isSubmittingJob || !formData.preferredDate || !formData.serviceAddress.trim()}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 9,
                    border: 'none',
                    background: isPending || isSubmittingJob || !formData.preferredDate || !formData.serviceAddress.trim() ? '#93C5FD' : '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isPending || isSubmittingJob || !formData.preferredDate || !formData.serviceAddress.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={14} /> {isPending || isSubmittingJob ? 'Submitting…' : 'Submit Request'}
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

function BF({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}
