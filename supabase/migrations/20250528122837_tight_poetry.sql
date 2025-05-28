/*
  # Update policies for staff and profiles tables

  1. Changes
    - Enable RLS on staff table
    - Add policies for staff table management
    - Update policies for profiles table
    - Add verification code policies

  2. Security
    - Enable RLS on staff table
    - Add policies for admin management
    - Add policies for staff self-access
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

-- Update profiles table policies
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
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
    role = 'user' 
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  )
);

CREATE POLICY "Admins can manage users"
ON profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
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