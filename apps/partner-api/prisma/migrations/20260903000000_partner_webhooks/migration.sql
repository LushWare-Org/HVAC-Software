CREATE TYPE "WebhookStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');

CREATE TABLE IF NOT EXISTS "partner_webhook" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "status" "WebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partner_webhook_company_id_status_idx"
    ON "partner_webhook" ("company_id", "status");

CREATE TABLE IF NOT EXISTS "partner_webhook_delivery" (
    "id" TEXT NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status_code" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_webhook_delivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partner_webhook_delivery_webhook_id_created_at_idx"
    ON "partner_webhook_delivery" ("webhook_id", "created_at");

CREATE INDEX IF NOT EXISTS "partner_webhook_delivery_company_event_created_idx"
    ON "partner_webhook_delivery" ("company_id", "event_type", "created_at");

ALTER TABLE "partner_webhook_delivery"
    ADD CONSTRAINT "partner_webhook_delivery_webhook_id_fkey"
    FOREIGN KEY ("webhook_id") REFERENCES "partner_webhook"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
