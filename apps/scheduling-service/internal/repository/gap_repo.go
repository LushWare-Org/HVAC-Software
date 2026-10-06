package repository

import (
	"context"
	"time"

	"github.com/tscrm/scheduling-service/internal/gaps"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// FreedVisits are cancelled jobs whose technician was still booked for them
// in [from, to). Cancelling a job leaves its assignment open, so the live
// assignment rows of a cancelled job are exactly the time it gave back.
// jobs.jobs stores UTC wall-clock times without a zone, hence AT TIME ZONE.
func (r *SlotRepository) FreedVisits(ctx context.Context, companyID string, from, to time.Time) ([]gaps.Freed, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.job_id::text, COALESCE(j."jobNumber", ''), COALESCE(j."customerName", ''),
		       COALESCE(j."cancellationReason", ''), a.technician_id::text, t.name,
		       a.scheduled_start, a.scheduled_end, j."serviceLatitude", j."serviceLongitude",
		       j."updatedAt" AT TIME ZONE 'UTC'
		FROM   scheduling.dispatch_assignments a
		JOIN   jobs.jobs j ON j.id = a.job_id
		JOIN   scheduling.technicians t ON t.id = a.technician_id
		WHERE  a.company_id = $1
		  AND  a.status NOT IN ('CANCELLED', 'COMPLETED')
		  AND  j.status::text = 'CANCELLED'
		  AND  a.scheduled_start IS NOT NULL AND a.scheduled_end IS NOT NULL
		  AND  a.scheduled_start < $3 AND a.scheduled_end > $2
		ORDER BY a.scheduled_start`,
		companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []gaps.Freed
	for rows.Next() {
		var f gaps.Freed
		var lat, lng *float64
		if err := rows.Scan(&f.JobID, &f.JobNumber, &f.Customer, &f.Reason, &f.TechID, &f.TechName,
			&f.Start, &f.End, &lat, &lng, &f.CancelledAt); err != nil {
			return nil, err
		}
		f.At = point(lat, lng)
		out = append(out, f)
	}
	return out, rows.Err()
}

// FillCandidates is open work that could fill a gap: jobs nobody has yet, and
// single-technician visits booked in [from, to) that could come forward. Crew
// jobs are left out; moving one moves several people's days.
func (r *SlotRepository) FillCandidates(ctx context.Context, companyID string, from, to time.Time) ([]gaps.Candidate, error) {
	rows, err := r.db.Query(ctx, `
		SELECT j.id::text, COALESCE(j."jobNumber", ''), COALESCE(j.title, ''), COALESCE(j."customerName", ''),
		       j.priority::text, COALESCE(j."estimatedDurationMins", 0),
		       j."serviceLatitude", j."serviceLongitude",
		       COALESCE(live.technician_id::text, ''), live.scheduled_start,
		       j."createdAt" AT TIME ZONE 'UTC'
		FROM   jobs.jobs j
		LEFT JOIN LATERAL (
		       SELECT a.technician_id, a.scheduled_start, count(*) OVER () AS crew
		       FROM   scheduling.dispatch_assignments a
		       WHERE  a.job_id = j.id AND a.status NOT IN ('CANCELLED', 'COMPLETED')
		       ORDER BY a.is_lead DESC, a.updated_at DESC
		       LIMIT 1
		) live ON TRUE
		WHERE  j."companyId" = $1
		  AND  j.status::text IN ('PENDING', 'SCHEDULED')
		  AND  j."rescheduleState" IS NULL
		  AND  (live.technician_id IS NULL
		        OR (live.crew = 1 AND live.scheduled_start >= $2 AND live.scheduled_start < $3))
		ORDER BY j."createdAt" DESC
		LIMIT 300`,
		companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []gaps.Candidate
	for rows.Next() {
		var c gaps.Candidate
		var mins int
		var lat, lng *float64
		if err := rows.Scan(&c.JobID, &c.JobNumber, &c.Title, &c.Customer, &c.Priority, &mins,
			&lat, &lng, &c.TechID, &c.Current, &c.CreatedAt); err != nil {
			return nil, err
		}
		c.Duration = time.Duration(mins) * time.Minute
		c.At = point(lat, lng)
		out = append(out, c)
	}
	return out, rows.Err()
}

func point(lat, lng *float64) *slots.Point {
	if lat != nil && lng != nil && (*lat != 0 || *lng != 0) {
		return &slots.Point{Lat: *lat, Lng: *lng}
	}
	return nil
}
