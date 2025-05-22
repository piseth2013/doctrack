/*
  # Storage Setup

  1. New Storage Bucket
    - Creates a bucket for organization assets
    - Enables RLS on the bucket
    - Sets up policies for admin access

  2. Security
    - Enables RLS
    - Adds policies for admin users to manage assets
    - Adds policies for all users to view assets
*/

-- Create organization_assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for viewing organization assets (public)
CREATE POLICY "Anyone can view organization assets" ON storage.objects
FOR SELECT
USING (bucket_id = 'organization_assets');

-- Policy for managing organization assets (admin only)
CREATE POLICY "Only admins can manage organization assets" ON storage.objects
FOR ALL
USING (
  bucket_id = 'organization_assets' 
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'organization_assets'
  AND EXISTS (
    SELECT 1 FROM auth.users
    JOIN public.profiles ON auth.users.id = profiles.id
    WHERE auth.users.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', false)
ON CONFLICT (id) DO NOTHING;

-- Policy for reading document files (authenticated users)
CREATE POLICY "Authenticated users can read document files" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'document-files');

-- Policy for uploading document files
CREATE POLICY "Users can upload files to their documents" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-files'
  AND EXISTS (
    SELECT 1 FROM public.documents
    WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    AND documents.user_id = auth.uid()
  )
);

-- Policy for deleting document files
CREATE POLICY "Users can delete their own document files" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-files'
  AND (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
      AND documents.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);