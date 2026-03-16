import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, XCircle } from 'lucide-react';

interface CancelJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    job: any | null;
    onConfirm?: (jobId: string, reason: string) => void;
}

const CANCEL_REASONS = [
    'Schedule conflict',
    'Service no longer needed',
    'Found another provider',
    'Financial reasons',
    'Other',
];

export default function CancelJobModal({ isOpen, onClose, job, onConfirm }: CancelJobModalProps) {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !job) return null;

    const handleConfirm = () => {
        setIsLoading(true);
        const finalReason = reason === 'Other' ? customReason : reason;
        setTimeout(() => {
            onConfirm?.(job.id, finalReason);
            setIsLoading(false);
            setReason('');
            setCustomReason('');
            onClose();
        }, 500);
    };

    const modal = (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%',
                    display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
                    overflow: 'hidden', animation: 'modalIn 0.2s ease-out',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Cancel Job</h2>
                            <p style={{ color: '#BFDBFE', fontSize: 12, marginTop: 1 }}>{job.id} · {job.service}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: '#BFDBFE', cursor: 'pointer',
                        }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <XCircle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', marginBottom: 3 }}>
                                This action cannot be undone
                            </p>
                            <p style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>
                                Cancelling this job will notify the assigned technician and remove it from the schedule. Contact us if you need to reschedule instead.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                            Reason for Cancellation *
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {CANCEL_REASONS.map(r => (
                                <label
                                    key={r}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                        border: `1px solid ${reason === r ? '#2563EB' : '#E5E7EB'}`,
                                        background: reason === r ? '#EFF6FF' : '#fff',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <input
                                        type="radio" name="reason" value={r}
                                        checked={reason === r}
                                        onChange={() => { setReason(r); setCustomReason(''); }}
                                        style={{ accentColor: '#2563EB' }}
                                    />
                                    <span style={{ fontSize: 13, color: reason === r ? '#1D4ED8' : '#374151', fontWeight: reason === r ? 500 : 400 }}>{r}</span>
                                </label>
                            ))}
                        </div>

                        {reason === 'Other' && (
                            <textarea
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder="Please describe your reason…"
                                rows={3}
                                style={{
                                    marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 8,
                                    border: '1px solid #D1D5DB', background: '#fff', fontSize: 13,
                                    fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box',
                                }}
                            />
                        )}
                    </div>
                </div>

                <div style={{
                    background: '#F9FAFB', borderTop: '1px solid #E5E7EB',
                    padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
                    flexShrink: 0,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px', borderRadius: 8, border: '1px solid #D1D5DB',
                            background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        Keep Job
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason || isLoading}
                        style={{
                            padding: '8px 20px', borderRadius: 8, border: 'none',
                            background: !reason ? '#FCA5A5' : '#DC2626', color: '#fff', fontSize: 13, fontWeight: 600,
                            cursor: !reason ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                            opacity: isLoading ? 0.7 : 1,
                        }}
                    >
                        <XCircle size={14} />
                        {isLoading ? 'Cancelling…' : 'Cancel Job'}
                    </button>
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
}
