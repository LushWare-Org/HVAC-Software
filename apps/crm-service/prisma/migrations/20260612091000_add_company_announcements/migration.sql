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
