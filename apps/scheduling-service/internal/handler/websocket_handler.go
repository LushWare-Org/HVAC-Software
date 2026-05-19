package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/ws"
)

// WebSocketHandler upgrades HTTP connections to WebSocket for real-time dashboard updates.
// The WS connection is company-scoped: every connected browser tab for a company
// receives GPS updates and assignment events for that company only.
//
// Authentication: JWT is validated before the upgrade via the standard JWTMiddleware.
// This means the WS connection is as secure as any REST call.
//
// URL: GET /ws
// The client connects with:   ws://localhost:3003/ws
// with the standard Authorization: Bearer <token> header (supported by most WS libraries).
type WebSocketHandler struct {
	hub *ws.Hub
}

func NewWebSocketHandler(hub *ws.Hub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

// ServeWS upgrades the connection. Called after JWT middleware validates the token.
func (h *WebSocketHandler) ServeWS(c *gin.Context) {
	claims := middleware.GetClaims(c)

	// Roles that may open a WebSocket (dispatcher dashboard, office manager, admin)
	// Values match @tscrm/types Role enum (lowercase snake_case injected by Auth0 Action)
	allowedRoles := map[string]bool{
		"super_admin":    true,
		"company_admin":  true,
		"office_manager": true,
		"dispatcher":     true,
	}
	if !allowedRoles[claims.Role] {
		c.JSON(http.StatusForbidden, gin.H{"error": "WebSocket access requires dispatcher or manager role"})
		return
	}

	h.hub.ServeWS(c.Writer, c.Request, claims.CompanyID)
}
