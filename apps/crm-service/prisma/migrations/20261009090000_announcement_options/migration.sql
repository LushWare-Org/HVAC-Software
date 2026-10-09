-- Announcements: an icon, what the button does (incl. "Connect Telegram"), a bigger style, pinning, and whether customers can dismiss it.
ALTER TABLE "company_announcements" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT 'megaphone';
ALTER TABLE "company_announcements" ADD COLUMN IF NOT EXISTS "ctaAction" TEXT NOT NULL DEFAULT 'link';
ALTER TABLE "company_announcements" ADD COLUMN IF NOT EXISTS "style" TEXT NOT NULL DEFAULT 'card';
ALTER TABLE "company_announcements" ADD COLUMN IF NOT EXISTS "dismissible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "company_announcements" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;
