/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies using JWT claims
    - Add policy for service role access

  2. Security
    - Policies use JWT claims instead of recursive queries
    - Maintain proper access control for admins and users
    - Enable service role access for system operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new non-recursive policies using JWT claims
CREATE POLICY "Admins can manage users"
ON profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  COALESCE(current_setting('request.jwt.claims', true)::json->>'role', 'user') = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  (
    COALESCE(current_setting('request.jwt.claims', true)::json->>'role', 'user') = 'admin'
    OR role = 'user'
  )
);

CREATE POLICY "Users can view own profile"
ON profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  COALESCE(current_setting('request.jwt.claims', true)::json->>'role', 'user') = 'admin'
);

-- Add service role policy for system operations
CREATE POLICY "Service role access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);