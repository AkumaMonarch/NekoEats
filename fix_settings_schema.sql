-- Ensure store_settings table exists
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  restaurant_name TEXT DEFAULT 'The Burger House',
  business_phone TEXT DEFAULT '57665303',
  address TEXT,
  google_maps_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_open BOOLEAN DEFAULT true,
  opening_time TEXT DEFAULT '09:00',
  closing_time TEXT DEFAULT '22:00',
  schedule JSONB DEFAULT '{
    "monday": {"isOpen": true, "open": "09:00", "close": "22:00"},
    "tuesday": {"isOpen": true, "open": "09:00", "close": "22:00"},
    "wednesday": {"isOpen": true, "open": "09:00", "close": "22:00"},
    "thursday": {"isOpen": true, "open": "09:00", "close": "22:00"},
    "friday": {"isOpen": true, "open": "09:00", "close": "23:00"},
    "saturday": {"isOpen": true, "open": "10:00", "close": "23:00"},
    "sunday": {"isOpen": true, "open": "10:00", "close": "22:00"}
  }'::jsonb,
  closed_dates JSONB DEFAULT '[]'::jsonb,
  is_delivery_enabled BOOLEAN DEFAULT true,
  is_pickup_enabled BOOLEAN DEFAULT true,
  delivery_base_fee DECIMAL(10, 2) DEFAULT 0,
  delivery_per_km_fee DECIMAL(10, 2) DEFAULT 0,
  vat_enabled BOOLEAN DEFAULT false,
  vat_percentage DECIMAL(5, 2) DEFAULT 0,
  logo_url TEXT,
  webhook_url TEXT
);

-- Ensure columns exist (idempotent)
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS delivery_base_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS delivery_per_km_fee DECIMAL(10, 2) DEFAULT 0;

-- Ensure at least one row exists
INSERT INTO public.store_settings (restaurant_name)
SELECT 'The Burger House'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- Ensure unique index
CREATE UNIQUE INDEX IF NOT EXISTS one_row_only_uidx ON public.store_settings ((true));
