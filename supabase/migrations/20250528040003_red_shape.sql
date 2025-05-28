/*
  # Add table permissions

  1. Security Changes
    - Enable RLS on staff table
    - Add RLS policies for staff table
    - Update RLS policies for users table
    - Add policies for admins to manage staff and users
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
CREATE POLICY "Anyone can create verification codes"
  ON verification_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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