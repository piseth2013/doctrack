/*
  # Storage bucket and policies for organization assets

  1. Storage Configuration
    - Creates organization_assets bucket for storing organization files
    - Sets bucket as public for read access
  
  2. Security Policies
    - Allows public read access to all files
    - Enables admin users to manage files (insert, update, delete)
    - Enforces proper RLS policies for file management
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

-- Allow authenticated admin users to upload files
CREATE POLICY "Admin Insert Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' AND
  (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Allow authenticated admin users to update files
CREATE POLICY "Admin Update Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'organization_assets' AND
  (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Allow authenticated admin users to delete files
CREATE POLICY "Admin Delete Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  )
);