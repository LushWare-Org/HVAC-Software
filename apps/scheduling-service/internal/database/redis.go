package database

import (
	"context"
	"fmt"
	"log"

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

	// Connection pool settings
	opts.PoolSize = 10
	opts.MinIdleConns = 2

	client := redis.NewClient(opts)

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("❌ Redis ping failed: %v", err)
	}

	fmt.Println("✅ Redis connected")
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
