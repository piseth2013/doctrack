/*
  # Update RLS policies for profiles table

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new non-recursive policies for profile management
    
  2. Security
    - Admins can manage all profiles
    - Users can view their own profiles
    - Users can update their own profiles with role change restrictions
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view basic info" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "Admins can manage users"
ON public.profiles
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
)
WITH CHECK (
  id = auth.uid() AND
  (
    CASE WHEN role IS DISTINCT FROM OLD.role 
    THEN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    ELSE true
    END
  )
);