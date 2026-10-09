-- Telegram office alerts (comms schema). Only adds columns; safe to run before or after the code update.
ALTER TABLE "TelegramBot" ADD COLUMN IF NOT EXISTS "officeAlerts" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "TelegramLink" ADD COLUMN IF NOT EXISTS "prefs" JSONB;
