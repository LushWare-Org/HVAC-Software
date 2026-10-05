-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "service" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "attempts" INTEGER NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costUsd" DECIMAL(12,6),
    "skipped" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_companyId_createdAt_idx" ON "ai_usage"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_createdAt_idx" ON "ai_usage"("createdAt");
