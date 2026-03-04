package repository

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/tscrm/scheduling-service/internal/models"
)

// TechnicianRepository handles all DB operations on scheduling.technicians.
// PostGIS is used for:
//   - ST_Distance: haversine distance between technician and job (in metres → km)
//   - ST_DWithin: radius pre-filter (indexed, fast)
//   - ST_MakePoint: building geometry from lat/lng
type TechnicianRepository struct {
	db *pgxpool.Pool
}

func NewTechnicianRepository(db *pgxpool.Pool) *TechnicianRepository {
	return &TechnicianRepository{db: db}
}

// Create inserts a new technician profile.
func (r *TechnicianRepository) Create(ctx context.Context, companyID string, req models.CreateTechnicianRequest) (*models.Technician, error) {
	maxDailyJobs := 8
	if req.MaxDailyJobs != nil {
		maxDailyJobs = *req.MaxDailyJobs
	}
	skills := req.Skills
	if skills == nil {
		skills = []string{}
	}

	row := r.db.QueryRow(ctx, `
		INSERT INTO scheduling.technicians
			(company_id, user_id, name, phone, avatar_url, skills, max_daily_jobs)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
		          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		          created_at, updated_at`,
		companyID, req.UserID, req.Name, req.Phone, req.AvatarURL, skills, maxDailyJobs,
	)

	return scanTechnician(row)
}

// FindByID returns a single technician scoped to a company.
func (r *TechnicianRepository) FindByID(ctx context.Context, companyID, id string) (*models.Technician, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, company_id, user_id, name, phone, avatar_url, skills,
		       max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		       created_at, updated_at
		FROM scheduling.technicians
		WHERE id = $1 AND company_id = $2`, id, companyID)

	t, err := scanTechnician(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("technician not found")
		}
		return nil, err
	}
	return t, nil
}

// FindByUserID finds a technician by their Auth0 sub (user_id).
func (r *TechnicianRepository) FindByUserID(ctx context.Context, companyID, userID string) (*models.Technician, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, company_id, user_id, name, phone, avatar_url, skills,
		       max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		       created_at, updated_at
		FROM scheduling.technicians
		WHERE user_id = $1 AND company_id = $2`, userID, companyID)

	t, err := scanTechnician(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil // not an error — caller checks nil
		}
		return nil, err
	}
	return t, nil
}

// ListActive returns all active technicians for a company.
func (r *TechnicianRepository) ListActive(ctx context.Context, companyID string) ([]*models.Technician, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, user_id, name, phone, avatar_url, skills,
		       max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		       created_at, updated_at
		FROM scheduling.technicians
		WHERE company_id = $1 AND is_active = TRUE
		ORDER BY name`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectTechnicians(rows)
}

// FindCandidatesNearby returns active technicians within maxDistanceKm of a job location.
// Also returns the distance in km for each technician.
// We use ST_DWithin for indexed radius pre-filtering, then ST_Distance for exact distance.
//
// The requiredSkills filter is applied in Go rather than SQL to avoid complex array-overlap
// queries that bypass the spatial index — the radius filter already narrows the set significantly.
func (r *TechnicianRepository) FindCandidatesNearby(
	ctx context.Context,
	companyID string,
	jobLat, jobLng float64,
	maxDistanceKm float64,
	requiredSkills []string,
) ([]TechnicianWithDistance, error) {

	maxDistanceM := maxDistanceKm * 1000

	rows, err := r.db.Query(ctx, `
		SELECT t.id, t.company_id, t.user_id, t.name, t.phone, t.avatar_url, t.skills,
		       t.max_daily_jobs, t.is_active, t.rating, t.total_ratings, t.last_seen_at,
		       t.created_at, t.updated_at,
		       ST_Distance(
		         t.current_location::geography,
		         ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography
		       ) / 1000.0 AS distance_km
		FROM scheduling.technicians t
		WHERE t.company_id = $1
		  AND t.is_active = TRUE
		  AND t.current_location IS NOT NULL
		  AND ST_DWithin(
		        t.current_location::geography,
		        ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
		        $4
		      )
		ORDER BY distance_km ASC
		LIMIT 20`,
		companyID, jobLat, jobLng, maxDistanceM,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []TechnicianWithDistance
	for rows.Next() {
		var twd TechnicianWithDistance
		var skills []string
		err := rows.Scan(
			&twd.Technician.ID, &twd.Technician.CompanyID, &twd.Technician.UserID,
			&twd.Technician.Name, &twd.Technician.Phone, &twd.Technician.AvatarURL,
			&skills,
			&twd.Technician.MaxDailyJobs, &twd.Technician.IsActive,
			&twd.Technician.Rating, &twd.Technician.TotalRatings,
			&twd.Technician.LastSeenAt,
			&twd.Technician.CreatedAt, &twd.Technician.UpdatedAt,
			&twd.DistanceKm,
		)
		if err != nil {
			return nil, err
		}
		twd.Technician.Skills = skills

		// Apply skills filter in Go (avoids GIN index interference with spatial index)
		if len(requiredSkills) > 0 && !hasRequiredSkills(skills, requiredSkills) {
			continue
		}
		results = append(results, twd)
	}
	return results, rows.Err()
}

// CountActiveJobsForTechnicians returns a map[technicianID]activeJobCount.
// "Active" = ASSIGNED, EN_ROUTE, or ON_SITE.
func (r *TechnicianRepository) CountActiveJobsForTechnicians(
	ctx context.Context,
	companyID string,
	technicianIDs []string,
) (map[string]int, error) {
	if len(technicianIDs) == 0 {
		return map[string]int{}, nil
	}

	// Build $N placeholders for the IN clause
	placeholders := make([]string, len(technicianIDs))
	args := []interface{}{companyID}
	for i, id := range technicianIDs {
		args = append(args, id)
		placeholders[i] = fmt.Sprintf("$%d", i+2)
	}

	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT technician_id, COUNT(*) as active_jobs
		FROM scheduling.dispatch_assignments
		WHERE company_id = $1
		  AND technician_id IN (%s)
		  AND status IN ('ASSIGNED', 'EN_ROUTE', 'ON_SITE')
		GROUP BY technician_id`, strings.Join(placeholders, ",")),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]int)
	for rows.Next() {
		var techID string
		var count int
		if err := rows.Scan(&techID, &count); err != nil {
			return nil, err
		}
		result[techID] = count
	}
	return result, rows.Err()
}

// UpdateLocation stores the latest GPS point for a technician.
// Also updates last_seen_at timestamp.
func (r *TechnicianRepository) UpdateLocation(
	ctx context.Context,
	technicianID string,
	lat, lng float64,
) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE scheduling.technicians
		SET current_location = ST_SetSRID(ST_MakePoint($2, $1), 4326),
		    last_seen_at = $3,
		    updated_at = $3
		WHERE id = $4`,
		lat, lng, now, technicianID,
	)
	return err
}

// UpdateTechnician patches mutable fields. Nil fields are skipped.
func (r *TechnicianRepository) UpdateTechnician(
	ctx context.Context,
	companyID, id string,
	req models.UpdateTechnicianRequest,
) (*models.Technician, error) {
	existing, err := r.FindByID(ctx, companyID, id)
	if err != nil {
		return nil, err
	}

	name := existing.Name
	if req.Name != nil {
		name = *req.Name
	}
	phone := existing.Phone
	if req.Phone != nil {
		phone = req.Phone
	}
	avatarURL := existing.AvatarURL
	if req.AvatarURL != nil {
		avatarURL = req.AvatarURL
	}
	skills := existing.Skills
	if req.Skills != nil {
		skills = req.Skills
	}
	maxDailyJobs := existing.MaxDailyJobs
	if req.MaxDailyJobs != nil {
		maxDailyJobs = *req.MaxDailyJobs
	}
	isActive := existing.IsActive
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	row := r.db.QueryRow(ctx, `
		UPDATE scheduling.technicians
		SET name = $1, phone = $2, avatar_url = $3, skills = $4,
		    max_daily_jobs = $5, is_active = $6, updated_at = NOW()
		WHERE id = $7 AND company_id = $8
		RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
		          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		          created_at, updated_at`,
		name, phone, avatarURL, skills, maxDailyJobs, isActive, id, companyID,
	)
	return scanTechnician(row)
}

// ---- helper types & functions ----

// TechnicianWithDistance extends Technician with the PostGIS-computed distance.
type TechnicianWithDistance struct {
	Technician  models.Technician
	DistanceKm  float64
}

func scanTechnician(row pgx.Row) (*models.Technician, error) {
	var t models.Technician
	var skills []string
	err := row.Scan(
		&t.ID, &t.CompanyID, &t.UserID, &t.Name, &t.Phone, &t.AvatarURL,
		&skills,
		&t.MaxDailyJobs, &t.IsActive, &t.Rating, &t.TotalRatings,
		&t.LastSeenAt,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	t.Skills = skills
	return &t, nil
}

func collectTechnicians(rows pgx.Rows) ([]*models.Technician, error) {
	var result []*models.Technician
	for rows.Next() {
		var t models.Technician
		var skills []string
		err := rows.Scan(
			&t.ID, &t.CompanyID, &t.UserID, &t.Name, &t.Phone, &t.AvatarURL,
			&skills,
			&t.MaxDailyJobs, &t.IsActive, &t.Rating, &t.TotalRatings,
			&t.LastSeenAt,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		t.Skills = skills
		result = append(result, &t)
	}
	return result, rows.Err()
}

// hasRequiredSkills returns true if techSkills contains ALL of the required skills.
func hasRequiredSkills(techSkills []string, required []string) bool {
	set := make(map[string]bool, len(techSkills))
	for _, s := range techSkills {
		set[strings.ToUpper(s)] = true
	}
	for _, r := range required {
		if !set[strings.ToUpper(r)] {
			return false
		}
	}
	return true
}
