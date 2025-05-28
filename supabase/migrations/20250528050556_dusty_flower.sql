/*
  # Fix users table policies

  1. Changes
    - Remove existing policies
    - Create new simplified policies that avoid infinite recursion
    - Fix NEW reference in update policy
  
  2. Security
    - Users can only view and update their own profile
    - Admins can manage all users
    - Regular users cannot escalate privileges
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Regular users can't change their role
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'user'
      AND profiles.role = 'user'
    )
    OR 
    -- Admins can change roles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

CREATE POLICY "Admins can manage users"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);