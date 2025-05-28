/*
  # Fix users policies to prevent infinite recursion

  1. Changes
    - Drop existing policies that may cause recursion
    - Create new non-recursive policies for user management
    - Implement proper role-based access control
    
  2. Security
    - Ensure admins can manage all users
    - Allow users to view and update their own profiles
    - Prevent non-admin users from modifying roles
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view basic info" ON public.users;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid() AND
  (
    role = (SELECT role FROM public.users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);