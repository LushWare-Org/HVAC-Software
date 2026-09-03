CREATE TABLE IF NOT EXISTS "partner_new_caller_booking" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "phone_suffix" TEXT NOT NULL,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_new_caller_booking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "partner_new_caller_booking_company_id_phone_suffix_created_idx"
    ON "partner_new_caller_booking" ("company_id", "phone_suffix", "created_at");
