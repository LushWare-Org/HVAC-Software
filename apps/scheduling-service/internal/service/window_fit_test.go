package service

import (
	"testing"
	"time"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/slots"
)

func at(h, m int) time.Time { return time.Date(2026, 10, 12, h, m, 0, 0, time.UTC) }

func TestPickInWindow(t *testing.T) {
	offers := []slots.Slot{
		{TechID: "a", Start: at(8, 0)},   // before the window
		{TechID: "b", Start: at(9, 30)},  // someone else
		{TechID: "a", Start: at(11, 0)},  // inside
		{TechID: "a", Start: at(12, 30)}, // after
	}
	got := pickInWindow(offers, "a", at(9, 0), at(12, 0))
	if got == nil || !got.Equal(at(11, 0)) {
		t.Fatalf("want 11:00, got %v", got)
	}
	if pickInWindow(offers, "a", at(13, 0), at(16, 0)) != nil {
		t.Fatal("nothing should fit an empty window")
	}
	if pickInWindow(offers, "a", at(9, 0), at(11, 0)) != nil {
		t.Fatal("the end of the window is exclusive")
	}
}

func TestFittedTimesOnlyForWindowJobs(t *testing.T) {
	ws, we := at(8, 0), at(12, 0)
	start := at(10, 0)
	win := models.JobFacts{TimeMode: "WINDOW", WindowStart: &ws, WindowEnd: &we, DurationMins: 60}
	got := fittedTimes(win, &start)
	if len(got) != 2 || !got[1].Equal(at(11, 0)) {
		t.Fatalf("want 10:00-11:00, got %v", got)
	}
	if fittedTimes(models.JobFacts{TimeMode: "EXACT"}, &start) != nil {
		t.Fatal("an exact job must not be moved")
	}
	if fittedTimes(win, nil) != nil {
		t.Fatal("no fit, no change")
	}
	if visitLength(models.JobFacts{}) != defaultWindowVisit {
		t.Fatal("default visit length")
	}
}

func TestFitsRankDemotesOnlyKnownMisses(t *testing.T) {
	no, yes := false, true
	if fitsRank(models.ScoredTechnician{FitsWindow: &no}) != 0 {
		t.Fatal("a miss ranks last")
	}
	if fitsRank(models.ScoredTechnician{FitsWindow: &yes}) != 1 || fitsRank(models.ScoredTechnician{}) != 1 {
		t.Fatal("a fit, or an unknown, ranks normally")
	}
}
