import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { XCircle } from 'lucide-react';

interface AddScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    techs?: any[];
    initialTech?: string;
    initialTime?: string;
}

export function AddScheduleModal({
    isOpen,
    onClose,
    date,
    techs,
    initialTech = '',
    initialTime = ''
}: AddScheduleModalProps) {
    if (!isOpen) return null;

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
                        <h3 className="text-xl font-bold">Create New Schedule</h3>
                        <p className="text-green-100 text-sm mt-1">
                            {date && `For ${format(date, 'EEEE, MMMM d, yyyy')}`}
                        </p>
                    </div>
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors text-white" onClick={onClose}>
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="card-body p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Schedule Title/Description
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., HVAC Maintenance, AC Install"
                            className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                            style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Technician
                            </label>
                            <select
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                defaultValue={initialTech}
                            >
                                <option value="">Select Technician</option>
                                {techs?.map((tech) => (
                                    <option key={tech.name} value={tech.name}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Time
                            </label>
                            <input
                                type="time"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                                defaultValue={initialTime}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                                Customer Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., John Doe"
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
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
                                className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                                style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Service Type
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., HVAC Repair, AC Installation"
                            className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                            style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Location
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Dallas, TX"
                            className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                            style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--t1)' }}>
                            Status
                        </label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-[var(--bd)] focus:outline-none focus:border-green-600 transition-colors"
                            style={{ background: 'var(--bg-body)', color: 'var(--t1)' }}
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-[var(--bd)] px-6 py-4 bg-[var(--bg-body)] rounded-b-xl flex justify-end gap-3">
                    <button
                        className="px-6 py-2 rounded-lg font-medium text-[var(--t3)] hover:bg-[var(--bg-hover)] transition-colors"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent("schedule-created", { detail: { date } }));
                            onClose();
                        }}
                    >
                        Create Schedule
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
