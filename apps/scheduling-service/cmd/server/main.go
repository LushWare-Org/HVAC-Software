package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/tscrm/scheduling-service/internal/config"
	"github.com/tscrm/scheduling-service/internal/database"
	"github.com/tscrm/scheduling-service/internal/handler"
	"github.com/tscrm/scheduling-service/internal/middleware"
	"github.com/tscrm/scheduling-service/internal/repository"
	"github.com/tscrm/scheduling-service/internal/service"
	"github.com/tscrm/scheduling-service/internal/ws"
)

func main() {
	// ── 0. Load .env file (dev convenience; ignored if file absent) ───────
	_ = godotenv.Load()

	// ── 1. Load configuration from environment ──────────────────────────
	cfg := config.Load()

	// ── 2. Initialise infrastructure dependencies ────────────────────────
	ctx := context.Background()
	db := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	defer db.Close()

	redisClient := database.NewRedisClient(ctx, cfg.RedisURL)
	defer redisClient.Close()

	// ── 3. Build WebSocket hub and start Redis pub/sub listener ──────────
	hub := ws.NewHub(redisClient)
	hubCtx, hubCancel := context.WithCancel(ctx)
	defer hubCancel()
	hub.StartRedisSubscriber(hubCtx)

	// ── 4. Wire repositories ─────────────────────────────────────────────
	techRepo := repository.NewTechnicianRepository(db)
	assignRepo := repository.NewAssignmentRepository(db)

	// ── 5. Wire services ─────────────────────────────────────────────────
	rosterRepo := repository.NewProjectRosterRepository(db)
	assignSvc := service.NewAssignmentService(cfg, techRepo, assignRepo, hub).WithRosterGate(rosterRepo)

	// ── 6. Wire handlers ─────────────────────────────────────────────────
	healthH := handler.NewHealthHandler(db, redisClient)
	techH := handler.NewTechnicianHandler(techRepo)
	dispatchH := handler.NewDispatchHandler(assignSvc, assignRepo)
	gpsH := handler.NewGPSHandler(techRepo, assignRepo, hub)
	wsH := handler.NewWebSocketHandler(hub)

	// ── 7. Configure Gin router ──────────────────────────────────────────
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// CORS — allow the Next.js dev server and production dashboard
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		allowed := map[string]bool{
			"http://localhost:3000":               true,
			"http://localhost:5173":               true,
			"https://tscrm-demo-admin.web.app":    true,
			"https://tscrm-demo-customer.web.app": true,
		}
		if allowed[origin] || os.Getenv("GIN_MODE") == "release" {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization,Content-Type,x-test-company-id,x-test-user-id,x-test-user-email,x-test-user-role,x-test-user-name")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// ── Health (unauthenticated) ─────────────────────────────────────────
	r.GET("/health", healthH.Liveness)
	r.GET("/health/ready", healthH.Readiness)

	// ── All other routes require a valid Auth0 JWT ───────────────────────
	auth := middleware.JWTMiddleware(cfg.Auth0Domain, cfg.Auth0Audience)

	// WebSocket endpoint
	r.GET("/ws", auth, wsH.ServeWS)

	// GPS ingestion (technician mobile app → dashboard)
	r.POST("/gps", auth, gpsH.RecordGPS)

	// Internal: CRM pushes updated review averages here (no JWT, private network).
	// Keep this OUTSIDE the auth group so crm-service can call it with a plain fetch.
	r.PATCH("/technicians/:id/rating-sync", techH.RatingSync)

	// Technician profiles
	// Note: role values MUST match @tscrm/types Role enum (lowercase snake_case injected by Auth0 Action)
	tech := r.Group("/technicians", auth)
	{
		tech.POST("", middleware.RequireRole("super_admin", "company_admin", "office_manager"), techH.Create)
		tech.GET("", techH.List)
		tech.GET("/me", techH.GetMe) // must be before :id to avoid route conflict
		tech.GET("/:id", techH.GetOne)
		tech.PATCH("/:id", techH.Update) // self-update allowed inside handler
	}

	// Dispatch / assignment
	dispatch := r.Group("/dispatch", auth)
	{
		// Smart assignment (Phase 1 scoring)
		dispatch.POST("/assign",
			middleware.RequireRole("super_admin", "company_admin", "office_manager", "dispatcher"),
			dispatchH.Assign,
		)
		// Manual override
		dispatch.POST("/assign/manual",
			middleware.RequireRole("super_admin", "company_admin", "office_manager", "dispatcher"),
			dispatchH.ManualAssign,
		)
		// Querying
		dispatch.GET("/assignments", dispatchH.GetAllForCompany)
		dispatch.GET("/assignments/:id", dispatchH.GetOne)
		dispatch.GET("/assignments/job/:jobId", dispatchH.GetByJob)
		dispatch.GET("/assignments/technician/:techId", dispatchH.GetByTechnician)
		// Status transitions (technicians + dispatchers)
		dispatch.PATCH("/assignments/:id/status", dispatchH.UpdateStatus)
	}

	// ── 8. Start server with graceful shutdown ───────────────────────────
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start in background
	go func() {
		fmt.Printf("🚀 Scheduling Service running on port %s\n", cfg.Port)
		fmt.Printf("📡 WebSocket endpoint: ws://localhost:%s/ws\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("⏳ Shutting down scheduling service...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("⚠️  Forced shutdown: %v", err)
	}
	fmt.Println("✅ Scheduling service stopped cleanly")
}
