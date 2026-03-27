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
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
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
	ID             string           `json:"id"`
	CompanyID      string           `json:"companyId"`
	JobID          string           `json:"jobId"`
	WorkOrderID    *string          `json:"workOrderId,omitempty"`
	TechnicianID   string           `json:"technicianId"`
	Status         AssignmentStatus `json:"status"`
	Score          *float64         `json:"score,omitempty"`
	DistanceKm     *float64         `json:"distanceKm,omitempty"`
	AssignedBy     *string          `json:"assignedBy,omitempty"` // nil = auto-assigned
	AssignedAt     time.Time        `json:"assignedAt"`
	EnRouteAt      *time.Time       `json:"enRouteAt,omitempty"`
	OnSiteAt       *time.Time       `json:"onSiteAt,omitempty"`
	CompletedAt    *time.Time       `json:"completedAt,omitempty"`
	ScheduledStart *time.Time       `json:"scheduledStart,omitempty"`
	ScheduledEnd   *time.Time       `json:"scheduledEnd,omitempty"`
	Notes          *string          `json:"notes,omitempty"`
	CreatedAt      time.Time        `json:"createdAt"`
	UpdatedAt      time.Time        `json:"updatedAt"`
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
	RequiredParts  []string `json:"requiredParts"` // inventory item IDs
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
)

type WSMessage struct {
	Type      WSMessageType `json:"type"`
	CompanyID string        `json:"companyId"`
	Payload   interface{}   `json:"payload"`
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
