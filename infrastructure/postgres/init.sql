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
CREATE SCHEMA IF NOT EXISTS inventory;
CREATE SCHEMA IF NOT EXISTS comms;

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
  RAISE NOTICE 'T&S CRM database initialized: schemas (crm, jobs, scheduling, finance, analytics, inventory, comms) + PostGIS ready.';
END $$;
