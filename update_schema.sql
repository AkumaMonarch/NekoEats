-- Add webhook_url column to store_settings table
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS webhook_url text;

-- Ensure other columns exist as well, just in case
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS business_phone text;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_url text;
