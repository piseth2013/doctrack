/*
  # Fix user roles and permissions

  1. Changes
    - Simplify RLS policies for profiles table
    - Fix role-based access control
    - Ensure proper user creation flow
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON profiles;
DROP POLICY IF EXISTS "Enable delete for admins only" ON profiles;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Users can read their own profile
  auth.uid() = id OR
  -- Admins can read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can create their own profile during signup
  auth.uid() = id OR
  -- Admins can create new users
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update for users based on role"
ON profiles FOR UPDATE
TO authenticated
USING (
  -- Users can update their own profile
  auth.uid() = id OR
  -- Admins can update any profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Same conditions for the new row
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable delete for admins only"
ON profiles FOR DELETE
TO authenticated
USING (
  -- Only admins can delete profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);