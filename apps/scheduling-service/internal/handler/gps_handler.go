package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/ws"
)

// GPSHandler receives real-time location updates from the technician mobile app.
// Design decisions:
//   - Accepts GPS in two parts:
//     1. Persists to gps_tracking table (for route replay, analytics)
//     2. Updates technician.current_location (for live map display)
//     3. Publishes to Redis pub/sub → WS hub → dispatcher browser
//   - Technician is identified by JWT (user_id → technician.id)
//   - Single endpoint, low payload, optimised for high frequency (every 30s from the app)
type GPSHandler struct {
	techRepo   *repository.TechnicianRepository
	assignRepo *repository.AssignmentRepository
	hub        *ws.Hub
}

func NewGPSHandler(
	techRepo *repository.TechnicianRepository,
	assignRepo *repository.AssignmentRepository,
	hub *ws.Hub,
) *GPSHandler {
	return &GPSHandler{techRepo: techRepo, assignRepo: assignRepo, hub: hub}
}

// POST /gps
// Called by the technician mobile app every ~30 seconds when on duty.
// Requires TECHNICIAN role (or DISPATCHER/OFFICE_MANAGER for testing).
func (h *GPSHandler) RecordGPS(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req models.GPSUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Look up technician profile by Auth0 user_id
	tech, err := h.techRepo.FindByUserID(c.Request.Context(), claims.CompanyID, claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tech == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no technician profile for this user — please contact admin"})
		return
	}

	// 1. Insert into gps_tracking time-series (async — we don't need the result)
	go func() {
		// A detached context, NOT c.Request.Context(): Gin cancels the request
		// context as soon as the handler returns, and this goroutine outlives
		// the response. Deriving from the request context made the insert race
		// its own teardown and silently drop points — measured at roughly one
		// in five under load, which is how route history grew holes.
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := h.assignRepo.InsertGPSPoint(
			ctx, tech.ID, claims.CompanyID,
			req.Lat, req.Lng, req.AccuracyM, req.SpeedKmh, req.HeadingDeg, req.BatteryPct,
		); err != nil {
			// Non-fatal — GPS analytics can have occasional gaps
			_ = err
		}
	}()

	// 2. Update technician's current_location (synchronous — needed for assignment scoring)
	if err := h.techRepo.UpdateLocation(c.Request.Context(), tech.ID, req.Lat, req.Lng); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update location: " + err.Error()})
		return
	}

	// 3. Publish GPS update to Redis → fan-out to WS hub → dispatcher browser
	payload := models.GPSUpdatePayload{
		TechnicianID: tech.ID,
		Name:         tech.Name,
		Lat:          req.Lat,
		Lng:          req.Lng,
		SpeedKmh:     req.SpeedKmh,
		HeadingDeg:   req.HeadingDeg,
		BatteryPct:   req.BatteryPct,
		CapturedAt:   time.Now().UTC(),
	}

	h.hub.BroadcastMessage(c.Request.Context(), models.WSMessage{
		Type:      models.WSTypeGPSUpdate,
		CompanyID: claims.CompanyID,
		Payload:   payload,
	})

	c.JSON(http.StatusOK, gin.H{"status": "ok", "technicianId": tech.ID})
}

// GET /gps/trail/:technicianId?minutes=120&limit=500
// Where the technician has actually been, for drawing the travelled path.
func (h *GPSHandler) Trail(c *gin.Context) {
	claims := middleware.GetClaims(c)

	minutes, _ := strconv.Atoi(c.DefaultQuery("minutes", "120"))
	if minutes <= 0 || minutes > 1440 {
		minutes = 120
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "500"))

	since := time.Now().Add(-time.Duration(minutes) * time.Minute)
	points, err := h.assignRepo.FindGPSTrail(
		c.Request.Context(), claims.CompanyID, c.Param("technicianId"), since, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": points, "count": len(points)})
}
