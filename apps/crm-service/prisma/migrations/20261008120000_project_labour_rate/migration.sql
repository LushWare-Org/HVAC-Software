-- Blended crew cost per person-hour, so a project's labour shows as cost, not just hours.
ALTER TABLE "projects" ADD COLUMN "labourRatePerHour" DECIMAL(10,2);
