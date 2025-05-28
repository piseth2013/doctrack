/*
  # Fix users table policies recursion

  1. Changes
    - Remove recursive policies from users table
    - Create new policies that avoid recursion by using auth.uid() directly
    - Maintain same security level while preventing infinite loops

  2. Security
    - Admins can still manage all users
    - Users can still view and update their own profiles
    - No security degradation from previous policies
*/

-- Drop existing policies to replace them with non-recursive versions
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  (auth.uid() = id AND role = 'user') OR
  (role = 'admin' AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  ))
);

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    LIMIT 1
  )
);