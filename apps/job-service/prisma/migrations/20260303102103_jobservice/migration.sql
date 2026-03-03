-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'DATE', 'TEXTAREA');

-- CreateEnum
CREATE TYPE "PriceCategory" AS ENUM ('LABOUR', 'PART', 'MATERIAL', 'EQUIPMENT_RENTAL', 'SUBCONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'SCHEDULED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'INVOICED', 'PAID', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "JobPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER', 'GENERAL', 'EQUIPMENT', 'ISSUE');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "job_types" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDurationMins" INTEGER NOT NULL DEFAULT 60,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_template_tasks" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "description" TEXT,
    "taskOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "photoRequired" BOOLEAN NOT NULL DEFAULT false,
    "safetyNote" TEXT,
    "estimatedMins" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_custom_field_defs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTypeId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_custom_field_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_custom_field_values" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fieldDefId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_book_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" "PriceCategory" NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'each',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "jobTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_book_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "serviceAddress" TEXT NOT NULL,
    "serviceCity" TEXT,
    "serviceState" TEXT,
    "serviceZip" TEXT,
    "serviceLatitude" DECIMAL(10,7),
    "serviceLongitude" DECIMAL(10,7),
    "jobTypeId" TEXT,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "JobPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "estimatedDurationMins" INTEGER,
    "travelDistanceKm" DECIMAL(8,2),
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "tags" TEXT[],
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_history" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "fromStatus" "JobStatus",
    "toStatus" "JobStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_photos" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "s3Key" TEXT NOT NULL,
    "caption" TEXT,
    "photoType" "PhotoType" NOT NULL DEFAULT 'GENERAL',
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "technicianName" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledStart" TIMESTAMP(3),
    "scheduledEnd" TIMESTAMP(3),
    "checkinAt" TIMESTAMP(3),
    "checkoutAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "technicianNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_task_completions" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "templateTaskId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "work_order_task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_line_items" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "priceBookItemId" TEXT,
    "description" TEXT NOT NULL,
    "category" "PriceCategory" NOT NULL DEFAULT 'PART',
    "quantity" DECIMAL(8,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_types_companyId_idx" ON "job_types"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "job_types_companyId_slug_key" ON "job_types"("companyId", "slug");

-- CreateIndex
CREATE INDEX "job_templates_companyId_idx" ON "job_templates"("companyId");

-- CreateIndex
CREATE INDEX "job_templates_jobTypeId_idx" ON "job_templates"("jobTypeId");

-- CreateIndex
CREATE INDEX "job_template_tasks_templateId_idx" ON "job_template_tasks"("templateId");

-- CreateIndex
CREATE INDEX "job_custom_field_defs_jobTypeId_idx" ON "job_custom_field_defs"("jobTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "job_custom_field_defs_jobTypeId_fieldKey_key" ON "job_custom_field_defs"("jobTypeId", "fieldKey");

-- CreateIndex
CREATE INDEX "job_custom_field_values_jobId_idx" ON "job_custom_field_values"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_custom_field_values_jobId_fieldDefId_key" ON "job_custom_field_values"("jobId", "fieldDefId");

-- CreateIndex
CREATE INDEX "price_book_items_companyId_idx" ON "price_book_items"("companyId");

-- CreateIndex
CREATE INDEX "price_book_items_companyId_category_idx" ON "price_book_items"("companyId", "category");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");

-- CreateIndex
CREATE INDEX "jobs_companyId_status_idx" ON "jobs"("companyId", "status");

-- CreateIndex
CREATE INDEX "jobs_companyId_assignedToId_idx" ON "jobs"("companyId", "assignedToId");

-- CreateIndex
CREATE INDEX "jobs_companyId_scheduledStart_idx" ON "jobs"("companyId", "scheduledStart");

-- CreateIndex
CREATE INDEX "jobs_customerId_idx" ON "jobs"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_companyId_jobNumber_key" ON "jobs"("companyId", "jobNumber");

-- CreateIndex
CREATE INDEX "job_status_history_jobId_idx" ON "job_status_history"("jobId");

-- CreateIndex
CREATE INDEX "job_photos_jobId_idx" ON "job_photos"("jobId");

-- CreateIndex
CREATE INDEX "work_orders_companyId_idx" ON "work_orders"("companyId");

-- CreateIndex
CREATE INDEX "work_orders_jobId_idx" ON "work_orders"("jobId");

-- CreateIndex
CREATE INDEX "work_orders_technicianId_idx" ON "work_orders"("technicianId");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_companyId_workOrderNumber_key" ON "work_orders"("companyId", "workOrderNumber");

-- CreateIndex
CREATE INDEX "work_order_task_completions_workOrderId_idx" ON "work_order_task_completions"("workOrderId");

-- CreateIndex
CREATE INDEX "work_order_line_items_workOrderId_idx" ON "work_order_line_items"("workOrderId");

-- AddForeignKey
ALTER TABLE "job_templates" ADD CONSTRAINT "job_templates_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_template_tasks" ADD CONSTRAINT "job_template_tasks_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "job_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_custom_field_defs" ADD CONSTRAINT "job_custom_field_defs_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_custom_field_values" ADD CONSTRAINT "job_custom_field_values_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_custom_field_values" ADD CONSTRAINT "job_custom_field_values_fieldDefId_fkey" FOREIGN KEY ("fieldDefId") REFERENCES "job_custom_field_defs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "job_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "job_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_task_completions" ADD CONSTRAINT "work_order_task_completions_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_line_items" ADD CONSTRAINT "work_order_line_items_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_line_items" ADD CONSTRAINT "work_order_line_items_priceBookItemId_fkey" FOREIGN KEY ("priceBookItemId") REFERENCES "price_book_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
