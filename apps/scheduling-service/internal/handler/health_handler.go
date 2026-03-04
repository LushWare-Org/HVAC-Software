package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

// HealthHandler provides liveness and readiness endpoints.
// Used by Docker health checks and the Nginx upstream configuration.
type HealthHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

func NewHealthHandler(db *pgxpool.Pool, redis *redis.Client) *HealthHandler {
	return &HealthHandler{db: db, redis: redis}
}

// GET /health — liveness (just says the process is up)
func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "scheduling-service"})
}

// GET /health/ready — readiness (DB + Redis must be reachable)
func (h *HealthHandler) Readiness(c *gin.Context) {
	status := gin.H{"db": "ok", "redis": "ok", "status": "ready"}
	code := http.StatusOK

	if err := h.db.Ping(c.Request.Context()); err != nil {
		status["db"] = "error: " + err.Error()
		status["status"] = "degraded"
		code = http.StatusServiceUnavailable
	}

	if err := h.redis.Ping(c.Request.Context()).Err(); err != nil {
		status["redis"] = "error: " + err.Error()
		status["status"] = "degraded"
		code = http.StatusServiceUnavailable
	}

	c.JSON(code, status)
}
