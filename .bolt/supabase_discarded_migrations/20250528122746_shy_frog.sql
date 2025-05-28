/*
  # Simplify RLS policies for profiles table

  1. Changes
    - Drop existing policies to recreate them
    - Create simplified policies for profile management
    
  2. Security
    - Users can only view and update their own profiles
    - Regular users cannot change their role
    - Admins have full management capabilities
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage users" ON profiles;
DROP POLICY IF EXISTS "Admins can view all users" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR role = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Regular users can't change their role
    (role = 'user' AND NEW.role = 'user')
    OR 
    -- Admins can change roles
    role = 'admin'
  )
);

CREATE POLICY "Admins can manage users"
ON profiles
FOR ALL
TO authenticated
USING (role = 'admin')
WITH CHECK (role = 'admin');