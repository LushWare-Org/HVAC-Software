-- An expense can belong to a project directly (site rent, bulk materials), not only through a job.
ALTER TABLE "finance"."Expense" ADD COLUMN "projectId" TEXT;
CREATE INDEX "Expense_companyId_projectId_idx" ON "finance"."Expense"("companyId", "projectId");
