/*
  # Fix staff and verification code policies

  1. Changes
    - Update staff policies to reference profiles table instead of users
    - Update verification code policies to reference profiles table
  
  2. Security
    - Enable RLS on staff table
    - Add policies for staff management and access
    - Add policies for verification codes
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