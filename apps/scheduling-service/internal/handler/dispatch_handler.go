package handler

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
)

// DispatchHandler exposes the Phase 1 assignment endpoints.
// All write operations require DISPATCHER, OFFICE_MANAGER, or COMPANY_ADMIN role.
type DispatchHandler struct {
	svc        *service.AssignmentService
	assignRepo *repository.AssignmentRepository
}

func NewDispatchHandler(svc *service.AssignmentService, assignRepo *repository.AssignmentRepository) *DispatchHandler {
	return &DispatchHandler{svc: svc, assignRepo: assignRepo}
}

// POST /dispatch/assign
// Phase 1 smart assignment: scores all nearby technicians and either
// auto-assigns (score ≥ 90) or returns top-3 suggestions for dispatcher.
func (h *DispatchHandler) Assign(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req models.AssignJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.svc.AssignJob(c.Request.Context(), claims.CompanyID, &claims.UserID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// POST /dispatch/assign/manual
// Dispatcher explicitly picks a technician (overrides scoring).
// Also used when the dispatcher chooses one of the top-3 suggestions.
func (h *DispatchHandler) ManualAssign(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req models.ManualAssignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.svc.ManualAssign(c.Request.Context(), claims.CompanyID, claims.UserID, req)
	if err != nil {
		var onProject *models.TechOnProjectError
		if errors.As(err, &onProject) {
			// Guided conflict — the tech is reserved by a project roster that day
			c.JSON(http.StatusConflict, gin.H{
				"code":        "TECH_ON_PROJECT",
				"projectId":   onProject.ProjectID,
				"projectName": onProject.ProjectName,
				"date":        onProject.Date,
				"error":       onProject.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assignment)
}

// GET /dispatch/assignments/job/:jobId
// Returns all assignments for a given job (to show assignment history on job detail page).
func (h *DispatchHandler) GetByJob(c *gin.Context) {
	claims := middleware.GetClaims(c)
	jobID := c.Param("jobId")

	assignments, err := h.assignRepo.FindByJob(c.Request.Context(), claims.CompanyID, jobID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": assignments})
}

// GET /dispatch/assignments/technician/:techId
// Returns a technician's schedule. Optionally filter by status (comma-separated).
// e.g. GET /dispatch/assignments/technician/abc?status=ASSIGNED,EN_ROUTE
func (h *DispatchHandler) GetByTechnician(c *gin.Context) {
	claims := middleware.GetClaims(c)
	techID := c.Param("techId")

	// Parse optional status filter
	var statusFilter []models.AssignmentStatus
	if statusParam := c.Query("status"); statusParam != "" {
		for _, s := range splitComma(statusParam) {
			statusFilter = append(statusFilter, models.AssignmentStatus(s))
		}
	}

	assignments, err := h.assignRepo.FindByTechnician(
		c.Request.Context(), claims.CompanyID, techID, statusFilter,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": assignments})
}

// GET /dispatch/assignments/:id
func (h *DispatchHandler) GetOne(c *gin.Context) {
	claims := middleware.GetClaims(c)
	id := c.Param("id")

	assignment, err := h.assignRepo.FindByID(c.Request.Context(), claims.CompanyID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// PATCH /dispatch/assignments/:id/status
// Technician or dispatcher transitions assignment status (EN_ROUTE → ON_SITE, etc.)
func (h *DispatchHandler) UpdateStatus(c *gin.Context) {
	claims := middleware.GetClaims(c)
	id := c.Param("id")

	var req models.UpdateAssignmentStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate allowed status transitions per role
	if err := validateStatusTransition(claims.Role, req.Status); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	assignment, err := h.svc.UpdateAssignmentStatus(c.Request.Context(), claims.CompanyID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

// ---- helpers ----

func splitComma(s string) []string {
	var parts []string
	for _, p := range splitBy(s, ',') {
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}

func splitBy(s string, sep rune) []string {
	var parts []string
	start := 0
	for i, c := range s {
		if c == sep {
			parts = append(parts, s[start:i])
			start = i + 1
		}
	}
	parts = append(parts, s[start:])
	return parts
}

// validateStatusTransition enforces which roles can set which statuses.
// Technicians can only set EN_ROUTE, ON_SITE, COMPLETED.
// Dispatchers and above can set any status.
// Role value "technician" matches @tscrm/types Role enum (lowercase snake_case).
func validateStatusTransition(role string, status models.AssignmentStatus) error {
	techAllowed := map[models.AssignmentStatus]bool{
		models.StatusEnRoute:   true,
		models.StatusOnSite:    true,
		models.StatusCompleted: true,
	}

	if role == "technician" && !techAllowed[status] {
		return fmt.Errorf("technicians can only set status to EN_ROUTE, ON_SITE, or COMPLETED")
	}
	return nil
}
