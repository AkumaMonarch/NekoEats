-- Add google_maps_link column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
