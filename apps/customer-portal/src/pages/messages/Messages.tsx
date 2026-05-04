import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, MessageSquare, Send, CheckCircle2, Plus, Search,
  Wifi, WifiOff, X, HardHat, Headphones, ChevronRight, Trash2,
} from 'lucide-react'
import {
  useMarkAllMyNotificationsRead,
  useMarkMyNotificationRead,
  useMarkMyThreadRead,
  useMyNotifications,
  useMyThread,
  useMyThreads,
  useSendMyThreadMessage,
  useCreateMyThread,
  useDeleteMyThread,
  useMyJobs,
} from '../../hooks/useCustomerPortal'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../contexts/AuthContext'
import { queryClient } from '../../lib/queryClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

/**
 * Determine what the customer should see as the conversation name.
 * Customer always sees the OTHER party, never their own name.
 *
 * - "Chat with Technician: X"  → strip prefix and show just the technician's name
 * - Admin thread (null subject) → "Admin"
 * - Any other subject           → show as-is (shouldn't normally occur)
 */
function getThreadTitle(t: any, currentUserName?: string): string {
  void currentUserName
  const subject: string = t?.subject ?? ''
  if (subject.startsWith('Chat with Technician:')) {
    const techName = subject.replace('Chat with Technician:', '').trim()
    return techName || 'Technician'
  }
  // All admin↔customer threads have no subject (subject = null)
  // Show "Admin" so the customer clearly knows who they're talking to
  return 'Admin'
}

function isTechThread(t: any): boolean {
  const subject: string = t?.subject ?? ''
  return subject.startsWith('Chat with Technician:')
}

// ─── New Chat Modal ────────────────────────────────────────────────────────────

function NewChatModal({
  onClose,
  onCreated,
  techs,
  user,
  createThread,
}: {
  onClose: () => void
  onCreated: (threadId: string) => void
  techs: Array<{ name: string }>
  user: any
  createThread: ReturnType<typeof useCreateMyThread>
}) {
  const [mode, setMode] = useState<'choose' | 'tech'>('choose')
  const [techSearch, setTechSearch] = useState('')

  const filteredTechs = techs.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()),
  )

  // Admin thread: no subject, empty participantIds → all admins can see and respond
  const startAdminChat = () => {
    createThread.mutate(
      { customerId: user?.customerId, customerName: user?.name },
      { onSuccess: (thread: any) => onCreated(thread.id) },
    )
  }

  const startTechChat = (techName: string) => {
    createThread.mutate(
      {
        customerId: user?.customerId,
        customerName: user?.name,
        subject: `Chat with Technician: ${techName}`,
      },
      { onSuccess: (thread: any) => onCreated(thread.id) },
    )
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-xl)',
          width: '100%', maxWidth: 420, margin: '0 16px', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--bd)' }}>
          {mode !== 'choose' && (
            <button onClick={() => setMode('choose')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              ← Back
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)', flex: 1 }}>
            {mode === 'choose' ? 'New Conversation' : 'Chat with Technician'}
          </span>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--t3)', margin: '0 0 8px' }}>Who would you like to chat with?</p>

              {/* Admin option — creates a thread visible to all admins */}
              <button
                onClick={startAdminChat}
                disabled={createThread.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  border: '1px solid var(--bd)', background: 'var(--bg-surface)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'border-color 0.15s', opacity: createThread.isPending ? 0.6 : 1,
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--blue)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Headphones size={18} color="var(--blue)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', marginBottom: 2 }}>Admin</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>Questions, billing, account help</div>
                </div>
                <ChevronRight size={16} color="var(--t4)" />
              </button>

              {/* Technicians option */}
              {techs.length > 0 && (
                <button
                  onClick={() => setMode('tech')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 10,
                    border: '1px solid var(--bd)', background: 'var(--bg-surface)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bd)')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(109,40,217,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HardHat size={18} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', marginBottom: 2 }}>My Technicians</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                      Chat with {techs.length} technician{techs.length !== 1 ? 's' : ''} assigned to your jobs
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--t4)" />
                </button>
              )}
            </div>
          )}

          {mode === 'tech' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', background: 'var(--bg-surface)' }}>
                <Search size={13} color="var(--t4)" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search technicians…"
                  value={techSearch}
                  onChange={e => setTechSearch(e.target.value)}
                  style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--t1)', flex: 1 }}
                />
              </div>

              {/* Tech list */}
              <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredTechs.length === 0 && (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
                    {techSearch ? 'No technicians match your search.' : 'No technicians assigned to your jobs yet.'}
                  </div>
                )}
                {filteredTechs.map(tech => (
                  <button
                    key={tech.name}
                    onClick={() => !createThread.isPending && startTechChat(tech.name)}
                    disabled={createThread.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      border: 'none', background: 'var(--bg-surface)', borderRadius: 8, cursor: 'pointer',
                      textAlign: 'left', width: '100%', transition: 'background 0.1s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(109,40,217,0.08)', color: '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {getInitials(tech.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>{tech.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>Technician</div>
                    </div>
                    <MessageSquare size={13} color="var(--t4)" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'chat' | 'notifications'>('chat')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [techSearch, setTechSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingSentRef = useRef(false)

  const { isConnected, joinThread, leaveThread, sendTyping, onNewMessage, onTyping } = useSocket()

  const threadsQuery = useMyThreads()
  const threadQuery = useMyThread(selectedThreadId)
  const sendMutation = useSendMyThreadMessage()
  const markThreadRead = useMarkMyThreadRead()
  const createThread = useCreateMyThread()
  const deleteThread = useDeleteMyThread()
  const notificationsQuery = useMyNotifications(50)
  const markNotificationRead = useMarkMyNotificationRead()
  const markAllRead = useMarkAllMyNotificationsRead()
  const jobsQuery = useMyJobs({ page: 1, limit: 200 })

  // ── Derived data ─────────────────────────────────────────────────────────────

  const assignedTechs = useMemo(() => {
    const seen = new Set<string>()
    const techs: Array<{ name: string }> = []
    for (const job of jobsQuery.data?.data ?? []) {
      const name = (job as any).assignedToName ?? (job as any).assignedTo
      if (name && !seen.has(name)) {
        seen.add(name)
        techs.push({ name })
      }
    }
    return techs
  }, [jobsQuery.data])

  const filteredSidebarTechs = assignedTechs.filter(t =>
    t.name.toLowerCase().includes(techSearch.toLowerCase()),
  )

  const threads = useMemo(
    () => [...(threadsQuery.data?.data ?? [])].sort((a, b) => {
      const ta = a.lastMessageAt ?? a.updatedAt
      const tb = b.lastMessageAt ?? b.updatedAt
      return new Date(tb).getTime() - new Date(ta).getTime()
    }),
    [threadsQuery.data?.data],
  )

  const selectedThread = threadQuery.data
  const unreadNotifications = (notificationsQuery.data?.data ?? []).filter(n => !n.isRead).length
  const messages = selectedThread?.messages ?? []

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) setSelectedThreadId(threads[0].id)
  }, [selectedThreadId, threads])

  useEffect(() => {
    if (selectedThreadId && (selectedThread?.unreadCount ?? 0) > 0) markThreadRead.mutate(selectedThreadId)
  }, [selectedThreadId, selectedThread?.unreadCount])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typingUser])

  useEffect(() => {
    if (!selectedThreadId) return
    joinThread(selectedThreadId)
    return () => { leaveThread(selectedThreadId) }
  }, [selectedThreadId, joinThread, leaveThread])

  useEffect(() => {
    const unsub = onNewMessage(({ threadId, message }) => {
      queryClient.setQueryData(['customer', 'thread', threadId], (old: any) => {
        if (!old) return old
        const msgs: any[] = old.messages ?? []
        if (msgs.find((m: any) => m.id === message.id)) return old
        return { ...old, messages: [...msgs, message] }
      })
      queryClient.invalidateQueries({ queryKey: ['customer', 'threads'] })
    })
    return unsub
  }, [onNewMessage])

  useEffect(() => {
    const unsub = onTyping(({ threadId, userName, isTyping }) => {
      if (threadId !== selectedThreadId) return
      if (isTyping) {
        setTypingUser(userName)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000)
      } else {
        setTypingUser(null)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      }
    })
    return unsub
  }, [onTyping, selectedThreadId])

  // Auto-open chat when navigated here with chatWithTech state
  useEffect(() => {
    const nav = location.state as any
    if (!nav?.chatWithTech) return
    const techName = nav.chatWithTech.name ?? nav.chatWithTech
    if (!user?.customerId || !techName) return
    navigate('/messages', { replace: true, state: {} })
    createThread.mutate(
      { customerId: user.customerId, customerName: user.name, subject: `Chat with Technician: ${techName}` },
      { onSuccess: (thread: any) => { setSelectedThreadId(thread.id); setTab('chat') } },
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleTypingChange = useCallback((val: string) => {
    setText(val)
    if (!selectedThreadId) return
    if (!typingSentRef.current) {
      typingSentRef.current = true
      sendTyping(selectedThreadId, true)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      typingSentRef.current = false
      sendTyping(selectedThreadId, false)
    }, 2000)
  }, [selectedThreadId, sendTyping])

  const send = () => {
    const body = text.trim()
    if (!selectedThreadId || !body) return
    sendMutation.mutate({ threadId: selectedThreadId, body })
    setText('')
    typingSentRef.current = false
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    sendTyping(selectedThreadId, false)
  }

  const startQuickTechChat = (techName: string) => {
    if (!user?.customerId) return
    createThread.mutate(
      { customerId: user.customerId, customerName: user.name, subject: `Chat with Technician: ${techName}` },
      { onSuccess: (thread: any) => setSelectedThreadId(thread.id) },
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tabs */}
      <div className="page-tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
          <MessageSquare size={14} /> Chat
        </button>
        <button className={`tab-btn ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
          <Bell size={14} /> Notifications
          {unreadNotifications > 0 && <span className="tab-count">{unreadNotifications}</span>}
        </button>
      </div>

      {tab === 'chat' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '300px 1fr',
          height: 'calc(100vh - 200px)', background: 'var(--bg-card)',
          borderRadius: 'var(--r)', border: '1px solid var(--bd)', overflow: 'hidden',
        }}>
          {/* ── Sidebar ── */}
          <div style={{ borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', overflow: 'hidden' }}>
            {/* Sidebar header */}
            <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--bd)', borderRadius: 8, padding: '6px 10px', background: 'var(--bg-card)' }}>
                <Search size={12} color="var(--t4)" />
                <span style={{ fontSize: 12, color: 'var(--t4)' }}>Conversations</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ padding: '6px 8px', borderRadius: 8, flexShrink: 0 }}
                title="New Conversation"
                onClick={() => setShowNewChat(true)}
                disabled={createThread.isPending}
              >
                <Plus size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Assigned technicians quick-access */}
              {assignedTechs.length > 0 && (
                <div style={{ borderBottom: '1px solid var(--bd)', padding: '10px 12px 8px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    My Technicians
                  </div>
                  {/* Search bar for techs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--bd)', borderRadius: 6, padding: '5px 8px', background: 'var(--bg-card)', marginBottom: 6 }}>
                    <Search size={11} color="var(--t4)" />
                    <input
                      type="text"
                      placeholder="Search…"
                      value={techSearch}
                      onChange={e => setTechSearch(e.target.value)}
                      style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: 'var(--t1)', flex: 1, minWidth: 0 }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredSidebarTechs.slice(0, 5).map(tech => (
                      <button
                        key={tech.name}
                        onClick={() => startQuickTechChat(tech.name)}
                        disabled={createThread.isPending}
                        style={{
                          width: '100%', border: 'none', background: 'transparent',
                          textAlign: 'left', padding: '6px 6px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6,
                          color: 'var(--t2)', fontSize: 12, fontWeight: 600,
                          transition: 'background 0.1s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(109,40,217,0.1)', color: '#7C3AED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700,
                        }}>
                          {getInitials(tech.name)}
                        </div>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech.name}</span>
                        <MessageSquare size={11} color="var(--t4)" style={{ flexShrink: 0 }} />
                      </button>
                    ))}
                    {filteredSidebarTechs.length === 0 && techSearch && (
                      <div style={{ fontSize: 11, color: 'var(--t4)', padding: '4px 6px' }}>No match</div>
                    )}
                  </div>
                </div>
              )}

              {/* Thread list */}
              {threadsQuery.isLoading && (
                <div style={{ padding: 16, color: 'var(--t3)', fontSize: 13 }}>Loading…</div>
              )}

              {threads.length > 0 && (
                <div style={{ padding: '8px 0 4px', borderBottom: '1px solid var(--bd)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 12px', marginBottom: 4 }}>
                    Conversations
                  </div>
                </div>
              )}

              {threads.map(t => {
                const selected = t.id === selectedThreadId
                const unread = t.unreadCount ?? 0
                const title = getThreadTitle(t, user?.name)
                const isTech = isTechThread(t)
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    style={{
                      width: '100%', border: 'none',
                      background: selected ? 'var(--blue-glow)' : 'transparent',
                      borderLeft: `3px solid ${selected ? 'var(--blue)' : 'transparent'}`,
                      textAlign: 'left', padding: '11px 12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: isTech ? 'rgba(109,40,217,0.1)' : 'var(--blue-dim)',
                      color: isTech ? '#7C3AED' : 'var(--blue)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700,
                    }}>
                      {isTech ? <HardHat size={14} /> : getInitials(title)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--t4)', flexShrink: 0, marginLeft: 6 }}>
                          {fmtTime(t.lastMessageAt ?? t.updatedAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.lastMessageBody ?? 'No messages yet'}
                      </div>
                    </div>
                    {unread > 0 && (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {unread}
                      </div>
                    )}
                  </button>
                )
              })}

              {!threadsQuery.isLoading && threads.length === 0 && (
                <div style={{ padding: 24, color: 'var(--t3)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div>No conversations yet.</div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 12, gap: 6, display: 'inline-flex', alignItems: 'center' }}
                    onClick={() => setShowNewChat(true)}
                  >
                    <Plus size={13} /> Start a conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
            {/* Chat header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              {selectedThread ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(() => {
                    const title = getThreadTitle(selectedThread, user?.name)
                    const isTech = isTechThread(selectedThread)
                    return (
                      <>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isTech ? 'rgba(109,40,217,0.1)' : 'var(--blue-dim)',
                          color: isTech ? '#7C3AED' : 'var(--blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {isTech ? <HardHat size={16} /> : getInitials(title)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{title}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                            {isTech ? 'Technician · In-app chat' : 'Support Team · In-app chat'}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)' }}>Select a conversation</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isConnected ? 'var(--green)' : 'var(--t4)' }}>
                  {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isConnected ? 'Live' : 'Connecting'}
                </span>
                {selectedThread && (
                  <button
                    title="Delete conversation"
                    onClick={() => setDeleteConfirmId(selectedThread.id)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      color: 'var(--red)', padding: '4px 6px', borderRadius: 6,
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!selectedThread && !threadQuery.isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--t3)', gap: 12 }}>
                  <MessageSquare size={36} style={{ opacity: 0.2 }} />
                  <span style={{ fontSize: 13 }}>Select a conversation or start a new one</span>
                  <button className="btn btn-primary btn-sm" style={{ gap: 6, display: 'flex', alignItems: 'center' }} onClick={() => setShowNewChat(true)}>
                    <Plus size={13} /> New Conversation
                  </button>
                </div>
              )}

              {messages.map(m => {
                // From the customer's perspective:
                //   INBOUND = this customer sent the message  → right (blue bubble)
                //   OUTBOUND = staff or technician sent it    → left (grey bubble)
                // Double check: if senderId matches the customer's userId, treat as mine.
                const mine = m.direction === 'INBOUND' || m.senderId === user?.id
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {!mine && m.senderName && (
                      <span style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 3, paddingLeft: 4 }}>{m.senderName}</span>
                    )}
                    <div style={{
                      maxWidth: '72%',
                      borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '10px 14px', fontSize: 13, lineHeight: 1.5,
                      background: mine ? 'var(--blue)' : 'var(--bg-card-2)',
                      color: mine ? '#fff' : 'var(--t1)',
                      wordBreak: 'break-word',
                    }}>
                      {m.body}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--t4)', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                      {fmtTime(m.createdAt)}
                    </span>
                  </div>
                )
              })}

              {messages.length === 0 && selectedThread && !threadQuery.isLoading && (
                <div style={{ color: 'var(--t3)', fontSize: 13, textAlign: 'center', marginTop: 32 }}>
                  No messages yet — say hello! 👋
                </div>
              )}

              {typingUser && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 3, paddingLeft: 4 }}>{typingUser} is typing…</span>
                  <div style={{ background: 'var(--bg-card-2)', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 200, 400].map(delay => (
                      <span key={delay} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--t3)', display: 'inline-block', animation: 'cpTypingDot 1.2s ease-in-out infinite', animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 18px', display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-surface)', flexShrink: 0 }}>
              <textarea
                value={text}
                onChange={e => handleTypingChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={selectedThread ? 'Type your message… (Enter to send)' : 'Select a conversation first'}
                disabled={!selectedThread || sendMutation.isPending}
                rows={1}
                style={{
                  flex: 1, border: '1px solid var(--bd)', borderRadius: 12,
                  padding: '10px 14px', fontSize: 13, background: 'var(--bg-card)',
                  color: 'var(--t1)', resize: 'none', outline: 'none',
                  lineHeight: 1.5, maxHeight: 120, overflow: 'auto', fontFamily: 'inherit',
                }}
              />
              <button
                className="btn btn-primary"
                onClick={send}
                disabled={sendMutation.isPending || !text.trim() || !selectedThread}
                style={{ height: 40, width: 40, padding: 0, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications tab ── */}
      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Notifications</div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadNotifications === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={13} /> Mark all read
            </button>
          </div>
          <div className="card-body-flush">
            {(notificationsQuery.data?.data ?? []).length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
                No notifications yet.
              </div>
            )}
            {(notificationsQuery.data?.data ?? []).map(n => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markNotificationRead.mutate(n.id)}
                style={{
                  width: '100%', textAlign: 'left', border: 'none',
                  background: n.isRead ? 'transparent' : 'var(--blue-glow)',
                  borderBottom: '1px solid var(--bd)', padding: '14px 16px',
                  cursor: n.isRead ? 'default' : 'pointer',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'var(--blue-dim)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5 }}>{fmtTime(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 4 }} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{ background: 'var(--bg-card)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow-xl)', width: '100%', maxWidth: 380, margin: '0 16px', padding: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={18} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)' }}>Delete Conversation</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>All messages will be permanently removed.</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20, lineHeight: 1.6 }}>
              Are you sure? This will delete the entire conversation and cannot be undone. You can always start a new one.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}
                disabled={deleteThread.isPending}
                onClick={() => {
                  deleteThread.mutate(deleteConfirmId, {
                    onSuccess: () => {
                      setDeleteConfirmId(null)
                      setSelectedThreadId(null)
                    },
                    onError: () => setDeleteConfirmId(null),
                  })
                }}
              >
                <Trash2 size={13} /> Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Chat Modal ── */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={(threadId) => { setSelectedThreadId(threadId); setShowNewChat(false) }}
          techs={assignedTechs}
          user={user}
          createThread={createThread}
        />
      )}

      <style>{`
        @keyframes cpTypingDot {
          0%, 60%, 100% { opacity: 0.2; transform: scale(0.7); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
