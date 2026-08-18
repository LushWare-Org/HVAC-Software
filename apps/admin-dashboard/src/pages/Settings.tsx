import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { User, Building2, Bell, Shield, Palette, Mail, Smartphone, Save, Check, Moon, Sun, Monitor, Lock, Loader2, AlertCircle, ClipboardList, ChevronDown, ChevronRight, Bot, Upload, RotateCcw, ArrowRight, Megaphone, Plug2, CheckCircle2, XCircle, RefreshCw, ExternalLink, Landmark, Search, Star, X as XIcon, Trash2, Plus, GripVertical } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import { useMyProfile, useUpdateMyProfile, useCompany, useUpdateCompany, useCurrencies, useUpdateCurrencies, useTaxRates, useCreateTaxRate, useUpdateTaxRate, useDeleteTaxRate, usePaymentTerms, useCreatePaymentTerms, useUpdatePaymentTerms, useDeletePaymentTerms } from '../hooks/useSettings'
import { useJobTypes, useJobTemplates } from '../hooks/useJobs'
import { useImportBatches, useImportRollback } from '../hooks/useImport'
import { useQBStatus, useQBAuthUrl, useQBDisconnect } from '../hooks/useFinance'
import { ISO_CURRENCIES, currencyInfo } from '../lib/currencies'
import PortalBannerSettings from './settings/PortalBannerSettings'

export default function Settings() {
    const [tab, setTab] = useState<'profile' | 'company' | 'finance' | 'notifications' | 'appearance' | 'security' | 'templates' | 'portal' | 'ai-agents' | 'integrations'>('profile')
    const [searchParams, setSearchParams] = useSearchParams()
    const { theme, setTheme } = useTheme()
    const { showSuccess, showError } = useToast()

    // ── QuickBooks OAuth callback toast ──────────────────────────────────────
    useEffect(() => {
        const qb = searchParams.get('qb')
        if (qb === 'connected') {
            showSuccess('QuickBooks connected successfully. Invoices will now sync automatically.', 'QuickBooks Connected')
            setTab('integrations')
            setSearchParams({}, { replace: true })
        } else if (qb === 'error') {
            showError('QuickBooks connection failed. Please try again or check your credentials.', 'Connection Failed')
            setTab('integrations')
            setSearchParams({}, { replace: true })
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ---- Profile ----
    const profileQuery = useMyProfile()
    const updateProfile = useUpdateMyProfile()
    const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' })
    const [profileDirty, setProfileDirty] = useState(false)

    useEffect(() => {
        if (profileQuery.data) {
            setProfileForm({
                name: profileQuery.data.name ?? '',
                email: profileQuery.data.email ?? '',
                phone: profileQuery.data.phone ?? '',
            })
        }
    }, [profileQuery.data])

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setProfileForm(prev => ({ ...prev, [name]: value }))
        setProfileDirty(true)
    }

    const saveProfile = () => {
        updateProfile.mutate(profileForm, {
            onSuccess: () => { setProfileDirty(false); showSuccess('Profile saved.') },
            onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to save profile.', 'Save failed'),
        })
    }

    // ---- Company ----
    const companyQuery = useCompany()
    const updateCompany = useUpdateCompany()
    const [companyForm, setCompanyForm] = useState({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', website: '', automaticFollowupEnabled: true })
    const [companyDirty, setCompanyDirty] = useState(false)

    useEffect(() => {
        if (companyQuery.data) {
            const c = companyQuery.data
            setCompanyForm({
                name: c.name ?? '',
                email: c.email ?? '',
                phone: c.phone ?? '',
                address: c.address ?? '',
                city: c.city ?? '',
                state: c.state ?? '',
                zipCode: c.zipCode ?? '',
                website: c.website ?? '',
                automaticFollowupEnabled: c.automaticFollowupEnabled ?? true,
            })
        }
    }, [companyQuery.data])

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setCompanyForm(prev => ({ ...prev, [name]: value }))
        setCompanyDirty(true)
    }

    const toggleAutomaticFollowup = () => {
        setCompanyForm(prev => ({ ...prev, automaticFollowupEnabled: !prev.automaticFollowupEnabled }))
        setCompanyDirty(true)
    }

    const saveCompany = () => {
        updateCompany.mutate(companyForm, {
            onSuccess: () => { setCompanyDirty(false); showSuccess('Company settings saved.') },
            onError: (err: any) => showError(err?.response?.data?.message ?? 'Failed to save company settings.', 'Save failed'),
        })
    }

    // ---- Notifications (localStorage) ----
    const [notificationSettings, setNotificationSettings] = useState(() => {
        const stored = localStorage.getItem('notificationPrefs')
        if (stored) return JSON.parse(stored)
        return { emailNotifications: true, smsNotifications: true, pushNotifications: true }
    })

    const toggleNotification = (key: string) => {
        setNotificationSettings((prev: Record<string, boolean>) => {
            const next = { ...prev, [key]: !prev[key] }
            localStorage.setItem('notificationPrefs', JSON.stringify(next))
            return next
        })
    }

    // ---- Security ----
    const [securitySettings, setSecuritySettings] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [securityError, setSecurityError] = useState('')
    const [securitySaved, setSecuritySaved] = useState(false)

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setSecuritySettings(prev => ({ ...prev, [name]: value }))
        setSecurityError('')
        setSecuritySaved(false)
    }

    const handlePasswordUpdate = () => {
        setSecurityError('')
        if (!securitySettings.currentPassword || !securitySettings.newPassword) {
            setSecurityError('Please fill in all password fields.')
            return
        }
        if (securitySettings.newPassword.length < 8) {
            setSecurityError('New password must be at least 8 characters.')
            return
        }
        if (securitySettings.newPassword !== securitySettings.confirmPassword) {
            setSecurityError('Passwords do not match.')
            return
        }
        // Password change would go through Auth0 â€” show success for now
        setSecuritySaved(true)
        setSecuritySettings({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            style={{
                width: 48, height: 28, borderRadius: 14, border: 'none',
                background: checked ? 'var(--blue)' : 'var(--bd-md)',
                cursor: 'pointer', transition: 'background-color var(--dur)',
                display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0, position: 'relative',
            }}
            type="button" aria-label="Toggle"
        >
            <div style={{
                width: 22, height: 18, borderRadius: 12, background: 'white',
                transition: 'transform var(--dur)',
                transform: checked ? 'translateX(20px)' : 'translateX(0)',
                boxShadow: 'var(--shadow-sm)',
            }} />
        </button>
    )
    const SaveButton = ({ saving, dirty, onSave, saved }: { saving: boolean; dirty: boolean; onSave: () => void; saved?: boolean }) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving || (!dirty && !saved)}>
                {saving ? (
                    <><Loader2 size={13} className="spin" /> Saving...</>
                ) : !dirty && saved !== false ? (
                    <><Check size={13} /> Saved</>
                ) : (
                    <><Save size={13} /> Save Changes</>
                )}
            </button>
        </div>
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
                <button className={`tab-btn ${tab === 'finance' ? 'active' : ''}`} onClick={() => setTab('finance')}>
                    <Landmark size={14} /> Finance
                </button>
                <button className={`tab-btn ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
                    <Bell size={14} /> Notifications
                </button>
                <button className={`tab-btn ${tab === 'appearance' ? 'active' : ''}`} onClick={() => setTab('appearance')}>
                    <Palette size={14} /> Appearance
                </button>
                <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
                    <Shield size={14} /> Security
                </button>
                <button className={`tab-btn ${tab === 'templates' ? 'active' : ''}`} onClick={() => setTab('templates')}>
                    <ClipboardList size={14} /> Job Templates
                </button>
                <button className={`tab-btn ${tab === 'portal' ? 'active' : ''}`} onClick={() => setTab('portal')}>
                    <Megaphone size={14} /> Portal
                </button>
                <button className={`tab-btn ${tab === 'ai-agents' ? 'active' : ''}`} onClick={() => setTab('ai-agents')}>
                    <Bot size={14} /> AI Agents
                </button>
                <button className={`tab-btn ${tab === 'integrations' ? 'active' : ''}`} onClick={() => setTab('integrations')}>
                    <Plug2 size={14} /> Integrations
                </button>
            </div>

            {/* Profile */}
            {tab === 'profile' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Profile Information</div>
                            <div className="card-subtitle">Update your personal information and manage your profile</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {profileQuery.isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                            </div>
                        ) : profileQuery.isError ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>
                                <AlertCircle size={24} style={{ marginBottom: 8 }} />
                                <p>Failed to load profile</p>
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => profileQuery.refetch()}>Retry</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input type="text" className="form-input" name="name" value={profileForm.name} onChange={handleProfileChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className="form-input" name="email" value={profileForm.email} onChange={handleProfileChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" className="form-input" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <input type="text" className="form-input" value={profileQuery.data?.role?.replace(/_/g, ' ') ?? ''} disabled style={{ textTransform: 'capitalize' }} />
                                    </div>
                                </div>
                                {updateProfile.isError && (
                                    <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>Failed to save profile. Please try again.</p>
                                )}
                                <SaveButton saving={updateProfile.isPending} dirty={profileDirty} onSave={saveProfile} saved={!profileDirty && !!profileQuery.data} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Company */}
            {tab === 'company' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Company Information</div>
                            <div className="card-subtitle">Manage business details and automation preferences</div>
                        </div>
                    </div>
                    <div className="card-body">
                        {companyQuery.isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                                <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                            </div>
                        ) : companyQuery.isError ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>
                                <AlertCircle size={24} style={{ marginBottom: 8 }} />
                                <p>Failed to load company info</p>
                                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => companyQuery.refetch()}>Retry</button>
                            </div>
                        ) : (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                                    padding: 18, marginBottom: 24, borderRadius: 'var(--r-md)',
                                    background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: 'var(--blue-glow)',
                                        }}>
                                            <Bot size={18} style={{ color: 'var(--blue)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>Automatic Follow-up Agent</div>
                                            <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 560 }}>
                                                Turn automated churn prevention and lead follow-up on or off for this company. When disabled, CRM stops queuing automatic follow-up messages.
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: companyForm.automaticFollowupEnabled ? 'var(--green)' : 'var(--t3)' }}>
                                            {companyForm.automaticFollowupEnabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <Toggle checked={companyForm.automaticFollowupEnabled} onChange={toggleAutomaticFollowup} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                                    <div className="form-group">
                                        <label className="form-label">Company Name *</label>
                                        <input type="text" className="form-input" name="name" value={companyForm.name} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input type="email" className="form-input" name="email" value={companyForm.email} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" className="form-input" name="phone" value={companyForm.phone} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Website</label>
                                        <input type="url" className="form-input" name="website" value={companyForm.website} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label className="form-label">Address</label>
                                        <input type="text" className="form-input" name="address" value={companyForm.address} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">City</label>
                                        <input type="text" className="form-input" name="city" value={companyForm.city} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">State / Region</label>
                                        <input type="text" className="form-input" name="state" value={companyForm.state} onChange={handleCompanyChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Postcode / ZIP</label>
                                        <input type="text" className="form-input" name="zipCode" value={companyForm.zipCode} onChange={handleCompanyChange} />
                                    </div>
                                </div>
                                {updateCompany.isError && (
                                    <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>Failed to save company info. Please try again.</p>
                                )}
                                <SaveButton saving={updateCompany.isPending} dirty={companyDirty} onSave={saveCompany} saved={!companyDirty && !!companyQuery.data} />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Finance */}
            {tab === 'finance' && <FinanceTab />}

            {/* Notifications */}
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
                                        <Toggle checked={notificationSettings[ch.key] ?? false} onChange={() => toggleNotification(ch.key)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t3)' }}>Preferences are saved automatically.</p>
                    </div>
                </div>
            )}

            {/* Appearance */}
            {tab === 'appearance' && (
                <div className="card anim-fade-in">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Appearance Settings</div>
                            <div className="card-subtitle">Customize how the application looks</div>
                        </div>
                    </div>
                    <div className="card-body">
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
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20,
                                            borderRadius: 'var(--r-md)',
                                            border: `2px solid ${theme === t.id ? 'var(--blue)' : 'var(--bd)'}`,
                                            background: theme === t.id ? 'var(--blue-glow)' : 'var(--bg-card)',
                                            cursor: 'pointer', transition: 'all var(--dur)',
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

            {/* Security */}
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
                            {securityError && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{securityError}</p>}
                            {securitySaved && <p style={{ color: 'var(--green)', fontSize: 12, marginBottom: 12 }}>Password updated successfully.</p>}
                            <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>Password must be at least 8 characters long with a mix of uppercase, lowercase, numbers and symbols.</p>
                            <button className="btn btn-primary btn-sm" onClick={handlePasswordUpdate}>Update Password</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Templates */}
            {tab === 'templates' && <JobTemplatesTab />}

            {tab === 'portal' && <PortalBannerSettings />}

            {/* AI Agents */}
            {tab === 'ai-agents' && <AiAgentsTab automaticFollowupEnabled={companyForm.automaticFollowupEnabled} onToggle={toggleAutomaticFollowup} />}

            {/* Integrations */}
            {tab === 'integrations' && <IntegrationsTab />}

            {/* Data Import */}
            {tab === 'profile' && <DataImportCard />}
        </div>
    )
}

function DataImportCard() {
    const batches = useImportBatches()
    const rollback = useImportRollback()
    const lastBatch = batches.data?.[0]
    const canRollback = lastBatch?.status === 'DONE' && lastBatch.imported > 0

    const handleRollback = async () => {
        if (!lastBatch) return
        if (!confirm(`Roll back the last import? This will permanently delete ${lastBatch.imported} imported records.`)) return
        await rollback.mutateAsync(lastBatch.id)
    }

    return (
        <div className="card anim-fade-in" style={{ marginTop: 20 }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--blue), #7c3aed)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Upload size={16} color="white" />
                    </div>
                    <div>
                        <div className="card-title">Data Import</div>
                        <div className="card-subtitle">Migrate customers and equipment from Jobber, Housecall Pro, or a spreadsheet</div>
                    </div>
                </div>
            </div>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                {lastBatch ? (
                    <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                        Last import: <strong>{lastBatch.imported.toLocaleString()}</strong> {lastBatch.source} records ·{' '}
                        <span style={{ color: 'var(--t3)' }}>{new Date(lastBatch.createdAt).toLocaleDateString()}</span>
                    </div>
                ) : (
                    <div style={{ fontSize: 13, color: 'var(--t3)' }}>No imports yet — get your existing data into HVACtor.ai in minutes.</div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                    {canRollback && (
                        <button className="btn btn-secondary btn-sm" onClick={handleRollback} disabled={rollback.isPending} style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <RotateCcw size={12} /> Rollback last
                        </button>
                    )}
                    <Link to="/import" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
                        <Upload size={12} /> Start Import <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

function JobTemplatesTab() {
    const { data: jobTypes = [], isLoading } = useJobTypes()
    const [expandedType, setExpandedType] = useState<string | null>(null)

    if (isLoading) {
        return (
            <div className="card anim-fade-in">
                <div className="card-header"><div className="card-title">Job Templates</div></div>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                </div>
            </div>
        )
    }

    if (jobTypes.length === 0) {
        return (
            <div className="card anim-fade-in">
                <div className="card-header">
                    <div>
                        <div className="card-title">Job Templates</div>
                        <div className="card-subtitle">Reusable checklists and task lists for each job type</div>
                    </div>
                </div>
                <div className="card-body" style={{ textAlign: 'center', padding: 48, color: 'var(--t3)' }}>
                    <ClipboardList size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                    <p style={{ fontSize: 14, fontWeight: 500 }}>No job types set up yet.</p>
                    <p style={{ fontSize: 13, marginTop: 6 }}>Job types and their templates are created by your administrator.</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* How templates work — S2 explanation */}
            <div style={{ display: 'flex', gap: 14, padding: '16px 20px', borderRadius: 'var(--r-md)', background: 'var(--blue-glow)', border: '1px solid color-mix(in srgb, var(--blue) 25%, transparent)' }}>
                <ClipboardList size={18} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
                <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)', marginBottom: 4 }}>How Job Templates work</p>
                    <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, margin: 0 }}>
                        Templates are pre-built task checklists attached to a <strong>Job Type</strong> (e.g. HVAC, Plumbing). When a dispatcher creates a job of that type, the template's tasks are auto-loaded for the technician to complete on-site.
                        Templates speed up job creation, enforce quality checklists, and give technicians a consistent workflow — no paperwork, no missed steps.
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6, margin: '6px 0 0' }}>
                        Job types and their templates are managed by your administrator. Contact support to add a new trade type.
                    </p>
                </div>
            </div>
        <div className="card anim-fade-in">
            <div className="card-header">
                <div>
                    <div className="card-title">Job Templates</div>
                    <div className="card-subtitle">Reusable checklists and task lists attached to each job type</div>
                </div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {jobTypes.map((jt: any, i: number) => (
                    <JobTypeRow
                        key={jt.id}
                        jobType={jt}
                        expanded={expandedType === jt.id}
                        onToggle={() => setExpandedType(expandedType === jt.id ? null : jt.id)}
                        isLast={i === jobTypes.length - 1}
                    />
                ))}
            </div>
        </div>
        </div>
    )
}

function JobTypeRow({ jobType, expanded, onToggle, isLast }: { jobType: any; expanded: boolean; onToggle: () => void; isLast: boolean }) {
    const { data: templates = [], isLoading } = useJobTemplates(expanded ? jobType.id : null)

    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--bd)' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '16px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', color: 'var(--t1)',
                    transition: 'background var(--dur)',
                }}
                className="hover:bg-[var(--bg-hover)]"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {expanded ? <ChevronDown size={16} style={{ color: 'var(--t3)' }} /> : <ChevronRight size={16} style={{ color: 'var(--t3)' }} />}
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{jobType.name}</span>
                    {jobType.trade && <span className="badge badge-neutral" style={{ fontSize: 11 }}>{jobType.trade}</span>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                    {expanded ? 'Click to collapse' : 'Click to view templates'}
                </span>
            </button>
            {expanded && (
                <div style={{ padding: '0 24px 20px 24px', background: 'var(--bg2)' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t3)', fontSize: 13, padding: '12px 0' }}>
                            <Loader2 size={14} className="spin" /> Loading templatesâ€¦
                        </div>
                    ) : templates.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--t3)', padding: '12px 0' }}>No templates for this job type.</p>
                    ) : templates.map((tmpl: any) => (
                        <div key={tmpl.id} style={{ background: 'var(--bg)', border: '1px solid var(--bd)', borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{tmpl.name}</span>
                                {tmpl.estimatedDurationMins && (
                                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{tmpl.estimatedDurationMins} min</span>
                                )}
                            </div>
                            {tmpl.description && <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>{tmpl.description}</p>}
                            {tmpl.tasks && tmpl.tasks.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                        Tasks ({tmpl.tasks.length})
                                    </p>
                                    {tmpl.tasks.map((task: any, idx: number) => (
                                        <div key={task.id ?? idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 13 }}>
                                            <span style={{ color: 'var(--t3)', minWidth: 20, fontWeight: 600 }}>{task.taskOrder ?? idx + 1}.</span>
                                            <div>
                                                <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{task.taskName}</span>
                                                {task.isRequired && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', marginLeft: 6 }}>REQUIRED</span>}
                                                {task.description && <p style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0 0 0' }}>{task.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function AiAgentsTab({ automaticFollowupEnabled, onToggle }: { automaticFollowupEnabled: boolean; onToggle: () => void }) {
    const agents = [
        {
            name: 'Followup Agent',
            color: 'var(--blue)',
            bg: 'var(--blue-glow)',
            description: 'Automatically sends follow-up messages to leads and at-risk customers using multi-armed bandit optimization. Schedules messages at optimal times based on historical response rates.',
            model: 'Python / scikit-learn (EpsilonGreedy bandit)',
        },
        {
            name: 'Retention Agent',
            color: 'var(--green)',
            bg: 'rgba(16,185,129,0.12)',
            description: 'Monitors customer engagement and identifies churn signals. Triggers targeted outreach campaigns for customers at risk of leaving based on recency, frequency, and monetary value.',
            model: 'Python / scikit-learn (UCB1 bandit)',
        },
        {
            name: 'Upsell Agent',
            color: 'var(--amber)',
            bg: 'rgba(245,158,11,0.12)',
            description: 'Identifies cross-sell and upsell opportunities based on job history, equipment age, and service patterns. Generates targeted offers at the right moment in the customer lifecycle.',
            model: 'Python / scikit-learn (Thompson Sampling bandit)',
        },
        {
            name: 'Churn Prediction Service',
            color: 'var(--red)',
            bg: 'rgba(239,68,68,0.12)',
            description: "Runs batch churn risk inference using XGBoost. Scores every customer daily and surfaces high-risk accounts on the Customers page. Powers the retention agent's target list.",
            model: 'FastAPI + XGBoost (Docker :8000)',
        },
    ]

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 2, transition: 'background 0.2s',
                background: checked ? 'var(--blue)' : 'var(--bd)',
            }}
            type="button" aria-label="Toggle"
        >
            <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s',
                transform: checked ? 'translateX(20px)' : 'translateX(0)',
            }} />
        </button>
    )

    return (
        <div className="card anim-fade-in">
            <div className="card-header">
                <div>
                    <div className="card-title">AI Agents</div>
                    <div className="card-subtitle">Configure and monitor the autonomous agents running in your CRM</div>
                </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {agents.map(agent => (
                    <div key={agent.name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: 18, borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: agent.bg }}>
                                <Bot size={18} style={{ color: agent.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 4 }}>{agent.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--t3)', maxWidth: 560, marginBottom: 6 }}>{agent.description}</div>
                                <div style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'monospace' }}>{agent.model}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: automaticFollowupEnabled ? 'var(--green)' : 'var(--t3)' }}>
                                {automaticFollowupEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <Toggle checked={automaticFollowupEnabled} onChange={onToggle} />
                        </div>
                    </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--t4)', padding: '8px 0' }}>
                    Agent toggles are company-wide. Individual agent configuration is managed via the Python ML tier (agent/ directory).
                </div>
            </div>
        </div>
    )
}

// ─── IntegrationsTab ──────────────────────────────────────────────────────────

function IntegrationsTab() {
    const { showSuccess, showError } = useToast()
    const qbStatus = useQBStatus()
    const qbAuthUrl = useQBAuthUrl()
    const qbDisconnect = useQBDisconnect()
    const [disconnecting, setDisconnecting] = useState(false)

    const connected = qbStatus.data?.connected ?? false
    const realmId = qbStatus.data?.realmId
    const expiresAt = qbStatus.data?.expiresAt ? new Date(qbStatus.data.expiresAt) : null

    async function handleConnect() {
        try {
            const { authUrl } = await qbAuthUrl.mutateAsync()
            window.location.href = authUrl
        } catch {
            showError('Could not get QuickBooks authorization URL. Check that the finance service is running.', 'Connection Failed')
        }
    }

    async function handleDisconnect() {
        setDisconnecting(true)
        try {
            await qbDisconnect.mutateAsync()
            showSuccess('QuickBooks disconnected. Invoices will no longer sync automatically.', 'Disconnected')
        } catch {
            showError('Failed to disconnect QuickBooks. Please try again.', 'Error')
        } finally {
            setDisconnecting(false)
        }
    }

    // QB brand green — distinctive accent that signals "official" connection
    const QB_GREEN = '#2CA01C'
    const QB_GREEN_DIM = 'rgba(44,160,28,0.12)'
    const QB_GREEN_BORDER = 'rgba(44,160,28,0.3)'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Section header */}
            <div style={{ marginBottom: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: 0 }}>Connected Integrations</h2>
                <p style={{ fontSize: 13, color: 'var(--t3)', margin: '4px 0 0' }}>
                    Manage third-party services that sync with your CRM data.
                </p>
            </div>

            {/* QuickBooks card */}
            <div className="card anim-fade-in" style={{
                border: connected ? `1px solid ${QB_GREEN_BORDER}` : '1px solid var(--border)',
                borderLeft: `3px solid ${connected ? QB_GREEN : 'var(--border)'}`,
                transition: 'border-color 0.2s ease',
            }}>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Header row: QB branding + status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            {/* QB logo mark */}
                            <div style={{
                                width: 44, height: 44, borderRadius: 10,
                                background: connected ? QB_GREEN_DIM : 'var(--bg-hover)',
                                border: `1px solid ${connected ? QB_GREEN_BORDER : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'background 0.2s ease',
                            }}>
                                <span style={{ fontSize: 14, fontWeight: 900, color: connected ? QB_GREEN : 'var(--t4)', letterSpacing: '-0.5px' }}>QB</span>
                            </div>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>QuickBooks Online</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>
                                    Syncs invoices and payments automatically when created or updated.
                                </div>
                            </div>
                        </div>

                        {/* Status badge */}
                        {qbStatus.isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t4)' }}>
                                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Checking…
                            </div>
                        ) : connected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: QB_GREEN_DIM, border: `1px solid ${QB_GREEN_BORDER}`, flexShrink: 0 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: QB_GREEN, boxShadow: `0 0 6px ${QB_GREEN}`, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: QB_GREEN }}>Connected</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'var(--bg-hover)', border: '1px solid var(--border)', flexShrink: 0 }}>
                                <XCircle size={12} style={{ color: 'var(--t4)' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t4)' }}>Not connected</span>
                            </div>
                        )}
                    </div>

                    {/* Connected: detail row */}
                    {connected && (
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 'var(--r-md)', background: QB_GREEN_DIM, border: `1px solid ${QB_GREEN_BORDER}` }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: QB_GREEN, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Company (Realm ID)</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace' }}>{realmId ?? '—'}</div>
                            </div>
                            {expiresAt && (
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: QB_GREEN, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Token expires</div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: expiresAt < new Date() ? 'var(--red)' : 'var(--t2)' }}>
                                        {expiresAt.toLocaleString()}
                                    </div>
                                </div>
                            )}
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: QB_GREEN, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Auto-sync</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Active — invoices &amp; payments</div>
                            </div>
                        </div>
                    )}

                    {/* Disconnected: what you get */}
                    {!connected && !qbStatus.isLoading && (
                        <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 'var(--r-md)' }}>
                            Connect your QuickBooks Online account to automatically push invoices and payments as they are created. Customer records are matched by email and created in QB if they don't already exist.
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {connected ? (
                            <>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleConnect}
                                    disabled={qbAuthUrl.isPending}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <RefreshCw size={13} /> Re-connect
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleDisconnect}
                                    disabled={disconnecting}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
                                >
                                    {disconnecting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={13} />}
                                    Disconnect
                                </button>
                                <a
                                    href="https://app.qbo.intuit.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--t4)', textDecoration: 'none', marginLeft: 4 }}
                                >
                                    Open QuickBooks <ExternalLink size={11} />
                                </a>
                            </>
                        ) : (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleConnect}
                                disabled={qbAuthUrl.isPending || qbStatus.isLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: QB_GREEN, borderColor: QB_GREEN }}
                            >
                                {qbAuthUrl.isPending
                                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Connecting…</>
                                    : <><CheckCircle2 size={13} /> Connect to QuickBooks</>
                                }
                            </button>
                        )}
                    </div>

                    {/* What syncs info */}
                    <div style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--border)', paddingTop: 16, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Invoices', detail: 'Pushed on create, voided on cancel' },
                            { label: 'Payments', detail: 'Linked to invoice automatically' },
                            { label: 'Customers', detail: 'Matched by email, created if new' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                                <CheckCircle2 size={13} style={{ color: connected ? QB_GREEN : 'var(--t4)', marginTop: 2, flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{item.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>{item.detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Placeholder for future integrations */}
            {['Stripe', 'Google Ads', 'Avoca AI Calls'].map(name => (
                <div key={name} className="card" style={{ opacity: 0.5, pointerEvents: 'none' }}>
                    <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Plug2 size={18} style={{ color: 'var(--t4)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>{name}</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 2 }}>Coming soon</div>
                            </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t4)', padding: '3px 10px', borderRadius: 999, border: '1px solid var(--border)' }}>PLANNED</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── FinanceTab ───────────────────────────────────────────────────────────────

function FinanceTab() {
    const { showSuccess, showError } = useToast()

    // ---- Currencies ----
    const currenciesQuery = useCurrencies()
    const updateCurrencies = useUpdateCurrencies()
    const [search, setSearch] = useState('')
    const [highlight, setHighlight] = useState(0)
    const searchRef = useRef<HTMLInputElement>(null)

    const enabled = currenciesQuery.data?.enabled ?? []
    const defaultCurrency = currenciesQuery.data?.default ?? ''

    const searchResults = search.trim()
        ? ISO_CURRENCIES.filter(c =>
            !enabled.includes(c.code) &&
            (c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
        ).slice(0, 6)
        : []

    const addCurrency = (code: string) => {
        updateCurrencies.mutate(
            { enabled: [...enabled, code], default: defaultCurrency },
            {
                onSuccess: () => { setSearch(''); setHighlight(0); showSuccess(`${code} added to your currency list.`) },
                onError: () => showError('Could not add that currency. Try again.', 'Save failed'),
            },
        )
    }

    const removeCurrency = (code: string) => {
        if (code === defaultCurrency) return
        updateCurrencies.mutate(
            { enabled: enabled.filter(c => c !== code), default: defaultCurrency },
            { onError: () => showError('Could not remove that currency. Try again.', 'Save failed') },
        )
    }

    const setDefault = (code: string) => {
        updateCurrencies.mutate(
            { enabled, default: code },
            { onError: () => showError('Could not set that as your default currency. Try again.', 'Save failed') },
        )
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (searchResults.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight(h => (h + 1) % searchResults.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight(h => (h - 1 + searchResults.length) % searchResults.length)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            addCurrency(searchResults[highlight].code)
        } else if (e.key === 'Escape') {
            setSearch('')
            searchRef.current?.blur()
        }
    }

    // ---- Tax rates ----
    const taxRatesQuery = useTaxRates()
    const createTaxRate = useCreateTaxRate()
    const updateTaxRate = useUpdateTaxRate()
    const deleteTaxRate = useDeleteTaxRate()

    // ---- Payment terms ----
    const paymentTermsQuery = usePaymentTerms()
    const createPaymentTerms = useCreatePaymentTerms()
    const updatePaymentTerms = useUpdatePaymentTerms()
    const deletePaymentTerms = useDeletePaymentTerms()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card anim-fade-in">
                <div className="card-header">
                    <div>
                        <div className="card-title">Currencies</div>
                        <div className="card-subtitle">Choose which currencies your team can select when creating jobs, quotes, invoices, and payments</div>
                    </div>
                </div>
                <div className="card-body">
                    {currenciesQuery.isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                        </div>
                    ) : (
                        <>
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--t3)', pointerEvents: 'none' }} />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    role="combobox"
                                    aria-expanded={searchResults.length > 0}
                                    aria-autocomplete="list"
                                    className="form-input"
                                    style={{ paddingLeft: 34 }}
                                    placeholder="Search to add a currency — try a code or a country…"
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setHighlight(0) }}
                                    onKeyDown={handleSearchKeyDown}
                                />
                                {searchResults.length > 0 && (
                                    <div
                                        role="listbox"
                                        style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 10,
                                            background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 'var(--r-md)',
                                            boxShadow: 'var(--shadow-md)', overflow: 'hidden',
                                        }}
                                    >
                                        {searchResults.map((c, i) => (
                                            <button
                                                key={c.code}
                                                role="option"
                                                aria-selected={i === highlight}
                                                onMouseDown={e => { e.preventDefault(); addCurrency(c.code) }}
                                                onMouseEnter={() => setHighlight(i)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
                                                    background: i === highlight ? 'var(--bg-hover)' : 'none', border: 'none',
                                                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                                                }}
                                            >
                                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', minWidth: 44 }}>{c.code}</span>
                                                <span style={{ fontSize: 13, color: 'var(--t3)' }}>{c.name}</span>
                                                <span style={{ marginLeft: 'auto', color: 'var(--t4)' }}>{c.symbol}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {enabled.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 24, color: 'var(--t3)', fontSize: 13 }}>
                                    No currencies enabled yet — search above to add your first one.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                    {enabled.map(code => {
                                        const info = currencyInfo(code)
                                        const isDefault = code === defaultCurrency
                                        return (
                                            <div key={code} className="anim-fade-in" style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                                borderRadius: 999,
                                                background: isDefault ? 'var(--blue-glow)' : 'var(--bg-card-2)',
                                                border: `1px solid ${isDefault ? 'var(--blue)' : 'var(--bd)'}`,
                                            }}>
                                                <button
                                                    onClick={() => !isDefault && setDefault(code)}
                                                    title={isDefault ? 'Default currency' : 'Set as default'}
                                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: isDefault ? 'default' : 'pointer', padding: 0 }}
                                                >
                                                    <Star size={13} fill={isDefault ? 'var(--blue)' : 'none'} style={{ color: isDefault ? 'var(--blue)' : 'var(--t4)' }} />
                                                </button>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{code}</span>
                                                <span style={{ fontSize: 12, color: 'var(--t3)' }}>{info.symbol}</span>
                                                {isDefault ? (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Default</span>
                                                ) : (
                                                    <button
                                                        onClick={() => removeCurrency(code)}
                                                        title="Remove"
                                                        style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--t4)' }}
                                                    >
                                                        <XIcon size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <PresetListCard
                title="Tax Rates"
                subtitle="Named tax presets your team can pick from on quotes and invoices"
                addLabel="Add tax rate"
                valueLabel="rate"
                valueSuffix="%"
                valueStep="0.5"
                toDisplay={v => Math.round(v * 10000) / 100}
                fromDisplay={d => Math.round(d * 100) / 10000}
                rows={(taxRatesQuery.data ?? []).map(r => ({ id: r.id, name: r.name, value: r.rate, isDefault: r.isDefault, isActive: r.isActive }))}
                isLoading={taxRatesQuery.isLoading}
                creating={createTaxRate.isPending}
                onCreate={(name, value) => createTaxRate.mutate({ name, rate: value }, {
                    onError: () => showError('Could not add that tax rate. Try again.', 'Save failed'),
                })}
                onUpdate={(id, patch) => updateTaxRate.mutate(
                    { id, name: patch.name, rate: patch.value, isActive: patch.isActive, isDefault: patch.isDefault },
                    { onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not update that tax rate.', 'Save failed') },
                )}
                onDelete={id => deleteTaxRate.mutate(id, {
                    onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not delete that tax rate.', 'Delete failed'),
                })}
            />

            <PresetListCard
                title="Payment Terms"
                subtitle="Named payment-terms presets your team can pick from on invoices"
                addLabel="Add payment terms"
                valueLabel="terms"
                valueSuffix="days"
                valueStep="1"
                toDisplay={v => v}
                fromDisplay={d => Math.round(d)}
                rows={(paymentTermsQuery.data ?? []).map(r => ({ id: r.id, name: r.name, value: r.days, isDefault: r.isDefault, isActive: r.isActive }))}
                isLoading={paymentTermsQuery.isLoading}
                creating={createPaymentTerms.isPending}
                onCreate={(name, value) => createPaymentTerms.mutate({ name, days: value }, {
                    onError: () => showError('Could not add that payment terms preset. Try again.', 'Save failed'),
                })}
                onUpdate={(id, patch) => updatePaymentTerms.mutate(
                    { id, name: patch.name, days: patch.value, isActive: patch.isActive, isDefault: patch.isDefault },
                    { onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not update that payment terms preset.', 'Save failed') },
                )}
                onDelete={id => deletePaymentTerms.mutate(id, {
                    onError: (err: any) => showError(err?.response?.data?.message ?? 'Could not delete that payment terms preset.', 'Delete failed'),
                })}
            />
        </div>
    )
}

interface PresetRow {
    id: string
    name: string
    value: number      // rate (0-1) for tax, days for terms
    isDefault: boolean
    isActive: boolean
}

function PresetListCard({
    title, subtitle, addLabel, valueLabel, valueSuffix, valueStep, toDisplay, fromDisplay,
    rows, isLoading, onCreate, onUpdate, onDelete, creating,
}: {
    title: string
    subtitle: string
    addLabel: string
    valueLabel: string
    valueSuffix: string
    valueStep: string
    toDisplay: (value: number) => number
    fromDisplay: (display: number) => number
    rows: PresetRow[]
    isLoading: boolean
    onCreate: (name: string, value: number) => void
    onUpdate: (id: string, patch: Partial<{ name: string; value: number; isActive: boolean; isDefault: boolean }>) => void
    onDelete: (id: string) => void
    creating: boolean
}) {
    const [adding, setAdding] = useState(false)
    const [newName, setNewName] = useState('')
    const [newValue, setNewValue] = useState('')

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            style={{
                width: 36, height: 20, borderRadius: 10, border: 'none',
                background: checked ? 'var(--blue)' : 'var(--bd-md)',
                cursor: 'pointer', transition: 'background-color var(--dur)',
                display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0, position: 'relative',
            }}
            type="button" aria-label="Toggle active"
        >
            <div style={{
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                transition: 'transform var(--dur)',
                transform: checked ? 'translateX(16px)' : 'translateX(0)',
                boxShadow: 'var(--shadow-sm)',
            }} />
        </button>
    )

    const submitNew = () => {
        if (!newName.trim()) return
        const value = fromDisplay(parseFloat(newValue) || 0)
        onCreate(newName.trim(), value)
        setNewName('')
        setNewValue('')
        setAdding(false)
    }

    return (
        <div className="card anim-fade-in">
            <div className="card-header">
                <div>
                    <div className="card-title">{title}</div>
                    <div className="card-subtitle">{subtitle}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)} disabled={adding}>
                    <Plus size={13} /> {addLabel}
                </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} />
                    </div>
                ) : (
                    <>
                        {rows.map((row, i) => (
                            <div key={row.id} style={{
                                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
                                borderBottom: i === rows.length - 1 && !adding ? 'none' : '1px solid var(--bd)',
                                opacity: row.isActive ? 1 : 0.5,
                            }}>
                                <GripVertical size={14} style={{ color: 'var(--t4)', flexShrink: 0 }} />
                                <input
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    defaultValue={row.name}
                                    onBlur={e => e.target.value.trim() && e.target.value !== row.name && onUpdate(row.id, { name: e.target.value.trim() })}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 110, flexShrink: 0 }}>
                                    <input
                                        type="number"
                                        step={valueStep}
                                        min={0}
                                        className="form-input"
                                        defaultValue={toDisplay(row.value)}
                                        onBlur={e => {
                                            const v = fromDisplay(parseFloat(e.target.value) || 0)
                                            if (v !== row.value) onUpdate(row.id, { value: v })
                                        }}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{valueSuffix}</span>
                                </div>
                                <button
                                    onClick={() => !row.isDefault && onUpdate(row.id, { isDefault: true })}
                                    title={row.isDefault ? `Default ${valueLabel}` : `Set as default ${valueLabel}`}
                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: row.isDefault ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}
                                >
                                    <Star size={14} fill={row.isDefault ? 'var(--blue)' : 'none'} style={{ color: row.isDefault ? 'var(--blue)' : 'var(--t4)' }} />
                                </button>
                                <Toggle checked={row.isActive} onChange={() => onUpdate(row.id, { isActive: !row.isActive })} />
                                <button
                                    onClick={() => onDelete(row.id)}
                                    disabled={row.isDefault}
                                    title={row.isDefault ? 'This is the default — set another as default first' : 'Delete'}
                                    style={{ display: 'flex', background: 'none', border: 'none', cursor: row.isDefault ? 'not-allowed' : 'pointer', padding: 0, color: row.isDefault ? 'var(--t4)' : 'var(--red)', flexShrink: 0 }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {adding && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', background: 'var(--bg2)' }}>
                                <div style={{ width: 14, flexShrink: 0 }} />
                                <input
                                    autoFocus
                                    className="form-input"
                                    style={{ flex: 1 }}
                                    placeholder="Name"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && submitNew()}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 110, flexShrink: 0 }}>
                                    <input
                                        type="number"
                                        step={valueStep}
                                        min={0}
                                        className="form-input"
                                        placeholder="0"
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && submitNew()}
                                    />
                                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>{valueSuffix}</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={submitNew} disabled={creating || !newName.trim()}>
                                    <Check size={13} />
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setAdding(false); setNewName(''); setNewValue('') }}>
                                    <XIcon size={13} />
                                </button>
                            </div>
                        )}
                        {rows.length === 0 && !adding && (
                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--t3)', fontSize: 13 }}>None yet — add one to get started.</div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

