/**
 * ProjectJobLinkPicker — optional "link this job to a project (and house)" control.
 * Collapsed by default behind a small button so it doesn't add weight to the common
 * non-project job. Once a project is picked, a second cascading select appears only
 * if that project's template actually has a sub-entity to narrow down to (today:
 * Housing Scheme's houses). Adding a future template's own sub-entity (e.g. a Hotel's
 * Areas) is one more `else if (selectedProject?.templateType === 'HOTEL')` branch here,
 * not a rewrite of this component.
 */
import { useMemo, useState } from 'react'
import { Briefcase, X } from 'lucide-react'
import { useProjectsFull } from '../pages/projects/projectsApi'
import { useHouses } from '../pages/projects/housesApi'

export interface ProjectJobLink {
  projectId?: string
  projectName?: string
  houseId?: string
  houseLabel?: string
}

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--t3)',
  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6,
}

export default function ProjectJobLinkPicker({ value, onChange, customerId }: {
  value: ProjectJobLink
  onChange: (link: ProjectJobLink) => void
  /** When set, that customer's own projects are sorted to the top of the list. */
  customerId?: string
}) {
  const [expanded, setExpanded] = useState(!!value.projectId)
  const [search, setSearch] = useState('')
  const { projects } = useProjectsFull()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? projects.filter(p => p.name.toLowerCase().includes(q) || (p.customerName ?? '').toLowerCase().includes(q))
      : projects
    return customerId
      ? [...list].sort((a, b) => (b.customerId === customerId ? 1 : 0) - (a.customerId === customerId ? 1 : 0))
      : list
  }, [projects, search, customerId])

  const selectedProject = value.projectId ? projects.find(p => p.id === value.projectId) : undefined
  const housesQ = useHouses(selectedProject?.templateType === 'HOUSING_SCHEME' ? selectedProject.id : undefined)

  if (!expanded) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpanded(true)}>
        <Briefcase size={12} /> Link to a project
      </button>
    )
  }

  if (value.projectId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px',
          borderRadius: 8, border: '1px solid var(--blue)', background: 'var(--blue-dim)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)' }}>
            <Briefcase size={12} style={{ color: 'var(--blue)' }} /> {value.projectName}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({})}>Change</button>
        </div>

        {selectedProject?.templateType === 'HOUSING_SCHEME' && (
          <div>
            <label style={lbl}>Which house? (optional)</label>
            <select
              className="select"
              style={{ width: '100%' }}
              value={value.houseId ?? ''}
              onChange={e => {
                const house = housesQ.data?.find(h => h.id === e.target.value)
                onChange({ ...value, houseId: house?.id, houseLabel: house?.label })
              }}
            >
              <option value="">General — not house-specific</option>
              {(housesQ.data ?? []).map(h => (
                <option key={h.id} value={h.id}>{h.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ ...lbl, marginBottom: 0 }}>Project</label>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setExpanded(false)}>
          <X size={11} /> Not project-based
        </button>
      </div>
      <input
        className="form-input"
        autoFocus
        placeholder="Search projects by name or customer…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <span style={{ fontSize: 12, color: 'var(--t4)' }}>No matching projects.</span>
        ) : filtered.slice(0, 20).map(p => (
          <button
            key={p.id}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => onChange({ projectId: p.id, projectName: p.name })}
          >
            {p.name}{p.customerName ? ` · ${p.customerName}` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
