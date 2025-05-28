/*
  # Create logos storage bucket

  1. Storage Setup
    - Creates a public logos bucket
    - Enables row level security
  
  2. Security Policies
    - Public read access for all logo files
    - Only admin users can upload/update/delete logos
    - Uses profiles table to verify admin role
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