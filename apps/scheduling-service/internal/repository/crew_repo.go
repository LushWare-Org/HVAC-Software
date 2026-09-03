package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

var (
	// ErrNotOnCrew: handing the lead to someone who is not assigned. Rejected
	// rather than auto-adding them, because a lead who is not on site is worse
	// than no change at all.
	ErrNotOnCrew = errors.New("technician is not on this crew")
	// ErrAlreadyCheckedOut: they have finished and gone home. A departed lead is
	// the problem handover exists to solve, so it must not create one.
	ErrAlreadyCheckedOut = errors.New("technician has already left this job")
	// ErrLeadNotInCrew: the named lead is not in the technician list. Rejected
	// rather than silently added, so the caller's intent is never guessed at.
	ErrLeadNotInCrew = errors.New("lead must be one of the assigned technicians")
)

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

// CrewRepository reads and writes the set of technicians assigned to a job.
//
// Kept separate from AssignmentRepository because "who is on this job" is a
// different question from "what is this one assignment", and the two are
// reviewed and changed independently.
type CrewRepository struct {
	db *pgxpool.Pool
}

func NewCrewRepository(db *pgxpool.Pool) *CrewRepository {
	return &CrewRepository{db: db}
}

// FindCrew returns every live member of a job's crew, lead first and then by
// assignment time, so the display order is stable across refreshes rather than
// reshuffling whenever a row is touched.
func (r *CrewRepository) FindCrew(ctx context.Context, companyID, jobID string) ([]models.CrewMember, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.company_id, a.job_id, a.technician_id, a.status,
		       a.is_lead, a.score, a.distance_km, a.base_distance_km,
		       a.assigned_at, a.scheduled_start, a.scheduled_end,
		       t.user_id, t.name, t.phone, t.avatar_url, t.skills, t.rating,
		       t.max_daily_jobs,
		       ST_Y(COALESCE(t.base_location, t.current_location)::geometry),
		       ST_X(COALESCE(t.base_location, t.current_location)::geometry)
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
		var baseLat, baseLng *float64
		if err := rows.Scan(
			&m.Assignment.ID, &m.Assignment.CompanyID, &m.Assignment.JobID,
			&m.Assignment.TechnicianID, &m.Assignment.Status, &m.Assignment.IsLead,
			&m.Assignment.Score, &m.Assignment.DistanceKm, &m.Assignment.BaseDistanceKm,
			&m.Assignment.AssignedAt, &m.Assignment.ScheduledStart, &m.Assignment.ScheduledEnd,
			&m.Technician.UserID, &m.Technician.Name, &m.Technician.Phone,
			&m.Technician.AvatarURL, &m.Technician.Skills, &m.Technician.Rating,
			&m.Technician.MaxDailyJobs, &baseLat, &baseLng,
		); err != nil {
			return nil, err
		}
		m.Technician.ID = m.Assignment.TechnicianID
		m.Technician.CompanyID = companyID
		// Base where known, live position otherwise, so the crew map can pin
		// every member rather than only the ones who have set a base.
		if baseLat != nil && baseLng != nil {
			m.Technician.BaseLocation = &models.GeoPoint{Lat: *baseLat, Lng: *baseLng}
		}
		crew = append(crew, m)
	}
	return crew, rows.Err()
}

// SetLead moves the lead flag to technicianID.
//
// The two rows MUST be updated as unset-then-set inside a transaction. A partial
// unique index cannot be deferred in Postgres, so a single UPDATE touching both
// rows can transiently violate uq_assignment_job_lead depending on the order the
// planner visits them.
//
// Measured 2026-09-03: the single-statement form happened to SUCCEED against
// live data, because the planner reached the outgoing lead before the incoming
// one. That is luck, not correctness — the order is not guaranteed, so the
// one-statement version is a bug that passes in development and fails in
// production under a different plan. Two statements cannot fail either way.
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

	// Who is being replaced, for the audit trail. Empty on the first assignment
	// of a lead, which is legitimate rather than an error.
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

// recordCrewEvent appends to the jobs-schema audit trail. Cross-schema write
// inside the caller's transaction, so an event never survives a rolled-back
// change.
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
	// than recording a vague "crew changed".
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

// SetBaseLocation writes the technician's home base, matched by their crm user
// id. ST_MakePoint takes longitude first — a classic source of points landing in
// the wrong hemisphere.
func (r *CrewRepository) SetBaseLocation(ctx context.Context, companyID, userID string, lat, lng float64) error {
	_, err := r.db.Exec(ctx, `
		UPDATE scheduling.technicians
		SET    base_location = ST_SetSRID(ST_MakePoint($3, $4), 4326),
		       updated_at    = NOW()
		WHERE  company_id = $1 AND user_id = $2`,
		companyID, userID, lng, lat)
	return err
}
