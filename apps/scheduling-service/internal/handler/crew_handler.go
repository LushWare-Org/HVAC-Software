package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
)

// CrewHandler serves the crew a job has and the candidates it could add.
type CrewHandler struct {
	crewRepo  *repository.CrewRepository
	candidate *service.CandidateService
}

func NewCrewHandler(crewRepo *repository.CrewRepository, candidate *service.CandidateService) *CrewHandler {
	return &CrewHandler{crewRepo: crewRepo, candidate: candidate}
}

// GetCrew returns the job's live crew, lead first.
func (h *CrewHandler) GetCrew(c *gin.Context) {
	claims := middleware.GetClaims(c)
	crew, err := h.crewRepo.FindCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": crew, "count": len(crew)})
}

// SetCrew replaces the crew wholesale. The dispatcher confirms a list, so the API
// takes that list rather than a diff nobody computed.
func (h *CrewHandler) SetCrew(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var in models.CrewInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.crewRepo.SetCrew(c.Request.Context(), claims.CompanyID, c.Param("jobId"),
		claims.UserID, claims.Name, in)
	switch {
	case errors.Is(err, repository.ErrLeadNotInCrew):
		c.JSON(http.StatusBadRequest, gin.H{"error": "The lead must be one of the assigned technicians."})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	default:
		h.respondWithCrew(c, claims.CompanyID, c.Param("jobId"))
	}
}

// SetLead hands the lead to another member of the crew.
func (h *CrewHandler) SetLead(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var body struct {
		TechnicianID string `json:"technicianId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.crewRepo.SetLead(c.Request.Context(), claims.CompanyID, c.Param("jobId"),
		body.TechnicianID, claims.UserID, claims.Name)
	switch {
	case errors.Is(err, repository.ErrNotOnCrew):
		c.JSON(http.StatusBadRequest, gin.H{"error": "Add them to the crew first."})
	case errors.Is(err, repository.ErrAlreadyCheckedOut):
		c.JSON(http.StatusBadRequest, gin.H{"error": "That technician has already left this job."})
	case err != nil:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	default:
		h.respondWithCrew(c, claims.CompanyID, c.Param("jobId"))
	}
}

// Candidates ranks who else could join this job.
func (h *CrewHandler) Candidates(c *gin.Context) {
	claims := middleware.GetClaims(c)

	jobID := c.Query("jobId")
	if jobID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "jobId is required"})
		return
	}
	start, err := time.Parse(time.RFC3339, c.Query("start"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start must be an RFC3339 timestamp"})
		return
	}
	end, err := time.Parse(time.RFC3339, c.Query("end"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be an RFC3339 timestamp"})
		return
	}
	if !end.After(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be after start"})
		return
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	cands, err := h.candidate.Candidates(c.Request.Context(), claims.CompanyID, jobID, start, end, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cands, "count": len(cands)})
}

// SetBaseLocation receives a technician's base from crm-service. Keyed by
// CompanyUser id, because that is the id crm holds; scheduling's own technician
// id means nothing on the other side of the boundary.
func (h *CrewHandler) SetBaseLocation(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var body struct {
		Lat *float64 `json:"lat" binding:"required"`
		Lng *float64 `json:"lng" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.crewRepo.SetBaseLocation(
		c.Request.Context(), claims.CompanyID, c.Param("userId"), *body.Lat, *body.Lng,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// respondWithCrew returns the crew as it now stands, so a caller never has to
// make a second request to find out what their write produced.
func (h *CrewHandler) respondWithCrew(c *gin.Context, companyID, jobID string) {
	crew, err := h.crewRepo.FindCrew(c.Request.Context(), companyID, jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": crew, "count": len(crew)})
}
