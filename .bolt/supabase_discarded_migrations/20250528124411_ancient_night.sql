/*
  # Fix Profile Policies

  1. Changes
    - Remove recursive policies that cause infinite recursion
    - Simplify profile access policies
    - Add proper user role checks without recursion

  2. Security
    - Maintain secure access control
    - Prevent infinite recursion in policies
    - Ensure proper data access based on user roles
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Allow read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Service role access" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND (
    -- Allow users to update their profile except role field
    (role IS NOT DISTINCT FROM OLD.role) OR
    -- Allow admins to update any profile including role
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
);

CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'role' = 'admin'
  )
);