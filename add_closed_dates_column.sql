-- Add closed_dates column to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS closed_dates JSONB DEFAULT '[]'::jsonb;
