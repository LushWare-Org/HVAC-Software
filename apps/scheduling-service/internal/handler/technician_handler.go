package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/models"
	"github.com/tscrm/scheduling-service/internal/repository"
)

// TechnicianHandler exposes CRUD for scheduling technician profiles.
// Note: these profiles are separate from the Auth0 user records —
// they store scheduling-specific data (skills, GPS, rating, shift availability).
type TechnicianHandler struct {
	repo *repository.TechnicianRepository
}

func NewTechnicianHandler(repo *repository.TechnicianRepository) *TechnicianHandler {
	return &TechnicianHandler{repo: repo}
}

// POST /technicians
// Roles: COMPANY_ADMIN, OFFICE_MANAGER
func (h *TechnicianHandler) Create(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req models.CreateTechnicianRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	t, err := h.repo.Create(c.Request.Context(), claims.CompanyID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, t)
}

// GET /technicians
// Returns all active technicians for the caller's company.
func (h *TechnicianHandler) List(c *gin.Context) {
	claims := middleware.GetClaims(c)

	techs, err := h.repo.ListActive(c.Request.Context(), claims.CompanyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": techs, "count": len(techs)})
}

// GET /technicians/:id
func (h *TechnicianHandler) GetOne(c *gin.Context) {
	claims := middleware.GetClaims(c)
	id := c.Param("id")

	t, err := h.repo.FindByID(c.Request.Context(), claims.CompanyID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

// PATCH /technicians/:id
// Roles: COMPANY_ADMIN, OFFICE_MANAGER (or the technician themselves)
func (h *TechnicianHandler) Update(c *gin.Context) {
	claims := middleware.GetClaims(c)
	id := c.Param("id")

	var req models.UpdateTechnicianRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Technicians can only update their own profile
	// "technician" matches @tscrm/types Role enum (lowercase)
	if claims.Role == "technician" {
		existing, err := h.repo.FindByID(c.Request.Context(), claims.CompanyID, id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "technician not found"})
			return
		}
		if existing.UserID != claims.UserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "technicians can only update their own profile"})
			return
		}
	}

	t, err := h.repo.UpdateTechnician(c.Request.Context(), claims.CompanyID, id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, t)
}

// PATCH /technicians/:id/rating-sync
// Internal endpoint called by crm-service after a customer submits / amends
// a JOB review. Payload: { rating: float, totalRatings: int }.
// Not auth-gated — intended to be invoked service-to-service over the private
// network; register it outside the auth group in main.go.
func (h *TechnicianHandler) RatingSync(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Rating       float64 `json:"rating"`
		TotalRatings int     `json:"totalRatings"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Clamp rating defensively — scoring code assumes 0-5.
	if req.Rating < 0 {
		req.Rating = 0
	} else if req.Rating > 5 {
		req.Rating = 5
	}

	if err := h.repo.UpdateRating(c.Request.Context(), id, req.Rating, req.TotalRatings); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "id": id, "rating": req.Rating, "totalRatings": req.TotalRatings})
}

// GET /technicians/me
// Convenience endpoint: returns the calling technician's own profile.
// Useful for the mobile app to self-identify on first launch.
// If no scheduling profile exists yet, auto-syncs from CRM for approved technicians.
func (h *TechnicianHandler) GetMe(c *gin.Context) {
	claims := middleware.GetClaims(c)
	ctx := c.Request.Context()

	t, err := h.repo.FindByUserID(ctx, claims.CompanyID, claims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if t == nil {
		// Profile missing — try auto-syncing this specific user from CRM
		created, syncErr := h.repo.SyncOneFromCRM(ctx, claims.CompanyID, claims.UserID)
		if syncErr != nil || created == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "no technician profile found for this user"})
			return
		}
		c.JSON(http.StatusOK, created)
		return
	}

	c.JSON(http.StatusOK, t)
}
