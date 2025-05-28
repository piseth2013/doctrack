/*
  # Fix profiles RLS policies
  
  1. Changes
    - Drop existing problematic policy
    - Create new policies for profile updates
    - Fix OLD table reference in policy using proper syntax
  
  2. Security
    - Maintain role-based access control
    - Prevent non-admin users from modifying roles
    - Allow admins full access to all profiles
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policy for users to update their own non-role fields
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- Prevent role field from being modified through this policy
      role = (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- Create new policy for admins to update any profile including roles
CREATE POLICY "Admins can update all profile fields" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.role = 'admin'
    )
  );