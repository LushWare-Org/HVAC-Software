package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/disruptions"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// SlotRepository reads what the slot finder needs: who can work, and what
// they are already committed to.
type SlotRepository struct {
	db *pgxpool.Pool
}

func NewSlotRepository(db *pgxpool.Pool) *SlotRepository {
	return &SlotRepository{db: db}
}

// CompanyTimezone is the company's IANA zone, "" when unknown.
func (r *SlotRepository) CompanyTimezone(ctx context.Context, companyID string) (string, error) {
	var tz *string
	err := r.db.QueryRow(ctx, `SELECT timezone FROM crm.companies WHERE id = $1`, companyID).Scan(&tz)
	if err != nil || tz == nil {
		return "", err
	}
	return *tz, nil
}

// ActiveTechnicians with where each starts the day: home base, else last known position.
func (r *SlotRepository) ActiveTechnicians(ctx context.Context, companyID string) ([]slots.Tech, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, COALESCE(skills, ARRAY[]::text[]), max_daily_jobs,
		       ST_Y(COALESCE(base_location, current_location)::geometry),
		       ST_X(COALESCE(base_location, current_location)::geometry)
		FROM   scheduling.technicians
		WHERE  company_id = $1 AND is_active = TRUE
		ORDER BY name`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []slots.Tech
	for rows.Next() {
		var t slots.Tech
		var lat, lng *float64
		if err := rows.Scan(&t.ID, &t.Name, &t.Skills, &t.MaxDailyJobs, &lat, &lng); err != nil {
			return nil, err
		}
		if lat != nil && lng != nil {
			t.Start = &slots.Point{Lat: *lat, Lng: *lng}
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// Bookings are live assignments overlapping [from, to), with the job's
// location. Same definition of "live" as FindConflicts, and a cancelled job
// never blocks time even if its assignment row was left open.
func (r *SlotRepository) Bookings(ctx context.Context, companyID string, from, to time.Time) ([]slots.Booking, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.technician_id, a.job_id, a.scheduled_start, a.scheduled_end,
		       j."serviceLatitude", j."serviceLongitude"
		FROM   scheduling.dispatch_assignments a
		JOIN   jobs.jobs j ON j.id = a.job_id
		WHERE  a.company_id = $1
		  AND  a.status NOT IN ('CANCELLED', 'COMPLETED')
		  AND  j.status::text <> 'CANCELLED'
		  AND  a.scheduled_start IS NOT NULL AND a.scheduled_end IS NOT NULL
		  AND  a.scheduled_start < $3 AND a.scheduled_end > $2`,
		companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []slots.Booking
	for rows.Next() {
		var b slots.Booking
		var lat, lng *float64
		if err := rows.Scan(&b.TechID, &b.JobID, &b.Start, &b.End, &lat, &lng); err != nil {
			return nil, err
		}
		if lat != nil && lng != nil && (*lat != 0 || *lng != 0) {
			b.At = &slots.Point{Lat: *lat, Lng: *lng}
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// TodayVisits are live visits overlapping [from, to) with their job's details.
// The job's status is the one that counts: it is what the technician app moves
// and what the customer is told.
func (r *SlotRepository) TodayVisits(ctx context.Context, companyID string, from, to time.Time) ([]disruptions.Visit, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.job_id, COALESCE(j."jobNumber", ''), COALESCE(j.title, ''),
		       COALESCE(j."customerId", ''), COALESCE(j."customerName", ''),
		       a.technician_id::text, t.name, j.status::text,
		       a.scheduled_start, a.scheduled_end, a.on_site_at,
		       j."serviceLatitude", j."serviceLongitude"
		FROM   scheduling.dispatch_assignments a
		JOIN   jobs.jobs j ON j.id = a.job_id
		JOIN   scheduling.technicians t ON t.id = a.technician_id
		WHERE  a.company_id = $1
		  AND  a.status NOT IN ('CANCELLED', 'COMPLETED')
		  AND  j.status::text IN ('PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE')
		  AND  a.scheduled_start IS NOT NULL AND a.scheduled_end IS NOT NULL
		  AND  a.scheduled_start < $3 AND a.scheduled_end > $2`,
		companyID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []disruptions.Visit
	for rows.Next() {
		var v disruptions.Visit
		var lat, lng *float64
		if err := rows.Scan(&v.JobID, &v.JobNumber, &v.Title, &v.CustomerID, &v.CustomerName,
			&v.TechID, &v.TechName, &v.Status, &v.Start, &v.End, &v.OnSiteAt, &lat, &lng); err != nil {
			return nil, err
		}
		if lat != nil && lng != nil && (*lat != 0 || *lng != 0) {
			v.At = &slots.Point{Lat: *lat, Lng: *lng}
		}
		out = append(out, v)
	}
	return out, rows.Err()
}

// LivePositions are technicians' GPS positions reported since `fresh`. Older
// fixes are left out: a position from hours ago would mislead every drive time.
func (r *SlotRepository) LivePositions(ctx context.Context, companyID string, fresh time.Time) (map[string]*slots.Point, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, ST_Y(current_location::geometry), ST_X(current_location::geometry)
		FROM   scheduling.technicians
		WHERE  company_id = $1 AND current_location IS NOT NULL AND last_seen_at >= $2`,
		companyID, fresh)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]*slots.Point{}
	for rows.Next() {
		var id string
		var lat, lng float64
		if err := rows.Scan(&id, &lat, &lng); err != nil {
			return nil, err
		}
		out[id] = &slots.Point{Lat: lat, Lng: lng}
	}
	return out, rows.Err()
}
