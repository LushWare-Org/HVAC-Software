-- Trailing 9 digits of the phone / mobile, ignoring all formatting, so that
-- country-code and separator differences still match.
CREATE INDEX IF NOT EXISTS "customers_company_phone_suffix_idx"
  ON crm.customers (
    "companyId",
    RIGHT(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g'), 9)
  );

CREATE INDEX IF NOT EXISTS "customers_company_mobile_suffix_idx"
  ON crm.customers (
    "companyId",
    RIGHT(REGEXP_REPLACE(COALESCE(mobile, ''), '[^0-9]', '', 'g'), 9)
  );

-- Name match for an existing customer calling from an unrecognised number.
CREATE INDEX IF NOT EXISTS "customers_company_normalized_name_idx"
  ON crm.customers (
    "companyId",
    TRIM(REGEXP_REPLACE(LOWER("firstName"), '[^a-z0-9]+', ' ', 'g')),
    TRIM(REGEXP_REPLACE(LOWER("lastName"), '[^a-z0-9]+', ' ', 'g'))
  );

-- Address half of that same match.
CREATE INDEX IF NOT EXISTS "addresses_customer_normalized_line1_idx"
  ON crm.addresses (
    "customerId",
    TRIM(REGEXP_REPLACE(LOWER(COALESCE(line1, '')), '[^a-z0-9]+', ' ', 'g'))
  );
