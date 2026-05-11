-- QuickBooksConnection — one row per company after OAuth
CREATE TABLE "finance"."QuickBooksConnection" (
    "id"             TEXT NOT NULL,
    "companyId"      TEXT NOT NULL,
    "realmId"        TEXT NOT NULL,
    "accessToken"    TEXT NOT NULL,
    "refreshToken"   TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickBooksConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuickBooksConnection_companyId_key"
    ON "finance"."QuickBooksConnection"("companyId");

-- QuickBooksCustomerMap 
CREATE TABLE "finance"."QuickBooksCustomerMap" (
    "id"            TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "crmCustomerId" TEXT NOT NULL,
    "qbCustomerId"  TEXT NOT NULL,

    CONSTRAINT "QuickBooksCustomerMap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuickBooksCustomerMap_companyId_crmCustomerId_key"
    ON "finance"."QuickBooksCustomerMap"("companyId", "crmCustomerId");

-- Add quickbooksId to Invoice
ALTER TABLE "finance"."Invoice"
    ADD COLUMN "quickbooksId" TEXT;

-- Add quickbooksId to Payment
ALTER TABLE "finance"."Payment"
    ADD COLUMN "quickbooksId" TEXT;
