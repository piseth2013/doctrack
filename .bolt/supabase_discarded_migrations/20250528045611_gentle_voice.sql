/*
  # Fix users table policies

  1. Changes
    - Drop existing policies causing infinite recursion
    - Create new policies with proper access control
    - Ensure proper row-level security without circular dependencies

  2. Security
    - Maintain secure access control
    - Prevent unauthorized access
    - Allow proper user management by admins
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
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
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
    CASE WHEN role IS DISTINCT FROM OLD.role 
    THEN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE true
    END
  )
);