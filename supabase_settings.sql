-- Create Store Settings Table
create table public.store_settings (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  restaurant_name text default 'The Burger House',
  is_open boolean default true,
  opening_time text default '09:00',
  closing_time text default '22:00',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure only one row exists
create unique index one_row_only_uidx on public.store_settings ((true));

-- Enable RLS
alter table public.store_settings enable row level security;

-- Policies
create policy "Settings are viewable by everyone" 
  on public.store_settings for select 
  using (true);

create policy "Settings are insertable by authenticated users only" 
  on public.store_settings for insert 
  with check (auth.role() = 'authenticated');

create policy "Settings are updatable by authenticated users only" 
  on public.store_settings for update 
  using (auth.role() = 'authenticated');

-- Insert default settings
insert into public.store_settings (restaurant_name, is_open, opening_time, closing_time)
values ('The Burger House', true, '09:00', '22:00')
on conflict do nothing;
