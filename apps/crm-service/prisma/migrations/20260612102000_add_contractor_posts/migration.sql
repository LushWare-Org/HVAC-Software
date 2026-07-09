CREATE TABLE IF NOT EXISTS "crm"."contractor_posts" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "company_id"     TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'TIP',
  "title"          TEXT NOT NULL,
  "body"           TEXT,
  "video_url"      TEXT,
  "hero_image_url" TEXT,
  "is_pinned"      BOOLEAN NOT NULL DEFAULT false,
  "is_published"   BOOLEAN NOT NULL DEFAULT false,
  "published_at"   TIMESTAMPTZ,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "contractor_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contractor_posts_company_id_idx"
  ON "crm"."contractor_posts"("company_id", "is_published");
