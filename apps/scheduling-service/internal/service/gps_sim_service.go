package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/ws"
)

// ─── GPS simulation ──────────────────────────────────────────────────────────
//
// Drives a technician along a real road route so live tracking can be
// demonstrated without putting someone in a car.
//
// It ARMS rather than acts: nothing moves until the job is marked EN_ROUTE by
// whoever is playing the technician. That keeps the demo honest — the person on
// the phone still triggers it, exactly as they would on a real call.
//
// This writes fake GPS into the real system, so it is off unless
// ENABLE_GPS_SIMULATION=true. The endpoints 404 without it, which means a leaked
// URL does nothing on a normal deployment.
//
// State is in memory. A restart forgets what was armed, which is the right
// trade for a trial tool: no schema, no cleanup job, and nothing left running
// after a deploy.

var ErrSimulationDisabled = errors.New("gps simulation is not enabled on this server")

// SimulationEnabledFor reports whether simulation is allowed for one company.
//
// TWO things must be true, not one:
//
//	ENABLE_GPS_SIMULATION=true
//	GPS_SIMULATION_COMPANIES=<comma separated company ids>   (must list this one)
//
// The allowlist is required rather than optional on purpose. The realistic
// failure is not someone attacking this endpoint, it is the flag being left on
// after the trial and forgotten. An allowlist means that mistake can only ever
// affect the tenant it was switched on for, never a real customer added later.
//
// Checked on every call rather than cached, so changing the env vars does not
// need a restart on a platform that can update them in place.
func SimulationEnabledFor(companyID string) bool {
	if os.Getenv("ENABLE_GPS_SIMULATION") != "true" {
		return false
	}
	allowed := strings.Split(os.Getenv("GPS_SIMULATION_COMPANIES"), ",")
	for _, a := range allowed {
		if strings.TrimSpace(a) == companyID && companyID != "" {
			return true
		}
	}
	return false
}

type SimPhase string

const (
	PhaseWaiting SimPhase = "WAITING_FOR_EN_ROUTE"
	PhaseDriving SimPhase = "DRIVING"
	PhaseArrived SimPhase = "ARRIVED"
)

// SimStatus is what the dashboard polls to drive its button and message.
type SimStatus struct {
	JobID          string    `json:"jobId"`
	TechnicianID   string    `json:"technicianId"`
	TechnicianName string    `json:"technicianName"`
	Phase          SimPhase  `json:"phase"`
	FixesSent      int       `json:"fixesSent"`
	FixesTotal     int       `json:"fixesTotal"`
	RouteKm        float64   `json:"routeKm"`
	Message        string    `json:"message"`
	StartedAt      time.Time `json:"startedAt"`
}

type simRun struct {
	status SimStatus
	cancel context.CancelFunc
}

type GPSSimService struct {
	techRepo   *repository.TechnicianRepository
	assignRepo *repository.AssignmentRepository
	crewRepo   *repository.CrewRepository
	hub        *ws.Hub

	mu   sync.Mutex
	runs map[string]*simRun // keyed companyID+jobID
}

func NewGPSSimService(
	techRepo *repository.TechnicianRepository,
	assignRepo *repository.AssignmentRepository,
	crewRepo *repository.CrewRepository,
	hub *ws.Hub,
) *GPSSimService {
	return &GPSSimService{
		techRepo: techRepo, assignRepo: assignRepo, crewRepo: crewRepo, hub: hub,
		runs: map[string]*simRun{},
	}
}

func key(companyID, jobID string) string { return companyID + "|" + jobID }

// Arm starts watching a job. Nothing moves until it turns EN_ROUTE.
func (s *GPSSimService) Arm(companyID, jobID string, speed float64, fromLat, fromLng *float64) (*SimStatus, error) {
	if !SimulationEnabledFor(companyID) {
		return nil, ErrSimulationDisabled
	}
	if speed <= 0 || speed > 200 {
		speed = 10
	}

	ctx := context.Background()
	crew, err := s.crewRepo.FindCrew(ctx, companyID, jobID)
	if err != nil {
		return nil, err
	}
	if len(crew) == 0 {
		return nil, errors.New("assign a technician to this job first")
	}
	// The lead is who the customer is told about, so they are who moves.
	member := models.LeadOf(crew)
	if member == nil {
		member = &crew[0]
	}

	job, err := s.assignRepo.GetJobEnRouteInfo(ctx, companyID, jobID)
	if err != nil {
		return nil, err
	}
	if job.Latitude == nil || job.Longitude == nil {
		return nil, errors.New("this job has no map pin, so there is nowhere to drive to")
	}

	s.mu.Lock()
	if existing, ok := s.runs[key(companyID, jobID)]; ok {
		st := existing.status
		s.mu.Unlock()
		return &st, nil // already armed; report rather than start a second car
	}

	runCtx, cancel := context.WithCancel(context.Background())
	run := &simRun{
		cancel: cancel,
		status: SimStatus{
			JobID: jobID, TechnicianID: member.Technician.ID,
			TechnicianName: member.Technician.Name,
			Phase:          PhaseWaiting,
			Message:        fmt.Sprintf("Armed. %s will start moving when the job is marked En Route.", member.Technician.Name),
			StartedAt:      time.Now().UTC(),
		},
	}
	s.runs[key(companyID, jobID)] = run
	s.mu.Unlock()

	go s.watchAndDrive(runCtx, companyID, jobID, member.Technician, *job.Latitude, *job.Longitude, speed, fromLat, fromLng)

	st := run.status
	return &st, nil
}

// Stop disarms a watcher or halts a drive in progress.
func (s *GPSSimService) Stop(companyID, jobID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	run, ok := s.runs[key(companyID, jobID)]
	if !ok {
		return false
	}
	run.cancel()
	delete(s.runs, key(companyID, jobID))
	return true
}

// Status reports one job's simulation, if any.
func (s *GPSSimService) Status(companyID, jobID string) *SimStatus {
	s.mu.Lock()
	defer s.mu.Unlock()
	run, ok := s.runs[key(companyID, jobID)]
	if !ok {
		return nil
	}
	st := run.status
	return &st
}

func (s *GPSSimService) update(companyID, jobID string, fn func(*SimStatus)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if run, ok := s.runs[key(companyID, jobID)]; ok {
		fn(&run.status)
	}
}

// watchAndDrive polls until the job is EN_ROUTE, then drives the route.
func (s *GPSSimService) watchAndDrive(
	ctx context.Context, companyID, jobID string, tech models.Technician,
	jobLat, jobLng, speed float64, fromLat, fromLng *float64,
) {
	// Poll rather than hook a status event: the job status is owned by
	// job-service in another schema, and a 3s read is cheaper than the plumbing
	// a cross-service event would need for a trial tool.
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			var status string
			if err := s.assignRepo.QueryJobStatus(ctx, companyID, jobID, &status); err != nil {
				// Surfaced in the status payload rather than swallowed: a silent
				// continue here looks identical to "waiting", which is exactly
				// how a broken watcher hides in plain sight.
				s.update(companyID, jobID, func(st *SimStatus) {
					st.Message = "Cannot read the job status: " + err.Error()
				})
				continue
			}
			s.update(companyID, jobID, func(st *SimStatus) {
				if st.Phase == PhaseWaiting && status != "EN_ROUTE" {
					st.Message = fmt.Sprintf("Armed. Job is %s. Movement starts when it is marked En Route.", status)
				}
			})
			if status == "EN_ROUTE" {
				s.drive(ctx, companyID, jobID, tech, jobLat, jobLng, speed, fromLat, fromLng)
				return
			}
		}
	}
}

func (s *GPSSimService) drive(
	ctx context.Context, companyID, jobID string, tech models.Technician,
	jobLat, jobLng, speed float64, fromLat, fromLng *float64,
) {
	// Start where the technician actually is, so the line on the map begins at
	// their marker rather than teleporting them somewhere first.
	startLat, startLng := 6.9271, 79.8612 // Colombo, only if nothing else is known
	if tech.BaseLocation != nil {
		startLat, startLng = tech.BaseLocation.Lat, tech.BaseLocation.Lng
	}
	if tech.CurrentLocation != nil {
		startLat, startLng = tech.CurrentLocation.Lat, tech.CurrentLocation.Lng
	}
	if fromLat != nil && fromLng != nil {
		startLat, startLng = *fromLat, *fromLng
	}

	route, km := roadRoute(ctx, startLat, startLng, jobLat, jobLng)

	const intervalS = 20.0
	const kmh = 35.0
	stepM := (kmh * 1000 / 3600) * intervalS
	track := densify(route, stepM)

	s.update(companyID, jobID, func(st *SimStatus) {
		st.Phase = PhaseDriving
		st.FixesTotal = len(track)
		st.RouteKm = km
		st.Message = fmt.Sprintf("%s is on the way. %.1f km to go.", tech.Name, km)
	})

	gap := time.Duration(float64(time.Second) * intervalS / speed)
	for i, p := range track {
		select {
		case <-ctx.Done():
			return
		default:
		}
		s.postFix(ctx, companyID, tech, p[0], p[1], i, len(track))
		s.update(companyID, jobID, func(st *SimStatus) { st.FixesSent = i + 1 })
		if i < len(track)-1 {
			select {
			case <-ctx.Done():
				return
			case <-time.After(gap):
			}
		}
	}

	s.update(companyID, jobID, func(st *SimStatus) {
		st.Phase = PhaseArrived
		st.Message = fmt.Sprintf("%s has arrived.", tech.Name)
	})
}

// postFix writes one GPS point exactly as the mobile app's endpoint does, so
// history, live position, Redis and the WebSocket all behave identically.
func (s *GPSSimService) postFix(
	ctx context.Context, companyID string, tech models.Technician,
	lat, lng float64, i, total int,
) {
	speed := float32(35)
	battery := int16(90 - (i*40)/max(1, total))

	_ = s.assignRepo.InsertGPSPoint(ctx, tech.ID, companyID, lat, lng, nil, &speed, nil, &battery)
	_ = s.techRepo.UpdateLocation(ctx, tech.ID, lat, lng)

	s.hub.BroadcastMessage(ctx, models.WSMessage{
		Type:      models.WSTypeGPSUpdate,
		CompanyID: companyID,
		Payload: models.GPSUpdatePayload{
			TechnicianID: tech.ID, Name: tech.Name,
			Lat: lat, Lng: lng, SpeedKmh: &speed, BatteryPct: &battery,
			CapturedAt: time.Now().UTC(),
		},
	})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// ─── Route geometry ──────────────────────────────────────────────────────────

// roadRoute asks OSRM for a driving route, falling back to a straight line.
// A demo that still runs beats one that aborts because a public server blinked.
func roadRoute(ctx context.Context, fromLat, fromLng, toLat, toLng float64) ([][2]float64, float64) {
	straight := [][2]float64{{fromLat, fromLng}, {toLat, toLng}}

	base := os.Getenv("OSRM_BASE_URL")
	if base == "" {
		base = "https://router.project-osrm.org"
	}
	url := fmt.Sprintf("%s/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
		base, fromLng, fromLat, toLng, toLat)

	reqCtx, cancel := context.WithTimeout(ctx, 12*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, url, nil)
	if err != nil {
		return straight, haversineKm(fromLat, fromLng, toLat, toLng)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return straight, haversineKm(fromLat, fromLng, toLat, toLng)
	}
	defer res.Body.Close()

	var parsed struct {
		Routes []struct {
			Distance float64 `json:"distance"`
			Geometry struct {
				Coordinates [][2]float64 `json:"coordinates"`
			} `json:"geometry"`
		} `json:"routes"`
	}
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil || len(parsed.Routes) == 0 {
		return straight, haversineKm(fromLat, fromLng, toLat, toLng)
	}

	coords := parsed.Routes[0].Geometry.Coordinates
	out := make([][2]float64, 0, len(coords))
	for _, c := range coords {
		out = append(out, [2]float64{c[1], c[0]}) // OSRM is lng,lat
	}
	if len(out) < 2 {
		return straight, haversineKm(fromLat, fromLng, toLat, toLng)
	}
	return out, parsed.Routes[0].Distance / 1000
}

// densify walks the polyline emitting a point every stepM metres, so speed is
// constant and the fix count does not depend on how the route was drawn.
func densify(points [][2]float64, stepM float64) [][2]float64 {
	if len(points) < 2 {
		return points
	}
	out := [][2]float64{}
	carry := 0.0
	for i := 0; i < len(points)-1; i++ {
		from, to := points[i], points[i+1]
		segM := haversineKm(from[0], from[1], to[0], to[1]) * 1000
		if segM == 0 {
			continue
		}
		for d := carry; d < segM; d += stepM {
			t := d / segM
			out = append(out, [2]float64{
				from[0] + (to[0]-from[0])*t,
				from[1] + (to[1]-from[1])*t,
			})
		}
		carry = math.Mod(stepM-math.Mod(segM-carry, stepM), stepM)
	}
	out = append(out, points[len(points)-1])
	return out
}
