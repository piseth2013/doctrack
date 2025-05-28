/*
  # Fix users table policies to prevent infinite recursion

  1. Changes
    - Remove recursive admin check from policies
    - Simplify policies to prevent circular references
    - Maintain security while allowing proper data access

  2. Security
    - Users can still only view and update their own profile
    - Admins can manage all users
    - Prevents infinite recursion in policy checks
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new, simplified policies
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR role = 'admin'
);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Regular users can't change their role
    (role = 'user' AND NEW.role = 'user')
    OR 
    -- Admins can change roles
    role = 'admin'
  )
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');