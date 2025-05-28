/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Add simplified policies for:
      - Users can read their own profile
      - Admins can read all users
      - Admins can manage users
    - Keep existing constraints and structure

  2. Security
    - Maintain RLS enabled
    - Ensure proper access control
    - Prevent unauthorized access
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new, non-recursive policies
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);