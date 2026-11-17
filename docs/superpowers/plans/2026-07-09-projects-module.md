# Projects Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the UI-only mock Projects section with a fully working, multi-tenant Projects module per `docs/superpowers/specs/2026-07-04-projects-module-design.md` — same standard layout for KASE / Orrix / US demo, selected behind a `features.projectsLayout` flag so Orrix's future variant is a drop-in swap.

**Architecture:** crm-service owns Project + ProjectRosterDay (crm schema); job/finance services carry nullable `projectId` link columns; Go scheduling-service reads rosters cross-schema to reserve crew capacity (smart-assign exclusion + guided 409 on manual assign); admin dashboard + customer portal consume real TanStack Query hooks (mock deleted).

**Tech Stack:** NestJS + Prisma (crm/job/finance), Go 1.23 + pgx (scheduling), React 19 + TanStack Query (admin/portal), manual psql DDL on Supabase.

## Global Constraints

- **NEVER run `prisma migrate dev` on crm-service** — apply DDL via dockerized psql using `CRM_DIRECT_DATABASE_URL` (strip `?schema=crm`).
- No git commits (user commits manually). No deploys.
- Multi-tenancy: every query filters `companyId`.
- Money is Decimal-as-string in JSON — wrap in `Number()` before arithmetic; display via `formatMoney` from each frontend's `lib/format.ts`.
- Status enums UPPER_SNAKE_CASE. Pagination via `clampPagination` from `@tscrm/types`.
- Roster rule (single source of truth): effective roster for (project, date) = `[]` unless `status==='ACTIVE'`; override row → its `techUserIds` (`[]` if `isOff`); else if date ∈ `[startDate, targetEndDate]` (null bounds = open) AND weekday ∈ `workingDays` → `baseTeamUserIds`; else `[]`.
- Roster edits: date ≥ today only. Status leaving ACTIVE ⇒ effective roster empties automatically via the status gate (no data mutation needed).
- Portal endpoints for role=CUSTOMER must scope by `customerId` claim server-side.

---

### Task 1: crm DDL + Prisma models

**Files:**
- Modify: `apps/crm-service/prisma/schema.prisma` (add Project, ProjectRosterDay; add `projectId String?` to ServiceAgreement)
- DDL via psql (docker run --rm postgres:16), then `pnpm --filter crm-service exec prisma generate`

**DDL (crm + jobs + finance schemas in one pass):**
```sql
CREATE TABLE IF NOT EXISTS crm.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'PLANNING',
  "startDate" TIMESTAMP(3),
  "targetEndDate" TIMESTAMP(3),
  budget DECIMAL(12,2),
  "requiredHeadcount" INTEGER,
  "siteAddress" TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  "workingDays" TEXT[] NOT NULL DEFAULT ARRAY['MON','TUE','WED','THU','FRI','SAT'],
  "baseTeamUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS projects_company_status_idx ON crm.projects("companyId", status);
CREATE INDEX IF NOT EXISTS projects_company_customer_idx ON crm.projects("companyId", "customerId");

CREATE TABLE IF NOT EXISTS crm.project_roster_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL REFERENCES crm.projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  "techUserIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isOff" BOOLEAN NOT NULL DEFAULT FALSE,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("projectId", date)
);
CREATE INDEX IF NOT EXISTS roster_company_date_idx ON crm.project_roster_days("companyId", date);

ALTER TABLE crm.service_agreements ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE jobs.jobs ADD COLUMN IF NOT EXISTS "projectId" TEXT;
CREATE INDEX IF NOT EXISTS jobs_project_idx ON jobs.jobs("companyId", "projectId");
ALTER TABLE finance.quotes ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE finance.invoices ADD COLUMN IF NOT EXISTS "projectId" TEXT;
```
(Verify actual finance/jobs column-name convention — quoted camelCase vs snake — by inspecting each schema.prisma `@map`/naming before running; adjust DDL to match.)

- [ ] Add Prisma models mirroring spec + `projectId String?` on ServiceAgreement (and Quote/Invoice/Job in their services' schemas — Task 3/4)
- [ ] Run DDL, verify with `\d crm.projects`
- [ ] `prisma generate`; `pnpm --filter crm-service build` green

### Task 2: crm projects module (service + controller + tests)

**Files:**
- Create: `apps/crm-service/src/projects/projects.service.ts`, `projects.controller.ts`, `projects.module.ts`, `roster.util.ts`, `projects.service.spec.ts`, `roster.util.spec.ts`
- Modify: `apps/crm-service/src/app.module.ts` (register ProjectsModule)

**Interfaces (produces):**
- `effectiveRoster(project: {status,startDate,targetEndDate,workingDays,baseTeamUserIds}, date: string /*YYYY-MM-DD*/, override?: {techUserIds,isOff}): string[]` in `roster.util.ts` (pure, unit-tested)
- Endpoints:
  - `GET /projects?status=&customerId=&search=&page=&limit=` → `{ data, total, page, limit }`
  - `POST /projects` (CreateProjectDto: customerId, name required; rest optional)
  - `GET /projects/rosters?date=YYYY-MM-DD` → `[{ projectId, name, siteAddress, latitude, longitude, requiredHeadcount, techUserIds, isOverride, isOff }]` (ACTIVE projects with roster or working-day match that date) — **route must be declared BEFORE `/projects/:id`**
  - `GET /projects/mine` (role CUSTOMER; scope customerId claim) — BEFORE `:id`
  - `GET /projects/:id` (includes linked agreement ids)
  - `PATCH /projects/:id` · `DELETE /projects/:id` (→ status CANCELLED)
  - `GET /projects/:id/roster?from=&to=` → `[{ date, techUserIds, isOverride, isOff }]`
  - `PUT /projects/:id/roster/:date` `{ techUserIds?, isOff?, reset? }` (reject past dates: 400)
  - `POST /projects/:id/agreements/:agreementId` + `DELETE` (link/unlink: sets service_agreements.projectId)
- RBAC: write = company_admin/office_manager/dispatcher/super_admin; read = any staff; `/projects/mine` customer.

**Tests (Jest, mock prisma):** roster.util — 6 cases (default weekday, override, isOff, outside range, wrong weekday, non-ACTIVE). service — CRUD companyId scoping, past-date roster 400, mine customer scoping.

- [ ] Write roster.util + failing spec → pass
- [ ] Service + controller + module; register; specs pass; build green

### Task 3: job-service projectId

**Files:** `apps/job-service/prisma/schema.prisma` (Job.projectId String?), `src/jobs/dto/*` (create/update accept optional `@IsOptional() @IsString() projectId`), jobs service list filter `?projectId=`, prisma generate. Also crm `agreements.cron.ts` createJob payload: include `projectId` from agreement row.
**Test:** extend existing jobs spec — create with projectId persists; list filter works (mocked).

### Task 4: finance-service projectId

**Files:** `apps/finance-service/prisma/schema.prisma` (Quote.projectId, Invoice.projectId), create DTOs accept it, list endpoints filter `?projectId=`, quote→invoice conversion copies projectId. prisma generate, build, extend one spec each.

### Task 5: Go scheduling roster enforcement

**Files:**
- Create: `apps/scheduling-service/internal/repository/project_roster_repo.go` — `RosteredTechUserIDs(ctx, companyID, date string) (map[string]RosterInfo, error)` where `RosterInfo{ProjectID, ProjectName string}`; SQL joins `crm.projects` (ACTIVE, date-window, weekday in workingDays) LEFT JOIN `crm.project_roster_days` override; unnests effective userIds per Global-Constraints rule (SQL CASE: override present → its ids unless isOff; else base ids when weekday matches).
- Create: `apps/scheduling-service/internal/service/roster_gate_test.go`
- Modify: `assignment_service.go` — in Assign (smart): after FindCandidatesNearby, drop candidates whose userId ∈ rostered map **unless job.projectId == that project id**. In ManualAssign: same check → return typed error carrying `{code:"TECH_ON_PROJECT", projectId, projectName, date}`; `dispatch_handler.go` maps it to HTTP 409 JSON.
- Job's projectId: extend the existing cross-schema job fetch in scheduling (find where job lat/lng/scheduledStart is read from jobs.jobs) to also select `"projectId"`.

**Test:** `go test ./...` — gate unit tests with stubbed repo (candidate excluded, manual 409, project-job exempt, date without roster no-op).

### Task 6: admin dashboard wiring

**Files:**
- Create: `apps/admin-dashboard/src/hooks/useProjects.ts` — useProjects(filters), useProject(id), useCreateProject, useUpdateProject, useDeleteProject, useProjectRoster(id,from,to), useSetRosterDay(id), useRostersByDate(date), useLinkAgreement/useUnlinkAgreement. Types mirror mock shapes (ProjectStatus, Weekday, etc. move to `src/types/projects.ts`).
- Modify: `pages/projects/Projects.tsx`, `ProjectDetail.tsx`, `ProjectEditorModal.tsx`, `ProjectsTodayBand.tsx`, `shared.tsx` — swap mock store for hooks; jobs/quotes/invoices tabs use `?projectId=` queries; финanc roll-up computed client-side with `Number()`.
- Delete: `pages/projects/projectsMock.ts`
- Modify: `pages/planner/DayPlanner.tsx` (band uses useRostersByDate; rostered techs locked in rail), `pages/dispatch/DispatchBoard.tsx` (manual-assign 409 TECH_ON_PROJECT handler → guided message; rostered techs dimmed "On {project}"), `pages/jobs/JobDetailModal.tsx` (project chip when job.projectId), `pages/customers/CustomerDetailsSidebar.tsx` (Projects section when ≥1).
- Tenant variant switch: `pages/projects/index.tsx` route component reads `useCompanySettings().data?.features` → `projectsLayout` key (default `'standard'`) and renders the standard components; unknown value falls back to standard. App.tsx routes point at this gate.
**Verify:** `pnpm --filter admin-dashboard build` green.

### Task 7: customer portal My Projects

**Files:**
- Create: `apps/customer-portal/src/hooks/useMyProjects.ts` (GET /crm/projects/mine), `src/pages/MyProjects.tsx` (list + detail-lite: status, progress from linked jobs, dates, invoiced/paid summary via `?projectId=` finance queries)
- Modify: portal `Sidebar.tsx` (entry only when ≥1 project), router in `App.tsx`/main.
**Verify:** portal build green.

### Task 8: full verification

- [ ] `pnpm --filter crm-service test` · `--filter job-service test` · `--filter finance-service test` all green
- [ ] `cd apps/scheduling-service && go build ./... && go test ./...` green
- [ ] admin + portal builds green
- [ ] Live smoke against local stack (demo tenant): create project via API → set roster override → `GET /projects/rosters?date=` shows crew → create job linked to project → verify smart-assign excludes rostered tech (candidates endpoint) and manual assign 409s → portal `/projects/mine` scoped.
- [ ] Update memory + report. NO commits/deploys.
