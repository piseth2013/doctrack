/*
  # Create logos storage bucket

  Creates a new storage bucket for system logos with appropriate security policies.

  1. Storage
    - Creates 'logos' bucket for storing system logos
    - Enables public access for logo files
    - Sets up RLS policies for upload/delete operations
*/

-- Create the logos bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Set up security policies
create policy "Logo files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Only admin users can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
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
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );