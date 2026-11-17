# Scheduling & Service Agreements — Massive Upgrade Plan

> **Status:** Design approved, ready for implementation  
> **Impact:** Core productivity upgrade — agreements, auto-scheduling, day planner, route intelligence  
> **UI/UX note:** All frontend work must use the `/frontend-design` skill before implementation

---

## Overview

Three interconnected systems that feed each other:

```
Service Agreements
      ↓ auto-generates
Recurring Maintenance Jobs (tagged, filterable)
      ↓ feeds into
Day Planner (intelligent route building for any date)
      ↓ triggers
Proactive Outreach (shift nearby jobs, fill routes efficiently)
```

---

## Part 1 — Service Agreements (enhanced)

### What exists today
`ServiceAgreement` model has: name, status (DRAFT/SENT/ACTIVE/EXPIRED/CANCELLED), start/end date, value, billing cycle, auto-renew flag, document URL.

**Missing everything needed for real use.** Needs a full redesign of the schema + UI.

### Decisions confirmed
- Linked to **Customer** (not equipment for now — equipment can be referenced in notes/description)
- One customer can have **multiple agreements** (different service types, equipment, terms)
- **Total freedom** — company decides the structure, no rigid constraints
- Billing: **notify admin** when billing date hits (no auto-invoice yet)
- Customer acceptance: **click to confirm** in portal or email link
- Renewal: admin-initiated, customer notified

### New schema fields to add to `ServiceAgreement`

```prisma
model ServiceAgreement {
  // --- existing fields kept ---
  id          String   @id @default(uuid())
  companyId   String
  customerId  String
  name        String
  description String?  // rich text — full terms, scope of work
  status      AgreementStatus @default(DRAFT)
  startDate   DateTime
  endDate     DateTime?
  signedAt    DateTime?
  signedByName String?
  documentUrl  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // --- NEW: pricing ---
  totalValue      Decimal?  @db.Decimal(10, 2)  // e.g. $1,200
  billingCycle    String?   // UPFRONT, MONTHLY, QUARTERLY, ANNUAL
  billingAmount   Decimal?  @db.Decimal(10, 2)  // auto-calc or manual
  nextBillingDate DateTime?

  // --- NEW: service schedule ---
  serviceType         String?   // free text — "AC Maintenance", "Filter Replacement", etc.
  serviceInterval     String?   // MONTHLY, BI_MONTHLY, QUARTERLY, BI_ANNUAL, ANNUAL, CUSTOM
  serviceIntervalDays Int?      // for CUSTOM interval
  visitsIncluded      Int?      // total visits in the agreement period
  visitsUsed          Int       @default(0)
  lastServiceDate     DateTime?
  nextServiceDate     DateTime? // auto-calculated

  // --- NEW: auto job creation ---
  autoCreateJobs   Boolean @default(true)
  leadDays         Int     @default(7)  // create job X days before nextServiceDate
  jobTemplateId    String? // optional: auto-apply a checklist template

  // --- NEW: customer confirmation ---
  customerConfirmedAt DateTime?
  autoRenew           Boolean   @default(false)
  renewalReminderSent Boolean   @default(false)

  // --- relations ---
  jobs  Job[]  // jobs auto-created from this agreement
}

enum AgreementStatus {
  DRAFT
  SENT          // emailed to customer for review
  ACTIVE        // customer confirmed
  PENDING_RENEWAL
  RENEWED
  EXPIRED
  CANCELLED
}
```

### Agreement versioning / amendment
When terms are edited on an ACTIVE agreement, create an `AgreementAmendment` record (snapshots old values) and notify the customer. Customer re-confirms via email link or portal.

```prisma
model AgreementAmendment {
  id            String   @id @default(uuid())
  agreementId   String
  changedFields Json     // snapshot of what changed
  changedBy     String   // user ID
  customerNotifiedAt DateTime?
  customerConfirmedAt DateTime?
  createdAt     DateTime @default(now())
}
```

### Job schema — add agreement link

```prisma
// In jobs schema — add to Job model:
agreementId  String?  // null for regular jobs
isAgreementJob Boolean @default(false)
```

---

## Part 2 — Auto Job Creation

### How it works

A BullMQ cron job runs **daily at 6:00 AM** (per company timezone):

```
1. Find all ACTIVE agreements where:
   - autoCreateJobs = true
   - nextServiceDate <= today + leadDays
   - visitsUsed < visitsIncluded (or visitsIncluded is null = unlimited)
   - No pending/scheduled job already exists for this agreement

2. For each matching agreement:
   - Create Job (status: PENDING, isAgreementJob: true, agreementId linked)
   - Tag job with "agreement-service" + service type
   - Set job title: "[ServiceType] — Agreement Service"
   - Apply jobTemplate if set

3. Notify dispatchers:
   - In-app: "5 agreement service jobs auto-created for this week"
   - Email digest to company_admin/office_manager: list of created jobs

4. When Job is marked COMPLETED:
   - Update agreement.lastServiceDate = today
   - Recalculate agreement.nextServiceDate = lastServiceDate + interval
   - Increment agreement.visitsUsed
   - If visitsUsed >= visitsIncluded AND !autoRenew → move to PENDING_RENEWAL
```

### Renewal flow

```
60 days before endDate → email customer "Your plan renews soon"
30 days before         → second reminder + admin alert
7 days before          → urgent reminder
On expiry              → status = EXPIRED, no more auto-jobs
Admin clicks "Renew"   → new agreement pre-filled with same terms, status DRAFT
                       → email to customer with link to review + confirm
Customer confirms      → status ACTIVE, new cycle begins
```

---

## Part 3 — Day Planner (new page)

### Purpose
Replace the one-at-a-time job scheduling with a **full-day view** where dispatchers can see all pending jobs for any date, assign them in bulk, and optimize routes geographically.

### Page structure

```
[Day Planner]
┌─────────────────────────────────────────────────────────────┐
│ Date: [Tomorrow ▼]  [← Prev]  [Next →]   [Auto-Schedule Day]│
├──────────────────────────────────┬──────────────────────────┤
│                                  │  TECHNICIANS             │
│         MAP                      │  ┌──────────────────┐   │
│                                  │  │ 🔵 Alex P.  3 jobs│   │
│  🔵 = confirmed job              │  │ ████░░░░░░  8am-5pm│  │
│  🟢 = agreement job (due soon)   │  ├──────────────────┤   │
│  🟡 = nearby opportunity         │  │ 🔵 Sam K.  2 jobs │   │
│  🔴 = emergency                  │  │ ████░░░░░░  8am-5pm│  │
│                                  │  └──────────────────┘   │
│                                  │                          │
│                                  │  UNASSIGNED (4)          │
│                                  │  [Job card] drag →       │
│                                  │  [Job card] drag →       │
└──────────────────────────────────┴──────────────────────────┘
```

### Map pin types

| Color | Meaning |
|-------|---------|
| Blue | Confirmed job for selected date |
| Green | Agreement service job (auto-created, due within lead window) |
| Amber | Agreement job due within 5 days — shiftable to this date |
| Red | Emergency / urgent |
| Grey | Unassigned pending job |

### Auto-Schedule Day button

When clicked:
1. Groups all unassigned jobs for that date by geographic cluster
2. Assigns each cluster to the nearest available tech
3. Orders jobs within each tech's day by proximity (nearest-neighbour)
4. Sets estimated time slots: job 1 at 8am, each subsequent = prev end time + travel time estimate
5. Shows dispatcher a preview: "Proposed schedule — 4 techs, 11 jobs. Accept or adjust?"
6. Dispatcher can drag to swap before confirming

### Job duration

Dispatcher sets duration when creating/editing a job (e.g., "2 hours"). Day planner uses this for timeline slots. Default: 1.5 hours if not set.

### Proactive outreach from Day Planner

When dispatcher clicks an amber pin (nearby agreement job):
- Modal: "This customer has a service due on [date]. Offer to bring it forward to tomorrow?"
- Click "Send message" → SMS + email to customer:
  *"Hi [Name], our team will be in [Area] tomorrow. We can fit in your [service] — would that work for you? Reply YES to confirm or ignore to keep your current date of [date]."*
- Customer confirms → job moves to selected date, pin turns blue
- Customer declines / no reply → stays on original date
- Dispatcher can mark "no outreach" to skip

---

## Part 4 — Flexible Real-World Rescheduling

### Visual timeline per tech

On Dispatch Board AND Day Planner — each tech has a horizontal 8am–5pm bar:
- Job blocks shown in proportion to duration
- Travel time shown as a gap between blocks (estimated based on distance)
- Drag a job block to a new time → "Send reschedule notification to customer?"
- Drag to a different tech's row → reassigns

### Job schedule status (two modes)

| Status | Meaning |
|--------|---------|
| SOFT_SCHEDULED | Tentative — can be shifted by dispatcher freely |
| CONFIRMED | Customer has acknowledged the time — needs approval to move |

### Reschedule with customer approval

1. Dispatcher clicks "Reschedule" on a job
2. Picks new date/time
3. System sends SMS + email to customer:
   *"We need to reschedule your [service] from [old time] to [new time]. Click confirm: [link] or call us."*
4. Job shows "PENDING RESCHEDULE" badge
5. Customer confirms → status = CONFIRMED, tech notified
6. Customer declines → dispatcher gets alert: "Customer declined reschedule for Job #123"
7. Dispatcher can: hold at original time OR pick another slot OR override

**Dispatcher hold option**: when sending reschedule, dispatcher chooses:
- "Hold job at current time until customer responds" 
- "Move job now, adjust if customer declines"

### Emergency insertion

1. Emergency job comes in
2. Dispatcher clicks "Insert Emergency" → runs scoring algorithm
3. Shows: *"Best match: Alex P. (2.1km away). Inserting will push his 2pm Kandy job by ~2.5 hours. Notify customer?"*
4. Dispatcher confirms → emergency inserted, affected job shifted, reschedule SMS auto-sent to bumped customer
5. Dispatcher sees full cascade in the timeline before confirming

---

## Part 5 — Customer Portal — Agreements Section

### Agreements tab in portal

```
My Service Agreements
├── Daikin AC — Annual Care Plan
│   ├── Status: ACTIVE  |  Valid until: Dec 2026
│   ├── Service: AC Full Service (Quarterly — 4 visits/year)
│   ├── Visits: ██░░ 2 of 4 used  |  Next: 15 Aug 2026
│   ├── Price: $1,200/year (paid upfront)
│   ├── [View History]  [Download Contract]  [Request Change]
│
└── Hot Water System — Service Plan
    ├── Status: PENDING_RENEWAL — expires in 30 days
    ├── [Renew Now]
```

### Email notifications to customers

| Trigger | Email sent |
|---------|-----------|
| Agreement created | "Review your service plan" + link to portal to confirm |
| Customer confirms | "Your plan is active — here's what's included" |
| Job auto-scheduled from agreement | "Your next service is booked for [date]" |
| Reschedule request | "We need to move your [date] visit — tap to confirm new time" |
| Reschedule confirmed | "Got it — your service is now on [new date]" |
| Visit completed | "Service completed — here's your service report" |
| Agreement renewal (60/30/7 days) | "Your plan renews on [date]" |
| Agreement expired | "Your plan has expired — renew to continue priority service" |
| Billing date | "Upcoming payment: $[amount] on [date]" (notify only — not auto-charged) |
| Monthly summary | "Your service plan update — [month]" |

---

## Implementation Phases

### Phase 1 — Service Agreements (3 weeks)

**Backend (crm-service):**
- Schema migration: add all new fields to `ServiceAgreement`
- Add `AgreementAmendment` model
- Add `agreementId` + `isAgreementJob` to Job model (jobs schema migration)
- CRUD endpoints: create, edit, send to customer, confirm, renew, cancel
- Amendment endpoint: patch terms → snapshot → notify customer
- Billing date notification endpoint

**Frontend (admin-dashboard) — use `/frontend-design`:**
- Full agreement editor modal (all fields, flexible structure)
- Agreement list on customer detail sidebar (with status badges)
- Agreements section in main nav or under Customers
- Agreement detail: terms, billing, schedule, visit history, linked jobs

**Frontend (customer-portal) — use `/frontend-design`:**
- "My Agreements" tab with all plan cards
- Per-agreement: visit history, next scheduled, download PDF
- Confirm link page (for email → portal flow)
- Renewal flow

**Comms:**
- Email templates: agreement sent, confirmed, amended, renewal reminders, monthly summary

---

### Phase 2 — Auto Job Creation (1 week)

**Backend (crm-service):**
- BullMQ daily cron: scan agreements, create jobs, update nextServiceDate
- Job completion webhook → update lastServiceDate, visitsUsed, nextServiceDate
- Pending renewal detection → trigger renewal reminder emails

**Frontend (admin-dashboard):**
- Agreement jobs visible in Jobs list with "AGREEMENT" tag filter
- Dispatcher notification banner: "X agreement jobs created this week"
- Agreement jobs on Dispatch Board map (green pins)

---

### Phase 3 — Day Planner (2 weeks)

**Frontend (admin-dashboard) — use `/frontend-design`:**
- New "Day Planner" nav item (between Jobs and Dispatch)
- Date picker, map with colour-coded pins, tech timeline bars
- Auto-Schedule Day algorithm (route optimization)
- Proactive outreach modal (amber pins → send customer message)
- Drag-to-assign from unassigned list to tech timeline

**Backend (scheduling-service):**
- New endpoint: `GET /schedule/day?date=&companyId=` — returns all jobs + agreement opportunities for a date
- Route optimization endpoint: given jobs + tech locations → returns ordered assignment plan
- Opportunity scan: finds agreement jobs within X km of confirmed jobs for a date

---

### Phase 4 — Flexible Rescheduling (1 week)

**Backend (job-service):**
- Add `scheduleStatus: SOFT_SCHEDULED | CONFIRMED` to Job
- Add `estimatedDurationMinutes` to Job
- Reschedule endpoint: `PATCH /jobs/:id/reschedule` → sends customer notification, sets PENDING_RESCHEDULE

**Frontend (admin-dashboard) — use `/frontend-design`:**
- Tech timeline view on Dispatch Board (drag-to-reschedule)
- Reschedule modal: new date/time + "hold or move" option
- Emergency insertion modal with cascade preview
- PENDING_RESCHEDULE badge on job cards

---

## Data flow summary

```
Agreement ACTIVE
    │
    ▼ (daily cron)
Job created (isAgreementJob=true, PENDING)
    │
    ▼ (Day Planner)
Dispatcher assigns to tech + sets date/time
    │
    ▼
Job status → SCHEDULED (SOFT or CONFIRMED)
    │
    ▼ (day of)
Tech marks EN_ROUTE → ON_SITE → COMPLETED
    │
    ▼
Agreement updated: lastServiceDate, visitsUsed++, nextServiceDate recalculated
    │
    ▼ (if visitsUsed >= visitsIncluded)
Agreement → PENDING_RENEWAL → renewal email flow
```

---

## Key design principles

- **Freedom first**: No rigid agreement structure forced on the company. All fields optional except customer + name + status.
- **Email-first communication**: Every significant event emails the customer because they're not always watching the portal.
- **Non-breaking**: All new fields are additive. Existing jobs and agreements continue to work unchanged.
- **Dispatcher always in control**: Auto-scheduling suggests, never forces. All auto-created jobs are PENDING until dispatcher confirms.
- **Frontend-design skill**: Must be invoked for Day Planner, Agreement editor, Portal agreements tab, Timeline view, and all new modals.

---

*Created: 2026-07-02 | Branch: feat/marketing*
