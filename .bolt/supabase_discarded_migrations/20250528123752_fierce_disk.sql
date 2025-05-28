/*
  # Fix infinite recursion in profiles policies

  1. Changes
    - Remove recursive admin check from profile policies
    - Simplify policies to prevent circular dependencies
    - Update policies to use direct role checks instead of recursive queries

  2. Security
    - Maintain RLS protection
    - Keep admin privileges
    - Ensure users can still manage their own profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role access" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Admins can manage profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  (
    role = 'user' OR
    (auth.jwt() ->> 'role')::text = 'admin'
  )
);