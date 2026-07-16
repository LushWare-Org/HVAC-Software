/**
 * Projects tab — always present in the tab bar (fix: previously vanished
 * from the tab list entirely when the customer had zero projects, causing
 * layout shift). Shows its own empty state instead.
 */
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CalendarRange, ExternalLink } from 'lucide-react'
import { useCustomerProjects, STATUS_META } from '../../projects/projectsApi'

export default function ProjectsTab({ customerId }: { customerId: string }) {
  const navigate = useNavigate()
  const { data: projects } = useCustomerProjects(customerId || undefined)
  const list = projects ?? []

  if (list.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', textAlign: 'center' }}>
        <FolderKanban size={36} style={{ color: 'var(--t4)', opacity: 0.4, marginBottom: 10 }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', margin: 0 }}>No projects yet</p>
        <p style={{ fontSize: 11.5, color: 'var(--t4)', marginTop: 4 }}>
          Multi-visit projects for this customer will show up here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {list.map(pr => {
        const meta = STATUS_META[pr.status] ?? STATUS_META.PLANNING
        return (
          <button
            key={pr.id}
            onClick={() => navigate(`/projects/${pr.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--bg-card-2)', border: '1px solid var(--bd)',
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: meta.dim, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderKanban size={14} style={{ color: meta.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--t1)' }}>{pr.name}</p>
              <p style={{ fontSize: 11, color: 'var(--t3)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CalendarRange size={10} />
                {pr.startDate ?? '—'} → {pr.targetEndDate ?? '—'}
              </p>
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 999,
              background: meta.dim, color: meta.color, whiteSpace: 'nowrap',
            }}>
              {meta.label}
            </span>
            <ExternalLink size={12} style={{ color: 'var(--t4)', flexShrink: 0 }} />
          </button>
        )
      })}
    </div>
  )
}
