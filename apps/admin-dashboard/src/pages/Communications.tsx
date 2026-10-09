import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
    MessageSquare, Send, Bell, Check, AlertCircle, RefreshCw, Loader2, Megaphone, Info, CheckCircle2, AlertTriangle, XCircle, Activity,
} from 'lucide-react'
import {
    useNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useSendInAppNotification,
} from '../hooks/useComms'
import { useChatUnread, useConversations } from '../hooks/useChat'
import { useCustomers } from '../hooks/useCustomers'
import { useTeamMembers } from '../hooks/useTeam'
import { useAuth } from '../contexts/AuthContext'
import type { Customer } from '../types/api'
import ChatPanel from './communications/ChatPanel'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSmartDate(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (d.toDateString() === now.toDateString()) return `Today at ${time}`
    const yest = new Date(now); yest.setDate(yest.getDate() - 1)
    if (d.toDateString() === yest.toDateString()) return `Yesterday at ${time}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Skeleton({ h = 14, w = '100%' }: { h?: number; w?: string }) {
    return <div style={{ width: w, height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

const NOTIF_COLORS: Record<string, { bg: string; text: string }> = {
    success: { bg: 'var(--green-dim)', text: 'var(--green)' },
    warning: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
    error:   { bg: 'var(--red-dim)',   text: 'var(--red)'   },
    info:    { bg: 'var(--blue-dim)',  text: 'var(--blue)'  },
    sent:    { bg: 'var(--bg-hover)',  text: 'var(--t2)'    },
}

const NOTIF_ICON: Record<string, any> = {
    info:    Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error:   XCircle,
    sent:    Send,
}

const NOTIF_TYPE_BADGE: Record<string, string> = {
    info:    'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    error:   'bg-red-50 text-red-700 border-red-200',
    sent:    'bg-slate-50 text-slate-700 border-slate-200',
}

const BROADCAST_ROLE_OPTIONS = [
    { id: 'all', label: 'All Users' },
    { id: 'technician', label: 'Technicians' },
    { id: 'dispatcher', label: 'Dispatchers' },
    { id: 'company_admin', label: 'Company Admins' },
    { id: 'customer', label: 'Customers' },
] as const

const NOTIFICATION_TYPES = [
    { id: 'info', label: 'Info' },
    { id: 'success', label: 'Success' },
    { id: 'warning', label: 'Warning' },
    { id: 'error', label: 'Urgent' },
] as const

function fullCustomerName(customer: Customer) {
    return `${customer.firstName} ${customer.lastName}`.trim()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Communications() {
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [activeTab, setActiveTab]           = useState('messages')
    const [notificationTitle, setNotificationTitle] = useState('')
    const [notificationBody, setNotificationBody] = useState('')
    const [notificationType, setNotificationType] = useState('info')
    const [selectedRoles, setSelectedRoles] = useState<string[]>(['customer'])
    const [sendSuccessMsg, setSendSuccessMsg] = useState('')

    // Opened from elsewhere (e.g. a job's "Message technician"): start or open that conversation.
    const [openWith, setOpenWith] = useState<{ with: 'technician'; techUserId: string } | { with: 'customer'; customerId: string } | null>(null)
    useEffect(() => {
        const nav = location.state as any
        if (nav?.chatWith) {
            setActiveTab('messages')
            setOpenWith(nav.chatWith)
            navigate('/communications', { replace: true, state: {} })
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── API queries ──────────────────────────────────────────────────────────────
    const notifsQuery    = useNotifications(50)
    const markNotifRead     = useMarkNotificationRead()
    const markAllRead       = useMarkAllNotificationsRead()
    const sendInAppNotification = useSendInAppNotification()
    const teamQuery = useTeamMembers({ page: 1, limit: 200, isActive: true })
    const customersQuery = useCustomers({ page: 1, limit: 200, isActive: true })

    // Office chat: counts for the strip above the tabs.
    const chatList = useConversations()
    const chatUnread = useChatUnread()
    const conversations = chatList.data?.data ?? []
    const notifications = notifsQuery.data?.data ?? []
    const inboxNotifications = notifications.filter((n) => n.type !== 'sent')
    const sentNotifications = notifications.filter((n) => n.type === 'sent')
    const unreadCount   = inboxNotifications.filter(n => !n.isRead).length
    const teamMembers = teamQuery.data?.data ?? []
    const customers = customersQuery.data?.data ?? []
    const canBroadcast = ['super_admin', 'company_admin', 'dispatcher', 'office_manager'].includes(user?.role ?? '')

    const resolvedRecipients = (() => {
        const wantsAll = selectedRoles.includes('all')
        const wantsCustomers = wantsAll || selectedRoles.includes('customer')
        const wantsStaff = wantsAll || selectedRoles.some((role) => role !== 'customer')
        const recipients = new Map<string, { recipientId: string; recipientName?: string; customerId?: string; role?: string }>()

        if (wantsCustomers) {
            customers.forEach((customer) => {
                recipients.set(customer.id, {
                    recipientId: customer.id,
                    recipientName: fullCustomerName(customer),
                    customerId: customer.id,
                    role: 'customer',
                })
            })
        }

        if (wantsStaff) {
            teamMembers.forEach((member) => {
                const role = member.role?.toLowerCase()
                const matches = wantsAll ||
                    (selectedRoles.includes('technician') && role === 'technician') ||
                    (selectedRoles.includes('dispatcher') && role === 'dispatcher') ||
                    (selectedRoles.includes('company_admin') && ['company_admin', 'office_manager', 'super_admin'].includes(role))

                if (matches) {
                    recipients.set(member.id, {
                        recipientId: member.id,
                        recipientName: member.name,
                        role: member.role,
                    })
                }
            })
        }

        return Array.from(recipients.values())
    })()

    const selectedRoleLabels = BROADCAST_ROLE_OPTIONS
        .filter((option) => selectedRoles.includes(option.id))
        .map((option) => option.label)

    const canSubmitNotification = canBroadcast && notificationTitle.trim() && notificationBody.trim() && resolvedRecipients.length > 0

    const toggleRole = (roleId: string) => {
        setSelectedRoles((current) => {
            if (roleId === 'all') {
                return current.includes('all') ? [] : ['all']
            }

            const next = current.filter((role) => role !== 'all')
            return next.includes(roleId)
                ? next.filter((role) => role !== roleId)
                : [...next, roleId]
        })
    }

    const handleSendNotification = () => {
        if (!canSubmitNotification) return

        sendInAppNotification.mutate(
            {
                title: notificationTitle.trim(),
                body: notificationBody.trim(),
                type: notificationType,
                roles: selectedRoles,
                recipients: resolvedRecipients,
            },
            {
                onSuccess: () => {
                    setSendSuccessMsg(`Sent to ${resolvedRecipients.length} recipient${resolvedRecipients.length !== 1 ? 's' : ''}.`)
                    setTimeout(() => setSendSuccessMsg(''), 5000)
                    setNotificationTitle('')
                    setNotificationBody('')
                    setNotificationType('info')
                    setSelectedRoles(['customer'])
                },
            },
        )
    }

    return (
        <div className="anim-fade-up">
            {/* ── KPI strip — CM1 ──────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Conversations', value: chatList.isLoading ? '—' : conversations.length, icon: MessageSquare, grad: 'kpi-grad-blue', onClick: () => setActiveTab('messages') },
                    { label: 'Unread', value: chatUnread.isLoading ? '—' : (chatUnread.data?.total ?? 0), icon: Bell, grad: 'kpi-grad-amber', onClick: () => setActiveTab('messages') },
                    { label: 'Customers', value: chatList.isLoading ? '—' : conversations.filter(c => c.kind === 'CUSTOMER_OFFICE').length, icon: Activity, grad: 'kpi-grad-green', onClick: () => setActiveTab('messages') },
                    { label: 'Technicians', value: chatList.isLoading ? '—' : conversations.filter(c => c.kind === 'TECH_OFFICE').length, icon: CheckCircle2, grad: 'kpi-grad-violet', onClick: () => setActiveTab('messages') },
                ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ cursor: 'pointer' }} onClick={k.onClick}>
                        <div className="kpi-card-top">
                            <span className="kpi-label">{k.label}</span>
                            <div className={`kpi-icon-box ${k.grad}`} style={{ color: 'white' }}>
                                <k.icon size={16} />
                            </div>
                        </div>
                        <div className="kpi-value">{k.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────────── */}
            <div className="page-tabs">
                <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
                    <MessageSquare size={14} /> Messages
                </button>
                <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                    <Bell size={14} /> Notifications
                    {unreadCount > 0 && <span className="tab-count">{unreadCount}</span>}
                </button>
            </div>

            <div className="anim-fade-up delay-1">

                {/* ── Messages tab ─────────────────────────────────────────────── */}
                {activeTab === 'messages' && <ChatPanel openWith={openWith} onOpened={() => setOpenWith(null)} />}

                {/* ── Notifications tab ────────────────────────────────────────── */}
                {activeTab === 'notifications' && (
                    <div className="card p-0 overflow-hidden">
                        <div className="card-header border-b border-[var(--bd)] p-5">
                            <div>
                                <div className="card-title text-[16px]">Notifications Center</div>
                                <div className="card-subtitle mt-1">Role-targeted in-app announcements and incoming alerts</div>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm h-[32px]"
                                onClick={() => markAllRead.mutate()}
                                disabled={markAllRead.isPending || unreadCount === 0}
                            >
                                {markAllRead.isPending ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />}
                                Mark All Read
                            </button>
                        </div>

                        <div className="border-b border-[var(--bd)] p-5 bg-[var(--bg-surface)]">
                            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center shrink-0">
                                            <Megaphone size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-[var(--t1)]">Send In-App Notification</h3>
                                            <p className="text-xs text-[var(--t3)] mt-1">Broadcast announcements to customers, technicians, dispatchers, or company admins without mixing them into chat threads.</p>
                                        </div>
                                    </div>

                                    {!canBroadcast && (
                                        <div className="flex items-center gap-2 rounded-[var(--r)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            <AlertCircle size={14} /> Only dispatchers and admins can send broadcast notifications.
                                        </div>
                                    )}

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--t3)] mb-1.5">Title</label>
                                            <input
                                                value={notificationTitle}
                                                onChange={(e) => setNotificationTitle(e.target.value)}
                                                placeholder="Service update, outage, route change..."
                                                className="w-full px-3 py-2.5 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                                                disabled={!canBroadcast}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--t3)] mb-1.5">Priority</label>
                                            <select
                                                value={notificationType}
                                                onChange={(e) => setNotificationType(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                                                disabled={!canBroadcast}
                                            >
                                                {NOTIFICATION_TYPES.map((option) => (
                                                    <option key={option.id} value={option.id}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--t3)] mb-1.5">Message</label>
                                        <textarea
                                            value={notificationBody}
                                            onChange={(e) => setNotificationBody(e.target.value)}
                                            placeholder="Write the announcement your selected audience should receive in their topbar inbox."
                                            className="w-full min-h-[120px] px-3 py-3 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)] resize-none"
                                            disabled={!canBroadcast}
                                        />
                                    </div>
                                    <div className="flex justify-end -mt-1">
                                        <span className={`text-[11px] ${notificationBody.length > 450 ? 'text-amber-500' : 'text-[var(--t4)]'}`}>
                                            {notificationBody.length}/500
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-[var(--r)] border border-[var(--bd)] bg-[var(--bg-card)] p-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--t3)] mb-2">Audience</label>
                                        <div className="flex flex-wrap gap-2">
                                            {BROADCAST_ROLE_OPTIONS.map((option) => {
                                                const active = selectedRoles.includes(option.id)
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => toggleRole(option.id)}
                                                        disabled={!canBroadcast}
                                                        className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'bg-transparent text-[var(--t2)] border-[var(--bd)] hover:border-[var(--blue)] hover:text-[var(--blue)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="rounded-[var(--r)] bg-[var(--bg-surface)] px-3 py-3 border border-[var(--bd)]">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--t3)] mb-2">Delivery Preview</div>
                                        <div className="text-sm text-[var(--t1)] font-medium">{resolvedRecipients.length} recipients</div>
                                        <div className="text-xs text-[var(--t3)] mt-1">{selectedRoleLabels.length > 0 ? selectedRoleLabels.join(', ') : 'Select at least one audience segment.'}</div>
                                        <div className="text-xs text-[var(--t4)] mt-3">Customers: {customers.length} · Staff: {teamMembers.length}</div>
                                    </div>

                                    <button
                                        className="btn btn-primary w-full justify-center"
                                        onClick={handleSendNotification}
                                        disabled={!canSubmitNotification || sendInAppNotification.isPending}
                                    >
                                        {sendInAppNotification.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Send size={14} className="mr-2" />}
                                        Send Notification
                                    </button>

                                    {sendInAppNotification.isError && (
                                        <div className="text-xs text-[var(--red)]">Failed to send notification. Check the selected audience and try again.</div>
                                    )}
                                    {sendSuccessMsg && (
                                        <div className="flex items-center gap-2 rounded-[var(--r)] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                                            <CheckCircle2 size={14} /> {sendSuccessMsg}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {notifsQuery.isError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--red-dim)', color: 'var(--red)', fontSize: 13 }}>
                                <AlertCircle size={14} /> Failed to load notifications.
                                <button onClick={() => notifsQuery.refetch()} style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>
                                    <RefreshCw size={12} /> Retry
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col">
                            {notifsQuery.isLoading && Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-start gap-4 p-5 border-b border-[var(--bd)]">
                                    <Skeleton h={44} w="44px" />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <Skeleton h={14} />
                                        <Skeleton h={11} />
                                    </div>
                                </div>
                            ))}

                            {!notifsQuery.isLoading && inboxNotifications.map(notif => {
                                const colors = NOTIF_COLORS[notif.type ?? 'info'] ?? NOTIF_COLORS.info
                                const NIcon = NOTIF_ICON[notif.type ?? 'info'] ?? Bell
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-4 p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer border-b border-[var(--bd)] last:border-0 ${!notif.isRead ? 'bg-[var(--blue-glow)]' : ''}`}
                                        onClick={() => markNotifRead.mutate(notif.id)}
                                    >
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors.bg, color: colors.text }}>
                                            <NIcon size={20} />
                                        </div>
                                        <div className="flex-1 mt-0.5">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <p className={`font-medium text-[15px] truncate ${!notif.isRead ? 'text-[var(--t1)]' : 'text-[var(--t2)]'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className={`shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${NOTIF_TYPE_BADGE[notif.type ?? 'info'] ?? NOTIF_TYPE_BADGE.info}`}>
                                                        {notif.type ?? 'info'}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-medium text-[var(--t4)] whitespace-nowrap ml-3 shrink-0">{fmtSmartDate(notif.createdAt)}</span>
                                            </div>
                                            <p className="text-[14px] text-[var(--t3)] leading-relaxed">{notif.body}</p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)] flex-shrink-0 mt-2 shadow-[0_0_0_4px_var(--blue-dim)]" />
                                        )}
                                    </div>
                                )
                            })}

                            {!notifsQuery.isLoading && !notifsQuery.isError && inboxNotifications.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                                        <Bell size={28} className="text-[var(--t3)]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-[var(--t2)]">No notifications yet</p>
                                        <p className="text-xs text-[var(--t4)] mt-1">Sent broadcasts will appear here.</p>
                                    </div>
                                </div>
                            )}

                            {!notifsQuery.isLoading && !notifsQuery.isError && (
                                <div className="border-t border-[var(--bd)] bg-[var(--bg-surface)] p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-[var(--t1)]">Sent Notification History</h4>
                                        <span className="text-xs text-[var(--t4)]">{sentNotifications.length} entries</span>
                                    </div>

                                    {sentNotifications.length === 0 && (
                                        <div className="text-xs text-[var(--t3)] rounded-[var(--r)] border border-dashed border-[var(--bd)] bg-[var(--bg-card)] px-3 py-3">
                                            No sent broadcasts yet. Messages you send from this tab will appear here.
                                        </div>
                                    )}

                                    {sentNotifications.length > 0 && (
                                        <div className="space-y-2">
                                            {sentNotifications.slice(0, 20).map((notif) => (
                                                <div key={notif.id} className="rounded-[var(--r)] border border-[var(--bd)] bg-[var(--bg-card)] px-3 py-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-[var(--t1)] truncate">{notif.title}</div>
                                                            <div className="text-xs text-[var(--t3)] mt-0.5">
                                                                {typeof notif.sentRecipientCount === 'number'
                                                                    ? `Sent to ${notif.sentRecipientCount} recipient${notif.sentRecipientCount !== 1 ? 's' : ''}`
                                                                    : 'Sent broadcast'}
                                                            </div>
                                                        </div>
                                                        <div className="text-[11px] text-[var(--t4)] shrink-0">{fmtSmartDate(notif.createdAt)}</div>
                                                    </div>
                                                    <div className="text-xs text-[var(--t3)] mt-2 leading-relaxed">{notif.body}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Delete Confirmation Modal ─────────────────────────────── */}
            <style>{`
                @keyframes typingDot {
                    0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
                    30% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )

}
