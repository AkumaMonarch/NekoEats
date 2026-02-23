-- Add columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text default 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_option text default 'delivery';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;

-- Update Policies for Orders
DROP POLICY IF EXISTS "Orders are viewable by authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON public.orders;

CREATE POLICY "Orders are viewable by everyone" 
  ON public.orders FOR SELECT 
  USING (true);

-- Update Policies for Order Items
DROP POLICY IF EXISTS "Order items are viewable by authenticated users only" ON public.order_items;
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON public.order_items;

CREATE POLICY "Order items are viewable by everyone" 
  ON public.order_items FOR SELECT 
  USING (true);
