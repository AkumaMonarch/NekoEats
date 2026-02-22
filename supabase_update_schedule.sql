-- Add schedule column to store_settings table
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{
  "monday": {"isOpen": true, "open": "09:00", "close": "22:00"},
  "tuesday": {"isOpen": true, "open": "09:00", "close": "22:00"},
  "wednesday": {"isOpen": true, "open": "09:00", "close": "22:00"},
  "thursday": {"isOpen": true, "open": "09:00", "close": "22:00"},
  "friday": {"isOpen": true, "open": "09:00", "close": "23:00"},
  "saturday": {"isOpen": true, "open": "10:00", "close": "23:00"},
  "sunday": {"isOpen": true, "open": "10:00", "close": "22:00"}
}'::jsonb;
