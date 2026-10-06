package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/tscrm/scheduling-service/internal/disruptions"
	"github.com/tscrm/scheduling-service/internal/slots"
)

// DisruptionSource is what the disruption service reads; the slot repository implements it.
type DisruptionSource interface {
	SlotSource
	TodayVisits(ctx context.Context, companyID string, from, to time.Time) ([]disruptions.Visit, error)
	LivePositions(ctx context.Context, companyID string, fresh time.Time) (map[string]*slots.Point, error)
}

// Option is one way to deal with a disruption. Request is what to ask the
// assistant to do it; the assistant shows a confirmation card before anything changes.
type Option struct {
	Kind           string     `json:"kind"` // REASSIGN, MOVE, MESSAGE
	Label          string     `json:"label"`
	Request        string     `json:"request"`
	TechnicianID   string     `json:"technicianId,omitempty"`
	TechnicianName string     `json:"technicianName,omitempty"`
	Start          *time.Time `json:"start,omitempty"`
	Message        string     `json:"message,omitempty"`
}

type DisruptionItem struct {
	disruptions.Disruption
	// Detail is one plain sentence on what is going on.
	Detail string `json:"detail"`
	// FixJobID is the visit the options act on: the late one, or for an overrun the next one it delays.
	FixJobID string   `json:"fixJobId,omitempty"`
	Options  []Option `json:"options"`
}

type DisruptionReport struct {
	Timezone    string           `json:"timezone"`
	GeneratedAt time.Time        `json:"generatedAt"`
	Disruptions []DisruptionItem `json:"disruptions"`
}

const (
	positionFreshness = 30 * time.Minute
	maxReassignOffers = 2
)

type DisruptionService struct {
	src DisruptionSource
	now func() time.Time
}

func NewDisruptionService(src DisruptionSource) *DisruptionService {
	return &DisruptionService{src: src, now: time.Now}
}

// Today reports what is going wrong today, in the company's time, with ways to fix each.
func (s *DisruptionService) Today(ctx context.Context, companyID string) (*DisruptionReport, error) {
	tz, err := s.src.CompanyTimezone(ctx, companyID)
	if err != nil {
		return nil, err
	}
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc, tz = time.UTC, "UTC"
	}
	now := s.now()
	days, err := slots.WorkingDays(now.In(loc).Format("2006-01-02"), 2, loc) // today, and tomorrow for "move" options
	if err != nil {
		return nil, err
	}
	today := days[0]
	dayStart := time.Date(today.Open.Year(), today.Open.Month(), today.Open.Day(), 0, 0, 0, 0, loc)

	visits, err := s.src.TodayVisits(ctx, companyID, dayStart, dayStart.AddDate(0, 0, 1))
	if err != nil {
		return nil, err
	}
	positions, err := s.src.LivePositions(ctx, companyID, now.Add(-positionFreshness))
	if err != nil {
		return nil, err
	}
	shifts, err := s.src.ShiftOverrides(ctx, companyID, days[0].Date, days[1].Date)
	if err != nil {
		return nil, err
	}
	off := map[string]bool{}
	for _, r := range shifts {
		if !r.Available && r.Date == today.Date {
			off[r.TechnicianID] = true
		}
	}
	found := disruptions.Detect(now, visits, positions, off)
	report := &DisruptionReport{Timezone: tz, GeneratedAt: now, Disruptions: []DisruptionItem{}}
	if len(found) == 0 {
		return report, nil
	}

	techs, err := s.src.ActiveTechnicians(ctx, companyID)
	if err != nil {
		return nil, err
	}
	techs = withShifts(techs, shifts, loc)
	bookings, err := s.src.Bookings(ctx, companyID, days[0].Open, days[1].Close)
	if err != nil {
		return nil, err
	}
	byJob := map[string]disruptions.Visit{}
	for _, v := range visits {
		if _, seen := byJob[v.JobID]; !seen {
			byJob[v.JobID] = v
		}
	}

	for _, d := range found {
		item := DisruptionItem{Disruption: d, Detail: describe(d, loc), Options: []Option{}}
		target, delay := d.JobID, d.DelayMins
		if d.Kind == disruptions.TechOff {
			delay = 0 // nobody is late yet; the visit needs someone else or another day
		}
		if d.Kind == disruptions.Overrun {
			if len(d.KnockOn) == 0 {
				report.Disruptions = append(report.Disruptions, item) // nothing else at risk: worth knowing, nothing to move
				continue
			}
			target, delay = d.KnockOn[0].JobID, d.KnockOn[0].DelayMins
		}
		v, ok := byJob[target]
		if !ok {
			report.Disruptions = append(report.Disruptions, item)
			continue
		}
		item.FixJobID = target
		item.Options = s.options(now, loc, today, days, v, d, delay, techs, bookings, positions)
		report.Disruptions = append(report.Disruptions, item)
	}
	return report, nil
}

func (s *DisruptionService) options(
	now time.Time, loc *time.Location, today slots.Day, days []slots.Day,
	v disruptions.Visit, d disruptions.Disruption, delay int,
	techs []slots.Tech, bookings []slots.Booking, positions map[string]*slots.Point,
) []Option {
	var opts []Option
	others := withoutJob(bookings, v.JobID)
	req := slots.Request{Duration: v.Planned(), At: v.At, NotBefore: now}

	// 1. Someone else who can get there close to the planned time.
	type offer struct {
		t     slots.Tech
		start time.Time
		km    *float64
	}
	var offers []offer
	for _, t := range techs {
		if t.ID == v.TechID {
			continue
		}
		from := t.Start
		if p := positions[t.ID]; p != nil {
			from = p
		}
		drive, _ := slots.Travel(from, v.At)
		start := v.Start
		if earliest := slots.RoundUp(now.Add(drive), 5*time.Minute); earliest.After(start) {
			start = earliest
		}
		if ok, km := slots.FitsAt(req, t, today, others, start); ok {
			offers = append(offers, offer{t, start, km})
		}
	}
	sort.Slice(offers, func(i, j int) bool {
		if !offers[i].start.Equal(offers[j].start) {
			return offers[i].start.Before(offers[j].start)
		}
		return kmOr(offers[i].km) < kmOr(offers[j].km)
	})
	for i, o := range offers {
		if i == maxReassignOffers {
			break
		}
		start := o.start
		when := "on time"
		if late := start.Sub(v.Start); late > 0 {
			when = fmt.Sprintf("there by %s", clock(start, loc))
		}
		dist := ""
		if o.km != nil {
			dist = fmt.Sprintf(", %.0f km away", *o.km)
		}
		opts = append(opts, Option{
			Kind: "REASSIGN", TechnicianID: o.t.ID, TechnicianName: o.t.Name, Start: &start,
			Label:   fmt.Sprintf("Give %s to %s, %s%s", v.JobNumber, o.t.Name, when, dist),
			Request: fmt.Sprintf("Reassign %s to %s", v.JobNumber, o.t.Name),
		})
	}

	// 2. Keep the same technician, at their next open time from when they are free.
	// From when they are free; the slot finder adds the drive from their last job.
	notBefore := d.FreeAt
	same := []slots.Tech{}
	for _, t := range techs {
		if t.ID == v.TechID {
			same = append(same, t)
		}
	}
	if len(same) > 0 {
		next := slots.Find(slots.Request{Days: days, Duration: v.Planned(), At: v.At, TechIDs: []string{v.TechID}, NotBefore: notBefore, Limit: 1}, same, others)
		if len(next) > 0 {
			start := next[0].Start
			opts = append(opts, Option{
				Kind: "MOVE", TechnicianID: v.TechID, TechnicianName: v.TechName, Start: &start,
				Label:   fmt.Sprintf("Keep %s, move %s to %s", first(v.TechName), v.JobNumber, dayClock(start, now, loc)),
				Request: fmt.Sprintf("Move %s to %s", v.JobNumber, start.In(loc).Format("Mon 2 Jan 3:04 pm")),
			})
		}
	}

	// 3. Tell the customer, whatever else is decided.
	if delay > 0 && v.CustomerID != "" {
		msg := fmt.Sprintf("Hi %s, %s is running about %d minutes late for your %s visit today. Sorry for the wait; we will keep you posted.",
			first(v.CustomerName), first(d.TechName), roundTo5(delay), clock(v.Start, loc))
		opts = append(opts, Option{
			Kind: "MESSAGE", Message: msg,
			Label:   fmt.Sprintf("Tell %s it will be about %d minutes late", first(v.CustomerName), roundTo5(delay)),
			Request: fmt.Sprintf("Message the customer of %s: %q", v.JobNumber, msg),
		})
	}
	return opts
}

func describe(d disruptions.Disruption, loc *time.Location) string {
	switch d.Kind {
	case disruptions.LateStart:
		return fmt.Sprintf("%s was due at %s and %s has not set off. About %d minutes late.", d.JobNumber, clock(d.Start, loc), first(d.TechName), d.DelayMins)
	case disruptions.LateArrival:
		return fmt.Sprintf("%s is on the way to %s but will arrive about %d minutes after %s.", first(d.TechName), d.JobNumber, d.DelayMins, clock(d.Start, loc))
	case disruptions.TechOff:
		return fmt.Sprintf("%s is off today, but is booked for %s at %s.", first(d.TechName), d.JobNumber, clock(d.Start, loc))
	case disruptions.Overrun:
		s := fmt.Sprintf("%s has been at %s %d minutes longer than planned.", first(d.TechName), d.JobNumber, d.DelayMins)
		if n := len(d.KnockOn); n > 0 {
			s += fmt.Sprintf(" That makes %s about %d minutes late", d.KnockOn[0].JobNumber, d.KnockOn[0].DelayMins)
			if n > 1 {
				s += fmt.Sprintf(", and %d more after it", n-1)
			}
			s += "."
		}
		return s
	}
	return ""
}

func withoutJob(bs []slots.Booking, jobID string) []slots.Booking {
	out := make([]slots.Booking, 0, len(bs))
	for _, b := range bs {
		if b.JobID != jobID {
			out = append(out, b)
		}
	}
	return out
}

func clock(t time.Time, loc *time.Location) string {
	return strings.ToLower(t.In(loc).Format("3:04 PM"))
}

// dayClock is "3:30 pm" today, else "tomorrow 8:00 am".
func dayClock(t, now time.Time, loc *time.Location) string {
	if t.In(loc).Format("2006-01-02") == now.In(loc).Format("2006-01-02") {
		return clock(t, loc)
	}
	return "tomorrow " + clock(t, loc)
}

func first(name string) string {
	if f := strings.Fields(name); len(f) > 0 {
		return f[0]
	}
	return "the customer"
}

func roundTo5(m int) int {
	if m < 5 {
		return 5
	}
	return (m + 2) / 5 * 5
}

func kmOr(p *float64) float64 {
	if p == nil {
		return 1e9
	}
	return *p
}
