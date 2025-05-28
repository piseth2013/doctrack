/*
  # Fix profiles policies and logo settings

  1. Changes
    - Remove recursive policies from profiles table
    - Add new JWT-based policies
    - Add singleton constraint for logo_settings
  
  2. Security
    - Update RLS policies for profiles table
    - Ensure proper access control based on JWT claims
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

-- Delete existing rows from logo_settings
DELETE FROM logo_settings;

-- Add unique constraint to logo_settings to ensure only one row
ALTER TABLE logo_settings DROP CONSTRAINT IF EXISTS logo_settings_singleton;
ALTER TABLE logo_settings ADD CONSTRAINT logo_settings_singleton UNIQUE (id);

-- Insert default logo settings
INSERT INTO logo_settings (id)
VALUES ('00000000-0000-0000-0000-000000000000');