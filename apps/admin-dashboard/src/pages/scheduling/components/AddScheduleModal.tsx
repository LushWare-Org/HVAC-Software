import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { XCircle, Loader2, AlertCircle, Search } from 'lucide-react';
import { useManualAssign } from '../../../hooks/useScheduling';
import { useJobs } from '../../../hooks/useJobs';
import type { Job } from '../../../types/api';

interface AddScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    techs?: { id: string; name: string }[];
    initialTechId?: string;
    initialTech?: string;
    initialTime?: string;
}

export function AddScheduleModal({
    isOpen,
    onClose,
    date,
    techs = [],
    initialTechId = '',
    initialTech = '',
    initialTime = '',
}: AddScheduleModalProps) {
    const [jobId, setJobId]             = useState('');
    const [jobSearch, setJobSearch]     = useState('');
    const [showJobDrop, setShowJobDrop] = useState(false);
    const [techId, setTechId]           = useState(initialTechId);
    const [serviceType, setServiceType] = useState('');
    const [jobLat, setJobLat]           = useState(0);
    const [jobLng, setJobLng]           = useState(0);
    const [time, setTime]               = useState(initialTime);
    const [duration, setDuration]       = useState('1');
    const [notes, setNotes]             = useState('');
    const [error, setError]             = useState('');

    const manualAssign = useManualAssign();
    const jobsQuery = useJobs({ limit: 100, search: jobSearch || undefined });
    const jobs: Job[] = jobsQuery.data?.data ?? [];

    const selectJob = (job: Job) => {
        setJobId(job.id);
        setJobSearch(`${job.title} (${job.id.substring(0, 8)})`);
        setShowJobDrop(false);
        if (job.jobTypeName) setServiceType(job.jobTypeName);
        setJobLat(parseFloat(job.serviceLatitude ?? '0') || 0);
        setJobLng(parseFloat(job.serviceLongitude ?? '0') || 0);
    };

    // Sync initial values when they change (user clicks a different slot)
    useEffect(() => {
        setTechId(initialTechId);
    }, [initialTechId]);

    useEffect(() => {
        setTime(initialTime);
    }, [initialTime]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setError('');

        if (!jobId.trim()) {
            setError('Job ID is required.');
            return;
        }
        if (!techId) {
            setError('Please select a technician.');
            return;
        }

        // Build ISO scheduledStart from selected date + time
        let scheduledStart: string | undefined;
        let scheduledEnd: string | undefined;

        if (date && time) {
            const [hh, mm] = time.split(':');
            const start = new Date(date);
            start.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
            scheduledStart = start.toISOString();

            const end = new Date(start);
            end.setHours(end.getHours() + (parseInt(duration, 10) || 1));
            scheduledEnd = end.toISOString();
        }

        manualAssign.mutate(
            {
                jobId: jobId.trim(),
                technicianId: techId,
                jobLatitude: jobLat,
                jobLongitude: jobLng,
                scheduledStart,
                scheduledEnd,
                notes: notes.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setJobId('');
                    setJobSearch('');
                    setServiceType('');
                    setJobLat(0);
                    setJobLng(0);
                    setNotes('');
                    setError('');
                    window.dispatchEvent(new CustomEvent('schedule-created', { detail: { date } }));
                    onClose();
                },
                onError: (err: any) => {
                    setError(err?.response?.data?.error ?? 'Failed to create assignment. Please try again.');
                },
            }
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md anim-fade-in"
                onClick={onClose}
            />
            <div className="card w-full max-w-2xl shadow-2xl relative" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', position: 'relative', zIndex: 1 }}>
                <div className="card-header border-b border-[var(--bd)] flex items-center justify-between py-5 px-6 bg-gradient-to-r from-green-600 to-green-700">
                    <div className="text-white flex-1">
                        <h3 className="text-xl font-bold">Assign Job to Technician</h3>
                        <p className="text-green-100 text-sm mt-1">
                            {date && `For ${format(date, 'EEEE, MMMM d, yyyy')}`}
                            {initialTech && ` · ${initialTech}`}
                        </p>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors text-white" onClick={onClose}>
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="card-body p-6 space-y-4">

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div style={{ position: 'relative' }}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Job <span className="text-red-500">*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t4)' }} />
                            <input
                                type="text"
                                placeholder="Search jobs..."
                                value={jobSearch}
                                onChange={e => { setJobSearch(e.target.value); setJobId(''); setShowJobDrop(true); }}
                                onFocus={() => setShowJobDrop(true)}
                                onBlur={() => setTimeout(() => setShowJobDrop(false), 200)}
                                disabled={manualAssign.isPending}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                            />
                        </div>
                        {showJobDrop && jobs.length > 0 && (
                            <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 50, maxHeight: 200, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--bd)', borderRadius: 8, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                                {jobs.slice(0, 20).map(j => (
                                    <div
                                        key={j.id}
                                        className="cursor-pointer hover:bg-[var(--bg-hover)]"
                                        style={{ padding: '8px 12px', fontSize: 13 }}
                                        onMouseDown={() => selectJob(j)}
                                    >
                                        <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{j.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--t4)' }}>
                                            {j.customerName ?? 'No customer'} · {j.status} · {j.id.substring(0, 8)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Technician <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                value={techId}
                                onChange={e => setTechId(e.target.value)}
                                disabled={manualAssign.isPending}
                            >
                                <option value="">Select Technician</option>
                                {techs.map((tech) => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Scheduled Time
                            </label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                disabled={manualAssign.isPending}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Service Type
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., HVAC Repair, AC Installation"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                value={serviceType}
                                onChange={e => setServiceType(e.target.value)}
                                disabled={manualAssign.isPending}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Duration (hours)
                            </label>
                            <input
                                type="number"
                                placeholder="e.g., 2"
                                min="1"
                                max="12"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                disabled={manualAssign.isPending}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Notes
                        </label>
                        <textarea
                            placeholder="Any special instructions or notes for the technician…"
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors resize-none"
                            style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={manualAssign.isPending}
                        />
                    </div>
                </div>

                <div className="border-t border-[var(--bd)] px-6 py-4 bg-[var(--bg-body)] rounded-b-xl flex justify-end gap-3">
                    <button
                        className="px-6 py-2 rounded-lg font-medium text-[var(--t3)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                        onClick={onClose}
                        disabled={manualAssign.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
                        onClick={handleSubmit}
                        disabled={manualAssign.isPending}
                    >
                        {manualAssign.isPending && <Loader2 size={14} className="animate-spin" />}
                        {manualAssign.isPending ? 'Assigning…' : 'Assign Job'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
