-- Create a storage bucket for menu items
insert into storage.buckets (id, name, public)
values ('menu-items', 'menu-items', true)
on conflict (id) do nothing;

-- Set up security policies for the storage bucket
create policy "Menu images are viewable by everyone"
  on storage.objects for select
  using ( bucket_id = 'menu-items' );

create policy "Menu images are insertable by authenticated users only"
  on storage.objects for insert
  with check (
    bucket_id = 'menu-items'
    and auth.role() = 'authenticated'
  );

create policy "Menu images are updatable by authenticated users only"
  on storage.objects for update
  using (
    bucket_id = 'menu-items'
    and auth.role() = 'authenticated'
  );

create policy "Menu images are deletable by authenticated users only"
  on storage.objects for delete
  using (
    bucket_id = 'menu-items'
    and auth.role() = 'authenticated'
  );
