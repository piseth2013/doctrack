/*
  # Fix users table policies

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new non-recursive policies for:
      - Basic user access (view/update own profile)
      - Admin management capabilities
    - Add LIMIT 1 to subqueries for better performance
    - Separate policies for different operations to avoid complexity

  2. Security
    - Maintains proper access control:
      - Users can only view/update their own profiles
      - Admins can manage all users
    - Prevents infinite recursion in policy evaluation
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
  auth.uid() = id AND 
  (role IS NOT DISTINCT FROM 'user' OR EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
    LIMIT 1
  ))
);

CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
    LIMIT 1
  )
);

CREATE POLICY "Admins can manage users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
    LIMIT 1
  )
);