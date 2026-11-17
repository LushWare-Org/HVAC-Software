# Customer Details Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2,161-line `CustomerDetailsSidebar.tsx` with a decomposed orchestrator + 8 tab files, rebuilt to match the user-approved Claude Design mockup (option 1a "Context Workspace" from `Customer Details Prototypes.dc.html`), while preserving every existing feature, input, and action.

**Architecture:** Orchestrator owns the modal shell, header, persistent left rail, and edit-participating state (profile fields, addresses, equipment, tags). Each tab is its own file receiving `customerId` + relevant props. New `pages/customers/shared.tsx` holds reusable primitives. Visual tokens come from the app's existing CSS custom properties, which are confirmed to already match the mockup's hardcoded hex values exactly.

**Tech Stack:** React 19, TanStack Query (existing hooks, no new ones), existing CSS custom-property design system, Lucide icons.

## Global Constraints

- **Every existing feature, input, and action must work identically after this change** — this is a restructure/restyle, not a functionality change. Cross-check against the file-by-file source read during planning (`CustomerDetailsSidebar.tsx`, full 2,161 lines).
- Visual tokens: use `var(--bg-card)`, `var(--bg-card-2)`, `var(--bd)`, `var(--blue)`, `var(--blue-dim)`, `var(--blue-glow)`, `var(--green)`, `var(--amber)`, `var(--red)`, `var(--t1)`–`var(--t4)` exclusively — these already resolve to the mockup's exact hex values (`--bg-card:#FFFFFF`, `--blue:#2563EB`, `--t1:#111827`, `--t3:#6B7280`, `--bd:#E5E7EB`) in the default theme, confirmed against `apps/admin-dashboard/src/index.css`. Never hardcode hex.
- Font is already Poppins (`--font` in index.css) — no font change needed.
- Money fields go through `formatMoney`/`decimalToNumber` from `lib/format.ts` / `hooks/useFinance.ts`, exactly as today — never format inline.
- Two approved behavior fixes (only behavior changes in scope): (1) "Add Address" no longer force-enables edit mode. (2) Projects tab always renders in the tab bar (empty state instead of disappearing).
- Reviews tab and Account Contacts sub-section: restyle only, same local-state-only behavior, same `alert()`-based review-request flow — do not wire to a real backend, do not add "coming soon" framing.
- `EquipmentConsumables`'s existing condition (`equipmentQuery.data?.some(d => d.id === eq.id)`) must be preserved exactly.
- DOM `CustomEvent` dispatches (`open-quote-detail`, `open-invoice-detail`, `open-job-detail`) must be preserved exactly — consumed elsewhere in the app shell.
- `CustomerAgreementsTab` (in `pages/agreements/`) is restyled in place, not moved — its own file, own props (`customerId`, `customerName`), no signature change.
- No test suite for admin-dashboard — every task's verification is `pnpm --filter admin-dashboard build` (type-check) plus an explicit manual browser check exercising every action listed in that task's "Preserve" list.

---

## File Structure

- **Create:** `pages/customers/shared.tsx` — `Field`, `SectionLabel`, `DetailRow`, badge/pill helper, `patchById` helper.
- **Create:** `pages/customers/tabs/OverviewTab.tsx` — profile fields, tags, Account Contacts (mocked), Addresses.
- **Create:** `pages/customers/tabs/EquipmentTab.tsx` — equipment cards + `EquipmentConsumables`.
- **Create:** `pages/customers/tabs/JobsTab.tsx` — quotes/invoices/jobs + New Job button + `AddJobModal` trigger callback.
- **Create:** `pages/customers/tabs/AgreementsTab.tsx` — thin wrapper rendering `CustomerAgreementsTab`.
- **Create:** `pages/customers/tabs/ProjectsTab.tsx` — projects list + empty state.
- **Create:** `pages/customers/tabs/ReviewsTab.tsx` — mocked reviews UI.
- **Create:** `pages/customers/tabs/ActivityTab.tsx` — activity timeline stub.
- **Create:** `pages/customers/tabs/AiIotTab.tsx` — Reasoning content + IoT content stacked.
- **Modify:** `pages/customers/CustomerDetailsSidebar.tsx` — rewritten as orchestrator (~350-400 lines): modal shell, header, left rail, tab bar, tab dispatch, shared edit-mode state, `handleSave`, `AddJobModal` mount.
- **Modify:** `pages/agreements/CustomerAgreementsTab.tsx` — restyle only (box/DetailRow language matching `agreements/shared.tsx`), no prop/behavior change.
- **No changes** to `EquipmentConsumables.tsx`, `IotDevicesTab.tsx`, `TagInput.tsx`, `AddJobModal.tsx`, any hooks, or `Customers.tsx` (beyond the sort-control tweak already done in the Agreements pass, N/A here).

---

### Task 1: `pages/customers/shared.tsx` — shared primitives

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/shared.tsx`

**Interfaces (produced, consumed by all tab files + orchestrator):**
- `Field({ label, name, value, type?, isEdit, onChange, placeholder?, full?, as?, options? })` — same behavior as the current in-file `Field` (view/edit style swap), restyled: view mode renders `var(--bg-card-2)` background matching the mockup's `.fld` style; edit mode renders a bordered white input matching `.form-input`.
- `SectionLabel({ icon?, children })` — icon + `var(--t1)` 700-weight 13px label (matches the mockup's tab-content section headers, e.g. "Addresses", "Equipment records") — note this is a heavier weight than the Agreements module's `SectionLabel` (11px uppercase muted) because the mockup uses bold dark section titles inside tab bodies, not muted uppercase eyebrows. Keep both — do not try to unify with `agreements/shared.tsx`'s `SectionLabel`, they serve different visual roles.
- `DetailRow({ label, children })` — label/value row, same shape as `agreements/shared.tsx`'s version (can literally re-export or duplicate — duplicate to keep `pages/customers` self-contained, matching how `agreements/shared.tsx` isn't imported by unrelated modules).
- `Badge({ tone, children })` — pill helper: `tone` maps to one of `blue | violet | green | amber | red | neutral`, each with a `{bg, color}` pair matching the mockup's badges (e.g. blue: `background: var(--blue-glow), color: var(--blue)`; green: `background: color-mix(in srgb, var(--green) 15%, transparent), color: var(--green)`). Replaces the ad-hoc `badge badge-*` className usage and inline badge styles scattered through the old file.
- `patchById<T extends { id: any }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: any, patch: Partial<T>)` — replaces the "map over array by id, patch one field" pattern duplicated for contacts/addresses/equipment/reviews. Usage: `patchById(setAddresses, addr.id, { line1: e.target.value })`.

- [ ] **Step 1: Write `shared.tsx`** with the five exports above. Base the visual values on `apps/admin-dashboard/src/pages/agreements/shared.tsx` for structural conventions (inline `style` objects using `var(--...)`) and on the mockup's `.fld`/`.lbl`/`.badge` CSS classes (read from `Modal System Redesign.dc.html` / `Customer Details Prototypes.dc.html` via the `DesignSync` MCP tool, project id `3b03d5fb-bf85-483d-9310-522d9023bda0`) for exact spacing/radius/weight values.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`. Expected: succeeds (file not yet imported anywhere, validates in isolation).

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/shared.tsx && git commit -m "feat: add shared primitives for customer details redesign"`

---

### Task 2: `pages/customers/tabs/OverviewTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/OverviewTab.tsx`

**Interfaces:**
- Props: `{ formData: any; isEditMode: boolean; onFieldChange: (e) => void; tags: string[]; onTagsChange: (tags: string[]) => void; allTags: string[]; contacts: any[]; onContactsChange: (updater) => void; addresses: any[]; onAddressesChange: (updater) => void; isEditModeForceOn: () => void }`
- Consumes: `Field`, `SectionLabel`, `patchById` from `../shared`; `TagInput` from `../../../components/TagInput`.

**Preserve exactly** (verify against original lines 894-1251 of the pre-redesign `CustomerDetailsSidebar.tsx`):
- Profile Info fields: Full Name, Email, Phone, Lead Source (select), Customer Type (select), Notes/Remarks (textarea, full-width), Tags (`TagInput`, full-width, suggestions from `allTags`, `readOnly={!isEditMode}`).
- Account Contacts: "Add Contact" button (edit-mode only, appends blank contact with role "Tenant"), per-contact Name/Role(select)/Email/Phone fields, delete button (edit mode + >1 contact only). Local-state-only, never sent to Save — this must remain true (do not add a persistence call).
- Addresses: "Add Address" button — **behavior fix**: gate this button to only render `isEditMode && <button>`, remove the `if (!isEditMode) setIsEditMode(true)` auto-enable side effect entirely (call `onAddressesChange` to append directly, matching how Equipment's "Add Equipment" already behaves). Empty-state message when `addresses.length === 0`. Per-address card: Type select (Site/Billing/Shipping), "Primary" badge if `addr.primary`, delete button (edit mode + >1 address only), fields Address Line 1/2, City, State, Postcode.

- [ ] **Step 1: Build the component** per the "Preserve exactly" list, restyled with `Field`/`SectionLabel`/`Badge` from `shared.tsx`, laid out as: a bordered section-card (matching Agreements' `sectionCardStyle` pattern) for Profile Info with a `repeat(auto-fit, minmax(200px,1fr))` field grid (matching the mockup's 2-4 col responsive grid), then a section-card for Addresses with a 2-col card grid (matching the mockup's Address two-up layout), then Account Contacts below.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`. Expected: fails only on "not imported"-type errors if any, or succeeds if self-contained — resolve any prop-typing issues.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/OverviewTab.tsx && git commit -m "feat: extract customer Overview tab (contact + addresses)"`

---

### Task 3: `pages/customers/tabs/EquipmentTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/EquipmentTab.tsx`

**Interfaces:**
- Props: `{ customerId: string; isEditMode: boolean; equipment: any[]; onEquipmentChange: (updater) => void; equipmentQueryData: any[] | undefined }`
- Consumes: `SectionLabel`, `Badge` from `../shared`; `EquipmentConsumables` from `../EquipmentConsumables` (unchanged import).

**Preserve exactly** (original lines 1254-1438):
- "Add Equipment" button (edit-mode only, appends blank equipment with `type: 'Boiler'`) — this one already doesn't auto-enable edit mode; keep that (no fix needed here, only Addresses needed the fix).
- Per-equipment card: header with computed name (brand+model or "Equipment N"), Type select, delete button (edit mode only); Brand/Model (2-col); Serial No./Install Date/Warranty Until (3-col); Manual URL (full width).
- `EquipmentConsumables` rendered only when `equipmentQueryData?.some(d => d.id === eq.id)` — exact condition preserved.
- Empty state when `equipment.length === 0`.

- [ ] **Step 1: Build the component**, restyled to match the mockup's equipment card treatment (card per unit, status badge top-right e.g. "In warranty"/"Service due", metadata row below).

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/EquipmentTab.tsx && git commit -m "feat: extract customer Equipment tab"`

---

### Task 4: `pages/customers/tabs/JobsTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/JobsTab.tsx`

**Interfaces:**
- Props: `{ customerId: string; onNewJob: () => void }` (orchestrator owns `isAddJobModalOpen` + mounts `AddJobModal`; this tab only triggers it via callback).
- Self-fetches via `useJobs({ customerId, limit: 50 })`, `useQuotes({ customerId, limit: 50 })`, `useInvoices({ customerId, limit: 50 })` — same hooks, same limit, same client-side sort by `createdAt` desc, same as original lines 1441-1579.

**Preserve exactly:**
- Quotes section (only if any): rows dispatch `open-quote-detail` CustomEvent on click, same payload shape.
- Invoices section (only if any): rows dispatch `open-invoice-detail`, balance-due amber note when `balanceDue > 0`.
- Jobs section: "New Job" button calls `onNewJob()`, table with skeleton-loading rows while fetching, `open-job-detail` dispatch per row, empty-state row.

- [ ] **Step 1: Build the component**, restyled to the mockup's grouped Quotes/Invoices/Jobs list with left-accent-border cards (blue for quotes, green for invoices, amber/status-color for jobs) replacing the current plain table row.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/JobsTab.tsx && git commit -m "feat: extract customer Jobs tab (quotes/invoices/jobs)"`

---

### Task 5: `pages/customers/tabs/AgreementsTab.tsx` + restyle `CustomerAgreementsTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/AgreementsTab.tsx`
- Modify: `apps/admin-dashboard/src/pages/agreements/CustomerAgreementsTab.tsx`

**Interfaces:**
- `AgreementsTab` props: `{ customerId: string; customerName: string }` — thin wrapper: `<CustomerAgreementsTab customerId={customerId} customerName={customerName} />`, no logic of its own.
- `CustomerAgreementsTab` keeps its exact current props and hooks (`useServiceAgreements`, `useSendAgreement`, `useRenewAgreement`, `AgreementEditorModal`) — restyle only.

**Preserve exactly:**
- "New agreement" button opens `AgreementEditorModal`.
- List of agreement cards with name/service type/interval/status badge/visit meter/next visit/value.
- Edit/Send/Resend/Renew actions with their existing status-based visibility rules.
- Empty state.

- [ ] **Step 1: Read `CustomerAgreementsTab.tsx`'s current 117 lines in full**, then restyle its card list to match the box/`DetailRow` language already established in `agreements/shared.tsx` (reuse `AgreementStatusBadge`, `VisitMeter`, `SectionLabel` from there — these are the exact same status agreements, same component, just presented inside the Customer Details tab now) and the mockup's single-agreement summary card treatment (name + status badge header row, "Visits used" progress bar).

- [ ] **Step 2: Build `AgreementsTab.tsx`** as the thin wrapper.

- [ ] **Step 3: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 4: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/AgreementsTab.tsx apps/admin-dashboard/src/pages/agreements/CustomerAgreementsTab.tsx && git commit -m "feat: restyle CustomerAgreementsTab, add customer Agreements tab wrapper"`

---

### Task 6: `pages/customers/tabs/ProjectsTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/ProjectsTab.tsx`

**Interfaces:**
- Props: `{ customerId: string }` — self-fetches via `useCustomerProjects(customerId)` from `../../projects/projectsApi`, self-navigates via `useNavigate()`.

**Preserve exactly** (original lines 1582-1621):
- Project rows: icon by `STATUS_META[pr.status]`, name, start→target-end dates, status badge, click navigates to `/projects/${pr.id}`.

**Behavior fix (approved):** add an empty-state block (icon + "No projects yet" message, matching the visual language of other tabs' empty states — e.g. Equipment's or Addresses' empty state pattern) for when `(customerProjects ?? []).length === 0`, since this tab is now always in the tab bar instead of conditionally hidden.

- [ ] **Step 1: Build the component** with the preserved row behavior plus the new empty state.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/ProjectsTab.tsx && git commit -m "feat: extract customer Projects tab, always visible with empty state"`

---

### Task 7: `pages/customers/tabs/ReviewsTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/ReviewsTab.tsx`

**Interfaces:**
- Props: `{ isEditMode: boolean; reviews: any[]; onReviewsChange: (updater) => void; showRequestPanel: boolean; onToggleRequestPanel: () => void; requestForm: {...}; onRequestFormChange: (patch) => void; customerEmail: string; customerName: string }` (orchestrator keeps `reviews`/`showRequestPanel`/`requestForm` state since nothing here persists to Save, but keeping it in the orchestrator avoids losing state when switching tabs — matches current behavior where all this lives in the parent).

**Preserve exactly** (original lines 1632-2011) — this is the largest single preservation surface, all of it mocked/local-only per the earlier explicit decision:
- Summary panel: average rating, star display, review count, per-rating-count distribution bars.
- "Request Review" toggle (edit mode only) — pre-fills email from customer's email.
- "Add Manual Review" button (edit mode only) — prepends blank 5-star review.
- Request Review panel: Email input, Message textarea, "Send Request" button → `alert(...)` (not a real API call — preserve this exactly, do not wire to a real endpoint), Cancel button.
- Review list: interactive star picker (edit mode), comment textarea/quoted-text toggle, date, delete (edit mode), reply flow (Reply button → inline textarea + Submit Reply/Cancel, or "Replied" badge + read-only reply text if already replied).
- Empty state.

- [ ] **Step 1: Build the component**, restyled to the mockup's amber-tinted rating summary card, but with every interactive control (star picker, request panel, reply flow, manual-add, delete) preserved and wired to the same local-state-only behavior as before — no persistence added.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Manual verification (do this one now, not deferred to final pass, given how much mocked interactive state lives here):** open the tab in edit mode, verify: star rating on a review is clickable and updates; "Add Manual Review" prepends a blank review; "Request Review" toggle shows/hides the panel and pre-fills email; typing in Message/Email works; "Send Request" triggers the `alert()` and closes the panel; Reply button reveals a textarea, "Submit Reply" marks it "Replied"; delete removes a review from the list.

- [ ] **Step 4: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/ReviewsTab.tsx && git commit -m "feat: extract customer Reviews tab (mocked, unchanged behavior)"`

---

### Task 8: `pages/customers/tabs/ActivityTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/ActivityTab.tsx`

**Interfaces:**
- Props: `{ createdAt: string; source?: string }` — builds the same single-event `activityTimeline` array inline (original lines 526-537), no new data source.

**Preserve exactly:** single synthetic "Customer Created" event derived from `createdAt`/`source`; the "no activity" branch stays present (still effectively unreachable, matching today — not a bug this pass fixes).

- [ ] **Step 1: Build the component** with a vertical timeline restyled to the mockup's dot-and-line activity feed.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/ActivityTab.tsx && git commit -m "feat: extract customer Activity tab"`

---

### Task 9: `pages/customers/tabs/AiIotTab.tsx`

**Files:**
- Create: `apps/admin-dashboard/src/pages/customers/tabs/AiIotTab.tsx`

**Interfaces:**
- Props: `{ customerId: string }` — self-fetches via `useCustomerStatusSummary(customerId)` for the Reasoning half; mounts the existing `IotDevicesTab` component (unchanged) for the IoT half.

**Preserve exactly:**
- Reasoning half (original lines 2013-2086): loading/error states, 4-stat grid (prediction source, churn risk, failure risk, revenue risk), 4× `ReasoningCard` (Upsell Recommendation, Retention Suggestion, Failure & Churn Prediction, Proposed Next Step) using `reasoning ?? fallbackReasoning(summary)` exactly as today. `ReasoningCard` and `fallbackReasoning` move into this file (or `shared.tsx` if reused elsewhere — they aren't, so keep local to this file).
- IoT half (original lines 2088-2096): mounts `<IotDevicesTab customerId={customerId} />` unchanged — all of `IotDevicesTab.tsx`'s own internals (toolbar, alerts, dev tooling, device cards) are untouched by this plan.

- [ ] **Step 1: Build the component** as Reasoning content, then a visual divider (`SectionLabel` or a `<hr>`-style rule matching the mockup's single combined "AI & IoT" tab), then the IoT content.

- [ ] **Step 2: Type-check.** Run: `pnpm --filter admin-dashboard build`.

- [ ] **Step 3: Commit.** `git add apps/admin-dashboard/src/pages/customers/tabs/AiIotTab.tsx && git commit -m "feat: extract customer AI & IoT tab (reasoning + IoT combined)"`

---

### Task 10: Rewrite `CustomerDetailsSidebar.tsx` as the orchestrator

**Files:**
- Modify: `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx` (full rewrite)

**Interfaces:**
- Consumes: all 8 tab components from `./tabs/*`; `Field`/`SectionLabel`/`Badge` from `./shared` (for the header/rail, which stay in the orchestrator); all existing hooks the original file used (`useCustomerStatusSummary`, `useUpdateCustomer`, `useCustomerTags`, `useCustomerAddresses`, `useSaveCustomerAddresses`, `useCustomerEquipment`, `useSaveCustomerEquipment`, `useCustomerProjects`, `useJobs`/`useQuotes`/`useInvoices` — the last three only for the header's live Jobs-tab count badge and revenue rail figures, since the Jobs *content* itself moved into `JobsTab.tsx` which re-fetches independently).
- Produces: same public props as today — `{ person, isOpen, onClose, onBack?, initialTab? }` — **no signature change**, since `Customers.tsx` and any other call site pass these exact props.

**Preserve exactly:**
- Modal shell: body-scroll-lock effect, backdrop-click-to-close, `if (!isOpen || !person) return null` guard.
- All top-level state: `isEditMode`, `formData`, `addresses`, `contacts`, `equipment`, `tags`, `reviews`, `showRequestPanel`, `requestForm`, `saveSucceeded`, `isAddJobModalOpen` — all stay in the orchestrator (tabs receive slices as props).
- `handleSave`: identical chained-mutation logic (`useUpdateCustomer` → on success, conditionally `saveAddresses.mutate`/`saveEquipment.mutate`, then `setIsEditMode(false)`, 2s "Saved" indicator, toast).
- `AddJobModal` mount at the root, wired to `isAddJobModalOpen`/`setIsAddJobModalOpen`/`customerJobsQuery.refetch()` on creation — but since Jobs' query now lives in `JobsTab.tsx`, the orchestrator's `AddJobModal onCreated` callback needs a way to trigger a refetch in the now-separate `JobsTab`. **Resolution:** pass a `jobsRefetchKey` number that the orchestrator increments in `onCreated`, and `JobsTab` includes it in its `useJobs` call's dependency via a `key={jobsRefetchKey}` remount, OR simpler: `AddJobModal`'s `onCreated` calls `queryClient.invalidateQueries({ queryKey: ['jobs'] })` directly (check `useJobs`'s actual query key in `hooks/useJobs.ts` first) so `JobsTab`'s own `useJobs` call picks up the invalidation automatically — prefer this second approach since it needs no prop plumbing between orchestrator and tab.
- Engagement-status stepper: keep exactly as today (5-stage pipeline, hidden when status is INACTIVE) — restyled to match the mockup's lifecycle-strip visual weight, but **note**: this pipeline is a distinct feature from the "lifecycle section" the user asked to remove — that removal request was specifically about the Modal System Redesign mockup's separate horizontal pipeline strip *between header and body* (a different, newer UI element shown only in that mockup, not present in the current app at all). The current app's existing 5-stage engagement stepper is real, working functionality (`engagementStatus` field, editable) that must be preserved — it just moves into the Overview tab or stays in a slim header sub-row, at the implementer's discretion, since the mockup doesn't show an equivalent element to copy exactly.

- [ ] **Step 1: Write the new header** — avatar-initials tile, name + type badge, meta line ("Customer since … · ID …" using `formData.customerSince ?? person.createdAt`), header actions (Message — no-op/mailto same as before if any existed, "New job" → `setIsAddJobModalOpen(true)`, Edit/Save toggle — identical `handleSave`/`isEditMode` wiring as today, Close → `onClose`).

- [ ] **Step 2: Write the left rail** — AI health card (from `statusSummaryQuery.data`: churn risk level+%, top upsell recommendation via the same `upsellRecommendation`/inline-fallback logic already used elsewhere in this codebase for consistency — reuse the exact scoring helpers from `pages/customers/Customers.tsx`'s `inlineUpsellRecommendation`/`inlineRetentionPrediction` if `summary.upsellRecommendation` is absent, matching the fallback pattern already established there), Revenue card (`lifetimeRevenue`/`ytdRevenue`/`outstandingBalance`, same calculation as original lines 333-341), Contact card (email/phone/city + Call/Message quick actions — `tel:`/`mailto:` links).

- [ ] **Step 3: Write the tab bar and dispatch** — 8 tabs always rendered (Overview, Equipment, Jobs, Agreements, Projects, Reviews, Activity, AI & IoT), Jobs tab keeps its live-count badge (sourced from a lightweight `useJobs({ customerId, limit: 1 })` count-only query in the orchestrator, or lift the full `customerJobsQuery` back to the orchestrator and pass the list down to `JobsTab` as a prop instead of having `JobsTab` self-fetch — **prefer lifting it to the orchestrator** to avoid a double-fetch of the same data for the tab-bar badge and the tab content; revise Task 4's `JobsTab` props to `{ customerId, quotes, invoices, jobs, jobsFetching, onNewJob }` instead of self-fetching, and remove the "self-fetches" line from Task 4 accordingly before implementing it).

- [ ] **Step 4: Wire tab content dispatch** to the 8 tab components with their required props (per each task above), replacing the giant inline conditional JSX blocks.

- [ ] **Step 5: Type-check.** Run: `pnpm --filter admin-dashboard build`. Resolve every prop-mismatch between the orchestrator and its tab children now that both sides exist.

- [ ] **Step 6: Full manual walkthrough** (do not skip — this is the integration point for all 9 prior tasks): open a customer's detail modal from `Customers.tsx`. For each of the 8 tabs, verify every action from that task's "Preserve exactly" list still works, plus: Edit toggle enables/disables editing across Overview/Equipment tabs simultaneously; Save persists profile+addresses+equipment together and shows the 2s "Saved" state; Cancel discards edits; closing and reopening the modal resets to a clean state; the Jobs-tab count badge updates after creating a new job via "New job"; the two behavior fixes (Add Address doesn't force edit mode; Projects tab is always present with an empty state when there are no projects) both hold.

- [ ] **Step 7: Commit.** `git add apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx && git commit -m "feat: rebuild CustomerDetailsSidebar as orchestrator over 8 extracted tabs"`

---

## Final Verification

- [ ] **Step 1: Full type-check.** Run: `pnpm --filter admin-dashboard build`. Expected: succeeds with no errors.
- [ ] **Step 2: Full regression walkthrough** repeating Task 10 Step 6's checklist once more end-to-end, plus opening the sidebar from every place it's currently opened from in the app (search `CustomerDetailsSidebar` usages — at minimum `Customers.tsx`; check for others via `grep -rn "CustomerDetailsSidebar" apps/admin-dashboard/src`) to confirm the unchanged public prop contract (`person`, `isOpen`, `onClose`, `onBack?`, `initialTab?`) still works from each call site.
- [ ] **Step 3: Final commit check.** `git log --oneline -12 && git status` — expect 10 feature commits from this plan, clean working tree.
