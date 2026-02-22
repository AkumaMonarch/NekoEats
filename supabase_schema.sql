-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Menu Items Table
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  category text not null, -- 'burgers', 'sides', 'drinks', 'desserts'
  popular boolean default false,
  in_stock boolean default true,
  variants jsonb default '[]'::jsonb, -- Array of {id, name, price}
  addons jsonb default '[]'::jsonb -- Array of {id, name, price}
);

-- Create Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_code text not null, -- Short code for kitchen display
  customer_name text not null,
  customer_phone text not null,
  total numeric not null,
  status text default 'pending' not null, -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  payment_method text default 'cash'
);

-- Create Order Items Table (to normalize data, though JSONB in orders is also an option for simple apps)
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete set null, -- Set to null if item is deleted
  name text not null, -- Snapshot of name at time of order
  quantity integer not null,
  price numeric not null, -- Snapshot of price at time of order
  selected_variant jsonb, -- {id, name, price}
  selected_addons jsonb, -- Array of {id, name, price}
  instructions text
);

-- Enable Row Level Security
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Policies for Menu Items
create policy "Menu items are viewable by everyone" 
  on public.menu_items for select 
  using (true);

create policy "Menu items are insertable by authenticated users only" 
  on public.menu_items for insert 
  with check (auth.role() = 'authenticated');

create policy "Menu items are updatable by authenticated users only" 
  on public.menu_items for update 
  using (auth.role() = 'authenticated');

create policy "Menu items are deletable by authenticated users only" 
  on public.menu_items for delete 
  using (auth.role() = 'authenticated');

-- Policies for Orders
-- Anyone can create an order (public checkout)
create policy "Orders are insertable by everyone" 
  on public.orders for insert 
  with check (true);

-- Only authenticated users (admins) can view all orders
create policy "Orders are viewable by authenticated users only" 
  on public.orders for select 
  using (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update orders
create policy "Orders are updatable by authenticated users only" 
  on public.orders for update 
  using (auth.role() = 'authenticated');

-- Policies for Order Items
create policy "Order items are insertable by everyone" 
  on public.order_items for insert 
  with check (true);

create policy "Order items are viewable by authenticated users only" 
  on public.order_items for select 
  using (auth.role() = 'authenticated');

-- Seed Data (Optional - run this if you want initial data)
insert into public.menu_items (name, description, price, image_url, category, popular, in_stock, variants, addons) values
(
  'The Smoky Texas Stack', 
  'Double beef patty, smoked brisket, cheddar, onion rings, BBQ sauce.', 
  16.50, 
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
  'burgers', 
  true, 
  true, 
  '[{"id": "v1", "name": "Single Patty", "price": 14.50}, {"id": "v2", "name": "Double Patty", "price": 16.50}]'::jsonb,
  '[{"id": "a1", "name": "Extra Cheese", "price": 1.50}, {"id": "a2", "name": "Bacon", "price": 2.00}]'::jsonb
),
(
  'Signature Wagyu', 
  'Premium wagyu beef, truffle aioli, arugula, brioche bun.', 
  18.50, 
  'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
  'burgers', 
  true, 
  true, 
  '[]'::jsonb,
  '[{"id": "a1", "name": "Extra Cheese", "price": 1.50}, {"id": "a3", "name": "Fried Egg", "price": 1.50}]'::jsonb
),
(
  'Truffle Parmesan Fries', 
  'Crispy fries tossed in truffle oil and parmesan cheese.', 
  7.50, 
  'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
  'sides', 
  true, 
  true, 
  '[]'::jsonb, 
  '[]'::jsonb
),
(
  'Handcrafted Lemonade', 
  'Freshly squeezed lemons with a hint of mint.', 
  4.50, 
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 
  'drinks', 
  false, 
  true, 
  '[]'::jsonb, 
  '[]'::jsonb
);

-- MIGRATION: If you already created the tables without ON DELETE SET NULL, run this:
-- alter table public.order_items 
-- drop constraint order_items_menu_item_id_fkey,
-- add constraint order_items_menu_item_id_fkey 
--   foreign key (menu_item_id) 
--   references public.menu_items(id) 
--   on delete set null;
