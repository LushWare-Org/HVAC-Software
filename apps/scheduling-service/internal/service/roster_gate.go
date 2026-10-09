package service

// Roster gate — rostered project technicians are reserved capacity: excluded
// from smart-assign candidates and rejected (guided 409) on manual assign.
// Jobs that belong to the same project are exempt, and so are emergencies:
// any technician may be pulled off a project for one, and is labelled so.

import (
	"context"
	"strings"
	"time"

	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

// RosterGate is implemented by repository.ProjectRosterRepository; an
// interface here keeps the filtering logic unit-testable without a DB.
type RosterGate interface {
	RosteredTechUserIDs(ctx context.Context, companyID, date string) (map[string]models.RosterInfo, error)
	JobFacts(ctx context.Context, companyID, jobID string) (models.JobFacts, error)
}

// livePositionFreshness: a GPS fix older than this says nothing about where a
// technician is now, so ranking falls back to where they start their day.
const livePositionFreshness = 30 * time.Minute

// isEmergency: emergencies may take a technician off a project for the day.
func isEmergency(priority string) bool {
	p := strings.ToUpper(strings.TrimSpace(priority))
	return p == "EMERGENCY" || p == "URGENT"
}

// companyLocation is the company's time zone, UTC when unknown.
func companyLocation(tz string) *time.Location {
	if tz != "" {
		if loc, err := time.LoadLocation(tz); err == nil {
			return loc
		}
	}
	return time.UTC
}

// jobDay is the calendar day (YYYY-MM-DD) the job happens on, in the company's
// own time zone. A start time in the request wins over the stored one; an
// unscheduled job is being dispatched now, so it is today.
func jobDay(f models.JobFacts, scheduledStart *string, now time.Time) string {
	loc := companyLocation(f.Timezone)
	if scheduledStart != nil && *scheduledStart != "" {
		if t, err := time.Parse(time.RFC3339, *scheduledStart); err == nil {
			return t.In(loc).Format("2006-01-02")
		}
	}
	if f.ScheduledStart != nil {
		return f.ScheduledStart.In(loc).Format("2006-01-02")
	}
	return now.In(loc).Format("2006-01-02")
}

// usesLivePosition: today's work and emergencies are ranked from where the
// technician is now; work on a later day from where they start that day.
func usesLivePosition(f models.JobFacts, scheduledStart *string, now time.Time) bool {
	if isEmergency(f.Priority) {
		return true
	}
	return jobDay(f, scheduledStart, now) == now.In(companyLocation(f.Timezone)).Format("2006-01-02")
}

// reservedElsewhere: the technician is on a project roster that day, and the
// job is not part of that project. The one rule every roster check uses.
func reservedElsewhere(rostered map[string]models.RosterInfo, techUserID, jobProjectID string) bool {
	info, ok := rostered[techUserID]
	return ok && info.ProjectID != jobProjectID
}

// dropRosteredCrew is filterRosteredCandidates for the "who could take this
// job" list, so suggestions never offer someone the assign step would refuse.
func dropRosteredCrew(cands []models.CrewCandidate, rostered map[string]models.RosterInfo, jobProjectID string) []models.CrewCandidate {
	if len(rostered) == 0 {
		return cands
	}
	out := make([]models.CrewCandidate, 0, len(cands))
	for _, c := range cands {
		if !reservedElsewhere(rostered, c.Technician.UserID, jobProjectID) {
			out = append(out, c)
		}
	}
	return out
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
		if reservedElsewhere(rostered, c.Technician.UserID, jobProjectID) {
			continue
		}
		out = append(out, c)
	}
	return out
}

// markRosteredScored keeps every candidate but labels the ones a project has
// reserved: for an emergency the dispatcher may still take them off it.
func markRosteredScored(scored []models.ScoredTechnician, rostered map[string]models.RosterInfo, jobProjectID string) {
	for i := range scored {
		if reservedElsewhere(rostered, scored[i].Technician.UserID, jobProjectID) {
			info := rostered[scored[i].Technician.UserID]
			scored[i].OnProject = &info
		}
	}
}

func markRosteredCrew(cands []models.CrewCandidate, rostered map[string]models.RosterInfo, jobProjectID string) {
	for i := range cands {
		if reservedElsewhere(rostered, cands[i].Technician.UserID, jobProjectID) {
			info := rostered[cands[i].Technician.UserID]
			cands[i].OnProject = &info
		}
	}
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

// CrewRosterSource is what the crew check reads: the roster, the job's facts and
// the technicians' user ids (rosters are keyed by user id).
type CrewRosterSource interface {
	RosterGate
	TechUserIDs(ctx context.Context, companyID string, techIDs []string) (map[string]string, error)
}

// crewRosterBlock: the first proposed crew member reserved on another project
// that day, as the guided error; nil when the crew is free.
func crewRosterBlock(rostered map[string]models.RosterInfo, userIDs []string, jobProjectID, date string) *models.TechOnProjectError {
	for _, u := range userIDs {
		if reservedElsewhere(rostered, u, jobProjectID) {
			return rosterBlock(rostered, u, jobProjectID, date)
		}
	}
	return nil
}

// CheckCrew applies the roster rule to a whole crew before it is saved, the
// same rule a single assignment gets. An unscheduled job has no day to check,
// and an emergency may take people off a project.
func CheckCrew(ctx context.Context, src CrewRosterSource, companyID, jobID string, techIDs []string) (*models.TechOnProjectError, error) {
	facts, err := src.JobFacts(ctx, companyID, jobID)
	if err != nil || facts.ScheduledStart == nil || isEmergency(facts.Priority) {
		return nil, err
	}
	date := jobDay(facts, nil, time.Now())
	rostered, err := src.RosteredTechUserIDs(ctx, companyID, date)
	if err != nil || len(rostered) == 0 {
		return nil, err
	}
	users, err := src.TechUserIDs(ctx, companyID, techIDs)
	if err != nil {
		return nil, err
	}
	userIDs := make([]string, 0, len(techIDs))
	for _, id := range techIDs {
		if u := users[id]; u != "" {
			userIDs = append(userIDs, u)
		}
	}
	return crewRosterBlock(rostered, userIDs, facts.ProjectID, date), nil
}
