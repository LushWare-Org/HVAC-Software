import { useState } from 'react'
import { User, Building2, Bell, Shield, Palette, Mail, Smartphone, Save, Check, Moon, Sun, Monitor, Lock } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const NOTIFICATION_TYPES = [
    { label: 'New job assignments', default: true },
    { label: 'Job status updates', default: true },
    { label: 'Payment received', default: true },
    { label: 'Invoice reminders', default: true },
    { label: 'Customer messages', default: true },
    { label: 'System updates', default: false },
]

export default function Settings() {
    const [tab, setTab] = useState<'profile' | 'company' | 'notifications' | 'appearance' | 'security' | 'billing' | 'team'>('profile')
    const [saved, setSaved] = useState(true)
    const { theme, setTheme } = useTheme()

    const [formData, setFormData] = useState({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hvacpro.com',
        phone: '+44 7700 900000',
        bio: 'HVAC Pro Administrator',
    })

    const [companyData, setCompanyData] = useState({
        companyName: 'HVAC Pro Ltd',
        registrationNumber: '12345678',
        vatNumber: 'GB123456789',
        website: 'https://hvacpro.com',
        address: '123 Business Street',
        city: 'London',
        postcode: 'SW1A 1AA',
    })

    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        types: Object.fromEntries(NOTIFICATION_TYPES.map(n => [n.label, n.default]))
    })

    const [securitySettings, setSecuritySettings] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleSave = () => {
        setSaved(true)
    }

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (saved) setSaved(false)
    }

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setCompanyData(prev => ({ ...prev, [name]: value }))
        if (saved) setSaved(false)
    }

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSecuritySettings(prev => ({ ...prev, [name]: value }))
        if (saved) setSaved(false)
    }

    const toggleNotification = (key: string) => {
        setNotificationSettings(prev => ({
            ...prev,
            [key]: !prev[key as keyof typeof prev]
        }))
    }


    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: checked ? 'var(--blue)' : 'var(--bd-md)',
                cursor: 'pointer',
                transition: 'background-color var(--dur)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                flexShrink: 0,
                position: 'relative',
            }}
            type="button"
            aria-label="Toggle"
        >
            <div
                style={{
                    width: 22,
                    height: 18,
                    borderRadius: 12,
                    background: 'white',
                    transition: 'transform var(--dur)',
                    transform: checked ? 'translateX(20px)' : 'translateX(0)',
                    boxShadow: 'var(--shadow-sm)',
                }}
            />
        </button>
    )

    return (
        <div className="anim-fade-up">
            <div className="page-tabs mb-5">
                <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                    <User size={14} /> Profile
                </button>
                <button className={`tab-btn ${tab === 'company' ? 'active' : ''}`} onClick={() => setTab('company')}>
                    <Building2 size={14} /> Company
                </button>
                <button className={`tab-btn ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>
                    <Palette size={14} /> Appearance
                </button>
                <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
                    <Shield size={14} /> Security
                </button>
            </div>

            {tab === 'profile' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Profile Information</div>
                            <div className="card-subtitle">Update your personal information and manage your profile</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                            <div className="form-group">
                                <label className="form-label">First Name *</label>
                                <input type="text" className="form-input" name="firstName" value={formData.firstName} onChange={handleProfileChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name *</label>
                                <input type="text" className="form-input" name="lastName" value={formData.lastName} onChange={handleProfileChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input type="email" className="form-input" name="email" value={formData.email} onChange={handleProfileChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" className="form-input" name="phone" value={formData.phone} onChange={handleProfileChange} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Bio</label>
                                <textarea
                                    className="form-input"
                                    name="bio"
                                    placeholder="Tell us about yourself..."
                                    value={formData.bio}
                                    onChange={handleProfileChange}
                                    style={{ height: 120, resize: 'vertical', minHeight: 120, paddingTop: 12 }}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn btn-secondary btn-sm">Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                {saved ? (
                                    <>
                                        <Check size={13} /> Saved
                                    </>
                                ) : (
                                    <>
                                        <Save size={13} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Company */}
            {tab === 'company' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Company Information</div>
                            <div className="card-subtitle">Manage business details and registration information</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                            <div className="form-group">
                                <label className="form-label">Company Name *</label>
                                <input type="text" className="form-input" name="companyName" value={companyData.companyName} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Registration Number *</label>
                                <input type="text" className="form-input" name="registrationNumber" value={companyData.registrationNumber} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">VAT Number</label>
                                <input type="text" className="form-input" name="vatNumber" value={companyData.vatNumber} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Website</label>
                                <input type="url" className="form-input" name="website" value={companyData.website} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Address *</label>
                                <input type="text" className="form-input" name="address" value={companyData.address} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">City *</label>
                                <input type="text" className="form-input" name="city" value={companyData.city} onChange={handleCompanyChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Postcode *</label>
                                <input type="text" className="form-input" name="postcode" value={companyData.postcode} onChange={handleCompanyChange} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn btn-secondary btn-sm">Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                {saved ? (
                                    <>
                                        <Check size={13} /> Saved
                                    </>
                                ) : (
                                    <>
                                        <Save size={13} /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'notifications' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Notification Preferences</div>
                            <div className="card-subtitle">Control how and when you receive notifications</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ marginBottom: 32 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--t1)' }}>Notification Channels</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { key: 'emailNotifications', icon: Mail, label: 'Email Notifications', desc: 'Receive updates via email' },
                                    { key: 'smsNotifications', icon: Smartphone, label: 'SMS Notifications', desc: 'Receive updates via text message' },
                                    { key: 'pushNotifications', icon: Bell, label: 'Push Notifications', desc: 'Receive browser push notifications' }
                                ].map(ch => (
                                    <div key={ch.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)', transition: 'all var(--dur-fast)', border: '1px solid transparent' }}>
                                        <ch.icon size={20} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: 'var(--t1)' }}>{ch.label}</p>
                                            <p style={{ fontSize: 12, color: 'var(--t3)' }}>{ch.desc}</p>
                                        </div>
                                        <Toggle checked={notificationSettings[ch.key as keyof typeof notificationSettings] as boolean} onChange={() => toggleNotification(ch.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ height: 1, background: 'var(--bd)', marginBottom: 32 }} />
                    </div>
                </div>
            )}

            {tab === 'appearance' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Appearance Settings</div>
                            <div className="card-subtitle">Customize how the application looks</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Theme Selection */}
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
                                {[
                                    { id: 'light', label: 'Light', icon: Sun, color: '#F59E0B' },
                                    { id: 'dark', label: 'Dark Blue', icon: Moon, color: '#3B82F6' },
                                    { id: 'black', label: 'Full Black', icon: Monitor, color: '#9CA3AF' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id as 'light' | 'dark' | 'black')}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: 20,
                                            borderRadius: 'var(--r-md)',
                                            border: `2px solid ${theme === t.id ? 'var(--blue)' : 'var(--bd)'}`,
                                            background: theme === t.id ? 'var(--blue-glow)' : 'var(--bg-card)',
                                            cursor: 'pointer',
                                            transition: 'all var(--dur)',
                                        }}
                                    >
                                        <t.icon size={28} style={{ color: t.color }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {tab === 'security' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Security & Authentication</div>
                            <div className="card-subtitle">Manage your account security settings</div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--bd)' }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Lock size={16} /> Change Password
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input type="password" className="form-input" name="currentPassword" value={securitySettings.currentPassword} onChange={handleSecurityChange} placeholder="Enter current password" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input type="password" className="form-input" name="newPassword" value={securitySettings.newPassword} onChange={handleSecurityChange} placeholder="Enter new password" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input type="password" className="form-input" name="confirmPassword" value={securitySettings.confirmPassword} onChange={handleSecurityChange} placeholder="Confirm new password" />
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>Password must be at least 8 characters long with a mix of uppercase, lowercase, numbers and symbols.</p>
                            <button className="btn btn-primary btn-sm">Update Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
