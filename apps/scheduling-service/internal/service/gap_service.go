package service

import (
	"context"
	"fmt"
	"time"

	"github.com/tscrm/scheduling-service/internal/gaps"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// GapSource is what the gap service reads; the slot repository implements it.
type GapSource interface {
	SlotSource
	FreedVisits(ctx context.Context, companyID string, from, to time.Time) ([]gaps.Freed, error)
	FillCandidates(ctx context.Context, companyID string, from, to time.Time) ([]gaps.Candidate, error)
}

type GapReport struct {
	Timezone    string     `json:"timezone"`
	GeneratedAt time.Time  `json:"generatedAt"`
	Gaps        []gaps.Gap `json:"gaps"`
}

const (
	gapDays = 3 // today and the next two days: far enough to re-plan, near enough to matter
	// Later visits up to this far out may be brought forward.
	pullForwardHorizon = 14 * 24 * time.Hour
)

type GapService struct {
	src GapSource
	now func() time.Time
}

func NewGapService(src GapSource) *GapService {
	return &GapService{src: src, now: time.Now}
}

// Upcoming lists time freed by cancellations over the next few days, each with
// the work that fits it best.
func (s *GapService) Upcoming(ctx context.Context, companyID string) (*GapReport, error) {
	tz, err := s.src.CompanyTimezone(ctx, companyID)
	if err != nil {
		return nil, err
	}
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc, tz = time.UTC, "UTC"
	}
	now := s.now()
	days, err := slots.WorkingDays(now.In(loc).Format("2006-01-02"), gapDays, loc)
	if err != nil {
		return nil, err
	}
	first, last := days[0], days[len(days)-1]
	report := &GapReport{Timezone: tz, GeneratedAt: now, Gaps: []gaps.Gap{}}

	freed, err := s.src.FreedVisits(ctx, companyID, now, last.Close)
	if err != nil {
		return nil, err
	}
	if len(freed) == 0 {
		return report, nil
	}
	techs, err := s.src.ActiveTechnicians(ctx, companyID)
	if err != nil {
		return nil, err
	}
	shifts, err := s.src.ShiftOverrides(ctx, companyID, first.Date, last.Date)
	if err != nil {
		return nil, err
	}
	techs = withShifts(techs, shifts, loc)
	bookings, err := s.src.Bookings(ctx, companyID, first.Open, last.Close)
	if err != nil {
		return nil, err
	}
	cands, err := s.src.FillCandidates(ctx, companyID, now, now.Add(pullForwardHorizon))
	if err != nil {
		return nil, err
	}

	found := gaps.Find(freed, techs, days, bookings, cands, now.Add(slotNotice))
	for i := range found {
		g := &found[i]
		for j := range g.Fills {
			f := &g.Fills[j]
			when := f.Start.In(loc).Format("Mon 2 Jan 3:04 pm")
			if f.Kind == gaps.Assign {
				f.Request = fmt.Sprintf("Assign %s to %s on %s", f.JobNumber, g.TechName, when)
			} else {
				f.Request = fmt.Sprintf("Move %s to %s", f.JobNumber, when)
			}
		}
	}
	if found != nil {
		report.Gaps = found
	}
	return report, nil
}
