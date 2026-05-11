-- Add Job.estimatedValue (forecast dollars; invoice remains authoritative once billed)
ALTER TABLE "jobs"."jobs" ADD COLUMN "estimatedValue" DECIMAL(10,2);
