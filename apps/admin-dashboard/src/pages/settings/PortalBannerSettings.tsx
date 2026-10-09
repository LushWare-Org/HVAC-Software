/**
 * Settings → Portal: announcements at the top of every customer's portal dashboard.
 * Start from a template or a blank one; pick an icon, what the button does
 * (open a link, connect Telegram, or nothing), a slim or spotlight style, and when it shows.
 */
import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import {
  AlertTriangle, ArrowUpRight, CalendarDays, Check, Copy, Gift, Leaf, Loader2, Megaphone, Pencil, Pin, Plus, Sparkles, Trash2, Wrench, X,
} from 'lucide-react'
import TelegramMark from '../../components/TelegramMark'
import {
  useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement,
  type Announcement, type AnnouncementAction, type AnnouncementIcon, type AnnouncementInput, type AnnouncementStyle,
} from '../../hooks/useAnnouncements'
import { useTelegramStatus } from '../../hooks/useTelegram'
import { ANNOUNCEMENT_TEMPLATES } from './announcementTemplates'
import './announcements.css'

const BLANK: AnnouncementInput = {
  title: '', body: '', linkUrl: '', linkLabel: '', accentColor: '#2563EB', icon: 'megaphone', ctaAction: 'none',
  style: 'card', dismissible: true, pinned: false, isActive: true, activeFrom: '', activeTo: '',
}

const ICONS: Array<{ id: AnnouncementIcon; label: string }> = [
  { id: 'megaphone', label: 'Megaphone' }, { id: 'telegram', label: 'Telegram' }, { id: 'sparkles', label: 'New' },
  { id: 'gift', label: 'Offer' }, { id: 'wrench', label: 'Service' }, { id: 'calendar', label: 'Dates' },
  { id: 'alert', label: 'Important' }, { id: 'leaf', label: 'Seasonal' },
]
const SWATCHES = ['#2563EB', '#229ED9', '#0E9F6E', '#D97706', '#DB2777', '#7C3AED', '#0F172A']

export function AnnouncementIconView({ icon, size = 18, color }: { icon: AnnouncementIcon | string; size?: number; color?: string }) {
  const style = { color, flexShrink: 0 }
  switch (icon) {
    case 'telegram': return <TelegramMark size={size} />
    case 'sparkles': return <Sparkles size={size} style={style} />
    case 'gift': return <Gift size={size} style={style} />
    case 'wrench': return <Wrench size={size} style={style} />
    case 'calendar': return <CalendarDays size={size} style={style} />
    case 'alert': return <AlertTriangle size={size} style={style} />
    case 'leaf': return <Leaf size={size} style={style} />
    default: return <Megaphone size={size} style={style} />
  }
}

/** The announcement as customers will see it in the portal. */
function Preview({ a }: { a: AnnouncementInput }) {
  const accent = a.accentColor || '#2563EB'
  const cta = a.ctaAction === 'telegram' ? (a.linkLabel || 'Connect Telegram') : a.ctaAction === 'link' && a.linkUrl ? (a.linkLabel || 'Learn more') : null
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={a.style}
        className={`ann-preview is-${a.style ?? 'card'}`}
        style={{ ['--accent' as string]: accent }}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
      >
        <span className="ann-preview-icon"><AnnouncementIconView icon={a.icon ?? 'megaphone'} size={a.style === 'spotlight' ? 22 : 17} color={a.style === 'spotlight' ? '#fff' : accent} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ann-preview-title">{a.title || 'Your headline'}</div>
          {a.body && <div className="ann-preview-body">{a.body}</div>}
        </div>
        {cta && <span className="ann-preview-cta">{a.ctaAction === 'telegram' && <TelegramMark size={14} color="#fff" plane={accent} />}{cta}{a.ctaAction === 'link' && <ArrowUpRight size={13} />}</span>}
        {a.dismissible !== false && <X size={15} className="ann-preview-x" />}
      </m.div>
    </AnimatePresence>
  )
}

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromRow = (a: Announcement): AnnouncementInput => ({
  title: a.title, body: a.body ?? '', linkUrl: a.linkUrl ?? '', linkLabel: a.linkLabel ?? '', accentColor: a.accentColor,
  icon: a.icon ?? 'megaphone', ctaAction: a.ctaAction ?? (a.linkUrl ? 'link' : 'none'), style: a.style ?? 'card',
  dismissible: a.dismissible ?? true, pinned: a.pinned ?? false, isActive: a.isActive,
  activeFrom: toDateInput(a.activeFrom), activeTo: toDateInput(a.activeTo),
})

/** When it shows, in words. */
function whenLabel(a: Announcement): string {
  const now = Date.now()
  if (!a.isActive) return 'Off'
  if (a.activeFrom && Date.parse(a.activeFrom) > now) return `Starts ${a.activeFrom.slice(0, 10)}`
  if (a.activeTo && Date.parse(a.activeTo) < now) return `Ended ${a.activeTo.slice(0, 10)}`
  return a.activeTo ? `Showing until ${a.activeTo.slice(0, 10)}` : 'Showing now'
}

export default function PortalBannerSettings() {
  const { data: announcements = [], isLoading } = useAnnouncements()
  const telegram = useTelegramStatus()
  const createMut = useCreateAnnouncement()
  const updateMut = useUpdateAnnouncement()
  const deleteMut = useDeleteAnnouncement()

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<AnnouncementInput>(BLANK)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const set = (patch: Partial<AnnouncementInput>) => setForm((f) => ({ ...f, ...patch }))
  const telegramReady = !!(telegram.data?.connected && telegram.data.enabled)

  const startNew = (from?: AnnouncementInput) => { setForm({ ...BLANK, ...from }); setEditingId('new') }
  const startEdit = (a: Announcement) => { setForm(fromRow(a)); setEditingId(a.id) }

  const linkMissing = form.ctaAction === 'link' && !/^https?:\/\//i.test(form.linkUrl ?? '')
  const canSave = !!form.title?.trim() && !linkMissing
  const save = () => {
    if (!canSave) return
    const payload: AnnouncementInput = {
      ...form,
      linkUrl: form.ctaAction === 'link' ? form.linkUrl : '',
      activeFrom: form.activeFrom || undefined,
      activeTo: form.activeTo || undefined,
    }
    if (editingId === 'new') createMut.mutate(payload as AnnouncementInput & { title: string }, { onSuccess: () => setEditingId(null) })
    else if (editingId) updateMut.mutate({ id: editingId, item: payload }, { onSuccess: () => setEditingId(null) })
  }
  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="card ann-card">
      <div className="ann-head">
        <div>
          <h3 className="ann-title"><Megaphone size={16} /> Portal announcements</h3>
          <p className="ann-sub">Shown at the top of every customer's portal dashboard. Pinned ones come first; with several, they take turns.</p>
        </div>
        {editingId === null && <button className="btn btn-primary btn-sm" onClick={() => startNew()}><Plus size={13} /> New announcement</button>}
      </div>

      {editingId === null && (
        <div className="ann-templates" role="group" aria-label="Start from a template">
          <span className="ann-templates-label">Start from</span>
          {ANNOUNCEMENT_TEMPLATES.map((t) => (
            <button key={t.id} className="ann-template" onClick={() => startNew(t.make())}>
              <AnnouncementIconView icon={t.make().icon ?? 'megaphone'} size={14} color={t.make().accentColor} /> {t.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {editingId !== null && (
          <m.div className="ann-editor" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
            <div className="ann-editor-grid">
              <div className="ann-fields">
                <label className="ann-label">Headline
                  <input className="ann-input" maxLength={120} value={form.title ?? ''} placeholder="Book your seasonal tune-up" onChange={(e) => set({ title: e.target.value })} />
                </label>
                <label className="ann-label">Message
                  <textarea className="ann-input" rows={2} maxLength={500} value={form.body ?? ''} placeholder="A line or two under the headline" onChange={(e) => set({ body: e.target.value })} />
                </label>

                <div className="ann-label">Icon
                  <div className="ann-icons" role="radiogroup" aria-label="Icon">
                    {ICONS.map((i) => (
                      <button key={i.id} type="button" role="radio" aria-checked={form.icon === i.id} title={i.label}
                        className={`ann-icon${form.icon === i.id ? ' is-on' : ''}`} onClick={() => set({ icon: i.id, ...(i.id === 'telegram' && form.accentColor === BLANK.accentColor ? { accentColor: '#229ED9' } : {}) })}>
                        <AnnouncementIconView icon={i.id} size={16} color={form.icon === i.id ? form.accentColor : 'var(--t2)'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ann-label">Button
                  <div className="ann-seg" role="radiogroup" aria-label="Button">
                    {([['none', 'No button'], ['link', 'Open a link'], ['telegram', 'Connect Telegram']] as Array<[AnnouncementAction, string]>).map(([id, label]) => (
                      <button key={id} type="button" role="radio" aria-checked={form.ctaAction === id} className={form.ctaAction === id ? 'is-on' : ''}
                        onClick={() => set({ ctaAction: id, ...(id === 'telegram' ? { icon: 'telegram', linkLabel: form.linkLabel || 'Connect Telegram' } : {}) })}>
                        {id === 'telegram' && <TelegramMark size={13} />} {label}
                      </button>
                    ))}
                  </div>
                  {form.ctaAction === 'telegram' && (
                    <span className={`ann-note${telegramReady ? '' : ' is-warn'}`}>
                      {telegramReady
                        ? 'Opens a one-tap Telegram link for that customer. Hidden for customers who have already linked.'
                        : 'Telegram isn\'t connected (or is paused), so customers won\'t see this one until it is. Set it up in Settings → Telegram.'}
                    </span>
                  )}
                </div>
                {form.ctaAction === 'link' && (
                  <div className="ann-row">
                    <label className="ann-label" style={{ flex: 2 }}>Link
                      <input className="ann-input" value={form.linkUrl ?? ''} placeholder="https://…" onChange={(e) => set({ linkUrl: e.target.value })} aria-invalid={linkMissing} />
                    </label>
                    <label className="ann-label" style={{ flex: 1 }}>Button text
                      <input className="ann-input" maxLength={40} value={form.linkLabel ?? ''} placeholder="Book now" onChange={(e) => set({ linkLabel: e.target.value })} />
                    </label>
                  </div>
                )}
                {form.ctaAction === 'telegram' && (
                  <label className="ann-label">Button text
                    <input className="ann-input" maxLength={40} value={form.linkLabel ?? ''} placeholder="Connect Telegram" onChange={(e) => set({ linkLabel: e.target.value })} />
                  </label>
                )}

                <div className="ann-row">
                  <div className="ann-label">Style
                    <div className="ann-seg" role="radiogroup" aria-label="Style">
                      {([['card', 'Slim'], ['spotlight', 'Spotlight']] as Array<[AnnouncementStyle, string]>).map(([id, label]) => (
                        <button key={id} type="button" role="radio" aria-checked={form.style === id} className={form.style === id ? 'is-on' : ''} onClick={() => set({ style: id })}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="ann-label">Colour
                    <div className="ann-swatches">
                      {SWATCHES.map((c) => (
                        <button key={c} type="button" aria-label={`Colour ${c}`} className={`ann-swatch${form.accentColor === c ? ' is-on' : ''}`} style={{ background: c }} onClick={() => set({ accentColor: c })} />
                      ))}
                      <input type="color" aria-label="Custom colour" value={form.accentColor ?? '#2563EB'} onChange={(e) => set({ accentColor: e.target.value })} className="ann-color" />
                    </div>
                  </div>
                </div>

                <div className="ann-row">
                  <label className="ann-label">Show from
                    <input type="date" className="ann-input" value={form.activeFrom ?? ''} onChange={(e) => set({ activeFrom: e.target.value })} />
                  </label>
                  <label className="ann-label">Until
                    <input type="date" className="ann-input" value={form.activeTo ?? ''} onChange={(e) => set({ activeTo: e.target.value })} />
                  </label>
                </div>
                <div className="ann-checks">
                  <label><input type="checkbox" checked={form.isActive ?? true} onChange={(e) => set({ isActive: e.target.checked })} /> On</label>
                  <label><input type="checkbox" checked={form.pinned ?? false} onChange={(e) => set({ pinned: e.target.checked })} /> Pin to the front</label>
                  <label><input type="checkbox" checked={form.dismissible ?? true} onChange={(e) => set({ dismissible: e.target.checked })} /> Customers can close it</label>
                </div>
              </div>

              <div className="ann-preview-col">
                <span className="ann-label" style={{ marginBottom: 8 }}>How customers see it</span>
                <Preview a={form} />
              </div>
            </div>

            <div className="ann-actions">
              {linkMissing && <span className="ann-note is-warn" style={{ marginRight: 'auto' }}>Add a link starting with https://, or choose No button.</span>}
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !canSave}>
                {saving ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                {editingId === 'new' ? 'Publish' : 'Save changes'}
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="ann-list">
        {isLoading ? (
          <div className="ann-empty"><Loader2 size={16} className="spin" /></div>
        ) : announcements.length === 0 && editingId === null ? (
          <div className="ann-empty">No announcements yet. Start from a template above, or write your own.</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className={`ann-item${a.isActive ? '' : ' is-off'}`}>
              <span className="ann-item-icon" style={{ background: `color-mix(in srgb, ${a.accentColor} 14%, transparent)` }}>
                <AnnouncementIconView icon={a.icon ?? 'megaphone'} size={16} color={a.accentColor} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ann-item-title">
                  {a.pinned && <Pin size={12} aria-label="Pinned" />}{a.title}
                </div>
                <div className="ann-item-meta">
                  {whenLabel(a)}
                  {a.ctaAction === 'telegram' ? ' · Connect Telegram button' : a.ctaAction === 'link' && a.linkUrl ? ` · ${a.linkLabel || 'Learn more'} button` : ''}
                  {a.style === 'spotlight' ? ' · Spotlight' : ''}
                </div>
              </div>
              <label className="ann-switch" title={a.isActive ? 'Turn off' : 'Turn on'}>
                <input type="checkbox" checked={a.isActive} disabled={updateMut.isPending} onChange={() => updateMut.mutate({ id: a.id, item: { isActive: !a.isActive } })} />
                <span />
              </label>
              <button className="btn btn-ghost btn-icon btn-sm" title="Edit" aria-label="Edit" onClick={() => startEdit(a)}><Pencil size={13} /></button>
              <button className="btn btn-ghost btn-icon btn-sm" title="Duplicate" aria-label="Duplicate" onClick={() => startNew({ ...fromRow(a), title: `${a.title} (copy)`, isActive: false })}><Copy size={13} /></button>
              {confirmDeleteId === a.id ? (
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { deleteMut.mutate(a.id); setConfirmDeleteId(null) }}>Delete</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteId(null)} aria-label="Keep it"><X size={13} /></button>
                </span>
              ) : (
                <button className="btn btn-ghost btn-icon btn-sm" title="Delete" aria-label="Delete" onClick={() => setConfirmDeleteId(a.id)}><Trash2 size={13} /></button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
