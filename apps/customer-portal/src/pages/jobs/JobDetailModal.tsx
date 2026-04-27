import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, Wrench, Calendar, FileText, DollarSign, User, Clock, MessageSquare, Send, Star } from 'lucide-react'
import { useJobAssignments, useMyJob, useTechnician, useJobInvoices, useJobQuotes, useCreateMyThread, useMyThread, useSendMyThreadMessage, useMarkMyThreadRead, useJobReview } from '../../hooks/useCustomerPortal'
import ReviewModal from '../../components/ReviewModal'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../contexts/AuthContext'
import { queryClient } from '../../lib/queryClient'
import type { Job } from '../../types/api'

interface JobDetailModalProps {
  job: Job
  onClose: () => void
  onCancel?: () => void
}

type TabType = 'overview' | 'schedule' | 'documents' | 'notes' | 'chat'

const STATUS_MAP: Record<string, { label: string; css: string }> = {
  COMPLETED: { label: 'Completed', css: 'badge-green' },
  SCHEDULED: { label: 'Scheduled', css: 'badge-violet' },
  PENDING: { label: 'Pending', css: 'badge-amber' },
  CANCELLED: { label: 'Cancelled', css: 'badge-red' },
  EN_ROUTE: { label: 'En Route', css: 'badge-blue' },
  ON_SITE: { label: 'On Site', css: 'badge-blue' },
  INVOICED: { label: 'Invoiced', css: 'badge-cyan' },
  PAID: { label: 'Paid', css: 'badge-green' },
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  background: '#F9FAFB',
  color: '#374151',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'default',
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function JobDetailModal({ job: initialJob, onClose, onCancel }: JobDetailModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [chatThreadId, setChatThreadId] = useState<string | null>(null)
  const [chatText, setChatText] = useState('')
  const [chatTypingUser, setChatTypingUser] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatTypingSentRef = useRef(false)

  const { data } = useMyJob(initialJob.id)
  const job = data ?? initialJob
  const { data: assignmentData } = useJobAssignments(job?.id ?? null)
  const { data: jobInvoices = [] } = useJobInvoices(job?.id ?? null)
  const { data: jobQuotes = [] } = useJobQuotes(job?.id ?? null)

  // Chat hooks
  const createThread = useCreateMyThread()
  const chatThreadQuery = useMyThread(chatThreadId)
  const sendChatMsg = useSendMyThreadMessage()
  const markChatRead = useMarkMyThreadRead()
  const { isConnected, joinThread, leaveThread, sendTyping, onNewMessage, onTyping } = useSocket()

  // When Chat tab is selected, create or find a thread for this job
  useEffect(() => {
    if (activeTab !== 'chat') return
    if (chatThreadId) return
    if (!user?.customerId) return
    createThread.mutate(
      {
        customerId: user.customerId,
        customerName: user.name,
        subject: `Job #${job.jobNumber} — ${job.title}`,
        jobId: job.id,
      },
      { onSuccess: (thread) => setChatThreadId(thread.id) },
    )
  }, [activeTab])

  // Join/leave WebSocket room for chat thread
  useEffect(() => {
    if (!chatThreadId) return
    joinThread(chatThreadId)
    return () => { leaveThread(chatThreadId) }
  }, [chatThreadId, joinThread, leaveThread])

  // Mark read when chat opened
  useEffect(() => {
    if (chatThreadId && (chatThreadQuery.data?.unreadCount ?? 0) > 0) {
      markChatRead.mutate(chatThreadId)
    }
  }, [chatThreadId, chatThreadQuery.data?.unreadCount])

  // Real-time messages for chat thread
  useEffect(() => {
    if (!chatThreadId) return
    const unsub = onNewMessage(({ threadId, message }) => {
      if (threadId !== chatThreadId) return
      queryClient.setQueryData(['customer', 'thread', threadId], (old: any) => {
        if (!old) return old
        const msgs: any[] = old.messages ?? []
        if (msgs.find((m: any) => m.id === message.id)) return old
        return { ...old, messages: [...msgs, message] }
      })
    })
    return unsub
  }, [onNewMessage, chatThreadId])

  // Typing indicator for chat
  useEffect(() => {
    if (!chatThreadId) return
    const unsub = onTyping(({ threadId, userName, isTyping }) => {
      if (threadId !== chatThreadId) return
      if (isTyping) {
        setChatTypingUser(userName)
        if (chatTypingTimerRef.current) clearTimeout(chatTypingTimerRef.current)
        chatTypingTimerRef.current = setTimeout(() => setChatTypingUser(null), 3000)
      } else {
        setChatTypingUser(null)
      }
    })
    return unsub
  }, [onTyping, chatThreadId])

  const handleChatTyping = useCallback((val: string) => {
    setChatText(val)
    if (!chatThreadId) return
    if (!chatTypingSentRef.current) {
      chatTypingSentRef.current = true
      sendTyping(chatThreadId, true)
    }
    if (chatTypingTimerRef.current) clearTimeout(chatTypingTimerRef.current)
    chatTypingTimerRef.current = setTimeout(() => {
      chatTypingSentRef.current = false
      sendTyping(chatThreadId, false)
    }, 2000)
  }, [chatThreadId, sendTyping])

  const sendChat = () => {
    const body = chatText.trim()
    if (!chatThreadId || !body) return
    sendChatMsg.mutate({ threadId: chatThreadId, body })
    setChatText('')
    chatTypingSentRef.current = false
    sendTyping(chatThreadId, false)
  }

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatThreadQuery.data?.messages?.length, chatTypingUser])

  const assignment = [...(assignmentData?.data ?? [])]
    .sort((a, b) => new Date(b.assignedAt ?? b.createdAt).getTime() - new Date(a.assignedAt ?? a.createdAt).getTime())[0]

  const technicianId = assignment?.technicianId ?? job.assignedToId ?? null
  const { data: technician } = useTechnician(technicianId)

  // Reviews — allow customer to rate a job once it's done/invoiced/paid
  const canReview = ['COMPLETED', 'INVOICED', 'PAID'].includes(job.status)
  const { data: existingReview } = useJobReview(canReview ? job.id : null)
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    if (job) setActiveTab('overview')
  }, [job])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!job) return null

  const status = STATUS_MAP[job.status] ?? { label: job.status, css: 'badge-neutral' }
  const history = [...(job.statusHistory ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const latestUpdate = history[0]
  const assignmentRecord = history.find(h => ['SCHEDULED', 'EN_ROUTE', 'ON_SITE'].includes(h.toStatus))
  const technicianName = technician?.name || assignment?.technicianName || job.assignedToName || 'Not assigned yet'
  const assignedAt = assignment?.assignedAt ?? assignmentRecord?.createdAt ?? job.scheduledStart
  // Use assignedByName from dispatch assignment if available; fallback to T&S Team
  // (avoid showing the customer's own name as "Assigned By")
  const assignedBy = assignment?.assignedByName || (assignment ? 'T&S Team' : 'Pending assignment')

  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Wrench size={14} /> },
    { id: 'schedule', label: 'Schedule & Cost', icon: <Calendar size={14} /> },
    { id: 'documents', label: 'Quotes & Invoices', icon: <DollarSign size={14} />, badge: jobInvoices.length + jobQuotes.length || undefined },
    { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
    { id: 'chat', label: 'Chat Support', icon: <MessageSquare size={14} /> },
  ]

  const modal = (
    <div
      className="cp-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cp-modal-container"
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          height: 620,
          overflow: 'hidden',
          animation: 'modalIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="cp-modal-header"
          style={{
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            padding: '22px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#fff', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span style={{ color: '#BFDBFE', fontSize: 12, fontWeight: 600, letterSpacing: '0.07em' }}>
                {job.jobNumber}
              </span>
              <span className={`badge ${status.css}`} style={{ fontSize: 11 }}>
                {status.label}
              </span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{job.title}</h2>
            <p style={{ color: '#BFDBFE', fontSize: 13, marginTop: 3 }}>
              {technicianName !== 'Not assigned yet' ? `Assigned technician: ${technicianName}` : 'Technician assignment pending'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#BFDBFE',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="cp-modal-tabs" style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '13px 18px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                border: 'none',
                borderBottom: `2px solid ${activeTab === t.id ? '#2563EB' : 'transparent'}`,
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                color: activeTab === t.id ? '#2563EB' : '#6B7280',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {t.icon} {t.label}
              {t.badge ? (
                <span style={{ background: '#2563EB', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 16, textAlign: 'center' }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="cp-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {activeTab === 'overview' && (
            <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <InfoField label="Service" icon={<Wrench size={11} />}>
                <div style={fieldStyle}>{job.title}</div>
              </InfoField>
              <InfoField label="Technician" icon={<User size={11} />}>
                <div style={fieldStyle}>{technicianName === 'Not assigned yet' ? 'To be assigned' : technicianName}</div>
              </InfoField>
              <InfoField label="Status">
                <span className={`badge ${status.css}`} style={{ fontSize: 13 }}>{status.label}</span>
              </InfoField>
              <InfoField label="Description" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, minHeight: 72, paddingTop: 10, lineHeight: 1.55 }}>
                  {job.description || 'No description provided.'}
                </div>
              </InfoField>
              <InfoField label="Assignment Details" style={{ gridColumn: 'span 2' }}>
                <div style={{ ...fieldStyle, minHeight: 88, lineHeight: 1.55 }}>
                  <div><strong>Technician:</strong> {technicianName}</div>
                  <div><strong>Assigned At:</strong> {fmtDateTime(assignedAt)}</div>
                  <div><strong>Assigned By:</strong> {assignedBy}</div>
                  {technician?.phone && <div><strong>Technician Phone:</strong> {technician.phone}</div>}
                  {latestUpdate && (
                    <div><strong>Latest Update:</strong> {latestUpdate.toStatus.replace(/_/g, ' ')} · {fmtDateTime(latestUpdate.createdAt)}</div>
                  )}
                </div>
              </InfoField>
              {technicianName !== 'Not assigned yet' && (
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => {
                      onClose()
                      navigate('/messages', { state: { chatWithTech: { name: technicianName } } })
                    }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: 10,
                      border: '1px solid #EDE9FE', background: '#F5F3FF',
                      color: '#7C3AED', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    <MessageSquare size={14} /> Chat with Technician
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="cp-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <InfoField label="Scheduled Date" icon={<Calendar size={11} />}>
                  <div style={fieldStyle}>{fmtDate(job.scheduledStart)}</div>
                </InfoField>
                <InfoField label="Estimated Cost" icon={<DollarSign size={11} />}>
                  <div style={fieldStyle}>—</div>
                </InfoField>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', marginBottom: 14 }}>Job Summary</h4>
                {[
                  { label: 'Job #', value: job.jobNumber },
                  { label: 'Service', value: job.title },
                  { label: 'Technician', value: technicianName === 'Not assigned yet' ? 'To be assigned' : technicianName },
                  { label: 'Date', value: fmtDate(job.scheduledStart) },
                  { label: 'Priority', value: job.priority },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                    <span style={{ color: '#6B7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: '#111827' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Quotes */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Quotes</h4>
                {jobQuotes.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No quotes for this job.</p>
                ) : jobQuotes.map((q) => (
                  <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 8, background: '#FAFAFA' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{q.quoteNumber}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{q.title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>${Number(q.total).toFixed(2)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: q.status === 'ACCEPTED' ? '#D1FAE5' : q.status === 'DECLINED' ? '#FEE2E2' : '#EFF6FF', color: q.status === 'ACCEPTED' ? '#065F46' : q.status === 'DECLINED' ? '#B91C1C' : '#1D4ED8' }}>
                        {q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Invoices */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Invoices</h4>
                {jobInvoices.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>No invoices for this job.</p>
                ) : jobInvoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 8, background: '#FAFAFA' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{inv.invoiceNumber}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Due: {inv.dueDate ? fmtDate(inv.dueDate) : '—'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>${Number(inv.total).toFixed(2)}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'OVERDUE' ? '#FEE2E2' : '#EFF6FF', color: inv.status === 'PAID' ? '#065F46' : inv.status === 'OVERDUE' ? '#B91C1C' : '#1D4ED8' }}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <InfoField label="Job Notes" icon={<Clock size={11} />}>
                <div style={{ ...fieldStyle, minHeight: 120, paddingTop: 12, lineHeight: 1.6, color: '#9CA3AF' }}>
                  {job.notes || 'No notes available for this job yet.'}
                </div>
              </InfoField>
            </div>
          )}

          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300 }}>
              {/* Status bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    Chat about this job with our support team
                  </span>
                  {technicianName !== 'Not assigned yet' && (
                    <button
                      onClick={() => { onClose(); navigate('/messages', { state: { chatWithTech: { name: technicianName } } }) }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: '#7C3AED', fontWeight: 600, textAlign: 'left', fontFamily: 'inherit' }}
                    >
                      → Direct chat with {technicianName}
                    </button>
                  )}
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: isConnected ? '#10B981' : '#9CA3AF' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#10B981' : '#D1D5DB', display: 'inline-block' }} />
                  {isConnected ? 'Live' : 'Connecting…'}
                </span>
              </div>

              {createThread.isPending && !chatThreadId && (
                <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 24 }}>Opening chat…</div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8 }}>
                {(chatThreadQuery.data?.messages ?? []).map((m) => {
                  const mine = m.direction === 'INBOUND'
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                      {!mine && m.senderName && (
                        <span style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, paddingLeft: 4 }}>{m.senderName}</span>
                      )}
                      <div style={{
                        maxWidth: '72%',
                        borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        padding: '9px 13px',
                        fontSize: 13,
                        lineHeight: 1.5,
                        background: mine ? '#2563EB' : '#F3F4F6',
                        color: mine ? '#fff' : '#111827',
                        wordBreak: 'break-word',
                      }}>
                        {m.body}
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                        {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
                {(chatThreadQuery.data?.messages?.length ?? 0) === 0 && !createThread.isPending && (
                  <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingTop: 16 }}>
                    No messages yet — ask us anything about this job!
                  </div>
                )}
                {chatTypingUser && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, paddingLeft: 4 }}>{chatTypingUser}</span>
                    <div style={{ background: '#F3F4F6', borderRadius: '14px 14px 14px 4px', padding: '8px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 200, 400].map((delay) => (
                        <span key={delay} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block', animation: 'modalTypingDot 1.2s ease-in-out infinite', animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Composer */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <textarea
                  value={chatText}
                  onChange={(e) => handleChatTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() }
                  }}
                  placeholder="Type your message…"
                  disabled={!chatThreadId || sendChatMsg.isPending}
                  rows={1}
                  style={{
                    flex: 1,
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    padding: '9px 12px',
                    fontSize: 13,
                    background: '#F9FAFB',
                    color: '#374151',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    maxHeight: 100,
                    overflow: 'auto',
                    lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={!chatThreadId || !chatText.trim() || sendChatMsg.isPending}
                  style={{
                    height: 38, width: 38, borderRadius: 10, border: 'none',
                    background: '#2563EB', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, opacity: (!chatThreadId || !chatText.trim()) ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="cp-modal-footer"
          style={{
            background: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            padding: '14px 28px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {canReview && (
            <button
              onClick={() => setReviewOpen(true)}
              style={{
                padding: '9px 16px', borderRadius: 9,
                border: '1px solid #FCD34D',
                background: existingReview ? '#fff' : '#FEF3C7',
                color: '#92400E',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              title={existingReview ? `Your rating: ${existingReview.rating}/5 — click to edit` : 'Rate this job'}
            >
              <Star size={14} fill={existingReview ? '#F59E0B' : 'transparent'} color="#F59E0B" />
              {existingReview ? `Your rating: ${existingReview.rating}/5` : 'Rate this job'}
            </button>
          )}
          {onCancel && ['PENDING', 'SCHEDULED'].includes(job.status) && (
            <button
              onClick={() => {
                onClose()
                onCancel()
              }}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#B91C1C',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel Job
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: 9,
              border: '1px solid #D1D5DB',
              background: '#fff',
              color: '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes modalTypingDot { 0%, 60%, 100% { opacity: 0.2; transform: scale(0.7); } 30% { opacity: 1; transform: scale(1); } }
      `}</style>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        type="JOB"
        jobId={job.id}
        technicianId={technicianId ?? undefined}
        technicianName={technician?.name ?? assignment?.technicianName ?? job.assignedToName ?? undefined}
        existing={existingReview ?? undefined}
      />
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}

function InfoField({
  label,
  icon,
  children,
  style,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, ...style }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}
