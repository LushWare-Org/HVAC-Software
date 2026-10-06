package service

import (
	"context"
	"time"

	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// SlotSource is what the slot service reads; the repository implements it.
type SlotSource interface {
	CompanyTimezone(ctx context.Context, companyID string) (string, error)
	ActiveTechnicians(ctx context.Context, companyID string) ([]slots.Tech, error)
	Bookings(ctx context.Context, companyID string, from, to time.Time) ([]slots.Booking, error)
	ShiftOverrides(ctx context.Context, companyID, from, to string) ([]repository.ShiftRow, error)
}

// withShifts gives each technician their own days off and hours from the
// shift entries, as absolute times in the company's zone.
func withShifts(techs []slots.Tech, rows []repository.ShiftRow, loc *time.Location) []slots.Tech {
	byTech := map[string]map[string]slots.DayHours{}
	for _, r := range rows {
		h := slots.DayHours{Off: !r.Available}
		if r.Available {
			if open, err := time.ParseInLocation("2006-01-02 15:04", r.Date+" "+r.Start, loc); err == nil {
				h.Open = open
			}
			if close, err := time.ParseInLocation("2006-01-02 15:04", r.Date+" "+r.End, loc); err == nil {
				h.Close = close
			}
		}
		if byTech[r.TechnicianID] == nil {
			byTech[r.TechnicianID] = map[string]slots.DayHours{}
		}
		byTech[r.TechnicianID][r.Date] = h
	}
	out := make([]slots.Tech, len(techs))
	for i, t := range techs {
		t.Hours = byTech[t.ID]
		out[i] = t
	}
	return out
}

// SlotQuery is one "when could we do this?" question.
type SlotQuery struct {
	// From is the first local day, YYYY-MM-DD. Empty means today.
	From         string
	Days         int
	DurationMins int
	Lat, Lng     *float64
	Skill        string
	TechIDs      []string
	Limit        int
}

type SlotResult struct {
	Timezone     string       `json:"timezone"`
	From         string       `json:"from"`
	Days         int          `json:"days"`
	DurationMins int          `json:"durationMins"`
	Slots        []slots.Slot `json:"slots"`
}

const (
	DefaultSlotDurationMins = 90 // matches the board's DEFAULT_DURATION_MIN
	defaultSlotDays         = 7
	maxSlotDays             = 14
	// Offers start at least this far ahead, so nobody is promised a visit in 20 minutes.
	slotNotice = time.Hour
)

type SlotService struct {
	src SlotSource
	now func() time.Time
}

func NewSlotService(src SlotSource) *SlotService {
	return &SlotService{src: src, now: time.Now}
}

// Find answers a SlotQuery in the company's own time zone.
func (s *SlotService) Find(ctx context.Context, companyID string, q SlotQuery) (*SlotResult, error) {
	tz, err := s.src.CompanyTimezone(ctx, companyID)
	if err != nil {
		return nil, err
	}
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc, tz = time.UTC, "UTC"
	}

	days := q.Days
	if days <= 0 {
		days = defaultSlotDays
	}
	if days > maxSlotDays {
		days = maxSlotDays
	}
	dur := q.DurationMins
	if dur <= 0 {
		dur = DefaultSlotDurationMins
	}
	if dur < 15 {
		dur = 15
	}
	if dur > 10*60 {
		dur = 10 * 60
	}
	now := s.now()
	from := q.From
	if from == "" {
		from = now.In(loc).Format("2006-01-02")
	}
	window, err := slots.WorkingDays(from, days, loc)
	if err != nil {
		return nil, err
	}

	techs, err := s.src.ActiveTechnicians(ctx, companyID)
	if err != nil {
		return nil, err
	}
	shifts, err := s.src.ShiftOverrides(ctx, companyID, window[0].Date, window[len(window)-1].Date)
	if err != nil {
		return nil, err
	}
	techs = withShifts(techs, shifts, loc)
	bookings, err := s.src.Bookings(ctx, companyID, window[0].Open, window[len(window)-1].Close)
	if err != nil {
		return nil, err
	}

	req := slots.Request{
		Days: window, Duration: time.Duration(dur) * time.Minute,
		Skill: q.Skill, TechIDs: q.TechIDs, NotBefore: now.Add(slotNotice), Limit: q.Limit,
	}
	if q.Lat != nil && q.Lng != nil {
		req.At = &slots.Point{Lat: *q.Lat, Lng: *q.Lng}
	}
	found := slots.Find(req, techs, bookings)
	if found == nil {
		found = []slots.Slot{}
	}
	return &SlotResult{Timezone: tz, From: from, Days: days, DurationMins: dur, Slots: found}, nil
}
