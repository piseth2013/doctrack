/*
  # Fix storage policies for organization assets

  1. Storage Policies
    - Creates organization_assets bucket if not exists
    - Enables RLS on storage.objects
    - Sets up proper policies for public read and admin management
    
  2. Changes
    - Drops existing policies to avoid conflicts
    - Creates new policies with proper role checks
    - Ensures admin users can manage assets
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname IN (
      'Public Read Organization Assets',
      'Admin Insert Organization Assets',
      'Admin Update Organization Assets',
      'Admin Delete Organization Assets'
    )
  ) THEN
    DROP POLICY IF EXISTS "Public Read Organization Assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Insert Organization Assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Organization Assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Organization Assets" ON storage.objects;
  END IF;
END $$;

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies with proper checks
CREATE POLICY "Public Read Organization Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin Insert Organization Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin Update Organization Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin Delete Organization Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON profiles.id = auth.users.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
);