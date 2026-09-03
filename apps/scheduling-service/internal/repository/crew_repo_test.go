package repository

import (
	"errors"
	"os"
	"strings"
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

// ═══════════════════════════════════════════════════════════════════════════
// Lead handover
// ═══════════════════════════════════════════════════════════════════════════

func TestSetLeadErrors_AreDistinct(t *testing.T) {
	// The handler maps these to different messages, so they must not collapse
	// into one another.
	if errors.Is(ErrNotOnCrew, ErrAlreadyCheckedOut) {
		t.Fatal("ErrNotOnCrew and ErrAlreadyCheckedOut must be distinct")
	}
	if ErrNotOnCrew.Error() == "" || ErrAlreadyCheckedOut.Error() == "" {
		t.Fatal("sentinel errors need messages")
	}
}

func TestSetLead_UsesTwoStatementSwap(t *testing.T) {
	// A single UPDATE ... SET is_lead = (technician_id = $3) touching both rows
	// can transiently violate uq_assignment_job_lead, because a partial unique
	// index cannot be deferred in Postgres. If this fails, someone collapsed the
	// swap into one statement — do not "fix" the test, restore the two statements.
	src, err := os.ReadFile("crew_repo.go")
	if err != nil {
		t.Fatal(err)
	}
	body := string(src)
	if !strings.Contains(body, "SET    is_lead = false") {
		t.Fatal("SetLead must unset the previous lead in its own statement")
	}
	if !strings.Contains(body, "SET    is_lead = true") {
		t.Fatal("SetLead must set the new lead in its own statement")
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Crew input validation
// ═══════════════════════════════════════════════════════════════════════════

func TestValidateCrewInput(t *testing.T) {
	cases := []struct {
		name string
		in   models.CrewInput
		want error
	}{
		{"lead outside the crew", models.CrewInput{
			TechnicianIDs: []string{"t1", "t2"}, LeadTechnicianID: "t9",
		}, ErrLeadNotInCrew},
		{"lead inside the crew", models.CrewInput{
			TechnicianIDs: []string{"t1", "t2"}, LeadTechnicianID: "t1",
		}, nil},
		// An empty crew is how a dispatcher undoes a mistake and leaves the job
		// unassigned, so it must not be an error.
		{"empty crew clears the job", models.CrewInput{
			TechnicianIDs: []string{}, LeadTechnicianID: "",
		}, nil},
		{"single member is their own lead", models.CrewInput{
			TechnicianIDs: []string{"t1"}, LeadTechnicianID: "t1",
		}, nil},
	}
	for _, c := range cases {
		if got := ValidateCrewInput(c.in); !errors.Is(got, c.want) {
			t.Fatalf("%s: got %v want %v", c.name, got, c.want)
		}
	}
}
