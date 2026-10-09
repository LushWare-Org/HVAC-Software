/**
 * Connecting Telegram from the portal: a one-tap link (and a QR code for
 * desktop), then a celebration the moment the customer presses Start in Telegram.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BellRing, Check, Copy, Loader2, X } from 'lucide-react'
import { useMyTelegram, useTelegramAlsoPush, useTelegramLink, useTelegramUnlink, type MyTelegram } from '../hooks/useTelegram'
import './telegram.css'

export function TelegramMark({ size = 16, color = 'var(--telegram, #229ED9)', plane = '#fff' }: { size?: number; color?: string; plane?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M5.4 11.8l11.3-4.4c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.6-.6.4-.7z" fill={plane} />
    </svg>
  )
}

/** The one-time code at the end of a t.me/…?start=<code> link. */
const startCode = (url: string) => new URL(url).searchParams.get('start') ?? ''

const isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/** The connect window. Opens Telegram with a one-time link and waits for them to press Start. */
export function TelegramConnectModal({ onClose }: { onClose: () => void }) {
  const me = useMyTelegram(2500)
  const link = useTelegramLink()
  // Connected (now, or already when this opened): say so instead of waiting.
  const done = !!me.data?.linked
  const company = me.data?.bot?.name ?? 'us'
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  useEffect(() => { if (!done) return; const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [done, onClose])

  const url = link.data?.url
  // On <body>, so it is centred on the screen: a page's entrance animation (transform)
  // would otherwise make "fixed" relative to that page instead of the window.
  return createPortal(
    <div className="tgc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tgc-modal" role="dialog" aria-modal="true" aria-labelledby="tgc-title">
        <button className="tgc-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {done ? (
          <div className="tgc-done" aria-live="polite">
            <div className="tgc-done-badge"><Check size={34} strokeWidth={3} /></div>
            <h2 id="tgc-title">You're connected</h2>
            <p>Replies from {company} will now arrive in Telegram{me.data?.telegramName ? ` (${me.data.telegramName})` : ''}. You can answer right there.</p>
            <button className="tgc-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="tgc-hero" aria-hidden="true">
              <span className="tgc-trail" />
              <TelegramMark size={56} />
            </div>
            <h2 id="tgc-title">Get our replies on Telegram</h2>
            <p className="tgc-lead">Messages from {company} arrive in Telegram, and you can reply there. Everything is still here in the portal too.</p>

            {link.isError ? (
              <p className="tgc-error">The link couldn't be made. <button onClick={() => link.refetch()}>Try again</button></p>
            ) : !url ? (
              <div className="tgc-wait"><Loader2 size={20} className="animate-spin" /></div>
            ) : (
              <div className={`tgc-body${isPhone() ? ' is-phone' : ''}`}>
                <div className="tgc-qr">
                  <QRCodeSVG value={url} size={156} marginSize={0} bgColor="#ffffff" fgColor="#0f172a" level="M" />
                  <span>Scan with your phone's camera</span>
                </div>
                <div className="tgc-actions">
                  <a className="tgc-primary" href={url} target="_blank" rel="noreferrer"><TelegramMark size={18} color="#fff" plane="var(--telegram)" /> Open Telegram</a>
                  <button className="tgc-mini is-ghost" style={{ alignSelf: 'flex-start' }}
                    onClick={async () => { try { await navigator.clipboard.writeText(url); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 1500) } catch { /* copy by hand */ } }}>
                    {linkCopied ? 'Link copied' : 'Copy link'}
                  </button>
                  <ol className="tgc-steps">
                    <li>Telegram opens our chat, <b>@{link.data?.botUsername}</b>.</li>
                    <li>Press <b>Start</b>.</li>
                    <li>This window confirms it straight away.</li>
                  </ol>
                  <p className="tgc-waiting"><span className="tgc-dot" /> Waiting for you to press Start…</p>
                  <div className="tgc-fallback">
                    <span>Chat with us already open in Telegram and nothing happened? Send this message there:</span>
                    <button
                      className="tgc-code"
                      onClick={async () => { try { await navigator.clipboard.writeText(`/start ${startCode(url)}`); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* select it by hand */ } }}
                      title="Copy"
                    >
                      <code>/start {startCode(url)}</code> {copied ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <p className="tgc-fine">The link is just for you and works once. Don't have Telegram? You can skip this; nothing changes.</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** A header button: "Telegram" to connect, or a quiet "connected" mark. Always there, so it's easy to find. */
export function TelegramButton() {
  const me = useMyTelegram()
  const [open, setOpen] = useState(false)
  const d = me.data
  if (!d?.available) return null
  if (d.linked) {
    return (
      <span className="tgc-head-linked" title={`Telegram connected${d.telegramName ? ` as ${d.telegramName}` : ''}. Manage it in Profile.`}>
        <TelegramMark size={18} /><span className="tgc-head-tick"><Check size={9} strokeWidth={4} /></span>
      </span>
    )
  }
  return (
    <>
      <button className="tgc-head-btn" onClick={() => setOpen(true)} title="Get our replies on Telegram">
        <TelegramMark size={16} color="#fff" plane="var(--telegram)" /> Telegram
      </button>
      {open && <TelegramConnectModal onClose={() => setOpen(false)} />}
    </>
  )
}

/**
 * The Telegram card. "messages": a compact invite at the top of Messages (closable).
 * "profile": full settings (connected as, also send app notifications, disconnect).
 */
export function TelegramCard({ variant }: { variant: 'messages' | 'profile' }) {
  const me = useMyTelegram()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('tg-card-hidden') === '1' } catch { return false } })
  const d = me.data
  if (!d?.available) return null
  if (variant === 'messages') {
    if (d.linked) {
      return (
        <div className="tgc-strip is-linked">
          <TelegramMark size={16} /> Replies also arrive in your Telegram{d.telegramName ? ` (${d.telegramName})` : ''}.
        </div>
      )
    }
    if (hidden) return null
    return (
      <>
        <div className="tgc-strip">
          <TelegramMark size={22} />
          <span style={{ flex: 1, minWidth: 0 }}><b>Prefer Telegram?</b> Get our replies there and answer from your phone.</span>
          <button className="tgc-mini" onClick={() => setOpen(true)}>Connect</button>
          <button className="tgc-x" aria-label="Hide" onClick={() => { setHidden(true); try { localStorage.setItem('tg-card-hidden', '1') } catch { /* fine */ } }}><X size={14} /></button>
        </div>
        {open && <TelegramConnectModal onClose={() => setOpen(false)} />}
      </>
    )
  }
  return (
    <>
      <ProfileTelegram d={d} onConnect={() => setOpen(true)} />
      {open && <TelegramConnectModal onClose={() => setOpen(false)} />}
    </>
  )
}

function ProfileTelegram({ d, onConnect }: { d: MyTelegram; onConnect: () => void }) {
  const alsoPush = useTelegramAlsoPush()
  const unlink = useTelegramUnlink()
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="tgc-profile">
      <div className="tgc-profile-head">
        <TelegramMark size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="tgc-profile-title">Telegram</div>
          <div className="tgc-profile-sub">
            {d.linked ? <>Connected{d.telegramName ? <> as <b>{d.telegramName}</b></> : ''}. Our replies arrive in Telegram and you can answer there.</> : <>Get replies from {d.bot?.name ?? 'us'} on Telegram, and message us from there.</>}
          </div>
        </div>
        {!d.linked && <button className="tgc-mini" onClick={onConnect}>Connect</button>}
      </div>
      {d.linked && (
        <div className="tgc-profile-rows">
          <label className="tgc-row">
            <BellRing size={15} />
            <span style={{ flex: 1 }}>Also send app notifications<small>Telegram already notifies you, so these are off unless you want both.</small></span>
            <input type="checkbox" checked={!!d.alsoPush} disabled={alsoPush.isPending} onChange={(e) => alsoPush.mutate(e.target.checked)} />
          </label>
          <div className="tgc-row">
            <span style={{ flex: 1 }}>Stop getting messages on Telegram</span>
            {confirm ? (
              <span style={{ display: 'inline-flex', gap: 6 }}>
                <button className="tgc-mini is-ghost" onClick={() => setConfirm(false)}>Keep</button>
                <button className="tgc-mini is-danger" disabled={unlink.isPending} onClick={() => unlink.mutate(undefined, { onSuccess: () => setConfirm(false) })}>Disconnect</button>
              </span>
            ) : <button className="tgc-mini is-ghost" onClick={() => setConfirm(true)}>Disconnect</button>}
          </div>
        </div>
      )}
    </div>
  )
}
