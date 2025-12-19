-- Add user profile fields
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "first_name" text,
  ADD COLUMN IF NOT EXISTS "last_name" text,
  ADD COLUMN IF NOT EXISTS "phone" text;

-- Add org/company fields
ALTER TABLE "orgs"
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "address" text,
  ADD COLUMN IF NOT EXISTS "city" text,
  ADD COLUMN IF NOT EXISTS "postal_code" text,
  ADD COLUMN IF NOT EXISTS "registration_number" text,
  ADD COLUMN IF NOT EXISTS "id_number" text,
  ADD COLUMN IF NOT EXISTS "vat_number" text,
  ADD COLUMN IF NOT EXISTS "responsible_name" text,
  ADD COLUMN IF NOT EXISTS "responsible_surname" text;
