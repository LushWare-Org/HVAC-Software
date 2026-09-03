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
}

func NewCandidateService(
	techRepo *repository.TechnicianRepository,
	conflictRepo *repository.ConflictRepository,
	assignRepo *repository.AssignmentRepository,
	cfg *config.Config,
) *CandidateService {
	return &CandidateService{techRepo, conflictRepo, assignRepo, cfg}
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

	rowsFound, err := s.techRepo.FindCrewCandidates(
		ctx, companyID, lat, lng, s.cfg.MaxDistanceKm*2, 20)
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
			DistanceFromBase:  n.FromBase,
			ActiveJobsThatDay: activeJobs[n.Technician.ID],
			Conflicts:         conflicts[n.Technician.ID],
		})
	}

	SortCandidates(out)
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}
