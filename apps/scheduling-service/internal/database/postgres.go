package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// envInt reads a positive integer from an env var, falling back to def.
func envInt(name string, def int) int {
	raw := os.Getenv(name)
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return def
	}
	return n
}

func ensureSchedulingExtensions(ctx context.Context, pool *pgxpool.Pool) {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS postgis`,
		`CREATE EXTENSION IF NOT EXISTS postgis_topology`,
	}

	for _, query := range queries {
		if _, err := pool.Exec(ctx, query); err != nil {
			log.Fatalf("❌ Failed to ensure PostGIS extension is installed: %v", err)
		}
	}

	fmt.Println("✅ PostGIS extensions verified (scheduling database)")
}

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

	// Pool settings — tunable via env vars for per-environment sizing. Defaults
	// stay at 25/3, which is safe under Supabase pgbouncer transaction-mode
	// pooling (each pgbouncer client connection multiplexes several pgx
	// connections at most).
	//
	// Sizing guidance (Supabase as of 2026):
	//   - Free tier  pgbouncer pool size  = 60   (10 reserved for the platform)
	//   - Pro tier   pgbouncer pool size  = 200  (15 reserved)
	//   - Team / Ent are higher — verify before bumping.
	//
	// Across all 6 NestJS services + this Go service we should keep the
	// aggregate well below the pgbouncer ceiling. Bump per-service in prod via
	// PG_POOL_MAX_CONNS / PG_POOL_MIN_CONNS env vars rather than editing code.
	cfg.MaxConns = int32(envInt("PG_POOL_MAX_CONNS", 25))
	cfg.MinConns = int32(envInt("PG_POOL_MIN_CONNS", 3))
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	cfg.HealthCheckPeriod = 1 * time.Minute

	// ── pgbouncer (transaction pooling) compatibility ────────────────────────
	// Supabase's pooler runs pgbouncer in transaction mode. Under transaction
	// pooling, server-side prepared statements cached by pgx can collide across
	// connections, producing:
	//   SQLSTATE 42P05  prepared statement "stmtcache_…" already exists
	// Disable both the statement-description and statement-prepare caches and
	// force simple-protocol execution so queries run without PREPARE.
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	cfg.ConnConfig.StatementCacheCapacity = 0
	cfg.ConnConfig.DescriptionCacheCapacity = 0

	// ── PostGIS search_path fix ───────────────────────────────────────────────
	// Supabase installs PostGIS types (geometry, geography) and functions into
	// the 'extensions' schema (or 'public'). When the connection targets a
	// specific schema (e.g. scheduling), those types are not in the search_path,
	// causing SQLSTATE 42704: type "geography" does not exist.
	//
	// AfterConnect runs once per new physical PostgreSQL connection (NOT per
	// pgbouncer client request), so the SET persists for the lifetime of that
	// physical connection — safe under pgbouncer transaction mode.
	cfg.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		_, err := conn.Exec(ctx,
			"SET search_path = scheduling, public, extensions")
		if err != nil {
			fmt.Printf("[WARN] Could not set search_path: %v\n", err)
		}
		return nil // non-fatal — worst case geography queries fall back to schema-free path
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	// Verify connectivity.
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("PostgreSQL ping failed: %v", err)
	}

	ensureSchedulingExtensions(ctx, pool)
	if err := verifyPostGIS(ctx, pool); err != nil {
		log.Fatalf("PostgreSQL PostGIS check failed: %v", err)
	}

	fmt.Println("✅ PostgreSQL connected (scheduling schema)")
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
