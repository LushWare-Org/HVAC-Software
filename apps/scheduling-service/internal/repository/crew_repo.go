package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

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
		       t.max_daily_jobs
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
			&m.Technician.MaxDailyJobs,
		); err != nil {
			return nil, err
		}
		m.Technician.ID = m.Assignment.TechnicianID
		m.Technician.CompanyID = companyID
		crew = append(crew, m)
	}
	return crew, rows.Err()
}
