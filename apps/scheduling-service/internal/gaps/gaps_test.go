package gaps

import (
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/slots"
)

var (
	dxb, _  = time.LoadLocation("Asia/Dubai")
	days, _ = slots.WorkingDays("2026-10-07", 2, dxb)
	marina  = &slots.Point{Lat: 25.08, Lng: 55.14}
	jbr     = &slots.Point{Lat: 25.078, Lng: 55.133}
	kasun   = slots.Tech{ID: "k", Name: "Kasun", Start: marina}
)

func at(h, m int) time.Time      { return time.Date(2026, 10, 7, h, m, 0, 0, dxb) }
func ptr(t time.Time) *time.Time { return &t }

// Kasun: 08:00-09:00 A, [10:00-12:00 cancelled C], 14:00-15:00 B, 16:00-16:45 D.
func day() ([]Freed, []slots.Booking) {
	freed := []Freed{{JobID: "c", JobNumber: "JOB-C", TechID: "k", TechName: "Kasun", Start: at(10, 0), End: at(12, 0), At: marina}}
	bookings := []slots.Booking{
		{TechID: "k", JobID: "a", Start: at(8, 0), End: at(9, 0), At: marina},
		{TechID: "k", JobID: "b", Start: at(14, 0), End: at(15, 0), At: jbr},
		{TechID: "k", JobID: "d", Start: at(16, 0), End: at(16, 45), At: jbr},
	}
	return freed, bookings
}

func TestWindowRunsFromPreviousToNextVisit(t *testing.T) {
	freed, bookings := day()
	got := Find(freed, []slots.Tech{kasun}, days, bookings, nil, at(7, 0))
	if len(got) != 1 {
		t.Fatalf("want one gap, got %+v", got)
	}
	if !got[0].From.Equal(at(9, 0)) || !got[0].To.Equal(at(14, 0)) || got[0].Date != "2026-10-07" {
		t.Errorf("window should be 09:00 to 14:00, got %s to %s", got[0].From.In(dxb), got[0].To.In(dxb))
	}
	if got[0].Fills == nil || len(got[0].Fills) != 0 {
		t.Errorf("no candidates: fills should be an empty list, got %+v", got[0].Fills)
	}
}

func TestFillsPreferUrgentWaitingWorkAtTheOldTime(t *testing.T) {
	freed, bookings := day()
	cands := []Candidate{
		{JobID: "n1", JobNumber: "JOB-N1", Priority: "NORMAL", Duration: time.Hour, At: jbr},
		{JobID: "u1", JobNumber: "JOB-U1", Priority: "EMERGENCY", Duration: 90 * time.Minute, At: marina},
		{JobID: "d", JobNumber: "JOB-D", Priority: "NORMAL", Duration: 45 * time.Minute, At: jbr, TechID: "k", Current: ptr(at(16, 0))},
		{JobID: "x", JobNumber: "JOB-X", Priority: "EMERGENCY", Duration: time.Hour, TechID: "other", Current: ptr(at(16, 0))}, // someone else's
		{JobID: "big", JobNumber: "JOB-BIG", Priority: "HIGH", Duration: 6 * time.Hour},                                        // does not fit
	}
	got := Find(freed, []slots.Tech{kasun}, days, bookings, cands, at(7, 0))
	fills := got[0].Fills
	if len(fills) != 3 {
		t.Fatalf("want 3 fills, got %+v", fills)
	}
	if fills[0].JobID != "u1" || fills[0].Kind != Assign || !fills[0].Start.Equal(at(10, 0)) {
		t.Errorf("the emergency should come first, at the cancelled visit's 10:00; got %+v", fills[0])
	}
	if fills[1].JobID != "n1" || fills[2].JobID != "d" || fills[2].Kind != PullForward {
		t.Errorf("then waiting work, then Kasun's own later visit; got %s, %s", fills[1].JobID, fills[2].JobID)
	}
}

func TestRefilledOrPastGapsAreDropped(t *testing.T) {
	freed, bookings := day()
	refilled := append(bookings, slots.Booking{TechID: "k", JobID: "new", Start: at(10, 30), End: at(11, 30)})
	if got := Find(freed, []slots.Tech{kasun}, days, refilled, nil, at(7, 0)); len(got) != 0 {
		t.Errorf("a gap already filled should not be offered, got %+v", got)
	}
	// At 13:40, with notice, less than 30 minutes remain before 14:00.
	if got := Find(freed, []slots.Tech{kasun}, days, bookings, nil, at(13, 40)); len(got) != 0 {
		t.Errorf("too little time left, got %+v", got)
	}
	// Late morning: the window starts from now, rounded to the grid.
	got := Find(freed, []slots.Tech{kasun}, days, bookings, nil, at(10, 7))
	if len(got) != 1 || !got[0].From.Equal(at(10, 15)) {
		t.Errorf("window should start at 10:15, got %+v", got)
	}
}

func TestTechOffThatDayHasNoGap(t *testing.T) {
	freed, bookings := day()
	off := kasun
	off.Hours = map[string]slots.DayHours{"2026-10-07": {Off: true}}
	if got := Find(freed, []slots.Tech{off}, days, bookings, nil, at(7, 0)); len(got) != 0 {
		t.Errorf("nobody to fill it for, got %+v", got)
	}
}
