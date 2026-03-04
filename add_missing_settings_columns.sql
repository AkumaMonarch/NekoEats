-- Add missing columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS delivery_base_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_per_km_fee DECIMAL(10, 2) DEFAULT 0;
