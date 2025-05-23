/*
  # Create logo storage bucket and policies

  1. Storage Setup
    - Create 'logos' storage bucket
    - Enable RLS on the bucket
  
  2. Security
    - Add policy for authenticated users to read logos
    - Add policy for authenticated users to upload logos
*/

-- Create the logos bucket if it doesn't exist
insert into storage.buckets (id, name)
values ('logos', 'logos')
on conflict (id) do nothing;

-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies
create policy "Authenticated users can read logos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'logos');

create policy "Authenticated users can upload logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] = 'logos'
  );