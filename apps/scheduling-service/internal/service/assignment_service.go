package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"sort"
	"time"

	"github.com/golang-jwt/jwt/v5"
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
	roster      RosterGate // nil-safe: no gate when unset
}

func NewAssignmentService(
	cfg *config.Config,
	techRepo *repository.TechnicianRepository,
	assignRepo *repository.AssignmentRepository,
	hub *ws.Hub,
) *AssignmentService {
	return &AssignmentService{cfg: cfg, techRepo: techRepo, assignRepo: assignRepo, hub: hub}
}

// WithRosterGate enables project-roster enforcement (reserved crew capacity).
func (s *AssignmentService) WithRosterGate(gate RosterGate) *AssignmentService {
	s.roster = gate
	return s
}

// rosterState loads the rostered-tech map and the job's own projectId for the
// assignment date. Fail-open: a roster read error logs and disables the gate
// for this call rather than blocking dispatch.
func (s *AssignmentService) rosterState(
	ctx context.Context,
	companyID, jobID string,
	scheduledStart *string,
) (map[string]models.RosterInfo, string, string) {
	date := rosterDate(scheduledStart)
	if s.roster == nil {
		return nil, "", date
	}
	rostered, err := s.roster.RosteredTechUserIDs(ctx, companyID, date)
	if err != nil {
		fmt.Printf("[WARN] roster lookup failed (gate disabled for this call): %v\n", err)
		return nil, "", date
	}
	jobProjectID, err := s.roster.JobProjectID(ctx, companyID, jobID)
	if err != nil {
		jobProjectID = ""
	}
	return rostered, jobProjectID, date
}

// commsBaseURL returns the base URL for the comms service.
func commsBaseURL() string {
	if u := os.Getenv("COMMS_SERVICE_URL"); u != "" {
		return u
	}
	return "http://localhost:3005"
}

// inventoryBaseURL returns the base URL for the inventory service.
func inventoryBaseURL() string {
	if u := os.Getenv("INVENTORY_SERVICE_URL"); u != "" {
		return u
	}
	return "http://localhost:3007"
}

// systemToken generates a short-lived JWT for service-to-service calls.
func systemToken(companyID string) string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "tscrm-local-jwt-secret-change-in-production"
	}
	claims := jwt.MapClaims{
		"sub":        "system-scheduling",
		"company_id": companyID,
		"role":       "company_admin",
		"name":       "Scheduling Service",
		"iss":        "tscrm-local",
		"exp":        time.Now().Add(5 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(secret))
	return signed
}

// sendAssignmentNotification sends in-app + email notifications to the assigned technician.
// Runs in a goroutine so it does not block the assignment response.
func (s *AssignmentService) sendAssignmentNotification(companyID, techUserID, techName, jobID, jobTitle string) {
	go func() {
		token := systemToken(companyID)
		base := commsBaseURL()

		// 1. Send in-app notification
		inAppBody, _ := json.Marshal(map[string]interface{}{
			"title": "New Job Assigned",
			"body":  fmt.Sprintf("You have been assigned to job: %s", jobTitle),
			"type":  "JOB_ASSIGNED",
			"recipients": []map[string]string{
				{"recipientId": techUserID, "recipientName": techName},
			},
		})
		req, _ := http.NewRequest("POST", base+"/notifications/in-app", bytes.NewReader(inAppBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fmt.Printf("[WARN] Failed to send in-app notification: %v\n", err)
		} else {
			resp.Body.Close()
		}

		// 2. Send email notification - need technician's email from CRM
		var email string
		_ = s.assignRepo.DB().QueryRow(context.Background(),
			`SELECT email FROM crm.company_users WHERE id = $1`, techUserID).Scan(&email)

		if email != "" {
			htmlBody := fmt.Sprintf(`
				<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#0f1117;color:#e2e8f0;border-radius:12px;">
					<h1 style="color:#3b82f6;font-size:22px;margin-bottom:8px;">New Job Assigned</h1>
					<p style="font-size:16px;line-height:1.6;margin-bottom:16px;">Hi <strong>%s</strong>,</p>
					<p style="font-size:15px;line-height:1.7;color:#94a3b8;">
						You have been assigned a new job: <strong>%s</strong>.
						Open the T&amp;S Technician app to view the full details and get started.
					</p>
					<div style="margin:28px 0;padding:20px;background:#1e293b;border-radius:8px;border-left:4px solid #3b82f6;">
						<p style="margin:0;font-size:14px;color:#cbd5e1;">
							Open the <strong>T&amp;S Technician</strong> app to view job details, navigate to the location, and update your status.
						</p>
					</div>
					<hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
					<p style="font-size:12px;color:#475569;">T&amp;S Services - T&amp;S CRM</p>
				</div>`, techName, jobTitle)

			emailBody, _ := json.Marshal(map[string]interface{}{
				"recipientId":    techUserID,
				"recipientName":  techName,
				"recipientEmail": email,
				"subject":        fmt.Sprintf("New Job Assigned: %s", jobTitle),
				"htmlBody":       htmlBody,
			})
			req2, _ := http.NewRequest("POST", base+"/notifications/email", bytes.NewReader(emailBody))
			req2.Header.Set("Content-Type", "application/json")
			req2.Header.Set("Authorization", "Bearer "+token)
			resp2, err2 := http.DefaultClient.Do(req2)
			if err2 != nil {
				fmt.Printf("[WARN] Failed to send assignment email: %v\n", err2)
			} else {
				resp2.Body.Close()
			}
		}
	}()
}

// checkPartsAvailability calls inventory service to get parts score for a technician.
// Returns 1.0 if all parts in van, 0.5 if in warehouse, 0.0 if out of stock.
// Returns 100.0 if no required parts specified (doesn't penalize).
func (s *AssignmentService) checkPartsAvailability(companyID string, technicianID string, requiredParts []string) float64 {
	if len(requiredParts) == 0 {
		return 100.0 // No parts required, full score
	}

	token := systemToken(companyID)
	base := inventoryBaseURL()

	// Build items JSON
	itemsJSON, _ := json.Marshal(requiredParts)
	url := fmt.Sprintf("%s/check-availability?technicianId=%s&items=%s", base, technicianID, string(itemsJSON))

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Printf("[WARN] Inventory availability check failed: %v\n", err)
		return 50.0 // Default to mid-score on failure
	}
	defer resp.Body.Close()

	var result struct {
		PartsScore float64 `json:"partsScore"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 50.0
	}

	return result.PartsScore * 100.0 // Convert 0-1 to 0-100 scale
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

	// Project roster gate — rostered techs are reserved capacity that day
	rostered, jobProjectID, _ := s.rosterState(ctx, companyID, req.JobID, req.ScheduledStart)
	candidates = filterRosteredCandidates(candidates, rostered, jobProjectID)

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
	hasParts := len(req.RequiredParts) > 0

	scored := make([]models.ScoredTechnician, 0, len(candidates))
	for _, c := range candidates {
		activeJobs := activeJobCounts[c.Technician.ID]
		var partsScore float64
		if hasParts {
			partsScore = s.checkPartsAvailability(companyID, c.Technician.ID, req.RequiredParts)
		}
		st := scoreTechnician(c, activeJobs, s.cfg, partsScore, hasParts)
		scored = append(scored, st)
	}

	// 4. Sort descending by total score
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].Score > scored[j].Score
	})

	best := scored[0]

	// 5. Auto-assign if top score meets threshold
	if best.Score >= s.cfg.AutoAssignThreshold {
		// Cancel any existing active assignment before creating the new one.
		// Reassigning a job must not leave a ghost "ASSIGNED" row for the old tech.
		if _, err := s.assignRepo.CancelActiveForJob(ctx, companyID, req.JobID); err != nil {
			return nil, fmt.Errorf("failed to cancel existing assignment: %w", err)
		}
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

		// Sync job service with assignment info
		techUserID, techName, _ := s.assignRepo.GetTechnicianUserInfo(ctx, best.Technician.ID)
		if techUserID != "" {
			if syncErr := s.assignRepo.SyncJobAssignment(ctx, companyID, req.JobID, techUserID, techName); syncErr != nil {
				fmt.Printf("[WARN] Failed to sync job assignment: %v\n", syncErr)
			}
			// Get job title for notification
			var jobTitle string
			_ = s.assignRepo.DB().QueryRow(ctx,
				`SELECT title FROM jobs.jobs WHERE id = $1`, req.JobID).Scan(&jobTitle)
			if jobTitle == "" {
				jobTitle = req.JobID
			}
			s.sendAssignmentNotification(companyID, techUserID, techName, req.JobID, jobTitle)
		}

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
			st := scoreTechnician(c, activeJobs[req.TechnicianID], s.cfg, 0, false)
			score = &st.Score
			break
		}
	}

	// Project roster gate — reject a tech reserved by a project that day
	// (jobs belonging to the same project are exempt).
	rostered, jobProjectID, gateDate := s.rosterState(ctx, companyID, req.JobID, req.ScheduledStart)
	if len(rostered) > 0 {
		techUserID, _, _ := s.assignRepo.GetTechnicianUserInfo(ctx, req.TechnicianID)
		if blk := rosterBlock(rostered, techUserID, jobProjectID, gateDate); blk != nil {
			return nil, blk
		}
	}

	// Cancel any existing active assignment for this job before creating the new one.
	// This ensures that when a dispatcher reassigns a job, the previous tech's
	// ASSIGNED row is cancelled rather than left as a duplicate active entry.
	if _, err := s.assignRepo.CancelActiveForJob(ctx, companyID, req.JobID); err != nil {
		return nil, fmt.Errorf("failed to cancel existing assignment: %w", err)
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

	// Sync job service with assignment info
	techUserID, techName, _ := s.assignRepo.GetTechnicianUserInfo(ctx, req.TechnicianID)
	if techUserID != "" {
		if syncErr := s.assignRepo.SyncJobAssignment(ctx, companyID, req.JobID, techUserID, techName); syncErr != nil {
			fmt.Printf("[WARN] Failed to sync job assignment: %v\n", syncErr)
		}
		// Get job title for notification
		var jobTitle string
		_ = s.assignRepo.DB().QueryRow(ctx,
			`SELECT title FROM jobs.jobs WHERE id = $1`, req.JobID).Scan(&jobTitle)
		if jobTitle == "" {
			jobTitle = req.JobID
		}
		s.sendAssignmentNotification(companyID, techUserID, techName, req.JobID, jobTitle)
	}

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

	// Tech is on the way — tell the customer (email with photo + ETA, plus SMS).
	// Fire-and-forget: the status transition never blocks or fails on this.
	if req.Status == models.StatusEnRoute {
		s.notifyCustomerEnRoute(companyID, assignment)
	}

	return assignment, nil
}

// notifyCustomerEnRoute gathers job + technician context, estimates the arrival
// window, and asks comms-service to email/SMS the customer. Runs in a goroutine;
// every failure is logged and swallowed.
func (s *AssignmentService) notifyCustomerEnRoute(companyID string, assignment *models.DispatchAssignment) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()

		job, err := s.assignRepo.GetJobEnRouteInfo(ctx, companyID, assignment.JobID)
		if err != nil {
			fmt.Printf("[WARN] en-route notify: job lookup failed for %s: %v\n", assignment.JobID, err)
			return
		}
		if job.CustomerEmail == nil && job.CustomerPhone == nil {
			return // nobody to notify
		}

		tech, err := s.techRepo.FindByID(ctx, companyID, assignment.TechnicianID)
		if err != nil {
			fmt.Printf("[WARN] en-route notify: tech lookup failed for %s: %v\n", assignment.TechnicianID, err)
			return
		}

		var techLoc *struct{ Lat, Lng float64 }
		if tech.CurrentLocation != nil {
			techLoc = &struct{ Lat, Lng float64 }{tech.CurrentLocation.Lat, tech.CurrentLocation.Lng}
		}
		etaStart, etaEnd := estimateETAWindow(
			ctx, techLoc, job.Latitude, job.Longitude,
			assignment.ScheduledStart, assignment.ScheduledEnd, time.Now())

		payload := map[string]interface{}{
			"assignmentId": assignment.ID,
			"jobId":        assignment.JobID,
			"jobTitle":     job.Title,
			"techUserId":   tech.UserID,
			"techName":     tech.Name,
		}
		if job.ServiceAddress != nil {
			payload["serviceAddress"] = *job.ServiceAddress
		}
		if job.CustomerName != nil {
			payload["customerName"] = *job.CustomerName
		}
		if job.CustomerEmail != nil {
			payload["customerEmail"] = *job.CustomerEmail
		}
		if job.CustomerPhone != nil {
			payload["customerPhone"] = *job.CustomerPhone
		}
		if etaStart != nil {
			payload["etaStart"] = etaStart.UTC().Format(time.RFC3339)
		}
		if etaEnd != nil {
			payload["etaEnd"] = etaEnd.UTC().Format(time.RFC3339)
		}

		body, _ := json.Marshal(payload)
		req, _ := http.NewRequestWithContext(ctx, "POST", commsBaseURL()+"/notifications/en-route", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+systemToken(companyID))
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fmt.Printf("[WARN] en-route notify: comms call failed for job %s: %v\n", assignment.JobID, err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 300 {
			fmt.Printf("[WARN] en-route notify: comms returned %d for job %s\n", resp.StatusCode, assignment.JobID)
		}
	}()
}

// ============================================================
// Phase 1 scoring algorithm
// ============================================================

// scoreTechnician computes the composite score for a candidate.
// When hasParts is true, parts availability is factored into the scoring weights.
func scoreTechnician(
	c repository.TechnicianWithDistance,
	activeJobs int,
	cfg *config.Config,
	partsScore float64,
	hasParts bool,
) models.ScoredTechnician {
	// Distance score: 100 when on-site, 0 when at max range
	rawDistance := 100.0 - (c.DistanceKm/cfg.MaxDistanceKm)*100.0
	distanceScore := math.Max(0, rawDistance)

	// Workload score: 100 when idle, 0 when at max capacity
	rawWorkload := 100.0 - (float64(activeJobs)/float64(cfg.MaxActiveJobs))*100.0
	workloadScore := math.Max(0, rawWorkload)

	// Rating score: linear 0–100 on a 0–5 scale
	ratingScore := (c.Technician.Rating / 5.0) * 100.0

	// Weighted composite — adjust weights when parts are involved
	var total float64
	if hasParts {
		total = (distanceScore * 0.30) + (workloadScore * 0.25) + (ratingScore * 0.20) + (partsScore * 0.25)
	} else {
		total = (distanceScore * 0.40) + (workloadScore * 0.35) + (ratingScore * 0.25)
	}

	return models.ScoredTechnician{
		Technician:    c.Technician,
		Score:         roundTwoDP(total),
		DistanceKm:    roundTwoDP(c.DistanceKm),
		ActiveJobs:    activeJobs,
		DistanceScore: roundTwoDP(distanceScore),
		WorkloadScore: roundTwoDP(workloadScore),
		RatingScore:   roundTwoDP(ratingScore),
		PartsScore:    roundTwoDP(partsScore),
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
