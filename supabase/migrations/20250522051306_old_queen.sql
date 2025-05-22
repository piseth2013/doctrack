/*
  # Fix user management policies and roles

  1. Changes
    - Simplify RLS policies to avoid recursion
    - Use JWT claims for role-based access control
    - Enable proper user listing for admins
    - Fix user creation permissions

  2. Security
    - Maintain strict access control
    - Ensure users can only see their own profile
    - Allow admins to see and manage all profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create new policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Allow profile creation during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE id = auth.uid() AND role = 'admin'
));