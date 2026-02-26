-- Add VAT columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS vat_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vat_percentage DECIMAL(5,2) DEFAULT 0;

-- Add vat_amount column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(10,2) DEFAULT 0;
