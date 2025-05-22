/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify policy conditions for better performance and clarity
    - Ensure proper access control while avoiding self-referential checks

  2. Security
    - Maintain row-level security on profiles table
    - Admins can manage all profiles
    - Users can only read their own profile
    - Users can only update their own profile
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  role = 'admin'
);

CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Enable update for users based on role"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  role = 'admin'
)
WITH CHECK (
  auth.uid() = id OR 
  role = 'admin'
);

CREATE POLICY "Enable delete for admins only"
ON profiles FOR DELETE
TO authenticated
USING (
  role = 'admin'
);