# Multi-technician assignment — admin dashboard UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a dispatcher build, edit and confirm a crew for a job — with live
availability, conflicts and a map — from the Scheduling page, without breaking
any existing single-technician surface.

**Architecture:** The backend from the previous plan already serves crews and
ranked candidates. This adds React Query hooks over those endpoints, a
`CrewControlCenter` panel, a crew column on the auto-schedule preview table, and
a **narrow** fix to the one place that miscounts when a job has several
assignments. `assignmentByJobId` is deliberately kept as "the lead's assignment"
rather than becoming an array — see Task 2 for why that is both safer and more
correct.

**Tech Stack:** React 19, TanStack Query, Vite, Leaflet via `react-leaflet`,
inline styles with CSS custom properties (`--t1`…`--t4`, `--blue`, `--amber`,
`--green`, `--bd`, `--bg-card`).

**Spec:** `docs/superpowers/specs/2026-09-02-multi-technician-assignment-design.md`
**Backend plan:** `docs/superpowers/plans/2026-09-02-multi-tech-backend-foundation.md`

## Global Constraints

- **pnpm only.** The `preinstall` hook rejects npm and yarn.
- **No `test` or `type-check` script exists** in admin-dashboard. `pnpm --filter
  admin-dashboard build` runs `tsc -b && vite build` — **that is the type check.**
  Run it after every task.
- **Theme tokens, never hardcoded colours.** Three themes (light/dark/black) read
  from CSS custom properties. A literal `#B45309` is invisible on dark; use
  `var(--amber)` and `color-mix(in srgb, var(--amber) 18%, transparent)`.
- **Money is dollars**; format via `lib/format.ts`. Not central here, but do not
  reinvent it.
- **Status enums are UPPER_SNAKE_CASE**; normalise with `normalizeStatus()` and
  display with `humanizeStatus()` from `lib/format.ts`.
- **Import `MapPickerLazy`, never `MapPicker`** — the wrapper keeps Leaflet
  (~150 KB gz) out of the chunk until a modal needs it.
- **Do not commit** unless a step says to. No Claude co-author trailer.
- **Copy rules:** sentence case, active voice, say what a control does. No em
  dashes as connectors in user-facing text.

## Verified API shapes

Measured against the running service, not guessed:

```jsonc
// GET /api/scheduling/dispatch/jobs/:jobId/crew
{ "count": 1, "data": [ {
  "assignment": { "id","companyId","jobId","technicianId","status","score",
                  "distanceKm","isLead","assignedAt","scheduledStart","scheduledEnd" },
  "technician": { "id","companyId","userId","name","phone","avatarUrl",
                  "skills","maxDailyJobs","isActive","rating" }
} ] }

// GET /api/scheduling/dispatch/candidates?jobId=&start=&end=&limit=
{ "count": 5, "data": [ {
  "technician": { ... },
  "score": 90.75,
  "baseDistanceKm": 2.19,        // null when the technician has no known location
  "distanceFromBase": false,      // false = fell back to live position
  "activeJobsThatDay": 1,
  "conflicts": null               // null or [] when free; NOT always an array
} ] }
```

**`conflicts` arrives as `null`, not `[]`.** Always read it as
`(c.conflicts ?? [])` or every crew screen crashes on the happy path.

---

## File structure

| File | Responsibility |
|---|---|
| `src/types/api.ts` | `CrewMember`, `CrewCandidate`, `ScheduleConflict`, `Job.crewUserIds`, `Job.requiredTechCount` |
| `src/hooks/useCrew.ts` | **new** — all four crew queries/mutations in one place |
| `src/pages/scheduling/Scheduling.tsx` | add `crewByJobId`, pass `allAssignments` down |
| `src/pages/dispatch/DispatchMap.tsx` | fix workload undercount, de-duplicate route lines |
| `src/pages/scheduling/crew/CrewControlCenter.tsx` | **new** — the panel shell and state |
| `src/pages/scheduling/crew/CrewTimeline.tsx` | **new** — shared time axis and per-member track |
| `src/pages/scheduling/crew/CrewMap.tsx` | **new** — base locations, job site, clashing jobs |
| `src/pages/scheduling/crew/CandidateList.tsx` | **new** — ranked candidates |
| `src/pages/scheduling/BoardPlan.tsx` | crew column on the preview table |

The control center is split by responsibility rather than kept as one file: the
timeline, the map and the candidate list each answer a different question, are
each independently testable by eye, and `BoardPlan.tsx` is already 700+ lines —
adding a whole panel to it would make it unreviewable.

---

## Task 1: Types and hooks

**Files:**
- Modify: `apps/admin-dashboard/src/types/api.ts`
- Create: `apps/admin-dashboard/src/hooks/useCrew.ts`

**Interfaces:**
- Produces: `CrewMember`, `CrewCandidate`, `ScheduleConflict` types;
  `useCrew(jobId)`, `useCrewCandidates(jobId, start, end, limit)`,
  `useSetCrew()`, `useSetLead()`.

- [ ] **Step 1: Add the types**

Append to `apps/admin-dashboard/src/types/api.ts`:

```ts
/** An existing booking that overlaps a proposed window. */
export interface ScheduleConflict {
  jobId: string
  jobNumber: string
  title: string
  start: string
  end: string
  lat?: number | null
  lng?: number | null
  /** How far the clashing job is from THIS job's site. Lets a dispatcher judge
   *  whether the clash actually matters. */
  distanceFromSiteKm?: number | null
}

/** One technician on a job's crew, with the assignment that put them there. */
export interface CrewMember {
  assignment: DispatchAssignment & { isLead: boolean; baseDistanceKm?: number | null }
  technician: Technician
}

/** A technician who could be added, with everything needed to judge them. */
export interface CrewCandidate {
  technician: Technician
  score: number
  baseDistanceKm?: number | null
  /** false when baseDistanceKm fell back to the live position. */
  distanceFromBase: boolean
  activeJobsThatDay: number
  /** Arrives as null when free, so always read it as (conflicts ?? []). */
  conflicts: ScheduleConflict[] | null
}
```

Add to the existing `Job` interface:

```ts
  /** Every crew member's user id, lead included. */
  crewUserIds?: string[]
  /** Optional target crew size. Guidance, never a rule. */
  requiredTechCount?: number | null
```

- [ ] **Step 2: Write the hooks**

Create `apps/admin-dashboard/src/hooks/useCrew.ts`:

```ts
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { CrewMember, CrewCandidate } from '../types/api'

/**
 * Changing a crew moves the lead, which is the name shown on every job-shaped
 * view, so the same caches useJobs invalidates have to go too.
 */
function invalidateCrewViews() {
  queryClient.invalidateQueries({ queryKey: ['jobs'] })
  queryClient.invalidateQueries({ queryKey: ['scheduling'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['crew'] })
}

export function useCrew(jobId?: string) {
  return useQuery({
    queryKey: ['crew', jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const res = await api.get<{ data: CrewMember[]; count: number }>(
        `/scheduling/dispatch/jobs/${jobId}/crew`)
      return res.data.data
    },
  })
}

/**
 * Ranked technicians for a window. Disabled until we have both ends of the
 * window, because the server needs them to detect conflicts and would 400.
 */
export function useCrewCandidates(jobId?: string, start?: string, end?: string, limit = 10) {
  return useQuery({
    queryKey: ['crew', 'candidates', jobId, start, end, limit],
    enabled: !!jobId && !!start && !!end,
    queryFn: async () => {
      const res = await api.get<{ data: CrewCandidate[] }>(
        '/scheduling/dispatch/candidates', { params: { jobId, start, end, limit } })
      return res.data.data
    },
    // Someone else may book one of these technicians while this panel is open.
    staleTime: 30_000,
  })
}

export function useSetCrew() {
  return useMutation({
    mutationFn: async (vars: { jobId: string; technicianIds: string[]; leadTechnicianId: string }) => {
      const { jobId, ...body } = vars
      const res = await api.patch<{ data: CrewMember[] }>(
        `/scheduling/dispatch/jobs/${jobId}/crew`, body)
      return res.data.data
    },
    onSuccess: invalidateCrewViews,
  })
}

export function useSetLead() {
  return useMutation({
    mutationFn: async (vars: { jobId: string; technicianId: string }) => {
      const res = await api.patch<{ data: CrewMember[] }>(
        `/scheduling/dispatch/jobs/${vars.jobId}/lead`,
        { technicianId: vars.technicianId })
      return res.data.data
    },
    onSuccess: invalidateCrewViews,
  })
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
```

Expected: build succeeds. If `DispatchAssignment` lacks `isLead`, the
intersection type in Step 1 supplies it — that is intentional, so the backend
field does not have to be threaded through an unrelated interface.

- [ ] **Step 4: Commit**

```bash
git add apps/admin-dashboard/src/types/api.ts apps/admin-dashboard/src/hooks/useCrew.ts
git commit -m "feat(admin): crew types and hooks"
```

---

## Task 2: Fix the miscount, keep the map

**Files:**
- Modify: `apps/admin-dashboard/src/pages/scheduling/Scheduling.tsx`
- Modify: `apps/admin-dashboard/src/pages/scheduling/BoardLive.tsx`
- Modify: `apps/admin-dashboard/src/pages/dispatch/DispatchMap.tsx`

**The finding that shapes this task.** The spec called `assignmentByJobId` the
highest regression risk, expecting all 28 usages to become arrays. Reading them
shows that is wrong and would be actively worse:

- 26 usages ask *"what is this job's assignment"* — to open a job, to check
  whether it is assigned, to show its status. **The lead's assignment is the
  correct answer to all of them**, because the lead drives `Job.status` by
  design. Turning them into arrays would force every call site to re-derive the
  lead.
- **2 usages genuinely need every assignment**, both in `DispatchMap`:
  `activeJobCountByTech` (line 375) and `routeLines` (line 399).

So `assignmentByJobId` **stays a single object, now defined as the lead's
assignment**, and the two places that need the full set get it from
`allAssignments`, which `Scheduling.tsx:138` already has.

`activeJobCountByTech` is a real bug once crews exist: it counts one assignment
per job, so a helper on three jobs would show a workload of zero and be ranked
as free.

**Interfaces:**
- Produces: `crewByJobId: Record<string, CrewMember[]>` in `Scheduling.tsx`;
  `DispatchMap` prop `allAssignments: DispatchAssignment[]`.

- [ ] **Step 1: Redefine the map as the lead's assignment**

In `Scheduling.tsx`, replace the `assignmentByJobId` memo (line ~140) with:

```tsx
  /**
   * The LEAD's assignment for each job.
   *
   * Every consumer of this map asks "what is this job's assignment" — to open
   * it, to test whether it is assigned, to show its status. The lead is the
   * correct answer to all of them, because the lead drives Job.status.
   *
   * Anything that needs EVERY crew member (workload counts, per-member map
   * pins) must use `allAssignments` instead. Collapsing many assignments to one
   * is exactly how a helper on three jobs ends up looking free.
   */
  const assignmentByJobId = useMemo(() => {
    return allAssignments.reduce<Record<string, typeof allAssignments[number]>>((acc, assignment) => {
      const current = acc[assignment.jobId]
      if (!current) { acc[assignment.jobId] = assignment; return acc }
      // Prefer the lead. Fall back to most-recently-updated for rows written
      // before is_lead existed.
      if ((assignment as any).isLead && !(current as any).isLead) {
        acc[assignment.jobId] = assignment
        return acc
      }
      if ((current as any).isLead) return acc
      const currentTime = new Date(current.updatedAt ?? current.assignedAt ?? 0).getTime()
      const nextTime = new Date(assignment.updatedAt ?? assignment.assignedAt ?? 0).getTime()
      if (nextTime >= currentTime) acc[assignment.jobId] = assignment
      return acc
    }, {})
  }, [allAssignments])
```

- [ ] **Step 2: Pass the full set through to the map**

In `Scheduling.tsx`, add to the `<BoardLive ... />` props:

```tsx
          allAssignments={allAssignments}
```

In `BoardLive.tsx`, add to the props type and destructuring:

```tsx
  allAssignments: DispatchAssignment[]
```

and forward it to `<DispatchMap ... allAssignments={allAssignments} />`.
Import the type: `import type { ..., DispatchAssignment } from '../../types/api'`.

- [ ] **Step 3: Fix the workload undercount**

In `DispatchMap.tsx`, add `allAssignments: DispatchAssignment[]` to the props
type and destructuring, then replace `activeJobCountByTech` (line ~375):

```tsx
  // ── Workload per tech ──────────────────────────────────────────────────────
  // Counts EVERY crew member's assignment, not one per job. Using
  // assignmentByJobId here would count only the lead, so a helper on three jobs
  // would show a workload of zero and be ranked as free.
  const activeJobCountByTech = useMemo(() => {
    const m: Record<string, number> = {}
    allAssignments.forEach(a => {
      if (a && ['ASSIGNED', 'EN_ROUTE', 'ON_SITE'].includes(a.status)) {
        m[a.technicianId] = (m[a.technicianId] ?? 0) + 1
      }
    })
    return m
  }, [allAssignments])
```

- [ ] **Step 4: De-duplicate the route lines**

Still in `DispatchMap.tsx`, `routeLines` draws one line per assignment. With a
crew of three that is three overlapping lines to the same pin. Replace the
`Object.values(assignmentByJobId).forEach(...)` body (line ~399) so it iterates
the lead-only map, which it already receives:

```tsx
  // ── Routing lines: one per JOB, drawn from the lead ────────────────────────
  // Iterating every assignment would draw one line per crew member, stacking
  // three identical lines to the same site.
  const routeLines = useMemo(() => {
    const lines: { techPos: [number, number]; jobPos: [number, number]; status: string }[] = []
    Object.values(assignmentByJobId).forEach(a => {
      if (!a || !['EN_ROUTE', 'ON_SITE'].includes(a.status)) return
      const tech = technicians.find(t => t.id === a.technicianId)
      const job  = [...assignedJobs, ...unassignedJobs].find(j => j.id === a.jobId)
      if (!tech?.currentLocation || !job) return
      const coords = parseCoords(job)
      if (!coords) return
      lines.push({
        techPos: [tech.currentLocation.lat, tech.currentLocation.lng],
        jobPos:  [coords.lat, coords.lng],
        status:  a.status,
      })
    })
    return lines
  }, [assignmentByJobId, technicians, assignedJobs, unassignedJobs])
```

(The body is unchanged; only the comment and the confirmed use of the lead-only
map. Verify it still reads `assignmentByJobId`, not `allAssignments`.)

- [ ] **Step 5: Type-check and eyeball**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
```

Then with the stack running, open `http://localhost:5173/scheduling`, sign in as
`admin@tsbrothers.com` / `Admin@2024!`, and confirm the Live tab still renders
technicians, job pins and route lines exactly as before. Nothing should look
different yet — this task is a correctness fix, not a visible change.

- [ ] **Step 6: Commit**

```bash
git add apps/admin-dashboard/src/pages/scheduling/Scheduling.tsx \
        apps/admin-dashboard/src/pages/scheduling/BoardLive.tsx \
        apps/admin-dashboard/src/pages/dispatch/DispatchMap.tsx
git commit -m "fix(admin): count workload across the whole crew, not one per job"
```

---

## Task 3: Crew timeline

**Files:**
- Create: `apps/admin-dashboard/src/pages/scheduling/crew/CrewTimeline.tsx`

The signature element: one shared time axis with the job's window as a vertical
band, so a clash is a shape crossing the band rather than a label to read.

**Interfaces:**
- Produces: `<CrewTimeline day={Date} windowStart={Date} windowEnd={Date}
  rows={TimelineRow[]} />` where
  `TimelineRow = { id, name, avatarUrl?, blocks: TimelineBlock[] }` and
  `TimelineBlock = { start: Date; end: Date; kind: 'this' | 'other' | 'clash'; label?: string }`.
- Produces: `timelinePct(day, t)` mapping a time to a 0–100 position.

- [ ] **Step 1: Write the component**

```tsx
/**
 * One shared time axis for a crew. Every member's day renders against the same
 * scale, with this job's window as a vertical band cutting through all rows, so
 * a conflict is a shape intersecting the band rather than a sentence to read.
 */
const DAY_START_H = 7
const DAY_END_H = 19

export interface TimelineBlock {
  start: Date
  end: Date
  kind: 'this' | 'other' | 'clash'
  label?: string
}
export interface TimelineRow {
  id: string
  name: string
  avatarUrl?: string | null
  blocks: TimelineBlock[]
}

/** Position of a time on the axis, clamped to the visible day. */
export function timelinePct(day: Date, t: Date): number {
  const start = new Date(day); start.setHours(DAY_START_H, 0, 0, 0)
  const end = new Date(day); end.setHours(DAY_END_H, 0, 0, 0)
  const span = end.getTime() - start.getTime()
  const pct = ((t.getTime() - start.getTime()) / span) * 100
  return Math.max(0, Math.min(100, pct))
}

export default function CrewTimeline({
  day, windowStart, windowEnd, rows, onBlockClick,
}: {
  day: Date
  windowStart: Date
  windowEnd: Date
  rows: TimelineRow[]
  onBlockClick?: (block: TimelineBlock) => void
}) {
  const bandLeft = timelinePct(day, windowStart)
  const bandWidth = Math.max(1, timelinePct(day, windowEnd) - bandLeft)
  const hours = Array.from({ length: DAY_END_H - DAY_START_H + 1 }, (_, i) => DAY_START_H + i)

  const kindColor: Record<TimelineBlock['kind'], string> = {
    this:  'var(--blue)',
    other: 'var(--t4)',
    clash: 'var(--red)',
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* The job's window, behind every row */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: `${bandLeft}%`, width: `${bandWidth}%`,
          top: 16, bottom: 0,
          background: 'color-mix(in srgb, var(--blue) 8%, transparent)',
          borderLeft: '1.5px solid var(--blue)',
          borderRight: '1.5px solid var(--blue)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--t4)', marginBottom: 4 }}>
        {hours.filter((_, i) => i % 2 === 0).map(h => (
          <span key={h}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>

      {rows.map(row => (
        <div key={row.id} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>{row.name}</div>
          <div style={{
            position: 'relative', height: 20, borderRadius: 4,
            background: 'var(--bg-card)', border: '1px solid var(--bd)',
          }}>
            {row.blocks.map((b, i) => {
              const left = timelinePct(day, b.start)
              const width = Math.max(1.5, timelinePct(day, b.end) - left)
              return (
                <button
                  key={i}
                  onClick={() => onBlockClick?.(b)}
                  title={b.label}
                  style={{
                    position: 'absolute', left: `${left}%`, width: `${width}%`,
                    top: 2, bottom: 2, borderRadius: 3, border: 'none',
                    background: kindColor[b.kind], color: '#fff',
                    fontSize: 8.5, fontWeight: 700, cursor: onBlockClick ? 'pointer' : 'default',
                    overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 4px',
                  }}
                >
                  {b.label ?? ''}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
```

Expected: succeeds. `--red` is a real theme token (`src/index.css:42`, with a
lighter value for dark at line 109), so use `var(--red)` with no fallback — a
hardcoded fallback would be the wrong shade on dark.

- [ ] **Step 3: Commit**

```bash
git add apps/admin-dashboard/src/pages/scheduling/crew/CrewTimeline.tsx
git commit -m "feat(admin): shared-axis crew timeline"
```

---

## Task 4: Crew map

**Files:**
- Create: `apps/admin-dashboard/src/pages/scheduling/crew/CrewMap.tsx`

**Interfaces:**
- Produces: `<CrewMap site={{lat,lng}} members={MapMember[]} clashes={MapClash[]} />`
  with `MapMember = { id, name, lat, lng, inCrew: boolean }` and
  `MapClash = { jobId, jobNumber, lat, lng, technicianName, start, end }`.

- [ ] **Step 1: Write the component**

Lazy-load Leaflet the same way `MapPickerLazy` does, so opening the Scheduling
page does not pull it in.

```tsx
import { lazy, Suspense } from 'react'
const CrewMapInner = lazy(() => import('./CrewMapInner'))

export interface MapMember { id: string; name: string; lat: number; lng: number; inCrew: boolean }
export interface MapClash {
  jobId: string; jobNumber: string; lat: number; lng: number
  technicianName: string; start: string; end: string
}

/**
 * Base locations, the job site, and the sites of any clashing jobs.
 *
 * The clashing job's pin is the point of this map: seeing that a candidate's
 * 09:00 job is 1.4 km away is what lets a dispatcher overrule the warning
 * sensibly. Without it the map is decoration.
 */
export default function CrewMap(props: {
  site: { lat: number; lng: number } | null
  members: MapMember[]
  clashes: MapClash[]
}) {
  if (!props.site) {
    return (
      <div style={{
        border: '1px dashed var(--bd)', borderRadius: 8, padding: 16,
        fontSize: 11.5, color: 'var(--t3)', textAlign: 'center',
      }}>
        This job has no map pin, so the crew map cannot be drawn.
        Set a location on the job to see travel distances.
      </div>
    )
  }
  return (
    <Suspense fallback={<div style={{ height: 186, background: 'var(--bg-card)', borderRadius: 8 }} />}>
      <CrewMapInner {...props} site={props.site} />
    </Suspense>
  )
}
```

- [ ] **Step 2: Write `CrewMapInner.tsx`**

Create `apps/admin-dashboard/src/pages/scheduling/crew/CrewMapInner.tsx` using
`MapContainer`, `TileLayer`, `Marker`, `Popup` from `react-leaflet`, mirroring
the marker and `divIcon` construction already in
`src/pages/dispatch/DispatchMap.tsx` (see `techIcon`, around line 120). Render:

- the job site in red,
- each crew member in blue and each non-crew candidate in amber, at their base
  location,
- each clash in red at 85% opacity, its popup naming the job number, window,
  technician and `distanceFromSiteKm`.

Fit bounds across every point so the panel opens showing all of them.

- [ ] **Step 3: Type-check and commit**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
git add apps/admin-dashboard/src/pages/scheduling/crew/CrewMap.tsx \
        apps/admin-dashboard/src/pages/scheduling/crew/CrewMapInner.tsx
git commit -m "feat(admin): crew map with base locations and clashing job pins"
```

---

## Task 5: Candidate list

**Files:**
- Create: `apps/admin-dashboard/src/pages/scheduling/crew/CandidateList.tsx`

**Interfaces:**
- Produces: `<CandidateList candidates={CrewCandidate[]} onAdd={(c) => void}
  loading={boolean} error={boolean} />`

- [ ] **Step 1: Write the component**

```tsx
import type { CrewCandidate } from '../../../types/api'
import TechAvatar from '../../../components/TechAvatar'

/**
 * Ranked technicians who could join. Conflict-free first, then by score — the
 * server already orders them, so this renders the order it is given rather than
 * re-sorting and risking disagreement.
 */
export default function CandidateList({
  candidates, onAdd, loading, error,
}: {
  candidates: CrewCandidate[]
  onAdd: (c: CrewCandidate) => void
  loading: boolean
  error: boolean
}) {
  if (loading) {
    return <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>Finding available technicians…</p>
  }
  if (error) {
    // Ranking is a convenience; assignment must still work without it.
    return (
      <p style={{ fontSize: 11.5, color: 'var(--amber)' }}>
        Could not load suggestions. You can still add technicians by name.
      </p>
    )
  }
  if (candidates.length === 0) {
    return <p style={{ fontSize: 11.5, color: 'var(--t3)' }}>No other technicians are available for this window.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {candidates.map(c => {
        const conflicts = c.conflicts ?? []   // arrives as null when free
        const clash = conflicts[0]
        return (
          <button
            key={c.technician.id}
            onClick={() => onAdd(c)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              padding: '7px 8px', borderRadius: 7, cursor: 'pointer',
              background: 'var(--bg-card)',
              border: `1px solid ${clash ? 'color-mix(in srgb, var(--amber) 45%, transparent)' : 'var(--bd)'}`,
            }}
          >
            <TechAvatar id={c.technician.id} name={c.technician.name}
                        avatarUrl={c.technician.avatarUrl} size={24} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--t1)' }}>
                {c.technician.name}
              </span>
              <span style={{ display: 'block', fontSize: 9.5, color: 'var(--t3)' }}>
                {(c.technician.skills ?? []).join(', ') || 'No skills listed'}
                {c.baseDistanceKm != null
                  ? ` · ${c.baseDistanceKm.toFixed(1)} km ${c.distanceFromBase ? 'from base' : 'from last position'}`
                  : ' · location unknown'}
                {` · ${c.activeJobsThatDay} job${c.activeJobsThatDay === 1 ? '' : 's'} that day`}
              </span>
            </span>
            {clash ? (
              <span style={{
                fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)',
              }}>
                Clashes {new Date(clash.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span style={{
                fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                background: 'color-mix(in srgb, var(--green) 18%, transparent)', color: 'var(--green)',
              }}>
                Free
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(c.score)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Type-check and commit**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
git add apps/admin-dashboard/src/pages/scheduling/crew/CandidateList.tsx
git commit -m "feat(admin): ranked candidate list with conflict and distance context"
```

---

## Task 6: The control center

**Files:**
- Create: `apps/admin-dashboard/src/pages/scheduling/crew/CrewControlCenter.tsx`

Composes Tasks 3–5 into the approved side-by-side panel: header with the job and
an editable crew target, crew roster plus shared timeline on the left, map and
candidates on the right, and a footer that states exactly what confirming will do.

**Interfaces:**
- Consumes: `useCrew`, `useCrewCandidates`, `useSetCrew`, `useSetLead`,
  `CrewTimeline`, `CrewMap`, `CandidateList`.
- Produces: `<CrewControlCenter job={Job} open={boolean} onClose={() => void} />`

- [ ] **Step 1: Build the shell and local crew state**

The panel holds a **draft** crew locally and only writes on confirm, so a
dispatcher can experiment without every click hitting the server. Seed the draft
from `useCrew` when it loads, and reset it whenever the job changes.

Key behaviours, each of which was a deliberate decision:

- **A clash warns, it never blocks.** A clashing candidate stays addable and the
  footer explains the consequence. Dispatchers routinely know things the system
  does not, and a hard block pushes them to work around the tool.
- **The target is guidance.** `requiredTechCount` drives "2 of 3" and the
  candidate limit; confirming with fewer or more is allowed.
- **The confirm button states what it will do** — "Confirm crew of 2" — so it can
  never silently disagree with the target.
- **Lead defaults to the highest-scored member but is reassignable.** An
  algorithm scoring distance, workload and rating knows nothing about seniority,
  so it proposes rather than decides.
- **Removing the last member is allowed** and leaves the job unassigned. That is
  how a dispatcher undoes a mistake.

- [ ] **Step 2: Wire the mutations**

On confirm, call `useSetCrew` with `{ jobId, technicianIds, leadTechnicianId }`.
Map the two known 400s to inline messages rather than a toast, next to the
control that caused them:

- `"The lead must be one of the assigned technicians."`
- `"Add them to the crew first."`

- [ ] **Step 3: Type-check**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
```

- [ ] **Step 4: Verify in the browser**

With the stack running, open a job from the Scheduling page, add a second
technician, make them lead, confirm, and reload. The crew must persist and the
job's technician name must now be the new lead.

Then check the invariant directly:

```bash
node -e '
const {Client}=require("pg");const fs=require("fs");
const url=fs.readFileSync("apps/scheduling-service/.env","utf8").match(/^DATABASE_URL=(.*)$/m)[1].replace(/[?&]sslmode=[^&]*/g,m=>m[0]==="?"?"?":"");
(async()=>{const c=new Client({connectionString:url,ssl:{rejectUnauthorized:false}});await c.connect();
const r=await c.query(`SELECT count(*)::int n FROM (SELECT job_id FROM scheduling.dispatch_assignments WHERE is_lead AND status<>\x27CANCELLED\x27 GROUP BY job_id HAVING count(*)>1) t`);
console.log("jobs with more than one lead:", r.rows[0].n); await c.end();})();'
```

Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/scheduling/crew/CrewControlCenter.tsx
git commit -m "feat(admin): crew assignment control center"
```

---

## Task 7: Crew column on the plan table

**Files:**
- Modify: `apps/admin-dashboard/src/pages/scheduling/BoardPlan.tsx`

**Interfaces:**
- Consumes: `CrewControlCenter`, `useCrew`.

- [ ] **Step 1: Extend `previewEdits` with a crew**

`BoardPlan.tsx:119` holds `previewEdits` keyed by job id. Add `crew` to it:

```tsx
  const [previewEdits, setPreviewEdits] = useState<Record<string, {
    techId: string; time: string; durationMins: number
    crewTechIds?: string[]   // undefined = just techId, i.e. a crew of one
  }>>({})
```

`crewTechIds` is optional so every existing code path keeps working untouched; a
row only gains a crew once someone gives it one.

- [ ] **Step 2: Add the crew cell**

Render stacked avatars plus one line of plain words, because the row must say
what is wrong without anyone opening the panel:

- `"2 of 3 · one more needed"` when short of `requiredTechCount`
- `"<Name> clashes 09:00–10:30"` when a member has a conflict
- `"<Lead> leads · +2"` otherwise

Flag rows needing a decision with `borderLeft: '3px solid var(--amber)'` and a
tinted background, and **keep them in time order** — sorting problems to the top
breaks the mental model of a day running 08:00 to 17:00.

- [ ] **Step 3: Open the control center on row click**

Clicking a row opens `CrewControlCenter` for that job. On close, refresh the
preview row from the saved crew.

- [ ] **Step 4: Make confirm commit only the ready rows**

Change the footer button to count what will actually be scheduled
("Confirm 6 jobs") and leave flagged rows unassigned rather than blocking the
whole plan on two problems.

- [ ] **Step 5: Type-check, verify, commit**

```bash
pnpm --filter admin-dashboard build 2>&1 | tail -5
```

Run "Auto schedule day" on a day with several jobs and confirm the table renders,
flags the right rows, and commits only the ready ones.

```bash
git add apps/admin-dashboard/src/pages/scheduling/BoardPlan.tsx
git commit -m "feat(admin): crew-aware auto-schedule preview"
```

---

## Done when

- `pnpm --filter admin-dashboard build` is clean (this is the type check).
- The Live tab renders exactly as before Task 2 — that task is a correctness fix,
  not a visible change.
- A crew of two or more can be built, given a lead, confirmed, and survives a
  reload.
- The lead invariant query returns `0`.
- Auto schedule day flags short and clashing rows and commits only ready ones.
- A job with no map pin still opens the panel, with the map replaced by an
  explanation rather than a broken tile grid.

## Not in this plan

The technician app (crew visibility, non-lead permissions, handover from the
field), the customer-facing crew email with photos, and the customer portal crew
display. Those share no code with the dashboard and are better planned together
once this lands.
