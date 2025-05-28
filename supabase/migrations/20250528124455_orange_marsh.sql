/*
  # Fix profile policies
  
  1. Changes
    - Remove existing policies
    - Add new simplified policies for profiles table
    - Fix OLD reference in update policy
    - Improve admin role checks
  
  2. Security
    - Allow authenticated users to view all profiles
    - Allow users to update their own profile (except role)
    - Allow admins to manage all profiles
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
    role = (SELECT role FROM profiles WHERE id = auth.uid()) OR
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