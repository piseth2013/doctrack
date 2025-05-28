/*
  # Logo Settings Table

  1. New Tables
    - `logo_settings` - Stores the organization logo URL and metadata
      - `id` (uuid, primary key)
      - `logo_url` (text, nullable)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `logo_settings` table
    - Add policies for:
      - Anyone can read logo settings
      - Only admins can update logo settings
*/

-- Create logo_settings table
create table if not exists public.logo_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.logo_settings enable row level security;

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
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ))
  with check (exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

-- Insert initial record
insert into public.logo_settings (logo_url)
values (null)
on conflict (id) do nothing;