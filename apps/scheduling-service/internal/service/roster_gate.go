package service

// Roster gate — rostered project technicians are reserved capacity: excluded
// from smart-assign candidates and rejected (guided 409) on manual assign.
// Jobs that belong to the same project are exempt.

import (
	"context"
	"time"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

// RosterGate is implemented by repository.ProjectRosterRepository; an
// interface here keeps the filtering logic unit-testable without a DB.
type RosterGate interface {
	RosteredTechUserIDs(ctx context.Context, companyID, date string) (map[string]models.RosterInfo, error)
	JobProjectID(ctx context.Context, companyID, jobID string) (string, error)
}

// rosterDate resolves the calendar date an assignment applies to: the job's
// scheduled start when present, else today (UTC calendar date).
func rosterDate(scheduledStart *string) string {
	if scheduledStart != nil && *scheduledStart != "" {
		if t, err := time.Parse(time.RFC3339, *scheduledStart); err == nil {
			return t.UTC().Format("2006-01-02")
		}
	}
	return time.Now().UTC().Format("2006-01-02")
}

// filterRosteredCandidates drops candidates whose userId is reserved by a
// project that day — unless the job itself belongs to that same project.
func filterRosteredCandidates(
	candidates []repository.TechnicianWithDistance,
	rostered map[string]models.RosterInfo,
	jobProjectID string,
) []repository.TechnicianWithDistance {
	if len(rostered) == 0 {
		return candidates
	}
	out := make([]repository.TechnicianWithDistance, 0, len(candidates))
	for _, c := range candidates {
		if info, ok := rostered[c.Technician.UserID]; ok && info.ProjectID != jobProjectID {
			continue
		}
		out = append(out, c)
	}
	return out
}

// rosterBlock returns the TechOnProjectError for a tech userId, or nil when
// the tech is free (or the job belongs to the same project).
func rosterBlock(
	rostered map[string]models.RosterInfo,
	techUserID string,
	jobProjectID string,
	date string,
) *models.TechOnProjectError {
	info, ok := rostered[techUserID]
	if !ok || info.ProjectID == jobProjectID {
		return nil
	}
	return &models.TechOnProjectError{
		ProjectID:   info.ProjectID,
		ProjectName: info.ProjectName,
		Date:        date,
	}
}
