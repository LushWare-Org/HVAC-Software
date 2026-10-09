/**
 * TechAvatar — the technician's photo, for the customer's benefit.
 *
 * Seeing a face for whoever is coming to your house is a trust signal, so this
 * shows a real photo wherever one exists and falls back to a plain-colour
 * initials chip otherwise (never a blank or a generic icon).
 *
 * Photos come from `useJobTechnicians` in hooks/useMyJobs, which resolves the
 * technician behind a job — the job row itself only carries a name.
 */
// Plain, calm colours: one solid colour per person, never a gradient.
const COLOURS = ['#0E7490', '#2563EB', '#047857', '#B45309', '#9D174D', '#1D4ED8']

function colourFor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return COLOURS[hash % COLOURS.length]
}

function initialsFor(name: string): string {
  return name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function TechAvatar({
  name, avatarUrl, size = 32, fontSize,
}: {
  name?: string | null
  avatarUrl?: string | null
  size?: number
  fontSize?: number
}) {
  const label = name?.trim() || '?'
  const fs = fontSize ?? Math.round(size * 0.4)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        title={label}
        width={size}
        height={size}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0, display: 'block',
        }}
      />
    )
  }

  return (
    <span
      title={label}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: colourFor(label),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fs, fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
      }}
    >
      {label === '?' ? '?' : initialsFor(label)}
    </span>
  )
}

/** Photo + name inline — what most job rows want. */
export function TechChip({
  name, avatarUrl, size = 22, fontSize = 12, fallback = 'Technician to be assigned',
}: {
  name?: string | null
  avatarUrl?: string | null
  size?: number
  fontSize?: number
  fallback?: string
}) {
  if (!name) return <span style={{ fontSize, color: 'var(--t4)' }}>{fallback}</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <TechAvatar name={name} avatarUrl={avatarUrl} size={size} />
      <span style={{
        fontSize, color: 'var(--t2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
    </span>
  )
}
