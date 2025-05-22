/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement new, simplified RLS policies for the profiles table
    - Maintain security while avoiding policy recursion
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Admins can read all profiles
      - Users can read their own profile
      - Admins can insert/update/delete any profile
      - Users can update their own profile
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Enable delete for admins only" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on role" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Admin read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
  OR
  auth.uid() = id
);

CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
);

CREATE POLICY "Admin manage all profiles"
ON profiles
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);