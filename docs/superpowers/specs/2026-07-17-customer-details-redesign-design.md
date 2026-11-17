# Customer Details Module UI/UX Redesign

**Status:** Approved for planning
**Scope:** `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx` (2,161 lines) and its sub-components. `Customers.tsx` gets only the small sort-control consistency tweak already applied to Agreements.
**Design source:** User-provided Claude Design project "HomePulse CRM System Redesign" (`3b03d5fb-bf85-483d-9310-522d9023bda0`), files `Customer Details Prototypes.dc.html` (option **1a — Context Workspace**, chosen by user) and `Modal System Redesign.dc.html` (shell anatomy reference). Full mockup HTML was read via the DesignSync MCP tool and is the visual source of truth for this redesign — deviations from it must be justified by a real functional constraint (e.g. preserving a feature not shown in the mockup's demo data, like Projects).
**Explicitly out of scope for this pass:** rolling the "modal shell" (sticky header/body/footer, 5-size scale) out to the ~20 other dialogs across the app — that's a separate future initiative. `Customers.tsx` list page beyond the sort-control tweak.

## Why

Continuation of the Agreements-module redesign (see `2026-07-17-agreements-ux-design.md`), now covering the much larger Customers module. The user supplied a concrete Claude Design mockup mid-session specifying the exact visual structure to build, superseding the more open-ended "evolve within design system" brief used for Agreements — though it turns out the mockup's hex values are an exact match to the app's own existing light-theme CSS custom properties (`--bg-card:#FFFFFF`, `--blue:#2563EB`, `--t1:#111827`, `--t3:#6B7280`, `--bd:#E5E7EB`, `--font:'Poppins'…`), so implementing via `var(--...)` tokens (as done throughout this session) reproduces the mockup exactly in light theme while remaining theme-safe in dark/black.

## Hard constraint

**Every existing feature, input, and action must survive**, including the ones flagged as mocked/local-only during the earlier functional audit (Reviews tab, Account Contacts sub-section) — per the earlier decision, those are restyled but kept functionally identical (same local-state-only behavior, same `alert()`-based review-request flow), not removed or relabeled as "coming soon." Two small behavior fixes are approved (see below) but nothing else changes behavior.

## 1. File structure (component decomposition)

Replacing the single 2,161-line file with:

- **`CustomerDetailsSidebar.tsx`** (orchestrator, target ~350-400 lines) — modal shell, header, persistent left rail, tab bar, active-tab dispatch, and the top-level state that must be shared across tabs or drive the global Save (`isEditMode`, `formData`, `addresses`, `equipment`, `tags`, the `handleSave` mutation chain, `AddJobModal` control).
- **`pages/customers/tabs/OverviewTab.tsx`** — profile fields + Account Contacts (mocked) + Addresses. Receives `formData`, `isEditMode`, field setters, `addresses` state + setter from the orchestrator (all participate in global Save).
- **`pages/customers/tabs/EquipmentTab.tsx`** — equipment cards + `EquipmentConsumables` (existing sub-component, untouched). Receives `equipment` state + setter from the orchestrator (participates in global Save).
- **`pages/customers/tabs/JobsTab.tsx`** — quotes/invoices/jobs lists + `AddJobModal` trigger. Self-fetches via existing hooks (`useJobs`, `useQuotes`, `useInvoices`), scoped by `customerId` prop.
- **`pages/customers/tabs/AgreementsTab.tsx`** — thin wrapper that renders the existing `CustomerAgreementsTab` (from `pages/agreements/`) restyled to match; the underlying component now comes into scope for restyling (was deferred during the Agreements pass).
- **`pages/customers/tabs/ProjectsTab.tsx`** — existing Projects content, restyled, always rendered (empty state instead of disappearing).
- **`pages/customers/tabs/ReviewsTab.tsx`** — existing mocked Reviews content, restyled only, same local-state, same `alert()`-based request flow.
- **`pages/customers/tabs/ActivityTab.tsx`** — existing stub timeline, restyled only.
- **`pages/customers/tabs/AiIotTab.tsx`** — Reasoning content (stat grid + 4 `ReasoningCard`s) + a divider + the existing `IotDevicesTab` component, stacked in one scrollable tab.
- **`pages/customers/shared.tsx`** (new) — extracted reusable primitives: `Field` (labeled input/select/textarea that swaps edit/view styling), `SectionLabel` (icon + uppercase label, same pattern as `agreements/shared.tsx`), `DetailRow`-equivalent for read-only key/value rows, the badge/pill helper used for status/type/tag chips, and the "map over array by id, patch one field" helper currently duplicated 4× (contacts/addresses/equipment/reviews) — extracted once as a generic `patchById(setter, id, field, value)` helper.

Each tab file receives `customerId` at minimum; edit-participating tabs (Overview, Equipment) additionally receive `isEditMode` and their slice of state + setters as props from the orchestrator — no new global state management library, plain prop-drilling matching the codebase's existing conventions (see `packages/types`, no Redux/Zustand in this app).

## 2. Orchestrator shell

- **Container:** centered modal (not a right-side drawer), `width: 1280px` (`maxWidth: 95vw`), `maxHeight: 90vh`, pinned header/scrolling body — same shell pattern as `AgreementEditorModal`/`AgreementDrawer` modal variant built in the prior pass. Backdrop `rgba(0,0,0,0.45)`, 4px blur, centered.
- **Header:** avatar-initials tile (gradient background, matches mockup), name + type badge + tag badges (e.g. VIP-style), a meta line ("Customer since … · ID …"), header action buttons (Message, New job, Edit/Save toggle, Close) replacing the current full-width blue bar and the header-embedded date inputs. "Customer since" and "Last service" move into the Overview tab's profile fields or the meta line (read-only display), no longer separate editable header inputs — this is a placement change, not a functionality removal: both values remain visible and (customerSince) editable in edit mode within the Overview tab's field grid.
- **Left rail** (persistent across all tabs): **AI health** card (churn risk %, top upsell recommendation, proposed next step — sourced from `useCustomerStatusSummary`, the same data already computed for the Customers-list hover card and the Reasoning tab, now always-visible instead of hover-only), **Revenue** card (lifetime/YTD/outstanding, from existing invoice aggregation), **Contact** card (email/phone/location + Call/Message quick actions, from `person` fields). No new data fetching — same hooks/queries already used today, just relocated and always-rendered instead of split between hover-card and various left-column cards.
- **Tab bar:** underline-style tabs, all 8 always rendered (Overview, Equipment, Jobs, Agreements, Projects, Reviews, Activity, AI & IoT) — fixes the Projects-tab layout-shift bug. Jobs tab keeps its live count badge.

## 3. Behavior fixes (approved)

- **"Add Address" no longer force-enables edit mode.** Matches "Add Equipment"'s existing behavior: the button is gated to only render when already in edit mode, rather than silently flipping the whole sidebar into edit mode as a side effect of an unrelated click.
- **Projects tab is never conditionally hidden.** Always present in the tab bar; renders its existing empty state when `customerProjects.length === 0` instead of being removed from the tab list, eliminating the layout shift.

## 4. Explicitly unchanged behavior

- Reviews tab: fully mocked, local-state-only, `alert()`-based request-send — restyled to the mockup's rating/review-card visual language, zero behavior change.
- Account Contacts (inside Overview/Contact): local-only, never persisted — restyled, zero behavior change.
- Activity tab: single synthetic "Customer Created" event, no real activity log — restyled, zero behavior change.
- Global Save (`handleSave`): still persists core profile fields + addresses + equipment in one chained mutation via `useUpdateCustomer` → `useSaveCustomerAddresses`/`useSaveCustomerEquipment` on success, exactly as today. Reviews and Account Contacts remain outside Save's scope, matching current (if non-obvious) behavior.
- Cross-tab DOM `CustomEvent` coupling (`open-quote-detail`, `open-invoice-detail`, `open-job-detail`) — unchanged, still consumed elsewhere in the app shell.
- IoT tab's dev-only tooling (`Seed Mock`, `Trigger Alerts Cron Now`) — unchanged `isDev` gating.
- `EquipmentConsumables`'s existing-equipment-only rendering condition — unchanged.

## Testing expectations

- No test suite exists for admin-dashboard beyond `tsc -b` (via `pnpm --filter admin-dashboard build`). Every task in the implementation plan must include a type-check step and an explicit manual browser walkthrough of the affected tab(s) — given this touches 10 tabs' worth of real functionality (profile edit, address CRUD, equipment CRUD + consumables, jobs/quotes/invoices navigation, agreements actions, projects navigation, reviews mock CRUD, IoT connect/disconnect), the manual walkthrough must exercise every action listed in the original functional audit, not just visual inspection.
- Given the size (10 tabs, ~2,900 lines total across old files), the implementation plan should be executed task-by-task with verification after each tab, not as one large diff.
