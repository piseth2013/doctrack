/*
  # Update table permissions

  1. Security Changes
    - Enable RLS on staff table
    - Add policies for staff table management
    - Update users table policies
    - Update verification codes policies

  2. Changes
    - Staff table: Add admin management and self-read policies
    - Users table: Update read/write permissions
    - Verification codes: Update access policies
*/

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Staff table policies
CREATE POLICY "Admins can manage staff"
  ON staff
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Staff can read their own record"
  ON staff
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Update users table policies
DROP POLICY IF EXISTS "Users can read all users" ON users;

CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    role = 'admin'
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Verification codes policies
DROP POLICY IF EXISTS "Anyone can create verification codes" ON verification_codes;

CREATE POLICY "Anyone can create verification codes"
  ON verification_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read their own verification codes" ON verification_codes;

CREATE POLICY "Users can read their own verification codes"
  ON verification_codes
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM users
      WHERE users.id = auth.uid()
    )
  );