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
// If latitude and longitude are provided, sets the initial current_location using PostGIS.
func (r *TechnicianRepository) Create(ctx context.Context, companyID string, req models.CreateTechnicianRequest) (*models.Technician, error) {
	maxDailyJobs := 8
	if req.MaxDailyJobs != nil {
		maxDailyJobs = *req.MaxDailyJobs
	}
	skills := req.Skills
	if skills == nil {
		skills = []string{}
	}

	// If initial GPS location is provided, include it in the INSERT
	if req.Latitude != nil && req.Longitude != nil {
		row := r.db.QueryRow(ctx, `
			INSERT INTO scheduling.technicians
				(company_id, user_id, name, phone, avatar_url, skills, max_daily_jobs,
				 current_location, last_seen_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7,
				ST_SetSRID(ST_MakePoint($9, $8), 4326), NOW())
			RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
			          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
			          created_at, updated_at,
			          ST_Y(current_location::geometry), ST_X(current_location::geometry)`,
			companyID, req.UserID, req.Name, req.Phone, req.AvatarURL, skills, maxDailyJobs,
			*req.Latitude, *req.Longitude,
		)
		return scanTechnician(row)
	}

	row := r.db.QueryRow(ctx, `
		INSERT INTO scheduling.technicians
			(company_id, user_id, name, phone, avatar_url, skills, max_daily_jobs)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
		          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		          created_at, updated_at,
		          ST_Y(current_location::geometry), ST_X(current_location::geometry)`,
		companyID, req.UserID, req.Name, req.Phone, req.AvatarURL, skills, maxDailyJobs,
	)

	return scanTechnician(row)
}

// FindByID returns a single technician scoped to a company.
func (r *TechnicianRepository) FindByID(ctx context.Context, companyID, id string) (*models.Technician, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, company_id, user_id, name, phone, avatar_url, skills,
		       max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		       created_at, updated_at,
		       ST_Y(current_location::geometry), ST_X(current_location::geometry)
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
		       created_at, updated_at,
		       ST_Y(current_location::geometry), ST_X(current_location::geometry)
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
// It first auto-syncs any CRM users with role='technician' that don't yet have
// a scheduling profile — this covers both admin-created and self-registered
// approved technicians, ensuring they all appear in the dispatch board.
func (r *TechnicianRepository) ListActive(ctx context.Context, companyID string) ([]*models.Technician, error) {
	// Auto-create scheduling profiles for approved active CRM technicians
	// that don't have one yet. ON CONFLICT DO NOTHING makes this idempotent.
	// Note: scheduling columns (company_id, user_id) are TEXT since migration 002,
	// and CRM columns (companyId, id) are also TEXT — no UUID casts needed.
	_, syncErr := r.db.Exec(ctx, `
		INSERT INTO scheduling.technicians (company_id, user_id, name, phone, skills)
		SELECT
			cu."companyId",
			cu.id,
			cu.name,
			COALESCE(cu.phone, ''),
			COALESCE(cu.skills, ARRAY[]::text[])
		FROM crm.company_users cu
		WHERE cu."companyId" = $1
		  AND cu.role = 'technician'
		  AND cu."isActive" = true
		  AND cu."approvalStatus" = 'APPROVED'
		  AND NOT EXISTS (
		    SELECT 1 FROM scheduling.technicians st
		    WHERE st.user_id = cu.id
		      AND st.company_id = cu."companyId"
		  )
		ON CONFLICT (company_id, user_id) DO NOTHING`, companyID)
	if syncErr != nil {
		// Log but don't fail — still return whatever scheduling records exist
		fmt.Printf("[WARN] CRM→scheduling auto-sync failed: %v\n", syncErr)
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, company_id, user_id, name, phone, avatar_url, skills,
		       max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		       created_at, updated_at,
		       ST_Y(current_location::geometry), ST_X(current_location::geometry)
		FROM scheduling.technicians
		WHERE company_id = $1 AND is_active = TRUE
		ORDER BY name`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return collectTechnicians(rows)
}

// SyncOneFromCRM creates a scheduling profile for a single CRM user if they are
// an approved active technician. Returns the created profile or nil if not eligible.
func (r *TechnicianRepository) SyncOneFromCRM(ctx context.Context, companyID, userID string) (*models.Technician, error) {
	row := r.db.QueryRow(ctx, `
		WITH inserted AS (
			INSERT INTO scheduling.technicians (company_id, user_id, name, phone, skills)
			SELECT
				cu."companyId",
				cu.id,
				cu.name,
				COALESCE(cu.phone, ''),
				COALESCE(cu.skills, ARRAY[]::text[])
			FROM crm.company_users cu
			WHERE cu."companyId" = $1
			  AND cu.id = $2
			  AND cu.role = 'technician'
			  AND cu."isActive" = true
			  AND cu."approvalStatus" = 'APPROVED'
			ON CONFLICT (company_id, user_id) DO UPDATE SET
				is_active = TRUE,
				name = EXCLUDED.name,
				updated_at = NOW()
			RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
			          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
			          created_at, updated_at,
			          ST_Y(current_location::geometry), ST_X(current_location::geometry)
		)
		SELECT * FROM inserted`, companyID, userID)

	t, err := scanTechnician(row)
	if err != nil {
		return nil, err
	}
	return t, nil
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

	// ST_DistanceSphere works on plain geometry (SRID 4326) and returns metres
	// without requiring a ::geography cast — avoids SQLSTATE 42704 when the
	// PostGIS 'geography' type is not in the connection's search_path.
	rows, err := r.db.Query(ctx, `
		SELECT sub.id, sub.company_id, sub.user_id, sub.name, sub.phone, sub.avatar_url,
		       sub.skills, sub.max_daily_jobs, sub.is_active, sub.rating, sub.total_ratings,
		       sub.last_seen_at, sub.created_at, sub.updated_at,
		       sub.distance_km,
		       sub.lat, sub.lng
		FROM (
		  SELECT t.id, t.company_id, t.user_id, t.name, t.phone, t.avatar_url,
		         t.skills, t.max_daily_jobs, t.is_active, t.rating, t.total_ratings,
		         t.last_seen_at, t.created_at, t.updated_at,
		         ST_DistanceSphere(
		           t.current_location,
		           ST_SetSRID(ST_MakePoint($3, $2), 4326)
		         ) / 1000.0 AS distance_km,
		         ST_Y(t.current_location::geometry) AS lat,
		         ST_X(t.current_location::geometry) AS lng
		  FROM scheduling.technicians t
		  WHERE t.company_id = $1
		    AND t.is_active = TRUE
		    AND t.current_location IS NOT NULL
		) sub
		WHERE sub.distance_km <= $4
		ORDER BY sub.distance_km ASC
		LIMIT 20`,
		companyID, jobLat, jobLng, maxDistanceKm,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []TechnicianWithDistance
	for rows.Next() {
		var twd TechnicianWithDistance
		var skills []string
		var lat, lng *float64
		err := rows.Scan(
			&twd.Technician.ID, &twd.Technician.CompanyID, &twd.Technician.UserID,
			&twd.Technician.Name, &twd.Technician.Phone, &twd.Technician.AvatarURL,
			&skills,
			&twd.Technician.MaxDailyJobs, &twd.Technician.IsActive,
			&twd.Technician.Rating, &twd.Technician.TotalRatings,
			&twd.Technician.LastSeenAt,
			&twd.Technician.CreatedAt, &twd.Technician.UpdatedAt,
			&twd.DistanceKm,
			&lat, &lng,
		)
		if err != nil {
			return nil, err
		}
		twd.Technician.Skills = skills
		if lat != nil && lng != nil {
			twd.Technician.CurrentLocation = &models.GeoPoint{Lat: *lat, Lng: *lng}
		}

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

	// If lat/lng provided, update current_location + last_seen_at too
	if req.Latitude != nil && req.Longitude != nil {
		row := r.db.QueryRow(ctx, `
			UPDATE scheduling.technicians
			SET name = $1, phone = $2, avatar_url = $3, skills = $4,
			    max_daily_jobs = $5, is_active = $6,
			    current_location = ST_SetSRID(ST_MakePoint($10, $9), 4326),
			    last_seen_at = NOW(), updated_at = NOW()
			WHERE id = $7 AND company_id = $8
			RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
			          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
			          created_at, updated_at,
			          ST_Y(current_location::geometry), ST_X(current_location::geometry)`,
			name, phone, avatarURL, skills, maxDailyJobs, isActive, id, companyID,
			*req.Latitude, *req.Longitude,
		)
		return scanTechnician(row)
	}

	row := r.db.QueryRow(ctx, `
		UPDATE scheduling.technicians
		SET name = $1, phone = $2, avatar_url = $3, skills = $4,
		    max_daily_jobs = $5, is_active = $6, updated_at = NOW()
		WHERE id = $7 AND company_id = $8
		RETURNING id, company_id, user_id, name, phone, avatar_url, skills,
		          max_daily_jobs, is_active, rating, total_ratings, last_seen_at,
		          created_at, updated_at,
		          ST_Y(current_location::geometry), ST_X(current_location::geometry)`,
		name, phone, avatarURL, skills, maxDailyJobs, isActive, id, companyID,
	)
	return scanTechnician(row)
}

// UpdateRating writes a pre-computed rating average and review count. Intended
// to be called from crm-service when a customer posts / amends a JOB review so
// the smart-assignment scorer picks up fresh feedback on the next dispatch run.
//
// Called from CRM without a JWT; the controller layer decides whether to gate
// it (see routes note — registered as an unauthenticated internal endpoint).
func (r *TechnicianRepository) UpdateRating(ctx context.Context, technicianID string, rating float64, totalRatings int) error {
	tag, err := r.db.Exec(ctx, `
		UPDATE scheduling.technicians
		SET rating        = $1,
		    total_ratings = $2,
		    updated_at    = NOW()
		WHERE id = $3`,
		rating, totalRatings, technicianID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("technician %s not found", technicianID)
	}
	return nil
}

// ---- helper types & functions ----

// TechnicianWithDistance extends Technician with the PostGIS-computed distance.
type TechnicianWithDistance struct {
	Technician models.Technician
	DistanceKm float64
}

func scanTechnician(row pgx.Row) (*models.Technician, error) {
	var t models.Technician
	var skills []string
	var lat, lng *float64
	err := row.Scan(
		&t.ID, &t.CompanyID, &t.UserID, &t.Name, &t.Phone, &t.AvatarURL,
		&skills,
		&t.MaxDailyJobs, &t.IsActive, &t.Rating, &t.TotalRatings,
		&t.LastSeenAt,
		&t.CreatedAt, &t.UpdatedAt,
		&lat, &lng,
	)
	if err != nil {
		return nil, err
	}
	t.Skills = skills
	if lat != nil && lng != nil {
		t.CurrentLocation = &models.GeoPoint{Lat: *lat, Lng: *lng}
	}
	return &t, nil
}

func collectTechnicians(rows pgx.Rows) ([]*models.Technician, error) {
	var result []*models.Technician
	for rows.Next() {
		var t models.Technician
		var skills []string
		var lat, lng *float64
		err := rows.Scan(
			&t.ID, &t.CompanyID, &t.UserID, &t.Name, &t.Phone, &t.AvatarURL,
			&skills,
			&t.MaxDailyJobs, &t.IsActive, &t.Rating, &t.TotalRatings,
			&t.LastSeenAt,
			&t.CreatedAt, &t.UpdatedAt,
			&lat, &lng,
		)
		if err != nil {
			return nil, err
		}
		t.Skills = skills
		if lat != nil && lng != nil {
			t.CurrentLocation = &models.GeoPoint{Lat: *lat, Lng: *lng}
		}
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

// CrewCandidateRow is a technician considered for a crew, with distance measured
// from their BASE where known.
//
// BaseDistanceKm is nil when the technician has neither a base nor a live
// position. Such a technician is still returned: they are assignable, just
// unscored on distance. Dropping them, which FindCandidatesNearby does via
// `current_location IS NOT NULL`, would silently hide anyone who has never
// opened the mobile app.
type CrewCandidateRow struct {
	Technician     models.Technician
	BaseDistanceKm *float64
	// FromBase is false when the distance fell back to the live position, so
	// callers can say which number they are showing.
	FromBase bool
}

// FindCrewCandidates ranks technicians for a crew by distance from where they
// start their day.
//
// Distinct from FindCandidatesNearby, which measures from the live position and
// is right for dispatching something happening now. For a job days away, where a
// van is parked at this moment predicts nothing; where the technician sets off
// from does.
func (r *TechnicianRepository) FindCrewCandidates(
	ctx context.Context,
	companyID string,
	jobLat, jobLng float64,
	maxDistanceKm float64,
	limit int,
) ([]CrewCandidateRow, error) {
	if limit <= 0 {
		limit = 20
	}
	rows, err := r.db.Query(ctx, `
		SELECT sub.id, sub.company_id, sub.user_id, sub.name, sub.phone, sub.avatar_url,
		       sub.skills, sub.max_daily_jobs, sub.is_active, sub.rating, sub.total_ratings,
		       sub.last_seen_at, sub.created_at, sub.updated_at,
		       sub.distance_km, sub.from_base
		FROM (
		  SELECT t.id, t.company_id, t.user_id, t.name, t.phone, t.avatar_url,
		         t.skills, t.max_daily_jobs, t.is_active, t.rating, t.total_ratings,
		         t.last_seen_at, t.created_at, t.updated_at,
		         CASE WHEN COALESCE(t.base_location, t.current_location) IS NULL THEN NULL
		              ELSE ST_DistanceSphere(
		                     COALESCE(t.base_location, t.current_location),
		                     ST_SetSRID(ST_MakePoint($3, $2), 4326)
		                   ) / 1000.0
		         END AS distance_km,
		         (t.base_location IS NOT NULL) AS from_base
		  FROM scheduling.technicians t
		  WHERE t.company_id = $1
		    AND t.is_active = TRUE
		) sub
		WHERE sub.distance_km IS NULL OR sub.distance_km <= $4
		ORDER BY sub.distance_km ASC NULLS LAST
		LIMIT $5`,
		companyID, jobLat, jobLng, maxDistanceKm, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []CrewCandidateRow{}
	for rows.Next() {
		var c CrewCandidateRow
		var skills []string
		if err := rows.Scan(
			&c.Technician.ID, &c.Technician.CompanyID, &c.Technician.UserID,
			&c.Technician.Name, &c.Technician.Phone, &c.Technician.AvatarURL,
			&skills, &c.Technician.MaxDailyJobs, &c.Technician.IsActive,
			&c.Technician.Rating, &c.Technician.TotalRatings, &c.Technician.LastSeenAt,
			&c.Technician.CreatedAt, &c.Technician.UpdatedAt,
			&c.BaseDistanceKm, &c.FromBase,
		); err != nil {
			return nil, err
		}
		c.Technician.Skills = skills
		out = append(out, c)
	}
	return out, rows.Err()
}
