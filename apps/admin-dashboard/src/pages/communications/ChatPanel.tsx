/**
 * Office messages: one shared inbox for customer and technician conversations,
 * plus the user's own team chats. Customer↔technician chats are private to
 * those two and never appear here.
 *
 * A bubble is "mine" when its senderMemberKey equals the conversation's
 * myMemberKey (in the shared inbox that is any office reply, labelled with who
 * wrote it). Unread counts are this person's own; reading never clears anyone else's.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, ArchiveRestore, BellOff, Bell, Check, CheckCheck, Loader2, MessageSquarePlus, Pencil, RotateCw, Search, Send, Trash2, Users, X, Wrench, UserRound, Building2, Sparkles,
} from 'lucide-react'
import {
  chatLive, findConversation, prefetchConversation, useChatAction, useChatContacts, useConversation, useConversations, useEditChatMessage, useMarkChatRead,
  useOlderMessages, useOpenConversation, useSendChat,
} from '../../hooks/useChat'
import { useCustomers } from '../../hooks/useCustomers'
import { useTeamMembers } from '../../hooks/useTeam'
import type { ChatConversation, ChatKind, ChatMessage } from '../../types/api'
import { Link } from 'react-router-dom'
import TelegramMark from '../../components/TelegramMark'
import { useToast } from '../../contexts/ToastContext'
import { apiError, inviteSummary, useInviteToTelegram, useMyTelegram, useTelegramStatus } from '../../hooks/useTelegram'
import '../settings/telegram.css'

type Filter = 'all' | 'unread' | 'customers' | 'technicians' | 'team'
const KIND_FILTER: Record<Filter, (c: ChatConversation) => boolean> = {
  all: () => true,
  unread: (c) => c.unread > 0,
  customers: (c) => c.kind === 'CUSTOMER_OFFICE',
  technicians: (c) => c.kind === 'TECH_OFFICE',
  team: (c) => c.kind === 'STAFF_DIRECT' || c.kind === 'STAFF_GROUP',
}
const KIND_ICON: Record<ChatKind, typeof UserRound> = {
  CUSTOMER_OFFICE: UserRound, CUSTOMER_TECH: UserRound, TECH_OFFICE: Wrench, STAFF_DIRECT: Building2, STAFF_GROUP: Users,
}
const EDIT_WINDOW_MS = 15 * 60_000

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
function dayLabel(iso: string) {
  const d = new Date(iso); const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' })
}
function listTime(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString() ? timeOf(iso) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function ChatPanel({ openWith, onOpened }: {
  /** Open (or start) a conversation as soon as the panel mounts, e.g. from a job's "Message technician". */
  openWith?: { with: 'technician'; techUserId: string } | { with: 'customer'; customerId: string } | null
  onOpened?: () => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)
  const [selected, setSelected] = useState<string | null>(() => new URLSearchParams(window.location.search).get('c'))
  const [composeOpen, setComposeOpen] = useState(false)
  // Starting a new conversation: the pane shows it straight away while the server creates it.
  const [opening, setOpening] = useState<{ title: string; target: OpenTarget } | null>(null)
  const open = useOpenConversation()

  const start = (target: OpenTarget, title: string) => {
    setComposeOpen(false)
    const known = target.with !== 'group' ? findConversation(target) : undefined
    if (known) { setOpening(null); setSelected(known.id); return }
    setOpening({ title, target })
    setSelected(null)
    open.mutate(target, {
      onSuccess: (d) => { setOpening(null); setSelected(d.id) },
    })
  }

  useEffect(() => { const t = setTimeout(() => setSearch(q.trim()), 250); return () => clearTimeout(t) }, [q])
  useEffect(() => {
    if (!openWith) return
    start(openWith, openWith.with === 'technician' ? 'Technician' : 'Customer')
    onOpened?.()
  }, [openWith]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = useConversations(search, archived)
  const conversations = useMemo(() => (list.data?.data ?? []).filter(KIND_FILTER[filter]), [list.data, filter])

  return (
    <div className="card p-0 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', height: 'calc(100vh - 260px)', minHeight: 520 }}>
      {/* ── List ── */}
      <aside style={{ borderRight: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--bd)', borderRadius: 10, padding: '0 10px' }}>
              <Search size={14} style={{ color: 'var(--t3)' }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or messages" aria-label="Search conversations"
                style={{ all: 'unset', flex: 1, height: 36, fontSize: 13, color: 'var(--t1)' }} />
            </label>
            <button className="btn btn-primary btn-sm" onClick={() => setComposeOpen(true)} title="New conversation" aria-label="New conversation"><MessageSquarePlus size={15} /></button>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'unread', 'customers', 'technicians', 'team'] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? 'chip-active' : ''}`}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--bd)', background: filter === f ? 'var(--blue)' : 'transparent', color: filter === f ? '#fff' : 'var(--t2)', cursor: 'pointer', textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
            <button onClick={() => setArchived((a) => !a)} title={archived ? 'Back to inbox' : 'Show archived'}
              style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid var(--bd)', background: archived ? 'var(--bg-hover)' : 'transparent', color: 'var(--t2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Archive size={12} /> {archived ? 'Archived' : ''}
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {list.isLoading && <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={18} className="spin" style={{ color: 'var(--t3)' }} /></div>}
          {list.isError && <div style={{ padding: 16, fontSize: 13, color: 'var(--red)' }}>Couldn't load messages. <button className="btn btn-sm" onClick={() => list.refetch()}>Try again</button></div>}
          {!list.isLoading && !conversations.length && (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }}>
              {search ? 'Nothing matches that search.' : archived ? 'No archived conversations.' : 'No conversations yet. Start one with the + button.'}
            </div>
          )}
          {conversations.map((c) => {
            const Icon = KIND_ICON[c.kind]
            const active = c.id === selected
            return (
              <button key={c.id} onClick={() => { setOpening(null); setSelected(c.id) }} onMouseEnter={() => prefetchConversation(c.id)} onFocus={() => prefetchConversation(c.id)}
                style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', gap: 10, padding: '11px 12px', cursor: 'pointer', borderBottom: '1px solid var(--bd)', background: active ? 'var(--blue-glow, rgba(37,99,235,.08))' : 'transparent' }}>
                <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-hover)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--t2)', flexShrink: 0, position: 'relative' }}>
                  {initials(c.title)}
                  <Icon size={12} style={{ position: 'absolute', right: -2, bottom: -2, background: 'var(--bg-card)', borderRadius: '50%', padding: 2, color: 'var(--t3)' }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: c.unread ? 700 : 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: c.unread ? 'var(--blue)' : 'var(--t3)', flexShrink: 0 }}>{listTime(c.lastMessageAt)}</span>
                  </span>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: c.unread ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessagePreview ? `${c.lastSenderName ? `${c.lastSenderName}: ` : ''}${c.lastMessagePreview}` : c.subtitle}
                    </span>
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      {c.muted && <BellOff size={12} style={{ color: 'var(--t3)' }} aria-label="Muted" />}
                      {c.unread > 0 && <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: c.muted ? 'var(--t3)' : 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{c.unread > 99 ? '99+' : c.unread}</span>}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* ── Conversation ── */}
      {opening ? (
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{opening.title}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>{open.isError ? "Couldn't open this conversation" : 'Opening conversation…'}</div>
          </header>
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--t3)', fontSize: 13, padding: 24, textAlign: 'center' }}>
            {open.isError ? (
              <div>
                {(open.error as any)?.response?.data?.message ?? 'Something went wrong.'}
                <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => start(opening.target, opening.title)}>Try again</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setOpening(null)}>Cancel</button>
                </div>
              </div>
            ) : <Loader2 size={20} className="spin" />}
          </div>
        </div>
      ) : selected ? <Conversation id={selected} onClosed={() => setSelected(null)} /> : (
        <div style={{ display: 'grid', placeItems: 'center', color: 'var(--t3)', fontSize: 14, padding: 24, textAlign: 'center' }}>
          <div>Choose a conversation, or start a new one.<br /><TelegramInboxTip /></div>
        </div>
      )}

      {composeOpen && <NewConversation onClose={() => setComposeOpen(false)} onStart={start} />}
    </div>
  )
}

// ─── One conversation ────────────────────────────────────────────────────────

function Conversation({ id, onClosed }: { id: string; onClosed: () => void }) {
  const detail = useConversation(id)
  const send = useSendChat()
  const markRead = useMarkChatRead()
  const action = useChatAction()
  const edit = useEditChatMessage()
  const d = detail.data
  const older = useOlderMessages(id, d?.messages[0]?.seq)
  const [text, setText] = useState('')
  const [alsoEmail, setAlsoEmail] = useState(false)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [typing, setTyping] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const typingSent = useRef(0)

  // This is the open conversation: no push for it, and read up to the end.
  useEffect(() => { chatLive.focus(id); return () => { chatLive.focus(null) } }, [id])
  useEffect(() => {
    if (!d || document.visibilityState !== 'visible') return
    const mine = d.members.find((m) => m.isMe)
    if (d.unread > 0 || (mine && mine.lastReadSeq < d.lastSeq)) markRead.mutate({ conversationId: id, seq: d.lastSeq })
  }, [id, d?.lastSeq]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [d?.messages.length])
  useEffect(() => chatLive.onTyping((e) => {
    if (e.conversationId !== id || e.memberKey === d?.myMemberKey) return
    setTyping(e.typing ? e.name : null)
  }), [id, d?.myMemberKey])
  useEffect(() => { if (!typing) return; const t = setTimeout(() => setTyping(null), 5000); return () => clearTimeout(t) }, [typing])

  if (detail.isLoading) return <div style={{ display: 'grid', placeItems: 'center' }}><Loader2 size={20} className="spin" style={{ color: 'var(--t3)' }} /></div>
  if (detail.isError || !d) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 14 }}>
        <div>This conversation isn't available.<br /><button className="btn btn-sm" style={{ marginTop: 10 }} onClick={onClosed}>Back to the list</button></div>
      </div>
    )
  }

  const olderMsgs = (older.data?.pages ?? []).slice().reverse().flatMap((p) => p.data)
  const messages = [...olderMsgs.filter((m) => !d.messages.some((x) => x.id === m.id)), ...d.messages]
  const others = d.members.filter((m) => !m.isMe)
  const seenUpTo = others.length ? Math.max(...others.map((m) => m.lastReadSeq)) : 0
  const lastMine = [...messages].reverse().find((m) => m.senderMemberKey === d.myMemberKey && !m.pending)
  const hasCustomer = d.kind === 'CUSTOMER_OFFICE'
  const onTelegram = others.filter((m) => m.onTelegram)

  const submit = () => {
    const body = text.trim()
    if (!body) return
    if (editing) {
      edit.mutate({ id: editing.id, body }, { onSuccess: () => { setEditing(null); setText('') } })
      return
    }
    send.mutate({ conversationId: id, body, alsoEmail: hasCustomer && alsoEmail })
    setText('')
    chatLive.typing(id, false)
  }
  const onType = (v: string) => {
    setText(v)
    if (Date.now() - typingSent.current > 2500) { typingSent.current = Date.now(); chatLive.typing(id, true) }
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--bd)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
            {onTelegram.length > 0 && (
              <span key={d.id} className="tg-chip is-new" title={`${onTelegram.map((m) => m.name).join(', ')} also get${onTelegram.length === 1 ? 's' : ''} these messages on Telegram and can reply there.`}>
                <TelegramMark size={14} /> On Telegram
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            {typing ? <span style={{ color: 'var(--blue)' }}>{typing} is typing…</span> : d.kind === 'STAFF_GROUP' ? d.members.map((m) => m.name).join(', ') : d.subtitle}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" title={d.muted ? 'Turn notifications back on' : 'Mute notifications'} onClick={() => action.mutate({ conversationId: id, action: d.muted ? 'unmute' : 'mute' })}>
          {d.muted ? <Bell size={15} /> : <BellOff size={15} />}
        </button>
        <button className="btn btn-ghost btn-sm" title={d.archived ? 'Move back to the inbox' : 'Archive'} onClick={() => action.mutate({ conversationId: id, action: d.archived ? 'unarchive' : 'archive' })}>
          {d.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-card-2)' }}>
        {(older.hasNextPage ?? d.hasMore) && messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center', marginBottom: 8 }} disabled={older.isFetching}
            onClick={() => (older.data ? older.fetchNextPage() : older.refetch())}>
            {older.isFetching ? 'Loading…' : 'Earlier messages'}
          </button>
        )}
        {!messages.length && (detail.isPlaceholderData
          ? <div style={{ margin: 'auto' }}><Loader2 size={18} className="spin" style={{ color: 'var(--t3)' }} /></div>
          : <div style={{ margin: 'auto', color: 'var(--t3)', fontSize: 13 }}>No messages yet. Say hello.</div>)}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const mine = m.senderMemberKey === d.myMemberKey
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
          const showName = !mine ? (!prev || prev.senderMemberKey !== m.senderMemberKey || prev.senderName !== m.senderName || newDay)
            : (d.myMemberKey === 'office' && (!prev || prev.senderName !== m.senderName || newDay))
          const canChange = mine && !m.pending && !m.deletedAt && Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS && m.senderKind === 'STAFF'
          return (
            <div key={m.id}>
              {newDay && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', margin: '12px 0 6px', fontWeight: 600 }}>{dayLabel(m.createdAt)}</div>}
              <div className="chat-row" style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: showName ? 8 : 2 }}>
                <div style={{ maxWidth: '72%' }}>
                  {showName && (
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: m.senderKind === 'KELVIN' ? 'var(--violet, #7C3AED)' : 'var(--t3)', margin: mine ? '0 4px 3px 0' : '0 0 3px 4px', textAlign: mine ? 'right' : 'left', display: 'flex', gap: 4, alignItems: 'center', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      {m.senderKind === 'KELVIN' && <Sparkles size={11} />}
                      {m.senderKind === 'KELVIN' ? 'Kelvin' : m.senderName}
                    </div>
                  )}
                  <div style={{
                    padding: '9px 12px', borderRadius: 16, fontSize: 14, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: mine ? 'var(--blue)' : 'var(--bg-card)', color: mine ? '#fff' : 'var(--t1)',
                    border: mine ? 'none' : '1px solid var(--bd)', opacity: m.pending ? 0.7 : 1,
                    borderTopRightRadius: mine ? 6 : 16, borderTopLeftRadius: mine ? 16 : 6,
                    fontStyle: m.deletedAt ? 'italic' : undefined,
                  }}>
                    {m.jobNumber && <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 3 }}>About {m.jobNumber}</div>}
                    {m.deletedAt ? 'Message deleted' : m.body}
                    {!m.deletedAt && (m.attachments ?? []).map((a) => (
                      <a key={a.url} href={a.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: 6, color: mine ? '#fff' : 'var(--blue)', textDecoration: 'underline', fontSize: 12.5 }}>{a.name ?? 'Attachment'}</a>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'center', fontSize: 10.5, color: 'var(--t3)', margin: '3px 4px 0' }}>
                    {m.failed ? (
                      <button onClick={() => send.mutate({ conversationId: id, body: m.body, clientId: m.clientId ?? undefined })} style={{ all: 'unset', cursor: 'pointer', color: 'var(--red)', display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                        <RotateCw size={11} /> Not sent. Retry
                      </button>
                    ) : m.pending ? 'Sending…' : (
                      <>
                        {timeOf(m.createdAt)}{m.editedAt && !m.deletedAt ? ' · edited' : ''}
                        {!mine && m.clientId?.startsWith('tg:') && <span className="tg-tick" title="Sent from Telegram" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><TelegramMark size={11} /> via Telegram</span>}
                        {mine && m.telegram === 'sent' && <span className="tg-tick" title="Also delivered to their Telegram"><TelegramMark size={12} /></span>}
                        {mine && m.telegram === 'failed' && <span title="Couldn't reach their Telegram. They still see it in the app." style={{ display: 'inline-flex', opacity: 0.6, filter: 'grayscale(1)' }}><TelegramMark size={12} /></span>}
                        {mine && m.id === lastMine?.id && (seenUpTo >= m.seq
                          ? <span title="Seen" style={{ display: 'inline-flex', color: 'var(--blue)' }}><CheckCheck size={13} /></span>
                          : <span title="Sent" style={{ display: 'inline-flex' }}><Check size={13} /></span>)}
                        {canChange && (
                          <span className="chat-msg-actions" style={{ display: 'inline-flex', gap: 4 }}>
                            <button title="Edit" aria-label="Edit message" onClick={() => { setEditing(m); setText(m.body) }} style={{ all: 'unset', cursor: 'pointer' }}><Pencil size={11} /></button>
                            <button title="Delete" aria-label="Delete message" onClick={() => edit.mutate({ id: m.id, remove: true })} style={{ all: 'unset', cursor: 'pointer' }}><Trash2 size={11} /></button>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {d.archived ? (
        <div style={{ padding: 14, borderTop: '1px solid var(--bd)', fontSize: 13, color: 'var(--t3)', textAlign: 'center' }}>
          Archived. <button className="btn btn-sm" onClick={() => action.mutate({ conversationId: id, action: 'unarchive' })}>Move back to the inbox</button> to reply.
        </div>
      ) : (
        <footer style={{ borderTop: '1px solid var(--bd)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {editing && (
            <div style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pencil size={12} /> Editing your message
              <button onClick={() => { setEditing(null); setText('') }} style={{ all: 'unset', cursor: 'pointer', marginLeft: 'auto' }} aria-label="Cancel edit"><X size={14} /></button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea value={text} onChange={(e) => onType(e.target.value)} rows={1} maxLength={4000}
              placeholder={hasCustomer ? `Message ${d.title}` : 'Write a message'} aria-label="Message"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              style={{ flex: 1, resize: 'none', minHeight: 40, maxHeight: 160, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--bd)', background: 'var(--bg-input)', color: 'var(--t1)', fontSize: 14, fontFamily: 'inherit' }} />
            <button className="btn btn-primary" onClick={submit} disabled={!text.trim() || send.isPending || edit.isPending} aria-label="Send" style={{ height: 40 }}>
              {editing ? <Check size={16} /> : <Send size={16} />}
            </button>
          </div>
          {!editing && (hasCustomer || onTelegram.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {hasCustomer && (
                <label style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={alsoEmail} onChange={(e) => setAlsoEmail(e.target.checked)} /> Also email it to them
                </label>
              )}
              <TelegramHint linked={onTelegram.length > 0} name={onTelegram[0]?.name ?? d.title} customerId={hasCustomer ? d.customerId : null} />
            </div>
          )}
        </footer>
      )}
    </section>
  )
}

/** Under the composer: their Telegram gets this too, or (for a customer not linked) an invite. */
function TelegramHint({ linked, name, customerId }: { linked: boolean; name: string; customerId: string | null }) {
  const status = useTelegramStatus()
  const invite = useInviteToTelegram()
  const { showSuccess, showError } = useToast()
  const [sent, setSent] = useState(false)
  const s = status.data
  if (linked) {
    return (
      <span style={{ fontSize: 12, color: 'var(--t3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <TelegramMark size={13} /> Replies also go to {name.split(' ')[0]}'s Telegram
      </span>
    )
  }
  if (!customerId || !s?.connected || !s.enabled) return null
  return (
    <button
      type="button" disabled={invite.isPending || sent}
      onClick={() => invite.mutate({ customerIds: [customerId] }, {
        onSuccess: (r) => { setSent(true); showSuccess(r.sent ? `${name} gets a one-tap Telegram link by email.` : inviteSummary(r), 'Telegram invite') },
        onError: (e) => showError(apiError(e, 'The invite could not be sent.')),
      })}
      style={{ all: 'unset', cursor: sent ? 'default' : 'pointer', fontSize: 12, color: 'var(--telegram)', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600 }}
      title="Email them a one-tap link to get these messages on Telegram"
    >
      {invite.isPending ? <Loader2 size={12} className="spin" /> : <TelegramMark size={13} />} {sent ? 'Invite sent' : 'Invite to Telegram'}
    </button>
  )
}

/** In the empty inbox: the one place to learn Telegram exists. */
export function TelegramInboxTip() {
  const status = useTelegramStatus()
  const me = useMyTelegram()
  if (!status.data?.available) return null
  if (status.data.connected) {
    if (!me.data?.available || me.data.linked) return null
    return (
      <Link to="/settings?tab=telegram" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--telegram)', fontWeight: 600, textDecoration: 'none', marginTop: 10 }}>
        <TelegramMark size={14} /> Get new messages on your own Telegram
      </Link>
    )
  }
  return (
    <Link to="/settings?tab=telegram" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--telegram)', fontWeight: 600, textDecoration: 'none', marginTop: 10 }}>
      <TelegramMark size={14} /> Let customers reply from Telegram
    </Link>
  )
}

// ─── Starting a conversation ─────────────────────────────────────────────────

type OpenTarget = Parameters<ReturnType<typeof useOpenConversation>['mutate']>[0]

function NewConversation({ onClose, onStart }: { onClose: () => void; onStart: (target: OpenTarget, title: string) => void }) {
  const [tab, setTab] = useState<'customer' | 'technician' | 'colleague' | 'group'>('customer')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const customers = useCustomers({ search: q || undefined, limit: 20, isActive: true })
  const team = useTeamMembers({ limit: 200, isActive: true })
  const contacts = useChatContacts()
  const technicians = (team.data?.data ?? []).filter((m) => m.role === 'technician' && m.name.toLowerCase().includes(q.toLowerCase()))
  const colleagues = (contacts.data?.colleagues ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
  const go = (v: OpenTarget, title: string) => onStart(v, title)

  const row = (key: string, name: string, sub: string, onClick: () => void, selected?: boolean) => (
    <button key={key} onClick={onClick}
      style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: selected ? 'var(--blue-glow, rgba(37,99,235,.08))' : 'transparent' }}>
      <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{initials(name)}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{name}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t3)', textTransform: 'capitalize' }}>{sub}</span>
      </span>
      {selected && <Check size={15} style={{ color: 'var(--blue)' }} />}
    </button>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 460, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center' }}>
          <strong style={{ fontSize: 15, flex: 1 }}>New conversation</strong>
          <button onClick={onClose} aria-label="Close" style={{ all: 'unset', cursor: 'pointer', color: 'var(--t3)' }}><X size={18} /></button>
        </div>
        <div className="page-tabs" style={{ margin: 0, borderRadius: 0 }}>
          {([['customer', 'Customer'], ['technician', 'Technician'], ['colleague', 'Colleague'], ['group', 'Group']] as const).map(([k, l]) => (
            <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => { setTab(k); setPicked([]) }}>{l}</button>
          ))}
        </div>
        <div style={{ padding: 12 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder={tab === 'customer' ? 'Search customers' : 'Search people'}
            style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--bg-input)', color: 'var(--t1)' }} />
          {tab === 'group' && (
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Group name, e.g. Mall project crew" maxLength={80}
              style={{ width: '100%', height: 36, marginTop: 8, padding: '0 10px', borderRadius: 10, border: '1px solid var(--bd)', background: 'var(--bg-input)', color: 'var(--t1)' }} />
          )}
        </div>
        <div style={{ overflowY: 'auto', padding: '0 8px 8px', flex: 1 }}>
          {tab === 'customer' && customers.isLoading && <div style={{ padding: 16, textAlign: 'center' }}><Loader2 size={16} className="spin" /></div>}
          {tab === 'customer' && (customers.data?.data ?? []).map((c) => { const n = `${c.firstName} ${c.lastName}`.trim(); return row(c.id, n, c.email ?? 'Customer', () => go({ with: 'customer', customerId: c.id }, n)) })}
          {tab === 'technician' && technicians.map((t) => row(t.id, t.name, 'Technician', () => go({ with: 'technician', techUserId: t.id }, t.name)))}
          {tab === 'colleague' && colleagues.map((c) => row(c.userId, c.name, c.role.replace(/_/g, ' '), () => go({ with: 'colleague', userId: c.userId }, c.name)))}
          {tab === 'group' && colleagues.map((c) => row(c.userId, c.name, c.role.replace(/_/g, ' '), () => setPicked((p) => (p.includes(c.userId) ? p.filter((x) => x !== c.userId) : [...p, c.userId])), picked.includes(c.userId)))}
        </div>
        {tab === 'group' && (
          <div style={{ padding: 12, borderTop: '1px solid var(--bd)' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={picked.length < 2 || !title.trim()}
              onClick={() => go({ with: 'group', userIds: picked, title: title.trim() }, title.trim())}>
              {picked.length < 2 ? 'Pick at least two people' : `Create group with ${picked.length + 1} people`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
