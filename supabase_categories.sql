-- Create Categories Table
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  slug text not null unique,
  image_url text,
  display_order integer default 0
);

-- Enable RLS
alter table public.categories enable row level security;

-- Policies
create policy "Categories are viewable by everyone" 
  on public.categories for select 
  using (true);

create policy "Categories are insertable by authenticated users only" 
  on public.categories for insert 
  with check (auth.role() = 'authenticated');

create policy "Categories are updatable by authenticated users only" 
  on public.categories for update 
  using (auth.role() = 'authenticated');

create policy "Categories are deletable by authenticated users only" 
  on public.categories for delete 
  using (auth.role() = 'authenticated');

-- Insert default categories
insert into public.categories (name, slug, image_url, display_order) values
('Signature Burgers', 'burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1),
('Loaded Sides', 'sides', 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 2),
('Shakes & Desserts', 'desserts', 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 3),
('Drinks & More', 'drinks', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 4)
on conflict (slug) do nothing;
