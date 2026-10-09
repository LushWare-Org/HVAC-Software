/**
 * "My Telegram alerts": an office person links their own Telegram to get new
 * customer and technician messages as alerts, and answers by replying to them.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { BellRing, Check, Copy, Link2, Loader2, Moon, RotateCw, Send, Unlink, X } from 'lucide-react'
import TelegramMark from '../../components/TelegramMark'
import { useToast } from '../../contexts/ToastContext'
import {
  apiError, useMyTelegram, useMyTelegramLink, useTestMyTelegram, useUnlinkMyTelegram, useUpdateMyTelegram, type MyTelegram,
} from '../../hooks/useTelegram'

export default function MyTelegramAlerts() {
  const me = useMyTelegram()
  const [open, setOpen] = useState(false)
  const d = me.data
  if (me.isLoading || !d) return null
  if (!d.available) {
    if (!d.officeAlertsOff) return null
    return (
      <div className="card tg-card">
        <h4 className="tg-h4"><BellRing size={15} /> My Telegram alerts</h4>
        <p className="tg-p" style={{ margin: 0 }}>Office alerts on Telegram are switched off for this company. An admin can switch them on above.</p>
      </div>
    )
  }
  return (
    <div className="card tg-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h4 className="tg-h4"><BellRing size={15} /> My Telegram alerts</h4>
          <p className="tg-p" style={{ margin: 0 }}>
            {d.linked
              ? <>New messages from customers and technicians arrive on your Telegram{d.telegramName ? <> (<b>{d.telegramName}</b>)</> : ''}. Use Telegram's <b>Reply</b> on an alert to answer; it's sent as you, like a reply from here.</>
              : <>Get new customer and technician messages on your own Telegram, and answer them by replying there. Only you get these; each person in the office links their own.</>}
          </p>
        </div>
        {!d.linked && (
          <button className="btn btn-primary btn-sm tg-connect-btn" onClick={() => setOpen(true)}>
            <TelegramMark size={15} color="#fff" plane="var(--telegram)" /> Connect my Telegram
          </button>
        )}
      </div>
      {d.linked && <AlertSettings d={d} />}
      {open && <ConnectWindow onClose={() => setOpen(false)} />}
    </div>
  )
}

function AlertSettings({ d }: { d: MyTelegram }) {
  const update = useUpdateMyTelegram()
  const test = useTestMyTelegram()
  const unlink = useUnlinkMyTelegram()
  const { showSuccess, showError } = useToast()
  const [confirm, setConfirm] = useState(false)
  const prefs = d.prefs ?? { alertScope: 'all', quietFrom: null, quietTo: null }
  const quiet = !!(prefs.quietFrom && prefs.quietTo)
  const save = (change: Parameters<typeof update.mutate>[0]) => update.mutate(change, { onError: (e) => showError(apiError(e, 'That could not be saved.')) })

  return (
    <div className="tg-my">
      <div className="tg-my-row">
        <span className="tg-my-label">Alert me about</span>
        <div className="tg-seg" role="radiogroup" aria-label="Which messages">
          <button role="radio" aria-checked={prefs.alertScope === 'all'} className={prefs.alertScope === 'all' ? 'is-on' : ''} onClick={() => save({ alertScope: 'all' })}>Every new message</button>
          <button role="radio" aria-checked={prefs.alertScope === 'mine'} className={prefs.alertScope === 'mine' ? 'is-on' : ''} onClick={() => save({ alertScope: 'mine' })}>Only chats I've replied in</button>
        </div>
      </div>
      <div className="tg-my-row">
        <span className="tg-my-label"><Moon size={13} /> Quiet hours</span>
        <label className="tg-check">
          <input type="checkbox" checked={quiet} onChange={(e) => save(e.target.checked ? { quietFrom: '20:00', quietTo: '07:00' } : { quietFrom: null, quietTo: null })} />
          {quiet ? 'No alerts from' : 'Off'}
        </label>
        {quiet && (
          <span className="tg-times">
            <input type="time" value={prefs.quietFrom ?? '20:00'} onChange={(e) => e.target.value && save({ quietFrom: e.target.value })} aria-label="Quiet from" />
            to
            <input type="time" value={prefs.quietTo ?? '07:00'} onChange={(e) => e.target.value && save({ quietTo: e.target.value })} aria-label="Quiet until" />
            <span className="tg-meta">company time</span>
          </span>
        )}
      </div>
      <div className="tg-my-actions">
        <button className="btn btn-secondary btn-sm" disabled={test.isPending}
          onClick={() => test.mutate(undefined, { onSuccess: () => showSuccess('Check your Telegram.', 'Test alert sent'), onError: (e) => showError(apiError(e, 'The test could not be sent.')) })}>
          {test.isPending ? <Loader2 size={13} className="spin" /> : <Send size={13} />} Send me a test
        </button>
        <span style={{ flex: 1 }} />
        {confirm ? (
          <span style={{ display: 'inline-flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(false)}>Keep</button>
            <button className="btn btn-danger btn-sm" disabled={unlink.isPending} onClick={() => unlink.mutate(undefined, { onSuccess: () => setConfirm(false) })}>Disconnect</button>
          </span>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}><Unlink size={13} /> Disconnect my Telegram</button>
        )}
      </div>
    </div>
  )
}

/** The connect window: QR for the phone, a link for this computer, and the code to send if nothing happens. */
function ConnectWindow({ onClose }: { onClose: () => void }) {
  const me = useMyTelegram(2500)
  const link = useMyTelegramLink()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const copy = async (what: 'code' | 'link', text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(null), 1500) } catch { /* copy by hand */ }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const done = !!me.data?.linked
  useEffect(() => { if (!done) return; const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [done, onClose])
  const url = link.data?.url
  const code = url ? new URL(url).searchParams.get('start') ?? '' : ''

  return createPortal(
    <div className="tg-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="tg-modal" role="dialog" aria-modal="true" aria-labelledby="tg-connect-title">
        <button className="tg-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {done ? (
          <div className="tg-modal-done" aria-live="polite">
            <span className="tg-done-badge"><Check size={30} strokeWidth={3} /></span>
            <h3 id="tg-connect-title">Your Telegram is connected</h3>
            <p>New customer and technician messages will arrive there. Reply to an alert to answer.</p>
          </div>
        ) : (
          <>
            <TelegramMark size={46} />
            <h3 id="tg-connect-title">Connect your Telegram</h3>
            <div className="tg-modal-body">
              <div className="tg-qr">
                {url ? <QRCodeSVG value={url} size={148} marginSize={0} level="M" /> : <span className="tg-qr-wait">{link.isError ? '' : <Loader2 size={20} className="spin" />}</span>}
                <span>Scan with your phone</span>
              </div>
              <div className="tg-modal-steps">
                {link.isError ? (
                  <p className="tg-error" style={{ margin: 0 }}>
                    {apiError(link.error, 'The link could not be made.')}
                    <button className="btn btn-ghost btn-sm" onClick={() => link.refetch()}><RotateCw size={13} /> Try again</button>
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a className={`btn btn-primary tg-connect-btn${url ? '' : ' is-wait'}`} href={url ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!url}>
                      <TelegramMark size={16} color="#fff" plane="var(--telegram)" /> Open Telegram
                    </a>
                    <button className="btn btn-secondary btn-sm" disabled={!url} onClick={() => url && copy('link', url)} title="Copy the link to open it on another device">
                      {copied === 'link' ? <Check size={13} /> : <Link2 size={13} />} {copied === 'link' ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                )}
                <ol><li>Telegram opens <b>@{link.data?.botUsername ?? me.data?.bot?.username ?? 'our bot'}</b>.</li><li>Press <b>Start</b>.</li><li>This window confirms it.</li></ol>
                <p className="tg-waiting"><i /> {url ? 'Waiting for you to press Start…' : 'Making your link…'}</p>
                {url && (
                  <div className="tg-fallback">
                    Chat already open and nothing happened? Send this there:
                    <button className="tg-code" title="Copy" onClick={() => copy('code', `/start ${code}`)}>
                      <code>/start {code}</code> {copied === 'code' ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="tg-meta" style={{ marginTop: 14 }}>The link is just for you and works once, for 30 minutes.</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
