/** Shared atoms for the Projects module (list, detail, planner band). */
import { techById, STATUS_META, type ProjectStatus } from './projectsApi'
import { formatMoney } from '../../lib/format'

export function fmtMoney(v?: number) {
  if (v == null) return '—'
  return formatMoney(v, { decimals: 0 })
}

export function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function initialsOf(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function TechAvatar({ userId, size = 26 }: { userId: string; size?: number }) {
  const t = techById(userId)
  return (
    <span
      title={t?.name ?? userId}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: t ? `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 55%, #000))` : 'var(--bg-card-2)',
        border: '2px solid var(--bg-card)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      }}
    >
      {t ? initialsOf(t.name) : '?'}
    </span>
  )
}

/** Overlapping avatar stack with +N overflow chip. */
export function AvatarStack({ userIds, max = 5, size = 26 }: { userIds: string[]; max?: number; size?: number }) {
  const shown = userIds.slice(0, max)
  const extra = userIds.length - shown.length
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {shown.map((id, i) => (
        <span key={id} style={{ marginLeft: i === 0 ? 0 : -8, display: 'inline-flex' }}>
          <TechAvatar userId={id} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span style={{
          marginLeft: -8, width: size, height: size, borderRadius: '50%',
          background: 'var(--bg-card-2)', border: '2px solid var(--bg-card)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.34, fontWeight: 700, color: 'var(--t3)',
        }}>
          +{extra}
        </span>
      )}
    </span>
  )
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
      background: m.dim, color: m.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
      {m.label}
    </span>
  )
}

export function ProgressBar({ pct, color = 'var(--blue)', height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 99, background: 'var(--bg-card-2)', border: '1px solid var(--bd)', overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%',
        background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 70%, #fff))`,
        borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  )
}
