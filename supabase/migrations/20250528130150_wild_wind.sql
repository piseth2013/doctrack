/*
  # Fix profiles RLS policies

  1. Changes
    - Remove recursive role check from profile update policy
    - Simplify policy to only allow users to update their own non-role fields
    - Add separate policy for admin role updates

  2. Security
    - Maintains RLS protection
    - Prevents infinite recursion
    - Ensures proper access control
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy for users to update their own non-role fields
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (uid() = id)
  WITH CHECK (
    uid() = id 
    AND (
      -- Prevent role field from being modified through this policy
      (role IS NOT DISTINCT FROM OLD.role)
    )
  );

-- Create new policy for admins to update any profile including roles
CREATE POLICY "Admins can update all profile fields" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = uid() 
      AND admin_check.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = uid() 
      AND admin_check.role = 'admin'
    )
  );