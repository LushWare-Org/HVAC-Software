package service

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/disruptions"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/slots"
)

type fakeDisruptionSource struct {
	fakeSlotSource
	visits    []disruptions.Visit
	positions map[string]*slots.Point
}

func (f *fakeDisruptionSource) TodayVisits(context.Context, string, time.Time, time.Time) ([]disruptions.Visit, error) {
	return f.visits, nil
}
func (f *fakeDisruptionSource) LivePositions(context.Context, string, time.Time) (map[string]*slots.Point, error) {
	return f.positions, nil
}

var dxb, _ = time.LoadLocation("Asia/Dubai")

func dubaiAt(h, m int) time.Time { return time.Date(2026, 10, 7, h, m, 0, 0, dxb) }

func TestOverrunOffersReassignMoveAndMessage(t *testing.T) {
	marina := &slots.Point{Lat: 25.08, Lng: 55.14}
	jbr := &slots.Point{Lat: 25.078, Lng: 55.133}
	arrived := dubaiAt(9, 0)
	visits := []disruptions.Visit{
		{JobID: "a", JobNumber: "JOB-A", CustomerID: "c-a", CustomerName: "Ali Hassan", TechID: "n", TechName: "Nuwan Silva",
			Status: "ON_SITE", Start: dubaiAt(9, 0), End: dubaiAt(10, 0), OnSiteAt: &arrived, At: marina},
		{JobID: "b", JobNumber: "JOB-B", CustomerID: "c-b", CustomerName: "Sara Perera", TechID: "n", TechName: "Nuwan Silva",
			Status: "SCHEDULED", Start: dubaiAt(11, 0), End: dubaiAt(12, 0), At: jbr},
	}
	src := &fakeDisruptionSource{
		fakeSlotSource: fakeSlotSource{
			tz: "Asia/Dubai",
			techs: []slots.Tech{
				{ID: "n", Name: "Nuwan Silva", MaxDailyJobs: 8, Start: marina},
				{ID: "k", Name: "Kasun Fernando", MaxDailyJobs: 8, Start: jbr},
			},
			bookings: []slots.Booking{
				{TechID: "n", JobID: "a", Start: dubaiAt(9, 0), End: dubaiAt(10, 0), At: marina},
				{TechID: "n", JobID: "b", Start: dubaiAt(11, 0), End: dubaiAt(12, 0), At: jbr},
			},
		},
		visits: visits,
	}
	svc := NewDisruptionService(src)
	svc.now = func() time.Time { return dubaiAt(10, 50) } // 50 min over at JOB-A; JOB-B due 11:00

	rep, err := svc.Today(context.Background(), "co")
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.Disruptions) != 1 {
		t.Fatalf("want one disruption (the overrun), got %+v", rep.Disruptions)
	}
	d := rep.Disruptions[0]
	if d.Kind != disruptions.Overrun || d.FixJobID != "b" || !strings.Contains(d.Detail, "That makes JOB-B about") {
		t.Fatalf("unexpected disruption: %+v", d)
	}

	kinds := map[string]Option{}
	for _, o := range d.Options {
		kinds[o.Kind] = o
	}
	re, ok := kinds["REASSIGN"]
	if !ok || re.TechnicianName != "Kasun Fernando" || !strings.Contains(re.Label, "on time") || re.Request != "Reassign JOB-B to Kasun Fernando" {
		t.Errorf("want Kasun on time for JOB-B, got %+v", re)
	}
	mv, ok := kinds["MOVE"]
	if !ok || mv.Start == nil || mv.Start.Before(dubaiAt(11, 5)) || !strings.HasPrefix(mv.Request, "Move JOB-B to ") {
		t.Errorf("want JOB-B moved to after Nuwan is free, got %+v", mv)
	}
	msg, ok := kinds["MESSAGE"]
	if !ok || !strings.HasPrefix(msg.Message, "Hi Sara, Nuwan is running about ") || !strings.Contains(msg.Message, "11:00 am visit") {
		t.Errorf("want a message to Sara about her 11:00 visit, got %+v", msg)
	}
}

func TestQuietDayReportsNothing(t *testing.T) {
	src := &fakeDisruptionSource{fakeSlotSource: fakeSlotSource{tz: "Asia/Dubai"}}
	svc := NewDisruptionService(src)
	svc.now = func() time.Time { return dubaiAt(10, 0) }
	rep, err := svc.Today(context.Background(), "co")
	if err != nil || rep.Disruptions == nil || len(rep.Disruptions) != 0 || rep.Timezone != "Asia/Dubai" {
		t.Fatalf("want an empty list, got %+v (%v)", rep, err)
	}
}

func TestLateStartOffersSomeoneCloserWhenTheyFit(t *testing.T) {
	site := &slots.Point{Lat: 25.08, Lng: 55.14}
	far := &slots.Point{Lat: 25.27, Lng: 55.33}
	src := &fakeDisruptionSource{
		fakeSlotSource: fakeSlotSource{tz: "Asia/Dubai", techs: []slots.Tech{
			{ID: "n", Name: "Nuwan Silva", MaxDailyJobs: 8, Start: far},
			{ID: "k", Name: "Kasun Fernando", MaxDailyJobs: 8, Start: site},
			{ID: "f", Name: "Full Fernando", MaxDailyJobs: 1, Start: site}, // already at his limit
		}, bookings: []slots.Booking{
			{TechID: "n", JobID: "x", Start: dubaiAt(10, 0), End: dubaiAt(11, 0), At: site},
			{TechID: "f", JobID: "y", Start: dubaiAt(14, 0), End: dubaiAt(15, 0)},
		}},
		visits: []disruptions.Visit{{JobID: "x", JobNumber: "JOB-X", CustomerID: "c", CustomerName: "Mia Kay", TechID: "n", TechName: "Nuwan Silva",
			Status: "SCHEDULED", Start: dubaiAt(10, 0), End: dubaiAt(11, 0), At: site}},
		positions: map[string]*slots.Point{"n": far},
	}
	svc := NewDisruptionService(src)
	svc.now = func() time.Time { return dubaiAt(10, 15) }
	rep, _ := svc.Today(context.Background(), "co")
	if len(rep.Disruptions) != 1 || rep.Disruptions[0].Kind != disruptions.LateStart {
		t.Fatalf("want a late start, got %+v", rep.Disruptions)
	}
	var names []string
	for _, o := range rep.Disruptions[0].Options {
		if o.Kind == "REASSIGN" {
			names = append(names, o.TechnicianName)
		}
	}
	if len(names) != 1 || names[0] != "Kasun Fernando" {
		t.Errorf("only Kasun should be offered (Full is at his limit), got %v", names)
	}
}

func TestTechOffOffersSomeoneElseOrTheirNextWorkingDay(t *testing.T) {
	site := &slots.Point{Lat: 25.08, Lng: 55.14}
	note := "Sick"
	src := &fakeDisruptionSource{
		fakeSlotSource: fakeSlotSource{
			tz: "Asia/Dubai",
			techs: []slots.Tech{
				{ID: "n", Name: "Nuwan Silva", MaxDailyJobs: 8, Start: site},
				{ID: "k", Name: "Kasun Fernando", MaxDailyJobs: 8, Start: site},
			},
			bookings: []slots.Booking{{TechID: "n", JobID: "x", Start: dubaiAt(14, 0), End: dubaiAt(15, 0), At: site}},
			shifts:   []repository.ShiftRow{{TechnicianID: "n", Date: "2026-10-07", Available: false, Note: &note}},
		},
		visits: []disruptions.Visit{{JobID: "x", JobNumber: "JOB-X", CustomerID: "c", CustomerName: "Mia Kay", TechID: "n", TechName: "Nuwan Silva",
			Status: "SCHEDULED", Start: dubaiAt(14, 0), End: dubaiAt(15, 0), At: site}},
	}
	svc := NewDisruptionService(src)
	svc.now = func() time.Time { return dubaiAt(8, 30) }
	rep, err := svc.Today(context.Background(), "co")
	if err != nil {
		t.Fatal(err)
	}
	if len(rep.Disruptions) != 1 || rep.Disruptions[0].Kind != disruptions.TechOff {
		t.Fatalf("want the 2 pm visit flagged, got %+v", rep.Disruptions)
	}
	d := rep.Disruptions[0]
	if d.Detail != "Nuwan is off today, but is booked for JOB-X at 2:00 pm." {
		t.Errorf("detail: %q", d.Detail)
	}
	kinds := map[string]Option{}
	for _, o := range d.Options {
		kinds[o.Kind] = o
	}
	if o := kinds["REASSIGN"]; o.TechnicianName != "Kasun Fernando" || !strings.Contains(o.Label, "on time") {
		t.Errorf("want Kasun on time, got %+v", o)
	}
	if o := kinds["MOVE"]; o.Start == nil || o.Start.In(dxb).Format("2006-01-02") != "2026-10-08" || !strings.Contains(o.Label, "tomorrow") {
		t.Errorf("Nuwan is off today: his next time should be tomorrow, got %+v", o)
	}
	if _, ok := kinds["MESSAGE"]; ok {
		t.Error("nobody is late yet: no lateness message to send")
	}
}
