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
