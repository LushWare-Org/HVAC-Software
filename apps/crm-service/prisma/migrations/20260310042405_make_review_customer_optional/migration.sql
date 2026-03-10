-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
