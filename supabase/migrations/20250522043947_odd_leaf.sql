/*
  # Update profiles RLS policies

  1. Changes
    - Modify INSERT policy to allow profile creation during signup
    - Keep existing admin-only policy for manual profile creation
  
  2. Security
    - Ensures profiles can only be created:
      a) During signup (auth.uid() matches the profile id)
      b) By admin users
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Admins can create profiles" ON profiles;

-- Create new INSERT policy that allows both signup and admin creation
CREATE POLICY "Allow profile creation during signup or by admin" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Allow if the user is creating their own profile during signup
    (auth.uid() = id) OR
    -- OR if the user is an admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );