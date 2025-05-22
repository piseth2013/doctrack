/*
  # Create storage bucket for organization assets

  1. New Storage Bucket
    - Creates a new public storage bucket named 'organization_assets'
    - Enables public access for the bucket
    - Sets up appropriate security policies

  2. Security
    - Enables RLS for the bucket
    - Adds policy for authenticated users to read public assets
    - Adds policy for admins to upload and manage assets
*/

-- Enable storage by creating the extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin Insert Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

CREATE POLICY "Admin Update Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);

CREATE POLICY "Admin Delete Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);