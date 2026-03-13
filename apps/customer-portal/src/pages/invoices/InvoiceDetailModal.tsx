import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, FileText, Calendar, Download, CreditCard } from 'lucide-react';

interface InvoiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any | null;
}

type TabType = 'details' | 'items' | 'activity';

const STATUS_MAP: Record<string, { label: string; css: string }> = {
    paid: { label: 'Paid', css: 'badge-green' },
    pending: { label: 'Pending', css: 'badge-amber' },
    overdue: { label: 'Overdue', css: 'badge-red' },
};

const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#F9FAFB',
    color: '#374151', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    cursor: 'default',
};

export default function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('details');

    useEffect(() => {
        if (invoice) setActiveTab('details');
    }, [invoice]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !invoice) return null;

    const status = STATUS_MAP[invoice.status] ?? { label: invoice.status, css: 'badge-neutral' };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'details', label: 'Invoice Details', icon: <FileText size={14} /> },
        { id: 'items', label: 'Line Items', icon: <CreditCard size={14} /> },
        { id: 'activity', label: 'Activity', icon: <Calendar size={14} /> },
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
                    background: '#fff', borderRadius: 16, maxWidth: 700, width: '100%',
                    display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                    height: 640, overflow: 'hidden', animation: 'modalIn 0.2s ease-out',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    padding: '20px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ color: '#fff', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ color: '#BFDBFE', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em' }}>
                                {invoice.id}
                            </span>
                            <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>
                                {status.label}
                            </span>
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
                            {invoice.items?.[0] || 'Invoice'}
                        </h2>
                        <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 2 }}>
                            Amount due: ${invoice.amount?.toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 36, height: 36, borderRadius: 9, border: 'none',
                            background: 'rgba(255,255,255,0.15)', color: '#BFDBFE', cursor: 'pointer',
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#BFDBFE'; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '13px 22px', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 500,
                                border: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                                marginBottom: -1, background: 'none', cursor: 'pointer',
                                color: activeTab === t.id ? '#2563EB' : '#6B7280',
                                transition: 'color 0.15s', fontFamily: 'inherit',
                            }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
                    {activeTab === 'details' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <InvField label="Invoice Number">
                                <div style={fieldStyle}>{invoice.id}</div>
                            </InvField>
                            <InvField label="Status">
                                <span className={`badge ${status.css}`} style={{ fontSize: 13 }}>{status.label}</span>
                            </InvField>
                            <InvField label="Amount">
                                <div style={fieldStyle}>${invoice.amount?.toLocaleString()}</div>
                            </InvField>
                            <InvField label="Issue Date">
                                <div style={fieldStyle}>{invoice.date}</div>
                            </InvField>
                            <InvField label="Due Date">
                                <div style={{ ...fieldStyle, color: invoice.status === 'overdue' ? '#DC2626' : '#374151' }}>
                                    {invoice.dueDate}
                                </div>
                            </InvField>
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</span>
                            </div>
                            {(invoice.items || []).map((item: string, i: number) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
                                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item}</span>
                                    <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>
                                        ${(invoice.amount / invoice.items.length).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '14px 0', marginTop: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Total</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>${invoice.amount?.toLocaleString()}</span>
                            </div>

                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16, marginTop: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                                    <span style={{ color: '#6B7280' }}>Subtotal</span>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>${invoice.amount?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                                    <span style={{ color: '#6B7280' }}>Tax (0%)</span>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>$0.00</span>
                                </div>
                                <div style={{ height: 1, background: '#BFDBFE', margin: '10px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                                    <span style={{ fontWeight: 700, color: '#1D4ED8' }}>Amount Due</span>
                                    <span style={{ fontWeight: 700, color: '#1D4ED8' }}>${invoice.amount?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { event: 'Invoice created', date: invoice.date, icon: '📄' },
                                { event: `Payment ${invoice.status === 'paid' ? 'received' : 'pending'}`, date: invoice.dueDate, icon: invoice.status === 'paid' ? '✅' : '⏳' },
                            ].map((a, i) => (
                                <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{a.event}</div>
                                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{a.date}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{
                    background: '#F9FAFB', borderTop: '1px solid #E5E7EB',
                    padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                    flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '9px 24px', borderRadius: 9, border: '1px solid #D1D5DB',
                            background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Close
                    </button>
                    <button
                        style={{
                            padding: '9px 18px', borderRadius: 9, border: '1px solid #2563EB',
                            background: 'transparent', color: '#2563EB', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        title="Download PDF"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                    {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                        <button
                            style={{
                                padding: '9px 24px', borderRadius: 9, border: 'none',
                                background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            onClick={() => {
                                onClose();
                                alert('Please use the Pay Now button on the invoice list.');
                            }}
                        >
                            <CreditCard size={14} /> Pay Now
                        </button>
                    )}
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
}

function InvField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </label>
            {children}
        </div>
    );
}
