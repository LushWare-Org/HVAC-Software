-- =============================================================
-- T&S CRM — Pending Migrations (apply via Supabase SQL Editor)
-- Project: piezmopzxbuksjuuwwyw
-- Date: 2026-05-12
-- =============================================================
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- It is idempotent — safe to run multiple times.
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. CRM: Meta Lead Ads attribution fields on leads table
-- Migration: 20260512000000_add_lead_meta_attribution
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "crm"."leads"
  ADD COLUMN IF NOT EXISTS "leadgenId" TEXT,
  ADD COLUMN IF NOT EXISTS "adName"    TEXT,
  ADD COLUMN IF NOT EXISTS "formId"    TEXT;

CREATE INDEX IF NOT EXISTS "leads_leadgenId_idx"
  ON "crm"."leads"("leadgenId");

-- Record migration in _prisma_migrations
CREATE TABLE IF NOT EXISTS "crm"."_prisma_migrations" (
  id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
  checksum            VARCHAR(64)  NOT NULL,
  finished_at         TIMESTAMPTZ,
  migration_name      TEXT         NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  applied_steps_count INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO "crm"."_prisma_migrations"
  (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text, 'manual', '20260512000000_add_lead_meta_attribution', now(), 1)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- 2. Marketing schema: full init
-- Migration: 20260512000001_marketing_init
-- ─────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS "marketing";

-- Enums (CREATE TYPE doesn't support IF NOT EXISTS before PG 14 — use DO block)
DO $$ BEGIN
  CREATE TYPE "marketing"."MarketingChannel" AS ENUM ('EMAIL', 'SMS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "marketing"."AudienceType" AS ENUM ('STATIC', 'DYNAMIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "marketing"."SendJobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "marketing"."SendEventType" AS ENUM ('DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'COMPLAINED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "marketing"."SuppressionReason" AS ENUM ('UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "marketing"."ReviewRequestStatus" AS ENUM ('PENDING', 'CLICKED', 'REVIEWED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS "marketing"."campaigns" (
  "id"         TEXT        NOT NULL,
  "companyId"  TEXT        NOT NULL,
  "name"       TEXT        NOT NULL,
  "channel"    "marketing"."MarketingChannel" NOT NULL,
  "status"     TEXT        NOT NULL DEFAULT 'DRAFT',
  "audienceId" TEXT,
  "templateId" TEXT,
  "scheduleAt" TIMESTAMPTZ,
  "createdBy"  TEXT        NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."templates" (
  "id"            TEXT NOT NULL,
  "companyId"     TEXT NOT NULL,
  "channel"       "marketing"."MarketingChannel" NOT NULL,
  "name"          TEXT NOT NULL,
  "subject"       TEXT,
  "htmlBody"      TEXT,
  "smsBody"       TEXT,
  "mergeTagsJson" TEXT NOT NULL DEFAULT '[]',
  "isDefault"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."audiences" (
  "id"          TEXT    NOT NULL,
  "companyId"   TEXT    NOT NULL,
  "name"        TEXT    NOT NULL,
  "type"        "marketing"."AudienceType" NOT NULL DEFAULT 'STATIC',
  "filtersJson" TEXT    NOT NULL DEFAULT '{}',
  "lastCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "audiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."send_jobs" (
  "id"                 TEXT NOT NULL,
  "campaignId"         TEXT,
  "companyId"          TEXT NOT NULL,
  "customerId"         TEXT NOT NULL,
  "channel"            "marketing"."MarketingChannel" NOT NULL,
  "address"            TEXT NOT NULL,
  "status"             "marketing"."SendJobStatus" NOT NULL DEFAULT 'PENDING',
  "scheduledAt"        TIMESTAMPTZ,
  "sentAt"             TIMESTAMPTZ,
  "externalId"         TEXT,
  "automationTemplate" TEXT,
  "error"              TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "send_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."send_events" (
  "id"         TEXT NOT NULL,
  "sendJobId"  TEXT NOT NULL,
  "eventType"  "marketing"."SendEventType" NOT NULL,
  "eventAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "urlClicked" TEXT,
  "metadata"   TEXT NOT NULL DEFAULT '{}',
  CONSTRAINT "send_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."suppressions" (
  "id"        TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "channel"   "marketing"."MarketingChannel" NOT NULL,
  "address"   TEXT NOT NULL,
  "reason"    "marketing"."SuppressionReason" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "suppressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."review_requests" (
  "id"         TEXT    NOT NULL,
  "companyId"  TEXT    NOT NULL,
  "customerId" TEXT    NOT NULL,
  "jobId"      TEXT    NOT NULL,
  "status"     "marketing"."ReviewRequestStatus" NOT NULL DEFAULT 'PENDING',
  "gateScore"  DOUBLE PRECISION,
  "smsAt"      TIMESTAMPTZ,
  "emailAt"    TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "marketing"."marketing_attributions" (
  "id"                TEXT           NOT NULL,
  "companyId"         TEXT           NOT NULL,
  "customerId"        TEXT           NOT NULL,
  "jobId"             TEXT,
  "invoiceId"         TEXT,
  "source"            TEXT           NOT NULL,
  "adName"            TEXT,
  "formId"            TEXT,
  "clickedAt"         TIMESTAMPTZ,
  "revenueAttributed" DECIMAL(10,2)  NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT "marketing_attributions_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "marketing"."send_jobs"
  ADD CONSTRAINT "send_jobs_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "marketing"."campaigns"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing"."send_events"
  ADD CONSTRAINT "send_events_sendJobId_fkey"
  FOREIGN KEY ("sendJobId") REFERENCES "marketing"."send_jobs"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "campaigns_companyId_status_idx"
  ON "marketing"."campaigns"("companyId", "status");
CREATE INDEX IF NOT EXISTS "campaigns_companyId_scheduleAt_idx"
  ON "marketing"."campaigns"("companyId", "scheduleAt");
CREATE INDEX IF NOT EXISTS "templates_companyId_channel_idx"
  ON "marketing"."templates"("companyId", "channel");
CREATE INDEX IF NOT EXISTS "audiences_companyId_idx"
  ON "marketing"."audiences"("companyId");
CREATE INDEX IF NOT EXISTS "send_jobs_companyId_status_idx"
  ON "marketing"."send_jobs"("companyId", "status");
CREATE INDEX IF NOT EXISTS "send_jobs_companyId_customerId_idx"
  ON "marketing"."send_jobs"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "send_jobs_campaignId_idx"
  ON "marketing"."send_jobs"("campaignId");
CREATE INDEX IF NOT EXISTS "send_jobs_scheduledAt_idx"
  ON "marketing"."send_jobs"("scheduledAt");
CREATE INDEX IF NOT EXISTS "send_events_sendJobId_idx"
  ON "marketing"."send_events"("sendJobId");
CREATE INDEX IF NOT EXISTS "send_events_sendJobId_eventType_idx"
  ON "marketing"."send_events"("sendJobId", "eventType");
CREATE INDEX IF NOT EXISTS "suppressions_companyId_channel_idx"
  ON "marketing"."suppressions"("companyId", "channel");
CREATE UNIQUE INDEX IF NOT EXISTS "suppressions_companyId_channel_address_key"
  ON "marketing"."suppressions"("companyId", "channel", "address");
CREATE INDEX IF NOT EXISTS "review_requests_companyId_customerId_idx"
  ON "marketing"."review_requests"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "review_requests_companyId_status_idx"
  ON "marketing"."review_requests"("companyId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "review_requests_companyId_jobId_key"
  ON "marketing"."review_requests"("companyId", "jobId");
CREATE INDEX IF NOT EXISTS "marketing_attributions_companyId_customerId_idx"
  ON "marketing"."marketing_attributions"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "marketing_attributions_companyId_source_idx"
  ON "marketing"."marketing_attributions"("companyId", "source");

-- Record migration in _prisma_migrations
CREATE TABLE IF NOT EXISTS "marketing"."_prisma_migrations" (
  id                  VARCHAR(36)  NOT NULL PRIMARY KEY,
  checksum            VARCHAR(64)  NOT NULL,
  finished_at         TIMESTAMPTZ,
  migration_name      TEXT         NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  applied_steps_count INTEGER      NOT NULL DEFAULT 0
);

INSERT INTO "marketing"."_prisma_migrations"
  (id, checksum, migration_name, finished_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text, 'manual', '20260512000001_marketing_init', now(), 1)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- Done. Verify with:
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema IN ('crm','marketing')
--   ORDER BY table_schema, table_name;
-- ─────────────────────────────────────────────────────────────
