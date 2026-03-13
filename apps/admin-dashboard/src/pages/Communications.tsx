import { useState, useRef, useEffect } from 'react'
import {
    MessageSquare, Send, Phone, Mail, Bell, Plus, Search,
    Paperclip, Smile, Check, CheckCheck, AlertCircle, RefreshCw, Archive,
    X, Loader2, Users,
} from 'lucide-react'
import {
    useThreads,
    useThread,
    useSendThreadMessage,
    useMarkThreadRead,
    useUpdateThreadStatus,
    useNotifications,
    useMarkNotificationRead,
    useMarkAllNotificationsRead,
    useCreateThread,
    useSendSms,
    useSendEmail,
} from '../hooks/useComms'
import { useCustomers } from '../hooks/useCustomers'
import type { MessageThread, ThreadStatus, MessageChannel } from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Skeleton({ h = 14, w = '100%' }: { h?: number; w?: string }) {
    return <div style={{ width: w, height: h, background: 'var(--bg-hover)', borderRadius: 4 }} />
}

const NOTIF_COLORS: Record<string, { bg: string; text: string }> = {
    success: { bg: 'var(--green-dim)', text: 'var(--green)' },
    warning: { bg: 'var(--amber-dim)', text: 'var(--amber)' },
    error:   { bg: 'var(--red-dim)',   text: 'var(--red)'   },
    info:    { bg: 'var(--blue-dim)',  text: 'var(--blue)'  },
}

const THREAD_STATUS_BADGE: Record<ThreadStatus, string> = {
    ACTIVE:   'badge-green',
    RESOLVED: 'badge-neutral',
    SPAM:     'badge-red',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Communications() {
    const [activeTab, setActiveTab]           = useState('messages')
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [messageText, setMessageText]       = useState('')
    const [searchQuery, setSearchQuery]       = useState('')
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // ── API queries ──────────────────────────────────────────────────────────────
    const threadsQuery   = useThreads({ limit: 100 })
    const threadQuery    = useThread(selectedThreadId)
    const notifsQuery    = useNotifications(50)
    const sendMutation   = useSendThreadMessage()
    const markReadMutation = useMarkThreadRead()
    const markNotifRead  = useMarkNotificationRead()
    const markAllRead    = useMarkAllNotificationsRead()
    const updateStatus   = useUpdateThreadStatus()

    const allThreads: MessageThread[] = threadsQuery.data?.data ?? []
    const notifications = notifsQuery.data?.data ?? []
    const unreadCount   = notifications.filter(n => !n.isRead).length

    // ── Filter and sort thread list ──────────────────────────────────────────────
    const filteredThreads = allThreads
        .filter(t => {
            const name = t.customerName ?? t.customerPhone ?? t.customerEmail ?? ''
            return name.toLowerCase().includes(searchQuery.toLowerCase())
        })
        .sort((a, b) => {
            const la = a.lastMessageAt ?? a.updatedAt
            const lb = b.lastMessageAt ?? b.updatedAt
            return lb.localeCompare(la)
        })

    const selectedThread = threadQuery.data ?? null

    // Mark thread read when selecting it
    useEffect(() => {
        if (selectedThreadId && (selectedThread?.unreadCount ?? 0) > 0) {
            markReadMutation.mutate(selectedThreadId)
        }
    }, [selectedThreadId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll to bottom of message list
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [selectedThread?.messages?.length])

    // ── Send message ─────────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!messageText.trim() || !selectedThreadId) return
        sendMutation.mutate({ threadId: selectedThreadId, body: messageText.trim() })
        setMessageText('')
    }

    return (
        <div className="anim-fade-up">
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
                {activeTab === 'messages' && (
                    <div className="card h-[calc(100vh-170px)] overflow-hidden flex flex-row p-0 m-0">

                        {/* Thread / conversation list */}
                        <div className="w-[320px] border-r border-[var(--bd)] flex flex-col bg-[var(--bg-card)] shrink-0">
                            <div className="p-4 border-b border-[var(--bd)] shrink-0">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t4)]" />
                                        <input
                                            placeholder="Search conversations..."
                                            className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary btn-sm px-2" title="New Message" onClick={() => setIsNewMessageOpen(true)}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto">
                                {/* Loading */}
                                {threadsQuery.isLoading && Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4">
                                        <Skeleton h={38} w="38px" />
                                        <div className="flex-1 flex flex-col gap-1.5">
                                            <Skeleton h={12} />
                                            <Skeleton h={10} />
                                        </div>
                                    </div>
                                ))}

                                {/* Error */}
                                {threadsQuery.isError && (
                                    <div style={{ padding: 16, color: 'var(--red)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div className="flex items-center gap-2"><AlertCircle size={14} /> Failed to load conversations.</div>
                                        <button onClick={() => threadsQuery.refetch()} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}>
                                            <RefreshCw size={12} /> Retry
                                        </button>
                                    </div>
                                )}

                                {/* Thread rows */}
                                {!threadsQuery.isLoading && filteredThreads.map(thread => {
                                    const name       = thread.customerName ?? thread.customerPhone ?? thread.customerEmail ?? 'Unknown'
                                    const isSelected = selectedThreadId === thread.id
                                    const unread     = thread.unreadCount ?? 0
                                    const lastTime   = thread.lastMessageAt ?? thread.updatedAt

                                    return (
                                        <div
                                            key={thread.id}
                                            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors border-l-[3px] ${isSelected ? 'bg-[var(--blue-glow)] border-[var(--blue)]' : 'border-transparent'}`}
                                            onClick={() => setSelectedThreadId(thread.id)}
                                        >
                                            <div className="w-[38px] h-[38px] rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-sm font-semibold shrink-0">
                                                {getInitials(name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={`font-medium text-sm text-[var(--t1)] truncate ${unread > 0 ? 'font-semibold' : ''}`}>
                                                        {name}
                                                    </p>
                                                    <span className="text-xs text-[var(--t4)] whitespace-nowrap ml-2">{fmtTime(lastTime)}</span>
                                                </div>
                                                {thread.lastMessageBody && (
                                                    <p className="text-[13px] text-[var(--t3)] truncate">{thread.lastMessageBody}</p>
                                                )}
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] text-[var(--t4)] uppercase font-semibold">{thread.channel}</span>
                                                    {thread.status !== 'ACTIVE' && (
                                                        <span className={`badge ${THREAD_STATUS_BADGE[thread.status]} text-[9px] px-1.5 py-0`}>{thread.status}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {unread > 0 && (
                                                <div className="bg-[var(--blue)] text-white text-[10px] font-bold px-[7px] py-[1px] rounded-full shrink-0">
                                                    {unread}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {!threadsQuery.isLoading && !threadsQuery.isError && filteredThreads.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-[var(--t4)] text-sm gap-2">
                                        <MessageSquare size={24} />
                                        <span>No conversations yet</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Message thread area */}
                        <div className="flex-1 flex flex-col bg-[var(--bg-card)] min-w-0">
                            {selectedThread ? (
                                <>
                                    {/* Header */}
                                    <div className="p-4 border-b border-[var(--bd)] flex items-center justify-between shrink-0 h-[73px]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[38px] h-[38px] rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-sm font-semibold shrink-0">
                                                {getInitials(selectedThread.customerName ?? selectedThread.customerPhone ?? 'U')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--t1)] text-[15px]">
                                                    {selectedThread.customerName ?? selectedThread.customerPhone ?? selectedThread.customerEmail ?? 'Unknown'}
                                                </p>
                                                <p className="text-xs text-[var(--t3)] mt-px">
                                                    {selectedThread.channel} · {selectedThread.customerPhone ?? selectedThread.customerEmail ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="topbar-icon-btn"><Phone size={16} /></button>
                                            <button className="topbar-icon-btn"><Mail size={16} /></button>
                                            {selectedThread.status === 'ACTIVE' && (
                                                <button
                                                    className="topbar-icon-btn"
                                                    title="Resolve conversation"
                                                    onClick={() => updateStatus.mutate({ threadId: selectedThread.id, status: 'RESOLVED' })}
                                                >
                                                    <Archive size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-auto p-5 flex flex-col gap-5">
                                        {threadQuery.isLoading && (
                                            <div className="flex flex-col gap-4">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                                        <div className="max-w-[60%]"><Skeleton h={50} /></div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!threadQuery.isLoading && (selectedThread.messages ?? []).map(msg => {
                                            const isOutbound = msg.direction === 'OUTBOUND'
                                            return (
                                                <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] p-[14px] rounded-2xl ${isOutbound ? 'bg-[var(--blue)] text-white rounded-tr-sm' : 'bg-[var(--bg-card-2)] text-[var(--t1)] rounded-tl-sm'}`}>
                                                        <p className="text-[14px] leading-relaxed">{msg.body}</p>
                                                        <div className={`flex items-center gap-1 mt-1.5 justify-end ${isOutbound ? 'text-blue-100' : 'text-[var(--t4)]'}`}>
                                                            <span className="text-[11px]">{fmtTime(msg.createdAt)}</span>
                                                            {isOutbound && (
                                                                msg.status === 'READ'
                                                                    ? <CheckCheck size={14} className="ml-0.5" />
                                                                    : <Check size={14} className="ml-0.5" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {!threadQuery.isLoading && (selectedThread.messages?.length ?? 0) === 0 && (
                                            <div className="flex items-center justify-center h-24 text-[var(--t4)] text-sm">
                                                No messages yet — start the conversation below.
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Composer */}
                                    <div className="p-4 border-t border-[var(--bd)] bg-[var(--bg-surface)] shrink-0">
                                        <div className="flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] p-1.5 focus-within:border-[var(--blue)] focus-within:ring-1 focus-within:ring-[var(--blue)] transition-all">
                                            <button className="topbar-icon-btn shrink-0 border-transparent hover:border-transparent hover:bg-transparent text-[var(--t4)] hover:text-[var(--t2)] mb-0.5">
                                                <Paperclip size={20} />
                                            </button>
                                            <textarea
                                                placeholder="Type your message..."
                                                className="flex-1 bg-transparent border-0 p-2 text-[14px] text-[var(--t1)] outline-none min-h-[40px] max-h-32 resize-none"
                                                value={messageText}
                                                onChange={e => setMessageText(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        handleSend()
                                                    }
                                                }}
                                                disabled={selectedThread.status !== 'ACTIVE'}
                                            />
                                            <button className="topbar-icon-btn shrink-0 border-transparent hover:border-transparent hover:bg-transparent text-[var(--t4)] hover:text-[var(--t2)] mb-0.5 mr-1">
                                                <Smile size={20} />
                                            </button>
                                            <button
                                                className="btn btn-primary shrink-0 h-[40px] w-[40px] p-0 flex items-center justify-center rounded-[var(--r-sm)] mb-0.5 transition-opacity"
                                                onClick={handleSend}
                                                disabled={!messageText.trim() || sendMutation.isPending || selectedThread.status !== 'ACTIVE'}
                                                style={{ opacity: (!messageText.trim() || sendMutation.isPending || selectedThread.status !== 'ACTIVE') ? 0.6 : 1 }}
                                            >
                                                <Send size={18} className="translate-x-[1px]" />
                                            </button>
                                        </div>
                                        {sendMutation.isError && (
                                            <p className="text-xs text-[var(--red)] mt-1 pl-1">Failed to send message. Please try again.</p>
                                        )}
                                        {selectedThread.status !== 'ACTIVE' && (
                                            <p className="text-xs text-[var(--t4)] mt-1 pl-1">
                                                This conversation is {selectedThread.status.toLowerCase()}.{' '}
                                                <button
                                                    className="text-[var(--blue)] hover:underline"
                                                    onClick={() => updateStatus.mutate({ threadId: selectedThread.id, status: 'ACTIVE' })}
                                                >
                                                    Reopen
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--t4)] bg-[var(--bg-surface)]">
                                    <div className="w-20 h-20 rounded-full bg-[var(--bg-card-2)] flex items-center justify-center mb-5 shadow-inner">
                                        <MessageSquare size={36} className="text-[var(--t3)]" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--t1)] mb-1">Your Messages</h3>
                                    <p className="text-[14px]">Select a conversation from the sidebar to view messages.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Notifications tab ────────────────────────────────────────── */}
                {activeTab === 'notifications' && (
                    <div className="card p-0 overflow-hidden">
                        <div className="card-header border-b border-[var(--bd)] p-5">
                            <div>
                                <div className="card-title text-[16px]">Notifications Center</div>
                                <div className="card-subtitle mt-1">Activity alerts and automated events</div>
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

                            {!notifsQuery.isLoading && notifications.map(notif => {
                                const colors = NOTIF_COLORS[notif.type ?? 'info'] ?? NOTIF_COLORS.info
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-4 p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer border-b border-[var(--bd)] last:border-0 ${!notif.isRead ? 'bg-[var(--blue-glow)]' : ''}`}
                                        onClick={() => markNotifRead.mutate(notif.id)}
                                    >
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors.bg, color: colors.text }}>
                                            <Bell size={20} />
                                        </div>
                                        <div className="flex-1 mt-0.5">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <p className={`font-medium text-[15px] ${!notif.isRead ? 'text-[var(--t1)]' : 'text-[var(--t2)]'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-xs font-medium text-[var(--t4)]">{fmtDate(notif.createdAt)}</span>
                                            </div>
                                            <p className="text-[14px] text-[var(--t3)] leading-relaxed">{notif.body}</p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--blue)] flex-shrink-0 mt-2 shadow-[0_0_0_4px_var(--blue-dim)]" />
                                        )}
                                    </div>
                                )
                            })}

                            {!notifsQuery.isLoading && !notifsQuery.isError && notifications.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-[var(--t4)] gap-3">
                                    <Bell size={32} />
                                    <span className="text-sm">No notifications</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Message Modal ─────────────────────────────────────── */}
            {isNewMessageOpen && (
                <NewMessageModal
                    onClose={() => setIsNewMessageOpen(false)}
                    onThreadCreated={(threadId) => {
                        setIsNewMessageOpen(false)
                        setSelectedThreadId(threadId)
                        setActiveTab('messages')
                    }}
                />
            )}
        </div>
    )
}

// ─── New Message Modal ────────────────────────────────────────────────────────

function NewMessageModal({ onClose, onThreadCreated }: { onClose: () => void; onThreadCreated: (threadId: string) => void }) {
    const [channel, setChannel]             = useState<MessageChannel>('SMS')
    const [customerSearch, setCustomerSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string; email?: string } | null>(null)
    const [showDropdown, setShowDropdown]   = useState(false)
    const [initialMessage, setInitialMessage] = useState('')

    const customersQuery = useCustomers({ search: customerSearch, limit: 20 })
    const customers = customersQuery.data?.data ?? []
    const createThread = useCreateThread()
    const sendThreadMessage = useSendThreadMessage()
    const sendSms      = useSendSms()
    const sendEmail    = useSendEmail()

    const canSend = selectedCustomer && initialMessage.trim() && (
        (channel === 'SMS' && selectedCustomer.phone) ||
        (channel === 'EMAIL' && selectedCustomer.email) ||
        channel === 'IN_APP'
    )

    const handleCreate = () => {
        if (!selectedCustomer || !initialMessage.trim()) return
        const msg = initialMessage.trim()

        createThread.mutate(
            {
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                channel,
                ...(channel === 'SMS' ? { customerPhone: selectedCustomer.phone } : {}),
                ...(channel === 'EMAIL' ? { customerEmail: selectedCustomer.email } : {}),
            },
            {
                onSuccess: (thread) => {
                    // Post the initial message to the thread
                    sendThreadMessage.mutate({ threadId: thread.id, body: msg })

                    // Also send notification via the selected channel
                    if (channel === 'SMS' && selectedCustomer!.phone) {
                        sendSms.mutate({
                            recipientId: selectedCustomer!.id,
                            recipientName: selectedCustomer!.name,
                            recipientPhone: selectedCustomer!.phone!,
                            body: msg,
                            customerId: selectedCustomer!.id,
                        })
                    } else if (channel === 'EMAIL' && selectedCustomer!.email) {
                        sendEmail.mutate({
                            recipientId: selectedCustomer!.id,
                            recipientName: selectedCustomer!.name,
                            recipientEmail: selectedCustomer!.email!,
                            subject: 'New message',
                            htmlBody: `<p>${msg}</p>`,
                            customerId: selectedCustomer!.id,
                        })
                    }

                    onThreadCreated(thread.id)
                },
            },
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--bg-card)] rounded-[var(--r)] shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--bd)]">
                    <h2 className="text-lg font-semibold text-[var(--t1)]">New Conversation</h2>
                    <button onClick={onClose} className="topbar-icon-btn"><X size={18} /></button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Channel selector */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Channel</label>
                        <div className="flex gap-2">
                            {(['SMS', 'EMAIL', 'IN_APP'] as const).map(ch => (
                                <button
                                    key={ch}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-sm border transition-colors ${channel === ch ? 'bg-[var(--blue)] text-white border-[var(--blue)]' : 'border-[var(--bd)] text-[var(--t2)] hover:bg-[var(--bg-hover)]'}`}
                                    onClick={() => setChannel(ch)}
                                >
                                    {ch === 'SMS' && <Phone size={14} />}
                                    {ch === 'EMAIL' && <Mail size={14} />}
                                    {ch === 'IN_APP' && <MessageSquare size={14} />}
                                    {ch === 'IN_APP' ? 'In-App' : ch}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recipient search */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Recipient</label>
                        {selectedCustomer ? (
                            <div className="flex items-center gap-2 p-2.5 border border-[var(--bd)] rounded-[var(--r)] bg-[var(--bg-surface)]">
                                <div className="w-8 h-8 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-xs font-semibold">
                                    {getInitials(selectedCustomer.name)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--t1)]">{selectedCustomer.name}</p>
                                    <p className="text-xs text-[var(--t3)]">
                                        {channel === 'SMS' ? (selectedCustomer.phone || 'No phone') : channel === 'EMAIL' ? (selectedCustomer.email || 'No email') : selectedCustomer.phone || selectedCustomer.email || '—'}
                                    </p>
                                </div>
                                <button className="topbar-icon-btn" onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }}>
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t4)]" />
                                    <input
                                        placeholder="Search customers, technicians..."
                                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)]"
                                        value={customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowDropdown(true) }}
                                        onFocus={() => setShowDropdown(true)}
                                    />
                                </div>
                                {showDropdown && customerSearch.length >= 1 && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--bd)] rounded-[var(--r)] shadow-lg max-h-48 overflow-auto">
                                        {customersQuery.isLoading && (
                                            <div className="p-3 text-center text-sm text-[var(--t4)]"><Loader2 size={14} className="animate-spin inline mr-2" />Searching...</div>
                                        )}
                                        {!customersQuery.isLoading && customers.length === 0 && (
                                            <div className="p-3 text-center text-sm text-[var(--t4)]">No customers found</div>
                                        )}
                                        {customers.map(c => (
                                            <div
                                                key={c.id}
                                                className="flex items-center gap-2 p-3 hover:bg-[var(--bg-hover)] cursor-pointer"
                                                onClick={() => {
                                                    setSelectedCustomer({
                                                        id: c.id,
                                                        name: `${c.firstName} ${c.lastName}`,
                                                        phone: c.phone ?? undefined,
                                                        email: c.email ?? undefined,
                                                    })
                                                    setShowDropdown(false)
                                                    setCustomerSearch('')
                                                }}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center text-xs font-semibold">
                                                    {getInitials(`${c.firstName} ${c.lastName}`)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--t1)]">{c.firstName} {c.lastName}</p>
                                                    <p className="text-xs text-[var(--t3)]">{c.phone ?? c.email ?? '—'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Missing contact warning */}
                    {selectedCustomer && channel === 'SMS' && !selectedCustomer.phone && (
                        <p className="text-xs text-[var(--amber)] flex items-center gap-1"><AlertCircle size={12} /> This customer has no phone number. SMS cannot be sent.</p>
                    )}
                    {selectedCustomer && channel === 'EMAIL' && !selectedCustomer.email && (
                        <p className="text-xs text-[var(--amber)] flex items-center gap-1"><AlertCircle size={12} /> This customer has no email address. Email cannot be sent.</p>
                    )}

                    {/* Message body */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--t2)] mb-1.5">Message</label>
                        <textarea
                            placeholder="Type your message..."
                            className="w-full p-3 text-sm bg-transparent border border-[var(--bd)] rounded-[var(--r)] focus:border-[var(--blue)] outline-none text-[var(--t1)] min-h-[100px] resize-none"
                            value={initialMessage}
                            onChange={e => setInitialMessage(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--bd)]">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={!canSend || createThread.isPending}
                    >
                        {createThread.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Send size={14} className="mr-2" />}
                        Start Conversation
                    </button>
                </div>

                {createThread.isError && (
                    <p className="text-xs text-[var(--red)] px-5 pb-3">Failed to create conversation. Please try again.</p>
                )}
            </div>
        </div>
    )
}
