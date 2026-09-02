# Multi-technician assignment — backend foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a job carry a crew of technicians with exactly one lead, and expose
a ranked-candidates API that reports scheduling conflicts, without changing how
anything behaves for existing single-technician jobs.

**Architecture:** `scheduling.dispatch_assignments` already permits many rows per
job; this adds `is_lead`, two partial unique indexes to enforce the invariants,
and crew read/write methods. Candidate ranking reuses the existing 40/35/25
scoring but measures distance from a technician's **base** location, synced from
crm. Job-side denormalisation (`crewUserIds`, lead) is written cross-schema in
the same transaction, following the existing `SyncJobAssignment` pattern.

**Tech Stack:** Go 1.23 + Gin + pgx/v5 (scheduling-service), NestJS + Prisma
(job-service, crm-service), raw-SQL migration runner `scripts/apply-migrations.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-02-multi-technician-assignment-design.md`

## Global Constraints

- **pnpm only.** The `preinstall` hook rejects npm and yarn.
- **Multi-tenancy:** every query filters on `company_id` / `companyId`. No exceptions.
- **Money is dollars end-to-end.** Not relevant here, but do not introduce cents.
- **Status enums are UPPER_SNAKE_CASE.**
- **Migrations are idempotent.** Use `IF NOT EXISTS`; the runner re-executes safely.
- **Go tests** live beside the code as `*_test.go`, package-internal, table-free
  plain `func TestXxx(t *testing.T)` style — match `internal/service/assignment_service_test.go`.
- **Do not commit** unless the plan step says to. Never add a Claude co-author trailer.
- **Spec correction:** the spec says the crew endpoint "calls job-service to
  update `assignedToId` / `crewUserIds`". Do **not** do that. The established
  pattern is a direct cross-schema write from Go
  (`AssignmentRepository.SyncJobAssignment`, `assignment_repo.go:300`), which is
  atomic with the assignment change. Follow the existing pattern.

---

## File structure

| File | Responsibility |
|---|---|
| `scripts/apply-migrations.mjs` | append two migration entries (scheduling, jobs) |
| `apps/scheduling-service/internal/models/models.go` | `IsLead`, `BaseDistanceKm`, `BaseLocation`, crew request/response types |
| `apps/scheduling-service/internal/repository/crew_repo.go` | **new** — crew reads/writes, lead swap, cross-schema job sync |
| `apps/scheduling-service/internal/repository/conflict_repo.go` | **new** — overlapping-assignment lookup |
| `apps/scheduling-service/internal/service/crew_service.go` | **new** — crew orchestration, invariant enforcement |
| `apps/scheduling-service/internal/service/candidate_service.go` | **new** — ranked candidates with conflicts |
| `apps/scheduling-service/internal/handler/crew_handler.go` | **new** — HTTP for crew + candidates |
| `apps/scheduling-service/cmd/server/main.go` | wire new routes |
| `apps/job-service/prisma/schema.prisma` | `crewUserIds`, `requiredTechCount`, `JobCrewEvent` |
| `apps/crm-service/src/users/base-location.service.ts` | **new** — push base location to scheduling |

Crew and candidate logic are separate files because they answer different
questions (who is on this job / who could be) and will be reviewed separately.

---

## Task 1: Schema and backfill

**Files:**
- Modify: `scripts/apply-migrations.mjs` (append to the migrations array, before the closing `];`)

**Interfaces:**
- Produces: `scheduling.dispatch_assignments.is_lead`, `.base_distance_km`;
  `scheduling.technicians.base_location`; `jobs.jobs."crewUserIds"`,
  `."requiredTechCount"`; table `jobs.job_crew_events`.

- [ ] **Step 1: Append the scheduling migration**

Add to the array in `scripts/apply-migrations.mjs`:

```js
  // Crew support. dispatch_assignments was always one row per (job, technician)
  // with no unique constraint on job_id, so multiple technicians were already
  // storable — these two partial indexes are what make the crew *correct*:
  // nobody twice, exactly one lead.
  {
    schema: 'scheduling',
    name: '20260902000000_crew_assignments',
    sql: `
ALTER TABLE "scheduling"."dispatch_assignments"
  ADD COLUMN IF NOT EXISTS "is_lead"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "base_distance_km" NUMERIC(8,3);

ALTER TABLE "scheduling"."technicians"
  ADD COLUMN IF NOT EXISTS "base_location" geometry(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_technicians_base
  ON "scheduling"."technicians" USING GIST("base_location");

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_job_tech
  ON "scheduling"."dispatch_assignments" (job_id, technician_id)
  WHERE status <> 'CANCELLED';

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_job_lead
  ON "scheduling"."dispatch_assignments" (job_id)
  WHERE is_lead AND status <> 'CANCELLED';
    `.trim(),
  },
```

- [ ] **Step 2: Append the backfill migration**

The unique indexes above will reject the backfill if any job already has two
live assignments for the same technician, so the de-duplication runs first.

```js
  // Every existing job becomes a crew of one. The EARLIEST live assignment
  // becomes lead: that is the technician the dispatcher originally chose, which
  // matches intent better than the most-recently-updated row the dashboard
  // happens to show today.
  {
    schema: 'scheduling',
    name: '20260902000100_crew_backfill',
    sql: `
-- Collapse accidental duplicates (same tech twice on one job) before the
-- unique index can reject them.
UPDATE "scheduling"."dispatch_assignments" a
SET    status = 'CANCELLED', updated_at = NOW()
WHERE  a.status <> 'CANCELLED'
  AND  EXISTS (
    SELECT 1 FROM "scheduling"."dispatch_assignments" b
    WHERE b.job_id = a.job_id
      AND b.technician_id = a.technician_id
      AND b.status <> 'CANCELLED'
      AND b.created_at < a.created_at
  );

UPDATE "scheduling"."dispatch_assignments" a
SET    is_lead = true
WHERE  a.status <> 'CANCELLED'
  AND  NOT a.is_lead
  AND  NOT EXISTS (
    SELECT 1 FROM "scheduling"."dispatch_assignments" b
    WHERE b.job_id = a.job_id
      AND b.status <> 'CANCELLED'
      AND (b.created_at, b.id) < (a.created_at, a.id)
  );
    `.trim(),
  },
```

- [ ] **Step 3: Append the jobs migration**

```js
  // crewUserIds is denormalised so the technician app's "my jobs" query stays a
  // single job-service query. Without it the mobile app's hottest path becomes a
  // cross-service join. ProjectRosterDay.techUserIds sets the same precedent.
  {
    schema: 'jobs',
    name: '20260902000200_job_crew',
    sql: `
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "crewUserIds"       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "requiredTechCount" INTEGER;

UPDATE "jobs"."jobs"
SET    "crewUserIds" = ARRAY["assignedToId"]
WHERE  "assignedToId" IS NOT NULL
  AND  "crewUserIds" = '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_crew
  ON "jobs"."jobs" USING GIN("crewUserIds");

DO $$ BEGIN
  CREATE TYPE "jobs"."JobCrewEventType" AS ENUM
    ('ADDED', 'REMOVED', 'LEAD_CHANGED', 'CHECKED_OUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "jobs"."job_crew_events" (
  "id"             TEXT PRIMARY KEY,
  "companyId"      TEXT NOT NULL,
  "jobId"          TEXT NOT NULL REFERENCES "jobs"."jobs"("id"),
  "event"          "jobs"."JobCrewEventType" NOT NULL,
  "technicianId"   TEXT NOT NULL,
  "technicianName" TEXT NOT NULL,
  "previousLeadId" TEXT,
  "actorId"        TEXT NOT NULL,
  "actorName"      TEXT NOT NULL,
  "reason"         TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_crew_events_job
  ON "jobs"."job_crew_events" ("companyId", "jobId");
    `.trim(),
  },
```

- [ ] **Step 4: Run the migrations**

```bash
node scripts/apply-migrations.mjs
```

Expected: three migrations applied, no errors.

- [ ] **Step 5: Verify the invariants hold on real data**

```bash
node -e '
const {Client}=require("pg");const fs=require("fs");
const url=fs.readFileSync("apps/scheduling-service/.env","utf8").match(/^DATABASE_URL=(.*)$/m)[1].replace(/[?&]sslmode=[^&]*/g,m=>m[0]==="?"?"?":"");
(async()=>{const c=new Client({connectionString:url,ssl:{rejectUnauthorized:false}});await c.connect();
for (const [label,q] of [
  ["jobs with >1 live lead", `SELECT count(*) FROM (SELECT job_id FROM scheduling.dispatch_assignments WHERE is_lead AND status<>\x27CANCELLED\x27 GROUP BY job_id HAVING count(*)>1) t`],
  ["live assignments with no lead on their job", `SELECT count(*) FROM scheduling.dispatch_assignments a WHERE a.status<>\x27CANCELLED\x27 AND NOT EXISTS (SELECT 1 FROM scheduling.dispatch_assignments b WHERE b.job_id=a.job_id AND b.is_lead AND b.status<>\x27CANCELLED\x27)`],
  ["assigned jobs with empty crewUserIds", `SELECT count(*) FROM jobs.jobs WHERE "assignedToId" IS NOT NULL AND "crewUserIds"=\x27{}\x27`],
]) { const r=await c.query(q); console.log(label+":", r.rows[0].count); }
await c.end();})();'
```

Expected: **all three counts are 0.**

- [ ] **Step 6: Commit**

```bash
git add scripts/apply-migrations.mjs
git commit -m "feat(scheduling): crew columns, lead invariant indexes and backfill"
```

---

## Task 2: Go models and crew reads

**Files:**
- Modify: `apps/scheduling-service/internal/models/models.go`
- Create: `apps/scheduling-service/internal/repository/crew_repo.go`
- Test: `apps/scheduling-service/internal/repository/crew_repo_test.go`

**Interfaces:**
- Consumes: columns from Task 1.
- Produces:
  - `models.DispatchAssignment.IsLead bool`, `.BaseDistanceKm *float64`
  - `models.Technician.BaseLocation *GeoPoint`
  - `models.CrewMember{ Assignment DispatchAssignment; Technician Technician }`
  - `repository.NewCrewRepository(db *pgxpool.Pool) *CrewRepository`
  - `(*CrewRepository).FindCrew(ctx, companyID, jobID string) ([]models.CrewMember, error)`
  - `models.LeadOf(crew []models.CrewMember) *models.CrewMember`

- [ ] **Step 1: Write the failing test**

Create `apps/scheduling-service/internal/repository/crew_repo_test.go`:

```go
package repository

import (
	"testing"

	"github.com/tscrm/scheduling-service/internal/models"
)

func TestLeadOf_ReturnsTheLead(t *testing.T) {
	crew := []models.CrewMember{
		{Assignment: models.DispatchAssignment{ID: "a1", IsLead: false}},
		{Assignment: models.DispatchAssignment{ID: "a2", IsLead: true}},
	}
	lead := models.LeadOf(crew)
	if lead == nil || lead.Assignment.ID != "a2" {
		t.Fatalf("expected a2 to be lead, got %+v", lead)
	}
}

func TestLeadOf_NoLeadReturnsNil(t *testing.T) {
	crew := []models.CrewMember{
		{Assignment: models.DispatchAssignment{ID: "a1", IsLead: false}},
	}
	if lead := models.LeadOf(crew); lead != nil {
		t.Fatalf("expected nil, got %+v", lead)
	}
}

func TestLeadOf_EmptyCrewReturnsNil(t *testing.T) {
	if lead := models.LeadOf(nil); lead != nil {
		t.Fatalf("expected nil for empty crew, got %+v", lead)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestLeadOf -v
```

Expected: FAIL — `undefined: models.CrewMember`, `undefined: models.LeadOf`.

- [ ] **Step 3: Add the model fields and helper**

In `apps/scheduling-service/internal/models/models.go`, add to `DispatchAssignment`
(after `DistanceKm`):

```go
	// IsLead marks the one crew member who drives Job.status and is named to the
	// customer. Enforced unique per job by uq_assignment_job_lead.
	IsLead         bool     `json:"isLead"`
	// BaseDistanceKm is distance from the technician's BASE at assign time, kept
	// separate from DistanceKm (their live position) so the two are never confused.
	BaseDistanceKm *float64 `json:"baseDistanceKm,omitempty"`
```

Add to `Technician` (after `CurrentLocation`):

```go
	// BaseLocation is where the technician starts their day, synced from
	// crm.company_users. Used for scoring future jobs, where a live position
	// predicts nothing.
	BaseLocation *GeoPoint `json:"baseLocation,omitempty"`
```

Add at the end of the file:

```go
// CrewMember pairs an assignment with the technician it points at, so callers
// do not have to join the two by hand.
type CrewMember struct {
	Assignment DispatchAssignment `json:"assignment"`
	Technician Technician         `json:"technician"`
}

// LeadOf returns the crew's lead, or nil when the crew is empty or headless.
// A headless crew should be impossible (uq_assignment_job_lead), so a nil here
// on a non-empty crew means the invariant was bypassed.
func LeadOf(crew []CrewMember) *CrewMember {
	for i := range crew {
		if crew[i].Assignment.IsLead {
			return &crew[i]
		}
	}
	return nil
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestLeadOf -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Add the crew repository**

Create `apps/scheduling-service/internal/repository/crew_repo.go`:

```go
package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

// CrewRepository reads and writes the set of technicians assigned to a job.
// Separate from AssignmentRepository because a crew is a different question
// from a single assignment, and the two are reviewed independently.
type CrewRepository struct {
	db *pgxpool.Pool
}

func NewCrewRepository(db *pgxpool.Pool) *CrewRepository {
	return &CrewRepository{db: db}
}

// FindCrew returns every live member of a job's crew, lead first, then by
// assignment time so the display order is stable across refreshes.
func (r *CrewRepository) FindCrew(ctx context.Context, companyID, jobID string) ([]models.CrewMember, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.company_id, a.job_id, a.technician_id, a.status,
		       a.is_lead, a.score, a.distance_km, a.base_distance_km,
		       a.assigned_at, a.scheduled_start, a.scheduled_end,
		       t.user_id, t.name, t.phone, t.avatar_url, t.skills, t.rating
		FROM   scheduling.dispatch_assignments a
		JOIN   scheduling.technicians t ON t.id = a.technician_id
		WHERE  a.company_id = $1
		  AND  a.job_id     = $2
		  AND  a.status <> 'CANCELLED'
		ORDER BY a.is_lead DESC, a.assigned_at ASC`,
		companyID, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	crew := []models.CrewMember{}
	for rows.Next() {
		var m models.CrewMember
		if err := rows.Scan(
			&m.Assignment.ID, &m.Assignment.CompanyID, &m.Assignment.JobID,
			&m.Assignment.TechnicianID, &m.Assignment.Status, &m.Assignment.IsLead,
			&m.Assignment.Score, &m.Assignment.DistanceKm, &m.Assignment.BaseDistanceKm,
			&m.Assignment.AssignedAt, &m.Assignment.ScheduledStart, &m.Assignment.ScheduledEnd,
			&m.Technician.UserID, &m.Technician.Name, &m.Technician.Phone,
			&m.Technician.AvatarURL, &m.Technician.Skills, &m.Technician.Rating,
		); err != nil {
			return nil, err
		}
		m.Technician.ID = m.Assignment.TechnicianID
		m.Technician.CompanyID = companyID
		crew = append(crew, m)
	}
	return crew, rows.Err()
}
```

- [ ] **Step 6: Verify it builds and the suite is green**

```bash
cd apps/scheduling-service && go build ./... && go test ./internal/... 2>&1 | tail -20
```

Expected: build OK, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/scheduling-service/internal/models/models.go \
        apps/scheduling-service/internal/repository/crew_repo.go \
        apps/scheduling-service/internal/repository/crew_repo_test.go
git commit -m "feat(scheduling): crew model, lead helper and crew read repository"
```

---

## Task 3: Lead handover

**Files:**
- Modify: `apps/scheduling-service/internal/repository/crew_repo.go`
- Test: `apps/scheduling-service/internal/repository/crew_repo_test.go`

**Interfaces:**
- Consumes: `CrewRepository` from Task 2.
- Produces:
  - `(*CrewRepository).SetLead(ctx, companyID, jobID, technicianID, actorID, actorName string) error`
  - `recordCrewEvent(ctx, tx pgx.Tx, companyID, jobID, event, technicianID, technicianName, previousLeadID, actorID, actorName, reason string) error`
  - sentinel errors `ErrNotOnCrew`, `ErrAlreadyCheckedOut`

- [ ] **Step 1: Write the failing test**

Append to `crew_repo_test.go`:

```go
import "errors"   // add to the existing import block

func TestSetLeadErrors_AreDistinct(t *testing.T) {
	// The handler maps these to different messages, so they must not be equal.
	if errors.Is(ErrNotOnCrew, ErrAlreadyCheckedOut) {
		t.Fatal("ErrNotOnCrew and ErrAlreadyCheckedOut must be distinct")
	}
	if ErrNotOnCrew.Error() == "" || ErrAlreadyCheckedOut.Error() == "" {
		t.Fatal("sentinel errors need messages")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestSetLeadErrors -v
```

Expected: FAIL — `undefined: ErrNotOnCrew`.

- [ ] **Step 3: Implement SetLead**

Append to `crew_repo.go`:

```go
import (
	"errors"    // add to the existing import block
	"github.com/jackc/pgx/v5"
)

var (
	// ErrNotOnCrew: handing the lead to someone who is not assigned. Rejected
	// rather than auto-adding them — a lead who is not on site is worse than no
	// change at all.
	ErrNotOnCrew = errors.New("technician is not on this crew")
	// ErrAlreadyCheckedOut: they have finished and gone home. A departed lead is
	// the problem handover exists to solve, so it must not create one.
	ErrAlreadyCheckedOut = errors.New("technician has already left this job")
)

// SetLead moves the lead flag to technicianID.
//
// The two rows MUST be updated as unset-then-set inside a transaction. A partial
// unique index cannot be deferred in Postgres, so a single UPDATE touching both
// rows can transiently violate uq_assignment_job_lead depending on the order the
// planner visits them. Two statements never can.
func (r *CrewRepository) SetLead(ctx context.Context, companyID, jobID, technicianID, actorID, actorName string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck // no-op once committed

	var status, newLeadName string
	err = tx.QueryRow(ctx, `
		SELECT a.status, t.name
		FROM   scheduling.dispatch_assignments a
		JOIN   scheduling.technicians t ON t.id = a.technician_id
		WHERE  a.company_id = $1 AND a.job_id = $2 AND a.technician_id = $3
		  AND  a.status <> 'CANCELLED'`,
		companyID, jobID, technicianID).Scan(&status, &newLeadName)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotOnCrew
	}
	if err != nil {
		return err
	}
	if status == string(models.StatusCompleted) {
		return ErrAlreadyCheckedOut
	}

	// Capture who is being replaced, for the audit trail. Empty on the first
	// assignment of a lead, which is a legitimate case rather than an error.
	var previousLeadID string
	_ = tx.QueryRow(ctx, `
		SELECT technician_id FROM scheduling.dispatch_assignments
		WHERE company_id = $1 AND job_id = $2 AND is_lead AND status <> 'CANCELLED'`,
		companyID, jobID).Scan(&previousLeadID)

	if _, err = tx.Exec(ctx, `
		UPDATE scheduling.dispatch_assignments
		SET    is_lead = false, updated_at = NOW()
		WHERE  company_id = $1 AND job_id = $2 AND is_lead AND status <> 'CANCELLED'`,
		companyID, jobID); err != nil {
		return err
	}

	if _, err = tx.Exec(ctx, `
		UPDATE scheduling.dispatch_assignments
		SET    is_lead = true, updated_at = NOW()
		WHERE  company_id = $1 AND job_id = $2 AND technician_id = $3
		  AND  status <> 'CANCELLED'`,
		companyID, jobID, technicianID); err != nil {
		return err
	}

	// Keep the job's denormalised lead in step, in the same transaction.
	// Cross-schema write, matching AssignmentRepository.SyncJobAssignment.
	if _, err = tx.Exec(ctx, `
		UPDATE jobs.jobs j SET
			"assignedToId"   = t.user_id,
			"assignedToName" = t.name,
			"updatedAt"      = NOW()
		FROM scheduling.technicians t
		WHERE t.id = $3 AND j.id = $2 AND j."companyId" = $1`,
		companyID, jobID, technicianID); err != nil {
		return err
	}

	// "Who was in charge at 14:00" is exactly the question asked after something
	// goes wrong, so the handover is recorded in the same transaction.
	if err = recordCrewEvent(ctx, tx, companyID, jobID, "LEAD_CHANGED",
		technicianID, newLeadName, previousLeadID, actorID, actorName, ""); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// recordCrewEvent appends to the jobs-schema audit trail. Cross-schema write in
// the caller's transaction, so an event never survives a rolled-back change.
func recordCrewEvent(
	ctx context.Context, tx pgx.Tx,
	companyID, jobID, event, technicianID, technicianName,
	previousLeadID, actorID, actorName, reason string,
) error {
	var prev, why *string
	if previousLeadID != "" {
		prev = &previousLeadID
	}
	if reason != "" {
		why = &reason
	}
	_, err := tx.Exec(ctx, `
		INSERT INTO jobs.job_crew_events
		       (id, "companyId", "jobId", event, "technicianId", "technicianName",
		        "previousLeadId", "actorId", "actorName", reason)
		VALUES (gen_random_uuid()::text, $1, $2, $3::"jobs"."JobCrewEventType",
		        $4, $5, $6, $7, $8, $9)`,
		companyID, jobID, event, technicianID, technicianName,
		prev, actorID, actorName, why)
	return err
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestSetLead -v && go build ./...
```

Expected: PASS, build OK.

- [ ] **Step 5: Add the regression guard against "simplifying" the swap**

Append to `crew_repo_test.go`. This documents *why* two statements exist so a
future reader does not collapse them:

```go
func TestSetLead_UsesTwoStatementSwap(t *testing.T) {
	// A single UPDATE ... SET is_lead = (technician_id = $3) touching both rows
	// can transiently violate uq_assignment_job_lead, because a partial unique
	// index cannot be deferred in Postgres. If this assertion ever fails,
	// someone has collapsed the swap — do not "fix" the test.
	src, err := os.ReadFile("crew_repo.go")
	if err != nil {
		t.Fatal(err)
	}
	body := string(src)
	if !strings.Contains(body, "SET    is_lead = false") ||
		!strings.Contains(body, "SET    is_lead = true, updated_at = NOW()") {
		t.Fatal("SetLead must unset the old lead and set the new one as separate statements")
	}
}
```

Add `"os"` and `"strings"` to the test file's import block.

- [ ] **Step 6: Run the full package**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -v 2>&1 | tail -15
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/scheduling-service/internal/repository/crew_repo.go \
        apps/scheduling-service/internal/repository/crew_repo_test.go
git commit -m "feat(scheduling): lead handover with non-deferrable index safe swap"
```

---

## Task 4: Crew replacement

**Files:**
- Modify: `apps/scheduling-service/internal/repository/crew_repo.go`
- Test: `apps/scheduling-service/internal/repository/crew_repo_test.go`

**Interfaces:**
- Consumes: `CrewRepository`, `ErrNotOnCrew` from Tasks 2–3.
- Produces:
  - `models.CrewInput{ TechnicianIDs []string; LeadTechnicianID string }`
  - `(*CrewRepository).SetCrew(ctx, companyID, jobID, actorID, actorName string, in models.CrewInput) error`
  - `ErrLeadNotInCrew`

- [ ] **Step 1: Write the failing test**

Append to `crew_repo_test.go`:

```go
func TestCrewInput_Validate(t *testing.T) {
	cases := []struct {
		name string
		in   models.CrewInput
		want error
	}{
		{"lead outside crew", models.CrewInput{
			TechnicianIDs: []string{"t1", "t2"}, LeadTechnicianID: "t9",
		}, ErrLeadNotInCrew},
		{"valid", models.CrewInput{
			TechnicianIDs: []string{"t1", "t2"}, LeadTechnicianID: "t1",
		}, nil},
		{"empty crew clears the job", models.CrewInput{
			TechnicianIDs: []string{}, LeadTechnicianID: "",
		}, nil},
	}
	for _, c := range cases {
		if got := ValidateCrewInput(c.in); !errors.Is(got, c.want) {
			t.Fatalf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestCrewInput -v
```

Expected: FAIL — `undefined: models.CrewInput`, `undefined: ValidateCrewInput`.

- [ ] **Step 3: Add the input type and validator**

In `models.go`:

```go
// CrewInput is a full replacement of a job's crew. Partial updates are not
// supported on purpose: the dispatcher edits a list and confirms it, so the
// API takes the list they confirmed rather than a diff nobody computed.
type CrewInput struct {
	TechnicianIDs    []string `json:"technicianIds"`
	LeadTechnicianID string   `json:"leadTechnicianId"`
}
```

In `crew_repo.go`:

```go
// ErrLeadNotInCrew: the named lead is not in the technician list. Rejected
// rather than silently added, so the caller's intent is never guessed at.
var ErrLeadNotInCrew = errors.New("lead must be one of the assigned technicians")

// ValidateCrewInput checks the shape before any database work. An empty crew is
// valid: it is how a dispatcher undoes a mistake and leaves the job unassigned.
func ValidateCrewInput(in models.CrewInput) error {
	if len(in.TechnicianIDs) == 0 {
		return nil
	}
	for _, id := range in.TechnicianIDs {
		if id == in.LeadTechnicianID {
			return nil
		}
	}
	return ErrLeadNotInCrew
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestCrewInput -v
```

Expected: PASS.

- [ ] **Step 5: Implement SetCrew**

Append to `crew_repo.go`:

```go
// SetCrew replaces a job's crew in one transaction: members no longer listed are
// cancelled, new members inserted, the lead flag set, and the job's denormalised
// assignedToId / crewUserIds updated cross-schema so the mobile app's "my jobs"
// query stays a single job-service query.
func (r *CrewRepository) SetCrew(
	ctx context.Context, companyID, jobID, actorID, actorName string, in models.CrewInput,
) error {
	if err := ValidateCrewInput(in); err != nil {
		return err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Who is on the crew now, so the audit trail can name the difference rather
	// than just recording "crew changed".
	before := map[string]string{} // technician_id -> name
	rows, err := tx.Query(ctx, `
		SELECT a.technician_id, t.name
		FROM   scheduling.dispatch_assignments a
		JOIN   scheduling.technicians t ON t.id = a.technician_id
		WHERE  a.company_id = $1 AND a.job_id = $2 AND a.status <> 'CANCELLED'`,
		companyID, jobID)
	if err != nil {
		return err
	}
	for rows.Next() {
		var id, name string
		if err := rows.Scan(&id, &name); err != nil {
			rows.Close()
			return err
		}
		before[id] = name
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	// Cancel anyone dropped from the crew.
	if _, err = tx.Exec(ctx, `
		UPDATE scheduling.dispatch_assignments
		SET    status = 'CANCELLED', is_lead = false, updated_at = NOW()
		WHERE  company_id = $1 AND job_id = $2
		  AND  status <> 'CANCELLED'
		  AND  NOT (technician_id = ANY($3))`,
		companyID, jobID, in.TechnicianIDs); err != nil {
		return err
	}

	kept := map[string]bool{}
	for _, id := range in.TechnicianIDs {
		kept[id] = true
	}
	for id, name := range before {
		if !kept[id] {
			if err = recordCrewEvent(ctx, tx, companyID, jobID, "REMOVED",
				id, name, "", actorID, actorName, ""); err != nil {
				return err
			}
		}
	}

	// Insert anyone new. ON CONFLICT covers a technician being re-added after
	// having been cancelled earlier in the same job's life.
	for _, techID := range in.TechnicianIDs {
		if _, err = tx.Exec(ctx, `
			INSERT INTO scheduling.dispatch_assignments
			       (company_id, job_id, technician_id, status, assigned_by, is_lead)
			VALUES ($1, $2, $3, 'ASSIGNED', $4, false)
			ON CONFLICT (job_id, technician_id) WHERE status <> 'CANCELLED'
			DO NOTHING`,
			companyID, jobID, techID, actorID); err != nil {
			return err
		}
		if _, wasAlreadyOn := before[techID]; !wasAlreadyOn {
			var name string
			if err = tx.QueryRow(ctx,
				`SELECT name FROM scheduling.technicians WHERE id = $1`, techID,
			).Scan(&name); err != nil {
				return err
			}
			if err = recordCrewEvent(ctx, tx, companyID, jobID, "ADDED",
				techID, name, "", actorID, actorName, ""); err != nil {
				return err
			}
		}
	}

	// Lead: unset then set, for the same non-deferrable-index reason as SetLead.
	if _, err = tx.Exec(ctx, `
		UPDATE scheduling.dispatch_assignments SET is_lead = false, updated_at = NOW()
		WHERE company_id = $1 AND job_id = $2 AND is_lead AND status <> 'CANCELLED'`,
		companyID, jobID); err != nil {
		return err
	}
	if in.LeadTechnicianID != "" {
		if _, err = tx.Exec(ctx, `
			UPDATE scheduling.dispatch_assignments SET is_lead = true, updated_at = NOW()
			WHERE company_id = $1 AND job_id = $2 AND technician_id = $3
			  AND status <> 'CANCELLED'`,
			companyID, jobID, in.LeadTechnicianID); err != nil {
			return err
		}
	}

	// Denormalise onto the job: lead in assignedToId, everyone in crewUserIds.
	if _, err = tx.Exec(ctx, `
		WITH crew AS (
			SELECT COALESCE(array_agg(t.user_id ORDER BY t.user_id), '{}') AS ids
			FROM   scheduling.dispatch_assignments a
			JOIN   scheduling.technicians t ON t.id = a.technician_id
			WHERE  a.company_id = $1 AND a.job_id = $2 AND a.status <> 'CANCELLED'
		), lead AS (
			SELECT t.user_id, t.name
			FROM   scheduling.dispatch_assignments a
			JOIN   scheduling.technicians t ON t.id = a.technician_id
			WHERE  a.company_id = $1 AND a.job_id = $2
			  AND  a.is_lead AND a.status <> 'CANCELLED'
			LIMIT  1
		)
		UPDATE jobs.jobs j SET
			"crewUserIds"    = (SELECT ids FROM crew),
			"assignedToId"   = (SELECT user_id FROM lead),
			"assignedToName" = (SELECT name FROM lead),
			status = CASE WHEN j.status = 'PENDING' AND (SELECT user_id FROM lead) IS NOT NULL
			              THEN 'SCHEDULED' ELSE j.status END,
			"updatedAt"      = NOW()
		WHERE j.id = $2 AND j."companyId" = $1`,
		companyID, jobID); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
```

- [ ] **Step 6: Verify build and full suite**

```bash
cd apps/scheduling-service && go build ./... && go test ./internal/... 2>&1 | tail -20
```

Expected: build OK, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add apps/scheduling-service/internal/models/models.go \
        apps/scheduling-service/internal/repository/crew_repo.go \
        apps/scheduling-service/internal/repository/crew_repo_test.go
git commit -m "feat(scheduling): transactional crew replacement with job denormalisation"
```

---

## Task 5: Conflict detection

**Files:**
- Create: `apps/scheduling-service/internal/repository/conflict_repo.go`
- Test: `apps/scheduling-service/internal/repository/conflict_repo_test.go`

**Interfaces:**
- Produces:
  - `models.ScheduleConflict{ JobID, JobNumber, Title string; Start, End time.Time; Lat, Lng *float64; DistanceFromSiteKm *float64 }`
  - `repository.NewConflictRepository(db *pgxpool.Pool) *ConflictRepository`
  - `(*ConflictRepository).FindConflicts(ctx, companyID string, technicianIDs []string, start, end time.Time, siteLat, siteLng *float64) (map[string][]models.ScheduleConflict, error)`
  - `repository.Overlaps(aStart, aEnd, bStart, bEnd time.Time) bool`

- [ ] **Step 1: Write the failing test**

Create `apps/scheduling-service/internal/repository/conflict_repo_test.go`:

```go
package repository

import (
	"testing"
	"time"
)

func at(h, m int) time.Time {
	return time.Date(2026, 9, 9, h, m, 0, 0, time.UTC)
}

func TestOverlaps(t *testing.T) {
	cases := []struct {
		name                           string
		aStart, aEnd, bStart, bEnd     time.Time
		want                           bool
	}{
		{"identical", at(9, 0), at(12, 0), at(9, 0), at(12, 0), true},
		{"b inside a", at(9, 0), at(12, 0), at(10, 0), at(11, 0), true},
		{"partial overlap at start", at(9, 0), at(12, 0), at(8, 0), at(10, 0), true},
		{"partial overlap at end", at(9, 0), at(12, 0), at(11, 0), at(13, 0), true},
		// Back-to-back jobs are the normal case in a day's route. Treating them
		// as a conflict would flag almost every technician.
		{"b ends exactly when a starts", at(9, 0), at(12, 0), at(7, 0), at(9, 0), false},
		{"b starts exactly when a ends", at(9, 0), at(12, 0), at(12, 0), at(14, 0), false},
		{"entirely before", at(9, 0), at(12, 0), at(6, 0), at(7, 0), false},
		{"entirely after", at(9, 0), at(12, 0), at(15, 0), at(16, 0), false},
	}
	for _, c := range cases {
		if got := Overlaps(c.aStart, c.aEnd, c.bStart, c.bEnd); got != c.want {
			t.Fatalf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/scheduling-service && go test ./internal/repository/ -run TestOverlaps -v
```

Expected: FAIL — `undefined: Overlaps`.

- [ ] **Step 3: Implement**

Add to `models.go`:

```go
// ScheduleConflict is an existing assignment that overlaps a proposed window.
// It carries the clashing job's location and distance so the dispatcher can
// judge whether the clash actually matters — "busy" is not a decision, "finishes
// 1.4 km away at 10:30" is.
type ScheduleConflict struct {
	JobID              string    `json:"jobId"`
	JobNumber          string    `json:"jobNumber"`
	Title              string    `json:"title"`
	Start              time.Time `json:"start"`
	End                time.Time `json:"end"`
	Lat                *float64  `json:"lat,omitempty"`
	Lng                *float64  `json:"lng,omitempty"`
	DistanceFromSiteKm *float64  `json:"distanceFromSiteKm,omitempty"`
}
```

Create `conflict_repo.go`:

```go
package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

// Overlaps reports whether two half-open intervals [start, end) intersect.
// Half-open matters: back-to-back jobs are the normal shape of a day's route,
// and treating them as conflicts would flag nearly every technician.
func Overlaps(aStart, aEnd, bStart, bEnd time.Time) bool {
	return aStart.Before(bEnd) && bStart.Before(aEnd)
}

type ConflictRepository struct {
	db *pgxpool.Pool
}

func NewConflictRepository(db *pgxpool.Pool) *ConflictRepository {
	return &ConflictRepository{db: db}
}

// FindConflicts returns, per technician id, the live assignments overlapping
// [start, end). siteLat/siteLng are optional; when present each conflict carries
// the straight-line distance from the proposed job's site.
func (r *ConflictRepository) FindConflicts(
	ctx context.Context,
	companyID string,
	technicianIDs []string,
	start, end time.Time,
	siteLat, siteLng *float64,
) (map[string][]models.ScheduleConflict, error) {
	out := map[string][]models.ScheduleConflict{}
	if len(technicianIDs) == 0 {
		return out, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT a.technician_id,
		       j.id, COALESCE(j."jobNumber", ''), COALESCE(j.title, ''),
		       a.scheduled_start, a.scheduled_end,
		       j."serviceLatitude", j."serviceLongitude"
		FROM   scheduling.dispatch_assignments a
		JOIN   jobs.jobs j ON j.id = a.job_id
		WHERE  a.company_id = $1
		  AND  a.technician_id = ANY($2)
		  AND  a.status NOT IN ('CANCELLED', 'COMPLETED')
		  AND  a.scheduled_start IS NOT NULL
		  AND  a.scheduled_end   IS NOT NULL
		  AND  a.scheduled_start < $4
		  AND  a.scheduled_end   > $3
		ORDER BY a.scheduled_start ASC`,
		companyID, technicianIDs, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var techID string
		var c models.ScheduleConflict
		if err := rows.Scan(&techID, &c.JobID, &c.JobNumber, &c.Title,
			&c.Start, &c.End, &c.Lat, &c.Lng); err != nil {
			return nil, err
		}
		if siteLat != nil && siteLng != nil && c.Lat != nil && c.Lng != nil {
			d := haversineKm(*siteLat, *siteLng, *c.Lat, *c.Lng)
			c.DistanceFromSiteKm = &d
		}
		out[techID] = append(out[techID], c)
	}
	return out, rows.Err()
}
```

- [ ] **Step 4: Add the distance helper if it does not already exist**

```bash
cd apps/scheduling-service && grep -rn "func haversineKm" internal/ || echo "NOT FOUND — add it"
```

If not found, append to `conflict_repo.go`:

```go
import "math"

// haversineKm is straight-line distance. Good enough for "is this clash nearby",
// which is a judgement call, not a routing decision.
func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
	const earthKm = 6371.0
	rad := func(d float64) float64 { return d * math.Pi / 180 }
	dLat, dLng := rad(lat2-lat1), rad(lng2-lng1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rad(lat1))*math.Cos(rad(lat2))*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthKm * math.Asin(math.Sqrt(a))
}
```

- [ ] **Step 5: Run the tests**

```bash
cd apps/scheduling-service && go build ./... && go test ./internal/repository/ -v 2>&1 | tail -15
```

Expected: build OK, all PASS including the 8 `Overlaps` cases.

- [ ] **Step 6: Commit**

```bash
git add apps/scheduling-service/internal/models/models.go \
        apps/scheduling-service/internal/repository/conflict_repo.go \
        apps/scheduling-service/internal/repository/conflict_repo_test.go
git commit -m "feat(scheduling): overlap detection with clashing-job location and distance"
```

---

## Task 6: Ranked candidates

**Files:**
- Create: `apps/scheduling-service/internal/service/candidate_service.go`
- Test: `apps/scheduling-service/internal/service/candidate_service_test.go`

**Interfaces:**
- Consumes: `ConflictRepository.FindConflicts`, `TechnicianRepository.FindCandidatesNearby`,
  the existing `scoreTechnician` in `assignment_service.go`.
- Produces:
  - `models.CrewCandidate{ Technician models.Technician; Score float64; BaseDistanceKm *float64; ActiveJobsThatDay int; Conflicts []models.ScheduleConflict }`
  - `service.NewCandidateService(...) *CandidateService`
  - `(*CandidateService).Candidates(ctx, companyID, jobID string, start, end time.Time, limit int) ([]models.CrewCandidate, error)`
  - `service.SortCandidates(cands []models.CrewCandidate)`

- [ ] **Step 1: Write the failing test**

Create `apps/scheduling-service/internal/service/candidate_service_test.go`:

```go
package service

import (
	"testing"

	"github.com/tscrm/scheduling-service/internal/models"
)

func cand(name string, score float64, conflicts int) models.CrewCandidate {
	c := models.CrewCandidate{
		Technician: models.Technician{Name: name},
		Score:      score,
	}
	for i := 0; i < conflicts; i++ {
		c.Conflicts = append(c.Conflicts, models.ScheduleConflict{JobID: "j"})
	}
	return c
}

func TestSortCandidates_ConflictFreeFirst(t *testing.T) {
	// A high-scoring technician who is double-booked is a worse suggestion than a
	// slightly lower-scoring one who is free, so conflicts outrank score.
	list := []models.CrewCandidate{
		cand("Busy", 95, 1),
		cand("Free", 70, 0),
	}
	SortCandidates(list)
	if list[0].Technician.Name != "Free" {
		t.Fatalf("expected conflict-free candidate first, got %s", list[0].Technician.Name)
	}
}

func TestSortCandidates_ScoreBreaksTieWithinGroup(t *testing.T) {
	list := []models.CrewCandidate{
		cand("Lower", 60, 0),
		cand("Higher", 90, 0),
	}
	SortCandidates(list)
	if list[0].Technician.Name != "Higher" {
		t.Fatalf("expected higher score first, got %s", list[0].Technician.Name)
	}
}

func TestSortCandidates_StableForEqualCandidates(t *testing.T) {
	list := []models.CrewCandidate{cand("A", 80, 0), cand("B", 80, 0)}
	SortCandidates(list)
	if list[0].Technician.Name != "A" {
		t.Fatal("equal candidates must keep their original order so the list does not shuffle between refreshes")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/scheduling-service && go test ./internal/service/ -run TestSortCandidates -v
```

Expected: FAIL — `undefined: models.CrewCandidate`, `undefined: SortCandidates`.

- [ ] **Step 3: Add the model**

Append to `models.go`:

```go
// CrewCandidate is a technician the dispatcher could add, with everything needed
// to judge them: how well they score, how far from base, how loaded that day, and
// what they would clash with.
type CrewCandidate struct {
	Technician        Technician         `json:"technician"`
	Score             float64            `json:"score"`
	BaseDistanceKm    *float64           `json:"baseDistanceKm,omitempty"`
	ActiveJobsThatDay int                `json:"activeJobsThatDay"`
	Conflicts         []ScheduleConflict `json:"conflicts"`
}
```

- [ ] **Step 4: Implement the sort**

Create `apps/scheduling-service/internal/service/candidate_service.go`:

```go
package service

import (
	"sort"

	"github.com/tscrm/scheduling-service/internal/models"
)

// SortCandidates orders conflict-free technicians ahead of clashing ones, then by
// score descending. A double-booked 95 is a worse suggestion than a free 70, so
// availability outranks score. sort.SliceStable keeps equal candidates in a fixed
// order so the list does not reshuffle between refreshes.
func SortCandidates(cands []models.CrewCandidate) {
	sort.SliceStable(cands, func(i, j int) bool {
		iFree := len(cands[i].Conflicts) == 0
		jFree := len(cands[j].Conflicts) == 0
		if iFree != jFree {
			return iFree
		}
		return cands[i].Score > cands[j].Score
	})
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd apps/scheduling-service && go test ./internal/service/ -run TestSortCandidates -v
```

Expected: PASS (3 tests).

- [ ] **Step 6: Add the service that assembles candidates**

Append to `candidate_service.go`:

```go
import (
	"context"
	"time"

	"github.com/tscrm/scheduling-service/internal/config"
	"github.com/tscrm/scheduling-service/internal/repository"
)

type CandidateService struct {
	techRepo     *repository.TechnicianRepository
	conflictRepo *repository.ConflictRepository
	assignRepo   *repository.AssignmentRepository
	cfg          *config.Config
}

func NewCandidateService(
	techRepo *repository.TechnicianRepository,
	conflictRepo *repository.ConflictRepository,
	assignRepo *repository.AssignmentRepository,
	cfg *config.Config,
) *CandidateService {
	return &CandidateService{techRepo, conflictRepo, assignRepo, cfg}
}

// Candidates ranks technicians for a job window. Distance is measured from each
// technician's BASE, not their live position: scheduling next Tuesday, where a van
// is parked right now predicts nothing.
func (s *CandidateService) Candidates(
	ctx context.Context, companyID, jobID string, start, end time.Time, limit int,
) ([]models.CrewCandidate, error) {
	info, err := s.assignRepo.GetJobEnRouteInfo(ctx, companyID, jobID)
	if err != nil {
		return nil, err
	}

	var lat, lng float64
	if info.Latitude != nil && info.Longitude != nil {
		lat, lng = *info.Latitude, *info.Longitude
	}

	nearby, err := s.techRepo.FindCandidatesNearby(
		ctx, companyID, lat, lng, s.cfg.MaxDistanceKm*2, nil)
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(nearby))
	for _, n := range nearby {
		ids = append(ids, n.Technician.ID)
	}

	conflicts, err := s.conflictRepo.FindConflicts(
		ctx, companyID, ids, start, end, info.Latitude, info.Longitude)
	if err != nil {
		return nil, err
	}

	activeJobs, err := s.techRepo.CountActiveJobsForTechnicians(ctx, companyID, ids)
	if err != nil {
		return nil, err
	}

	out := make([]models.CrewCandidate, 0, len(nearby))
	for _, n := range nearby {
		d := n.DistanceKm
		st := scoreTechnician(n, activeJobs[n.Technician.ID], s.cfg, 0, false)
		out = append(out, models.CrewCandidate{
			Technician:        n.Technician,
			Score:             st.Score,
			BaseDistanceKm:    &d,
			ActiveJobsThatDay: activeJobs[n.Technician.ID],
			Conflicts:         conflicts[n.Technician.ID],
		})
	}

	SortCandidates(out)
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}
```

- [ ] **Step 7: Verify build and full suite**

```bash
cd apps/scheduling-service && go build ./... && go test ./internal/... 2>&1 | tail -20
```

Expected: build OK, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/scheduling-service/internal/models/models.go \
        apps/scheduling-service/internal/service/candidate_service.go \
        apps/scheduling-service/internal/service/candidate_service_test.go
git commit -m "feat(scheduling): ranked crew candidates with conflict-aware ordering"
```

---

## Task 7: HTTP routes

**Files:**
- Create: `apps/scheduling-service/internal/handler/crew_handler.go`
- Modify: `apps/scheduling-service/cmd/server/main.go`

**Interfaces:**
- Consumes: `CrewRepository`, `CandidateService`.
- Produces these routes, all under the existing `auth` middleware:
  - `GET   /dispatch/jobs/:jobId/crew`
  - `PATCH /dispatch/jobs/:jobId/crew` body `models.CrewInput`
  - `PATCH /dispatch/jobs/:jobId/lead` body `{ "technicianId": "..." }`
  - `GET   /dispatch/candidates?jobId=&start=&end=&limit=`

Through the gateway these are `/api/scheduling/dispatch/...`.

- [ ] **Step 1: Write the handler**

Create `apps/scheduling-service/internal/handler/crew_handler.go`:

```go
package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
)

type CrewHandler struct {
	crewRepo  *repository.CrewRepository
	candidate *service.CandidateService
}

func NewCrewHandler(crewRepo *repository.CrewRepository, candidate *service.CandidateService) *CrewHandler {
	return &CrewHandler{crewRepo: crewRepo, candidate: candidate}
}

// GetCrew returns the job's live crew, lead first.
func (h *CrewHandler) GetCrew(c *gin.Context) {
	claims := middleware.GetClaims(c)
	crew, err := h.crewRepo.FindCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": crew, "count": len(crew)})
}

// SetCrew replaces the crew wholesale — the dispatcher confirms a list, so the
// API takes the list rather than a diff nobody computed.
func (h *CrewHandler) SetCrew(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var in models.CrewInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.crewRepo.SetCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"),
		claims.UserID, claims.Name, in)
	switch {
	case errors.Is(err, repository.ErrLeadNotInCrew):
		c.JSON(http.StatusBadRequest, gin.H{"error": "The lead must be one of the assigned technicians."})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	default:
		crew, _ := h.crewRepo.FindCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"))
		c.JSON(http.StatusOK, gin.H{"data": crew, "count": len(crew)})
	}
}

// SetLead hands the lead to another crew member.
func (h *CrewHandler) SetLead(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var body struct {
		TechnicianID string `json:"technicianId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.crewRepo.SetLead(c.Request.Context(), claims.CompanyID, c.Param("jobId"),
		body.TechnicianID, claims.UserID, claims.Name)
	switch {
	case errors.Is(err, repository.ErrNotOnCrew):
		c.JSON(http.StatusBadRequest, gin.H{"error": "Add them to the crew first."})
	case errors.Is(err, repository.ErrAlreadyCheckedOut):
		c.JSON(http.StatusBadRequest, gin.H{"error": "That technician has already left this job."})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	default:
		crew, _ := h.crewRepo.FindCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"))
		c.JSON(http.StatusOK, gin.H{"data": crew, "count": len(crew)})
	}
}

// Candidates ranks who else could join this job.
func (h *CrewHandler) Candidates(c *gin.Context) {
	claims := middleware.GetClaims(c)
	jobID := c.Query("jobId")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "jobId is required"})
		return
	}
	start, err := time.Parse(time.RFC3339, c.Query("start"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start must be an RFC3339 timestamp"})
		return
	}
	end, err := time.Parse(time.RFC3339, c.Query("end"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be an RFC3339 timestamp"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	cands, err := h.candidate.Candidates(c.Request.Context(), claims.CompanyID, jobID, start, end, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cands, "count": len(cands)})
}
```

- [ ] **Step 2: Wire the routes**

In `apps/scheduling-service/cmd/server/main.go`, near the existing
`r.POST("/gps", auth, gpsH.RecordGPS)` line, add:

```go
	crewRepo := repository.NewCrewRepository(db)
	conflictRepo := repository.NewConflictRepository(db)
	candidateSvc := service.NewCandidateService(techRepo, conflictRepo, assignRepo, cfg)
	crewH := handler.NewCrewHandler(crewRepo, candidateSvc)

	dispatch := r.Group("/dispatch", auth)
	{
		dispatch.GET("/jobs/:jobId/crew", crewH.GetCrew)
		dispatch.PATCH("/jobs/:jobId/crew", crewH.SetCrew)
		dispatch.PATCH("/jobs/:jobId/lead", crewH.SetLead)
		dispatch.GET("/candidates", crewH.Candidates)
	}
```

If a `/dispatch` group already exists, add the four routes to it rather than
creating a second group — Gin panics on duplicate group registration.

- [ ] **Step 3: Build and start the service**

```bash
cd apps/scheduling-service && go build ./... && go vet ./internal/handler/
```

Expected: no output (success).

- [ ] **Step 4: Verify the routes against real data**

Start the service, then:

```bash
JOB=$(curl -s "http://localhost:3002/jobs?limit=1" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-role: company_admin" | node -pe "JSON.parse(require('fs').readFileSync(0)).data[0].id")

curl -s "http://localhost:3003/dispatch/jobs/$JOB/crew" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-role: company_admin" -w "\nHTTP %{http_code}\n"

curl -s "http://localhost:3003/dispatch/candidates?jobId=$JOB&start=2026-09-09T09:00:00Z&end=2026-09-09T12:00:00Z&limit=5" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-role: company_admin" -w "\nHTTP %{http_code}\n"
```

Expected: both return HTTP 200. The candidates response lists technicians with
`score`, `baseDistanceKm` and a `conflicts` array.

- [ ] **Step 5: Commit**

```bash
git add apps/scheduling-service/internal/handler/crew_handler.go \
        apps/scheduling-service/cmd/server/main.go
git commit -m "feat(scheduling): crew and candidates HTTP routes"
```

---

## Task 8: Prisma schema catch-up

**Files:**
- Modify: `apps/job-service/prisma/schema.prisma`

The columns exist from Task 1; Prisma's client must learn about them or
job-service cannot read `crewUserIds`.

**Interfaces:**
- Produces: `Job.crewUserIds String[]`, `Job.requiredTechCount Int?`,
  `model JobCrewEvent`, `enum JobCrewEventType`.

- [ ] **Step 1: Add the fields**

In `model Job`, after `assignedToName`:

```prisma
  /// Every crew member's CompanyUser id, lead included. Denormalised so the
  /// technician app's "my jobs" query stays a single job-service query instead
  /// of a cross-service join on its hottest path.
  crewUserIds       String[] @default([])
  /// Optional target crew size. Guidance for smart assign and the "2 of 3"
  /// counter — never a rule; a dispatcher may confirm any size.
  requiredTechCount Int?
```

In the same model's relation block, add:

```prisma
  crewEvents JobCrewEvent[]
```

And add an index alongside the existing ones:

```prisma
  @@index([companyId, crewUserIds], type: Gin)
```

At the end of the file:

```prisma
/// Audit trail for crew changes. Cannot reuse JobStatusHistory, whose toStatus is
/// a required JobStatus enum — a handover is not a status change, and forcing it
/// in would corrupt that table's meaning.
model JobCrewEvent {
  id             String           @id @default(uuid())
  companyId      String
  jobId          String
  job            Job              @relation(fields: [jobId], references: [id])
  event          JobCrewEventType
  technicianId   String
  technicianName String
  previousLeadId String?
  actorId        String
  actorName      String
  reason         String?
  createdAt      DateTime         @default(now())

  @@index([companyId, jobId])
  @@map("job_crew_events")
}

enum JobCrewEventType {
  ADDED
  REMOVED
  LEAD_CHANGED
  CHECKED_OUT
}
```

- [ ] **Step 2: Regenerate the client**

```bash
cd apps/job-service && npx prisma generate
```

Expected: "Generated Prisma Client".

- [ ] **Step 3: Confirm the schema matches the database**

```bash
cd apps/job-service && npx prisma validate && npx prisma db pull --print 2>/dev/null | grep -E "crewUserIds|requiredTechCount|job_crew_events" | head
```

Expected: `validate` passes and the three names appear.

Do **not** run `prisma migrate dev` — it will try to reset the shared database.
Task 1's raw SQL already applied the change.

- [ ] **Step 4: Build and test job-service**

```bash
pnpm --filter job-service build && pnpm --filter job-service test 2>&1 | tail -12
```

Expected: build clean, tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/job-service/prisma/schema.prisma
git commit -m "feat(jobs): crew fields and crew-event audit model"
```

---

## Task 9: Base location sync

**Files:**
- Create: `apps/crm-service/src/users/base-location.service.ts`
- Create: `apps/crm-service/src/users/base-location.service.spec.ts`
- Modify: `apps/crm-service/src/users/users.module.ts` (add to `providers`)

**Interfaces:**
- Consumes: `CompanyUser.latitude` / `.longitude`.
- Produces: `BaseLocationService.push(companyId, userId, lat, lng): Promise<boolean>`
  and `BaseLocationService.reconcileAll(): Promise<{ synced: number; failed: number }>`.

- [ ] **Step 1: Write the failing test**

Create `apps/crm-service/src/users/base-location.service.spec.ts`:

```ts
import { BaseLocationService } from './base-location.service';

describe('BaseLocationService', () => {
  const prisma = { companyUser: { findMany: jest.fn() } } as any;
  let svc: BaseLocationService;

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
    svc = new BaseLocationService(prisma);
  });

  it('returns false without throwing when scheduling is unreachable', async () => {
    // Base location is a nicety for ranking, never a reason to fail a user
    // update. A technician with no base is still assignable, just unscored.
    (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(svc.push('co-1', 'u-1', 6.9, 79.8)).resolves.toBe(false);
  });

  it('skips the call when either coordinate is missing', async () => {
    expect(await svc.push('co-1', 'u-1', null as any, 79.8)).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports counts from a reconcile run', async () => {
    prisma.companyUser.findMany.mockResolvedValue([
      { id: 'u-1', companyId: 'co-1', latitude: 6.9, longitude: 79.8 },
      { id: 'u-2', companyId: 'co-1', latitude: 7.0, longitude: 80.0 },
    ]);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    await expect(svc.reconcileAll()).resolves.toEqual({ synced: 2, failed: 0 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm --filter crm-service test -- base-location
```

Expected: FAIL — cannot find module `./base-location.service`.

- [ ] **Step 3: Implement**

Create `apps/crm-service/src/users/base-location.service.ts`:

```ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Keeps scheduling.technicians.base_location in step with the technician's own
 * CompanyUser latitude/longitude.
 *
 * crm owns the value; the Go scheduling service needs it in SQL to score
 * candidates by distance from base. Copying it across the schema boundary is the
 * price of keeping scoring inside the algorithm rather than in the dashboard.
 *
 * Every failure is soft. Base location improves ranking; it never gates an
 * assignment, and a user update must not fail because scheduling is down. The
 * nightly reconcile repairs whatever the push missed.
 */
@Injectable()
export class BaseLocationService {
  private readonly logger = new Logger(BaseLocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private schedulingUrl(): string {
    return (process.env.SCHEDULING_SERVICE_URL ?? 'http://localhost:3003').replace(/\/$/, '');
  }

  private headers(companyId: string): Record<string, string> {
    if (process.env.BYPASS_AUTH === 'true') {
      return {
        'Content-Type': 'application/json',
        'x-test-user-role': 'super_admin',
        'x-test-company-id': companyId,
        'x-test-user-id': 'crm-base-location-sync',
      };
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SERVICE_JWT ?? ''}`,
    };
  }

  async push(companyId: string, userId: string, lat: number, lng: number): Promise<boolean> {
    if (lat == null || lng == null) return false;
    try {
      const res = await fetch(`${this.schedulingUrl()}/technicians/by-user/${userId}/base-location`, {
        method: 'PATCH',
        headers: this.headers(companyId),
        body: JSON.stringify({ lat, lng }),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`base location push failed for ${userId}: ${(err as Error).message}`);
      return false;
    }
  }

  /** Repairs drift from pushes that failed while scheduling was unreachable. */
  async reconcileAll(): Promise<{ synced: number; failed: number }> {
    const users = await this.prisma.companyUser.findMany({
      where: { role: 'technician', latitude: { not: null }, longitude: { not: null } },
      select: { id: true, companyId: true, latitude: true, longitude: true },
    });

    let synced = 0;
    let failed = 0;
    for (const u of users) {
      const ok = await this.push(u.companyId, u.id, u.latitude!, u.longitude!);
      ok ? synced++ : failed++;
    }
    this.logger.log(`base location reconcile: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}
```

- [ ] **Step 4: Schedule the nightly reconcile**

`reconcileAll` repairs drift from pushes that failed while scheduling was down.
Without a schedule it is dead code and the drift is silent, which is the whole
risk the spec flags. `@nestjs/schedule` is already a dependency and
`apps/crm-service/src/iot/iot-alerts.service.ts:29` shows the house style
(6-field cron expressions).

Append to `base-location.service.ts`:

```ts
import { Cron } from '@nestjs/schedule';
```

and add this method to the class:

```ts
  /**
   * 02:30 daily. Pushes are best-effort, so without this a technician whose base
   * changed while scheduling was restarting would be scored from a stale
   * location indefinitely — and nothing would ever say so.
   */
  @Cron('0 30 2 * * *')
  async nightlyReconcile(): Promise<void> {
    const { synced, failed } = await this.reconcileAll();
    if (failed > 0) {
      this.logger.warn(`base location reconcile left ${failed} technician(s) unsynced`);
    } else {
      this.logger.log(`base location reconcile clean: ${synced} technician(s)`);
    }
  }
```

- [ ] **Step 5: Register the provider**

In `apps/crm-service/src/users/users.module.ts`, add `BaseLocationService` to
both `providers` and `exports`, and import it at the top. Confirm `ScheduleModule`
is already imported in `app.module.ts` (the IoT crons depend on it); if it is
not, the `@Cron` decorator silently never fires:

```bash
grep -n "ScheduleModule" apps/crm-service/src/app.module.ts
```

Expected: a match. If there is none, add `ScheduleModule.forRoot()` to the
`imports` array of `app.module.ts`.

- [ ] **Step 6: Run the test to verify it passes**

```bash
pnpm --filter crm-service test -- base-location
```

Expected: PASS (3 tests).

- [ ] **Step 7: Add the receiving endpoint in Go**

Append to `apps/scheduling-service/internal/handler/crew_handler.go`:

```go
// SetBaseLocation receives a technician's base from crm-service. Keyed by
// CompanyUser id, because that is the id crm holds; scheduling's own technician
// id means nothing on the other side of the boundary.
func (h *CrewHandler) SetBaseLocation(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var body struct {
		Lat float64 `json:"lat" binding:"required"`
		Lng float64 `json:"lng" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.crewRepo.SetBaseLocation(
		c.Request.Context(), claims.CompanyID, c.Param("userId"), body.Lat, body.Lng,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
```

Append to `crew_repo.go`:

```go
// SetBaseLocation writes the technician's home base, matched by their crm user id.
func (r *CrewRepository) SetBaseLocation(ctx context.Context, companyID, userID string, lat, lng float64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE scheduling.technicians
		SET    base_location = ST_SetSRID(ST_MakePoint($3, $4), 4326),
		       updated_at    = NOW()
		WHERE  company_id = $1 AND user_id = $2`,
		companyID, userID, lng, lat) // ST_MakePoint takes lng first
	return err
}
```

Register the route inside the existing `dispatch` group block in `main.go`:

```go
	r.PATCH("/technicians/by-user/:userId/base-location", auth, crewH.SetBaseLocation)
```

- [ ] **Step 8: Verify end to end**

```bash
cd apps/scheduling-service && go build ./...

curl -s -X PATCH "http://localhost:3003/technicians/by-user/user-tech-001/base-location" \
  -H "Content-Type: application/json" \
  -H "x-test-company-id: co-demo-001" -H "x-test-user-id: user-admin-001" \
  -H "x-test-user-role: company_admin" \
  -d '{"lat":6.9271,"lng":79.8612}' -w "\nHTTP %{http_code}\n"
```

Expected: HTTP 200. Then confirm the candidates endpoint returns a
`baseDistanceKm` for that technician.

- [ ] **Step 9: Commit**

```bash
git add apps/crm-service/src/users/base-location.service.ts \
        apps/crm-service/src/users/base-location.service.spec.ts \
        apps/crm-service/src/users/users.module.ts \
        apps/scheduling-service/internal/handler/crew_handler.go \
        apps/scheduling-service/internal/repository/crew_repo.go \
        apps/scheduling-service/cmd/server/main.go
git commit -m "feat: sync technician base location from crm to scheduling"
```

---

## Done when

- `node scripts/apply-migrations.mjs` is clean and the Task 1 Step 5 verification
  returns three zeros.
- `cd apps/scheduling-service && go test ./internal/...` passes.
- `pnpm --filter job-service test` and `pnpm --filter crm-service test` pass.
- `GET /dispatch/candidates` returns ranked technicians with conflicts.
- **Nothing behaves differently for existing jobs.** Every one is a crew of one
  with that technician as lead, and the dispatch boards look exactly as before.

## Not in this plan

The UI plan follows once these endpoints exist, so it can be written against
real response shapes rather than guesses. It covers the crew control center, the
crew-aware plan table, the `assignmentByJobId` fan-out (28 usages across four
components — the highest regression risk in the whole feature), the technician
app's crew visibility and non-lead permissions, and the crew email with photos.
