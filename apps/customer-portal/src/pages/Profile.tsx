import { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  Check,
  User,
  Lock,
  AlertCircle,
  Wrench,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  useCustomerProfile,
  useUpdateCustomerProfile,
  useMyUserProfile,
  useUpdateUserProfile,
  useChangePassword,
  useMyEquipment,
  useSaveMyEquipment,
} from '../hooks/useCustomerPortal'
import { useAuth } from '../contexts/AuthContext'
import type { CustomerEquipment } from '../types/api'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const EQUIPMENT_TYPES = [
  'Boiler', 'Furnace', 'Heat Pump', 'Air Conditioner', 'Water Heater',
  'Air Handler', 'Mini-Split', 'Thermostat', 'Humidifier', 'Dehumidifier',
  'Electrical Panel', 'Generator', 'Water Softener', 'Other',
]

type EquipmentDraft = CustomerEquipment & { _new?: boolean }

function EquipmentTab() {
  const { data: items = [], isLoading } = useMyEquipment()
  const saveEquipment = useSaveMyEquipment()
  const [draft, setDraft] = useState<EquipmentDraft[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    if (!isDirty) {
      setDraft(items.map(e => ({ ...e })))
    }
  }, [items, isDirty])

  const addItem = () => {
    setDraft(prev => [...prev, {
      id: `new-${Date.now()}`,
      type: 'Boiler',
      brand: '',
      model: '',
      serialNo: '',
      installDate: '',
      warrantyEnd: '',
      notes: '',
      _new: true,
    }])
    setIsDirty(true)
    setSavedOk(false)
  }

  const removeItem = (id: string) => {
    setDraft(prev => prev.filter(e => e.id !== id))
    setIsDirty(true)
    setSavedOk(false)
  }

  const updateField = (id: string, field: keyof CustomerEquipment, value: string) => {
    setDraft(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e))
    setIsDirty(true)
    setSavedOk(false)
  }

  const handleSave = async () => {
    setSaveError('')
    try {
      await saveEquipment.mutateAsync(
        draft
          .filter(e => e.brand?.trim() || e.model?.trim() || e.type)
          .map(({ id: _id, _new: _n, ...e }) => ({
            type: e.type || 'Boiler',
            brand: e.brand || undefined,
            model: e.model || undefined,
            serialNo: e.serialNo || undefined,
            installDate: e.installDate || undefined,
            warrantyEnd: e.warrantyEnd || undefined,
            notes: e.notes || undefined,
          })),
      )
      setIsDirty(false)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Failed to save equipment'
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  const handleDiscard = () => {
    setDraft(items.map(e => ({ ...e })))
    setIsDirty(false)
    setSaveError('')
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, color: 'var(--t3)', fontSize: 13 }}>
        Loading equipment…
      </div>
    )
  }

  return (
    <div className="card anim-fade-in">
      <div className="card-header">
        <div>
          <div className="card-title">My Equipment</div>
          <div className="card-subtitle">Track your installed systems so our technicians arrive prepared</div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={addItem}
        >
          <Plus size={13} /> Add Equipment
        </button>
      </div>

      <div className="card-body">
        {saveError && (
          <div style={{ marginBottom: 12, color: 'var(--red)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> {saveError}
          </div>
        )}

        {draft.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
            <Wrench size={40} style={{ color: 'var(--t4)', marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--t2)', marginBottom: 4 }}>No equipment records yet</p>
            <p style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 16 }}>
              Add your boilers, AC units, water heaters and other installed systems.
            </p>
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }} onClick={addItem}>
              <Plus size={13} /> Add First Equipment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {draft.map((eq) => (
              <div
                key={eq.id}
                style={{ padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)', background: 'var(--bg-card-2)', position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wrench size={15} color="var(--blue)" />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>
                      {(eq.brand || eq.model) ? `${eq.brand ?? ''} ${eq.model ?? ''}`.trim() : 'New Equipment'}
                    </span>
                    {eq._new && (
                      <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--blue-dim, #EFF6FF)', color: 'var(--blue)', padding: '2px 7px', borderRadius: 10 }}>NEW</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(eq.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 'var(--r)', border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#FEE2E2')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Equipment Type *</label>
                    <select
                      className="select"
                      style={{ width: '100%' }}
                      value={eq.type || 'Boiler'}
                      onChange={e => updateField(eq.id, 'type', e.target.value)}
                    >
                      {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className="form-input"
                      value={eq.brand ?? ''}
                      onChange={e => updateField(eq.id, 'brand', e.target.value)}
                      placeholder="e.g. Carrier, Lennox, Rheem"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      className="form-input"
                      value={eq.model ?? ''}
                      onChange={e => updateField(eq.id, 'model', e.target.value)}
                      placeholder="Model number"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={eq.serialNo ?? ''}
                      onChange={e => updateField(eq.id, 'serialNo', e.target.value)}
                      placeholder="Serial / unit ID"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Install Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={eq.installDate ? eq.installDate.split('T')[0] : ''}
                      onChange={e => updateField(eq.id, 'installDate', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Warranty Expires</label>
                    <input
                      type="date"
                      className="form-input"
                      value={eq.warrantyEnd ? eq.warrantyEnd.split('T')[0] : ''}
                      onChange={e => updateField(eq.id, 'warrantyEnd', e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      value={eq.notes ?? ''}
                      onChange={e => updateField(eq.id, 'notes', e.target.value)}
                      placeholder="Location, known issues, maintenance history…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isDirty && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDiscard} disabled={saveEquipment.isPending}>
              Discard Changes
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saveEquipment.isPending}>
              <Save size={13} /> {saveEquipment.isPending ? 'Saving…' : 'Save Equipment'}
            </button>
          </div>
        )}
        {savedOk && !isDirty && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={13} /> Equipment saved
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Profile() {
  const { updateLocalUser } = useAuth()
  const [tab, setTab] = useState<'personal' | 'security' | 'equipment'>('personal')
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [passError, setPassError] = useState('')
  const [passSuccess, setPassSuccess] = useState('')

  const { data: profile } = useCustomerProfile()
  const { data: userProfile } = useMyUserProfile()
  const { mutateAsync: updateCustomer, isPending: isSavingProfile } = useUpdateCustomerProfile()
  const { mutateAsync: updateUser } = useUpdateUserProfile()
  const { mutateAsync: changePassword, isPending: isSavingPassword } = useChangePassword()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  })

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (profile || userProfile) {
      const fullName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || userProfile?.name || ''
      setFormData({
        name: fullName,
        email: userProfile?.email || profile?.email || '',
        phone: profile?.phone || userProfile?.phone || '',
        address: [profile?.address, profile?.city, profile?.state, profile?.zipCode].filter(Boolean).join(', '),
      })
    }
  }, [profile, userProfile])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (saved) setSaved(false)
    setSaveError('')
  }

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSecurityData(prev => ({ ...prev, [name]: value }))
    setPassError('')
    setPassSuccess('')
  }

  const handleSave = async () => {
    setSaveError('')
    try {
      const nameParts = formData.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      await updateCustomer({
        firstName,
        lastName,
        phone: formData.phone,
        address: formData.address,
      })
      await updateUser({ name: formData.name, phone: formData.phone })
      updateLocalUser({ name: formData.name, phone: formData.phone })
      setSaved(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Failed to save profile'
      setSaveError(Array.isArray(msg) ? msg.join(', ') : msg)
      setSaved(false)
    }
  }

  const handlePasswordSave = async () => {
    setPassError('')
    setPassSuccess('')
    if (securityData.newPassword !== securityData.confirmPassword) {
      setPassError('New passwords do not match')
      return
    }
    if (securityData.newPassword.length < 8) {
      setPassError('Password must be at least 8 characters')
      return
    }
    try {
      await changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      })
      setPassSuccess('Password updated successfully')
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Failed to update password'
      setPassError(Array.isArray(msg) ? msg.join(', ') : msg)
    }
  }

  return (
    <div className="anim-fade-up">
      <div className="page-tabs mb-5">
        <button className={`tab-btn ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>
          <User size={14} /> Personal Info
        </button>
        <button className={`tab-btn ${tab === 'equipment' ? 'active' : ''}`} onClick={() => setTab('equipment')}>
          <Wrench size={14} /> My Equipment
        </button>
        <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
          <Shield size={14} /> Security
        </button>
      </div>

      {tab === 'personal' && (
        <div className="card anim-fade-in">
          <div className="card-header">
            <div>
              <div className="card-title">Personal Information</div>
              <div className="card-subtitle">Update your profile details and contact information</div>
            </div>
          </div>
          <div className="card-body">
            {saveError && (
              <div style={{ marginBottom: 12, color: 'var(--red)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> {saveError}
              </div>
            )}
            <div className="form-grid-2col" style={{ marginBottom: 32 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Email *
                </label>
                <input
                  type="email"
                  className="form-input"
                  name="email"
                  value={formData.email}
                  readOnly
                  style={{ opacity: 0.7, cursor: 'default' }}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Phone
                </label>
                <input
                  type="tel"
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleProfileChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Address
                </label>
                <input
                  type="text"
                  className="form-input"
                  name="address"
                  value={formData.address}
                  onChange={handleProfileChange}
                  placeholder="123 Main Street, City, State"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Member Since</label>
                <input
                  type="text"
                  className="form-input"
                  value={fmtDate(profile?.createdAt)}
                  readOnly
                  style={{ opacity: 0.6, cursor: 'default' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSaved(true)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={isSavingProfile}>
                {saved ? (
                  <><Check size={13} /> Saved</>
                ) : (
                  <><Save size={13} /> {isSavingProfile ? 'Saving…' : 'Save Changes'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'equipment' && <EquipmentTab />}

      {tab === 'security' && (
        <div className="card anim-fade-in">
          <div className="card-body">
            <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--bd)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} /> Change Password
              </h4>
              {passError && (
                <p style={{ color: 'var(--red)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <AlertCircle size={14} /> {passError}
                </p>
              )}
              {passSuccess && <p style={{ color: 'var(--green)', marginBottom: 8, fontSize: 12 }}>{passSuccess}</p>}
              <div className="form-grid-2col" style={{ marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    name="currentPassword"
                    value={securityData.currentPassword}
                    onChange={handleSecurityChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    name="newPassword"
                    value={securityData.newPassword}
                    onChange={handleSecurityChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    name="confirmPassword"
                    value={securityData.confirmPassword}
                    onChange={handleSecurityChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>
                Password must be at least 8 characters long with a mix of uppercase, lowercase, numbers and symbols.
              </p>
              <button className="btn btn-primary btn-sm" onClick={handlePasswordSave} disabled={isSavingPassword}>
                <Lock size={13} /> {isSavingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
