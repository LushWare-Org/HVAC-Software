import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Wrench, Calendar, Plus, CheckCircle } from 'lucide-react';

interface BookServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBooked?: (job: any) => void;
}

type TabType = 'service' | 'schedule';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', borderRadius: 9,
    border: '1px solid #D1D5DB', background: '#fff',
    color: '#111827', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
};

export default function BookServiceModal({ isOpen, onClose, onBooked }: BookServiceModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('service');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        serviceType: 'Maintenance',
        title: '',
        description: '',
        preferredDate: '',
        preferredTime: '09:00',
        urgency: 'normal',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        setIsLoading(true);
        setTimeout(() => {
            onBooked?.({
                id: `JOB-${String(Date.now()).slice(-4)}`,
                service: formData.title || formData.serviceType,
                description: formData.description,
                date: formData.preferredDate,
                status: 'pending',
                technician: 'To be assigned',
                cost: 0,
            });
            setIsLoading(false);
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                setFormData({ serviceType: 'Maintenance', title: '', description: '', preferredDate: '', preferredTime: '09:00', urgency: 'normal', notes: '' });
                setActiveTab('service');
                onClose();
            }, 1800);
        }, 700);
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'service', label: 'Service Details', icon: <Wrench size={14} /> },
        { id: 'schedule', label: 'Schedule', icon: <Calendar size={14} /> },
    ];

    const modal = (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 16, maxWidth: 620, width: '100%',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                    height: 580, overflow: 'hidden',
                    animation: 'modalIn 0.2s ease-out',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    padding: '20px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                }}>
                    <div style={{ color: '#fff' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Request a Service</h2>
                        <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 4 }}>Tell us what you need — we'll schedule a technician for you</p>
                    </div>
                    <button onClick={onClose}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#BFDBFE', cursor: 'pointer' }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '13px 22px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 500,
                                border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                                marginBottom: -1, background: 'none', cursor: 'pointer',
                                color: activeTab === t.id ? '#2563EB' : '#6B7280',
                                transition: 'color 0.15s', fontFamily: 'inherit',
                            }}>
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {submitted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={32} style={{ color: '#16A34A' }} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 5 }}>Request Submitted!</div>
                                <div style={{ fontSize: 13, color: '#6B7280' }}>We'll confirm your appointment via email shortly.</div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'service' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
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
                                                <option value="normal">Normal – Within a week</option>
                                                <option value="high">High – Within 2–3 days</option>
                                                <option value="urgent">Urgent – ASAP</option>
                                            </select>
                                        </BF>
                                        <BF label="Brief Title" style={{ gridColumn: 'span 2' }}>
                                            <input type="text" name="title" value={formData.title} onChange={handleChange}
                                                placeholder="e.g. AC not cooling, furnace makes noise…" style={inputStyle} />
                                        </BF>
                                        <BF label="Describe the Issue" style={{ gridColumn: 'span 2' }}>
                                            <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                                                placeholder="Please describe the problem in detail so we can prepare the right technician and parts…"
                                                style={{ ...inputStyle, resize: 'none', paddingTop: 10, lineHeight: 1.55 }} />
                                        </BF>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                        <BF label="Preferred Date *">
                                            <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange} style={inputStyle} />
                                        </BF>
                                        <BF label="Preferred Time">
                                            <input type="time" name="preferredTime" value={formData.preferredTime} onChange={handleChange} style={inputStyle} />
                                        </BF>
                                        <BF label="Additional Notes" style={{ gridColumn: 'span 2' }}>
                                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
                                                placeholder="Any access instructions, gate codes, pets, or other important info for the technician…"
                                                style={{ ...inputStyle, resize: 'none', paddingTop: 10, lineHeight: 1.55 }} />
                                        </BF>
                                    </div>
                                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px' }}>
                                        <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.6 }}>
                                            <strong>Note:</strong> Our team will confirm your appointment and provide a cost estimate before the visit.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!submitted && (
                    <div style={{
                        background: '#F9FAFB', borderTop: '1px solid #E5E7EB',
                        padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                            {tabs.map(t => (
                                <div key={t.id} style={{ width: 8, height: 8, borderRadius: '50%', background: activeTab === t.id ? '#2563EB' : '#D1D5DB', transition: 'background 0.2s' }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={onClose}
                                style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #D1D5DB', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                            </button>
                            {activeTab === 'service' ? (
                                <button onClick={() => setActiveTab('schedule')}
                                    style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Next →
                                </button>
                            ) : (
                                <button onClick={handleSubmit} disabled={isLoading || !formData.preferredDate}
                                    style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: (isLoading || !formData.preferredDate) ? '#93C5FD' : '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600, cursor: (isLoading || !formData.preferredDate) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                                    <Plus size={14} />{isLoading ? 'Submitting…' : 'Submit Request'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
}

// Helpers
function BF({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
            {children}
        </div>
    );
}
