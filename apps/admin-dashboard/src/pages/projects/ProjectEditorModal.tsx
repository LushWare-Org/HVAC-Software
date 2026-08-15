/**
 * ProjectEditorModal — create / edit a project (DEMO: writes the mock store).
 * Single scrollable form: identity → schedule & crew → site map → notes.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Check, MapPin, Loader2, Layers, User, UserCheck, Briefcase, FileSignature, Receipt, CalendarClock, Settings2 } from 'lucide-react'
import MapPicker from '../../components/MapPickerLazy'
import {
  WEEKDAYS, useTechDirectory, useCreateProject, useUpdateProject,
  type Project, type ProjectStatus, type Weekday,
} from './projectsApi'
import { useProjectTemplates } from './templatesApi'
import CustomerPickerWithCreate, { type PickedCustomer } from '../../components/CustomerPickerWithCreate'
import { TechAvatar } from './shared'

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

const STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']

/** Quiet section divider — a rule with an inset eyebrow, matching the CRM card language. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
      <span style={{
        fontSize: 10.5, fontWeight: 800, color: 'var(--blue)',
        textTransform: 'uppercase', letterSpacing: '0.09em', flexShrink: 0,
      }}>
        {children}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
    </div>
  )
}

export default function ProjectEditorModal({ project, onClose }: { project?: Project; onClose: () => void }) {
  // Escape closes — standard modal affordance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const { data: techs } = useTechDirectory()
  const { data: allTemplates } = useProjectTemplates()
  const publishedTemplates = (allTemplates ?? []).filter(t => t.status === 'PUBLISHED')
  // Seeded from the project being edited (if it already has a customer) so the
  // same picker UI handles "assign for the first time" and "change" alike.
  const [pickedCustomer, setPickedCustomer] = useState<PickedCustomer | null>(
    project?.customerId ? { id: project.customerId, firstName: project.customerName ?? 'Customer', lastName: '' } : null
  )
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: project?.name ?? '',
    category: project?.category ?? '',
    status: project?.status ?? 'PLANNING' as ProjectStatus,
    description: project?.description ?? '',
    startDate: project?.startDate ?? '',
    targetEndDate: project?.targetEndDate ?? '',
    budget: project?.budget != null ? String(project.budget) : '',
    requiredHeadcount: project?.requiredHeadcount != null ? String(project.requiredHeadcount) : '',
    siteAddress: project?.siteAddress ?? '',
    latitude: project?.latitude ?? 6.9271,
    longitude: project?.longitude ?? 79.8612,
    workingDays: project?.workingDays ?? (['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as Weekday[]),
    baseTeamUserIds: project?.baseTeamUserIds ?? [],
    notes: project?.notes ?? '',
    templateId: (project?.templateId ?? undefined) as string | undefined,
    freeform: false,
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }))

  const toggleDay = (d: Weekday) =>
    set('workingDays', form.workingDays.includes(d)
      ? form.workingDays.filter(x => x !== d)
      : [...form.workingDays, d])

  const toggleTech = (id: string) =>
    set('baseTeamUserIds', form.baseTeamUserIds.includes(id)
      ? form.baseTeamUserIds.filter(x => x !== id)
      : [...form.baseTeamUserIds, id])

  const valid = !!form.name.trim()
  const saving = createProject.isPending || updateProject.isPending

  const save = async () => {
    if (!valid || saving) return
    setError('')
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || undefined,
      status: form.status,
      description: form.description.trim() || undefined,
      startDate: form.startDate || undefined,
      targetEndDate: form.targetEndDate || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      requiredHeadcount: form.requiredHeadcount ? Number(form.requiredHeadcount) : undefined,
      siteAddress: form.siteAddress.trim() || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
      workingDays: form.workingDays,
      baseTeamUserIds: form.baseTeamUserIds,
      notes: form.notes.trim() || undefined,
      customerId: pickedCustomer?.id,
    }
    try {
      if (project) await updateProject.mutateAsync({ id: project.id, ...payload })
      else await createProject.mutateAsync({ ...payload, templateId: form.templateId, freeform: form.freeform || undefined })
      onClose()
    } catch (e: any) {
      const msg = e?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to save project')
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '24px 20px',
      }}
      onClick={onClose}
    >
      <div
        className="card anim-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label={project ? 'Edit project' : 'New project'}
        style={{
          width: 1140, maxWidth: '96vw', padding: 0, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          // Lock to the viewport: header + footer stay pinned, only the body scrolls
          height: 'min(920px, calc(100vh - 48px))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Pinned header */}
        <div className="card-header" style={{ flexShrink: 0 }}>
          <div>
            <div className="card-title">{project ? 'Edit project' : 'New project'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 2 }}>
              {project ? 'Changes apply immediately after saving' : 'Groups weeks of work — jobs, crew and billing — under one customer engagement'}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X size={14} /></button>
        </div>

        {/* Scrollable body */}
        <div className="card-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* At a glance — only meaningful once the project has linked entities to summarize */}
          {project && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { icon: Briefcase, label: 'Jobs', value: project.jobs.length },
                { icon: FileSignature, label: 'Agreements', value: project.agreements.length },
                { icon: Receipt, label: 'Quotes / Invoices', value: project.quotes.length + project.invoices.length },
                { icon: CalendarClock, label: 'Created', value: new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-card-2)', border: '1px solid var(--bd)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <s.icon size={11} /> {s.label}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', margin: '4px 0 0' }}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <SectionLabel>Project</SectionLabel>
          {/* Identity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Project name *</label>
              <input style={inp} value={form.name} placeholder="Lotus Tower — HVAC Modernization"
                onChange={e => set('name', e.target.value)} />
            </div>
            <div style={{ gridColumn: pickedCustomer || showCustomerPicker ? '1 / -1' : undefined }}>
              <label style={lbl}>Customer</label>
              {showCustomerPicker ? (
                <CustomerPickerWithCreate
                  autoFocus
                  onPick={c => { setPickedCustomer(c); setShowCustomerPicker(false) }}
                  onCancel={() => setShowCustomerPicker(false)}
                />
              ) : pickedCustomer ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px',
                  borderRadius: 9, border: '1px solid var(--green)', background: 'var(--green-dim)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>
                    <UserCheck size={14} style={{ color: 'var(--green)' }} /> {`${pickedCustomer.firstName} ${pickedCustomer.lastName}`.trim()}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCustomerPicker(true)}>Change</button>
                </div>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCustomerPicker(true)}>
                  <User size={12} /> Select or create a customer
                </button>
              )}
              {!pickedCustomer && !showCustomerPicker && (
                <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '6px 0 0' }}>
                  Optional — you can add or change the customer any time from here.
                </p>
              )}
            </div>
            <div>
              <label style={lbl}>Category</label>
              <input style={inp} value={form.category} placeholder="Commercial retrofit"
                onChange={e => set('category', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={form.description}
                placeholder="Scope, phases, anything the office should know…"
                onChange={e => set('description', e.target.value)} />
            </div>
          </div>

          {/* Template — only choosable at creation, locked in afterward */}
          {!project && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={lbl}>Project template</label>
                <Link to="/projects/templates" style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Settings2 size={11} /> Manage templates
                </Link>
              </div>

              {/* Row 1 — two fixed primary options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: publishedTemplates.length > 0 ? 14 : 0 }}>
                <button onClick={() => setForm(f => ({ ...f, templateId: undefined, freeform: false }))} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
                  padding: '14px 16px', borderRadius: 10, fontFamily: 'inherit',
                  border: `1.5px solid ${!form.templateId && !form.freeform ? 'var(--blue)' : 'var(--bd)'}`,
                  background: !form.templateId && !form.freeform ? 'var(--blue-dim)' : 'var(--bg-card)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: !form.templateId && !form.freeform ? 'var(--blue)' : 'var(--t1)' }}>No template</span>
                    {!form.templateId && !form.freeform && <Check size={14} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4 }}>A single client with jobs, agreements, and finances. No component breakdown.</span>
                </button>

                <button onClick={() => setForm(f => ({ ...f, templateId: undefined, freeform: true }))} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
                  padding: '14px 16px', borderRadius: 10, fontFamily: 'inherit',
                  border: `1.5px solid ${form.freeform ? 'var(--blue)' : 'var(--bd)'}`,
                  background: form.freeform ? 'var(--blue-dim)' : 'var(--bg-card)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Layers size={14} style={{ color: form.freeform ? 'var(--blue)' : 'var(--t3)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: form.freeform ? 'var(--blue)' : 'var(--t1)' }}>Customized project</span>
                    {form.freeform && <Check size={14} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.4 }}>Start blank and add whatever components you need as you go — rooms, zones, anything. No predefined structure.</span>
                </button>
              </div>

              {/* Divider + Row 2 — real templates, only when at least one is published */}
              {publishedTemplates.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 10px' }}>
                    <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Or start from a template</span>
                    <span style={{ flex: 1, height: 1, background: 'var(--bd)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {publishedTemplates.map(t => {
                      const on = form.templateId === t.id
                      return (
                        <button key={t.id} onClick={() => setForm(f => ({ ...f, templateId: t.id, freeform: false }))} style={{
                          display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left', cursor: 'pointer',
                          padding: '11px 13px', borderRadius: 10, fontFamily: 'inherit',
                          border: `1px solid ${on ? 'var(--blue)' : 'var(--bd)'}`,
                          background: on ? 'var(--blue-dim)' : 'var(--bg-card)',
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Layers size={13} style={{ color: on ? 'var(--blue)' : 'var(--t3)' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? 'var(--blue)' : 'var(--t1)' }}>{t.name}</span>
                            {on && <Check size={12} style={{ color: 'var(--blue)', marginLeft: 'auto' }} />}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4 }}>
                            {t.description || t.componentTypes.map(c => c.label).join(', ')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {(form.templateId || form.freeform) && (
                <p style={{ fontSize: 11, color: 'var(--t4)', margin: '8px 0 0' }}>
                  Can't be changed after the project is created.
                </p>
              )}
            </div>
          )}

          {/* Schedule & sizing */}
          <SectionLabel>Schedule &amp; budget</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={lbl}>Status</label>
              <select className="select" style={{ width: '100%' }} value={form.status}
                onChange={e => set('status', e.target.value as ProjectStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Start</label>
              <input type="date" style={inp} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Target end</label>
              <input type="date" style={inp} value={form.targetEndDate} onChange={e => set('targetEndDate', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Budget</label>
              <input type="number" min={0} style={inp} value={form.budget} placeholder="120000"
                onChange={e => set('budget', e.target.value)} />
            </div>
          </div>

          {/* Working days + headcount */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>Working days</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {WEEKDAYS.map(d => {
                  const on = form.workingDays.includes(d)
                  return (
                    <button key={d} onClick={() => toggleDay(d)} style={{
                      width: 42, padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 11, fontWeight: 700,
                      border: `1px solid ${on ? 'var(--blue)' : 'var(--bd)'}`,
                      background: on ? 'var(--blue-dim)' : 'var(--bg-card)',
                      color: on ? 'var(--blue)' : 'var(--t4)',
                    }}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={lbl}>Required crew size</label>
              <input type="number" min={1} max={30} style={{ ...inp, width: 120 }} value={form.requiredHeadcount}
                placeholder="5" onChange={e => set('requiredHeadcount', e.target.value)} />
            </div>
          </div>

          {/* Base team */}
          <SectionLabel>Crew</SectionLabel>
          <div>
            <label style={lbl}>Base team — the default daily crew ({form.baseTeamUserIds.length} selected)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
              {(techs ?? []).map(t => {
                const on = form.baseTeamUserIds.includes(t.userId)
                return (
                  <button key={t.userId} onClick={() => toggleTech(t.userId)} style={{
                    display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                    border: `1px solid ${on ? 'var(--blue)' : 'var(--bd)'}`,
                    background: on ? 'var(--blue-dim)' : 'var(--bg-card)',
                  }}>
                    <TechAvatar userId={t.userId} size={28} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>{t.name}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: 'var(--t3)' }}>{t.skills.join(' · ')}</span>
                    </span>
                    {on && <Check size={14} style={{ color: 'var(--blue)', marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Site */}
          <SectionLabel>Site</SectionLabel>
          <div>
            <label style={lbl}>Site address</label>
            <input style={{ ...inp, marginBottom: 10 }} value={form.siteAddress}
              placeholder="Lotus Tower, D. R. Wijewardena Mawatha, Colombo 10"
              onChange={e => set('siteAddress', e.target.value)} />
            <MapPicker
              label="Pin the site on the map"
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
              height="220px"
            />
            <p style={{ fontSize: 10.5, color: 'var(--t4)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={10} /> The pin shows on the Day Planner and Dispatch maps as this project's site.
            </p>
          </div>

          {/* Notes */}
          <SectionLabel>Notes</SectionLabel>
          <div>
            <label style={lbl}>Notes</label>
            <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={form.notes}
              placeholder="Access instructions, security passes, crane bookings…"
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Pinned footer */}
        <div style={{ flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--bd)', background: 'var(--bg-card)' }}>
          {error && <span style={{ fontSize: 12, color: 'var(--red)', marginRight: 'auto' }}>{error}</span>}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!valid || saving} style={{ opacity: valid && !saving ? 1 : 0.5 }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {project ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
