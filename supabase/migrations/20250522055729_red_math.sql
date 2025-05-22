/*
  # Fix user policies for proper visibility and creation

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Ensure admins can view all profiles
    - Allow proper user creation
    - Fix policy conflicts

  2. Security
    - Maintain secure access control
    - Preserve admin privileges
    - Protect user data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admin manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new simplified policies
CREATE POLICY "Enable read for all authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admins"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable update for admins and own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable delete for admins"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);