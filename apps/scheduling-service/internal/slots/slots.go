// Package slots finds open times for a visit: per technician, per working day,
// in the gaps between what they are already booked for, leaving room to drive
// between jobs. It is pure (no database) so the rules can be tested directly.
//
// The day shape matches the admin board's "Plan a day" planner
// (admin-dashboard/src/lib/dayPlan.ts): a working day of 08:00-17:00 in the
// company's time zone and a 30 minute travel allowance when there is no
// location to measure from. Where both ends have a location, travel is
// estimated from distance instead, so a job across town gets more room than
// one next door.
package slots

import (
	"math"
	"sort"
	"strings"
	"time"
	_ "time/tzdata" // zone rules travel with the binary, whatever the image has
)

const (
	DayStartHour = 8
	DayEndHour   = 17
	// DefaultTravel is the allowance when either end has no location, as on the board.
	DefaultTravel = 30 * time.Minute
	// Grid that offered start times snap to, so offers read like times people book.
	Grid = 15 * time.Minute
	// Roads run about 1.3x the straight line; about 30 km/h in town.
	roadFactor = 1.3
	cityKmh    = 30.0
	minTravel  = 10 * time.Minute
	maxTravel  = 2 * time.Hour
)

type Point struct{ Lat, Lng float64 }

// Tech is a technician who could take the visit.
type Tech struct {
	ID           string
	Name         string
	Skills       []string
	MaxDailyJobs int
	// Start is where they begin the day (home base, else last known position).
	Start *Point
	// Hours overrides the standard day for particular local dates (YYYY-MM-DD):
	// a day off, or different hours. Dates not listed are standard days.
	Hours map[string]DayHours
}

// DayHours is one technician's own hours for one date.
type DayHours struct {
	Off bool
	// Open and Close replace the standard working hours when Off is false.
	Open, Close time.Time
}

// workday is the technician's window on `day`, or false when they are off.
// Custom hours never extend past the company's day.
func (t Tech) workday(day Day) (Day, bool) {
	h, ok := t.Hours[day.Date]
	if !ok {
		return day, true
	}
	if h.Off {
		return day, false
	}
	w := day
	if h.Open.After(w.Open) {
		w.Open = h.Open
	}
	if !h.Close.IsZero() && h.Close.Before(w.Close) {
		w.Close = h.Close
	}
	return w, w.Close.After(w.Open)
}

// OffOn reports whether the technician is marked off on a local date.
func (t Tech) OffOn(date string) bool {
	h, ok := t.Hours[date]
	return ok && h.Off
}

// Booking is time a technician is already committed to.
type Booking struct {
	TechID     string
	JobID      string
	Start, End time.Time
	At         *Point
}

// Day is one working window, already converted to absolute time.
type Day struct {
	Date        string // local YYYY-MM-DD
	Open, Close time.Time
}

type Request struct {
	Days     []Day
	Duration time.Duration
	// At is where the visit is. Optional; without it travel uses DefaultTravel.
	At *Point
	// Skill, when set, keeps only technicians who list it (case-insensitive).
	Skill string
	// TechIDs, when set, restricts the search to these technicians.
	TechIDs []string
	// NotBefore keeps offers out of the past and leaves notice (e.g. now + 1h).
	NotBefore time.Time
	// Limit caps the result. 0 means 20.
	Limit int
}

type Slot struct {
	TechID   string    `json:"technicianId"`
	TechName string    `json:"technicianName"`
	Date     string    `json:"date"`
	Start    time.Time `json:"start"`
	End      time.Time `json:"end"`
	// TravelKm is the estimated road distance from where they will be just before; nil when unknown.
	TravelKm *float64 `json:"travelKm"`
	// DayLoad is how many visits the technician already has that day.
	DayLoad int `json:"dayLoad"`
}

// WorkingDays builds `count` working windows starting on local date `from`
// (YYYY-MM-DD) in `loc`. Each day opens at DayStartHour and closes at DayEndHour.
func WorkingDays(from string, count int, loc *time.Location) ([]Day, error) {
	first, err := time.ParseInLocation("2006-01-02", from, loc)
	if err != nil {
		return nil, err
	}
	days := make([]Day, 0, count)
	for i := 0; i < count; i++ {
		d := first.AddDate(0, 0, i)
		days = append(days, Day{
			Date:  d.Format("2006-01-02"),
			Open:  time.Date(d.Year(), d.Month(), d.Day(), DayStartHour, 0, 0, 0, loc),
			Close: time.Date(d.Year(), d.Month(), d.Day(), DayEndHour, 0, 0, 0, loc),
		})
	}
	return days, nil
}

// Find returns open slots, soonest first; within the same start time the
// shortest drive wins. At most one slot per gap per technician, so the list
// offers genuinely different choices rather than every 15 minutes of one gap.
func Find(req Request, techs []Tech, bookings []Booking) []Slot {
	if req.Duration <= 0 || len(req.Days) == 0 {
		return nil
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	allowed := map[string]bool{}
	for _, id := range req.TechIDs {
		allowed[id] = true
	}
	byTech := map[string][]Booking{}
	for _, b := range bookings {
		if b.End.After(b.Start) {
			byTech[b.TechID] = append(byTech[b.TechID], b)
		}
	}

	var out []Slot
	for _, t := range techs {
		if len(allowed) > 0 && !allowed[t.ID] {
			continue
		}
		if req.Skill != "" && !hasSkill(t.Skills, req.Skill) {
			continue
		}
		mine := byTech[t.ID]
		sort.Slice(mine, func(i, j int) bool { return mine[i].Start.Before(mine[j].Start) })
		for _, day := range req.Days {
			w, working := t.workday(day)
			if !working {
				continue
			}
			out = append(out, openings(req, t, w, within(mine, day))...)
		}
	}

	sort.SliceStable(out, func(i, j int) bool {
		if !out[i].Start.Equal(out[j].Start) {
			return out[i].Start.Before(out[j].Start)
		}
		return km(out[i].TravelKm) < km(out[j].TravelKm)
	})
	if len(out) > limit {
		out = out[:limit]
	}
	return out
}

// openings walks one technician's day, gap by gap.
func openings(req Request, t Tech, day Day, booked []Booking) []Slot {
	if t.MaxDailyJobs > 0 && len(booked) >= t.MaxDailyJobs {
		return nil
	}
	var out []Slot
	prevEnd := day.Open
	prevAt := t.Start
	// The first gap starts at opening time without travel, as the board plans
	// it: a day begins with the technician setting off to the first job.
	firstGap := true

	gaps := append(booked, Booking{Start: day.Close, End: day.Close}) // closing time is the last edge
	for i, next := range gaps {
		isClose := i == len(gaps)-1

		earliest := prevEnd
		var travelKm *float64
		if !firstGap {
			d, k := Travel(prevAt, req.At)
			earliest = earliest.Add(d)
			travelKm = k
		} else if _, k := Travel(prevAt, req.At); k != nil {
			travelKm = k
		}
		if req.NotBefore.After(earliest) {
			earliest = req.NotBefore
		}
		start := RoundUp(earliest, Grid)

		latestEnd := next.Start
		if !isClose {
			d, _ := Travel(req.At, next.At)
			latestEnd = latestEnd.Add(-d)
		}
		if end := start.Add(req.Duration); !end.After(latestEnd) && !start.Before(day.Open) && !end.After(day.Close) {
			out = append(out, Slot{
				TechID: t.ID, TechName: t.Name, Date: day.Date,
				Start: start, End: end, TravelKm: travelKm, DayLoad: len(booked),
			})
		}

		if !isClose {
			if next.End.After(prevEnd) {
				prevEnd = next.End
			}
			if next.At != nil {
				prevAt = next.At
			}
			firstGap = false
		}
	}
	return out
}

// Travel estimates driving time and road distance between two places. With
// either end unknown it is DefaultTravel and an unknown distance.
func Travel(from, to *Point) (time.Duration, *float64) {
	if from == nil || to == nil {
		return DefaultTravel, nil
	}
	road := Haversine(*from, *to) * roadFactor
	mins := math.Ceil(road/cityKmh*60/5) * 5
	d := time.Duration(mins) * time.Minute
	if d < minTravel {
		d = minTravel
	}
	if d > maxTravel {
		d = maxTravel
	}
	r := math.Round(road*10) / 10
	return d, &r
}

func Haversine(a, b Point) float64 {
	const earthKm = 6371.0
	rad := func(d float64) float64 { return d * math.Pi / 180 }
	dLat, dLng := rad(b.Lat-a.Lat), rad(b.Lng-a.Lng)
	h := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(rad(a.Lat))*math.Cos(rad(b.Lat))*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * earthKm * math.Asin(math.Sqrt(h))
}

// RoundUp moves t forward to the next multiple of step (unchanged if already on one).
func RoundUp(t time.Time, step time.Duration) time.Time {
	r := t.Truncate(step)
	if r.Before(t) {
		r = r.Add(step)
	}
	return r
}

func within(bs []Booking, day Day) []Booking {
	var out []Booking
	for _, b := range bs {
		if b.Start.Before(day.Close) && b.End.After(day.Open) {
			out = append(out, b)
		}
	}
	return out
}

func hasSkill(skills []string, want string) bool {
	for _, s := range skills {
		if strings.EqualFold(strings.TrimSpace(s), strings.TrimSpace(want)) {
			return true
		}
	}
	return false
}

func km(p *float64) float64 {
	if p == nil {
		return math.MaxFloat64
	}
	return *p
}

// FitsAt reports whether a technician can do a visit starting exactly at
// `start` on `day`: inside working hours, under their daily limit, clear of
// their bookings with room to drive from the previous one and on to the next.
// travelKm is the drive from wherever they will be just before.
func FitsAt(req Request, t Tech, day Day, bookings []Booking, start time.Time) (ok bool, travelKm *float64) {
	day, working := t.workday(day)
	if !working {
		return false, nil
	}
	end := start.Add(req.Duration)
	if start.Before(day.Open) || end.After(day.Close) || start.Before(req.NotBefore) {
		return false, nil
	}
	var mine []Booking
	for _, b := range bookings {
		if b.TechID == t.ID && b.End.After(b.Start) {
			mine = append(mine, b)
		}
	}
	booked := within(mine, day)
	if t.MaxDailyJobs > 0 && len(booked) >= t.MaxDailyJobs {
		return false, nil
	}
	sort.Slice(booked, func(i, j int) bool { return booked[i].Start.Before(booked[j].Start) })

	prevAt, prevEnd, first := t.Start, day.Open, true
	for _, b := range booked {
		if !b.Start.Before(end) { // the first booking after the visit
			d, _ := Travel(req.At, b.At)
			if end.Add(d).After(b.Start) {
				return false, nil
			}
			break
		}
		if b.End.After(start) { // overlaps the visit
			return false, nil
		}
		if b.End.After(prevEnd) {
			prevEnd = b.End
		}
		if b.At != nil {
			prevAt = b.At
		}
		first = false
	}
	d, km := Travel(prevAt, req.At)
	if !first && prevEnd.Add(d).After(start) {
		return false, nil
	}
	return true, km
}
