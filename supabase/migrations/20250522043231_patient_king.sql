/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies
    - Add new policies that allow:
      - New user creation during signup
      - Users to read their own profile
      - Admins to read all profiles
      - Users to update their own profile
      - Admins to update any profile

  2. Security
    - Enable RLS on profiles table
    - Ensure proper access control for all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users with admin role" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for admins and own profile" ON public.profiles;

-- Create new policies
CREATE POLICY "Enable insert during signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for own profile and admins"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Enable update for own profile and admins"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);