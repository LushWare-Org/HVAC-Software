/**
 * PortalBannerSettings — manage the customer-portal announcement banner.
 * Rendered as the "Portal" tab in Settings.
 */
import { useState } from 'react'
import { Megaphone, Plus, Trash2, Pencil, X, Check, Loader2, ExternalLink } from 'lucide-react'
import {
  useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
  type Announcement, type AnnouncementInput,
} from '../../hooks/useAnnouncements'

const EMPTY: AnnouncementInput = {
  title: '', body: '', linkUrl: '', linkLabel: '', accentColor: '#1a73e8', isActive: true,
  activeFrom: '', activeTo: '',
}

function BannerPreview({ a }: { a: AnnouncementInput }) {
  if (!a.title) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      borderRadius: 12, border: '1px solid var(--border, #E5E7EB)',
      borderLeft: `4px solid ${a.accentColor || '#1a73e8'}`,
      background: 'var(--bg-card, #fff)', marginTop: 12,
    }}>
      <Megaphone size={18} style={{ color: a.accentColor || '#1a73e8', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 14 }}>{a.title}</strong>
        {a.body && <div style={{ fontSize: 13, color: 'var(--t3, #6B7280)' }}>{a.body}</div>}
      </div>
      {a.linkUrl && (
        <span style={{
          fontSize: 12, fontWeight: 600, color: a.accentColor || '#1a73e8',
          display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
        }}>
          {a.linkLabel || 'Learn more'} <ExternalLink size={11} />
        </span>
      )}
      <X size={16} style={{ color: 'var(--t4, #9CA3AF)' }} />
    </div>
  )
}

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : ''
}

export default function PortalBannerSettings() {
  const { data: announcements = [], isLoading } = useAnnouncements()
  const createMut = useCreateAnnouncement()
  const updateMut = useUpdateAnnouncement()
  const deleteMut = useDeleteAnnouncement()

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<AnnouncementInput>(EMPTY)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startNew = () => { setForm(EMPTY); setEditingId('new') }
  const startEdit = (a: Announcement) => {
    setForm({
      title: a.title, body: a.body ?? '', linkUrl: a.linkUrl ?? '', linkLabel: a.linkLabel ?? '',
      accentColor: a.accentColor, isActive: a.isActive,
      activeFrom: toDateInput(a.activeFrom), activeTo: toDateInput(a.activeTo),
    })
    setEditingId(a.id)
  }

  const save = () => {
    if (!form.title?.trim()) return
    const payload: AnnouncementInput = {
      ...form,
      activeFrom: form.activeFrom || undefined,
      activeTo: form.activeTo || undefined,
    }
    if (editingId === 'new') {
      createMut.mutate(payload as AnnouncementInput & { title: string }, { onSuccess: () => setEditingId(null) })
    } else if (editingId) {
      updateMut.mutate({ id: editingId, item: payload }, { onSuccess: () => setEditingId(null) })
    }
  }

  const saving = createMut.isPending || updateMut.isPending
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border, #E5E7EB)', background: 'var(--bg-input, #fff)',
    color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Megaphone size={16} /> Customer Portal Banner
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 4 }}>
            Show your brand, seasonal tips, or special offers at the top of every customer's portal dashboard.
            The newest active announcement is displayed.
          </p>
        </div>
        {editingId === null && (
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={13} /> New announcement
          </button>
        )}
      </div>

      {/* Editor */}
      {editingId !== null && (
        <div style={{ border: '1px solid var(--border, #E5E7EB)', borderRadius: 12, padding: 16, marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} maxLength={120} value={form.title ?? ''} placeholder="Spring tune-up special — 20% off this month"
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Message</label>
              <textarea style={{ ...inputStyle, minHeight: 56, resize: 'vertical' }} maxLength={500} value={form.body ?? ''}
                placeholder="Optional supporting text shown under the title"
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Link URL</label>
              <input style={inputStyle} value={form.linkUrl ?? ''} placeholder="https://…"
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Link label</label>
              <input style={inputStyle} maxLength={40} value={form.linkLabel ?? ''} placeholder="Book now"
                onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Accent color</label>
              <input type="color" value={form.accentColor ?? '#1a73e8'} style={{ ...inputStyle, padding: 2, height: 36, cursor: 'pointer' }}
                onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingBottom: 8 }}>
                <input type="checkbox" checked={form.isActive ?? true}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                Active
              </label>
            </div>
            <div>
              <label style={labelStyle}>Show from (optional)</label>
              <input type="date" style={inputStyle} value={form.activeFrom ?? ''}
                onChange={e => setForm(f => ({ ...f, activeFrom: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Show until (optional)</label>
              <input type="date" style={inputStyle} value={form.activeTo ?? ''}
                onChange={e => setForm(f => ({ ...f, activeTo: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <label style={{ ...labelStyle, marginTop: 12 }}>Preview</label>
            <BannerPreview a={form} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.title?.trim()}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editingId === 'new' ? 'Create' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ marginTop: 16 }}>
        {isLoading ? (
          <div style={{ fontSize: 13, color: 'var(--t4)' }}>Loading…</div>
        ) : announcements.length === 0 && editingId === null ? (
          <div style={{ fontSize: 13, color: 'var(--t4)', padding: '12px 0' }}>
            No announcements yet — create one to light up the portal banner.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10, border: '1px solid var(--border, #E5E7EB)', marginTop: 8,
              opacity: a.isActive ? 1 : 0.55,
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: a.accentColor, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t4)' }}>
                  {a.isActive ? 'Active' : 'Inactive'}
                  {a.activeFrom ? ` · from ${a.activeFrom.slice(0, 10)}` : ''}
                  {a.activeTo ? ` · until ${a.activeTo.slice(0, 10)}` : ''}
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => updateMut.mutate({ id: a.id, item: { isActive: !a.isActive } })}
                disabled={updateMut.isPending}
              >
                {a.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn btn-secondary btn-icon btn-sm" title="Edit" onClick={() => startEdit(a)}>
                <Pencil size={13} />
              </button>
              {confirmDeleteId === a.id ? (
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { deleteMut.mutate(a.id); setConfirmDeleteId(null) }}>
                    Confirm
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDeleteId(null)}>
                    <X size={13} />
                  </button>
                </span>
              ) : (
                <button className="btn btn-secondary btn-icon btn-sm" title="Delete" onClick={() => setConfirmDeleteId(a.id)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
