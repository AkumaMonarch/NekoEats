-- Add items column to orders table to store full order details as JSON
-- This makes it easier for n8n to get all details in a single trigger
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;

-- Update existing orders to have empty items array if null (optional)
UPDATE orders SET items = '[]'::jsonb WHERE items IS NULL;
