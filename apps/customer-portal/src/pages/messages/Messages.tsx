/**
 * Messages: the customer's conversation with the office, and private chats with
 * technicians who have worked for them. Nothing else ever shows here.
 *
 * A message is "mine" when its senderMemberKey equals the conversation's
 * myMemberKey; office replies show the company name and who wrote them.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Building2, Check, CheckCheck, Loader2, MessageSquarePlus, RotateCw, Send, Wrench, X, BellOff, Bell, EyeOff } from 'lucide-react'
import {
  chatLive, findConversation, prefetchConversation, useChatAction, useChatContacts, useConversation, useConversations, useMarkChatRead, useOlderMessages, useOpenConversation, useSendChat,
} from '../../hooks/useChat'
import type { ChatConversation, ChatMessage } from '../../types/api'
import { TelegramButton, TelegramCard } from '../../components/TelegramConnect'

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
function dayLabel(iso: string) {
  const d = new Date(iso); const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const y = new Date(now); y.setDate(now.getDate() - 1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
const listTime = (iso: string | null) => (!iso ? '' : new Date(iso).toDateString() === new Date().toDateString() ? timeOf(iso) : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))

function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 900px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

export default function Messages() {
  const [params, setParams] = useSearchParams()
  const wide = useWide()
  const [selected, setSelected] = useState<string | null>(params.get('c'))
  const [picking, setPicking] = useState(false)
  const list = useConversations()
  const open = useOpenConversation()
  const conversations = list.data?.data ?? []

  // Deep links: ?c=<conversation> from a notification, ?tech=<id> / ?office from a job.
  const openWith = (target: { with: 'office' } | { with: 'technician'; techUserId: string }) => {
    const known = findConversation(target)
    if (known) { select(known.id); return }
    open.mutate(target, { onSuccess: (d) => select(d.id) })
  }
  useEffect(() => {
    const tech = params.get('tech')
    if (tech) openWith({ with: 'technician', techUserId: tech })
    else if (params.has('office')) openWith({ with: 'office' })
  }, [list.isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  const select = (id: string | null) => {
    setSelected(id)
    setParams(id ? { c: id } : {}, { replace: true })
  }

  const showList = wide || !selected
  const showConv = wide || !!selected

  return (
    <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: wide ? 'minmax(260px, 340px) 1fr' : '1fr', height: 'calc(100vh - 140px)', minHeight: 480, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--bd)', overflow: 'hidden' }}>
      {showList && (
        <aside style={{ borderRight: wide ? '1px solid var(--bd)' : 'none', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '14px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--bd)' }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--t1)', flex: 1 }}>Messages</h1>
            <TelegramButton />
            <button className="btn btn-primary btn-sm" onClick={() => setPicking(true)} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <MessageSquarePlus size={15} /> New
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <TelegramCard variant="messages" />
            {list.isLoading && <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={18} className="spin" style={{ color: 'var(--t3)' }} /></div>}
            {list.isError && <div style={{ padding: 16, fontSize: 13, color: 'var(--red)' }}>We couldn't load your messages. <button className="btn btn-sm" onClick={() => list.refetch()}>Try again</button></div>}
            {!list.isLoading && !conversations.length && (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--t3)', fontSize: 14, lineHeight: 1.6 }}>
                No messages yet.<br />
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} disabled={open.isPending} onClick={() => openWith({ with: 'office' })}>{open.isPending ? 'Opening…' : 'Message the office'}</button>
              </div>
            )}
            {conversations.map((c) => <Row key={c.id} c={c} active={c.id === selected} onClick={() => select(c.id)} onHover={() => prefetchConversation(c.id)} />)}
          </div>
        </aside>
      )}
      {showConv && (selected
        ? <Conversation id={selected} onBack={wide ? undefined : () => select(null)} onGone={() => select(null)} />
        : <div style={{ display: 'grid', placeItems: 'center', color: 'var(--t3)', fontSize: 14 }}>Choose a conversation.</div>)}
      {picking && <StartChat onClose={() => setPicking(false)} onPick={(t) => { setPicking(false); openWith(t) }} />}
      {open.isPending && <div role="status" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--t1)', color: 'var(--bg-card)', padding: '8px 14px', borderRadius: 999, fontSize: 13, zIndex: 50 }}>Opening conversation…</div>}
      {open.isError && <div role="alert" style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 13, zIndex: 50 }}>{(open.error as any)?.response?.data?.message ?? "Couldn't open that conversation."}</div>}
    </div>
  )
}

function Row({ c, active, onClick, onHover }: { c: ChatConversation; active: boolean; onClick: () => void; onHover: () => void }) {
  const Icon = c.kind === 'CUSTOMER_OFFICE' ? Building2 : Wrench
  return (
    <button onClick={onClick} onMouseEnter={onHover} onFocus={onHover} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid var(--bd)', background: active ? 'var(--bg-hover)' : 'transparent' }}>
      <span style={{ width: 40, height: 40, borderRadius: '50%', background: c.kind === 'CUSTOMER_OFFICE' ? 'var(--blue)' : 'var(--bg-hover)', color: c.kind === 'CUSTOMER_OFFICE' ? '#fff' : 'var(--t2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {c.kind === 'CUSTOMER_OFFICE' ? <Icon size={18} /> : <span style={{ fontSize: 13, fontWeight: 700 }}>{initials(c.title)}</span>}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: c.unread ? 700 : 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
          <span style={{ fontSize: 11, color: c.unread ? 'var(--blue)' : 'var(--t3)', flexShrink: 0 }}>{listTime(c.lastMessageAt)}</span>
        </span>
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 12.5, color: c.unread ? 'var(--t1)' : 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessagePreview ?? c.subtitle}</span>
          {c.unread > 0 && <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{c.unread}</span>}
        </span>
      </span>
    </button>
  )
}

function Conversation({ id, onBack, onGone }: { id: string; onBack?: () => void; onGone: () => void }) {
  const detail = useConversation(id)
  const send = useSendChat()
  const markRead = useMarkChatRead()
  const action = useChatAction()
  const d = detail.data
  const older = useOlderMessages(id, d?.messages[0]?.seq)
  const [text, setText] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const typingSent = useRef(0)

  useEffect(() => { chatLive.focus(id); return () => { chatLive.focus(null) } }, [id])
  useEffect(() => {
    if (!d || document.visibilityState !== 'visible') return
    const me = d.members.find((m) => m.isMe)
    if (me && me.lastReadSeq < d.lastSeq) markRead.mutate({ conversationId: id, seq: d.lastSeq })
  }, [id, d?.lastSeq]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [d?.messages.length])
  useEffect(() => chatLive.onTyping((e) => { if (e.conversationId === id && e.memberKey !== d?.myMemberKey) setTyping(e.typing ? e.name : null) }), [id, d?.myMemberKey])
  useEffect(() => { if (!typing) return; const t = setTimeout(() => setTyping(null), 5000); return () => clearTimeout(t) }, [typing])

  const messages = useMemo(() => {
    if (!d) return [] as ChatMessage[]
    const extra = (older.data?.pages ?? []).slice().reverse().flatMap((p) => p.data).filter((m) => !d.messages.some((x) => x.id === m.id))
    return [...extra, ...d.messages]
  }, [d, older.data])

  if (detail.isLoading) return <div style={{ display: 'grid', placeItems: 'center' }}><Loader2 size={20} className="spin" style={{ color: 'var(--t3)' }} /></div>
  if (detail.isError || !d) {
    return <div style={{ display: 'grid', placeItems: 'center', color: 'var(--t3)', padding: 24, textAlign: 'center' }}><div>This conversation isn't available.<br /><button className="btn btn-sm" style={{ marginTop: 10 }} onClick={onGone}>Back</button></div></div>
  }

  const others = d.members.filter((m) => !m.isMe)
  const seenUpTo = others.length ? Math.max(...others.map((m) => m.lastReadSeq)) : 0
  const lastMine = [...messages].reverse().find((m) => m.senderMemberKey === d.myMemberKey && !m.pending)
  const submit = () => {
    const body = text.trim()
    if (!body) return
    send.mutate({ conversationId: id, body })
    setText('')
    chatLive.typing(id, false)
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--bd)' }}>
        {onBack && <button onClick={onBack} aria-label="Back to messages" style={{ all: 'unset', cursor: 'pointer', color: 'var(--t2)', display: 'grid', placeItems: 'center', width: 32, height: 32 }}><ArrowLeft size={20} /></button>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
          <div style={{ fontSize: 12, color: typing ? 'var(--blue)' : 'var(--t3)' }}>{typing ? `${typing} is typing…` : d.subtitle}</div>
        </div>
        <button className="btn btn-ghost btn-sm" title={d.muted ? 'Turn notifications on' : 'Mute notifications'} aria-label={d.muted ? 'Unmute' : 'Mute'} onClick={() => action.mutate({ conversationId: id, action: d.muted ? 'unmute' : 'mute' })}>
          {d.muted ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
        <button className="btn btn-ghost btn-sm" title="Hide from my list (we keep it)" aria-label="Hide conversation" onClick={() => action.mutate({ conversationId: id, action: 'hide' }, { onSuccess: onGone })}>
          <EyeOff size={16} />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 3, background: 'var(--bg-app, var(--bg))' }}>
        {(older.hasNextPage ?? d.hasMore) && messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} disabled={older.isFetching} onClick={() => (older.data ? older.fetchNextPage() : older.refetch())}>
            {older.isFetching ? 'Loading…' : 'Earlier messages'}
          </button>
        )}
        {!messages.length && (detail.isPlaceholderData
          ? <div style={{ margin: 'auto' }}><Loader2 size={18} className="spin" style={{ color: 'var(--t3)' }} /></div>
          : <div style={{ margin: 'auto', color: 'var(--t3)', fontSize: 14, textAlign: 'center' }}>Send a message to start the conversation.</div>)}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const mine = m.senderMemberKey === d.myMemberKey
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
          const showName = !mine && (!prev || prev.senderName !== m.senderName || prev.senderMemberKey !== m.senderMemberKey || newDay)
          return (
            <div key={m.id}>
              {newDay && <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', margin: '12px 0 6px', fontWeight: 600 }}>{dayLabel(m.createdAt)}</div>}
              <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: showName ? 8 : 2 }}>
                <div style={{ maxWidth: '80%' }}>
                  {showName && <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t3)', margin: '0 0 3px 4px' }}>{m.senderKind === 'KELVIN' ? 'Kelvin' : m.senderName}</div>}
                  <div style={{
                    padding: '9px 12px', borderRadius: 16, fontSize: 14.5, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    background: mine ? 'var(--blue)' : 'var(--bg-card)', color: mine ? '#fff' : 'var(--t1)', border: mine ? 'none' : '1px solid var(--bd)',
                    opacity: m.pending ? 0.7 : 1, borderTopRightRadius: mine ? 6 : 16, borderTopLeftRadius: mine ? 16 : 6, fontStyle: m.deletedAt ? 'italic' : undefined,
                  }}>
                    {m.jobNumber && <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 3 }}>About {m.jobNumber}</div>}
                    {m.deletedAt ? 'Message deleted' : linkify(m.body, mine)}
                  </div>
                  <div style={{ display: 'flex', gap: 5, justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'center', fontSize: 10.5, color: 'var(--t3)', margin: '3px 4px 0' }}>
                    {m.failed ? (
                      <button onClick={() => send.mutate({ conversationId: id, body: m.body, clientId: m.clientId ?? undefined })} style={{ all: 'unset', cursor: 'pointer', color: 'var(--red)', display: 'inline-flex', gap: 3, alignItems: 'center' }}><RotateCw size={11} /> Not sent. Tap to retry</button>
                    ) : m.pending ? 'Sending…' : (
                      <>
                        {timeOf(m.createdAt)}{m.editedAt && !m.deletedAt ? ' · edited' : ''}
                        {mine && m.id === lastMine?.id && (seenUpTo >= m.seq ? <span title="Seen" style={{ color: 'var(--blue)', display: 'inline-flex' }}><CheckCheck size={13} /></span> : <span title="Sent" style={{ display: 'inline-flex' }}><Check size={13} /></span>)}
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

      <footer style={{ borderTop: '1px solid var(--bd)', padding: 10, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={text} rows={1} maxLength={4000} placeholder={`Message ${d.title}`} aria-label="Message"
          onChange={(e) => { setText(e.target.value); if (Date.now() - typingSent.current > 2500) { typingSent.current = Date.now(); chatLive.typing(id, true) } }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 160, padding: '11px 12px', borderRadius: 14, border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg))', color: 'var(--t1)', fontSize: 15, fontFamily: 'inherit' }} />
        <button className="btn btn-primary" onClick={submit} disabled={!text.trim()} aria-label="Send" style={{ height: 44, width: 44, padding: 0, display: 'grid', placeItems: 'center' }}><Send size={18} /></button>
      </footer>
    </section>
  )
}

/** Links in messages (e.g. the "where should we come?" link) are tappable. */
function linkify(text: string, mine: boolean) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((p, i) => (/^https?:\/\//.test(p)
    ? <a key={i} href={p} target="_blank" rel="noreferrer" style={{ color: mine ? '#fff' : 'var(--blue)', textDecoration: 'underline', wordBreak: 'break-all' }}>{p}</a>
    : p))
}

function StartChat({ onClose, onPick }: { onClose: () => void; onPick: (t: { with: 'office' } | { with: 'technician'; techUserId: string }) => void }) {
  const contacts = useChatContacts()
  const go = onPick
  const techs = contacts.data?.technicians ?? []
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 16, width: 420, maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bd)', display: 'flex', alignItems: 'center' }}>
          <strong style={{ flex: 1, fontSize: 15 }}>Who would you like to message?</strong>
          <button onClick={onClose} aria-label="Close" style={{ all: 'unset', cursor: 'pointer', color: 'var(--t3)' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 8 }}>
          <Choice icon={<Building2 size={18} />} title={contacts.data?.office.name ?? 'The office'} sub="Bookings, invoices, anything else" onClick={() => go({ with: 'office' })} />
          {techs.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t3)', padding: '10px 10px 4px' }}>Your technicians</div>}
          {techs.map((t) => <Choice key={t.userId} icon={<span style={{ fontSize: 12, fontWeight: 700 }}>{initials(t.name)}</span>} title={t.name} sub="Technician who has visited you" onClick={() => go({ with: 'technician', techUserId: t.userId })} />)}
          {contacts.isLoading && <div style={{ padding: 16, textAlign: 'center' }}><Loader2 size={16} className="spin" /></div>}
        </div>
      </div>
    </div>
  )
}

function Choice({ icon, title, sub, onClick }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 12, cursor: 'pointer' }}>
      <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-hover)', color: 'var(--t2)', display: 'grid', placeItems: 'center' }}>{icon}</span>
      <span><span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{title}</span><span style={{ display: 'block', fontSize: 12, color: 'var(--t3)' }}>{sub}</span></span>
    </button>
  )
}
