import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, MessageSquare, Send, CheckCircle2 } from 'lucide-react'
import {
  useMarkAllMyNotificationsRead,
  useMarkMyNotificationRead,
  useMarkMyThreadRead,
  useMyNotifications,
  useMyThread,
  useMyThreads,
  useSendMyThreadMessage,
} from '../../hooks/useCustomerPortal'

function fmtTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage() {
  const [tab, setTab] = useState<'chat' | 'notifications'>('chat')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const threadsQuery = useMyThreads()
  const threadQuery = useMyThread(selectedThreadId)
  const sendMutation = useSendMyThreadMessage()
  const markThreadRead = useMarkMyThreadRead()

  const notificationsQuery = useMyNotifications(50)
  const markNotificationRead = useMarkMyNotificationRead()
  const markAllRead = useMarkAllMyNotificationsRead()

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

  useEffect(() => {
    if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].id)
    }
  }, [selectedThreadId, threads])

  useEffect(() => {
    if (selectedThreadId && (selectedThread?.unreadCount ?? 0) > 0) {
      markThreadRead.mutate(selectedThreadId)
    }
  }, [selectedThreadId, selectedThread?.unreadCount])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedThread?.messages?.length])

  const send = () => {
    const body = text.trim()
    if (!selectedThreadId || !body) return
    sendMutation.mutate({ threadId: selectedThreadId, body })
    setText('')
  }

  return (
    <div className="anim-fade-up">
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
        <div className="card chat-grid">
          <div className="chat-thread-list" style={{ overflowY: 'auto' }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--bd)', fontSize: 12, color: 'var(--t3)' }}>Conversations</div>
            {threads.map(t => {
              const selected = t.id === selectedThreadId
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: selected ? 'var(--blue-glow)' : 'transparent',
                    borderLeft: selected ? '3px solid var(--blue)' : '3px solid transparent',
                    textAlign: 'left',
                    padding: '12px 14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{t.customerName ?? 'Conversation'}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{t.lastMessageBody ?? 'No messages yet'}</div>
                  <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4 }}>{fmtTime(t.lastMessageAt ?? t.updatedAt)}</div>
                </button>
              )
            })}
            {!threadsQuery.isLoading && threads.length === 0 && (
              <div style={{ padding: 16, color: 'var(--t3)', fontSize: 13 }}>No conversations yet.</div>
            )}
          </div>

          <div className="chat-main" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--bd)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{selectedThread?.customerName ?? 'Chat'}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>In-app messaging with support team</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(selectedThread?.messages ?? []).map((m) => {
                const mine = m.direction === 'INBOUND'
                return (
                  <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{
                      borderRadius: 12,
                      padding: '10px 12px',
                      fontSize: 13,
                      background: mine ? 'var(--blue)' : 'var(--bg-card-2)',
                      color: mine ? 'white' : 'var(--t1)',
                    }}>
                      {m.body}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                      {fmtTime(m.createdAt)}
                    </div>
                  </div>
                )
              })}
              {(selectedThread?.messages?.length ?? 0) === 0 && (
                <div style={{ color: 'var(--t3)', fontSize: 13 }}>No messages in this conversation yet.</div>
              )}
              <div ref={endRef} />
            </div>

            <div style={{ borderTop: '1px solid var(--bd)', padding: 12, display: 'flex', gap: 8 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Type your reply..."
                style={{
                  flex: 1,
                  border: '1px solid var(--bd)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  background: 'var(--bg-card)',
                  color: 'var(--t1)',
                }}
              />
              <button className="btn btn-primary" onClick={send} disabled={sendMutation.isPending || !text.trim()}>
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Notifications</div>
            <button className="btn btn-secondary btn-sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || unreadNotifications === 0}>
              <CheckCircle2 size={13} /> Mark all read
            </button>
          </div>
          <div className="card-body-flush">
            {(notificationsQuery.data?.data ?? []).map(n => (
              <button
                key={n.id}
                onClick={() => markNotificationRead.mutate(n.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: n.isRead ? 'transparent' : 'var(--blue-glow)',
                  borderBottom: '1px solid var(--bd)',
                  padding: '14px 16px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5 }}>{fmtTime(n.createdAt)}</div>
              </button>
            ))}
            {(notificationsQuery.data?.data?.length ?? 0) === 0 && (
              <div style={{ padding: 16, color: 'var(--t3)', fontSize: 13 }}>No notifications yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
