/*
  # Fix recursive RLS policies

  1. Changes
    - Remove recursive policies from profiles table
    - Create new, non-recursive policies for admin and user access
    - Maintain same security model but avoid infinite recursion

  2. Security
    - Maintain row-level security
    - Keep admin privileges
    - Preserve user access to own profile
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles if admin" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile or any profile if admin" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup or by admin" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Allow profile creation during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');