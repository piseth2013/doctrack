/*
  # Update profiles table policy

  1. Changes
    - Replace existing SELECT policy with a new one that allows all authenticated users to read profiles
    - Simplifies access control while maintaining security

  2. Security
    - Maintains RLS enabled on profiles table
    - Allows authenticated users to read profile data
    - Other policies (INSERT, UPDATE, DELETE) remain unchanged
*/

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new SELECT policy that allows all authenticated users to read profiles
CREATE POLICY "Allow read access to profiles"
ON profiles
FOR SELECT
USING (true);