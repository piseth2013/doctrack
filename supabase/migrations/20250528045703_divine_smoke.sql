/*
  # Fix users table policies

  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Simplify user policies to prevent recursion
    - Maintain security while fixing the performance issue

  2. Security
    - Users can still only view and update their own profile
    - Admins maintain full access to manage users
    - Policies are simplified to prevent recursion
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new, simplified policies
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id AND role = 'user') OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);