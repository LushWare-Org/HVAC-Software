# Manual Testing Guide — Service Agreements + Day Planner

**Date:** 2026-07-03 · **Environment:** production (https://tscrm-demo-admin.web.app / https://tscrm-demo-customer.web.app)

> ⚠️ The latest Day Planner UI fixes (dispatch sync, bigger work queues, map view memory, bigger outreach modal) are **built but NOT deployed yet** — say "deploy" when you want them live. Everything in the Agreements sections is already live.

## Logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@tsbrothers.com | Admin@2024! |
| Dispatcher | mike@tsbrothers.com | Dispatch@2024! |

Customer portal demo customers don't have portal logins seeded — the confirm-link flow (Test 3) works without login.

## Seeded data snapshot (July 3)

**Agreements (Admin → Agreements):**

| Agreement | Customer | Status | Visits | Next service | Tests |
|---|---|---|---|---|---|
| Residential comfort plan | John Smith | ACTIVE | 1/4 | **Jul 7** | cron auto-job (inside 7-day lead window) |
| Chiller Maintenance | Marcus Lee | ACTIVE | 3/4 | **Jul 5** | Day Planner opportunity + cron |
| Filter Replacement | Nina Patel | ACTIVE | 1/2 | **Jul 6** | Day Planner opportunity |
| Clinic HVAC Compliance | Priya Shah | ACTIVE | **11/12** | Jul 9 | visit exhaustion → PENDING_RENEWAL |
| Commercial priority | Sarah Williams | ACTIVE | 5/12 | Jul 15 | ordinary active plan |
| Hotel multi-system | Camila Torres | ACTIVE | 9/∞ | Jul 23 | unlimited visits |
| Office park plan | Grace Morgan | ACTIVE | 2/4 | Jul 21, **ends Jul 28** | renewal-reminder email |
| Premium Residential | Liam Anderson | **PENDING_RENEWAL** | 4/4 | — | Renew button |
| Sent maintenance agreement | Noah Kim | **SENT** | 0/2 | Jul 17 | confirm-by-link |
| Draft seasonal proposal | Olivia Garcia | **DRAFT** | 0/4 | Jul 13 | edit + Send flow |
| + EXPIRED ×2, CANCELLED ×1 | | | | | status filters |

**Jobs for tomorrow (Jul 4), Austin TX area:** 6 regular (4 assigned to Mike Chen / Carlos Rivera, 2 unassigned) + 2 agreement jobs (1 assigned to Sarah Taylor, 1 unassigned). Techs Mike Chen, Sarah Taylor, James Wilson, Carlos Rivera are pinned on the map.

---

## Test 1 — Agreements page basics (5 min)

1. Log in as admin → **Agreements** in the sidebar.
2. ✅ KPI cards show totals; table lists 13 agreements.
3. Click through the status filter pills (Active / Draft / Sent / Pending renewal / Expired / Cancelled) — ✅ counts match the table above.
4. Click any row → drawer opens with pricing, schedule, visit meter (pips), next service date.
5. Open **Customers → John Smith → Agreements tab** — ✅ shows his real agreements (no more mock data).

## Test 2 — Create → Send → lifecycle (10 min)

1. Agreements → **New Agreement**. Search a customer (e.g. "Hannah"), set: name, service type "AC Tune-Up", interval Quarterly, 4 visits, billing $200/quarter, start today, next service ~2 weeks out.
2. Save → ✅ appears as DRAFT.
3. Open it → **Send** → ✅ status flips to SENT, customer gets a confirmation email (check the inbox if the customer email is real; demo emails won't deliver).
4. Edit the DRAFT "Draft seasonal proposal" (Olivia Garcia) the same way if you prefer a pre-made one.

## Test 3 — Customer confirmation via email link (2 min)

1. Open (no login needed):
   `https://tscrm-demo-customer.web.app/agreements/confirm/demo-confirm-nkim-2026`
2. ✅ Page shows Noah Kim's "Seasonal Tune-Up" plan details with a confirm button.
3. Confirm → ✅ success screen; in admin, agreement is now **ACTIVE** with "Customer confirmed" timestamp.
4. Reload the link → ✅ token is one-time; it should say already confirmed / invalid.

## Test 4 — Amendment trail on an active plan (5 min)

1. Open an ACTIVE agreement (e.g. Sarah Williams') → **Edit** → change billing amount (e.g. $399 → $425).
2. Save → ✅ drawer shows an **Amendments** entry (old → new value, who, when) and the customer is emailed a re-confirmation.

## Test 5 — Auto job creation (cron) (observe)

- The cron runs on service start and every 12 h. It already created jobs for the two agreements inside their lead window — after reseed it will recreate them on the next cycle.
- ✅ Check **Jobs** page for jobs tagged **Agreement** (green chip) titled per the agreement service type, dated to the agreement's `nextServiceDate`.
- ✅ Duplicate-safety: the cron never creates a second job while one is still open for the same agreement.

## Test 6 — Visit recording on completion (5 min)

1. Jobs → filter by the green **Agreement** chip → open JOB-2026-0076 (John Smith, assigned to Sarah Taylor).
2. Walk its status to **COMPLETED**.
3. Open Agreements → Residential comfort plan → ✅ visits now **2/4**, `lastServiceDate` = today, `nextServiceDate` advanced ~3 months (quarterly).
4. Exhaustion case: complete a job for **Clinic HVAC Compliance** (11/12) → ✅ flips to **PENDING_RENEWAL** after the 12th visit.

## Test 7 — Renewal (3 min)

1. Agreements → filter **Pending renewal** → open Liam Anderson's Premium Residential Care.
2. **Renew** → ✅ a new DRAFT clone appears (dates shifted forward, visits reset 0/4), original marked **RENEWED**.
3. Send + confirm the clone like Test 2/3.

## Test 8 — Day Planner (after the pending deploy)

1. **Day Planner** → date defaults to Tomorrow (Jul 4).
2. ✅ Map shows Austin: solid blue (assigned), hollow grey (unassigned), solid green (agreement, assigned), hollow green (agreement, unassigned), tech initials markers.
3. ✅ Right rail: technician timelines, busy techs on top, list scrolls.
4. ✅ Below the map: two large work-queue cards — **Unassigned this day** (2 jobs + 1 agreement job) and **Pull-forward opportunities** (Marcus Lee Jul 5, Nina Patel Jul 6 — due-in chips, plan value, address).
5. **Map memory:** zoom into downtown Austin → go to Jobs page → come back → ✅ map is where you left it.
6. **Single assign:** click a hollow pin or an Unassigned card → pick a tech + time → Assign → ✅ toast, pin turns solid.
7. **Dispatch sync (the big fix):** open **Dispatch** → ✅ the job you just assigned shows under active/assigned with the right tech — no longer stuck in "unassigned". The tech also gets a push notification if their device is registered.
8. **Auto-schedule:** back in Day Planner → **Auto-schedule day** → ✅ preview table (job / tech / time / travel leg) → Apply → ✅ all assigned; verify Dispatch again.
9. **Outreach:** in Pull-forward opportunities → "Offer tomorrow to Marcus" → ✅ big readable modal, editable message, recipient line → Send → ✅ thread appears in **Communications**.

## Test 9 — Customer portal "My Plans" (2 min)

- Portal → **My Plans** (needs a customer login; register a customer or use an existing one linked to agreements) → ✅ lists their plans with status, next service date, visit usage.

## Known limitations (by design, for now)

- Emails to fake demo addresses won't deliver — watch statuses/timestamps instead.
- Billing notifications notify the admin; no auto-invoicing.
- Phase 4 (drag-to-reschedule with customer approval, emergency insertion) is designed but not built.
