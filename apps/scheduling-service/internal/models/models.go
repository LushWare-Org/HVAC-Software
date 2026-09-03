package models

import (
	"time"
)

// ============================================================
// Domain models — match the scheduling schema tables exactly.
// JSON tags use camelCase for REST API consistency.
// ============================================================

// Technician represents a field technician's scheduling profile.
type Technician struct {
	ID              string     `json:"id"`
	CompanyID       string     `json:"companyId"`
	UserID          string     `json:"userId"`
	Name            string     `json:"name"`
	Phone           *string    `json:"phone,omitempty"`
	AvatarURL       *string    `json:"avatarUrl,omitempty"`
	Skills          []string   `json:"skills"`
	MaxDailyJobs    int        `json:"maxDailyJobs"`
	IsActive        bool       `json:"isActive"`
	Rating          float64    `json:"rating"`
	TotalRatings    int        `json:"totalRatings"`
	LastSeenAt      *time.Time `json:"lastSeenAt,omitempty"`
	CurrentLocation *GeoPoint  `json:"currentLocation,omitempty"`
	// BaseLocation is where the technician starts their day, synced from
	// crm.company_users. Used when scoring future jobs, where a live position
	// predicts nothing about where they will set off from.
	BaseLocation *GeoPoint `json:"baseLocation,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// GeoPoint is used for current_location PostGIS geometry.
// We decode the WKB bytes manually; callers receive plain lat/lng.
type GeoPoint struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// TechnicianShift represents a single working day availability record.
type TechnicianShift struct {
	ID           string    `json:"id"`
	TechnicianID string    `json:"technicianId"`
	CompanyID    string    `json:"companyId"`
	ShiftDate    time.Time `json:"shiftDate"`
	StartTime    string    `json:"startTime"` // "HH:MM"
	EndTime      string    `json:"endTime"`
	IsAvailable  bool      `json:"isAvailable"`
	Notes        *string   `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// AssignmentStatus mirrors the DB enum.
type AssignmentStatus string

const (
	StatusSuggested AssignmentStatus = "SUGGESTED"
	StatusAssigned  AssignmentStatus = "ASSIGNED"
	StatusEnRoute   AssignmentStatus = "EN_ROUTE"
	StatusOnSite    AssignmentStatus = "ON_SITE"
	StatusCompleted AssignmentStatus = "COMPLETED"
	StatusCancelled AssignmentStatus = "CANCELLED"
)

// DispatchAssignment is the core scheduling record linking
// a job to a technician with timing and status tracking.
type DispatchAssignment struct {
	ID           string           `json:"id"`
	CompanyID    string           `json:"companyId"`
	JobID        string           `json:"jobId"`
	WorkOrderID  *string          `json:"workOrderId,omitempty"`
	TechnicianID string           `json:"technicianId"`
	Status       AssignmentStatus `json:"status"`
	Score        *float64         `json:"score,omitempty"`
	DistanceKm   *float64         `json:"distanceKm,omitempty"`
	// IsLead marks the one crew member who drives Job.status and is the name the
	// customer is given. Enforced unique per job by uq_assignment_job_lead.
	IsLead bool `json:"isLead"`
	// BaseDistanceKm is distance from the technician's BASE at assign time, kept
	// separate from DistanceKm (their live position) so the two are never
	// confused. Base is what predicts travel to a job days away.
	BaseDistanceKm *float64   `json:"baseDistanceKm,omitempty"`
	AssignedBy     *string    `json:"assignedBy,omitempty"` // nil = auto-assigned
	AssignedAt     time.Time  `json:"assignedAt"`
	EnRouteAt      *time.Time `json:"enRouteAt,omitempty"`
	OnSiteAt       *time.Time `json:"onSiteAt,omitempty"`
	CompletedAt    *time.Time `json:"completedAt,omitempty"`
	ScheduledStart *time.Time `json:"scheduledStart,omitempty"`
	ScheduledEnd   *time.Time `json:"scheduledEnd,omitempty"`
	Notes          *string    `json:"notes,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
}

// GPSTrackingPoint is a single GPS snapshot from a technician device.
type GPSTrackingPoint struct {
	ID           int64     `json:"id"`
	TechnicianID string    `json:"technicianId"`
	CompanyID    string    `json:"companyId"`
	Lat          float64   `json:"lat"`
	Lng          float64   `json:"lng"`
	AccuracyM    *float32  `json:"accuracyM,omitempty"`
	SpeedKmh     *float32  `json:"speedKmh,omitempty"`
	HeadingDeg   *float32  `json:"headingDeg,omitempty"`
	BatteryPct   *int16    `json:"batteryPct,omitempty"`
	CapturedAt   time.Time `json:"capturedAt"`
}

// ============================================================
// Request / Response DTOs
// ============================================================

// CreateTechnicianRequest — POST /technicians
type CreateTechnicianRequest struct {
	UserID       string   `json:"userId"       binding:"required"`
	Name         string   `json:"name"         binding:"required"`
	Phone        *string  `json:"phone"`
	AvatarURL    *string  `json:"avatarUrl"`
	Skills       []string `json:"skills"`
	MaxDailyJobs *int     `json:"maxDailyJobs"`
	Latitude     *float64 `json:"latitude"`  // optional initial GPS location
	Longitude    *float64 `json:"longitude"` // optional initial GPS location
}

// UpdateTechnicianRequest — PATCH /technicians/:id
type UpdateTechnicianRequest struct {
	Name         *string  `json:"name"`
	Phone        *string  `json:"phone"`
	AvatarURL    *string  `json:"avatarUrl"`
	Skills       []string `json:"skills"`
	MaxDailyJobs *int     `json:"maxDailyJobs"`
	IsActive     *bool    `json:"isActive"`
	Latitude     *float64 `json:"latitude"`  // update GPS location
	Longitude    *float64 `json:"longitude"` // update GPS location
}

// AssignJobRequest — POST /dispatch/assign
type AssignJobRequest struct {
	JobID          string   `json:"jobId"          binding:"required"`
	JobLatitude    float64  `json:"jobLatitude"`
	JobLongitude   float64  `json:"jobLongitude"`
	RequiredSkills []string `json:"requiredSkills"`
	RequiredParts  []string `json:"requiredParts"`  // inventory item IDs
	ScheduledStart *string  `json:"scheduledStart"` // ISO8601
	ScheduledEnd   *string  `json:"scheduledEnd"`
}

// ManualAssignRequest — POST /dispatch/assign/manual
type ManualAssignRequest struct {
	JobID          string  `json:"jobId"          binding:"required"`
	TechnicianID   string  `json:"technicianId"   binding:"required"`
	JobLatitude    float64 `json:"jobLatitude"`
	JobLongitude   float64 `json:"jobLongitude"`
	ScheduledStart *string `json:"scheduledStart"`
	ScheduledEnd   *string `json:"scheduledEnd"`
	Notes          *string `json:"notes"`
}

// ScoredTechnician is returned when auto-assign score < threshold.
// Dispatcher picks from the top candidates returned.
type ScoredTechnician struct {
	Technician    Technician `json:"technician"`
	Score         float64    `json:"score"`
	DistanceKm    float64    `json:"distanceKm"`
	ActiveJobs    int        `json:"activeJobs"`
	DistanceScore float64    `json:"distanceScore"`
	WorkloadScore float64    `json:"workloadScore"`
	RatingScore   float64    `json:"ratingScore"`
	PartsScore    float64    `json:"partsScore"`
}

// AssignResponse — result of POST /dispatch/assign
type AssignResponse struct {
	AutoAssigned bool                `json:"autoAssigned"`
	Assignment   *DispatchAssignment `json:"assignment,omitempty"`  // set when autoAssigned=true
	Suggestions  []ScoredTechnician  `json:"suggestions,omitempty"` // set when autoAssigned=false
}

// GPSUpdateRequest — POST /gps (from technician mobile app)
type GPSUpdateRequest struct {
	Lat        float64  `json:"lat"        binding:"required"`
	Lng        float64  `json:"lng"        binding:"required"`
	AccuracyM  *float32 `json:"accuracyM"`
	SpeedKmh   *float32 `json:"speedKmh"`
	HeadingDeg *float32 `json:"headingDeg"`
	BatteryPct *int16   `json:"batteryPct"`
}

// UpdateAssignmentStatusRequest — PATCH /dispatch/assignments/:id/status
type UpdateAssignmentStatusRequest struct {
	Status AssignmentStatus `json:"status" binding:"required"`
	Notes  *string          `json:"notes"`
}

// ============================================================
// WebSocket message envelope
// All messages sent over the WebSocket use this typed envelope
// so the frontend can switch on "type" to handle events.
// ============================================================

type WSMessageType string

const (
	WSTypeGPSUpdate        WSMessageType = "GPS_UPDATE"
	WSTypeAssigned         WSMessageType = "ASSIGNMENT_CREATED"
	WSTypeStatusChanged    WSMessageType = "ASSIGNMENT_STATUS_CHANGED"
	WSTypeTechnicianOnline WSMessageType = "TECHNICIAN_ONLINE"

	// Published by job-service (not this service) whenever a job's own data
	// changes — status, schedule, assignment name, reschedule state. The
	// dispatch board's data is mostly jobs, so without these the board can
	// only ever see assignment and GPS activity.
	WSTypeJobChanged WSMessageType = "JOB_CHANGED"
)

type WSMessage struct {
	Type      WSMessageType `json:"type"`
	CompanyID string        `json:"companyId"`
	Payload   interface{}   `json:"payload"`

	// Origin identifies the pod that produced this message. Set automatically by
	// BroadcastMessage. A pod delivers its own messages to its own sockets
	// immediately and then skips them when they arrive back over Redis, so local
	// clients see events with no pub/sub round trip — and still see them when
	// Redis is unreachable. Clients ignore this field.
	Origin string `json:"origin,omitempty"`
}

// GPSUpdatePayload is the payload inside WSTypeGPSUpdate messages.
type GPSUpdatePayload struct {
	TechnicianID string    `json:"technicianId"`
	Name         string    `json:"name"`
	Lat          float64   `json:"lat"`
	Lng          float64   `json:"lng"`
	SpeedKmh     *float32  `json:"speedKmh,omitempty"`
	HeadingDeg   *float32  `json:"headingDeg,omitempty"`
	BatteryPct   *int16    `json:"batteryPct,omitempty"`
	CapturedAt   time.Time `json:"capturedAt"`
}

// ── Projects roster enforcement ──────────────────────────────────────────────

// RosterInfo identifies the project reserving a technician on a date.
type RosterInfo struct {
	ProjectID   string `json:"projectId"`
	ProjectName string `json:"projectName"`
}

// TechOnProjectError — returned when a manual assignment targets a technician
// who is rostered on a project that day. Handlers map it to HTTP 409 with
// code TECH_ON_PROJECT so clients can render the guided unblock message.
type TechOnProjectError struct {
	ProjectID   string `json:"projectId"`
	ProjectName string `json:"projectName"`
	Date        string `json:"date"`
}

func (e *TechOnProjectError) Error() string {
	return "technician is rostered on project " + e.ProjectName + " on " + e.Date
}

// ── Crew ─────────────────────────────────────────────────────────────────────

// CrewMember pairs an assignment with the technician it points at, so callers do
// not have to join the two by hand at every call site.
type CrewMember struct {
	Assignment DispatchAssignment `json:"assignment"`
	Technician Technician         `json:"technician"`
}

// LeadOf returns the crew's lead, or nil when the crew is empty or headless.
// A headless crew should be impossible (uq_assignment_job_lead), so nil on a
// non-empty crew means the invariant was bypassed and is worth surfacing rather
// than silently picking the first member.
func LeadOf(crew []CrewMember) *CrewMember {
	for i := range crew {
		if crew[i].Assignment.IsLead {
			return &crew[i]
		}
	}
	return nil
}

// CrewInput is a full replacement of a job's crew. Partial updates are not
// supported on purpose: the dispatcher edits a list and confirms it, so the API
// takes the list they confirmed rather than a diff nobody computed.
type CrewInput struct {
	TechnicianIDs    []string `json:"technicianIds"`
	LeadTechnicianID string   `json:"leadTechnicianId"`
}

// ScheduleConflict is an existing assignment that overlaps a proposed window.
// It carries the clashing job's location and distance so a dispatcher can judge
// whether the clash actually matters: "busy" is not a decision, "finishes 1.4 km
// away at 10:30" is.
type ScheduleConflict struct {
	JobID              string    `json:"jobId"`
	JobNumber          string    `json:"jobNumber"`
	Title              string    `json:"title"`
	Start              time.Time `json:"start"`
	End                time.Time `json:"end"`
	Lat                *float64  `json:"lat,omitempty"`
	Lng                *float64  `json:"lng,omitempty"`
	DistanceFromSiteKm *float64  `json:"distanceFromSiteKm,omitempty"`
}

// CrewCandidate is a technician the dispatcher could add, with everything needed
// to judge them: how well they score, how far from base, how loaded that day,
// and what they would clash with.
type CrewCandidate struct {
	Technician     Technician `json:"technician"`
	Score          float64    `json:"score"`
	BaseDistanceKm *float64   `json:"baseDistanceKm,omitempty"`
	// DistanceFromBase is false when BaseDistanceKm fell back to the live
	// position, so the UI can label which number it is showing rather than
	// implying a precision it does not have.
	DistanceFromBase  bool               `json:"distanceFromBase"`
	ActiveJobsThatDay int                `json:"activeJobsThatDay"`
	Conflicts         []ScheduleConflict `json:"conflicts"`
}
