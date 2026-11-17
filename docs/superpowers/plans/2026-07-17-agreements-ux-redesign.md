# Agreements Module UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Agreements list page, detail drawer, and editor modal to fix measured UX gaps (no search, no filter counts, no bulk actions, no responsive table guard, inconsistent loading/error states) while changing zero backend behavior and preserving every existing action.

**Architecture:** Pure frontend restructure of three existing React components in `apps/admin-dashboard/src/pages/agreements/`. No new routes, no new hooks, no schema/API changes. One new shared visual primitive (`SectionLabel` with optional icon) is added to `shared.tsx` so the drawer and editor modal use one consistent section-heading treatment instead of two different ad-hoc ones.

**Tech Stack:** React 19 + Vite + TanStack Query, existing CSS custom-property design system (`--blue`, `--bd`, `--bg-card`, etc.) and existing `.btn`/`.card`/`.form-input`/`.kpi-card`/`.data-table` classes. Lucide icons.

## Global Constraints

- Evolve within the existing design system — no new colors/tokens, no new component library. Reuse `--blue`, `--bd`, `--bg-card`, `--bg-card-2`, `--t1`–`--t4`, `--green`/`--amber`/`--red` (+`-dim` variants) exactly as used elsewhere in this file set.
- No functionality may be lost or changed in meaning: Send, Renew, Cancel, Create, Edit, and all 7 status filters must behave identically to today.
- `AgreementDrawer`'s `variant="drawer" | "modal"` prop contract must not change — `CustomerAgreementsTab.tsx` (Customers sidebar, out of scope) and Day Planner both depend on it.
- `AgreementStatusBadge` and `VisitMeter` in `shared.tsx` are not restyled — they're reused by the out-of-scope `CustomerAgreementsTab`.
- No new backend endpoints, no changes to `useAgreements.ts`.
- This repo has no Jest/test suite for `admin-dashboard` — `tsc -b` (via `pnpm --filter admin-dashboard build`) is the only automated check. Every task's "verify" step is a type-check build plus an explicit manual browser check — do not skip the manual check because the build passed.
- Money fields (`value`, `billingAmount`) are `string | number | null` — always pass through the existing `fmtMoney`/`formatMoney` helpers, never format inline.
- Status enums are UPPER_SNAKE_CASE (`DRAFT`, `SENT`, `ACTIVE`, `PENDING_RENEWAL`, `RENEWED`, `EXPIRED`, `CANCELLED`) — reuse `STATUS_STYLES` from `shared.tsx` for labels/colors, never hardcode new label strings.

---

## File Structure

- **Modify:** `apps/admin-dashboard/src/pages/agreements/shared.tsx` — add exported `SectionLabel` component (icon + uppercase label), used by both the drawer and the editor modal.
- **Modify:** `apps/admin-dashboard/src/pages/agreements/Agreements.tsx` — command bar (search + status counts + sort), table upgrades (checkbox column, bulk-action bar, overflow wrapper, sortable headers), skeleton loading rows, error/retry banner.
- **Modify:** `apps/admin-dashboard/src/pages/agreements/AgreementDrawer.tsx` — skeleton loading state, standardized section labels via shared `SectionLabel`, amendment-history collapse.
- **Modify:** `apps/admin-dashboard/src/pages/agreements/AgreementEditorModal.tsx` — replace local `SectionLabel` with the shared one (now icon-aware), pass icons per section, spacing polish for conditional fields.

No files are created or deleted beyond the additive export in `shared.tsx`.

---

### Task 1: Shared `SectionLabel` primitive with optional icon

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/shared.tsx`

**Interfaces:**
- Produces: `SectionLabel({ icon?: React.ElementType, children: React.ReactNode })` — exported function component. Renders an 11px, 700-weight, uppercase, `letter-spacing: 0.06em`, `var(--t3)`-colored label, with the icon (if given) at 12px in `var(--blue)` to its left.

- [ ] **Step 1: Add the component to `shared.tsx`**

Add this import at the top of `shared.tsx` (alongside the existing `Infinity as InfinityIcon` import):

```tsx
import type { ComponentType } from 'react'
```

Add this export anywhere after the existing imports (e.g. directly below `INTERVAL_LABELS`/`intervalLabel`, before `fmtDate`):

```tsx
export function SectionLabel({ icon: Icon, children }: { icon?: ComponentType<{ size?: number }>; children: React.ReactNode }) {
  return (
    <p style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', margin: '4px 0 0',
    }}>
      {Icon && <Icon size={12} />}
      {children}
    </p>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no new TypeScript errors (the file isn't imported anywhere differently yet, so this only validates `shared.tsx` itself compiles).

- [ ] **Step 3: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/shared.tsx
git commit -m "feat: add shared SectionLabel primitive for agreement UI"
```

---

### Task 2: `AgreementEditorModal` — adopt shared `SectionLabel` with icons

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/AgreementEditorModal.tsx:6-34` (imports + local `SectionLabel`)
- Modify: `apps/admin-dashboard/src/pages/agreements/AgreementEditorModal.tsx:174,244,272,300` (the four `<SectionLabel>` call sites)

**Interfaces:**
- Consumes: `SectionLabel` from `./shared` (Task 1) — `{ icon?: ComponentType<{ size?: number }>, children: ReactNode }`.

- [ ] **Step 1: Remove the local `SectionLabel` definition and import icons**

In `AgreementEditorModal.tsx`, change the lucide import line (currently `import { X, Loader2, Search, AlertCircle, FileSignature } from 'lucide-react'`) to:

```tsx
import { X, Loader2, Search, AlertCircle, FileSignature, DollarSign, CalendarClock, Settings2 } from 'lucide-react'
```

Change the `shared` import line from:

```tsx
import { INTERVAL_LABELS } from './shared'
```

to:

```tsx
import { INTERVAL_LABELS, SectionLabel } from './shared'
```

Delete the local `function SectionLabel(...)` block (the one currently defined right below the imports, before `export default function AgreementEditorModal`).

- [ ] **Step 2: Pass icons at each call site**

Change `<SectionLabel>Agreement</SectionLabel>` to:

```tsx
<SectionLabel icon={FileSignature}>Agreement</SectionLabel>
```

Change `<SectionLabel>Pricing</SectionLabel>` to:

```tsx
<SectionLabel icon={DollarSign}>Pricing</SectionLabel>
```

Change `<SectionLabel>Service schedule</SectionLabel>` to:

```tsx
<SectionLabel icon={CalendarClock}>Service schedule</SectionLabel>
```

Change `<SectionLabel>Automation</SectionLabel>` to:

```tsx
<SectionLabel icon={Settings2}>Automation</SectionLabel>
```

- [ ] **Step 3: Tighten spacing around conditional fields**

Find the conditional billing block:

```tsx
{form.billingCycle && form.billingCycle !== 'UPFRONT' && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
```

Add `marginTop: 2` to that style object so it reads:

```tsx
{form.billingCycle && form.billingCycle !== 'UPFRONT' && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 2 }}>
```

Find the conditional custom-interval block:

```tsx
{form.serviceInterval === 'CUSTOM' && (
  <div className="form-group">
    <label className="form-label">Days between visits *</label>
```

No structural change needed here — it already sits inside the existing two-column grid with `visitsIncluded`, so no extra margin is introduced. Leave as-is.

Find the conditional lead-days block:

```tsx
{form.autoCreateJobs && (
  <div className="form-group" style={{ maxWidth: 220 }}>
```

Add `marginTop: 2` so it reads:

```tsx
{form.autoCreateJobs && (
  <div className="form-group" style={{ maxWidth: 220, marginTop: 2 }}>
```

- [ ] **Step 4: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 5: Manual verification**

Run: `pnpm dev:admin`
Open the Agreements page in the browser, click "New agreement". Verify: each of the four section labels (Agreement, Pricing, Service schedule, Automation) shows its icon; toggling "Billing" to a non-"Paid upfront" value reveals the amount/date row without visual jump; toggling the "How often" select to a value other than "Custom"/"" and back shows the custom-days field appearing/disappearing correctly; toggling "Create service jobs automatically" shows/hides the lead-days field. Fill out a minimal valid agreement (customer, name, start date) and click "Create agreement" — confirm it saves and the modal closes exactly as before.

- [ ] **Step 6: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/AgreementEditorModal.tsx
git commit -m "feat: use shared iconed SectionLabel in agreement editor modal"
```

---

### Task 3: `AgreementDrawer` — skeleton loading, standardized section labels, amendment collapse

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/AgreementDrawer.tsx`

**Interfaces:**
- Consumes: `SectionLabel` from `./shared` (Task 1).
- Produces: no new exports; `AgreementDrawer`'s own props (`id`, `onClose`, `onEdit`, `variant`) are unchanged.

- [ ] **Step 1: Import `SectionLabel`**

Change:

```tsx
import { AgreementStatusBadge, VisitMeter, intervalLabel, fmtDate, fmtMoney, daysUntil } from './shared'
```

to:

```tsx
import { AgreementStatusBadge, VisitMeter, intervalLabel, fmtDate, fmtMoney, daysUntil, SectionLabel } from './shared'
```

- [ ] **Step 2: Replace the four plain-text section headers with `SectionLabel`**

The "Service visits" header:

```tsx
<p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Service visits</p>
```

becomes:

```tsx
<SectionLabel icon={CalendarClock}>Service visits</SectionLabel>
```

(add `marginBottom: 8` back by wrapping — instead change the block to keep the 8px gap: replace the line above with `<div style={{ marginBottom: 8 }}><SectionLabel icon={CalendarClock}>Service visits</SectionLabel></div>`)

The "Terms" header:

```tsx
<p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Terms</p>
```

becomes:

```tsx
<div style={{ marginBottom: 4 }}><SectionLabel icon={FileSignature}>Terms</SectionLabel></div>
```

The "Change history" header (currently already icon+label, but as a raw `<p>` with an inline `<History>`):

```tsx
<p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
  <History size={12} /> Change history
</p>
```

becomes:

```tsx
<div style={{ marginBottom: 8 }}><SectionLabel icon={History}>Change history</SectionLabel></div>
```

Add a "Confirmation" section label above the existing confirmation-state block (currently that block has no header at all — find this JSX comment/block:

```tsx
{/* Confirmation state */}
<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
```

and insert a label above it:

```tsx
{/* Confirmation state */}
<div style={{ marginBottom: -6 }}><SectionLabel icon={CheckCircle2}>Confirmation</SectionLabel></div>
<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
```

Update the lucide import line from:

```tsx
import {
  Loader2, Send, RefreshCw, XCircle, Pencil, X, CheckCircle2, AlarmClock, History,
} from 'lucide-react'
```

to:

```tsx
import {
  Loader2, Send, RefreshCw, XCircle, Pencil, X, CheckCircle2, AlarmClock, History,
  FileSignature, CalendarClock,
} from 'lucide-react'
```

- [ ] **Step 3: Replace the loading spinner with a skeleton layout**

Find:

```tsx
{isLoading || !agreement ? (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={22} className="spin" style={{ color: 'var(--t3)' }} /></div>
) : (
```

Replace with:

```tsx
{isLoading || !agreement ? (
  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '60%', height: 18, borderRadius: 4, background: 'var(--bg-card-2)' }} />
      <div style={{ width: '40%', height: 13, borderRadius: 4, background: 'var(--bg-card-2)' }} />
      <div style={{ width: 90, height: 20, borderRadius: 'var(--r-full)', background: 'var(--bg-card-2)' }} />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ width: '100%', height: 64, borderRadius: 'var(--r-md)', background: 'var(--bg-card-2)' }} />
    ))}
  </div>
) : (
```

- [ ] **Step 4: Collapse the amendment history beyond 3 entries**

Add local state near the top of the component, right after `const [confirmCancel, setConfirmCancel] = useState(false)`:

```tsx
const [showAllAmendments, setShowAllAmendments] = useState(false)
```

In the `<AmendmentHistory>` render call — currently:

```tsx
<AmendmentHistory agreement={agreement} />
```

Change `AmendmentHistory`'s signature and body to accept and respect a limit. Replace the whole `AmendmentHistory` function with:

```tsx
function AmendmentHistory({ agreement, expanded, onExpand }: { agreement: Agreement; expanded: boolean; onExpand: () => void }) {
  const amendments = agreement.amendments ?? []
  if (amendments.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--t4)' }}>No changes since the agreement was created.</p>
  }
  const visible = expanded ? amendments : amendments.slice(0, 3)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {visible.map(a => (
        <div key={a.id} style={{ padding: '10px 12px', background: 'var(--bg-card-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--bd)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>
              {a.changedByName || 'Staff'} changed {Object.keys(a.changedFields).length} term{Object.keys(a.changedFields).length === 1 ? '' : 's'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{fmtDate(a.createdAt)}</span>
          </div>
          {Object.entries(a.changedFields).map(([field, change]) => (
            <p key={field} style={{ fontSize: 12, color: 'var(--t3)', margin: '2px 0' }}>
              <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{field}</span>
              {': '}{String(change.from ?? '—')} → {String(change.to ?? '—')}
            </p>
          ))}
          <p style={{ fontSize: 11, marginTop: 6, color: a.customerConfirmedAt ? 'var(--green)' : 'var(--amber)' }}>
            {a.customerConfirmedAt
              ? `Customer confirmed ${fmtDate(a.customerConfirmedAt)}`
              : a.customerNotifiedAt ? 'Waiting for customer to confirm' : 'Customer not yet notified'}
          </p>
        </div>
      ))}
      {!expanded && amendments.length > 3 && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start' }}
          onClick={onExpand}
        >
          Show all {amendments.length} changes
        </button>
      )}
    </div>
  )
}
```

Update the call site to:

```tsx
<AmendmentHistory agreement={agreement} expanded={showAllAmendments} onExpand={() => setShowAllAmendments(true)} />
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 6: Manual verification**

Run: `pnpm dev:admin`. Open Agreements, click a row to open the drawer. Verify: section labels for "Service visits", "Terms", "Change history", and the new "Confirmation" label all render with icons and consistent styling. Throttle network (browser devtools) to see the skeleton render briefly before content. Find or create an agreement with 4+ amendments (edit an ACTIVE agreement's terms twice to generate amendments) — verify only 3 show plus a "Show all N changes" button, and clicking it reveals the rest. Verify Send/Renew/Cancel buttons and the cancel-confirmation dialog behave exactly as before. Also open the drawer in `variant="modal"` context (Day Planner page, if reachable) to confirm the modal variant still renders correctly.

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/AgreementDrawer.tsx
git commit -m "feat: skeleton loading, standardized section labels, amendment collapse in agreement drawer"
```

---

### Task 4: `Agreements.tsx` — command bar (search, status counts, sort)

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/Agreements.tsx`

**Interfaces:**
- Consumes: `STATUS_STYLES` from `./shared` (already imported transitively via existing imports — confirm `STATUS_STYLES` is imported; it already is, per current file line 19).
- Produces: local state `search: string`, `sortKey: 'nextVisit' | 'value' | 'name' | 'createdAt'`, `sortDir: 'asc' | 'desc'` — consumed by Task 5 (table rendering) in the same file.

- [ ] **Step 1: Add imports**

Change the lucide import line from:

```tsx
import {
  FileSignature, Plus, Loader2, RefreshCw,
  CalendarClock, DollarSign, ShieldCheck,
} from 'lucide-react'
```

to:

```tsx
import {
  FileSignature, Plus, Loader2, RefreshCw, Search, AlertCircle,
  CalendarClock, DollarSign, ShieldCheck,
} from 'lucide-react'
```

- [ ] **Step 2: Add search/sort state and derive status counts**

In `export default function Agreements()`, right after:

```tsx
const [statusFilter, setStatusFilter] = useState('ALL')
const [detailId, setDetailId] = useState<string | null>(null)
const [editorTarget, setEditorTarget] = useState<Agreement | null | 'new'>(null)
```

add:

```tsx
const [search, setSearch] = useState('')
const [sortKey, setSortKey] = useState<'nextVisit' | 'value' | 'name' | 'createdAt'>('createdAt')
const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
const [selectedIds, setSelectedIds] = useState<string[]>([])
```

Right after the existing `kpis` useMemo block (which ends `}, [allQuery.data])`), add a second `useMemo` for per-status counts:

```tsx
const statusCounts = useMemo(() => {
  const all = allQuery.data?.data ?? []
  const counts: Record<string, number> = { ALL: all.length }
  for (const a of all) counts[a.status] = (counts[a.status] ?? 0) + 1
  return counts
}, [allQuery.data])
```

- [ ] **Step 3: Derive the filtered + searched + sorted list**

Find:

```tsx
const listQuery = useServiceAgreements({ status: statusFilter, limit: 100 })
const allQuery = useServiceAgreements({ limit: 100 })
const agreements = listQuery.data?.data ?? []
```

Replace the `agreements` line with:

```tsx
const rawAgreements = listQuery.data?.data ?? []

const agreements = useMemo(() => {
  const q = search.trim().toLowerCase()
  const filtered = q
    ? rawAgreements.filter(a =>
        a.name.toLowerCase().includes(q) ||
        (a.customer && `${a.customer.firstName} ${a.customer.lastName}`.toLowerCase().includes(q)),
      )
    : rawAgreements

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortKey === 'value') cmp = (Number(a.value) || 0) - (Number(b.value) || 0)
    else if (sortKey === 'nextVisit') {
      const da = a.nextServiceDate ? new Date(a.nextServiceDate).getTime() : Infinity
      const db = b.nextServiceDate ? new Date(b.nextServiceDate).getTime() : Infinity
      cmp = da - db
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return sorted
}, [rawAgreements, search, sortKey, sortDir])
```

- [ ] **Step 4: Replace the flat filter-pill row with the command bar**

Find the whole `{/* Filters */}` block:

```tsx
{/* Filters */}
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
  {FILTERS.map(f => (
    <button
      key={f.value}
      className="btn btn-sm"
      style={statusFilter === f.value
        ? { background: 'var(--blue)', color: 'white', border: '1px solid var(--blue)' }
        : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
      onClick={() => setStatusFilter(f.value)}
    >
      {f.label}
    </button>
  ))}
</div>
```

Replace it with:

```tsx
{/* Command bar */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
    <div className="filter-search" style={{ minWidth: 220, flex: '0 1 260px' }}>
      <Search size={13} color="var(--t4)" />
      <input
        placeholder="Search agreement or customer…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
    </div>
    <select
      className="select"
      style={{ fontSize: 12, padding: '0 8px', height: 32, fontWeight: 600, marginLeft: 'auto' }}
      value={`${sortKey}:${sortDir}`}
      onChange={e => {
        const [key, dir] = e.target.value.split(':')
        setSortKey(key as typeof sortKey)
        setSortDir(dir as 'asc' | 'desc')
      }}
    >
      <option value="createdAt:desc">Recently created</option>
      <option value="createdAt:asc">Oldest first</option>
      <option value="nextVisit:asc">Next visit soonest</option>
      <option value="value:desc">Value high → low</option>
      <option value="value:asc">Value low → high</option>
      <option value="name:asc">Name A–Z</option>
      <option value="name:desc">Name Z–A</option>
    </select>
  </div>
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {FILTERS.map(f => (
      <button
        key={f.value}
        className="btn btn-sm"
        style={statusFilter === f.value
          ? { background: 'var(--blue)', color: 'white', border: '1px solid var(--blue)' }
          : { background: 'var(--bg-card)', color: 'var(--t2)', border: '1px solid var(--bd)' }}
        onClick={() => setStatusFilter(f.value)}
      >
        {f.label} {statusCounts[f.value] != null && <span style={{ opacity: 0.75 }}>({statusCounts[f.value]})</span>}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors. (`useMemo` is already imported at the top of the file — confirm the existing import line reads `import { useMemo, useState } from 'react'`; it does not need modification.)

- [ ] **Step 6: Manual verification**

Run: `pnpm dev:admin`. Open Agreements. Verify: each status pill shows a count matching the number of agreements in that status; typing in the search box filters the table live by agreement name or customer name; changing the sort dropdown reorders the table (test "Value high → low" and "Next visit soonest" specifically since those are new); combining a status filter + search + sort together works correctly (e.g. filter to "Active", search a customer name, sort by value).

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/Agreements.tsx
git commit -m "feat: add search, status counts, and sort control to agreements command bar"
```

---

### Task 5: `Agreements.tsx` — table upgrades (checkboxes, bulk actions, overflow guard, sortable headers)

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/Agreements.tsx`

**Interfaces:**
- Consumes: `agreements` (sorted/filtered list from Task 4), `sortKey`/`sortDir`/`setSortKey`/`setSortDir` (Task 4), `selectedIds`/`setSelectedIds` (Task 4), `useSendAgreement`/`useRenewAgreement` from `../../hooks/useAgreements`.

- [ ] **Step 1: Import the bulk-action mutations**

Change:

```tsx
import {
  useServiceAgreements,
  type Agreement, type AgreementStatus,
} from '../../hooks/useAgreements'
```

to:

```tsx
import {
  useServiceAgreements, useSendAgreement, useRenewAgreement,
  type Agreement, type AgreementStatus,
} from '../../hooks/useAgreements'
```

- [ ] **Step 2: Wire up the mutations and a bulk-action helper**

Near the top of the component, after the `selectedIds` state added in Task 4, add:

```tsx
const sendMut = useSendAgreement()
const renewMut = useRenewAgreement()
const toast = useToast()

const selectedAgreements = agreements.filter(a => selectedIds.includes(a.id))
const canBulkSend = selectedAgreements.some(a => a.status === 'DRAFT' || a.status === 'SENT')
const canBulkRenew = selectedAgreements.some(a => ['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(a.status))

const runBulk = (mut: ReturnType<typeof useSendAgreement>, ids: string[], successMsg: string) => {
  ids.forEach(id => mut.mutate(id))
  toast.showSuccess(successMsg)
  setSelectedIds([])
}
```

Add the toast import at the top of the file:

```tsx
import { useToast } from '../../contexts/ToastContext'
```

- [ ] **Step 3: Add the bulk-action bar above the table**

Find the start of the `{/* List */}` block:

```tsx
{/* List */}
<div className="card" style={{ padding: 0, overflow: 'hidden' }}>
```

Insert directly before it:

```tsx
{selectedIds.length > 0 && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    background: 'var(--blue-glow)', border: '1px solid var(--blue)', borderRadius: 'var(--r-md)',
  }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{selectedIds.length} selected</span>
    <button
      className="btn btn-secondary btn-sm"
      disabled={!canBulkSend}
      onClick={() => runBulk(sendMut, selectedAgreements.filter(a => a.status === 'DRAFT' || a.status === 'SENT').map(a => a.id), 'Agreements sent')}
    >
      Send
    </button>
    <button
      className="btn btn-secondary btn-sm"
      disabled={!canBulkRenew}
      onClick={() => runBulk(renewMut, selectedAgreements.filter(a => ['ACTIVE', 'PENDING_RENEWAL', 'EXPIRED'].includes(a.status)).map(a => a.id), 'Renewals drafted')}
    >
      Renew
    </button>
    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedIds([])}>Clear</button>
  </div>
)}
```

- [ ] **Step 4: Add overflow wrapper, checkbox column, sortable headers**

Find the table's opening:

```tsx
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
  <thead>
    <tr style={{ borderBottom: '1px solid var(--bd)' }}>
      {['Agreement', 'Customer', 'Status', 'Visits', 'Next visit', 'Value'].map(h => (
        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
      ))}
    </tr>
  </thead>
```

Replace with (wrapping in an overflow div, adding the checkbox column, and making "Next visit"/"Value" clickable):

```tsx
<div style={{ overflowX: 'auto' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
  <thead>
    <tr style={{ borderBottom: '1px solid var(--bd)' }}>
      <th style={{ padding: '10px 14px', width: 32 }}>
        <input
          type="checkbox"
          checked={agreements.length > 0 && selectedIds.length === agreements.length}
          onChange={e => setSelectedIds(e.target.checked ? agreements.map(a => a.id) : [])}
        />
      </th>
      {(['Agreement', 'Customer', 'Status', 'Visits', 'Next visit', 'Value'] as const).map(h => {
        const key = h === 'Next visit' ? 'nextVisit' : h === 'Value' ? 'value' : h === 'Agreement' ? 'name' : null
        return (
          <th
            key={h}
            style={{
              textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--t3)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              cursor: key ? 'pointer' : 'default', userSelect: 'none',
            }}
            onClick={key ? () => {
              if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
              else { setSortKey(key as typeof sortKey); setSortDir('asc') }
            } : undefined}
          >
            {h}{key && sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
          </th>
        )
      })}
    </tr>
  </thead>
```

Find the row rendering:

```tsx
<tr
  key={a.id}
  style={{ borderBottom: '1px solid var(--bd)', cursor: 'pointer' }}
  onClick={() => setDetailId(a.id)}
  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-2)')}
  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
>
  <td style={{ padding: '12px 14px' }}>
```

Replace with (adding the checkbox cell; the checkbox stops propagation so it doesn't also open the drawer):

```tsx
<tr
  key={a.id}
  style={{ borderBottom: '1px solid var(--bd)', cursor: 'pointer' }}
  onClick={() => setDetailId(a.id)}
  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-2)')}
  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
>
  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
    <input
      type="checkbox"
      checked={selectedIds.includes(a.id)}
      onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id))}
    />
  </td>
  <td style={{ padding: '12px 14px' }}>
```

Find the closing of the table (right before the closing of the outer `<div className="card" ...>`):

```tsx
          </table>
        )}
      </div>
```

Replace with:

```tsx
          </table>
          </div>
        )}
      </div>
```

- [ ] **Step 5: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 6: Manual verification**

Run: `pnpm dev:admin`. Open Agreements.
- Check a row's checkbox — verify the bulk-action bar appears, shows "1 selected", and clicking the row itself (not the checkbox) still opens the drawer while clicking the checkbox does not.
- Select several agreements including at least one DRAFT/SENT and one ACTIVE — verify Send is enabled only if a DRAFT/SENT is among the selection, Renew only if an ACTIVE/PENDING_RENEWAL/EXPIRED is among the selection.
- Click "Send" with a mixed selection — verify only the eligible agreements get sent (check network tab: one POST per eligible id) and a success toast appears.
- Click the header checkbox — verify it selects/deselects all currently visible (filtered) rows, not the entire unfiltered dataset.
- Click "Agreement", "Next visit", and "Value" column headers — verify each toggles ascending/descending sort with a ▲/▼ indicator, and that "Customer"/"Status"/"Visits" headers are not clickable (no pointer cursor, no arrow).
- Resize the browser window narrow (or use devtools device emulation) — verify the table scrolls horizontally inside its own container instead of breaking the page layout.

- [ ] **Step 7: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/Agreements.tsx
git commit -m "feat: add bulk select/send/renew, sortable columns, and overflow guard to agreements table"
```

---

### Task 6: `Agreements.tsx` — skeleton loading rows and error/retry banner

**Files:**
- Modify: `apps/admin-dashboard/src/pages/agreements/Agreements.tsx`

**Interfaces:**
- Consumes: `listQuery.isLoading`, `listQuery.isError`, `listQuery.refetch()` (already available from `useServiceAgreements`, no new hook needed).

- [ ] **Step 1: Add a local `Skeleton` helper**

Add this function near the top of the file, after the `KpiCard` function definition:

```tsx
function Skeleton({ h = 14, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ width: w, height: h, background: 'var(--bg-hover, var(--bg-card-2))', borderRadius: 4 }} />
}
```

- [ ] **Step 2: Replace the loading branch with skeleton rows, and add an error branch**

Find:

```tsx
{listQuery.isLoading ? (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Loader2 size={24} className="spin" style={{ color: 'var(--t3)' }} /></div>
) : agreements.length === 0 ? (
```

Replace with:

```tsx
{listQuery.isLoading ? (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <tbody>
        {Array.from({ length: 5 }).map((_, i) => (
          <tr key={i} style={{ borderBottom: '1px solid var(--bd)' }}>
            {Array.from({ length: 7 }).map((_, j) => (
              <td key={j} style={{ padding: '12px 14px' }}><Skeleton /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : listQuery.isError ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', color: 'var(--red)', fontSize: 13 }}>
    <AlertCircle size={14} /> Failed to load agreements.
    <button
      onClick={() => listQuery.refetch()}
      style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
    >
      <RefreshCw size={12} /> Retry
    </button>
  </div>
) : agreements.length === 0 ? (
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Manual verification**

Run: `pnpm dev:admin`. Open Agreements with devtools network throttled to "Slow 3G" — verify 5 skeleton rows render briefly instead of a spinner. Then simulate an error (e.g. temporarily stop the crm-service backend, or use devtools to block the `/crm/agreements` request) — verify the red error banner with a working "Retry" button appears, and clicking Retry re-fetches.

- [ ] **Step 5: Commit**

```bash
git add apps/admin-dashboard/src/pages/agreements/Agreements.tsx
git commit -m "feat: add skeleton loading rows and error/retry state to agreements table"
```

---

## Final Verification (after all 6 tasks)

- [ ] **Step 1: Full type-check**

Run: `pnpm --filter admin-dashboard build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 2: Full manual walkthrough**

Run: `pnpm dev:admin` (plus `pnpm dev` for backends if not already running). Walk the entire Agreements module end to end:
1. List page: search, status-pill counts, sort dropdown and sortable column headers, bulk select + Send/Renew, overflow scroll on narrow width, skeleton loading, error/retry.
2. Create a new agreement via the editor modal (all 4 sections with icons, conditional fields, customer picker, validation errors, save).
3. Open the drawer for an existing agreement: skeleton loading, section labels, amendment collapse/expand, Send/Renew/Cancel actions, cancel-confirmation dialog.
4. Edit an existing agreement from the drawer ("Edit" button → editor modal pre-filled → save).
5. Confirm no regressions in `CustomerAgreementsTab` (open a customer's detail sidebar → Agreements tab) since it reuses `AgreementDrawer`/`AgreementEditorModal`/`shared.tsx` — this file wasn't modified but consumes what was.

- [ ] **Step 3: Final commit check**

```bash
git log --oneline -8
git status
```

Expected: 6 feature commits from this plan, clean working tree.
