/*
  # Create logos bucket and security policies

  1. New Storage Bucket
    - Creates a public bucket named 'logos'
    
  2. Security
    - Public read access for logo files
    - Only authenticated admin users can upload/update/delete logos
*/

-- Create the logos bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Set up security policies
create policy "Logo files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Only admin users can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Only admin users can update logos"
  on storage.objects for update
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Only admin users can delete logos"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );