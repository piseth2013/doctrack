/*
  # Add verification codes table and functionality

  1. New Tables
    - verification_codes
      - id (uuid, primary key)
      - email (text)
      - code (text)
      - expires_at (timestamptz)
      - created_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for verification code management
    - Add cleanup trigger for expired codes
*/

-- Drop existing objects if they exist
drop trigger if exists cleanup_expired_verification_codes on verification_codes;
drop function if exists cleanup_expired_codes();
drop policy if exists "Anyone can create verification codes" on verification_codes;
drop policy if exists "Users can read their own verification codes" on verification_codes;
drop table if exists verification_codes;

-- Create verification_codes table
create table public.verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.verification_codes enable row level security;

-- Create policies
create policy "Anyone can create verification codes"
  on verification_codes
  for insert
  to authenticated
  with check (true);

create policy "Users can read their own verification codes"
  on verification_codes
  for select
  to authenticated
  using (
    email = current_setting('request.jwt.claims')::json->>'email'
  );

-- Create cleanup function
create or replace function cleanup_expired_codes()
returns trigger as $$
begin
  delete from verification_codes
  where expires_at < now();
  return null;
end;
$$ language plpgsql;

-- Create cleanup trigger
create trigger cleanup_expired_verification_codes
  after insert on verification_codes
  execute function cleanup_expired_codes();