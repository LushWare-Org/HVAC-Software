package service

import (
	"context"
	"math"
	"sort"
	"time"

	"github.com/tscrm/scheduling-service/internal/config"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/ws"
)

// AssignmentService implements Phase 1: Rule-Based Smart Assignment.
//
// Scoring formula (weights chosen to balance field realities):
//   distanceScore = max(0, 100 - (distanceKm / maxDistanceKm × 100))  → 40%
//   workloadScore = max(0, 100 - (activeJobs / maxActiveJobs × 100))   → 35%
//   ratingScore   = (rating / 5.0) × 100                               → 25%
//   totalScore    = distanceScore×0.40 + workloadScore×0.35 + ratingScore×0.25
//
// Weight rationale:
//   - Distance (40%) is the strongest operational factor — travel time = unbillable cost
//   - Workload (35%) prevents overloading individual technicians
//   - Rating  (25%) is a quality signal but shouldn't dominate (new techs deserve work too)
//
// Auto-assign threshold: 90.0 (configurable). If the best candidate scores ≥ 90,
// the job is assigned automatically. Otherwise the top 3 are returned to the dispatcher.
type AssignmentService struct {
	cfg         *config.Config
	techRepo    *repository.TechnicianRepository
	assignRepo  *repository.AssignmentRepository
	hub         *ws.Hub
}

func NewAssignmentService(
	cfg *config.Config,
	techRepo *repository.TechnicianRepository,
	assignRepo *repository.AssignmentRepository,
	hub *ws.Hub,
) *AssignmentService {
	return &AssignmentService{cfg: cfg, techRepo: techRepo, assignRepo: assignRepo, hub: hub}
}

// AssignJob is the main entry point for Phase 1 scheduling.
// It scores all nearby technicians and either auto-assigns or returns suggestions.
func (s *AssignmentService) AssignJob(
	ctx context.Context,
	companyID string,
	dispatcherUserID *string,
	req models.AssignJobRequest,
) (*models.AssignResponse, error) {
	// 1. Find candidates within the max radius
	candidates, err := s.techRepo.FindCandidatesNearby(
		ctx, companyID,
		req.JobLatitude, req.JobLongitude,
		s.cfg.MaxDistanceKm,
		req.RequiredSkills,
	)
	if err != nil {
		return nil, err
	}
	if len(candidates) == 0 {
		return &models.AssignResponse{
			AutoAssigned: false,
			Suggestions:  []models.ScoredTechnician{},
		}, nil
	}

	// 2. Fetch active job counts for all candidates in a single query
	techIDs := make([]string, len(candidates))
	for i, c := range candidates {
		techIDs[i] = c.Technician.ID
	}
	activeJobCounts, err := s.techRepo.CountActiveJobsForTechnicians(ctx, companyID, techIDs)
	if err != nil {
		return nil, err
	}

	// 3. Score every candidate
	scored := make([]models.ScoredTechnician, 0, len(candidates))
	for _, c := range candidates {
		activeJobs := activeJobCounts[c.Technician.ID]
		st := scoreTechnician(c, activeJobs, s.cfg)
		scored = append(scored, st)
	}

	// 4. Sort descending by total score
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	best := scored[0]

	// 5. Auto-assign if top score meets threshold
	if best.Score >= s.cfg.AutoAssignThreshold {
		parsedStart, parsedEnd := parseTimes(req.ScheduledStart, req.ScheduledEnd)
		assignment, err := s.assignRepo.Create(
			ctx,
			companyID, req.JobID, best.Technician.ID,
			models.StatusAssigned,
			&best.Score,
			&best.DistanceKm,
			dispatcherUserID,
			parsedStart, parsedEnd,
			nil,
		)
		if err != nil {
			return nil, err
		}

		// Broadcast the new assignment over WebSocket
		s.hub.BroadcastMessage(ctx, models.WSMessage{
			Type:      models.WSTypeAssigned,
			CompanyID: companyID,
			Payload:   assignment,
		})

		return &models.AssignResponse{
			AutoAssigned: true,
			Assignment:   assignment,
		}, nil
	}

	// 6. Return top 3 suggestions for dispatcher to choose from
	top := scored
	if len(top) > 3 {
		top = top[:3]
	}

	return &models.AssignResponse{
		AutoAssigned: false,
		Suggestions:  top,
	}, nil
}

// ManualAssign creates a confirmed assignment from a dispatcher's explicit choice.
// Used when the dispatcher picks one of the suggestions returned by AssignJob,
// or when assigning a job directly without running the scoring algorithm.
func (s *AssignmentService) ManualAssign(
	ctx context.Context,
	companyID string,
	dispatcherUserID string,
	req models.ManualAssignRequest,
) (*models.DispatchAssignment, error) {
	// Compute score for record-keeping even if dispatcher overrode it
	candidates, err := s.techRepo.FindCandidatesNearby(
		ctx, companyID,
		req.JobLatitude, req.JobLongitude,
		s.cfg.MaxDistanceKm*2, // wider radius for manual (dispatcher may know better)
		nil,
	)
	if err != nil {
		return nil, err
	}

	var score *float64
	var distanceKm *float64

	for _, c := range candidates {
		if c.Technician.ID == req.TechnicianID {
			d := c.DistanceKm
			distanceKm = &d
			activeJobs, _ := s.techRepo.CountActiveJobsForTechnicians(ctx, companyID, []string{req.TechnicianID})
			st := scoreTechnician(c, activeJobs[req.TechnicianID], s.cfg)
			score = &st.Score
			break
		}
	}

	parsedStart, parsedEnd := parseTimes(req.ScheduledStart, req.ScheduledEnd)
	assignment, err := s.assignRepo.Create(
		ctx,
		companyID, req.JobID, req.TechnicianID,
		models.StatusAssigned,
		score, distanceKm,
		&dispatcherUserID,
		parsedStart, parsedEnd,
		req.Notes,
	)
	if err != nil {
		return nil, err
	}

	s.hub.BroadcastMessage(ctx, models.WSMessage{
		Type:      models.WSTypeAssigned,
		CompanyID: companyID,
		Payload:   assignment,
	})

	return assignment, nil
}

// UpdateAssignmentStatus transitions an assignment (e.g., ASSIGNED → EN_ROUTE).
// Broadcasts the status change to the dispatcher dashboard.
func (s *AssignmentService) UpdateAssignmentStatus(
	ctx context.Context,
	companyID, assignmentID string,
	req models.UpdateAssignmentStatusRequest,
) (*models.DispatchAssignment, error) {
	assignment, err := s.assignRepo.UpdateStatus(ctx, companyID, assignmentID, req.Status, req.Notes)
	if err != nil {
		return nil, err
	}

	s.hub.BroadcastMessage(ctx, models.WSMessage{
		Type:      models.WSTypeStatusChanged,
		CompanyID: companyID,
		Payload:   assignment,
	})

	return assignment, nil
}

// ============================================================
// Phase 1 scoring algorithm
// ============================================================

// scoreTechnician computes the composite score for a candidate.
func scoreTechnician(
	c repository.TechnicianWithDistance,
	activeJobs int,
	cfg *config.Config,
) models.ScoredTechnician {
	// Distance score: 100 when on-site, 0 when at max range
	rawDistance := 100.0 - (c.DistanceKm/cfg.MaxDistanceKm)*100.0
	distanceScore := math.Max(0, rawDistance)

	// Workload score: 100 when idle, 0 when at max capacity
	rawWorkload := 100.0 - (float64(activeJobs)/float64(cfg.MaxActiveJobs))*100.0
	workloadScore := math.Max(0, rawWorkload)

	// Rating score: linear 0–100 on a 0–5 scale
	ratingScore := (c.Technician.Rating / 5.0) * 100.0

	// Weighted composite
	total := (distanceScore * 0.40) + (workloadScore * 0.35) + (ratingScore * 0.25)

	return models.ScoredTechnician{
		Technician:    c.Technician,
		Score:         roundTwoDP(total),
		DistanceKm:    roundTwoDP(c.DistanceKm),
		ActiveJobs:    activeJobs,
		DistanceScore: roundTwoDP(distanceScore),
		WorkloadScore: roundTwoDP(workloadScore),
		RatingScore:   roundTwoDP(ratingScore),
	}
}

func roundTwoDP(v float64) float64 {
	return math.Round(v*100) / 100
}

func parseTimes(start, end *string) (*time.Time, *time.Time) {
	var parsedStart, parsedEnd *time.Time
	if start != nil {
		if t, err := time.Parse(time.RFC3339, *start); err == nil {
			parsedStart = &t
		}
	}
	if end != nil {
		if t, err := time.Parse(time.RFC3339, *end); err == nil {
			parsedEnd = &t
		}
	}
	return parsedStart, parsedEnd
}
