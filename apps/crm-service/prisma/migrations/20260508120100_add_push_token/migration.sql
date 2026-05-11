-- Add push notification token columns to CompanyUser.
-- Used by technician-app (FCM/Expo) and any future web push.
ALTER TABLE "crm"."company_users"
  ADD COLUMN "pushToken" TEXT,
  ADD COLUMN "pushPlatform" TEXT,
  ADD COLUMN "pushTokenUpdatedAt" TIMESTAMP(3);

CREATE INDEX "company_users_pushToken_idx" ON "crm"."company_users"("pushToken");
