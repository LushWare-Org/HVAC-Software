import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Eye, EyeOff, Pin, Loader2, X, Check, Video, Lightbulb, Tag, ImageOff, CheckCircle2 } from 'lucide-react'
import { useAdminPosts, useCreatePost, useUpdatePost, useDeletePost, type Post, type PostInput } from '../../hooks/usePosts'

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TIP:   { label: 'Tip',   icon: Lightbulb, color: 'var(--amber)' },
  VIDEO: { label: 'Video', icon: Video,     color: 'var(--blue)' },
  OFFER: { label: 'Offer', icon: Tag,       color: 'var(--green)' },
}

const EMPTY: PostInput & { title: string } = {
  type: 'TIP', title: '', body: '', videoUrl: '', heroImageUrl: '', isPinned: false, isPublished: false,
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function VideoEmbed({ url }: { url: string }) {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (ytMatch) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytMatch[1]}`}
        style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 8 }}
        allowFullScreen title="YouTube preview"
      />
    )
  }
  if (vimeoMatch) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
        style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 8 }}
        allowFullScreen title="Vimeo preview"
      />
    )
  }
  return <p style={{ fontSize: 12, color: 'var(--t4)' }}>Paste a YouTube or Vimeo URL to preview</p>
}

/**
 * Live preview for the hero image URL — catches the most common failure mode
 * (pasting a webpage link instead of a direct image link, or an http:// URL
 * that the customer portal's https origin silently blocks) before publishing.
 */
function ImagePreview({ url }: { url: string }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    setStatus('loading')
  }, [url])

  if (!url.trim()) return null

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        position: 'relative', width: '100%', height: 140, borderRadius: 8, overflow: 'hidden',
        border: '1px solid var(--bd)', background: 'var(--bg-card-2)',
      }}>
        <img
          src={url}
          alt="Hero preview"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('error')}
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: status === 'error' ? 'none' : 'block',
          }}
        />
        {status === 'loading' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t4)' }}>
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--red)' }}>
            <ImageOff size={18} />
            <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', padding: '0 12px' }}>
              This URL didn't load as an image
            </span>
          </div>
        )}
      </div>
      {status === 'ok' && (
        <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={11} /> Loads correctly
        </p>
      )}
      {status === 'error' && (
        <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 5, lineHeight: 1.5 }}>
          Make sure this is a direct link to an image file (not a webpage) — right-click the image itself and choose
          "Copy image address", not the page URL. It should start with <code>https://</code> and usually end in
          .jpg, .png, or .webp.
        </p>
      )}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-input)',
  color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: 5,
}

export default function ContentTab() {
  const { data: posts = [], isLoading } = useAdminPosts()
  const createMut = useCreatePost()
  const updateMut = useUpdatePost()
  const deleteMut = useDeletePost()

  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<PostInput & { title: string }>(EMPTY)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('ALL')

  const startNew = () => { setForm(EMPTY); setEditingId('new') }
  const startEdit = (p: Post) => {
    setForm({
      type: p.type, title: p.title, body: p.body ?? '',
      videoUrl: p.videoUrl ?? '', heroImageUrl: p.heroImageUrl ?? '',
      isPinned: p.isPinned, isPublished: p.isPublished,
    })
    setEditingId(p.id)
  }

  const save = () => {
    if (!form.title?.trim()) return
    const payload = {
      ...form,
      title: form.title.trim(),
      videoUrl: form.videoUrl?.trim() || undefined,
      heroImageUrl: form.heroImageUrl?.trim() || undefined,
    }
    if (editingId === 'new') {
      createMut.mutate(payload, { onSuccess: () => setEditingId(null) })
    } else if (editingId) {
      updateMut.mutate({ id: editingId, item: payload }, { onSuccess: () => setEditingId(null) })
    }
  }

  const togglePublish = (p: Post) =>
    updateMut.mutate({ id: p.id, item: { isPublished: !p.isPublished } })
  const togglePin = (p: Post) =>
    updateMut.mutate({ id: p.id, item: { isPinned: !p.isPinned } })

  const saving = createMut.isPending || updateMut.isPending
  const filtered = filterType === 'ALL' ? posts : posts.filter(p => p.type === filterType)
  const published = posts.filter(p => p.isPublished).length
  const drafts = posts.filter(p => !p.isPublished).length

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Portal Content</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
            Tips, how-to videos, and offers shown to customers in the portal.
            {posts.length > 0 && ` ${published} published · ${drafts} draft${drafts !== 1 ? 's' : ''}`}
          </div>
        </div>
        {editingId === null && (
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={13} /> New post
          </button>
        )}
      </div>

      {/* Type filter pills */}
      {editingId === null && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {(['ALL', 'TIP', 'VIDEO', 'OFFER'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="btn btn-sm"
              style={{
                background: filterType === t ? 'var(--blue)' : 'var(--bg-card-2)',
                color: filterType === t ? '#fff' : 'var(--t2)',
                border: `1px solid ${filterType === t ? 'var(--blue)' : 'var(--bd)'}`,
              }}
            >
              {t === 'ALL' ? 'All' : TYPE_META[t].label + 's'}
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      {editingId !== null && (
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 16 }}>
            {editingId === 'new' ? 'New post' : 'Edit post'}
          </div>

          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['TIP', 'VIDEO', 'OFFER'] as const).map(t => {
                const m = TYPE_META[t]
                const Icon = m.icon
                const active = form.type === t
                return (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8, border: `1px solid ${active ? m.color : 'var(--bd)'}`,
                      background: active ? 'var(--bg-card-2)' : 'none',
                      color: active ? m.color : 'var(--t3)', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <Icon size={13} /> {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Title *</label>
              <input style={inp} maxLength={200} value={form.title}
                placeholder={form.type === 'TIP' ? 'How to change your HVAC filter in 5 minutes' : form.type === 'VIDEO' ? 'Summer AC maintenance walkthrough' : 'Spring tune-up — 20% off this month'}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Body</label>
              <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' }} maxLength={5000}
                value={form.body ?? ''}
                placeholder="Content shown below the title in the customer portal…"
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
            </div>
            {form.type === 'VIDEO' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Video URL (YouTube or Vimeo)</label>
                <input style={inp} value={form.videoUrl ?? ''} placeholder="https://www.youtube.com/watch?v=…"
                  onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} />
                {form.videoUrl && (
                  <div style={{ marginTop: 10 }}><VideoEmbed url={form.videoUrl} /></div>
                )}
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Hero image URL <span style={{ fontWeight: 400, color: 'var(--t4)' }}>(optional)</span></label>
              <input style={inp} value={form.heroImageUrl ?? ''} placeholder="https://…/image.jpg"
                onChange={e => setForm(f => ({ ...f, heroImageUrl: e.target.value }))} />
              <ImagePreview url={form.heroImageUrl ?? ''} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPublished ?? false}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                Publish immediately
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isPinned ?? false}
                  onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} />
                Pin to top
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={save}
              disabled={saving || !form.title?.trim()}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editingId === 'new' ? 'Create' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Post list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              height: 64, borderRadius: 10, background: 'var(--bg-card-2)',
              border: '1px solid var(--bd)', opacity: 1 - i * 0.2,
            }} />
          ))}
        </div>
      ) : filtered.length === 0 && editingId === null ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--bg-card-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          }}>
            <Lightbulb size={22} style={{ color: 'var(--t4)' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 4 }}>
            No content yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 16 }}>
            Create your first tip, video, or offer for customers.
          </div>
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Plus size={13} /> Create first post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(p => {
            const meta = TYPE_META[p.type] ?? { label: p.type, icon: Lightbulb, color: 'var(--t3)' }
            const TypeIcon = meta.icon
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 10, border: '1px solid var(--bd)',
                background: 'var(--bg-card)',
                borderLeft: `3px solid ${p.isPublished ? meta.color : 'var(--bd)'}`,
                transition: 'box-shadow 0.15s ease',
              }}>
                {/* Type icon */}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: p.isPublished ? 'var(--bg-card-2)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TypeIcon size={13} style={{ color: p.isPublished ? meta.color : 'var(--t4)' }} />
                </div>

                {/* Title + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: p.isPublished ? 'var(--t1)' : 'var(--t3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {p.isPinned && <Pin size={10} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                    {p.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', color: p.isPublished ? meta.color : 'var(--t4)',
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--t4)' }}>·</span>
                    <span style={{
                      fontSize: 10, color: p.isPublished ? 'var(--green)' : 'var(--t4)',
                      fontWeight: 600,
                    }}>
                      {p.isPublished ? `Live · ${fmtDate(p.publishedAt)}` : 'Draft'}
                    </span>
                    {p.videoUrl && (
                      <>
                        <span style={{ fontSize: 10, color: 'var(--t4)' }}>·</span>
                        <span style={{ fontSize: 10, color: 'var(--blue)' }}>Has video</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-icon btn-sm"
                    title={p.isPinned ? 'Unpin' : 'Pin to top'}
                    onClick={() => togglePin(p)} disabled={updateMut.isPending}
                    style={{ color: p.isPinned ? 'var(--amber)' : undefined }}>
                    <Pin size={12} />
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => togglePublish(p)}
                    disabled={updateMut.isPending}
                    style={{ fontSize: 11, gap: 4 }}>
                    {p.isPublished
                      ? <><EyeOff size={11} /> Unpublish</>
                      : <><Eye size={11} /> Publish</>}
                  </button>
                  <button className="btn btn-secondary btn-icon btn-sm" title="Edit"
                    onClick={() => startEdit(p)}>
                    <Pencil size={12} />
                  </button>
                  {confirmDeleteId === p.id ? (
                    <span style={{ display: 'inline-flex', gap: 4 }}>
                      <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }}
                        onClick={() => { deleteMut.mutate(p.id); setConfirmDeleteId(null) }}>
                        Delete
                      </button>
                      <button className="btn btn-secondary btn-icon btn-sm"
                        onClick={() => setConfirmDeleteId(null)}>
                        <X size={12} />
                      </button>
                    </span>
                  ) : (
                    <button className="btn btn-secondary btn-icon btn-sm" title="Delete"
                      style={{ color: 'var(--t4)' }}
                      onClick={() => setConfirmDeleteId(p.id)}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
