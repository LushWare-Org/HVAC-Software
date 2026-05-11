package database

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// NewRedisClient creates and validates a go-redis v9 client.
// Redis is used for:
//   - Pub/Sub: GPS updates broadcasted to WebSocket hub (channel per company)
//   - Pub/Sub: Assignment events (assigned, en_route, on_site, completed)
//   - Future: BullMQ-compatible queue keys (for comms-service notifications)
func NewRedisClient(ctx context.Context, redisURL string) *redis.Client {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("❌ Failed to parse REDIS_URL: %v", err)
	}

	if strings.Contains(opts.Addr, "upstash.io") {
		opts.TLSConfig = &tls.Config{MinVersion: tls.VersionTLS12}
	}

	// Connection pool settings
	opts.PoolSize = 10
	opts.MinIdleConns = 2

	client := redis.NewClient(opts)

	// Try to ping Redis with a 5-second timeout (non-fatal if it fails)
	pingCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(pingCtx).Err(); err != nil {
		fmt.Printf("⚠️  Redis connection warning (will retry): %v\n", err)
	} else {
		fmt.Println("✅ Redis connected")
	}

	return client
}

// Channel naming conventions — used by both publisher and subscriber.
// Scoped per company to ensure multi-tenant isolation.
const (
	// GPSChannelPrefix — publish GPS updates, subscribe in WS hub
	// Full channel: gps:<companyId>
	GPSChannelPrefix = "gps:"

	// AssignmentChannelPrefix — publish dispatch events
	// Full channel: assignment:<companyId>
	AssignmentChannelPrefix = "assignment:"
)

func GPSChannel(companyID string) string {
	return GPSChannelPrefix + companyID
}

func AssignmentChannel(companyID string) string {
	return AssignmentChannelPrefix + companyID
}
