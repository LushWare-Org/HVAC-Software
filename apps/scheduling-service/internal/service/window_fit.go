package service

import (
	"context"
	"fmt"
	"time"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// defaultWindowVisit is the visit length used when the job has no estimate.
const defaultWindowVisit = 90 * time.Minute

// isWindowJob: the customer asked for an arrival window and no exact time is set yet.
func isWindowJob(f models.JobFacts) bool {
	return f.TimeMode == "WINDOW" && f.WindowStart != nil && f.WindowEnd != nil && f.WindowEnd.After(*f.WindowStart)
}

func visitLength(f models.JobFacts) time.Duration {
	if f.DurationMins > 0 {
		return time.Duration(f.DurationMins) * time.Minute
	}
	return defaultWindowVisit
}

// pickInWindow is the first offered start that falls inside [from, to).
func pickInWindow(offers []slots.Slot, techID string, from, to time.Time) *time.Time {
	for _, o := range offers {
		if o.TechID == techID && !o.Start.Before(from) && o.Start.Before(to) {
			start := o.Start
			return &start
		}
	}
	return nil
}

// fitsRank: 0 only for a technician known to have no free time in the job's window.
func fitsRank(t models.ScoredTechnician) int {
	if t.FitsWindow != nil && !*t.FitsWindow {
		return 0
	}
	return 1
}

// fittedTimes is the start and end a window job gets once fitted at `start`.
func fittedTimes(f models.JobFacts, start *time.Time) []time.Time {
	if start == nil || !isWindowJob(f) {
		return nil
	}
	return []time.Time{*start, start.Add(visitLength(f))}
}

// windowFit looks for the earliest time inside the job's window that the technician is
// free for the whole visit. known is false when it could not be worked out (no slot
// service, or a lookup error): callers then leave the job as it is.
func (s *AssignmentService) windowFit(
	ctx context.Context, companyID string, f models.JobFacts, techID string,
	lat, lng float64, located bool,
) (start *time.Time, known bool) {
	if s.slots == nil || !isWindowJob(f) {
		return nil, false
	}
	loc := companyLocation(f.Timezone)
	q := SlotQuery{
		From: f.WindowStart.In(loc).Format("2006-01-02"), Days: 1,
		DurationMins: int(visitLength(f) / time.Minute),
		TechIDs:      []string{techID}, Limit: 20, NotBefore: *f.WindowStart,
	}
	if located {
		q.Lat, q.Lng = &lat, &lng
	}
	res, err := s.slots.Find(ctx, companyID, q)
	if err != nil {
		fmt.Printf("[WARN] window fit lookup failed: %v\n", err)
		return nil, false
	}
	return pickInWindow(res.Slots, techID, *f.WindowStart, *f.WindowEnd), true
}

// applyFittedTime writes the fitted time onto the job. A failure only logs: the
// assignment itself already stands.
func (s *AssignmentService) applyFittedTime(ctx context.Context, companyID, jobID string, fitted []time.Time) {
	if len(fitted) != 2 {
		return
	}
	if err := s.assignRepo.SetJobExactTime(ctx, companyID, jobID, fitted[0], fitted[1]); err != nil {
		fmt.Printf("[WARN] failed to set the fitted time on job %s: %v\n", jobID, err)
	}
}
