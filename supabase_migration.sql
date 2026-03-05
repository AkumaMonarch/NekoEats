-- Add columns for max delivery distance settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS delivery_max_distance_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_max_distance_km NUMERIC DEFAULT 15;
