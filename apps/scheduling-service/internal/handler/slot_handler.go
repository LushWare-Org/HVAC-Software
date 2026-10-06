package handler

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
)

type SlotHandler struct {
	svc *service.SlotService
}

func NewSlotHandler(svc *service.SlotService) *SlotHandler {
	return &SlotHandler{svc: svc}
}

// GET /dispatch/slots?from=2026-10-07&days=7&durationMins=90&lat=..&lng=..&skill=AC&technicianId=..&limit=20
//
// Open times for a visit. Customers can ask too (to choose a time when
// booking); they get times only, never who the technician is.
func (h *SlotHandler) Find(c *gin.Context) {
	claims := middleware.GetClaims(c)
	q := service.SlotQuery{
		From:         c.Query("from"),
		Days:         atoi(c.Query("days")),
		DurationMins: atoi(c.Query("durationMins")),
		Skill:        c.Query("skill"),
		TechIDs:      c.QueryArray("technicianId"),
		Limit:        atoi(c.Query("limit")),
	}
	if lat, err := strconv.ParseFloat(c.Query("lat"), 64); err == nil {
		if lng, err := strconv.ParseFloat(c.Query("lng"), 64); err == nil {
			q.Lat, q.Lng = &lat, &lng
		}
	}
	if q.Limit <= 0 || q.Limit > 50 {
		q.Limit = 20
	}

	res, err := h.svc.Find(c.Request.Context(), claims.CompanyID, q)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if claims.Role == "customer" {
		for i := range res.Slots {
			res.Slots[i].TechID, res.Slots[i].TechName, res.Slots[i].TravelKm = "", "", nil
		}
	}
	c.JSON(http.StatusOK, res)
}

func atoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}

type DisruptionHandler struct {
	svc *service.DisruptionService
}

func NewDisruptionHandler(svc *service.DisruptionService) *DisruptionHandler {
	return &DisruptionHandler{svc: svc}
}

// GET /dispatch/disruptions: today's late starts, late arrivals and overruns,
// with ways to fix each. Staff only (route guarded by role).
func (h *DisruptionHandler) Today(c *gin.Context) {
	claims := middleware.GetClaims(c)
	res, err := h.svc.Today(c.Request.Context(), claims.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// ShiftStore is what the availability endpoints read and write; SlotRepository implements it.
type ShiftStore interface {
	ShiftOverrides(ctx context.Context, companyID, from, to string) ([]repository.ShiftRow, error)
	SetShift(ctx context.Context, companyID, technicianID, date string, available bool, start, end string, note *string) error
	ClearShift(ctx context.Context, companyID, technicianID, date string) error
}

// Broadcaster announces changes to open dashboards; ws.Hub implements it.
type Broadcaster interface {
	BroadcastMessage(ctx context.Context, msg models.WSMessage)
}

// AvailabilityHandler sets technicians' days off and different hours.
type AvailabilityHandler struct {
	repo ShiftStore
	hub  Broadcaster
}

func NewAvailabilityHandler(repo ShiftStore, hub Broadcaster) *AvailabilityHandler {
	return &AvailabilityHandler{repo: repo, hub: hub}
}

func (h *AvailabilityHandler) announce(c *gin.Context, companyID, technicianID, date string) {
	if h.hub == nil {
		return
	}
	h.hub.BroadcastMessage(c.Request.Context(), models.WSMessage{
		Type: models.WSTypeAvailabilityChanged, CompanyID: companyID,
		Payload: gin.H{"technicianId": technicianID, "date": date},
	})
}

var hhmm = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d$`)

func validDate(s string) bool {
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

// GET /dispatch/availability?from=2026-10-07&to=2026-10-13
func (h *AvailabilityHandler) List(c *gin.Context) {
	claims := middleware.GetClaims(c)
	from, to := c.Query("from"), c.Query("to")
	if !validDate(from) || !validDate(to) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "from and to must be dates like 2026-10-07"})
		return
	}
	rows, err := h.repo.ShiftOverrides(c.Request.Context(), claims.CompanyID, from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": rows})
}

// PUT /dispatch/availability/:technicianId/:date  {available, start?, end?, note?}
//
// available=false marks the day off. available=true with start/end sets
// different hours (e.g. a half day).
func (h *AvailabilityHandler) Set(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var in struct {
		Available *bool   `json:"available" binding:"required"`
		Start     string  `json:"start"`
		End       string  `json:"end"`
		Note      *string `json:"note"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "available (true or false) is required"})
		return
	}
	date := c.Param("date")
	if !validDate(date) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date must look like 2026-10-07"})
		return
	}
	start, end := in.Start, in.End
	if start == "" {
		start = "08:00"
	}
	if end == "" {
		end = "17:00"
	}
	if !hhmm.MatchString(start) || !hhmm.MatchString(end) || start >= end {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end must be times like 08:00 and 12:00, start before end"})
		return
	}
	if in.Note != nil && len(*in.Note) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keep the note under 200 characters"})
		return
	}
	err := h.repo.SetShift(c.Request.Context(), claims.CompanyID, c.Param("technicianId"), date, *in.Available, start, end, in.Note)
	if errors.Is(err, repository.ErrTechnicianNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "technician not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.announce(c, claims.CompanyID, c.Param("technicianId"), date)
	c.JSON(http.StatusOK, gin.H{"technicianId": c.Param("technicianId"), "date": date, "available": *in.Available, "start": start, "end": end})
}

// DELETE /dispatch/availability/:technicianId/:date: back to a standard day.
func (h *AvailabilityHandler) Clear(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if !validDate(c.Param("date")) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date must look like 2026-10-07"})
		return
	}
	if err := h.repo.ClearShift(c.Request.Context(), claims.CompanyID, c.Param("technicianId"), c.Param("date")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	h.announce(c, claims.CompanyID, c.Param("technicianId"), c.Param("date"))
	c.Status(http.StatusNoContent)
}

type GapHandler struct {
	svc *service.GapService
}

func NewGapHandler(svc *service.GapService) *GapHandler {
	return &GapHandler{svc: svc}
}

// GET /dispatch/gaps: time freed by cancellations in the next few days, with
// the work that could fill it. Staff only (route guarded by role).
func (h *GapHandler) Upcoming(c *gin.Context) {
	claims := middleware.GetClaims(c)
	res, err := h.svc.Upcoming(c.Request.Context(), claims.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}
