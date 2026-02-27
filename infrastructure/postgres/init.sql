-- ============================================================
-- T&S CRM — PostgreSQL Initialization Script
-- Runs once on first container startup
-- Creates: PostGIS extension + all 5 service schemas
-- ============================================================

-- Enable PostGIS (needed for scheduling service — GPS, service areas)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search on customer names

-- ---- Schemas (one per service for isolation) ----
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS jobs;
CREATE SCHEMA IF NOT EXISTS scheduling;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ---- Grant all privileges on schemas to app user ----
GRANT ALL PRIVILEGES ON SCHEMA crm TO tscrm_user;
GRANT ALL PRIVILEGES ON SCHEMA jobs TO tscrm_user;
GRANT ALL PRIVILEGES ON SCHEMA scheduling TO tscrm_user;
GRANT ALL PRIVILEGES ON SCHEMA finance TO tscrm_user;
GRANT ALL PRIVILEGES ON SCHEMA analytics TO tscrm_user;

-- Default privileges so future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON TABLES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL ON SEQUENCES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA jobs GRANT ALL ON TABLES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA jobs GRANT ALL ON SEQUENCES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA scheduling GRANT ALL ON TABLES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA scheduling GRANT ALL ON SEQUENCES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance GRANT ALL ON TABLES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA finance GRANT ALL ON SEQUENCES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO tscrm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON SEQUENCES TO tscrm_user;

-- ============================================================
-- Seed: Job Types (HVAC, Plumbing, Electrical)
-- These are referenced by job-service Prisma migrations.
-- We pre-create the records here in case the service hasn't
-- run migrations yet, so foreign keys don't fail on seed.
-- The actual table DDL is managed by Prisma in job-service.
-- NOTE: This section is intentionally left as comments.
--       The job-service Prisma migration + seed script handles it.
-- ============================================================

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'T&S CRM database initialized: schemas (crm, jobs, scheduling, finance, analytics) + PostGIS ready.';
END $$;
