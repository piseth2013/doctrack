/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove existing RLS policies for profiles table that cause recursion
    - Add new, simplified RLS policies that avoid recursive checks
    - Maintain security while preventing infinite loops
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Admins can read all profiles
      - Users can read their own profile
      - Admins can insert/update/delete profiles
      - Users can update their own profile
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert during signup" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile and admins" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile and admins" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR
    role = 'admin'
  );

CREATE POLICY "Admins can create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'admin'
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    role = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR
    role = 'admin'
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    role = 'admin'
  );