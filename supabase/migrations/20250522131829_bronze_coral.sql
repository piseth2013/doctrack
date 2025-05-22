/*
  # Create storage bucket for organization assets

  1. New Storage Bucket
    - Creates a new public storage bucket named 'organization_assets'
    - Enables public access for the bucket
    - Sets up RLS policies for admin-only uploads

  2. Security
    - Enables RLS on the bucket
    - Adds policy for admin users to upload files
    - Adds policy for public access to read files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public access to files in the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

-- Create policy to allow only admins to upload/delete files
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);