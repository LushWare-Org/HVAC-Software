package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// NewPostgresPool creates a pgx connection pool.
// pgx/v5 is used instead of database/sql because:
//   - Native PostgreSQL types (UUID, JSONB, arrays) without extra scanning
//   - Better performance, no reflection-based scanning overhead
//   - Named parameters support
func NewPostgresPool(ctx context.Context, databaseURL string) *pgxpool.Pool {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("Failed to parse DATABASE_URL: %v", err)
	}

	// Supabase installs extensions such as PostGIS in the "extensions" schema,
	// while local Docker PostGIS exposes them from "public". Keep both visible
	// so casts such as ::geography and ST_* functions resolve consistently.
	if cfg.ConnConfig.RuntimeParams == nil {
		cfg.ConnConfig.RuntimeParams = map[string]string{}
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = "scheduling,public,extensions"

	// Pool settings optimised for a scheduling service with burst GPS ingestion.
	cfg.MaxConns = 25
	cfg.MinConns = 3
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	cfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	// Verify connectivity.
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("PostgreSQL ping failed: %v", err)
	}

	if err := verifyPostGIS(ctx, pool); err != nil {
		log.Fatalf("PostgreSQL PostGIS check failed: %v", err)
	}

	fmt.Println("PostgreSQL connected (scheduling schema)")
	return pool
}

func verifyPostGIS(ctx context.Context, pool *pgxpool.Pool) error {
	var ok bool
	if err := pool.QueryRow(ctx, `SELECT 'POINT(0 0)'::geography IS NOT NULL`).Scan(&ok); err != nil {
		return fmt.Errorf("PostGIS geography type is not available; enable the postgis extension or include its schema in search_path: %w", err)
	}
	if !ok {
		return fmt.Errorf("PostGIS geography type returned an unexpected null result")
	}
	return nil
}
