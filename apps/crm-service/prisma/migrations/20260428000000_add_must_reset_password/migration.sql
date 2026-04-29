-- Add mustResetPassword flag to company_users
-- Set when admin provisions an account with a temp password.
-- Cleared when the user completes their first-login password reset.

ALTER TABLE crm.company_users
  ADD COLUMN IF NOT EXISTS "mustResetPassword" BOOLEAN NOT NULL DEFAULT FALSE;
