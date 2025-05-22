/*
  # Create storage bucket for organization assets

  1. New Storage Bucket
    - Creates a new public storage bucket named 'organization_assets'
    - Enables public access for reading assets
    - Used for storing organization-related files like logos

  2. Security
    - Enables RLS on the bucket
    - Adds policy for authenticated users to read assets
    - Adds policy for admins to upload/delete assets
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true);

-- Enable RLS
CREATE POLICY "Public users can view organization assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

-- Only admins can insert/update/delete files
CREATE POLICY "Only admins can upload organization assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Only admins can update organization assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Only admins can delete organization assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);