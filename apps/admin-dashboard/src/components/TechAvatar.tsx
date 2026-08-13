/**
 * TechAvatar — a technician's actual photo, resolvable from anywhere.
 *
 * The problem this solves: most surfaces only have `job.assignedToId` and
 * `job.assignedToName` — a name string, no photo. Only `Technician` carries
 * `avatarUrl`. So every list that showed a technician fell back to initials even
 * when a photo existed.
 *
 * This keeps a module-level directory keyed by BOTH ids a technician is
 * referenced by across the system:
 *   - `Technician.id`     — scheduling-service's technician row (assignments)
 *   - `Technician.userId` — the crm CompanyUser (jobs' `assignedToId`, project
 *                           rosters, login history)
 * so a caller can pass whichever it happens to hold.
 *
 * `useTechDirectory()` primes it from the technicians query. Mount that once
 * high in the tree (App does) and every TechAvatar below resolves photos
 * without prop-drilling or extra fetches. Falls back to the initials chip when
 * there is no photo, so it is always safe to render.
 */
import { useEffect } from 'react'
import Avatar from './Avatar'
import { useTechnicians } from '../hooks/useScheduling'

interface TechEntry { name: string; avatarUrl?: string | null }

/** Keyed by technician id AND userId — callers hold one or the other. */
let TECH_DIR = new Map<string, TechEntry>()

/** Primes the directory. Safe to mount in several places; last write wins. */
export function useTechDirectory() {
  const { data: techs } = useTechnicians()
  useEffect(() => {
    if (!techs?.length) return
    const next = new Map<string, TechEntry>()
    for (const t of techs) {
      const entry: TechEntry = { name: t.name, avatarUrl: t.avatarUrl ?? null }
      if (t.id) next.set(t.id, entry)
      if (t.userId) next.set(t.userId, entry)
    }
    TECH_DIR = next
  }, [techs])
  return techs
}

/** Look up a technician by either id. Returns undefined before the directory primes. */
export function techEntry(id?: string | null): TechEntry | undefined {
  return id ? TECH_DIR.get(id) : undefined
}

/** The photo URL for a technician, if we know one. */
export function techAvatarUrl(id?: string | null): string | null {
  return techEntry(id)?.avatarUrl ?? null
}

/**
 * Renders a technician's photo, falling back to their initials.
 *
 * Pass whatever you have: an explicit `avatarUrl`, or an `id` (technician id or
 * userId) to resolve one from the directory. `name` is used for initials and the
 * tooltip, and is filled from the directory when omitted.
 */
export default function TechAvatar({
  id, name, avatarUrl, size = 26, radius, fontSize,
}: {
  id?: string | null
  name?: string | null
  avatarUrl?: string | null
  size?: number
  radius?: number
  fontSize?: number
}) {
  const entry = techEntry(id)
  const resolvedName = name ?? entry?.name ?? null
  // An explicitly-passed url wins — callers holding a full Technician already
  // have it and should not pay a lookup.
  const resolvedUrl = avatarUrl ?? entry?.avatarUrl ?? null

  return (
    <span title={resolvedName ?? undefined} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <Avatar
        name={resolvedName}
        avatarUrl={resolvedUrl}
        size={size}
        radius={radius}
        fontSize={fontSize}
      />
    </span>
  )
}

/**
 * A technician's photo next to their name — the pattern most list rows want.
 * Renders the fallback label (default "Unassigned") when there is no technician.
 */
export function TechChip({
  id, name, size = 22, fontSize = 12, fallback = 'Unassigned', muted = false,
}: {
  id?: string | null
  name?: string | null
  size?: number
  fontSize?: number
  fallback?: string
  muted?: boolean
}) {
  const resolved = name ?? techEntry(id)?.name ?? null
  if (!resolved) {
    return <span style={{ fontSize, color: 'var(--t4)' }}>{fallback}</span>
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <TechAvatar id={id} name={resolved} size={size} />
      <span style={{
        fontSize, color: muted ? 'var(--t3)' : 'var(--t2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {resolved}
      </span>
    </span>
  )
}
