# Projects Module — Design Spec

**Date:** 2026-07-04 · **Status:** brainstormed + approved in chat (pending final spec review)

## What a Project is

A long-running engagement for one customer — weeks/months of work with a
dedicated (but day-adjustable) technician crew. Examples that shaped the design:

- **Lotus Tower HVAC contract** — one commercial customer, a crew on site every
  working day for months, discrete billable jobs created along the way.
- **Housing scheme** — installations (jobs) plus recurring maintenance handled
  by *linked service agreements* (Projects do NOT reimplement recurrence).

A project is **not a job**. Its unit of daily planning is the **crew roster**:
which technicians belong to this project on a specific date. A rostered
technician is **reserved capacity** — invisible to all normal job scheduling
and assignment for that date.

## Decisions made in brainstorming

| Decision | Choice |
|---|---|
| Recurring work | Link existing Agreements; agreement-generated jobs inherit the project. No project-native recurrence. |
| Behavioral "project types" | Rejected — one composable container; free-text `category` for reporting only. |
| Team semantics | Base team on the project + per-day roster overrides. Rostered techs are hard-blocked from other work that day (guided unblock, no silent override). |
| Working days | Per-project setting (default Mon–Sat); days outside it have no roster unless overridden. |
| Site | Picked on a map (MapPickerLazy) — address + lat/lng; distinct project pin on planner/dispatch maps. |
| Headcount | `requiredHeadcount` setting per project → "4/5 — one short" signals. |
| Phase 1 scope | Core container + financial roll-up + customer portal view + Day Planner roster UX. Milestones/phases and per-unit sites deferred. |
| Placement | Backend: crm-service (next to Agreements). UI: top-level "Projects" nav after Jobs. |

## Data model (crm schema, Prisma)

```prisma
model Project {
  id              String    @id @default(uuid())
  companyId       String
  customerId      String
  name            String
  description     String?
  category        String?              // free text, reporting only
  status          String    @default("PLANNING") // PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  startDate       DateTime?
  targetEndDate   DateTime?
  budget          Decimal?  @db.Decimal(12, 2)   // dollars, serialized as string
  requiredHeadcount Int?
  siteAddress     String?
  latitude        Float?
  longitude       Float?
  workingDays     String[]  @default(["MON","TUE","WED","THU","FRI","SAT"])
  baseTeamUserIds String[]  @default([])          // crm CompanyUser ids
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  rosterDays      ProjectRosterDay[]
  @@index([companyId, status])
  @@index([companyId, customerId])
  @@map("projects")
}

// Stored ONLY for dates that differ from the default roster.
// techUserIds is the complete effective crew for that date (frozen snapshot —
// later base-team edits don't rewrite overridden days). isOff=true → no work.
model ProjectRosterDay {
  id          String   @id @default(uuid())
  companyId   String
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  date        DateTime @db.Date
  techUserIds String[] @default([])
  isOff       Boolean  @default(false)
  updatedBy   String?
  updatedAt   DateTime @updatedAt
  @@unique([projectId, date])
  @@index([companyId, date])
  @@map("project_roster_days")
}
```

**Effective roster for (project, date):** empty unless status is ACTIVE.
For an ACTIVE project: override row exists → its `techUserIds` (empty if
`isOff`) · else if date within `[startDate, targetEndDate]` and weekday ∈
`workingDays` → `baseTeamUserIds` · else empty.

**Links (nullable `projectId` columns, added via manual `ALTER TABLE` — never
`prisma migrate dev` on this DB):** `jobs.jobs`, `finance.quotes`,
`finance.invoices`, `crm.service_agreements`. The agreement auto-job cron
copies the agreement's `projectId` onto jobs it creates.

## APIs

**crm-service `projects` module** (RBAC: admin/office_manager/dispatcher write, staff read)
- `GET /projects` (filters: status, customerId, search) · `POST /projects` ·
  `GET /projects/:id` · `PATCH /projects/:id` · `DELETE /projects/:id` (soft →
  CANCELLED unless empty)
- `GET /projects/:id/roster?from=&to=` → per-date effective roster + isOverride flag
- `PUT /projects/:id/roster/:date` `{ techUserIds?, isOff?, reset? }` — set
  override / mark day off / reset to default
- `GET /projects/rosters?date=` → all projects with a non-empty roster that day
  (Day Planner band; includes name, site, headcount, roster, requiredHeadcount)
- `GET /customers/:id/projects` → for the customer sidebar section
- `GET /projects/mine` (role=CUSTOMER, scoped by customerId claim) → portal

**job-service**: accept + persist `projectId` on create/update; `GET /jobs?projectId=`.
**finance-service**: accept `projectId` on quotes/invoices; filter by it.
**Financial roll-up (phase 1)**: admin/portal compute quoted/invoiced/paid sums
client-side from `?projectId=` filtered finance queries (wrap Decimal strings in
`Number()`). Move server-side to analytics later if lists grow.

**scheduling-service (Go) — enforcement**
- New repo read (cross-schema, same pattern as jobs.jobs): effective rostered
  tech userIds for a date = base teams of eligible ACTIVE projects modified by
  `crm.project_roster_days` rows.
- `FindCandidatesNearby` (smart assign) excludes rostered techs for the job's
  scheduled date.
- `ManualAssign` rejects a rostered tech with a structured 409:
  `{ code: "TECH_ON_PROJECT", projectId, projectName, date }` — clients render
  "Mike is on Lotus Tower HVAC that day — remove him from the day's roster to
  assign him" with a link/action to the roster editor.
- Jobs that themselves belong to the project are exempt from the block.

## Admin UI

- **Sidebar**: "Projects" entry after Jobs (FolderKanban icon). Topbar title map entry.
- **Projects list** (`/projects`): status filter pills + search; rows/cards show
  name, customer, status badge, progress bar (completed ÷ total linked jobs),
  crew avatars, quoted vs invoiced, dates.
- **Project detail** (`/projects/:id`): header (name, customer link, status
  changer, dates, progress) + tabs:
  - **Overview** — description, category, site map (MapPickerLazy read/edit),
    requiredHeadcount, workingDays editor, base team picker (technicians), notes.
  - **Jobs** — linked jobs with status chips; actions: create job pre-linked,
    link existing job, unlink.
  - **Agreements** — linked agreements (link/unlink); their visits auto-inherit.
  - **Finances** — quoted / invoiced / paid / outstanding cards, budget vs
    invoiced variance bar, linked quotes+invoices lists.
- **Create/edit modal**: customer select, name, dates, map site picker,
  working-day chips (SUN–SAT toggles), headcount, budget, base team multi-select.
- **Day Planner**: "Projects today" band above Unassigned — card per running
  project: name, site, avatars, `rostered/required` count (amber when short),
  inline roster editor (remove for the day · add from available techs only ·
  reset to base · mark day off). Rostered techs in the tech rail render locked:
  dimmed, "On {project}" chip, no assign targets. Map: distinct project pin
  (flag/diamond) with name + crew count.
- **Dispatch board**: rostered techs shown with the same lock treatment;
  manual-assign selects omit them (with a "on project" note); smart assign
  already excluded server-side. 409 handler shows the guided message.
- **Customer details sidebar**: "Projects" section rendered **only when the
  customer has ≥1 project**; rows link to the project page.
- **Job detail modal / jobs table**: project chip when `projectId` set →
  navigates to project.

## Customer portal

- Sidebar "My Projects" entry **only when ≥1 project** (query drives visibility).
- Project view: name, status, overall progress bar, dates; visit list (done /
  upcoming from linked jobs); payment summary (invoiced vs paid vs outstanding);
  linked maintenance schedule (next agreement visits). Read-only; token-styled
  for all three themes.
- All portal queries customer-scoped server-side (role=CUSTOMER claim).

## Non-goals (phase 2+)

Milestones/phases · per-unit site lists (housing-scheme units) · project
documents/photos · Gantt/timeline visualization · project templates ·
server-side financial roll-up endpoint · project-level chat thread.

## Error handling & rules

- Multi-tenancy: every query filtered by `companyId`.
- Roster edits allowed for any date ≥ today; past dates read-only.
- Deleting/removing a tech from base team never edits existing override days.
- Status → COMPLETED/ON_HOLD/CANCELLED empties ALL rosters (defaults and
  overrides) via the status gate in the effective-roster rule — pausing or
  closing a project instantly frees its crew.
- Money: Decimal-as-string, `Number()` before arithmetic (repo convention).

## Testing

- crm: Jest — effective-roster resolution (default day, override, off day,
  outside range, wrong weekday, non-ACTIVE), roster endpoints, customer scoping
  of `/projects/mine`.
- Go: unit tests for the rostered-tech exclusion (candidates + manual assign +
  project-job exemption) with the repo mocked/stubbed.
- job/finance: projectId accepted + filterable (existing suites extended).
- Frontends: `tsc -b` + build; manual flow test per testing guide.
