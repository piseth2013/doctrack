/*
  # Fix infinite recursion and logo settings

  1. Changes
    - Fix infinite recursion in profiles policies by removing self-referential checks
    - Add unique constraint to logo_settings to ensure only one row exists
    - Add initial logo settings row if none exists

  2. Security
    - Update RLS policies for profiles table
    - Maintain existing security model while preventing recursion
*/

-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage users"
ON profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  (
    role = 'user' OR
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  )
);

CREATE POLICY "Users can view own profile"
ON profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
);

-- Add unique constraint to logo_settings to ensure only one row
ALTER TABLE logo_settings ADD CONSTRAINT logo_settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Insert default logo settings if none exist
INSERT INTO logo_settings (id)
VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;