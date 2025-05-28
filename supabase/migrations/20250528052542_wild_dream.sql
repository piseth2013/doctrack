/*
  # Update RLS policies and ensure single logo settings row

  1. Changes
    - Replace recursive policies with non-recursive ones for profiles table
    - Ensure logo_settings table has exactly one row
  
  2. Security
    - Update RLS policies for profiles table to use JWT claims
    - Maintain strict access control for admin operations
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

-- Insert default logo settings if none exist
INSERT INTO logo_settings (id)
VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;