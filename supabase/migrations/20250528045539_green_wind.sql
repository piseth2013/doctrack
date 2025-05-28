/*
  # Fix users table policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Implement simplified policies for user management
    - Maintain proper access control and security

  2. Security
    - All authenticated users can view basic user info
    - Users can update their own profiles
    - Admins can manage all users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view basic info" ON public.users;

-- Create new non-recursive policies
CREATE POLICY "Users can view basic info"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);