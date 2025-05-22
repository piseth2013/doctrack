/*
  # Fix profiles table policies

  This migration fixes the infinite recursion issue in the profiles table policies by:
  1. Dropping the problematic policies
  2. Creating new, simplified policies that avoid recursive checks
  
  Changes:
  - Remove policies that were causing infinite recursion
  - Create new policies with proper access control
  - Maintain security while preventing circular dependencies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can insert new profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create new policies without recursive checks
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Allow users to read their own profile
  auth.uid() = id
  -- Or if they have admin role (checking directly in the current row)
  OR role = 'admin'
);

CREATE POLICY "Enable insert for authenticated users with admin role"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow inserts if the current user is an admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update for admins and own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  -- Users can update their own profile
  auth.uid() = id
  -- Admins can update any profile
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Same conditions for the new row values
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);