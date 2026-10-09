package repository

// ProjectRosterRepository — cross-schema reads of crm.projects /
// crm.project_roster_days so rostered technicians become reserved capacity
// for job assignment (spec: docs/superpowers/specs/2026-07-04-projects-module-design.md).
//
// Effective roster rule (must match crm-service roster.util.ts):
//   non-ACTIVE project → nobody; override row → its techUserIds (empty when
//   isOff); else base team when date ∈ [startDate, targetEndDate] and the
//   weekday is in workingDays.

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

type ProjectRosterRepository struct {
	db *pgxpool.Pool
}

func NewProjectRosterRepository(db *pgxpool.Pool) *ProjectRosterRepository {
	return &ProjectRosterRepository{db: db}
}

// RosteredTechUserIDs returns, for a calendar date (YYYY-MM-DD), a map of
// crm CompanyUser id → the project that reserves them that day.
func (r *ProjectRosterRepository) RosteredTechUserIDs(
	ctx context.Context,
	companyID string,
	date string,
) (map[string]models.RosterInfo, error) {
	rows, err := r.db.Query(ctx, `
		WITH eff AS (
		  SELECT p.id, p.name,
		    CASE
		      WHEN o.id IS NOT NULL AND o."isOff" THEN ARRAY[]::TEXT[]
		      WHEN o.id IS NOT NULL THEN o."techUserIds"
		      WHEN ($2::date >= COALESCE(p."startDate"::date, $2::date))
		       AND ($2::date <= COALESCE(p."targetEndDate"::date, $2::date))
		       AND ((ARRAY['SUN','MON','TUE','WED','THU','FRI','SAT'])[EXTRACT(DOW FROM $2::date)::int + 1] = ANY(p."workingDays"))
		      THEN p."baseTeamUserIds"
		      ELSE ARRAY[]::TEXT[]
		    END AS ids
		  FROM crm.projects p
		  LEFT JOIN crm.project_roster_days o
		    ON o."projectId" = p.id AND o.date = $2::date
		  WHERE p."companyId" = $1 AND p.status = 'ACTIVE'
		)
		SELECT e.id::text, e.name, uid
		FROM eff e, unnest(e.ids) AS uid`,
		companyID, date,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[string]models.RosterInfo)
	for rows.Next() {
		var projectID, projectName, userID string
		if err := rows.Scan(&projectID, &projectName, &userID); err != nil {
			return nil, err
		}
		out[userID] = models.RosterInfo{ProjectID: projectID, ProjectName: projectName}
	}
	return out, rows.Err()
}

// JobFacts returns the job's project, priority and scheduled start, plus the
// company's time zone, in one read. Project-owned jobs are exempt from the
// roster block, emergencies may use rostered technicians, and the time zone
// decides which day the job is on.
func (r *ProjectRosterRepository) JobFacts(ctx context.Context, companyID, jobID string) (models.JobFacts, error) {
	var f models.JobFacts
	var projectID, priority, tz *string
	var mode *string
	var dur *int
	err := r.db.QueryRow(ctx, `
		SELECT j."projectId", j.priority::text, j."scheduledStart", c.timezone,
		       j."timeMode", j."windowStart", j."windowEnd", j."estimatedDurationMins"
		FROM jobs.jobs j
		LEFT JOIN crm.companies c ON c.id = j."companyId"
		WHERE j.id = $1 AND j."companyId" = $2`,
		jobID, companyID,
	).Scan(&projectID, &priority, &f.ScheduledStart, &tz, &mode, &f.WindowStart, &f.WindowEnd, &dur)
	if err != nil {
		return f, err
	}
	if mode != nil {
		f.TimeMode = *mode
	}
	if dur != nil {
		f.DurationMins = *dur
	}
	if projectID != nil {
		f.ProjectID = *projectID
	}
	if priority != nil {
		f.Priority = *priority
	}
	if tz != nil {
		f.Timezone = *tz
	}
	return f, nil
}

// TechUserIDs maps scheduling technician ids to their crm user ids.
func (r *ProjectRosterRepository) TechUserIDs(ctx context.Context, companyID string, techIDs []string) (map[string]string, error) {
	out := map[string]string{}
	if len(techIDs) == 0 {
		return out, nil
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, COALESCE(user_id, '') FROM scheduling.technicians
		WHERE company_id = $1 AND id = ANY($2)`,
		companyID, techIDs,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id, userID string
		if err := rows.Scan(&id, &userID); err != nil {
			return nil, err
		}
		out[id] = userID
	}
	return out, rows.Err()
}
