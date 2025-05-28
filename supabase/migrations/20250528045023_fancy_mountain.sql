/*
  # Update users table RLS policies

  1. Changes
    - Add policy to allow service role to access users table for admin validation
    - Update existing policies to handle staff-related operations

  2. Security
    - Enable RLS on users table (already enabled)
    - Add policy for service role access
    - Maintain existing user access policies
*/

-- Allow service role to access users table for admin validation
CREATE POLICY "Service role can access all users"
  ON users
  FOR SELECT
  TO service_role
  USING (true);

-- Update the admin management policy to be more specific
DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users"
  ON users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    (role = 'admin'::text) OR 
    (auth.uid() = id) OR
    (EXISTS (
      SELECT 1 FROM users admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'::text
    ))
  )
  WITH CHECK (
    (role = 'admin'::text) OR 
    (auth.uid() = id) OR
    (EXISTS (
      SELECT 1 FROM users admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'admin'::text
    ))
  );