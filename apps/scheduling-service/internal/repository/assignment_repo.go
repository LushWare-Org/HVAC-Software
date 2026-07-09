package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

// AssignmentRepository handles CRUD for dispatch_assignments and gps_tracking.
type AssignmentRepository struct {
	db *pgxpool.Pool
}

func NewAssignmentRepository(db *pgxpool.Pool) *AssignmentRepository {
	return &AssignmentRepository{db: db}
}

// Create inserts a new dispatch assignment.
// score and distanceKm are optional (nil for manually assigned without scoring).
func (r *AssignmentRepository) Create(
	ctx context.Context,
	companyID, jobID, technicianID string,
	status models.AssignmentStatus,
	score *float64,
	distanceKm *float64,
	assignedBy *string,
	scheduledStart *time.Time,
	scheduledEnd *time.Time,
	notes *string,
) (*models.DispatchAssignment, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO scheduling.dispatch_assignments
			(company_id, job_id, technician_id, status, score, distance_km,
			 assigned_by, scheduled_start, scheduled_end, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		          score, distance_km, assigned_by, assigned_at,
		          en_route_at, on_site_at, completed_at,
		          scheduled_start, scheduled_end, notes,
		          created_at, updated_at`,
		companyID, jobID, technicianID, string(status), score, distanceKm,
		assignedBy, scheduledStart, scheduledEnd, notes,
	)
	return scanAssignment(row)
}

// CreateSuggested inserts a SUGGESTED (not yet confirmed) assignment.
// Used when auto-assign score < threshold; dispatcher confirms later via ManualAssign.
func (r *AssignmentRepository) CreateSuggested(
	ctx context.Context,
	companyID, jobID, technicianID string,
	score, distanceKm float64,
) (*models.DispatchAssignment, error) {
	s := score
	d := distanceKm
	status := models.StatusSuggested
	row := r.db.QueryRow(ctx, `
		INSERT INTO scheduling.dispatch_assignments
			(company_id, job_id, technician_id, status, score, distance_km)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		          score, distance_km, assigned_by, assigned_at,
		          en_route_at, on_site_at, completed_at,
		          scheduled_start, scheduled_end, notes,
		          created_at, updated_at`,
		companyID, jobID, technicianID, string(status), s, d,
	)
	return scanAssignment(row)
}

// FindByID fetches a single assignment scoped to a company.
func (r *AssignmentRepository) FindByID(ctx context.Context, companyID, id string) (*models.DispatchAssignment, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, company_id, job_id, work_order_id, technician_id, status,
		       score, distance_km, assigned_by, assigned_at,
		       en_route_at, on_site_at, completed_at,
		       scheduled_start, scheduled_end, notes,
		       created_at, updated_at
		FROM scheduling.dispatch_assignments
		WHERE id = $1 AND company_id = $2`, id, companyID)
	a, err := scanAssignment(row)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	return a, err
}

// FindByJob returns all assignments for a job, ordered newest first.
func (r *AssignmentRepository) FindByJob(ctx context.Context, companyID, jobID string) ([]*models.DispatchAssignment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, job_id, work_order_id, technician_id, status,
		       score, distance_km, assigned_by, assigned_at,
		       en_route_at, on_site_at, completed_at,
		       scheduled_start, scheduled_end, notes,
		       created_at, updated_at
		FROM scheduling.dispatch_assignments
		WHERE company_id = $1 AND job_id = $2
		ORDER BY created_at DESC`, companyID, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectAssignments(rows)
}

// FindByTechnician returns assignments for a technician, with optional status filter.
func (r *AssignmentRepository) FindByTechnician(
	ctx context.Context,
	companyID, technicianID string,
	statusFilter []models.AssignmentStatus,
) ([]*models.DispatchAssignment, error) {
	if len(statusFilter) == 0 {
		rows, err := r.db.Query(ctx, `
			SELECT id, company_id, job_id, work_order_id, technician_id, status,
			       score, distance_km, assigned_by, assigned_at,
			       en_route_at, on_site_at, completed_at,
			       scheduled_start, scheduled_end, notes,
			       created_at, updated_at
			FROM scheduling.dispatch_assignments
			WHERE company_id = $1 AND technician_id = $2
			ORDER BY created_at DESC
			LIMIT 50`, companyID, technicianID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return collectAssignments(rows)
	}

	// Convert []AssignmentStatus to []string for pgx TEXT array parameter
	statuses := make([]string, len(statusFilter))
	for i, s := range statusFilter {
		statuses[i] = string(s)
	}
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, job_id, work_order_id, technician_id, status,
		       score, distance_km, assigned_by, assigned_at,
		       en_route_at, on_site_at, completed_at,
		       scheduled_start, scheduled_end, notes,
		       created_at, updated_at
		FROM scheduling.dispatch_assignments
		WHERE company_id = $1 AND technician_id = $2
		  AND status = ANY($3::scheduling.assignment_status[])
		ORDER BY scheduled_start ASC NULLS LAST`, companyID, technicianID, statuses)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectAssignments(rows)
}

// UpdateStatus transitions an assignment to a new status, setting the relevant timestamp.
func (r *AssignmentRepository) UpdateStatus(
	ctx context.Context,
	companyID, id string,
	status models.AssignmentStatus,
	notes *string,
) (*models.DispatchAssignment, error) {
	now := time.Now()

	// Set the appropriate timestamp field based on status
	var query string
	switch status {
	case models.StatusEnRoute:
		query = `UPDATE scheduling.dispatch_assignments
		         SET status = $1, en_route_at = $2, notes = COALESCE($3, notes), updated_at = $2
		         WHERE id = $4 AND company_id = $5
		         RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		                   score, distance_km, assigned_by, assigned_at,
		                   en_route_at, on_site_at, completed_at,
		                   scheduled_start, scheduled_end, notes, created_at, updated_at`
	case models.StatusOnSite:
		query = `UPDATE scheduling.dispatch_assignments
		         SET status = $1, on_site_at = $2, notes = COALESCE($3, notes), updated_at = $2
		         WHERE id = $4 AND company_id = $5
		         RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		                   score, distance_km, assigned_by, assigned_at,
		                   en_route_at, on_site_at, completed_at,
		                   scheduled_start, scheduled_end, notes, created_at, updated_at`
	case models.StatusCompleted:
		query = `UPDATE scheduling.dispatch_assignments
		         SET status = $1, completed_at = $2, notes = COALESCE($3, notes), updated_at = $2
		         WHERE id = $4 AND company_id = $5
		         RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		                   score, distance_km, assigned_by, assigned_at,
		                   en_route_at, on_site_at, completed_at,
		                   scheduled_start, scheduled_end, notes, created_at, updated_at`
	default:
		query = `UPDATE scheduling.dispatch_assignments
		         SET status = $1, notes = COALESCE($3, notes), updated_at = $2
		         WHERE id = $4 AND company_id = $5
		         RETURNING id, company_id, job_id, work_order_id, technician_id, status,
		                   score, distance_km, assigned_by, assigned_at,
		                   en_route_at, on_site_at, completed_at,
		                   scheduled_start, scheduled_end, notes, created_at, updated_at`
	}

	row := r.db.QueryRow(ctx, query, string(status), now, notes, id, companyID)
	a, err := scanAssignment(row)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("assignment not found")
	}
	return a, err
}

// InsertGPSPoint writes a single GPS tracking record.
// High-frequency writes — we don't RETURNING here for performance.
func (r *AssignmentRepository) InsertGPSPoint(
	ctx context.Context,
	technicianID, companyID string,
	lat, lng float64,
	accuracyM *float32,
	speedKmh *float32,
	headingDeg *float32,
	batteryPct *int16,
) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO scheduling.gps_tracking
			(technician_id, company_id, location, accuracy_m, speed_kmh, heading_deg, battery_pct)
		VALUES ($1, $2, ST_SetSRID(ST_MakePoint($4, $3), 4326), $5, $6, $7, $8)`,
		technicianID, companyID, lat, lng, accuracyM, speedKmh, headingDeg, batteryPct,
	)
	return err
}

// CancelActiveForJob sets status=CANCELLED for any non-terminal assignment
// (SUGGESTED, ASSIGNED, EN_ROUTE, ON_SITE) on the given job.
// Call this before Create() when reassigning so the old assignment doesn't
// linger as "active" alongside the new one.
// Returns the number of rows updated (0 = no prior assignment existed).
func (r *AssignmentRepository) CancelActiveForJob(ctx context.Context, companyID, jobID string) (int64, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE scheduling.dispatch_assignments
		SET    status     = 'CANCELLED',
		       updated_at = NOW()
		WHERE  company_id = $1
		  AND  job_id     = $2
		  AND  status NOT IN ('COMPLETED', 'CANCELLED')`,
		companyID, jobID)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

// SyncJobAssignment updates the job in the jobs schema to reflect the new assignment.
// Uses cross-schema query since all services share the same PostgreSQL instance.
func (r *AssignmentRepository) SyncJobAssignment(ctx context.Context, companyID, jobID, techUserID, techName string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE jobs.jobs SET
			"assignedToId" = $1,
			"assignedToName" = $2,
			status = CASE WHEN status = 'PENDING' THEN 'SCHEDULED' ELSE status END,
			"updatedAt" = NOW()
		WHERE id = $3 AND "companyId" = $4`,
		techUserID, techName, jobID, companyID)
	return err
}

// JobEnRouteInfo carries the job fields needed for the en-route customer notification.
type JobEnRouteInfo struct {
	Title          string
	CustomerName   *string
	CustomerEmail  *string
	CustomerPhone  *string
	ServiceAddress *string
	Latitude       *float64
	Longitude      *float64
}

// GetJobEnRouteInfo reads customer contact + location for a job (cross-schema).
func (r *AssignmentRepository) GetJobEnRouteInfo(ctx context.Context, companyID, jobID string) (*JobEnRouteInfo, error) {
	var info JobEnRouteInfo
	err := r.db.QueryRow(ctx, `
		SELECT title, "customerName", "customerEmail", "customerPhone", "serviceAddress",
		       "serviceLatitude"::float8, "serviceLongitude"::float8
		FROM jobs.jobs
		WHERE id = $1 AND "companyId" = $2`,
		jobID, companyID).
		Scan(&info.Title, &info.CustomerName, &info.CustomerEmail, &info.CustomerPhone,
			&info.ServiceAddress, &info.Latitude, &info.Longitude)
	if err != nil {
		return nil, err
	}
	return &info, nil
}

// GetTechnicianUserInfo returns the userId and name from the scheduling.technicians table.
func (r *AssignmentRepository) GetTechnicianUserInfo(ctx context.Context, techID string) (userID, name string, err error) {
	err = r.db.QueryRow(ctx,
		`SELECT user_id, name FROM scheduling.technicians WHERE id = $1`, techID).
		Scan(&userID, &name)
	return
}

// DB exposes the underlying connection pool for ad-hoc cross-schema queries.
func (r *AssignmentRepository) DB() *pgxpool.Pool {
	return r.db
}

// ---- scanners ----

func scanAssignment(row pgx.Row) (*models.DispatchAssignment, error) {
	var a models.DispatchAssignment
	var statusStr string
	err := row.Scan(
		&a.ID, &a.CompanyID, &a.JobID, &a.WorkOrderID, &a.TechnicianID, &statusStr,
		&a.Score, &a.DistanceKm, &a.AssignedBy, &a.AssignedAt,
		&a.EnRouteAt, &a.OnSiteAt, &a.CompletedAt,
		&a.ScheduledStart, &a.ScheduledEnd, &a.Notes,
		&a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	a.Status = models.AssignmentStatus(statusStr)
	return &a, nil
}

func collectAssignments(rows pgx.Rows) ([]*models.DispatchAssignment, error) {
	var result []*models.DispatchAssignment
	for rows.Next() {
		var a models.DispatchAssignment
		var statusStr string
		err := rows.Scan(
			&a.ID, &a.CompanyID, &a.JobID, &a.WorkOrderID, &a.TechnicianID, &statusStr,
			&a.Score, &a.DistanceKm, &a.AssignedBy, &a.AssignedAt,
			&a.EnRouteAt, &a.OnSiteAt, &a.CompletedAt,
			&a.ScheduledStart, &a.ScheduledEnd, &a.Notes,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		a.Status = models.AssignmentStatus(statusStr)
		result = append(result, &a)
	}
	return result, rows.Err()
}
