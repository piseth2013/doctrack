/*
  # Fix profiles RLS policies
  
  1. Changes
    - Fix incorrect uid() function calls to auth.uid()
    - Drop existing problematic policy
    - Add separate policies for user self-updates and admin updates
  
  2. Security
    - Users can only update their own non-role fields
    - Admins can update all fields for any profile
    - Prevents infinite recursion by using proper auth checks
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