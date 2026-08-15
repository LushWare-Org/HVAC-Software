/**
 * TemplatesPage — the Template Library. Reusable, admin-authored "recipes" for
 * a project's component structure. Spec:
 * docs/superpowers/specs/2026-08-14-project-component-templates-design.md
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Layers, Lock, Trash2, Copy, Check, X, User, UserX, Send, EyeOff } from 'lucide-react'
import { useProjectTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useSetTemplateStatus, type ProjectTemplate } from './templatesApi'
import type { ComponentTypeMeta } from './projectsApi'
import { useToast } from '../../contexts/ToastContext'

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  border: '1px solid var(--bd)', background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--t1)', fontFamily: 'inherit', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: 6,
}

function blankType(): ComponentTypeMeta {
  return { key: '', label: '', customerAssignable: true }
}

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function TemplateEditorModal({ template, seedFrom, onClose }: { template?: ProjectTemplate; seedFrom?: ProjectTemplate; onClose: () => void }) {
  const { showError, showSuccess } = useToast()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const seed = template ?? seedFrom
  const [name, setName] = useState(seedFrom ? `${seedFrom.name} (copy)` : seed?.name ?? '')
  const [description, setDescription] = useState(seed?.description ?? '')
  const [types, setTypes] = useState<ComponentTypeMeta[]>(
    seed?.componentTypes?.length ? seed.componentTypes.map(t => ({ ...t })) : [blankType()],
  )

  const saving = createTemplate.isPending || updateTemplate.isPending
  const valid = !!name.trim() && types.length > 0 && types.every(t => t.label.trim())
  const readOnly = !!template?.isBuiltIn

  const setType = (i: number, patch: Partial<ComponentTypeMeta>) => {
    setTypes(ts => ts.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }
  const addType = () => setTypes(ts => [...ts, blankType()])
  const removeType = (i: number) => setTypes(ts => ts.filter((_, idx) => idx !== i))

  const save = async () => {
    if (!valid || saving) return
    // Derive a stable key from the label if the row hasn't had one typed explicitly.
    const componentTypes = types.map(t => ({ ...t, key: t.key || slugify(t.label) }))
    const keys = componentTypes.map(t => t.key)
    if (new Set(keys).size !== keys.length) {
      showError('Component type labels must be unique')
      return
    }
    try {
      if (template) await updateTemplate.mutateAsync({ id: template.id, name: name.trim(), description: description.trim() || undefined, componentTypes })
      else await createTemplate.mutateAsync({ name: name.trim(), description: description.trim() || undefined, componentTypes })
      showSuccess(template ? 'Template updated' : 'Template created')
      onClose()
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to save template')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px',
      }}
      onClick={onClose}
    >
      <div className="card anim-fade-up" role="dialog" aria-modal="true" style={{ width: 640, maxWidth: '96vw', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }} onClick={e => e.stopPropagation()}>
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div className="card-title">{template ? 'Edit template' : seedFrom ? 'Duplicate template' : 'New template'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Template name *</label>
            <input style={inp} value={name} placeholder="Boutique Hotel" disabled={readOnly} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 50, resize: 'vertical' }} value={description} disabled={readOnly}
              placeholder="A property broken into rooms, common areas, and plant rooms."
              onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label style={lbl}>Component types</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {types.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 9, border: '1px solid var(--bd)', background: 'var(--bg-card-2)' }}>
                  <input
                    style={{ ...inp, flex: 1 }}
                    value={t.label}
                    placeholder="Room, Lobby, Production Line…"
                    disabled={readOnly}
                    onChange={e => setType(i, { label: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setType(i, { customerAssignable: !t.customerAssignable })}
                    disabled={readOnly}
                    title={t.customerAssignable ? 'Can have an owner' : 'Never has an owner'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8,
                      border: `1px solid ${t.customerAssignable ? 'var(--green)' : 'var(--bd)'}`,
                      background: t.customerAssignable ? 'var(--green-dim)' : 'var(--bg-card)',
                      color: t.customerAssignable ? 'var(--green)' : 'var(--t4)',
                      fontSize: 11, fontWeight: 600, cursor: readOnly ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}
                  >
                    {t.customerAssignable ? <User size={12} /> : <UserX size={12} />}
                    {t.customerAssignable ? 'Owner OK' : 'No owner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeType(i)}
                    disabled={readOnly || types.length === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ opacity: readOnly || types.length === 1 ? 0.35 : 1, flexShrink: 0 }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {!readOnly && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={addType} style={{ marginTop: 8 }}>
                <Plus size={12} /> Add component type
              </button>
            )}
            <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '8px 0 0' }}>
              "Owner OK" is a ceiling — each project built from this template can still turn ownership off for that type, but never on if it's off here.
            </p>
          </div>
        </div>

        <div style={{ flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--bd)' }}>
          {readOnly ? (
            <>
              <p style={{ fontSize: 11.5, color: 'var(--t4)', margin: 0, marginRight: 'auto', alignSelf: 'center' }}>Built-in — duplicate it to customize.</p>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid || saving} style={{ opacity: valid && !saving ? 1 : 0.5 }}>
                <Check size={13} /> {template ? 'Save changes' : 'Create template'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const navigate = useNavigate()
  const { data: templates, isLoading } = useProjectTemplates()
  const deleteTemplate = useDeleteTemplate()
  const setStatus = useSetTemplateStatus()
  const { showError, showSuccess } = useToast()
  const [editing, setEditing] = useState<ProjectTemplate | 'new' | null>(null)
  const [duplicating, setDuplicating] = useState<ProjectTemplate | null>(null)

  const duplicate = (t: ProjectTemplate) => {
    setDuplicating(t)
  }

  const remove = async (t: ProjectTemplate) => {
    if (!confirm(`Delete "${t.name}"? This can't be undone.`)) return
    try {
      await deleteTemplate.mutateAsync(t.id)
      showSuccess('Template deleted')
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to delete — it may still be in use')
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={14} /></button>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>Project Templates</h1>
      </div>
      <p style={{ fontSize: 12.5, color: '#94A3B8', margin: '0 0 20px 46px' }}>
        Reusable structures for your projects — define the component types once, use them across any number of projects.
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={13} /> New template
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: 12, background: 'var(--bg-hover)' }} />)}
        </div>
      ) : (templates ?? []).length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Layers size={28} style={{ color: 'var(--t4)', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>No templates yet</p>
          <p style={{ fontSize: 12, color: 'var(--t4)', margin: '4px 0 0' }}>Create one to give a project a customizable component structure.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {(templates ?? []).map(t => (
            <div key={t.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}
              onClick={() => setEditing(t)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  <Layers size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                    background: t.status === 'PUBLISHED' ? 'var(--green-dim)' : 'var(--amber-dim)',
                    color: t.status === 'PUBLISHED' ? 'var(--green)' : 'var(--amber)',
                  }}>
                    {t.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </span>
                  {t.isBuiltIn && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: 'var(--t4)', background: 'var(--bg-card-2)', padding: '2px 7px', borderRadius: 999 }}>
                      <Lock size={9} /> Built-in
                    </span>
                  )}
                </div>
              </div>
              {t.description && <p style={{ fontSize: 11.5, color: 'var(--t3)', margin: 0, lineHeight: 1.4 }}>{t.description}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {t.componentTypes.map(c => (
                  <span key={c.key} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t2)', background: 'var(--bg-card-2)', border: '1px solid var(--bd)', padding: '2px 8px', borderRadius: 999 }}>
                    {c.label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
                {!t.isBuiltIn && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setEditing(t) }} style={{ flex: 1 }}>Edit</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); setStatus.mutate({ id: t.id, status: t.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }) }}
                      disabled={setStatus.isPending}
                      title={t.status === 'PUBLISHED' ? 'Unpublish — hide from the New Project picker' : 'Publish — make selectable in the New Project picker'}
                    >
                      {t.status === 'PUBLISHED' ? <EyeOff size={12} /> : <Send size={12} />}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); remove(t) }} title="Delete"><Trash2 size={12} /></button>
                  </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); duplicate(t) }} title="Duplicate into a custom template"><Copy size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateEditorModal
          template={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {duplicating && (
        <TemplateEditorModal
          seedFrom={duplicating}
          onClose={() => setDuplicating(null)}
        />
      )}
    </div>
  )
}
