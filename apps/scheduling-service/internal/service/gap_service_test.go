package service

import (
	"context"
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/gaps"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/slots"
)

type fakeGapSource struct {
	fakeSlotSource
	freed []gaps.Freed
	cands []gaps.Candidate
}

func (f *fakeGapSource) FreedVisits(context.Context, string, time.Time, time.Time) ([]gaps.Freed, error) {
	return f.freed, nil
}
func (f *fakeGapSource) FillCandidates(context.Context, string, time.Time, time.Time) ([]gaps.Candidate, error) {
	return f.cands, nil
}

func TestGapsAskTheAssistantInCompanyTime(t *testing.T) {
	later := dubaiAt(15, 0)
	src := &fakeGapSource{
		fakeSlotSource: fakeSlotSource{tz: "Asia/Dubai", techs: []slots.Tech{{ID: "k", Name: "Kasun"}}},
		freed:          []gaps.Freed{{JobID: "c", JobNumber: "JOB-C", TechID: "k", TechName: "Kasun", Start: dubaiAt(10, 0), End: dubaiAt(11, 0)}},
		cands: []gaps.Candidate{
			{JobID: "w", JobNumber: "JOB-W", Priority: "HIGH", Duration: time.Hour},
			{JobID: "l", JobNumber: "JOB-L", Priority: "NORMAL", Duration: time.Hour, TechID: "k", Current: &later},
		},
	}
	src.bookings = []slots.Booking{{TechID: "k", JobID: "l", Start: later, End: later.Add(time.Hour)}}
	svc := NewGapService(src)
	svc.now = func() time.Time { return dubaiAt(7, 0) }

	res, err := svc.Upcoming(context.Background(), "co")
	if err != nil {
		t.Fatal(err)
	}
	if res.Timezone != "Asia/Dubai" || len(res.Gaps) != 1 || len(res.Gaps[0].Fills) != 2 {
		t.Fatalf("want one gap with two fills, got %+v", res)
	}
	f := res.Gaps[0].Fills
	if f[0].Request != "Assign JOB-W to Kasun on Wed 7 Oct 10:00 am" {
		t.Errorf("assign request: %q", f[0].Request)
	}
	if f[1].Request != "Move JOB-L to Wed 7 Oct 10:00 am" {
		t.Errorf("pull-forward request: %q", f[1].Request)
	}
}

func TestNoCancellationsNoWork(t *testing.T) {
	src := &fakeGapSource{fakeSlotSource: fakeSlotSource{tz: "UTC", shifts: []repository.ShiftRow{}}}
	res, err := NewGapService(src).Upcoming(context.Background(), "co")
	if err != nil || res.Gaps == nil || len(res.Gaps) != 0 {
		t.Fatalf("want an empty list, got %+v, %v", res, err)
	}
}
