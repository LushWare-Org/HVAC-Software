-- ============================================================
-- T&S CRM — Scheduling Schema
-- Supabase PostgreSQL 16 + PostGIS
-- ============================================================

CREATE SCHEMA IF NOT EXISTS scheduling;

-- Enable PostGIS on this schema (extension must exist in the shared Supabase database)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Technician availability / profile (mirrors subset of auth)
-- ============================================================
CREATE TABLE scheduling.technicians (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        UUID        NOT NULL,
  user_id           UUID        NOT NULL,                    -- Auth0 sub (maps to auth)
  name              TEXT        NOT NULL,
  phone             TEXT,
  avatar_url        TEXT,
  skills            TEXT[]      DEFAULT '{}',                -- e.g. ['HVAC','PLUMBING']
  max_daily_jobs    INT         NOT NULL DEFAULT 8,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  rating            NUMERIC(3,2) NOT NULL DEFAULT 5.00,      -- 0.00–5.00 avg customer rating
  total_ratings     INT         NOT NULL DEFAULT 0,
  current_location  geometry(Point, 4326),                   -- PostGIS GPS point (lng, lat)
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX idx_technicians_company    ON scheduling.technicians(company_id);
CREATE INDEX idx_technicians_location   ON scheduling.technicians USING GIST(current_location);
CREATE INDEX idx_technicians_active     ON scheduling.technicians(company_id, is_active);

-- ============================================================
-- Working shifts / availability windows
-- ============================================================
CREATE TABLE scheduling.technician_shifts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id  UUID        NOT NULL REFERENCES scheduling.technicians(id) ON DELETE CASCADE,
  company_id     UUID        NOT NULL,
  shift_date     DATE        NOT NULL,
  start_time     TIME        NOT NULL DEFAULT '08:00',
  end_time       TIME        NOT NULL DEFAULT '17:00',
  is_available   BOOLEAN     NOT NULL DEFAULT TRUE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (technician_id, shift_date)
);

CREATE INDEX idx_shifts_technician_date ON scheduling.technician_shifts(technician_id, shift_date);
CREATE INDEX idx_shifts_company_date    ON scheduling.technician_shifts(company_id, shift_date);

-- ============================================================
-- Service zones (geographic polygons per company)
-- ============================================================
CREATE TABLE scheduling.service_zones (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID        NOT NULL,
  name        TEXT        NOT NULL,
  boundary    geometry(Polygon, 4326) NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_company    ON scheduling.service_zones(company_id);
CREATE INDEX idx_zones_boundary   ON scheduling.service_zones USING GIST(boundary);

-- Junction: which technicians cover which zones
CREATE TABLE scheduling.technician_zones (
  technician_id UUID NOT NULL REFERENCES scheduling.technicians(id) ON DELETE CASCADE,
  zone_id       UUID NOT NULL REFERENCES scheduling.service_zones(id) ON DELETE CASCADE,
  PRIMARY KEY (technician_id, zone_id)
);

-- ============================================================
-- Dispatch assignments
-- ============================================================
CREATE TYPE scheduling.assignment_status AS ENUM (
  'SUGGESTED',      -- returned to dispatcher, not yet confirmed
  'ASSIGNED',       -- confirmed by dispatcher or auto-assigned
  'EN_ROUTE',       -- technician started driving
  'ON_SITE',        -- checked in on location
  'COMPLETED',      -- work done
  'CANCELLED'
);

CREATE TABLE scheduling.dispatch_assignments (
  id             UUID                            PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID                            NOT NULL,
  job_id         UUID                            NOT NULL,         -- FK → jobs schema (cross-schema ref)
  work_order_id  UUID,                                             -- set once WO is created
  technician_id  UUID                            NOT NULL REFERENCES scheduling.technicians(id),
  status         scheduling.assignment_status    NOT NULL DEFAULT 'ASSIGNED',
  score          NUMERIC(5,2),                                     -- Phase 1 scoring result
  distance_km    NUMERIC(8,3),                                     -- distance at time of assignment
  assigned_by    UUID,                                             -- dispatcher user_id (NULL = auto)
  assigned_at    TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
  en_route_at    TIMESTAMPTZ,
  on_site_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  scheduled_start TIMESTAMPTZ,
  scheduled_end   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ                     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ                     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_company     ON scheduling.dispatch_assignments(company_id);
CREATE INDEX idx_assignments_job         ON scheduling.dispatch_assignments(job_id);
CREATE INDEX idx_assignments_technician  ON scheduling.dispatch_assignments(technician_id);
CREATE INDEX idx_assignments_status      ON scheduling.dispatch_assignments(company_id, status);
CREATE INDEX idx_assignments_scheduled   ON scheduling.dispatch_assignments(company_id, scheduled_start);

-- ============================================================
-- GPS tracking (high-frequency, time-series)
-- ============================================================
CREATE TABLE scheduling.gps_tracking (
  id             BIGSERIAL   PRIMARY KEY,
  technician_id  UUID        NOT NULL REFERENCES scheduling.technicians(id) ON DELETE CASCADE,
  company_id     UUID        NOT NULL,
  location       geometry(Point, 4326) NOT NULL,
  accuracy_m     REAL,                        -- GPS accuracy in metres
  speed_kmh      REAL,                        -- speed at capture time
  heading_deg    REAL,                        -- compass heading 0–360
  battery_pct    SMALLINT,
  captured_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index: only keep last 24h in hot path (older rows for analytics)
CREATE INDEX idx_gps_tech_recent  ON scheduling.gps_tracking(technician_id, captured_at DESC);
CREATE INDEX idx_gps_company      ON scheduling.gps_tracking(company_id, captured_at DESC);
CREATE INDEX idx_gps_location     ON scheduling.gps_tracking USING GIST(location);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION scheduling.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_technicians_updated_at
  BEFORE UPDATE ON scheduling.technicians
  FOR EACH ROW EXECUTE FUNCTION scheduling.set_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON scheduling.dispatch_assignments
  FOR EACH ROW EXECUTE FUNCTION scheduling.set_updated_at();
