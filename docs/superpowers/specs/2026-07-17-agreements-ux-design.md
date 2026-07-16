# Agreements Module UI/UX Redesign

**Status:** Approved for planning
**Scope:** `apps/admin-dashboard/src/pages/agreements/` — `Agreements.tsx`, `AgreementDrawer.tsx`, `AgreementEditorModal.tsx`
**Explicitly out of scope:** `CustomerAgreementsTab.tsx` (embedded in the Customers detail sidebar — deferred to a separate Customers module redesign), any backend/API changes, `shared.tsx` visual primitives (`AgreementStatusBadge`, `VisitMeter`) — kept as-is since they're reused by the in-scope Customers sidebar.

## Why

Client asked for a UI/UX pass on the Customers and Agreements pages. Given the size difference (Agreements ~660 lines vs. Customers + its 2,161-line detail sidebar ~2,900 lines), we're sequencing this as two separate design→plan→build cycles. This spec covers Agreements first.

## Design principles for this pass

- **Evolve within the existing design system.** Same CSS custom properties (`--blue`, `--bd`, `--bg-card`, etc.), same `.btn`/`.card`/`.form-input`/`.kpi-card` classes used elsewhere in admin-dashboard. No new color palette or component primitives — this keeps the module visually consistent with Dashboard, Jobs, Customers, Dispatch.
- **No functionality lost.** Every current action (send, renew, cancel, create, edit, filter by status) must still work exactly as it does today; this pass fixes gaps and tightens visuals, it does not remove features.
- **Fix measured gaps, not hypothetical ones.** Concrete gaps identified in current code: no search on the Agreements list, status filter pills have no counts, table has no responsive overflow guard, no bulk actions, loading state is a single spinner (inconsistent with Customers page's skeleton-row pattern), no error/retry state at all.

## 1. List page (`Agreements.tsx`)

### Header & KPIs
Unchanged in substance: title, "New agreement" button, 4 KPI cards (Active agreements, Visits due in 30 days, Pending renewal, Active contract value). Only spacing/alignment tightened against the new command bar below. KPI cards stay non-interactive (no click-through) — consistent with how the rest of the KPI row already behaves; avoids introducing a new affordance that isn't asked for.

### Command bar (new, replaces the bare filter-pill row)
Single row above the table:
- **Search input** — filters the already-fetched list (agreement name + customer name), client-side against the existing `useServiceAgreements({ limit: 100 })` result. No new endpoint.
- **Status filter pills** — same 7 filters (`ALL/ACTIVE/SENT/DRAFT/PENDING_RENEWAL/EXPIRED/CANCELLED`), each now shows a live count badge computed from the already-fetched `allQuery` data (no extra request).
- **Sort control** — `<select>` matching the pattern already used on the Customers page: Next visit soonest, Value high→low, Name A–Z, Recently created.
- Row-density toggle is explicitly **not** included (no stated need, adds complexity).

### Table
Same columns (Agreement, Customer, Status, Visits, Next visit, Value), plus:
- **Checkbox column** for multi-select. Selecting ≥1 row shows a bulk-action bar above the table with **Send** and **Renew** only (mirrors the two bulk-safe actions already on the drawer). **Cancel is deliberately excluded from bulk** to prevent accidental mass-cancellation.
- Table wrapped in `overflow-x-auto` so it can't break page layout on narrow viewports (currently unguarded — flagged by UX guideline "Table Handling").
- Column headers for **Next visit** and **Value** are clickable to sort, sharing state with the command-bar sort control.
- **Loading state:** skeleton rows (same visual pattern as `Customers.tsx`'s `<Skeleton>` component), replacing the current single centered `Loader2` spinner.
- **Error state:** inline retry banner (`AlertCircle` icon + message + Retry button), matching the pattern already in `Customers.tsx`. Agreements currently has zero error handling.
- Empty state: keep existing copy and icon treatment, tighten visual polish only.

## 2. `AgreementDrawer.tsx`

Both existing render variants (`variant="drawer"` used by the Agreements page, `variant="modal"` used by Day Planner) are preserved exactly — other call sites depend on this prop contract.

Changes:
- **Loading state:** skeleton layout matching the drawer's real content shape, replacing the bare centered spinner — avoids the drawer "popping" once data resolves.
- **Section headers standardized:** all five sections (Actions, Visits, Terms, Confirmation, Change history) get consistent label styling; currently only "Change history" has an icon+label treatment.
- **Amendment history collapse:** if more than 3 amendments exist, show the 3 most recent plus a "Show all N changes" toggle that expands in place (no new modal/route).
- **No behavior changes** to Send / Renew / Cancel actions, mutation wiring, or the cancel-confirmation dialog.

## 3. `AgreementEditorModal.tsx`

Same 4 sections (Agreement basics, Pricing, Service schedule, Automation), identical validation and save logic (create vs. update, required-field checks, error banner).

Changes:
- Each section label gets a small icon (matching the icon-badge already used in the modal header) so the form reads as distinct steps rather than one long scroll.
- Customer search-picker: identical behavior (search-as-you-type dropdown, click to select), restyled spacing only.
- Conditional fields (billing amount/date, custom interval days, lead days) keep identical show/hide logic; spacing adjusted so their appearance doesn't visually jolt the surrounding layout.

## Non-goals

- No changes to `CustomerAgreementsTab.tsx`, `shared.tsx` primitives, or any hook/API in `useAgreements.ts`.
- No new bulk action beyond Send/Renew (no bulk cancel, no bulk delete — delete doesn't exist today).
- No row-density toggle.
- No backend/schema changes.

## Testing expectations

- Every existing action (create, edit, send, renew, cancel, status filter) must be manually re-verified after the redesign — this is a pure frontend restructure with no test suite in admin-dashboard (`tsc -b` via `pnpm build` is the only automated check, per repo convention).
- Verify the new client-side search/sort/bulk-select against realistic data volumes (up to the 100-record `limit` currently fetched) to confirm no perceptible lag, since everything is computed client-side rather than server-side.
