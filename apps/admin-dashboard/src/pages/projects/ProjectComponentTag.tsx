/**
 * ProjectComponentTag — the one shared "which project / which component" badge,
 * used everywhere a job, quote, invoice, or agreement needs to show where it came
 * from: the main Jobs/Finance/Agreements pages, the job detail modal, the
 * Scheduling board, and the dispatch side panel.
 */
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Layers } from 'lucide-react'
import { useProjectName } from './projectsApi'
import { useComponent } from './componentsApi'

export default function ProjectComponentTag({ projectId, componentId, tone = 'default' }: {
  projectId: string
  componentId?: string | null
  tone?: 'default' | 'hero'
}) {
  const { data: projectName } = useProjectName(projectId)
  const { data: component } = useComponent(componentId ?? undefined)
  const navigate = useNavigate()

  const style: React.CSSProperties = tone === 'hero'
    ? {
        display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700,
        padding: '2px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.28)', cursor: 'pointer',
      }
    : {
        display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 700,
        color: 'var(--blue)', background: 'var(--blue-dim)', padding: '1px 7px', borderRadius: 999,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}`) }}
      title="Open project"
      style={style}
    >
      <FolderKanban size={tone === 'hero' ? 10 : 9} />
      {projectName ?? 'Project'}
      {component && (
        <>
          <span style={{ opacity: 0.6 }}>·</span>
          <Layers size={tone === 'hero' ? 10 : 9} />
          {component.label}
        </>
      )}
    </button>
  )
}
