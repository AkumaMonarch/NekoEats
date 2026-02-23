-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create Store Settings Table if it doesn't exist
create table if not exists public.store_settings (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_name text default 'The Burger House',
  is_open boolean default true,
  opening_time text default '09:00',
  closing_time text default '22:00',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add columns if they don't exist (using standard SQL)
alter table public.store_settings add column if not exists business_phone text default '57665303';
alter table public.store_settings add column if not exists logo_url text;

-- Ensure only one row exists
create unique index if not exists one_row_only_uidx on public.store_settings ((true));

-- Enable RLS
alter table public.store_settings enable row level security;

-- Policies (drop and recreate to ensure they are correct)
drop policy if exists "Settings are viewable by everyone" on public.store_settings;
create policy "Settings are viewable by everyone" 
  on public.store_settings for select 
  using (true);

drop policy if exists "Settings are insertable by authenticated users only" on public.store_settings;
create policy "Settings are insertable by authenticated users only" 
  on public.store_settings for insert 
  with check (auth.role() = 'authenticated');

drop policy if exists "Settings are updatable by authenticated users only" on public.store_settings;
create policy "Settings are updatable by authenticated users only" 
  on public.store_settings for update 
  using (auth.role() = 'authenticated');

-- Insert default settings
insert into public.store_settings (restaurant_name, business_phone, is_open, opening_time, closing_time)
values ('The Burger House', '57665303', true, '09:00', '22:00')
on conflict do nothing;

-- Create storage bucket for menu items if it doesn't exist
insert into storage.buckets (id, name, public)
values ('menu-items', 'menu-items', true)
on conflict (id) do nothing;

-- Storage Policies
-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Authenticated Delete" on storage.objects;

-- Allow public access to menu-items bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'menu-items' );

-- Allow authenticated users to upload to menu-items bucket
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'menu-items' and auth.role() = 'authenticated' );

-- Allow authenticated users to update their own uploads
create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'menu-items' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete from menu-items bucket
create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'menu-items' and auth.role() = 'authenticated' );

