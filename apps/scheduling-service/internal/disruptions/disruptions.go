// Package disruptions spots today's visits that are going wrong and works out
// who else they will make late. It is pure (no database): the service feeds it
// today's live visits and where each technician is now.
//
// Three kinds, each measured against the visit's own planned time:
//   - late start:   start time passed by LateStartGrace and nobody has set off
//   - late arrival: on the way, but the drive from their live position lands
//     them LateArrivalGrace or more after the start
//   - overrun:      on site OverrunGrace longer than the visit was planned for
//   - tech off:     booked for a technician marked off that day (sick, leave)
//
// For each, the same technician's later visits today are walked in order with
// travel between them, to show the knock-on lateness a dispatcher cares about.
package disruptions

import (
	"sort"
	"time"

	"github.com/tscrm/scheduling-service/internal/slots"
)

const (
	LateStartGrace   = 10 * time.Minute
	LateArrivalGrace = 15 * time.Minute
	OverrunGrace     = 20 * time.Minute
	// A later visit counts as at risk when it would start this late or more.
	KnockOnGrace = 10 * time.Minute
	// Assumed time left once an overrun is noticed: it is nearly done.
	overrunWrapUp = 15 * time.Minute
)

type Kind string

const (
	LateStart   Kind = "LATE_START"
	LateArrival Kind = "LATE_ARRIVAL"
	Overrun     Kind = "OVERRUN"
	TechOff     Kind = "TECH_OFF"
)

// Visit is one technician's part in one job today.
type Visit struct {
	JobID, JobNumber, Title  string
	CustomerID, CustomerName string
	TechID, TechName         string
	Status                   string // job status: SCHEDULED, EN_ROUTE, ON_SITE
	Start, End               time.Time
	OnSiteAt                 *time.Time
	At                       *slots.Point
}

// Planned is how long the visit was booked for.
func (v Visit) Planned() time.Duration { return v.End.Sub(v.Start) }

// Late is a later visit the disruption will make late.
type Late struct {
	JobID     string    `json:"jobId"`
	JobNumber string    `json:"jobNumber"`
	Customer  string    `json:"customer"`
	Start     time.Time `json:"start"`
	DelayMins int       `json:"delayMins"`
}

type Disruption struct {
	Kind       Kind      `json:"kind"`
	JobID      string    `json:"jobId"`
	JobNumber  string    `json:"jobNumber"`
	Title      string    `json:"title"`
	CustomerID string    `json:"customerId"`
	Customer   string    `json:"customer"`
	TechID     string    `json:"technicianId"`
	TechName   string    `json:"technicianName"`
	Start      time.Time `json:"start"`
	// DelayMins is how late this visit is or will be (for an overrun: how far over).
	DelayMins int `json:"delayMins"`
	// FreeAt is when the technician should next be free, used for re-planning.
	FreeAt  time.Time `json:"freeAt"`
	KnockOn []Late    `json:"knockOn"`
}

// Detect finds today's disruptions. positions holds each technician's live
// position where known; off holds technicians marked off today. Visits for a
// technician who is off come first (someone has to act on each), then the
// biggest delay, then the soonest.
func Detect(now time.Time, visits []Visit, positions map[string]*slots.Point, off map[string]bool) []Disruption {
	byTech := map[string][]Visit{}
	for _, v := range visits {
		byTech[v.TechID] = append(byTech[v.TechID], v)
	}
	for id := range byTech {
		vs := byTech[id]
		sort.Slice(vs, func(i, j int) bool { return vs[i].Start.Before(vs[j].Start) })
	}

	var out []Disruption
	for _, v := range visits {
		if off[v.TechID] {
			if v.Status == "SCHEDULED" || v.Status == "PENDING" {
				out = append(out, Disruption{
					Kind: TechOff, JobID: v.JobID, JobNumber: v.JobNumber, Title: v.Title, CustomerID: v.CustomerID, Customer: v.CustomerName,
					TechID: v.TechID, TechName: v.TechName, Start: v.Start, FreeAt: v.Start, KnockOn: []Late{},
				})
			}
			continue
		}
		d, ok := assess(now, v, positions[v.TechID])
		if !ok {
			continue
		}
		d.KnockOn = knockOn(d.FreeAt, v, byTech[v.TechID])
		out = append(out, d)
	}
	sort.SliceStable(out, func(i, j int) bool {
		if (out[i].Kind == TechOff) != (out[j].Kind == TechOff) {
			return out[i].Kind == TechOff
		}
		if out[i].DelayMins != out[j].DelayMins {
			return out[i].DelayMins > out[j].DelayMins
		}
		return out[i].Start.Before(out[j].Start)
	})
	return out
}

func assess(now time.Time, v Visit, pos *slots.Point) (Disruption, bool) {
	d := Disruption{
		JobID: v.JobID, JobNumber: v.JobNumber, Title: v.Title, CustomerID: v.CustomerID, Customer: v.CustomerName,
		TechID: v.TechID, TechName: v.TechName, Start: v.Start,
	}
	switch v.Status {
	case "SCHEDULED", "PENDING":
		if now.Sub(v.Start) < LateStartGrace {
			return d, false
		}
		drive, _ := slots.Travel(pos, v.At)
		arrive := now.Add(drive)
		d.Kind, d.DelayMins, d.FreeAt = LateStart, mins(arrive.Sub(v.Start)), arrive.Add(v.Planned())
	case "EN_ROUTE":
		var arrive time.Time
		if pos != nil && v.At != nil {
			drive, _ := slots.Travel(pos, v.At)
			arrive = now.Add(drive)
		} else {
			arrive = now // no position: all we know is they are not there yet
		}
		if arrive.Sub(v.Start) < LateArrivalGrace {
			return d, false
		}
		d.Kind, d.DelayMins, d.FreeAt = LateArrival, mins(arrive.Sub(v.Start)), arrive.Add(v.Planned())
	case "ON_SITE":
		began := v.Start
		if v.OnSiteAt != nil {
			began = *v.OnSiteAt
		}
		due := began.Add(v.Planned())
		if now.Sub(due) < OverrunGrace {
			return d, false
		}
		d.Kind, d.DelayMins, d.FreeAt = Overrun, mins(now.Sub(due)), now.Add(overrunWrapUp)
	default:
		return d, false
	}
	return d, true
}

// knockOn walks the technician's later visits from when they will be free.
func knockOn(freeAt time.Time, from Visit, theirs []Visit) []Late {
	var out []Late
	cursor, at := freeAt, from.At
	for _, next := range theirs {
		if !next.Start.After(from.Start) || next.JobID == from.JobID {
			continue
		}
		drive, _ := slots.Travel(at, next.At)
		arrive := cursor.Add(drive)
		if late := arrive.Sub(next.Start); late >= KnockOnGrace {
			out = append(out, Late{JobID: next.JobID, JobNumber: next.JobNumber, Customer: next.CustomerName, Start: next.Start, DelayMins: mins(late)})
		}
		begin := next.Start
		if arrive.After(begin) {
			begin = arrive
		}
		cursor, at = begin.Add(next.Planned()), next.At
	}
	return out
}

func mins(d time.Duration) int {
	if d < 0 {
		return 0
	}
	return int((d + 30*time.Second) / time.Minute)
}
