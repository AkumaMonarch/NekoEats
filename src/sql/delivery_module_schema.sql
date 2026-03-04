-- Create riders table if it doesn't exist
CREATE TABLE IF NOT EXISTS riders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'offline', -- available, busy, offline
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create deliveries table if it doesn't exist
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  rider_id UUID REFERENCES riders(id),
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,
  customer_lat DOUBLE PRECISION,
  customer_lng DOUBLE PRECISION,
  customer_address TEXT,
  distance_km DOUBLE PRECISION,
  delivery_fee DOUBLE PRECISION,
  estimated_minutes INTEGER,
  rider_current_lat DOUBLE PRECISION,
  rider_current_lng DOUBLE PRECISION,
  rider_heading DOUBLE PRECISION,
  status TEXT DEFAULT 'assigned', -- assigned, picked_up, delivered, cancelled
  tracking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add google_maps_link column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- Add delivery_fee column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DOUBLE PRECISION;

-- Add delivery_address column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- Add delivery_lat column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION;

-- Add delivery_lng column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION;
