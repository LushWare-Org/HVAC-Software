package config

import (
	"log"
	"os"
)

// Config holds all environment-derived configuration.
// All values are read once at startup; the struct is passed
// through dependency injection so there are no global state issues.
type Config struct {
	// HTTP
	Port string

	// PostgreSQL (scheduling schema)
	DatabaseURL string

	// Redis
	RedisURL string

	// Auth0
	Auth0Domain   string
	Auth0Audience string

	// Scoring thresholds (Phase 1)
	AutoAssignThreshold float64 // default 90.0 — auto-assign when top score ≥ this
	MaxDistanceKm       float64 // default 50.0 — max radius considered "reachable"
	MaxActiveJobs       int     // default 5  — used in workload scoring denominator

	// Comms service (activity-log ingest)
	CommsServiceURL string
}

// Load reads config from environment variables (set via .env + Docker).
// Missing required vars cause a fatal exit.
func Load() *Config {
	cfg := &Config{
		Port:                getEnvOrDefault("SCHEDULING_PORT", "3003"),
		DatabaseURL:         requireEnv("DATABASE_URL"),
		RedisURL:            getEnvOrDefault("REDIS_URL", "redis://localhost:6379"),
		Auth0Domain:         requireEnv("AUTH0_DOMAIN"),
		Auth0Audience:       requireEnv("AUTH0_AUDIENCE"),
		AutoAssignThreshold: 90.0,
		MaxDistanceKm:       50.0,
		MaxActiveJobs:       5,
		CommsServiceURL:     getEnvOrDefault("COMMS_SERVICE_URL", "http://localhost:3005"),
	}
	return cfg
}

func requireEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("❌ Required environment variable %q is not set", key)
	}
	return v
}

func getEnvOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
