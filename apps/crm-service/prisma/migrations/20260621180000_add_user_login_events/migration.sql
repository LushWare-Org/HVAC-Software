-- CreateTable
CREATE TABLE "crm"."user_login_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "loggedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_login_events_companyId_userId_idx" ON "crm"."user_login_events"("companyId", "userId");

-- CreateIndex
CREATE INDEX "user_login_events_companyId_loggedInAt_idx" ON "crm"."user_login_events"("companyId", "loggedInAt");
