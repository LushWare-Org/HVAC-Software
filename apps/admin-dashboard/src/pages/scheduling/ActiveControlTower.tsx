/**
 * ActiveControlTower — "Active" sub-view, redesigned per the approved
 * mockup (Active · A — live control tower): one lane per technician with a
 * shared 4-stage lifecycle track. Same underlying data
 * (activeAssignmentsWithJob) and the same status-transition mutation as the
 * old Dispatch board's Active tab — only the presentation is new. Uses the
 * app's theme tokens throughout so it renders correctly in light, dark, and
 * black theme (not hardcoded to one dark palette).
 */
import { Loader2, Truck, MapPin, CheckCircle2, Briefcase } from 'lucide-react'
import Avatar from '../../components/Avatar'

const TL_ORDER = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED']
const TL_LABELS = ['Assigned', 'En route', 'On site', 'Done']
const STAGE_COLOR: Record<string, string> = { ASSIGNED: 'var(--blue)', EN_ROUTE: 'var(--amber)', ON_SITE: 'var(--violet)', COMPLETED: 'var(--green)' }
const NEXT: Record<string, { label: string; status: string; icon: any }> = {
  ASSIGNED: { label: 'En route', status: 'EN_ROUTE', icon: Truck },
  EN_ROUTE: { label: 'Arrived', status: 'ON_SITE', icon: MapPin },
  ON_SITE: { label: 'Complete', status: 'COMPLETED', icon: CheckCircle2 },
}

function timeElapsed(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

export default function ActiveControlTower({
  isLoading, rows, availableTechs, onOpenAssignment, onAdvance, isAdvancing,
}: {
  isLoading: boolean
  rows: Array<{ assignment: any; technician?: { id: string; name: string; avatarUrl?: string }; job?: any }>
  availableTechs: Array<{ id: string; name: string; avatarUrl?: string }>
  onOpenAssignment: (job: any, assignment: any) => void
  onAdvance: (assignmentId: string, nextStatus: string, jobId?: string) => void
  isAdvancing: boolean
}) {
  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: 'var(--t4)' }}><Loader2 size={22} className="spin" style={{ marginRight: 8 }} /> Loading live operations…</div>
  }

  const busyTechIds = new Set(rows.map(r => r.technician?.id).filter(Boolean))
  const idleTechs = availableTechs.filter(t => !busyTechIds.has(t.id))

  return (
    <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Live operations</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)' }}>· {busyTechIds.size} techs · {rows.length} active jobs</span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--t3)', flexWrap: 'wrap' }}>
          {(['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED'] as const).map(s => (
            <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLOR[s] }} /> {TL_LABELS[TL_ORDER.indexOf(s)]}
            </span>
          ))}
        </div>
      </div>

      {rows.length === 0 && idleTechs.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Briefcase size={30} style={{ color: 'var(--t4)', opacity: 0.6, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0 }}>No active assignments. Assign jobs from the Board tab to get started.</p>
        </div>
      ) : (
        <>
          {rows.map(({ assignment: a, technician: tech, job }) => {
            const currentIdx = TL_ORDER.indexOf(a.status)
            const next = NEXT[a.status]
            const stageColor = STAGE_COLOR[a.status] ?? 'var(--blue)'
            const elapsed = a.assignedAt ? timeElapsed(a.assignedAt) : null
            const pct = currentIdx <= 0 ? 6 : Math.min(94, (currentIdx / 3) * 88 + 6)

            return (
              <div
                key={a.id}
                onClick={() => onOpenAssignment(job, a)}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'var(--bg-card-2)', border: '1px solid var(--bd)', borderLeft: `3px solid ${stageColor}`, borderRadius: 13, height: 112, overflow: 'hidden', cursor: 'pointer' }}
              >
                <div style={{ width: 207, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 11, borderRight: '1px solid var(--bd)', height: '100%' }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={tech?.name} avatarUrl={tech?.avatarUrl} size={36} radius={18} fontSize={12} />
                    <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg-card-2)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tech?.name ?? 'Unassigned'}</div>
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 1 }}>{elapsed ? `${elapsed} elapsed` : ''}</div>
                  </div>
                </div>

                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  <div style={{ position: 'absolute', left: '6%', right: '6%', top: 70, height: 2, background: 'var(--bd)' }} />
                  <div style={{ position: 'absolute', left: '6%', width: `${pct}%`, top: 70, height: 2, background: `linear-gradient(90deg,var(--green),${stageColor})` }} />
                  {TL_ORDER.map((stage, i) => {
                    const left = 6 + i * 30
                    const isCurrent = i === currentIdx
                    const isDone = i < currentIdx
                    return (
                      <div key={stage} style={{ position: 'absolute', left: `${left}%`, top: isCurrent ? 64 : 67, width: isCurrent ? 14 : 9, height: isCurrent ? 14 : 9, borderRadius: '50%', transform: 'translateX(-50%)', background: isCurrent ? stageColor : isDone ? 'var(--green)' : 'var(--bg-card-2)', border: isCurrent ? `3px solid var(--bg-card-2)` : '2px solid var(--bd)', boxShadow: isCurrent ? `0 0 0 3px color-mix(in srgb, ${stageColor} 35%, transparent)` : 'none' }} />
                    )
                  })}
                  <div style={{ position: 'absolute', left: `${6 + currentIdx * 30}%`, top: 12, transform: 'translateX(-50%)', width: 210, background: 'var(--bg-card)', border: `1px solid ${stageColor}`, borderRadius: 10, padding: '8px 11px', boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job?.title ?? 'Job'}</div>
                    <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2 }}>{job?.customerName ?? '—'}</div>
                  </div>
                </div>

                <div style={{ width: 150, flexShrink: 0, padding: '0 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }} onClick={e => e.stopPropagation()}>
                  {next ? (
                    <button
                      onClick={() => onAdvance(a.id, next.status, a.jobId)}
                      disabled={isAdvancing}
                      style={{ background: stageColor, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 13px', fontSize: 11, fontWeight: 700, cursor: isAdvancing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      {isAdvancing ? <Loader2 size={12} className="spin" /> : <next.icon size={12} />} {next.label}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={13} /> Done</span>
                  )}
                </div>
              </div>
            )
          })}

          {idleTechs.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card-2)', border: '1px dashed var(--bd)', borderRadius: 13, height: 64, overflow: 'hidden', opacity: 0.75 }}>
              <div style={{ width: 207, flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 11, borderRight: '1px solid var(--bd)', height: '100%' }}>
                <Avatar name={t.name} avatarUrl={t.avatarUrl} size={30} radius={15} fontSize={11} />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>{t.name}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--t4)' }}>No active job — ready to dispatch</div>
              <div style={{ width: 150, flexShrink: 0 }} />
            </div>
          ))}
        </>
      )}
    </div>
  )
}
