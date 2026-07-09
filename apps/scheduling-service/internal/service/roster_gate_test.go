package service

import (
	"testing"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

func tech(userID string) repository.TechnicianWithDistance {
	return repository.TechnicianWithDistance{
		Technician: models.Technician{ID: "sched-" + userID, UserID: userID},
		DistanceKm: 1,
	}
}

func TestFilterRosteredCandidates_ExcludesRosteredTech(t *testing.T) {
	rostered := map[string]models.RosterInfo{
		"u1": {ProjectID: "p1", ProjectName: "Lotus Tower HVAC"},
	}
	out := filterRosteredCandidates(
		[]repository.TechnicianWithDistance{tech("u1"), tech("u2")},
		rostered, "",
	)
	if len(out) != 1 || out[0].Technician.UserID != "u2" {
		t.Fatalf("expected only u2 to remain, got %+v", out)
	}
}

func TestFilterRosteredCandidates_ProjectJobExempt(t *testing.T) {
	rostered := map[string]models.RosterInfo{
		"u1": {ProjectID: "p1", ProjectName: "Lotus Tower HVAC"},
	}
	out := filterRosteredCandidates(
		[]repository.TechnicianWithDistance{tech("u1"), tech("u2")},
		rostered, "p1", // job belongs to the same project
	)
	if len(out) != 2 {
		t.Fatalf("project-owned job must keep rostered tech, got %+v", out)
	}
}

func TestFilterRosteredCandidates_NoRosterNoop(t *testing.T) {
	in := []repository.TechnicianWithDistance{tech("u1"), tech("u2")}
	out := filterRosteredCandidates(in, map[string]models.RosterInfo{}, "")
	if len(out) != 2 {
		t.Fatalf("empty roster must be a no-op, got %+v", out)
	}
}

func TestRosterBlock_Returns409Payload(t *testing.T) {
	rostered := map[string]models.RosterInfo{
		"u1": {ProjectID: "p1", ProjectName: "Lotus Tower HVAC"},
	}
	blk := rosterBlock(rostered, "u1", "", "2026-07-15")
	if blk == nil {
		t.Fatal("expected a block")
	}
	if blk.ProjectID != "p1" || blk.ProjectName != "Lotus Tower HVAC" || blk.Date != "2026-07-15" {
		t.Fatalf("wrong payload: %+v", blk)
	}
}

func TestRosterBlock_SameProjectExemptAndFreeTechNil(t *testing.T) {
	rostered := map[string]models.RosterInfo{
		"u1": {ProjectID: "p1", ProjectName: "Lotus Tower HVAC"},
	}
	if blk := rosterBlock(rostered, "u1", "p1", "2026-07-15"); blk != nil {
		t.Fatalf("same-project job must be exempt, got %+v", blk)
	}
	if blk := rosterBlock(rostered, "u9", "", "2026-07-15"); blk != nil {
		t.Fatalf("free tech must not be blocked, got %+v", blk)
	}
}

func TestRosterDate_UsesScheduledStartElseToday(t *testing.T) {
	s := "2026-08-03T09:30:00Z"
	if got := rosterDate(&s); got != "2026-08-03" {
		t.Fatalf("expected 2026-08-03, got %s", got)
	}
	if got := rosterDate(nil); len(got) != 10 {
		t.Fatalf("expected YYYY-MM-DD today, got %s", got)
	}
}
