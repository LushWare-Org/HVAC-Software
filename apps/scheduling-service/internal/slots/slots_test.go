package slots

import (
	"testing"
	"time"
)

var dubai, _ = time.LoadLocation("Asia/Dubai")

func at(t *testing.T, s string) time.Time {
	t.Helper()
	v, err := time.ParseInLocation("2006-01-02 15:04", s, dubai)
	if err != nil {
		t.Fatal(err)
	}
	return v
}

func day(t *testing.T, date string) []Day {
	t.Helper()
	d, err := WorkingDays(date, 1, dubai)
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func local(s Slot) string {
	return s.Start.In(dubai).Format("15:04") + "-" + s.End.In(dubai).Format("15:04")
}

func TestWorkingDaysOpenAndCloseInCompanyTime(t *testing.T) {
	days, err := WorkingDays("2026-10-07", 2, dubai)
	if err != nil {
		t.Fatal(err)
	}
	if got := days[0].Open.UTC().Format(time.RFC3339); got != "2026-10-07T04:00:00Z" {
		t.Errorf("Dubai 08:00 should be 04:00 UTC, got %s", got)
	}
	if days[1].Date != "2026-10-08" || days[1].Close.In(dubai).Hour() != DayEndHour {
		t.Errorf("second day wrong: %+v", days[1])
	}
	colombo, _ := time.LoadLocation("Asia/Colombo")
	c, _ := WorkingDays("2026-10-07", 1, colombo)
	if got := c[0].Open.UTC().Format("15:04"); got != "02:30" {
		t.Errorf("Colombo 08:00 should be 02:30 UTC, got %s", got)
	}
}

func TestEmptyDayOffersOpeningTime(t *testing.T) {
	got := Find(Request{Days: day(t, "2026-10-07"), Duration: 90 * time.Minute}, []Tech{{ID: "k", Name: "Kasun"}}, nil)
	if len(got) != 1 || local(got[0]) != "08:00-09:30" {
		t.Fatalf("want one 08:00-09:30 slot, got %+v", got)
	}
}

func TestGapsLeaveRoomToDriveBetweenJobs(t *testing.T) {
	// Booked 09:00-10:30 and 13:00-14:00, both with no location: 30 minute allowances.
	bookings := []Booking{
		{TechID: "k", Start: at(t, "2026-10-07 09:00"), End: at(t, "2026-10-07 10:30")},
		{TechID: "k", Start: at(t, "2026-10-07 13:00"), End: at(t, "2026-10-07 14:00")},
	}
	got := Find(Request{Days: day(t, "2026-10-07"), Duration: 60 * time.Minute}, []Tech{{ID: "k"}}, bookings)
	var times []string
	for _, s := range got {
		times = append(times, local(s))
	}
	// Before 09:00: 08:00-09:00 ends exactly at 09:00 but needs 30 min to drive -> no.
	// After 10:30: +30 travel = 11:00, must end by 12:30 -> 11:00-12:00.
	// After 14:00: +30 = 14:30 -> 14:30-15:30.
	want := []string{"11:00-12:00", "14:30-15:30"}
	if len(times) != len(want) || times[0] != want[0] || times[1] != want[1] {
		t.Fatalf("want %v, got %v", want, times)
	}
	for _, s := range got {
		for _, b := range bookings {
			if s.Start.Before(b.End) && b.Start.Before(s.End) {
				t.Errorf("slot %s overlaps a booking", local(s))
			}
		}
	}
}

func TestTravelGrowsWithDistance(t *testing.T) {
	marina := &Point{25.08, 55.14}
	near := &Point{25.085, 55.145} // ~0.7 km
	far := &Point{25.30, 55.45}    // ~40 km away
	short, kmShort := Travel(marina, near)
	long, kmLong := Travel(marina, far)
	if short != minTravel {
		t.Errorf("next door should get the minimum %s, got %s", minTravel, short)
	}
	if long <= time.Hour || *kmLong <= *kmShort {
		t.Errorf("a far job should need more than an hour, got %s (%v km)", long, *kmLong)
	}
	if d, k := Travel(nil, marina); d != DefaultTravel || k != nil {
		t.Errorf("unknown origin should fall back to %s", DefaultTravel)
	}
}

func TestFarPreviousJobPushesTheStart(t *testing.T) {
	site := &Point{25.08, 55.14}
	far := &Point{25.30, 55.45}
	bookings := []Booking{{TechID: "k", Start: at(t, "2026-10-07 08:00"), End: at(t, "2026-10-07 09:00"), At: far}}
	got := Find(Request{Days: day(t, "2026-10-07"), Duration: time.Hour, At: site}, []Tech{{ID: "k"}}, bookings)
	if len(got) == 0 {
		t.Fatal("expected a slot after the far job")
	}
	travel, km := Travel(far, site)
	if got[0].Start.Before(at(t, "2026-10-07 09:00").Add(travel)) || got[0].TravelKm == nil || *got[0].TravelKm != *km {
		t.Errorf("slot %s ignores the %s drive", local(got[0]), travel)
	}
}

func TestDailyLimitAndSkillAndRestriction(t *testing.T) {
	d := day(t, "2026-10-07")
	full := []Booking{
		{TechID: "n", Start: at(t, "2026-10-07 08:00"), End: at(t, "2026-10-07 09:00")},
		{TechID: "n", Start: at(t, "2026-10-07 15:00"), End: at(t, "2026-10-07 16:00")},
	}
	techs := []Tech{{ID: "n", Name: "Nuwan", MaxDailyJobs: 2, Skills: []string{"AC"}}, {ID: "k", Name: "Kasun", Skills: []string{"Plumbing"}}}

	for _, s := range Find(Request{Days: d, Duration: time.Hour}, techs, full) {
		if s.TechID == "n" {
			t.Errorf("Nuwan is at his daily limit but was offered %s", local(s))
		}
	}
	for _, s := range Find(Request{Days: d, Duration: time.Hour, Skill: "ac"}, techs, nil) {
		if s.TechID != "n" {
			t.Errorf("skill filter let %s through", s.TechName)
		}
	}
	for _, s := range Find(Request{Days: d, Duration: time.Hour, TechIDs: []string{"k"}}, techs, nil) {
		if s.TechID != "k" {
			t.Errorf("restriction let %s through", s.TechName)
		}
	}
}

func TestNotBeforeKeepsOffersOutOfThePastAndOnTheGrid(t *testing.T) {
	got := Find(Request{Days: day(t, "2026-10-07"), Duration: time.Hour, NotBefore: at(t, "2026-10-07 10:07")}, []Tech{{ID: "k"}}, nil)
	if len(got) != 1 || local(got[0]) != "10:15-11:15" {
		t.Fatalf("want 10:15-11:15, got %+v", got)
	}
	none := Find(Request{Days: day(t, "2026-10-07"), Duration: time.Hour, NotBefore: at(t, "2026-10-07 16:30")}, []Tech{{ID: "k"}}, nil)
	if len(none) != 0 {
		t.Errorf("nothing fits after 16:30, got %+v", none)
	}
}

func TestVisitLongerThanAnyGapGetsNothing(t *testing.T) {
	bookings := []Booking{{TechID: "k", Start: at(t, "2026-10-07 11:00"), End: at(t, "2026-10-07 13:00")}}
	got := Find(Request{Days: day(t, "2026-10-07"), Duration: 4 * time.Hour}, []Tech{{ID: "k"}}, bookings)
	if len(got) != 0 {
		t.Errorf("a 4 hour visit fits nowhere, got %+v", got)
	}
}

func TestSoonestFirstThenShortestDriveAndLimit(t *testing.T) {
	site := &Point{25.08, 55.14}
	techs := []Tech{
		{ID: "far", Name: "Far", Start: &Point{25.30, 55.45}},
		{ID: "near", Name: "Near", Start: &Point{25.081, 55.141}},
	}
	got := Find(Request{Days: append(day(t, "2026-10-07"), day(t, "2026-10-08")...), Duration: time.Hour, At: site, Limit: 3}, techs, nil)
	if len(got) != 3 {
		t.Fatalf("limit 3, got %d", len(got))
	}
	if got[0].TechID != "near" || got[1].TechID != "far" || !got[0].Start.Equal(got[1].Start) {
		t.Errorf("same start: nearer technician first, got %s then %s", got[0].TechName, got[1].TechName)
	}
	if got[2].Date != "2026-10-08" {
		t.Errorf("third offer should be the next day, got %s", got[2].Date)
	}
}

func TestOverlappingBookingsDoNotOpenAFalseGap(t *testing.T) {
	bookings := []Booking{
		{TechID: "k", Start: at(t, "2026-10-07 08:00"), End: at(t, "2026-10-07 12:00")},
		{TechID: "k", Start: at(t, "2026-10-07 09:00"), End: at(t, "2026-10-07 10:00")}, // inside the first
	}
	for _, s := range Find(Request{Days: day(t, "2026-10-07"), Duration: time.Hour}, []Tech{{ID: "k"}}, bookings) {
		if s.Start.Before(at(t, "2026-10-07 12:30")) {
			t.Errorf("offered %s inside a booked block", local(s))
		}
	}
}

func TestFitsAtChecksTheExactTime(t *testing.T) {
	d := day(t, "2026-10-07")[0]
	site := &Point{25.08, 55.14}
	tech := Tech{ID: "k", MaxDailyJobs: 3}
	bookings := []Booking{{TechID: "k", Start: at(t, "2026-10-07 09:00"), End: at(t, "2026-10-07 10:00")}}
	req := Request{Duration: time.Hour, At: site}

	cases := map[string]bool{
		"2026-10-07 07:30": false, // before opening
		"2026-10-07 08:00": false, // would end 09:00 with no time to drive to the next job
		"2026-10-07 09:30": false, // overlaps the booking
		"2026-10-07 10:15": false, // 15 min after the booking, but the drive takes 30 (unknown location)
		"2026-10-07 10:30": true,  // 30 min after: fits
		"2026-10-07 16:30": false, // would run past closing
	}
	for when, want := range cases {
		if got, _ := FitsAt(req, tech, d, bookings, at(t, when)); got != want {
			t.Errorf("%s: want %v, got %v", when, want, got)
		}
	}
	full := Tech{ID: "k", MaxDailyJobs: 1}
	if ok, _ := FitsAt(req, full, d, bookings, at(t, "2026-10-07 13:00")); ok {
		t.Error("a technician at their daily limit must not fit")
	}
	if ok, _ := FitsAt(Request{Duration: time.Hour, NotBefore: at(t, "2026-10-07 12:00")}, tech, d, nil, at(t, "2026-10-07 11:00")); ok {
		t.Error("a start before NotBefore must not fit")
	}
}

func TestDaysOffAndCustomHours(t *testing.T) {
	days, _ := WorkingDays("2026-10-07", 2, dubai)
	off := Tech{ID: "n", Hours: map[string]DayHours{"2026-10-07": {Off: true}}}
	got := Find(Request{Days: days, Duration: time.Hour}, []Tech{off}, nil)
	if len(got) != 1 || got[0].Date != "2026-10-08" {
		t.Fatalf("off on the 7th: only the 8th should be offered, got %+v", got)
	}
	if ok, _ := FitsAt(Request{Duration: time.Hour}, off, days[0], nil, at(t, "2026-10-07 10:00")); ok {
		t.Error("a technician who is off must not fit")
	}
	if !off.OffOn("2026-10-07") || off.OffOn("2026-10-08") {
		t.Error("OffOn wrong")
	}

	half := Tech{ID: "h", Hours: map[string]DayHours{"2026-10-07": {Open: at(t, "2026-10-07 08:00"), Close: at(t, "2026-10-07 12:00")}}}
	slots := Find(Request{Days: days[:1], Duration: 3 * time.Hour, NotBefore: at(t, "2026-10-07 09:30")}, []Tech{half}, nil)
	if len(slots) != 0 {
		t.Errorf("09:30 + 3h runs past a 12:00 finish, got %+v", slots)
	}
	if ok, _ := FitsAt(Request{Duration: time.Hour}, half, days[0], nil, at(t, "2026-10-07 13:00")); ok {
		t.Error("13:00 is outside a half day")
	}
	if ok, _ := FitsAt(Request{Duration: time.Hour}, half, days[0], nil, at(t, "2026-10-07 10:00")); !ok {
		t.Error("10:00-11:00 is inside the half day")
	}
}
