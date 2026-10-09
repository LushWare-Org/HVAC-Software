package service

import (
	"context"
	"sort"
	"time"

	"github.com/tscrm/scheduling-service/internal/config"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

// SortCandidates orders conflict-free technicians ahead of clashing ones, then by
// score descending.
//
// Availability outranks score deliberately: a double-booked 95 is a worse
// suggestion than a free 70, because the dispatcher would have to undo something
// to act on it. Within each group score still decides, so when everyone clashes
// the least-bad option is still first.
//
// sort.SliceStable keeps equal candidates in a fixed order, or the list would
// reshuffle between refreshes while someone is reading it.
func SortCandidates(cands []models.CrewCandidate) {
	sort.SliceStable(cands, func(i, j int) bool {
		iFree := len(cands[i].Conflicts) == 0
		jFree := len(cands[j].Conflicts) == 0
		if iFree != jFree {
			return iFree
		}
		return cands[i].Score > cands[j].Score
	})
}

// CandidateService answers "who else could join this job".
type CandidateService struct {
	techRepo     *repository.TechnicianRepository
	conflictRepo *repository.ConflictRepository
	assignRepo   *repository.AssignmentRepository
	cfg          *config.Config
	roster       RosterGate // nil-safe: no roster filter when unset
}

// WithRosterGate leaves out technicians reserved on another project that day,
// the same rule the assign step enforces.
func (s *CandidateService) WithRosterGate(gate RosterGate) *CandidateService {
	s.roster = gate
	return s
}

func NewCandidateService(
	techRepo *repository.TechnicianRepository,
	conflictRepo *repository.ConflictRepository,
	assignRepo *repository.AssignmentRepository,
	cfg *config.Config,
) *CandidateService {
	return &CandidateService{techRepo: techRepo, conflictRepo: conflictRepo, assignRepo: assignRepo, cfg: cfg}
}

// Candidates ranks technicians for a job window, each carrying what a dispatcher
// needs to judge them: score, distance from base, load that day, and anything
// they would clash with.
func (s *CandidateService) Candidates(
	ctx context.Context, companyID, jobID string, start, end time.Time, limit int,
) ([]models.CrewCandidate, error) {
	info, err := s.assignRepo.GetJobEnRouteInfo(ctx, companyID, jobID)
	if err != nil {
		return nil, err
	}

	var lat, lng float64
	if info.Latitude != nil && info.Longitude != nil {
		lat, lng = *info.Latitude, *info.Longitude
	}

	// Today's work and emergencies rank from where people are now; later days
	// from where they start. The roster day is the company's day.
	var facts models.JobFacts
	if s.roster != nil {
		if f, err := s.roster.JobFacts(ctx, companyID, jobID); err == nil {
			facts = f
		}
	}
	startISO := start.UTC().Format(time.RFC3339)
	now := time.Now()
	live := usesLivePosition(facts, &startISO, now)

	rowsFound, err := s.techRepo.FindCrewCandidates(
		ctx, companyID, lat, lng, s.cfg.MaxDistanceKm*2, 20, live, now.Add(-livePositionFreshness))
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(rowsFound))
	for _, n := range rowsFound {
		ids = append(ids, n.Technician.ID)
	}

	conflicts, err := s.conflictRepo.FindConflicts(
		ctx, companyID, ids, start, end, info.Latitude, info.Longitude)
	if err != nil {
		return nil, err
	}

	activeJobs, err := s.techRepo.CountActiveJobsForTechnicians(ctx, companyID, ids)
	if err != nil {
		return nil, err
	}

	out := make([]models.CrewCandidate, 0, len(rowsFound))
	for _, n := range rowsFound {
		// scoreTechnician expects a distance; a technician with no known location
		// is scored as if at the maximum radius rather than dropped, so they stay
		// assignable but never outrank someone we can actually locate.
		dist := s.cfg.MaxDistanceKm
		if n.BaseDistanceKm != nil {
			dist = *n.BaseDistanceKm
		}
		st := scoreTechnician(
			repository.TechnicianWithDistance{Technician: n.Technician, DistanceKm: dist},
			activeJobs[n.Technician.ID], s.cfg, 0, false)

		out = append(out, models.CrewCandidate{
			Technician:        n.Technician,
			Score:             st.Score,
			BaseDistanceKm:    n.BaseDistanceKm,
			DistanceFromBase:  n.LocationSource == "base",
			LocationSource:    n.LocationSource,
			ActiveJobsThatDay: activeJobs[n.Technician.ID],
			Conflicts:         conflicts[n.Technician.ID],
		})
	}

	// Project crews are reserved capacity: don't suggest someone the assign step
	// would refuse. For an emergency they stay in, labelled, for the dispatcher to
	// decide. A failed roster lookup fails open, as it does on assign.
	if s.roster != nil {
		if rostered, err := s.roster.RosteredTechUserIDs(ctx, companyID, jobDay(facts, &startISO, now)); err == nil {
			if isEmergency(facts.Priority) {
				markRosteredCrew(out, rostered, facts.ProjectID)
			} else {
				out = dropRosteredCrew(out, rostered, facts.ProjectID)
			}
		}
	}

	SortCandidates(out)
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}
