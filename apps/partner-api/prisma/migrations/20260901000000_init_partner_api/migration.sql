-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "PartnerEnvironment" AS ENUM ('LIVE', 'SANDBOX');

-- CreateTable
CREATE TABLE "partner_api_key" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" "PartnerEnvironment" NOT NULL DEFAULT 'LIVE',
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT[],
    "rate_limit_per_min" INTEGER NOT NULL DEFAULT 60,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "partner_api_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_api_call" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "company_id" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_api_call_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_api_key_key_hash_key" ON "partner_api_key"("key_hash");

-- CreateIndex
CREATE INDEX "partner_api_key_company_id_status_idx" ON "partner_api_key"("company_id", "status");

-- CreateIndex
CREATE INDEX "partner_api_call_api_key_id_created_at_idx" ON "partner_api_call"("api_key_id", "created_at");

-- CreateIndex
CREATE INDEX "partner_api_call_company_id_created_at_idx" ON "partner_api_call"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "partner_api_call" ADD CONSTRAINT "partner_api_call_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "partner_api_key"("id") ON DELETE SET NULL ON UPDATE CASCADE;
