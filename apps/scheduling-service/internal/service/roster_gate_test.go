package service

import (
	"context"
	"testing"
	"time"

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

func TestJobDay_IsTheCompanysDay(t *testing.T) {
	now := time.Date(2026, 10, 8, 3, 0, 0, 0, time.UTC)
	colombo := models.JobFacts{Timezone: "Asia/Colombo"}
	// 20:00 UTC on 8 Oct is 01:30 on 9 Oct in Colombo: the roster for the 9th applies.
	late := "2026-10-08T20:00:00Z"
	if got := jobDay(colombo, &late, now); got != "2026-10-09" {
		t.Fatalf("expected the Colombo day 2026-10-09, got %s", got)
	}
	stored := time.Date(2026, 10, 12, 4, 0, 0, 0, time.UTC)
	if got := jobDay(models.JobFacts{Timezone: "Asia/Colombo", ScheduledStart: &stored}, nil, now); got != "2026-10-12" {
		t.Fatalf("expected the stored start's day, got %s", got)
	}
	if got := jobDay(colombo, nil, now); got != "2026-10-08" {
		t.Fatalf("an unscheduled job is today, got %s", got)
	}
	if got := jobDay(models.JobFacts{Timezone: "Not/AZone"}, &late, now); got != "2026-10-08" {
		t.Fatalf("an unknown time zone falls back to UTC, got %s", got)
	}
}

func TestUsesLivePosition_TodayAndEmergenciesOnly(t *testing.T) {
	now := time.Date(2026, 10, 8, 5, 0, 0, 0, time.UTC)
	today := "2026-10-08T09:00:00Z"
	tomorrow := "2026-10-09T05:00:00Z"
	f := models.JobFacts{Timezone: "Asia/Colombo", Priority: "NORMAL"}
	if !usesLivePosition(f, &today, now) {
		t.Error("a job today should rank from where technicians are now")
	}
	if !usesLivePosition(f, nil, now) {
		t.Error("an unscheduled job is being dispatched now")
	}
	if usesLivePosition(f, &tomorrow, now) {
		t.Error("a job tomorrow should rank from where technicians start their day")
	}
	f.Priority = "EMERGENCY"
	if !usesLivePosition(f, &tomorrow, now) {
		t.Error("an emergency always ranks from where technicians are now")
	}
}

func TestIsEmergency(t *testing.T) {
	for _, p := range []string{"EMERGENCY", "emergency", "URGENT"} {
		if !isEmergency(p) {
			t.Errorf("%s should count as an emergency", p)
		}
	}
	for _, p := range []string{"HIGH", "NORMAL", ""} {
		if isEmergency(p) {
			t.Errorf("%s is not an emergency", p)
		}
	}
}

func TestMarkRostered_LabelsInsteadOfDropping(t *testing.T) {
	rostered := map[string]models.RosterInfo{"u-kasun": {ProjectID: "p-mall", ProjectName: "Colombo Mall"}}
	scored := []models.ScoredTechnician{{Technician: models.Technician{UserID: "u-kasun"}}, {Technician: models.Technician{UserID: "u-nuwan"}}}
	markRosteredScored(scored, rostered, "")
	if len(scored) != 2 || scored[0].OnProject == nil || scored[0].OnProject.ProjectName != "Colombo Mall" || scored[1].OnProject != nil {
		t.Fatalf("expected Kasun labelled and Nuwan untouched, got %+v", scored)
	}
	crew := []models.CrewCandidate{crewCand("u-kasun")}
	markRosteredCrew(crew, rostered, "p-mall")
	if crew[0].OnProject != nil {
		t.Fatal("a Mall job using the Mall crew is not pulling anyone off a project")
	}
}

func crewCand(userID string) models.CrewCandidate {
	return models.CrewCandidate{Technician: models.Technician{UserID: userID, Name: userID}}
}

func TestDropRosteredCrew_ReservedElsewhereIsLeftOut(t *testing.T) {
	// Kasun is on the Mall project today; Nuwan is free.
	rostered := map[string]models.RosterInfo{"u-kasun": {ProjectID: "p-mall", ProjectName: "Colombo Mall"}}
	got := dropRosteredCrew([]models.CrewCandidate{crewCand("u-kasun"), crewCand("u-nuwan")}, rostered, "")
	if len(got) != 1 || got[0].Technician.UserID != "u-nuwan" {
		t.Fatalf("expected only the free technician, got %+v", got)
	}
}

func TestDropRosteredCrew_SameProjectJobKeepsTheCrew(t *testing.T) {
	// A job on the Mall project can go to the Mall crew.
	rostered := map[string]models.RosterInfo{"u-kasun": {ProjectID: "p-mall"}}
	got := dropRosteredCrew([]models.CrewCandidate{crewCand("u-kasun")}, rostered, "p-mall")
	if len(got) != 1 {
		t.Fatalf("expected the project crew to stay available for its own job, got %+v", got)
	}
}

func TestDropRosteredCrew_NoRosterChangesNothing(t *testing.T) {
	got := dropRosteredCrew([]models.CrewCandidate{crewCand("a"), crewCand("b")}, nil, "")
	if len(got) != 2 {
		t.Fatalf("expected all candidates without a roster, got %d", len(got))
	}
}

func TestCrewRosterBlock_NamesTheFirstTechnicianReservedElsewhere(t *testing.T) {
	rostered := map[string]models.RosterInfo{"u-nuwan": {ProjectID: "p-mall", ProjectName: "Colombo Mall"}}
	block := crewRosterBlock(rostered, []string{"u-kasun", "u-nuwan"}, "", "2026-10-08")
	if block == nil || block.ProjectName != "Colombo Mall" || block.Date != "2026-10-08" {
		t.Fatalf("expected Nuwan's Mall roster to block the crew, got %+v", block)
	}
}

func TestCrewRosterBlock_SameProjectAndFreeCrewsPass(t *testing.T) {
	rostered := map[string]models.RosterInfo{"u-nuwan": {ProjectID: "p-mall"}}
	if b := crewRosterBlock(rostered, []string{"u-nuwan"}, "p-mall", "2026-10-08"); b != nil {
		t.Fatalf("a Mall job can use the Mall crew, got %+v", b)
	}
	if b := crewRosterBlock(rostered, []string{"u-kasun"}, "", "2026-10-08"); b != nil {
		t.Fatalf("a free technician must pass, got %+v", b)
	}
}

type fakeRosterGate struct {
	rostered map[string]models.RosterInfo
	facts    models.JobFacts
}

func (f fakeRosterGate) RosteredTechUserIDs(context.Context, string, string) (map[string]models.RosterInfo, error) {
	return f.rostered, nil
}
func (f fakeRosterGate) JobFacts(context.Context, string, string) (models.JobFacts, error) {
	return f.facts, nil
}

type fakeCrewSource struct {
	fakeRosterGate
	users map[string]string
}

func (f fakeCrewSource) TechUserIDs(_ context.Context, _ string, ids []string) (map[string]string, error) {
	out := map[string]string{}
	for _, id := range ids {
		if u, ok := f.users[id]; ok {
			out[id] = u
		}
	}
	return out, nil
}

func TestCheckCrew_UsesTheJobsDayAndProject(t *testing.T) {
	start := time.Date(2026, 10, 8, 4, 0, 0, 0, time.UTC)
	src := fakeCrewSource{
		fakeRosterGate: fakeRosterGate{
			rostered: map[string]models.RosterInfo{"u-nuwan": {ProjectID: "p-mall", ProjectName: "Colombo Mall"}},
			facts:    models.JobFacts{Priority: "NORMAL", ScheduledStart: &start, Timezone: "Asia/Colombo"},
		},
		users: map[string]string{"t-nuwan": "u-nuwan", "t-kasun": "u-kasun"},
	}
	block, err := CheckCrew(context.Background(), src, "co", "j-1", []string{"t-kasun", "t-nuwan"})
	if err != nil || block == nil || block.ProjectName != "Colombo Mall" || block.Date != "2026-10-08" {
		t.Fatalf("expected a block for Nuwan on the 8th, got %+v, %v", block, err)
	}

	emergency := src
	emergency.facts.Priority = "EMERGENCY"
	if block, _ := CheckCrew(context.Background(), emergency, "co", "j-1", []string{"t-nuwan"}); block != nil {
		t.Fatalf("an emergency may pull Nuwan off the project, got %+v", block)
	}

	unscheduled := src
	unscheduled.facts.ScheduledStart = nil
	if block, _ := CheckCrew(context.Background(), unscheduled, "co", "j-1", []string{"t-nuwan"}); block != nil {
		t.Fatalf("an unscheduled job has no day to check, got %+v", block)
	}
}

func TestUnlocated_EveryoneAtTheEdgeOfTheRadius(t *testing.T) {
	got := unlocated([]repository.TechnicianWithDistance{tech("a"), tech("b")}, 50)
	for _, c := range got {
		if c.DistanceKm != 50 || c.Located {
			t.Fatalf("without a job location nobody is nearer than anyone else, got %+v", c)
		}
	}
}
