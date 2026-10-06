// Package gaps turns cancelled visits into time worth filling. When a booked
// visit is called off, its technician has a hole in the day; this finds the
// open window around it and the work that fits there: a job nobody has been
// given yet, or one of the same technician's later visits that could come
// forward. Pure (no database): the service feeds it the day's bookings.
package gaps

import (
	"sort"
	"time"

	"github.com/tscrm/scheduling-service/internal/slots"
)

const (
	// A window shorter than this is not worth offering.
	MinWindow = 30 * time.Minute
	// Length assumed for a job with no estimate.
	DefaultDuration = 60 * time.Minute
	MaxFills        = 3
)

// Freed is a cancelled visit that had a technician and a time.
type Freed struct {
	JobID, JobNumber, Customer, Reason string
	TechID, TechName                   string
	Start, End                         time.Time
	At                                 *slots.Point
	CancelledAt                        time.Time
}

// Candidate is open work that might fill a gap. TechID is empty when nobody
// has the job yet; Current is its booked start when it has one.
type Candidate struct {
	JobID, JobNumber, Title, Customer string
	Priority                          string // LOW, NORMAL, HIGH, EMERGENCY
	Duration                          time.Duration
	At                                *slots.Point
	TechID                            string
	Current                           *time.Time
	CreatedAt                         time.Time
}

type FillKind string

const (
	Assign      FillKind = "ASSIGN"       // give an unassigned job to the free technician
	PullForward FillKind = "PULL_FORWARD" // bring the technician's own later visit forward
)

type Fill struct {
	Kind      FillKind   `json:"kind"`
	JobID     string     `json:"jobId"`
	JobNumber string     `json:"jobNumber"`
	Title     string     `json:"title"`
	Customer  string     `json:"customer"`
	Priority  string     `json:"priority"`
	Start     time.Time  `json:"start"`
	End       time.Time  `json:"end"`
	TravelKm  *float64   `json:"travelKm"`
	Current   *time.Time `json:"currentStart,omitempty"`
	// Request is what to ask the assistant to do it; set by the service.
	Request string `json:"request"`
}

type Gap struct {
	CancelledJobID     string    `json:"cancelledJobId"`
	CancelledJobNumber string    `json:"cancelledJobNumber"`
	Customer           string    `json:"customer"`
	Reason             string    `json:"reason"`
	CancelledAt        time.Time `json:"cancelledAt"`
	TechID             string    `json:"technicianId"`
	TechName           string    `json:"technicianName"`
	Date               string    `json:"date"`
	// From and To are the open window: from when the technician is free to when
	// they must leave for the next visit (or the day ends).
	From  time.Time `json:"from"`
	To    time.Time `json:"to"`
	Fills []Fill    `json:"fills"`
}

// Find works out each freed visit's window and what could go in it.
// techs carry their own hours; bookings are live visits (cancelled ones
// excluded); notBefore keeps offers out of the past, with notice.
func Find(freed []Freed, techs []slots.Tech, days []slots.Day, bookings []slots.Booking, cands []Candidate, notBefore time.Time) []Gap {
	byID := map[string]slots.Tech{}
	for _, t := range techs {
		byID[t.ID] = t
	}
	byDate := map[string]slots.Day{}
	for _, d := range days {
		byDate[d.Date] = d
	}
	sort.SliceStable(freed, func(i, j int) bool { return freed[i].Start.Before(freed[j].Start) })

	var out []Gap
	seen := map[string]bool{} // one gap per technician window
	for _, f := range freed {
		tech, ok := byID[f.TechID]
		if !ok {
			continue
		}
		day, ok := dayOf(f.Start, days, byDate)
		if !ok || tech.OffOn(day.Date) {
			continue
		}
		from, to, ok := window(f, tech, day, bookings, notBefore)
		if !ok {
			continue
		}
		key := f.TechID + "|" + from.String()
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, Gap{
			CancelledJobID: f.JobID, CancelledJobNumber: f.JobNumber, Customer: f.Customer, Reason: f.Reason,
			CancelledAt: f.CancelledAt, TechID: tech.ID, TechName: tech.Name, Date: day.Date,
			From: from, To: to, Fills: fills(f, tech, day, from, to, bookings, cands),
		})
	}
	return out
}

func dayOf(t time.Time, days []slots.Day, byDate map[string]slots.Day) (slots.Day, bool) {
	if len(days) == 0 {
		return slots.Day{}, false
	}
	d, ok := byDate[t.In(days[0].Open.Location()).Format("2006-01-02")]
	return d, ok
}

// window is the open time around a freed visit, or false when something has
// already taken its place or too little is left.
func window(f Freed, tech slots.Tech, day slots.Day, bookings []slots.Booking, notBefore time.Time) (time.Time, time.Time, bool) {
	open, close := day.Open, day.Close
	if h, ok := tech.Hours[day.Date]; ok && !h.Off && !h.Open.IsZero() && !h.Close.IsZero() {
		open, close = h.Open, h.Close
	}
	from, to := open, close
	for _, b := range bookings {
		if b.TechID != f.TechID || b.JobID == f.JobID || !b.End.After(b.Start) {
			continue
		}
		if b.Start.Before(f.End) && b.End.After(f.Start) {
			return from, to, false // refilled already
		}
		if !b.End.After(f.Start) && b.End.After(from) {
			from = b.End
		}
		if !b.Start.Before(f.End) && b.Start.Before(to) {
			to = b.Start
		}
	}
	if notBefore.After(from) {
		from = slots.RoundUp(notBefore, slots.Grid)
	}
	return from, to, to.Sub(from) >= MinWindow
}

func fills(f Freed, tech slots.Tech, day slots.Day, from, to time.Time, bookings []slots.Booking, cands []Candidate) []Fill {
	var out []Fill
	for _, c := range cands {
		if c.JobID == f.JobID {
			continue
		}
		var kind FillKind
		switch {
		case c.TechID == "":
			kind = Assign
		case c.TechID == tech.ID && c.Current != nil && !c.Current.Before(to):
			kind = PullForward
		default:
			continue
		}
		dur := c.Duration
		if dur <= 0 {
			dur = DefaultDuration
		}
		if dur > to.Sub(from) {
			continue
		}
		others := bookings
		if kind == PullForward {
			others = without(bookings, c.JobID)
		}
		req := slots.Request{Days: []slots.Day{day}, Duration: dur, At: c.At, TechIDs: []string{tech.ID}, NotBefore: from}
		start, km, ok := place(req, tech, day, others, f.Start, from, to)
		if !ok {
			continue
		}
		out = append(out, Fill{
			Kind: kind, JobID: c.JobID, JobNumber: c.JobNumber, Title: c.Title, Customer: c.Customer, Priority: c.Priority,
			Start: start, End: start.Add(dur), TravelKm: km, Current: c.Current,
		})
	}
	sort.SliceStable(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if rank(a.Priority) != rank(b.Priority) {
			return rank(a.Priority) < rank(b.Priority)
		}
		if a.Kind != b.Kind {
			return a.Kind == Assign // waiting work first: a later visit already has a time
		}
		return kmOr(a.TravelKm) < kmOr(b.TravelKm)
	})
	if len(out) > MaxFills {
		out = out[:MaxFills]
	}
	if out == nil {
		out = []Fill{}
	}
	return out
}

// place keeps the cancelled visit's own start when it still works (the
// technician was planning around it), else the earliest start in the window.
func place(req slots.Request, tech slots.Tech, day slots.Day, bookings []slots.Booking, preferred, from, to time.Time) (time.Time, *float64, bool) {
	if !preferred.Before(from) {
		if ok, km := slots.FitsAt(req, tech, day, bookings, preferred); ok {
			return preferred, km, true
		}
	}
	for _, s := range slots.Find(req, []slots.Tech{tech}, bookings) {
		if !s.Start.Before(from) && s.Start.Before(to) && !s.End.After(to) {
			return s.Start, s.TravelKm, true
		}
	}
	return time.Time{}, nil, false
}

func without(bs []slots.Booking, jobID string) []slots.Booking {
	out := make([]slots.Booking, 0, len(bs))
	for _, b := range bs {
		if b.JobID != jobID {
			out = append(out, b)
		}
	}
	return out
}

func rank(p string) int {
	switch p {
	case "EMERGENCY":
		return 0
	case "HIGH":
		return 1
	case "LOW":
		return 3
	}
	return 2
}

func kmOr(p *float64) float64 {
	if p == nil {
		return 1e9
	}
	return *p
}
