/**
 * apply-migrations.mjs
 *
 * Applies pending SQL migrations directly via pg client (bypasses Prisma binary SSL issue).
 * Run: node scripts/apply-migrations.mjs
 */
import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

const BASE_URL = 'postgresql://postgres.piezmopzxbuksjuuwwyw:vnHoMrqPMHTRHOu6@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function connect(schema) {
  const client = new Client({
    connectionString: `${BASE_URL}?schema=${schema}`,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client, schema) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${schema}"."_prisma_migrations" (
      id                      VARCHAR(36)  NOT NULL PRIMARY KEY,
      checksum                VARCHAR(64)  NOT NULL,
      finished_at             TIMESTAMPTZ,
      migration_name          TEXT         NOT NULL,
      logs                    TEXT,
      rolled_back_at          TIMESTAMPTZ,
      started_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
      applied_steps_count     INTEGER      NOT NULL DEFAULT 0
    )
  `);
}

async function isMigrationApplied(client, schema, name) {
  const res = await client.query(
    `SELECT id FROM "${schema}"."_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL`,
    [name],
  );
  return res.rowCount > 0;
}

async function recordMigration(client, schema, name, sql) {
  const crypto = await import('crypto');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  const id = crypto.randomUUID();
  await client.query(
    `INSERT INTO "${schema}"."_prisma_migrations"
       (id, checksum, migration_name, finished_at, applied_steps_count)
     VALUES ($1, $2, $3, now(), 1)
     ON CONFLICT (id) DO NOTHING`,
    [id, checksum, name],
  );
}

async function applySQL(client, sql) {
  // Split on statement boundaries but keep transaction-safe
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

// ─── Migration definitions ────────────────────────────────────────────────────

const migrations = [
  // ── CRM: Meta attribution fields on leads ──
  {
    schema: 'crm',
    name: '20260512000000_add_lead_meta_attribution',
    sql: `
ALTER TABLE "crm"."leads"
  ADD COLUMN IF NOT EXISTS "leadgenId" TEXT,
  ADD COLUMN IF NOT EXISTS "adName"    TEXT,
  ADD COLUMN IF NOT EXISTS "formId"    TEXT;

CREATE INDEX IF NOT EXISTS "leads_leadgenId_idx" ON "crm"."leads"("leadgenId");
    `.trim(),
  },

  // ── Marketing: full schema init ──
  {
    schema: 'marketing',
    name: '20260512000001_marketing_init',
    sql: `
CREATE SCHEMA IF NOT EXISTS "marketing";

CREATE TYPE IF NOT EXISTS "marketing"."MarketingChannel" AS ENUM ('EMAIL', 'SMS');
CREATE TYPE IF NOT EXISTS "marketing"."AudienceType"     AS ENUM ('STATIC', 'DYNAMIC');
CREATE TYPE IF NOT EXISTS "marketing"."SendJobStatus"    AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE IF NOT EXISTS "marketing"."SendEventType"    AS ENUM ('DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED', 'COMPLAINED');
CREATE TYPE IF NOT EXISTS "marketing"."SuppressionReason"   AS ENUM ('UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'MANUAL');
CREATE TYPE IF NOT EXISTS "marketing"."ReviewRequestStatus" AS ENUM ('PENDING', 'CLICKED', 'REVIEWED', 'EXPIRED');

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
  FOREIGN KEY ("campaignId") REFERENCES "marketing"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing"."send_events"
  ADD CONSTRAINT "send_events_sendJobId_fkey"
  FOREIGN KEY ("sendJobId") REFERENCES "marketing"."send_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "campaigns_companyId_status_idx"    ON "marketing"."campaigns"("companyId", "status");
CREATE INDEX IF NOT EXISTS "campaigns_companyId_scheduleAt_idx" ON "marketing"."campaigns"("companyId", "scheduleAt");
CREATE INDEX IF NOT EXISTS "templates_companyId_channel_idx"   ON "marketing"."templates"("companyId", "channel");
CREATE INDEX IF NOT EXISTS "audiences_companyId_idx"           ON "marketing"."audiences"("companyId");
CREATE INDEX IF NOT EXISTS "send_jobs_companyId_status_idx"    ON "marketing"."send_jobs"("companyId", "status");
CREATE INDEX IF NOT EXISTS "send_jobs_companyId_customerId_idx" ON "marketing"."send_jobs"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "send_jobs_campaignId_idx"          ON "marketing"."send_jobs"("campaignId");
CREATE INDEX IF NOT EXISTS "send_jobs_scheduledAt_idx"         ON "marketing"."send_jobs"("scheduledAt");
CREATE INDEX IF NOT EXISTS "send_events_sendJobId_idx"         ON "marketing"."send_events"("sendJobId");
CREATE INDEX IF NOT EXISTS "send_events_sendJobId_eventType_idx" ON "marketing"."send_events"("sendJobId", "eventType");
CREATE INDEX IF NOT EXISTS "suppressions_companyId_channel_idx" ON "marketing"."suppressions"("companyId", "channel");
CREATE UNIQUE INDEX IF NOT EXISTS "suppressions_companyId_channel_address_key"
  ON "marketing"."suppressions"("companyId", "channel", "address");
CREATE INDEX IF NOT EXISTS "review_requests_companyId_customerId_idx" ON "marketing"."review_requests"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "review_requests_companyId_status_idx"     ON "marketing"."review_requests"("companyId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "review_requests_companyId_jobId_key"
  ON "marketing"."review_requests"("companyId", "jobId");
CREATE INDEX IF NOT EXISTS "marketing_attributions_companyId_customerId_idx"
  ON "marketing"."marketing_attributions"("companyId", "customerId");
CREATE INDEX IF NOT EXISTS "marketing_attributions_companyId_source_idx"
  ON "marketing"."marketing_attributions"("companyId", "source");
    `.trim(),
  },

  // ── CRM: equipment consumables (portal engagement phase 1) ──
  {
    schema: 'crm',
    name: '20260612090000_add_equipment_consumables',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."equipment_consumables" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'FILTER',
  "partNumber" TEXT,
  "description" TEXT,
  "sizeSpec" TEXT,
  "rating" TEXT,
  "intervalDays" INTEGER NOT NULL DEFAULT 90,
  "lastReplacedAt" TIMESTAMP(3),
  "purchaseUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "equipment_consumables_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipment_consumables_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "equipment_consumables_equipmentId_idx" ON "crm"."equipment_consumables"("equipmentId");
CREATE INDEX IF NOT EXISTS "equipment_consumables_companyId_idx" ON "crm"."equipment_consumables"("companyId");
    `.trim(),
  },

  // ── CRM: company announcements (portal engagement phase 1) ──
  {
    schema: 'crm',
    name: '20260612091000_add_company_announcements',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."company_announcements" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "linkUrl" TEXT,
  "linkLabel" TEXT,
  "accentColor" TEXT NOT NULL DEFAULT '#1a73e8',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "activeFrom" TIMESTAMP(3),
  "activeTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "company_announcements_companyId_isActive_idx"
  ON "crm"."company_announcements"("companyId", "isActive");
    `.trim(),
  },

  // ── CRM: contractor posts (portal engagement phase 2 — tips/videos/offers) ──
  {
    schema: 'crm',
    name: '20260612102000_add_contractor_posts',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."contractor_posts" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL,
  "type"          TEXT NOT NULL DEFAULT 'TIP',
  "title"         TEXT NOT NULL,
  "body"          TEXT,
  "videoUrl"      TEXT,
  "heroImageUrl"  TEXT,
  "isPinned"      BOOLEAN NOT NULL DEFAULT false,
  "isPublished"   BOOLEAN NOT NULL DEFAULT false,
  "publishedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "contractor_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "contractor_posts_companyId_idx"
  ON "crm"."contractor_posts"("companyId", "isPublished");
    `.trim(),
  },

  // ── CRM: equipment manual URL (portal engagement phase 2) ──
  {
    schema: 'crm',
    name: '20260612103000_add_equipment_manual_url',
    sql: `ALTER TABLE "crm"."equipment" ADD COLUMN IF NOT EXISTS "manual_url" TEXT;`.trim(),
  },

  // ── CRM: Project Templates — Housing Scheme (spec: docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md) ──
  {
    schema: 'crm',
    name: '20260713000000_add_project_templates_housing_scheme',
    sql: `
ALTER TABLE "crm"."projects" ADD COLUMN IF NOT EXISTS "templateType" TEXT NOT NULL DEFAULT 'STANDARD';

CREATE TABLE IF NOT EXISTS "crm"."houses" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "address" TEXT,
  "ownerCustomerId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "houses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "houses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "crm"."projects"("id") ON DELETE CASCADE,
  CONSTRAINT "houses_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId") REFERENCES "crm"."customers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "houses_companyId_projectId_idx" ON "crm"."houses"("companyId", "projectId");
CREATE INDEX IF NOT EXISTS "houses_ownerCustomerId_idx" ON "crm"."houses"("ownerCustomerId");

ALTER TABLE "crm"."equipment" ADD COLUMN IF NOT EXISTS "houseId" TEXT;
CREATE INDEX IF NOT EXISTS "equipment_houseId_idx" ON "crm"."equipment"("houseId");

CREATE TABLE IF NOT EXISTS "crm"."house_issue_reports" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "houseId" TEXT NOT NULL,
  "equipmentId" TEXT,
  "reportedByCustomerId" TEXT NOT NULL,
  "errorCode" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "house_issue_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "house_issue_reports_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "crm"."houses"("id") ON DELETE CASCADE,
  CONSTRAINT "house_issue_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "crm"."equipment"("id") ON DELETE SET NULL,
  CONSTRAINT "house_issue_reports_reportedByCustomerId_fkey" FOREIGN KEY ("reportedByCustomerId") REFERENCES "crm"."customers"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "house_issue_reports_companyId_status_idx" ON "crm"."house_issue_reports"("companyId", "status");
CREATE INDEX IF NOT EXISTS "house_issue_reports_houseId_idx" ON "crm"."house_issue_reports"("houseId");
    `.trim(),
  },

  // ── Jobs: Housing Scheme service-log link (houseId/equipmentId, cross-service refs, no FK) ──
  // Mirrors apps/job-service/prisma/migrations/20260713000000_add_house_equipment_link/migration.sql
  // — applied here too since job-service has no JOBS_DIRECT_DATABASE_URL configured locally for
  // `prisma migrate deploy` (same pooler/session-mode issue this script already works around for crm).
  {
    schema: 'jobs',
    name: '20260713000000_add_house_equipment_link',
    sql: `
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "houseId" TEXT,
  ADD COLUMN IF NOT EXISTS "equipmentId" TEXT;

CREATE INDEX IF NOT EXISTS "jobs_houseId_idx" ON "jobs"."jobs"("houseId");
CREATE INDEX IF NOT EXISTS "jobs_equipmentId_idx" ON "jobs"."jobs"("equipmentId");
    `.trim(),
  },

  // ── CRM: optional project customer + house owner-at-creation + equipment photo/AI scan
  //    (spec: docs/superpowers/specs/2026-07-22-projects-housing-equipment-scan-design.md) ──
  {
    schema: 'crm',
    name: '20260722000000_optional_customer_and_equipment_scan',
    sql: `
ALTER TABLE "crm"."projects" ALTER COLUMN "customerId" DROP NOT NULL;

ALTER TABLE "crm"."equipment"
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "image_scan_status" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "image_scan_result" JSONB,
  ADD COLUMN IF NOT EXISTS "image_scan_error" TEXT;

CREATE TABLE IF NOT EXISTS "crm"."equipment_error_codes" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "meaning" TEXT,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "equipment_error_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "equipment_error_codes_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "equipment_error_codes_equipmentId_idx" ON "crm"."equipment_error_codes"("equipmentId");
CREATE INDEX IF NOT EXISTS "equipment_error_codes_companyId_idx" ON "crm"."equipment_error_codes"("companyId");
    `.trim(),
  },

  // ── CRM: tenant document templates (letterhead/footer for invoices/quotes/agreements)
  //    (spec: docs/superpowers/specs/2026-07-22-document-templates-design.md) ──
  {
    schema: 'crm',
    name: '20260722010000_add_document_templates',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."document_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "mode" TEXT NOT NULL DEFAULT 'BUILDER',
  "logoUrl" TEXT,
  "logoPosition" TEXT DEFAULT 'LEFT',
  "accentColor" TEXT,
  "headerText" TEXT,
  "footerText" TEXT,
  "bankDetails" TEXT,
  "showPageNumbers" BOOLEAN NOT NULL DEFAULT true,
  "letterheadImageUrl" TEXT,
  "letterheadTopMarginPx" INTEGER DEFAULT 140,
  "letterheadBottomMarginPx" INTEGER DEFAULT 100,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "document_templates_companyId_documentType_name_key"
  ON "crm"."document_templates"("companyId", "documentType", "name");
CREATE INDEX IF NOT EXISTS "document_templates_companyId_documentType_idx"
  ON "crm"."document_templates"("companyId", "documentType");

ALTER TABLE "crm"."service_agreements" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
    `.trim(),
  },

  // ── Finance: templateId on invoices/quotes (tenant document templates)
  //    (spec: docs/superpowers/specs/2026-07-22-document-templates-design.md) ──
  {
    schema: 'finance',
    name: '20260722010000_add_document_template_id',
    sql: `
ALTER TABLE "finance"."Invoice" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "finance"."Quote" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
    `.trim(),
  },

  // ── CRM: per-template company name/address override (design-in-app should be
  //    able to fully control the header, not just logo/color/text) ──
  {
    schema: 'crm',
    name: '20260723000000_add_document_template_company_override',
    sql: `
ALTER TABLE "crm"."document_templates"
  ADD COLUMN IF NOT EXISTS "companyName" TEXT,
  ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260723010000_add_document_template_layout',
    sql: `
ALTER TABLE "crm"."document_templates"
  ADD COLUMN IF NOT EXISTS "layout" JSONB;
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260723020000_rename_document_template_layout_to_rows',
    sql: `
ALTER TABLE "crm"."document_templates"
  RENAME COLUMN "layout" TO "rows";
    `.trim(),
  },

  // ── Housing Scheme: houseId on agreements/quotes/invoices — every house and
  //    owner can have their own agreement/quote/invoice, same pattern as
  //    Job.houseId (spec: docs/superpowers/specs/2026-07-31-house-agreements-billing-design.md) ──
  {
    schema: 'crm',
    name: '20260731000000_add_agreement_house_id',
    sql: `
ALTER TABLE "crm"."service_agreements" ADD COLUMN IF NOT EXISTS "houseId" TEXT;
CREATE INDEX IF NOT EXISTS "service_agreements_houseId_idx" ON "crm"."service_agreements"("houseId");
    `.trim(),
  },
  {
    schema: 'finance',
    name: '20260731000000_add_quote_invoice_house_id',
    sql: `
ALTER TABLE "finance"."Quote" ADD COLUMN IF NOT EXISTS "houseId" TEXT;
CREATE INDEX IF NOT EXISTS "quote_houseId_idx" ON "finance"."Quote"("houseId");

ALTER TABLE "finance"."Invoice" ADD COLUMN IF NOT EXISTS "houseId" TEXT;
CREATE INDEX IF NOT EXISTS "invoice_houseId_idx" ON "finance"."Invoice"("houseId");
    `.trim(),
  },

  // ── Generic project component templates (spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md) ──
  {
    schema: 'crm',
    name: '20260814000000_add_project_component_templates',
    sql: `
CREATE TABLE IF NOT EXISTS "crm"."project_templates" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "componentTypes" JSONB NOT NULL,
  "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "project_templates_companyId_idx" ON "crm"."project_templates"("companyId");

ALTER TABLE "crm"."projects"
  ADD COLUMN IF NOT EXISTS "templateId" TEXT,
  ADD COLUMN IF NOT EXISTS "componentTypesSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "componentCustomerSettings" JSONB;

CREATE TABLE IF NOT EXISTS "crm"."project_components" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "projectId" UUID NOT NULL,
  "componentTypeKey" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "ownerCustomerId" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT '{}',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "project_components_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_components_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "crm"."projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_components_ownerCustomerId_fkey" FOREIGN KEY ("ownerCustomerId")
    REFERENCES "crm"."customers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "project_components_projectId_idx" ON "crm"."project_components"("companyId", "projectId");
CREATE INDEX IF NOT EXISTS "project_components_ownerCustomerId_idx" ON "crm"."project_components"("ownerCustomerId");

CREATE TABLE IF NOT EXISTS "crm"."component_issue_reports" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "componentId" TEXT NOT NULL,
  "equipmentId" TEXT,
  "reportedByCustomerId" TEXT NOT NULL,
  "errorCode" TEXT,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "component_issue_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "component_issue_reports_componentId_fkey" FOREIGN KEY ("componentId")
    REFERENCES "crm"."project_components"("id") ON DELETE CASCADE,
  CONSTRAINT "component_issue_reports_equipmentId_fkey" FOREIGN KEY ("equipmentId")
    REFERENCES "crm"."equipment"("id") ON DELETE SET NULL,
  CONSTRAINT "component_issue_reports_reportedByCustomerId_fkey" FOREIGN KEY ("reportedByCustomerId")
    REFERENCES "crm"."customers"("id")
);
CREATE INDEX IF NOT EXISTS "component_issue_reports_componentId_idx" ON "crm"."component_issue_reports"("companyId", "componentId");

ALTER TABLE "crm"."equipment" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
CREATE INDEX IF NOT EXISTS "equipment_componentId_idx" ON "crm"."equipment"("componentId");
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260814000001_migrate_housing_scheme_to_components',
    sql: `
-- One built-in "Housing Scheme" template per company that has >=1 HOUSING_SCHEME project.
INSERT INTO "crm"."project_templates" ("id", "companyId", "name", "description", "componentTypes", "isBuiltIn")
SELECT gen_random_uuid()::text, "companyId", 'Housing Scheme',
       'Independently-owned houses under one project.',
       '[{"key":"house","label":"House","customerAssignable":true}]'::jsonb,
       true
FROM (SELECT DISTINCT "companyId" FROM "crm"."projects" WHERE "templateType" = 'HOUSING_SCHEME') t;

-- Point every HOUSING_SCHEME project at its company's new template + snapshot.
UPDATE "crm"."projects" p
SET "templateId" = pt."id",
    "componentTypesSnapshot" = pt."componentTypes",
    "componentCustomerSettings" = '{"house": true}'::jsonb
FROM "crm"."project_templates" pt
WHERE p."templateType" = 'HOUSING_SCHEME'
  AND pt."companyId" = p."companyId"
  AND pt."isBuiltIn" = true
  AND pt."name" = 'Housing Scheme';

-- Reuse the SAME id for every migrated house so every FK pointing at it
-- (equipment, issue reports, jobs, quotes, invoices, agreements) keeps working.
INSERT INTO "crm"."project_components"
  ("id", "companyId", "projectId", "componentTypeKey", "label", "ownerCustomerId", "tags", "notes", "createdAt", "updatedAt")
SELECT "id", "companyId", "projectId", 'house', "label", "ownerCustomerId", "tags", "notes", "createdAt", "updatedAt"
FROM "crm"."houses"
ON CONFLICT ("id") DO NOTHING;

-- Repoint equipment at the (same-id) component row.
UPDATE "crm"."equipment" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;

-- Migrate issue reports (new table, same ids, componentId = old houseId value).
INSERT INTO "crm"."component_issue_reports"
  ("id", "companyId", "componentId", "equipmentId", "reportedByCustomerId", "errorCode", "description", "status", "resolvedNote", "createdAt", "updatedAt")
SELECT "id", "companyId", "houseId", "equipmentId", "reportedByCustomerId", "errorCode", "description", "status", "resolvedNote", "createdAt", "updatedAt"
FROM "crm"."house_issue_reports"
ON CONFLICT ("id") DO NOTHING;
    `.trim(),
  },
  {
    schema: 'jobs',
    name: '20260814000000_add_job_component_id',
    sql: `
ALTER TABLE "jobs"."jobs" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "jobs"."jobs" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "jobs_componentId_idx" ON "jobs"."jobs"("componentId");
    `.trim(),
  },
  {
    schema: 'finance',
    name: '20260814000000_add_quote_invoice_component_id',
    sql: `
ALTER TABLE "finance"."Quote" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "finance"."Quote" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "quote_componentId_idx" ON "finance"."Quote"("componentId");

ALTER TABLE "finance"."Invoice" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "finance"."Invoice" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "invoice_componentId_idx" ON "finance"."Invoice"("componentId");
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260814000002_add_agreement_component_id',
    sql: `
ALTER TABLE "crm"."service_agreements" ADD COLUMN IF NOT EXISTS "componentId" TEXT;
UPDATE "crm"."service_agreements" SET "componentId" = "houseId" WHERE "houseId" IS NOT NULL AND "componentId" IS NULL;
CREATE INDEX IF NOT EXISTS "service_agreements_componentId_idx" ON "crm"."service_agreements"("componentId");
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260815000000_add_project_template_status',
    sql: `
ALTER TABLE "crm"."project_templates" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
-- Every template that already exists (including the migrated built-in "Housing
-- Scheme" template) must stay visible in the New Project picker after this ships.
UPDATE "crm"."project_templates" SET "status" = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS "project_templates_status_idx" ON "crm"."project_templates"("companyId", "status");
    `.trim(),
  },
  {
    schema: 'comms',
    name: '20260815010000_add_activity_logs',
    sql: `
CREATE TABLE IF NOT EXISTS "comms"."activity_logs" (
  "id" TEXT NOT NULL,
  "companyId" TEXT,
  "companyName" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorName" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "requestSummary" JSONB,
  "responseSummary" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "activity_logs_companyId_createdAt_idx" ON "comms"."activity_logs"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_action_createdAt_idx" ON "comms"."activity_logs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_status_createdAt_idx" ON "comms"."activity_logs"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "activity_logs_createdAt_idx" ON "comms"."activity_logs"("createdAt");
    `.trim(),
  },
  {
    schema: 'crm',
    name: '20260818000000_add_tenant_finance_settings',
    sql: `
ALTER TABLE "crm"."companies" ADD COLUMN IF NOT EXISTS "enabledCurrencies" TEXT[] NOT NULL DEFAULT ARRAY['USD'];
UPDATE "crm"."companies" SET "enabledCurrencies" = ARRAY[currency] WHERE NOT (currency = ANY("enabledCurrencies"));

CREATE TABLE IF NOT EXISTS "crm"."tax_rate_presets" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "rate" DECIMAL(5,4) NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tax_rate_presets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tax_rate_presets_companyId_isActive_idx" ON "crm"."tax_rate_presets"("companyId", "isActive");

CREATE TABLE IF NOT EXISTS "crm"."payment_terms_presets" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_terms_presets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "payment_terms_presets_companyId_isActive_idx" ON "crm"."payment_terms_presets"("companyId", "isActive");

INSERT INTO "crm"."tax_rate_presets" ("id", "companyId", "name", "rate", "isDefault", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'No Tax', 0, true, true, NOW()
FROM "crm"."companies" c
WHERE NOT EXISTS (SELECT 1 FROM "crm"."tax_rate_presets" p WHERE p."companyId" = c."id");

INSERT INTO "crm"."payment_terms_presets" ("id", "companyId", "name", "days", "isDefault", "isActive", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'Net 30', 30, true, true, NOW()
FROM "crm"."companies" c
WHERE NOT EXISTS (SELECT 1 FROM "crm"."payment_terms_presets" p WHERE p."companyId" = c."id");
    `.trim(),
  },
  {
    schema: 'jobs',
    name: '20260818010000_add_job_currency',
    sql: `
ALTER TABLE "jobs"."jobs" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
UPDATE "jobs"."jobs" j
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE j."companyId" = c.id
  AND j."currency" = 'USD'
  AND c.currency <> 'USD';
    `.trim(),
  },
  {
    schema: 'finance',
    name: '20260818020000_add_finance_currency',
    sql: `
ALTER TABLE "finance"."Quote" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."Invoice" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "finance"."RecurringSchedule" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

UPDATE "finance"."Quote" q
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE q."companyId" = c.id
  AND q."currency" = 'USD'
  AND c.currency <> 'USD';

UPDATE "finance"."Invoice" i
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE i."companyId" = c.id
  AND i."currency" = 'USD'
  AND c.currency <> 'USD';

UPDATE "finance"."RecurringSchedule" r
SET "currency" = c.currency
FROM "crm"."companies" c
WHERE r."companyId" = c.id
  AND r."currency" = 'USD'
  AND c.currency <> 'USD';
    `.trim(),
  },
  {
    schema: 'comms',
    name: '20260819000000_add_notification_dedupe_key',
    sql: `
ALTER TABLE "comms"."Notification" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;
CREATE INDEX IF NOT EXISTS "Notification_companyId_dedupeKey_idx" ON "comms"."Notification"("companyId", "dedupeKey");
    `.trim(),
  },

  // ── CRM: the customer's own service location ──
  // Jobs already carry serviceLatitude/serviceLongitude, but there was nowhere
  // to remember where a customer actually *is* — so every job, from either
  // side, made someone drop a pin again from scratch. These three columns are
  // that memory: the default pin for new jobs, still overridable per job.
  {
    schema: 'crm',
    name: '20260825000000_add_customer_location',
    sql: `
ALTER TABLE "crm"."customers"
  ADD COLUMN IF NOT EXISTS "latitude"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "locationTag" TEXT,
  ADD COLUMN IF NOT EXISTS "locationSetAt" TIMESTAMPTZ;
    `.trim(),
  },

  // ── Crew support ──
  // dispatch_assignments was always one row per (job, technician) with no unique
  // constraint on job_id, so several technicians per job were already storable.
  // What was missing is correctness: these two partial indexes are what stop the
  // same person being added twice and guarantee exactly one lead.
  {
    schema: 'scheduling',
    name: '20260902000000_crew_assignments',
    sql: `
ALTER TABLE "scheduling"."dispatch_assignments"
  ADD COLUMN IF NOT EXISTS "is_lead"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "base_distance_km" NUMERIC(8,3);

ALTER TABLE "scheduling"."technicians"
  ADD COLUMN IF NOT EXISTS "base_location" geometry(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_technicians_base
  ON "scheduling"."technicians" USING GIST("base_location");

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_job_tech
  ON "scheduling"."dispatch_assignments" (job_id, technician_id)
  WHERE status <> 'CANCELLED';

CREATE UNIQUE INDEX IF NOT EXISTS uq_assignment_job_lead
  ON "scheduling"."dispatch_assignments" (job_id)
  WHERE is_lead AND status <> 'CANCELLED';
    `.trim(),
  },

  // Every existing job becomes a crew of one. The EARLIEST live assignment
  // becomes lead: that is the technician the dispatcher originally chose, which
  // matches intent better than the most-recently-updated row the dashboard
  // happens to show today.
  {
    schema: 'scheduling',
    name: '20260902000100_crew_backfill',
    sql: `
UPDATE "scheduling"."dispatch_assignments" a
SET    status = 'CANCELLED', updated_at = NOW()
WHERE  a.status <> 'CANCELLED'
  AND  EXISTS (
    SELECT 1 FROM "scheduling"."dispatch_assignments" b
    WHERE b.job_id = a.job_id
      AND b.technician_id = a.technician_id
      AND b.status <> 'CANCELLED'
      AND b.created_at < a.created_at
  );

UPDATE "scheduling"."dispatch_assignments" a
SET    is_lead = true
WHERE  a.status <> 'CANCELLED'
  AND  NOT a.is_lead
  AND  NOT EXISTS (
    SELECT 1 FROM "scheduling"."dispatch_assignments" b
    WHERE b.job_id = a.job_id
      AND b.status <> 'CANCELLED'
      AND (b.created_at, b.id) < (a.created_at, a.id)
  );
    `.trim(),
  },

  // crewUserIds is denormalised so the technician app's "my jobs" query stays a
  // single job-service query. Crew membership lives in the Go scheduling
  // service, so without this the mobile app's hottest path becomes a
  // cross-service join. ProjectRosterDay.techUserIds sets the same precedent.
  {
    schema: 'jobs',
    name: '20260902000200_job_crew',
    sql: `
ALTER TABLE "jobs"."jobs"
  ADD COLUMN IF NOT EXISTS "crewUserIds"       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "requiredTechCount" INTEGER;

UPDATE "jobs"."jobs"
SET    "crewUserIds" = ARRAY["assignedToId"]
WHERE  "assignedToId" IS NOT NULL
  AND  "crewUserIds" = '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_crew
  ON "jobs"."jobs" USING GIN("crewUserIds");

DO $$ BEGIN
  CREATE TYPE "jobs"."JobCrewEventType" AS ENUM
    ('ADDED', 'REMOVED', 'LEAD_CHANGED', 'CHECKED_OUT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "jobs"."job_crew_events" (
  "id"             TEXT PRIMARY KEY,
  "companyId"      TEXT NOT NULL,
  "jobId"          TEXT NOT NULL REFERENCES "jobs"."jobs"("id"),
  "event"          "jobs"."JobCrewEventType" NOT NULL,
  "technicianId"   TEXT NOT NULL,
  "technicianName" TEXT NOT NULL,
  "previousLeadId" TEXT,
  "actorId"        TEXT NOT NULL,
  "actorName"      TEXT NOT NULL,
  "reason"         TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_crew_events_job
  ON "jobs"."job_crew_events" ("companyId", "jobId");
    `.trim(),
  },

  // Repairs jobs assigned through the single-technician path between the crew
  // migration and the SyncJobAssignment fix. Those set assignedToId but left
  // crewUserIds empty, which made the job invisible to the technician it had
  // just been given to, because the mobile app filters on crew membership.
  // Idempotent: only touches rows that are actually inconsistent.
  {
    schema: 'jobs',
    name: '20260905000000_backfill_missing_crew',
    sql: `
UPDATE "jobs"."jobs"
SET    "crewUserIds" = ARRAY["assignedToId"]
WHERE  "assignedToId" IS NOT NULL
  AND  NOT ("assignedToId" = ANY("crewUserIds"));
    `.trim(),
  },

];

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  const grouped = {};
  for (const m of migrations) {
    if (!grouped[m.schema]) grouped[m.schema] = [];
    grouped[m.schema].push(m);
  }

  for (const [schema, migs] of Object.entries(grouped)) {
    console.log(`\n=== Schema: ${schema} ===`);
    const client = await connect(schema);
    try {
      await ensureMigrationsTable(client, schema);

      for (const mig of migs) {
        const applied = await isMigrationApplied(client, schema, mig.name);
        if (applied) {
          console.log(`  [skip]  ${mig.name} (already applied)`);
          continue;
        }
        console.log(`  [apply] ${mig.name} …`);
        await applySQL(client, mig.sql);
        await recordMigration(client, schema, mig.name, mig.sql);
        console.log(`  [ok]    ${mig.name}`);
      }
    } finally {
      await client.end();
    }
  }
  console.log('\nAll done.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
