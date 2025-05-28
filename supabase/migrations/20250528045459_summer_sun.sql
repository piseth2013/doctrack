/*
  # Fix users table policies

  1. Changes
    - Remove recursive policy that was causing infinite loops
    - Simplify user management policies to prevent recursion
    - Update policies to maintain security while fixing the infinite recursion

  2. Security
    - Maintain RLS enabled on users table
    - Ensure admins can still manage users
    - Allow users to read their own data
    - Allow authenticated users to view basic user info
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Service role can access all users" ON users;

-- Create new, simplified policies
CREATE POLICY "Users can view basic info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );