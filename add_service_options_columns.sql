-- Add service options columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS is_delivery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_pickup_enabled BOOLEAN DEFAULT true;
