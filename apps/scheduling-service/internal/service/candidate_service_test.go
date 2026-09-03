package service

import (
	"testing"

	"github.com/tscrm/scheduling-service/internal/models"
)

func cand(name string, score float64, conflicts int) models.CrewCandidate {
	c := models.CrewCandidate{
		Technician: models.Technician{Name: name},
		Score:      score,
	}
	for i := 0; i < conflicts; i++ {
		c.Conflicts = append(c.Conflicts, models.ScheduleConflict{JobID: "j"})
	}
	return c
}

func TestSortCandidates_ConflictFreeFirst(t *testing.T) {
	// A high-scoring technician who is double-booked is a worse suggestion than a
	// lower-scoring one who is free, so availability outranks score.
	list := []models.CrewCandidate{
		cand("Busy", 95, 1),
		cand("Free", 70, 0),
	}
	SortCandidates(list)
	if list[0].Technician.Name != "Free" {
		t.Fatalf("expected the conflict-free candidate first, got %s", list[0].Technician.Name)
	}
}

func TestSortCandidates_ScoreBreaksTieWithinGroup(t *testing.T) {
	list := []models.CrewCandidate{
		cand("Lower", 60, 0),
		cand("Higher", 90, 0),
	}
	SortCandidates(list)
	if list[0].Technician.Name != "Higher" {
		t.Fatalf("expected the higher score first, got %s", list[0].Technician.Name)
	}
}

func TestSortCandidates_ClashingCandidatesStillRankedByScore(t *testing.T) {
	// Everyone clashes: the dispatcher still needs the least-bad option first.
	list := []models.CrewCandidate{
		cand("WorseClash", 40, 1),
		cand("BetterClash", 80, 2),
	}
	SortCandidates(list)
	if list[0].Technician.Name != "BetterClash" {
		t.Fatalf("expected higher score first among clashing candidates, got %s", list[0].Technician.Name)
	}
}

func TestSortCandidates_StableForEqualCandidates(t *testing.T) {
	// Equal candidates must keep their original order, or the list reshuffles
	// between refreshes while the dispatcher is reading it.
	list := []models.CrewCandidate{cand("A", 80, 0), cand("B", 80, 0)}
	SortCandidates(list)
	if list[0].Technician.Name != "A" {
		t.Fatalf("expected stable order, got %s first", list[0].Technician.Name)
	}
}

func TestSortCandidates_EmptyIsSafe(t *testing.T) {
	SortCandidates(nil)
	SortCandidates([]models.CrewCandidate{})
}
