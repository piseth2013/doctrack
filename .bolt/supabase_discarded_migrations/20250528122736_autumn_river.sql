/*
  # Update RLS policies for staff and profiles tables

  1. Changes
    - Enable RLS on staff table
    - Add policies for staff table management
    - Add policies for verification codes

  2. Security
    - Admins can manage all staff records
    - Staff can read their own records
    - Users can create verification codes
    - Users can read their own verification codes
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
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Staff can read their own record"
  ON staff
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

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
      SELECT email FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );