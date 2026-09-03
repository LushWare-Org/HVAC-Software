package repository

import (
	"context"
	"math"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

// Overlaps reports whether two half-open intervals [start, end) intersect.
//
// Half-open matters: back-to-back jobs are the normal shape of a day's route, so
// treating a job that ends exactly when another starts as a conflict would flag
// nearly every technician and make the warning meaningless.
//
// This is the reference implementation of the semantics FindConflicts expresses
// in SQL (scheduled_start < $end AND scheduled_end > $start). The two must agree;
// the tests here are what pin the definition down.
func Overlaps(aStart, aEnd, bStart, bEnd time.Time) bool {
	return aStart.Before(bEnd) && bStart.Before(aEnd)
}

// haversineKm is straight-line distance in kilometres.
//
// A sibling copy lives in internal/service/eta.go. Duplicated rather than shared
// because a repository importing the service package would invert the dependency
// direction; worth extracting to an internal/geo package if a third copy appears.
func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
	const earthKm = 6371.0
	rad := func(d float64) float64 { return d * math.Pi / 180 }
	dLat, dLng := rad(lat2-lat1), rad(lng2-lng1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rad(lat1))*math.Cos(rad(lat2))*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthKm * math.Asin(math.Sqrt(a))
}

// ConflictRepository answers "what else is this technician already booked for".
type ConflictRepository struct {
	db *pgxpool.Pool
}

func NewConflictRepository(db *pgxpool.Pool) *ConflictRepository {
	return &ConflictRepository{db: db}
}

// FindConflicts returns, per technician id, the live assignments overlapping
// [start, end). siteLat/siteLng are optional; when present each conflict carries
// straight-line distance from the proposed job's site, which is what lets a
// dispatcher judge whether a clash actually matters.
//
// The window is the job's own scheduled date, not today: overlaps on a future
// day are the normal case when planning ahead.
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
