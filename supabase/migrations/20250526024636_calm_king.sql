/*
  # Logo Settings Table

  1. New Tables
    - `logo_settings` - Stores organization logo configuration
      - `id` (uuid, primary key) - Unique identifier
      - `logo_url` (text) - URL of the uploaded logo
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on logo_settings table
    - Allow all authenticated users to read logo settings
    - Only allow admins to update logo settings
*/

-- Create logo_settings table
create table if not exists logo_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table logo_settings enable row level security;

-- Create policies
create policy "Anyone can read logo settings"
  on logo_settings
  for select
  to authenticated
  using (true);

create policy "Only admins can update logo settings"
  on logo_settings
  for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insert initial record
insert into logo_settings (id, logo_url, updated_at)
values (gen_random_uuid(), null, now())
on conflict do nothing;