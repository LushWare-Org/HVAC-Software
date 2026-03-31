import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Clock, MapPin, User, Plus, List, Grid3X3,
    XCircle, Eye
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { AddScheduleModal } from './AddScheduleModal';

interface SchedulingCalendarProps {
    schedules?: Record<string, Record<string, { start: number; span: number; label: string; id: string }[]>>;
    techs?: Array<{ id: string; name: string; color: string; role: string; status: string; statusLabel: string; jobs: number; nextAvailable: string; area: string; currentJob: string }>;
}

const MOCK_APPOINTMENTS = Array.from({ length: 40 }).map((_, i) => {
    const d = new Date();
    d.setDate(Math.floor(Math.random() * 28) + 1);
    return {
        id: `APT-${1000 + i}`,
        date: d.toISOString(),
        time: ['08:00 AM', '10:30 AM', '01:00 PM', '03:30 PM'][Math.floor(Math.random() * 4)],
        duration: [1, 2, 3][Math.floor(Math.random() * 3)],
        customerName: ['Acme Corp', 'John Doe', 'Jane Smith', 'Wayne Ent.', 'Beta LLC', 'Emma Wilson'][Math.floor(Math.random() * 6)],
        serviceType: ['HVAC Repair', 'AC Installation', 'Maintenance', 'Plumbing', 'Electrical'][Math.floor(Math.random() * 5)],
        status: ['confirmed', 'pending', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as 'confirmed' | 'pending' | 'completed' | 'cancelled',
        assignedTo: ['Mike Davis', 'Tom Baker', 'Anna Smith', 'James Lee', 'Chris Park'][Math.floor(Math.random() * 5)],
        location: ['Dallas, TX', 'Fort Worth, TX', 'Arlington, TX', 'Plano, TX', 'Austin, TX'][Math.floor(Math.random() * 5)]
    };
});

const statusConfig = {
    'confirmed': { label: 'Confirmed', bg: 'rgba(34, 197, 94, 0.15)', text: '#16a34a' },
    'pending': { label: 'Pending', bg: 'rgba(251, 146, 60, 0.15)', text: '#ea580c' },
    'completed': { label: 'Completed', bg: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' },
    'cancelled': { label: 'Cancelled', bg: 'rgba(244, 63, 94, 0.15)', text: '#e11d48' },
};

export function SchedulingCalendar({ schedules, techs }: SchedulingCalendarProps) {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
    const [newScheduleDate, setNewScheduleDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        const onOpen = () => setIsDetailOpen(true);
        const onClose = () => setIsDetailOpen(false);
        window.addEventListener('open-scheduling-detail', onOpen);
        window.addEventListener('scheduling-detail-closed', onClose);
        return () => {
            window.removeEventListener('open-scheduling-detail', onOpen);
            window.removeEventListener('scheduling-detail-closed', onClose);
        };
    }, []);

    const convertSchedulesToAppointments = () => {
        if (!schedules) return MOCK_APPOINTMENTS;

        const systemAppointments: any[] = [];
        Object.entries(schedules).forEach(([dateStr, schedulesByTech]: [string, any]) => {
            Object.entries(schedulesByTech).forEach(([techName, scheduleItems]: [string, any]) => {
                const tech = techs?.find((t: any) => t.name === techName);
                (scheduleItems as any[]).forEach((schedule: any) => {
                    systemAppointments.push({
                        id: schedule.id,
                        date: dateStr,
                        label: schedule.label,
                        time: schedule.start !== undefined ? `${8 + schedule.start}:00 AM` : '09:00 AM',
                        duration: schedule.span || 2,
                        techName: techName,
                        role: tech?.role || '',
                        area: tech?.area || '',
                        nextAvailable: tech?.nextAvailable || '',
                        status: 'confirmed',
                        customerName: schedule.label.split(' · ')[1] || schedule.label,
                        serviceType: schedule.label.split(' · ')[1] || schedule.label,
                        assignedTo: techName,
                        location: tech?.area || '',
                    });
                });
            });
        });
        return systemAppointments.length > 0 ? systemAppointments : MOCK_APPOINTMENTS;
    };

    const appointments = convertSchedulesToAppointments();

    const handleScheduleClick = (apt: any) => {
        const schedule = {
            id: apt.id,
            label: apt.label,
            techName: apt.techName,
            role: apt.role,
            serviceArea: apt.area,
            nextAvailable: apt.nextAvailable,
            status: 'scheduled',
            time: apt.time,
            duration: `${apt.duration} hours`,
            location: apt.location
        };
        window.dispatchEvent(new CustomEvent("open-scheduling-detail", { detail: schedule }));
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayIndex = getDay(monthStart);

    const getAppointmentsForDate = (date: Date) => {
        return appointments.filter(apt => isSameDay(new Date(apt.date), date));
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="anim-fade-up space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 rounded-xl p-1 border border-[var(--bd)] bg-[var(--bg-card)] shadow-sm">
                    <div className="flex items-center p-1 rounded-lg">
                        <button
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${viewMode === 'calendar'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-[var(--t3)] hover:bg-[var(--bg-hover)]'
                                }`}
                            onClick={() => setViewMode('calendar')}
                        >
                            <Grid3X3 className="w-4 h-4" /> <span className="whitespace-nowrap">Calendar</span>
                        </button>
                        <button
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${viewMode === 'list'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-[var(--t3)] hover:bg-[var(--bg-hover)]'
                                }`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" /> <span className="whitespace-nowrap">List View</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors" onClick={handlePrevMonth}>
                        <ChevronLeft size={24} className="text-[var(--t3)]" />
                    </button>
                    <div className="min-w-[200px] text-center">
                        <h2 className="text-3xl font-bold" style={{ color: isLight ? '#FFFFFF' : 'var(--t1)' }}>
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                    </div>
                    <button className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors" onClick={handleNextMonth}>
                        <ChevronRight size={24} className="text-[var(--t3)]" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setShowAddScheduleModal(true);
                            setNewScheduleDate(currentDate);
                        }}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="whitespace-nowrap uppercase tracking-wider text-[12px]">New Appointment</span>
                    </button>
                </div>
            </div>

            <div className="card shadow-xl border-[var(--bd)] overflow-hidden">
                <div className="card-body p-0">
                    {viewMode === 'calendar' ? (
                        <div className="overflow-hidden" style={{ borderRadius: '0 0 var(--r) var(--r)' }}>
                            <div className="grid grid-cols-7 border-b border-[var(--bd)]" style={{ background: 'var(--bg-body)' }}>
                                {weekDays.map(day => (
                                    <div key={day} className="py-3 text-center text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--t3)' }}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 border-b border-[var(--bd)] gap-[1px] bg-[var(--bd)]">
                                {Array.from({ length: startingDayIndex }).map((_, index) => (
                                    <div key={`empty-${index}`} className="min-h-[140px]" style={{ background: 'var(--bg-body)' }} />
                                ))}

                                {daysInMonth.map((date) => {
                                    const dayAppointments = getAppointmentsForDate(date);
                                    const isToday = isSameDay(date, new Date());
                                    const isCurrentMonth = isSameMonth(date, currentDate);

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className="min-h-[140px] p-2 cursor-pointer transition-colors relative"
                                            style={{
                                                background: 'var(--bg-card)',
                                                opacity: isCurrentMonth ? 1 : 0.6
                                            }}
                                            onClick={() => {
                                                setSelectedDate(date);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-semibold flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-[var(--primary)] text-white' : ''
                                                    }`} style={{ color: isToday ? '#fff' : 'var(--t2)' }}>
                                                    {format(date, 'd')}
                                                </span>
                                                {dayAppointments.length > 0 && (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-hover)', color: 'var(--t3)' }}>
                                                        {dayAppointments.length}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 relative z-10">
                                                {dayAppointments.slice(0, 3).map((apt) => {
                                                    const config = statusConfig[apt.status as keyof typeof statusConfig];
                                                    return (
                                                        <div
                                                            key={apt.id}
                                                            className="text-xs px-2 py-1.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity border"
                                                            style={{ background: config.bg, color: config.text, borderColor: `${config.text}40` }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDate(date);
                                                            }}
                                                        >
                                                            <div className="font-semibold">{apt.time}</div>
                                                            <div className="truncate">{apt.customerName}</div>
                                                        </div>
                                                    )
                                                })}
                                                {dayAppointments.length > 3 && (
                                                    <div className="text-xs text-center font-medium mt-1" style={{ color: 'var(--t3)' }}>
                                                        +{dayAppointments.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 pointer-events-none transition-opacity"></div>
                                        </div>
                                    );
                                })}
                                {Array.from({ length: (7 - ((startingDayIndex + daysInMonth.length) % 7)) % 7 }).map((_, index) => (
                                    <div key={`empty-end-${index}`} className="min-h-[140px]" style={{ background: 'var(--bg-body)' }} />
                                ))}

                            </div>
                        </div>
                    ) : (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: '800px', overflowY: 'auto' }}>
                            {(() => {
                                const filteredApts = appointments
                                    .filter(apt => isSameMonth(new Date(apt.date), currentDate))
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                if (filteredApts.length === 0) {
                                    return (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 border border-[var(--bd)]">
                                                <CalendarIcon className="w-8 h-8 text-[var(--t4)]" />
                                            </div>
                                            <h3 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>No schedules found</h3>
                                            <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
                                                There are no appointments scheduled for {format(currentDate, 'MMMM yyyy')}.
                                            </p>
                                        </div>
                                    );
                                }

                                return filteredApts.map((apt) => {
                                    const config = statusConfig[apt.status as keyof typeof statusConfig];
                                    return (
                                        <div
                                            key={apt.id}
                                            className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors border border-[var(--bd)] hover:border-[var(--primary)]"
                                            style={{ background: 'var(--bg-hover)' }}
                                            onClick={() => setSelectedDate(new Date(apt.date))}
                                        >
                                            <div className="w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border border-[var(--bd)]" style={{ background: 'var(--bg-card)' }}>
                                                <span className="text-xs uppercase font-bold text-[var(--primary)]">
                                                    {format(new Date(apt.date), 'MMM')}
                                                </span>
                                                <span className="text-xl font-bold" style={{ color: 'var(--t1)' }}>
                                                    {format(new Date(apt.date), 'd')}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <p className="font-semibold text-base" style={{ color: 'var(--t1)' }}>{apt.serviceType}</p>
                                                    <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: config.bg, color: config.text }}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium" style={{ color: 'var(--t2)' }}>{apt.customerName}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: 'var(--t3)' }}>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {apt.time} ({apt.duration} hrs)
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="w-4 h-4" />
                                                        {apt.assignedTo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--t3)' }}>
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[120px]">{apt.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="btn btn-secondary btn-sm flex items-center gap-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date(apt.date)); }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>
            </div>


            {selectedDate && createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 admin-modal-backdrop"
                    style={{ zIndex: (showAddScheduleModal || isDetailOpen) ? 9999 : 10000 }}
                    role="dialog"
                    aria-modal="true"
                >
                    {(!showAddScheduleModal && !isDetailOpen) && (
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-md anim-fade-in"
                            onClick={() => setSelectedDate(null)}
                        />
                    )}
                    {/* Modal */}
                    <div className="card w-full max-w-2xl shadow-2xl relative admin-modal-box" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--bd)', maxHeight: '80vh', position: 'relative', zIndex: 1 }}>
                        <div className="sticky top-0 card-header border-b border-[var(--bd)] flex items-center justify-between py-5 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
                            <div className="text-white flex-1">
                                <h3 className="text-xl font-bold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
                                <p className="text-blue-100 text-sm mt-1">View and manage schedules for this date</p>
                            </div>
                            <button className="p-2 hover:bg-white/20 rounded-full transition-colors text-white" onClick={() => setSelectedDate(null)}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="card-body p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                            {(() => {
                                const schedulesForDate = getAppointmentsForDate(selectedDate);
                                if (schedulesForDate.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 border border-[var(--bd)]">
                                                <CalendarIcon className="w-8 h-8 text-[var(--t4)]" />
                                            </div>
                                            <h4 className="text-lg font-bold" style={{ color: 'var(--t1)' }}>No schedules</h4>
                                            <p className="text-sm mt-2" style={{ color: 'var(--t3)' }}>
                                                No schedules found for this date. Create one to get started!
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-3">
                                        {schedulesForDate.map((schedule) => {
                                            const config = statusConfig[schedule.status as keyof typeof statusConfig];
                                            return (
                                                <div
                                                    key={schedule.id}
                                                    className="p-4 rounded-xl border border-[var(--bd)] cursor-pointer transition-all hover:shadow-md hover:border-blue-500"
                                                    style={{ background: 'var(--bg-hover)' }}
                                                    onClick={() => {
                                                        handleScheduleClick(schedule);
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-base mb-1" style={{ color: 'var(--t1)' }}>
                                                                {schedule.label}
                                                            </h4>
                                                            <p className="text-sm mb-2" style={{ color: 'var(--t3)' }}>
                                                                Technician: <span style={{ color: 'var(--t1)' }}>{schedule.techName}</span>
                                                            </p>
                                                            <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: 'var(--t3)' }}>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {schedule.time || '09:00 AM'} ({schedule.duration || 2} hrs)
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    {schedule.location || 'Site Office'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="text-xs px-3 py-1 rounded-full font-medium" style={{
                                                                    background: config.bg,
                                                                    color: config.text
                                                                }}>
                                                                    {config.label}
                                                                </div>
                                                                <div className="text-xs px-3 py-1 rounded-full font-medium text-blue-600" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                                                    {schedule.role || 'No role'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Eye size={20} className="text-blue-600 flex-shrink-0 ml-2" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="border-t border-[var(--bd)] px-6 py-4 bg-[var(--bg-body)] rounded-b-xl flex justify-end gap-3">
                            <button
                                className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                                onClick={() => {
                                    setShowAddScheduleModal(true);
                                    setNewScheduleDate(selectedDate);
                                }}
                            >
                                + Add New Schedule
                            </button>
                            <button
                                className="px-6 py-2 rounded-lg font-medium text-[var(--t3)] hover:bg-[var(--bg-hover)] transition-colors"
                                onClick={() => setSelectedDate(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <AddScheduleModal
                isOpen={showAddScheduleModal}
                onClose={() => setShowAddScheduleModal(false)}
                date={newScheduleDate}
                techs={techs}
            />
        </div>
    );
}
