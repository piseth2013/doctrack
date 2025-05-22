/*
  # Storage bucket and RLS policies

  1. Changes
    - Create document-files storage bucket
    - Create organization_assets storage bucket
    - Set up RLS policies for both buckets
    
  2. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users to:
      - Read all files
      - Upload files to their documents
      - Delete their own files
      - Allow admins to manage organization assets
*/

-- Create the storage buckets
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('document-files', 'document-files', false),
    ('organization_assets', 'organization_assets', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create policies for document-files bucket
DO $$
BEGIN
  -- Policy for reading files (all authenticated users can read)
  DROP POLICY IF EXISTS "Authenticated users can read all files" ON storage.objects;
  CREATE POLICY "Authenticated users can read all files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'document-files');

  -- Policy for uploading files (users can upload to their own documents)
  DROP POLICY IF EXISTS "Users can upload files to their documents" ON storage.objects;
  CREATE POLICY "Users can upload files to their documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'document-files' AND
    (EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
      AND documents.user_id = auth.uid()
    ))
  );

  -- Policy for deleting files (users can delete their own files)
  DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
  CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'document-files' AND
    (EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
      AND documents.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

  -- Policies for organization_assets bucket
  DROP POLICY IF EXISTS "Public can view organization assets" ON storage.objects;
  CREATE POLICY "Public can view organization assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'organization_assets');

  DROP POLICY IF EXISTS "Only admins can manage organization assets" ON storage.objects;
  CREATE POLICY "Only admins can manage organization assets"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'organization_assets' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
END $$;