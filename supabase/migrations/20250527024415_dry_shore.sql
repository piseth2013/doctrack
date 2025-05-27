/*
  # Storage setup for logo files

  1. Changes
    - Create storage bucket for logos
    - Set up RLS policies for logo access and management
    
  2. Security
    - Public read access for logo files
    - Admin-only write access for logo files
*/

-- Create bucket for logo files
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid references auth.users,
  public boolean default false,
  avif_autodetection boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create objects table for storing files
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id),
  name text not null,
  owner uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb,
  path_tokens text[] generated always as (string_to_array(name, '/')) stored
);

-- Create the logos bucket
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Set up security policies
create policy "Logo files are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'logos' );

create policy "Only authenticated users can upload logos"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and (auth.jwt() ->> 'role')::text = 'admin'
  );

create policy "Only authenticated users can update logos"
  on storage.objects for update
  with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and (auth.jwt() ->> 'role')::text = 'admin'
  );

create policy "Only authenticated users can delete logos"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and (auth.jwt() ->> 'role')::text = 'admin'
  );