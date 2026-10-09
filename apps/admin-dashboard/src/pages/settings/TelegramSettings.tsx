/**
 * Settings → Telegram. Connect the company's own bot (made in Telegram's BotFather),
 * see who gets their messages on Telegram, invite customers by email, and announce it in the portal.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight, BellRing, Check, Copy, Loader2, Mail, Megaphone, Pause, Play, Power, Search, ShieldCheck, Unlink, Users, Wrench, AlertTriangle,
} from 'lucide-react'
import TelegramMark from '../../components/TelegramMark'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useCreateAnnouncement } from '../../hooks/useAnnouncements'
import {
  apiError, inviteSummary, useConnectTelegram, useDisconnectTelegram, useInviteToTelegram, useTelegramEnabled, useTelegramLinks,
  useTelegramStatus, useUnlinkTelegram, type TelegramStatus,
} from '../../hooks/useTelegram'
import { TELEGRAM_ANNOUNCEMENT } from './announcementTemplates'
import MyTelegramAlerts from './MyTelegramAlerts'
import './telegram.css'

const ADMIN_ROLES = ['super_admin', 'company_admin']

export default function TelegramSettings() {
  const { user } = useAuth()
  const status = useTelegramStatus()
  const isAdmin = ADMIN_ROLES.includes(String(user?.role ?? '').toLowerCase())

  if (status.isLoading) {
    return <div className="card tg-card" style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}><Loader2 size={20} className="spin" style={{ color: 'var(--t3)' }} /></div>
  }
  if (status.isError || !status.data) {
    return (
      <div className="card tg-card">
        <p style={{ margin: 0, color: 'var(--t2)', fontSize: 14 }}>Telegram settings couldn't be loaded. Check the connection and try again.</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => status.refetch()}>Try again</button>
      </div>
    )
  }
  const s = status.data
  if (!s.available) {
    return (
      <div className="card tg-card">
        <Hero connected={false} />
        <p style={{ color: 'var(--t2)', fontSize: 14, marginTop: 16 }}>The Telegram add-on isn't switched on for this company. Ask HVACtor support to turn it on.</p>
      </div>
    )
  }
  return s.connected ? <Connected s={s} isAdmin={isAdmin} /> : <Setup isAdmin={isAdmin} />
}

// ─── Hero: the plane that flies while you look ──────────────────────────────

function Hero({ connected, bot }: { connected: boolean; bot?: TelegramStatus['bot'] }) {
  return (
    <div className={`tg-hero${connected ? ' is-live' : ''}`}>
      <div className="tg-hero-mark" aria-hidden="true">
        <span className="tg-hero-ring" />
        <span className="tg-hero-ring is-2" />
        <TelegramMark size={52} />
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 className="tg-title">{connected ? <>Telegram is connected</> : <>Chat with customers on Telegram</>}</h3>
        <p className="tg-sub">
          {connected && bot
            ? <>Customers who link <a href={bot.link} target="_blank" rel="noreferrer">@{bot.username}</a> get your replies on Telegram and can answer there. Everything still lands in Messages.</>
            : <>Your own company bot. Customers link it with one tap, get your replies on Telegram, and answer from there. Messages stays the full record; nothing changes for anyone who doesn't link.</>}
        </p>
      </div>
    </div>
  )
}

// ─── Not connected: three steps ─────────────────────────────────────────────

function Setup({ isAdmin }: { isAdmin: boolean }) {
  const connect = useConnectTelegram()
  const { showSuccess } = useToast()
  const [token, setToken] = useState('')
  const looksRight = /^\d{5,}:[A-Za-z0-9_-]{30,}$/.test(token.trim())

  const submit = () => {
    connect.mutate(token.trim(), {
      onSuccess: (s) => { setToken(''); showSuccess(`@${s.bot?.username} is connected`, 'Telegram connected') },
    })
  }

  return (
    <div className="card tg-card">
      <Hero connected={false} />
      <ol className="tg-steps">
        <li>
          <span className="tg-step-n">1</span>
          <div>
            <strong>Create your bot in Telegram</strong>
            <p>Open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather <ArrowUpRight size={12} /></a>, send <code>/newbot</code>, and give it your company name (for example "Orrix Engineering") and a username ending in <code>bot</code>.</p>
          </div>
        </li>
        <li>
          <span className="tg-step-n">2</span>
          <div>
            <strong>Copy the token</strong>
            <p>BotFather replies with a token like <code>123456789:AAH…</code>. Keep it private: it controls the bot.</p>
          </div>
        </li>
        <li>
          <span className="tg-step-n">3</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>Paste it here</strong>
            {isAdmin ? (
              <>
                <div className="tg-token-row">
                  <input
                    type="password" autoComplete="off" spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)}
                    placeholder="123456789:AAH…" aria-label="Bot token" className="tg-input"
                    onKeyDown={(e) => { if (e.key === 'Enter' && looksRight) submit() }}
                  />
                  <button className="btn btn-primary" onClick={submit} disabled={!looksRight || connect.isPending}>
                    {connect.isPending ? <Loader2 size={14} className="spin" /> : <TelegramMark size={14} color="#fff" plane="var(--telegram)" />}
                    {connect.isPending ? 'Checking with Telegram…' : 'Connect bot'}
                  </button>
                </div>
                {token && !looksRight && <p className="tg-hint">That doesn't look like a whole token yet. It's digits, a colon, then a long code.</p>}
                {connect.isError && <p className="tg-error"><AlertTriangle size={13} /> {apiError(connect.error, 'Telegram did not accept that token.')}</p>}
                <p className="tg-hint"><ShieldCheck size={12} /> The token is stored encrypted and is never shown again.</p>
              </>
            ) : (
              <p>Only a company admin can connect the bot.</p>
            )}
          </div>
        </li>
      </ol>
    </div>
  )
}

// ─── Connected ──────────────────────────────────────────────────────────────

function Connected({ s, isAdmin }: { s: TelegramStatus; isAdmin: boolean }) {
  const { showSuccess, showError } = useToast()
  const enabled = useTelegramEnabled()
  const disconnect = useDisconnectTelegram()
  const invite = useInviteToTelegram()
  const announce = useCreateAnnouncement()
  const [note, setNote] = useState('')
  const [confirmInvite, setConfirmInvite] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [copied, setCopied] = useState(false)
  const bot = s.bot!

  const copy = async () => {
    try { await navigator.clipboard.writeText(bot.link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* nothing to copy to */ }
  }
  const sendInvites = () => invite.mutate({ allCustomers: true, note: note.trim() || undefined }, {
    onSuccess: (r) => { setConfirmInvite(false); setNote(''); showSuccess(inviteSummary(r), 'Invites sent') },
    onError: (e) => showError(apiError(e, 'The invites could not be sent.')),
  })
  const announceInPortal = () => announce.mutate(TELEGRAM_ANNOUNCEMENT(), {
    onSuccess: () => showSuccess('Customers see it at the top of their portal dashboard. Edit it in Settings → Portal.', 'Announcement is live'),
    onError: (e) => showError(apiError(e, 'The announcement could not be created.')),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card tg-card">
        <Hero connected bot={bot} />
        <div className="tg-status-row">
          <span className={`tg-live${s.enabled ? '' : ' is-paused'}`}><i />{s.enabled ? 'Live' : 'Paused'}</span>
          <a className="tg-bot-chip" href={bot.link} target="_blank" rel="noreferrer"><TelegramMark size={16} /> @{bot.username} <ArrowUpRight size={12} /></a>
          <button className="btn btn-ghost btn-sm" onClick={copy} title="Copy the bot's link">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy link'}</button>
          {s.mode === 'polling' && <span className="tg-mode" title="Telegram can't reach this server directly, so it checks for messages every few seconds. On the live site it uses an instant webhook.">Local mode</span>}
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} disabled={enabled.isPending} onClick={() => enabled.mutate({ enabled: !s.enabled })}>
              {s.enabled ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
            </button>
          )}
        </div>
        {s.lastError && (
          <p className="tg-error" style={{ marginTop: 12 }}><AlertTriangle size={13} /> {s.lastError}</p>
        )}
        <div className="tg-stats">
          <Stat icon={<Users size={16} />} n={s.linked?.customers ?? 0} label="customers linked" />
          <Stat icon={<Wrench size={16} />} n={s.linked?.staff ?? 0} label="technicians linked" />
          <Stat icon={<BellRing size={16} />} n={s.linked?.office ?? 0} label="office staff get alerts" />
        </div>
        {isAdmin && (
          <label className="tg-switch-row">
            <input type="checkbox" style={{ width: 18, height: 18, accentColor: 'var(--telegram)', flexShrink: 0 }} checked={s.officeAlerts !== false} disabled={enabled.isPending} onChange={(e) => enabled.mutate({ officeAlerts: e.target.checked })} />
            <span><b>Office alerts on Telegram.</b> Office staff can link their own Telegram to get new customer and technician messages, and answer by replying. Turn off to keep the inbox in the dashboard only.</span>
          </label>
        )}
      </div>

      <MyTelegramAlerts />

      <div className="tg-grid">
        <div className="card tg-card">
          <h4 className="tg-h4"><Mail size={15} /> Invite customers by email</h4>
          <p className="tg-p">Each customer with an email gets their own one-tap link (works once, for 14 days). Anyone already linked is skipped.</p>
          {confirmInvite ? (
            <div className="tg-confirm">
              <textarea className="tg-input" rows={3} maxLength={600} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note at the top, e.g. You can now reach us on Telegram, too." aria-label="Note for the email" />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmInvite(false)} disabled={invite.isPending}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={sendInvites} disabled={invite.isPending || !s.enabled}>
                  {invite.isPending ? <Loader2 size={13} className="spin" /> : <Mail size={13} />} Email every customer
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmInvite(true)} disabled={!s.enabled}>
              <Mail size={13} /> Email invites
            </button>
          )}
          <p className="tg-hint">One customer at a time: open them in Customers and use <b>Invite to Telegram</b>, or ask Kelvin.</p>
        </div>

        <div className="card tg-card">
          <h4 className="tg-h4"><Megaphone size={15} /> Announce it in the portal</h4>
          <p className="tg-p">Adds a banner to every customer's portal dashboard with a <b>Connect Telegram</b> button. It hides itself for customers who have already linked.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={announceInPortal} disabled={announce.isPending || !s.enabled}>
              {announce.isPending ? <Loader2 size={13} className="spin" /> : <Megaphone size={13} />} Create announcement
            </button>
            <Link className="btn btn-ghost btn-sm" to="/settings?tab=portal">Edit announcements</Link>
          </div>
          <p className="tg-hint">Customers also see a Telegram card in Messages and in their profile, and technicians in the app.</p>
        </div>
      </div>

      <LinkedPeople />

      {isAdmin && (
        <div className="card tg-card tg-danger">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 className="tg-h4"><Power size={15} /> Disconnect the bot</h4>
            <p className="tg-p" style={{ margin: 0 }}>Linked chats stop getting messages. Conversations in Messages are kept. To use a different bot, paste its token after disconnecting.</p>
          </div>
          {confirmDisconnect ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDisconnect(false)}>Keep it</button>
              <button className="btn btn-danger btn-sm" disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(undefined, { onSuccess: () => showSuccess('Telegram is disconnected') })}>
                {disconnect.isPending ? <Loader2 size={13} className="spin" /> : <Power size={13} />} Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDisconnect(true)}>Disconnect</button>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ icon, n, label }: { icon: React.ReactNode; n: number; label: string }) {
  return (
    <div className="tg-stat">
      <span className="tg-stat-icon">{icon}</span>
      <span key={n} className="tg-stat-n">{n}</span>
      <span className="tg-stat-label">{label}</span>
    </div>
  )
}

function LinkedPeople() {
  const links = useTelegramLinks()
  const unlink = useUnlinkTelegram()
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (links.data ?? []).filter((l) => !t || l.name.toLowerCase().includes(t) || (l.telegramName ?? '').toLowerCase().includes(t))
  }, [links.data, q])

  return (
    <div className="card tg-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h4 className="tg-h4" style={{ margin: 0 }}><Users size={15} /> Who's on Telegram</h4>
        {(links.data?.length ?? 0) > 5 && (
          <label className="tg-search"><Search size={13} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find someone" aria-label="Find a linked person" /></label>
        )}
      </div>
      {links.isLoading ? (
        <div style={{ padding: 16, textAlign: 'center' }}><Loader2 size={16} className="spin" style={{ color: 'var(--t3)' }} /></div>
      ) : !links.data?.length ? (
        <p className="tg-p" style={{ marginTop: 10 }}>Nobody has linked yet. Send the email invites or announce it in the portal, and people appear here as they connect.</p>
      ) : (
        <ul className="tg-people">
          {rows.map((l) => (
            <li key={l.id}>
              <span className="tg-avatar">{l.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tg-person">
                  {l.customerId ? <Link to={`/customers?customer=${l.customerId}`}>{l.name}</Link> : l.name}
                  <span className="tg-kind">{l.memberKind === 'CUSTOMER' ? 'Customer' : l.role === 'technician' ? 'Technician' : 'Office'}</span>
                </div>
                <div className="tg-meta">{l.telegramName ?? 'Telegram'} · since {new Date(l.linkedAt).toLocaleDateString()}</div>
              </div>
              {confirm === l.id ? (
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirm(null)}>Keep</button>
                  <button className="btn btn-danger btn-sm" disabled={unlink.isPending} onClick={() => unlink.mutate(l.id, { onSuccess: () => setConfirm(null) })}>Unlink</button>
                </span>
              ) : (
                <button className="btn btn-ghost btn-sm" title="Stop sending them messages on Telegram" onClick={() => setConfirm(l.id)}><Unlink size={13} /></button>
              )}
            </li>
          ))}
          {!rows.length && <li className="tg-meta">Nobody matches "{q}".</li>}
        </ul>
      )}
    </div>
  )
}
