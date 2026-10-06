package disruptions

import (
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/slots"
)

var base = time.Date(2026, 10, 7, 6, 0, 0, 0, time.UTC) // 10:00 in Dubai

func at(h, m int) time.Time {
	return base.Add(time.Duration(h-10)*time.Hour + time.Duration(m)*time.Minute)
}

func visit(job string, status string, start, end time.Time, place *slots.Point) Visit {
	return Visit{JobID: job, JobNumber: job, CustomerName: "Cust " + job, TechID: "n", TechName: "Nuwan", Status: status, Start: start, End: end, At: place}
}

var (
	marina = &slots.Point{Lat: 25.08, Lng: 55.14}
	jbr    = &slots.Point{Lat: 25.078, Lng: 55.133} // ~0.8 km from Marina
	deira  = &slots.Point{Lat: 25.27, Lng: 55.33}   // ~28 km away
)

func TestNothingToReportOnTime(t *testing.T) {
	vs := []Visit{
		visit("A", "SCHEDULED", at(10, 30), at(11, 30), marina), // not started yet
		visit("B", "SCHEDULED", at(9, 55), at(10, 55), marina),  // 5 min past: within grace
		visit("C", "ON_SITE", at(9, 0), at(10, 0), marina),      // 0 min over planned end: within grace
	}
	if got := Detect(at(10, 0), vs, nil, nil); len(got) != 0 {
		t.Fatalf("expected nothing, got %+v", got)
	}
}

func TestLateStartCountsTheDrive(t *testing.T) {
	vs := []Visit{visit("A", "SCHEDULED", at(9, 30), at(10, 30), marina)}
	got := Detect(at(10, 0), vs, map[string]*slots.Point{"n": deira}, nil)
	if len(got) != 1 || got[0].Kind != LateStart {
		t.Fatalf("want one late start, got %+v", got)
	}
	drive, _ := slots.Travel(deira, marina)
	if want := int((30*time.Minute + drive) / time.Minute); got[0].DelayMins != want {
		t.Errorf("30 min past start plus a %s drive should be %d min late, got %d", drive, want, got[0].DelayMins)
	}
}

func TestLateArrivalUsesLivePosition(t *testing.T) {
	vs := []Visit{visit("A", "EN_ROUTE", at(10, 0), at(11, 0), marina)}
	if got := Detect(at(9, 55), vs, map[string]*slots.Point{"n": jbr}, nil); len(got) != 0 {
		t.Errorf("close by and on time: no disruption, got %+v", got)
	}
	got := Detect(at(9, 55), vs, map[string]*slots.Point{"n": deira}, nil)
	if len(got) != 1 || got[0].Kind != LateArrival || got[0].DelayMins < 15 {
		t.Fatalf("28 km away five minutes before the start is late, got %+v", got)
	}
}

func TestOverrunMeasuresFromArrival(t *testing.T) {
	arrived := at(9, 0)
	v := visit("A", "ON_SITE", at(8, 30), at(9, 30), marina)
	v.OnSiteAt = &arrived // arrived 30 min late, so due to finish at 10:00, not 09:30
	if got := Detect(at(10, 10), []Visit{v}, nil, nil); len(got) != 0 {
		t.Errorf("10 min past a late arrival's finish is within grace, got %+v", got)
	}
	got := Detect(at(10, 40), []Visit{v}, nil, nil)
	if len(got) != 1 || got[0].Kind != Overrun || got[0].DelayMins != 40 {
		t.Fatalf("want a 40 min overrun, got %+v", got)
	}
	if !got[0].FreeAt.Equal(at(10, 55)) {
		t.Errorf("an overrun should be free in about 15 min, got %s", got[0].FreeAt)
	}
}

func TestKnockOnWalksTheRestOfTheDay(t *testing.T) {
	arrived := at(9, 0)
	running := visit("A", "ON_SITE", at(9, 0), at(10, 0), marina)
	running.OnSiteAt = &arrived
	vs := []Visit{
		running,
		visit("B", "SCHEDULED", at(11, 0), at(12, 0), jbr),    // free 11:15 + 10 min drive -> 25 late
		visit("C", "SCHEDULED", at(14, 0), at(15, 0), marina), // plenty of slack -> fine
	}
	// At 11:00 B's own start has not passed its grace yet: only the overrun is
	// reported, and B shows up as what it will make late.
	got := Detect(at(11, 0), vs, nil, nil)
	if len(got) != 1 || got[0].Kind != Overrun {
		t.Fatalf("want only the overrun, got %+v", got)
	}
	overrun := got[0]
	if len(overrun.KnockOn) != 1 || overrun.KnockOn[0].JobID != "B" || overrun.KnockOn[0].DelayMins != 25 {
		t.Fatalf("knock-on should be only B, 25 min late; got %+v", overrun.KnockOn)
	}
}

func TestMostPressingFirst(t *testing.T) {
	vs := []Visit{
		visit("small", "SCHEDULED", at(9, 45), at(10, 45), nil),
		{JobID: "big", TechID: "k", Status: "SCHEDULED", Start: at(9, 0), End: at(10, 0)},
	}
	got := Detect(at(10, 0), vs, nil, nil)
	if len(got) != 2 || got[0].JobID != "big" {
		t.Fatalf("the later-running visit should come first, got %+v", got)
	}
}

func TestTechOffFlagsTheirBookedVisitsFirst(t *testing.T) {
	vs := []Visit{
		visit("A", "SCHEDULED", at(14, 0), at(15, 0), marina),
		visit("B", "COMPLETED", at(8, 0), at(9, 0), marina),                             // already done: nothing to re-plan
		{JobID: "L", TechID: "k", Status: "SCHEDULED", Start: at(9, 0), End: at(10, 0)}, // someone else, 60 min late
	}
	got := Detect(at(10, 0), vs, nil, map[string]bool{"n": true})
	if len(got) != 2 || got[0].Kind != TechOff || got[0].JobID != "A" || got[1].JobID != "L" {
		t.Fatalf("want Nuwan's A first, then the late L; got %+v", got)
	}
}
