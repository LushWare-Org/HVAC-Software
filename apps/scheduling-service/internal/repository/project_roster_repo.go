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

// JobProjectID returns the project a job belongs to ("" when unlinked) so
// project-owned jobs are exempt from the roster block.
func (r *ProjectRosterRepository) JobProjectID(
	ctx context.Context,
	companyID string,
	jobID string,
) (string, error) {
	var projectID *string
	err := r.db.QueryRow(ctx, `
		SELECT "projectId" FROM jobs.jobs
		WHERE id = $1 AND "companyId" = $2`,
		jobID, companyID,
	).Scan(&projectID)
	if err != nil {
		return "", err
	}
	if projectID == nil {
		return "", nil
	}
	return *projectID, nil
}
