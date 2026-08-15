package activitylog

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tscrm/scheduling-service/internal/middleware"
)

type activityEvent struct {
	CompanyID   *string `json:"companyId"`
	Service     string  `json:"service"`
	Method      string  `json:"method"`
	Path        string  `json:"path"`
	ActorUserID *string `json:"actorUserId"`
	ActorName   *string `json:"actorName"`
	ActorRole   *string `json:"actorRole"`
	Action      string  `json:"action"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	StatusCode  int     `json:"statusCode"`
	DurationMs  int64   `json:"durationMs"`
}

// Middleware logs every request this Gin service handles to comms-service's
// activity-log ingest endpoint. Fire-and-forget over HTTP with a short
// timeout — a slow or unreachable comms-service must never slow down or
// fail a real scheduling request. Register AFTER the auth middleware so
// claims (company/user/role) are already on the Gin context.
func Middleware(commsServiceURL string) gin.HandlerFunc {
	client := &http.Client{Timeout: 3 * time.Second}

	return func(c *gin.Context) {
		start := time.Now()
		c.Next()

		// GET requests are reads (GPS/board polling, WS handshake) — not
		// actions or scenarios. The feed is for what actually happened, not
		// a record of which endpoints got polled.
		if c.Request.Method == http.MethodGet {
			return
		}

		// Everything read off `c` must happen HERE, synchronously — Gin
		// returns *gin.Context to a sync.Pool the instant this middleware
		// function returns, so reading it from inside the goroutine below
		// would race the pool reclaiming/reusing it for the next request.
		action, description := describe(c.Request.Method, c.FullPath())
		event := activityEvent{
			Service:     "scheduling",
			Method:      c.Request.Method,
			Path:        c.FullPath(),
			Action:      action,
			Description: description,
			Status:      statusToLabel(c.Writer.Status()),
			StatusCode:  c.Writer.Status(),
			DurationMs:  time.Since(start).Milliseconds(),
		}
		if claimsVal, ok := c.Get(middleware.ClaimsKey); ok {
			claims := claimsVal.(middleware.AuthClaims)
			if claims.CompanyID != "" {
				event.CompanyID = &claims.CompanyID
			}
			if claims.UserID != "" {
				event.ActorUserID = &claims.UserID
			}
			if claims.Name != "" {
				event.ActorName = &claims.Name
			}
			if claims.Role != "" {
				event.ActorRole = &claims.Role
			}
		}

		go postEvent(client, commsServiceURL, event)
	}
}

// describe narrates a scheduling-service action for the activity feed. Never
// falls back to raw "METHOD /path" text — matches the plain-English
// contract every other service's describeAction() (packages/activity-log)
// follows, so the feed reads the same regardless of which service or
// language produced the event.
func describe(method, routePattern string) (action string, description string) {
	switch routePattern {
	case "/dispatch/assign":
		return "technician.assigned", "Auto-assigned a technician to a job"
	case "/dispatch/assign/manual":
		return "technician.assigned", "A dispatcher manually assigned a technician to a job"
	case "/gps":
		return "technician.location_updated", "Recorded a technician's GPS location"
	}
	return "http.request", humanizeVerb(method) + " " + humanizeRoute(routePattern)
}

func humanizeVerb(method string) string {
	switch method {
	case http.MethodPost:
		return "Performed"
	case http.MethodPatch, http.MethodPut:
		return "Updated"
	case http.MethodDelete:
		return "Removed"
	default:
		return "Performed an action on"
	}
}

// humanizeRoute strips path-param placeholders (":id") and separators so a
// route reads as a plain noun phrase, never something that looks like a URL.
func humanizeRoute(routePattern string) string {
	segments := strings.Split(routePattern, "/")
	words := make([]string, 0, len(segments))
	for _, seg := range segments {
		if seg == "" || strings.HasPrefix(seg, ":") {
			continue
		}
		words = append(words, strings.ReplaceAll(seg, "-", " "))
	}
	if len(words) == 0 {
		return "a scheduling action"
	}
	return strings.Join(words, " ")
}

func statusToLabel(statusCode int) string {
	if statusCode >= 400 {
		return "FAILURE"
	}
	return "SUCCESS"
}

func postEvent(client *http.Client, commsServiceURL string, event activityEvent) {
	body, err := json.Marshal(event)
	if err != nil {
		return
	}
	req, err := http.NewRequest(http.MethodPost, commsServiceURL+"/activity-log/ingest", bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err == nil {
		resp.Body.Close()
	}
}
