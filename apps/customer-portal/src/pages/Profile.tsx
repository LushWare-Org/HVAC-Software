import { useState } from 'react';
import {
    Mail, Phone, MapPin, Shield, Save, Check,
    User, Lock
} from 'lucide-react';
import { customerData } from '../data/mockData';

export default function Profile() {
    const [tab, setTab] = useState<'personal' | 'security'>('personal');
    const [saved, setSaved] = useState(true);

    const [formData, setFormData] = useState({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (saved) setSaved(false);
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSecurityData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setSaved(true);
    };

    return (
        <div className="anim-fade-up">
            <div className="page-tabs mb-5">
                <button
                    className={`tab-btn ${tab === 'personal' ? 'active' : ''}`}
                    onClick={() => setTab('personal')}
                >
                    <User size={14} /> Personal Info
                </button>
                <button
                    className={`tab-btn ${tab === 'security' ? 'active' : ''}`}
                    onClick={() => setTab('security')}
                >
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
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
                                    onChange={handleProfileChange}
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
                                    value={customerData.memberSince}
                                    readOnly
                                    style={{ opacity: 0.6, cursor: 'default' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setSaved(true)}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSave}>
                                {saved ? (
                                    <><Check size={13} /> Saved</>
                                ) : (
                                    <><Save size={13} /> Save Changes</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'security' && (
                <div className="card anim-fade-in">
                    <div className="card-body">
                        <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--bd)' }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Lock size={16} /> Change Password
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 16 }}>
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
                            <button className="btn btn-primary btn-sm">
                                <Lock size={13} /> Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
