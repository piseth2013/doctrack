/*
  # Fix profiles policies for admin access

  Updates the profiles table policies to:
  1. Allow admins to view all users
  2. Maintain user self-access restrictions
  3. Ensure proper admin management capabilities
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Service role access" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policies
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
  OR (auth.uid() = id)
);

CREATE POLICY "Admins can manage users"
ON profiles
FOR ALL 
TO authenticated
USING (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (role = 'user' OR current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
);

-- Re-add service role access policy
CREATE POLICY "Service role access"
ON profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);