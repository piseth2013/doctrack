/*
  # Fix Storage RLS Policies

  1. Changes
    - Enable RLS on storage.buckets
    - Enable RLS on storage.objects
    - Add policies for organization_assets bucket
    - Add policies for document-files bucket
    
  2. Security
    - Allow public read access to organization_assets
    - Allow admin users to manage organization_assets
    - Allow authenticated users to read document-files
    - Allow users to manage their own document files
*/

-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_assets bucket
CREATE POLICY "Public Access organization_assets" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin Access organization_assets" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'organization_assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create policies for document-files bucket
CREATE POLICY "Authenticated users can read document files" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'document-files');

CREATE POLICY "Users can manage their own document files" ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'document-files' AND
  (
    -- User owns the document
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id::text = (storage.foldername(name))[1]
      AND documents.user_id = auth.uid()
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'document-files' AND
  (
    -- User owns the document
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id::text = (storage.foldername(name))[1]
      AND documents.user_id = auth.uid()
    )
    OR
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);