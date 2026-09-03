package repository

import (
	"testing"

	"github.com/tscrm/scheduling-service/internal/models"
)

// ═══════════════════════════════════════════════════════════════════════════
// LeadOf — pure function tests
// ═══════════════════════════════════════════════════════════════════════════

func TestLeadOf_ReturnsTheLead(t *testing.T) {
	crew := []models.CrewMember{
		{Assignment: models.DispatchAssignment{ID: "a1", IsLead: false}},
		{Assignment: models.DispatchAssignment{ID: "a2", IsLead: true}},
	}
	lead := models.LeadOf(crew)
	if lead == nil || lead.Assignment.ID != "a2" {
		t.Fatalf("expected a2 to be lead, got %+v", lead)
	}
}

func TestLeadOf_NoLeadReturnsNil(t *testing.T) {
	crew := []models.CrewMember{
		{Assignment: models.DispatchAssignment{ID: "a1", IsLead: false}},
	}
	if lead := models.LeadOf(crew); lead != nil {
		t.Fatalf("expected nil, got %+v", lead)
	}
}

func TestLeadOf_EmptyCrewReturnsNil(t *testing.T) {
	if lead := models.LeadOf(nil); lead != nil {
		t.Fatalf("expected nil for empty crew, got %+v", lead)
	}
}
