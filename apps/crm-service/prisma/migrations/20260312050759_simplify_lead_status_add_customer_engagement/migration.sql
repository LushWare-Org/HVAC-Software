/*
  Warnings:

  - The values [PROPOSAL_SENT] on the enum `LeadStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "CustomerEngagementStatus" AS ENUM ('ACTIVE', 'QUOTE_SENT', 'INVOICE_SENT', 'JOB_BOOKED', 'COMPLETED', 'INACTIVE');

-- AlterEnum
BEGIN;
CREATE TYPE "LeadStatus_new" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST');
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE "LeadStatus_new" USING ("status"::text::"LeadStatus_new");
ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";
DROP TYPE "LeadStatus_old";
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "engagementStatus" "CustomerEngagementStatus" NOT NULL DEFAULT 'ACTIVE';
