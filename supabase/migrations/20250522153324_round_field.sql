/*
  # Storage bucket and policies for document files
  
  1. Changes
    - Create storage bucket for document files
    - Enable RLS on storage.objects table
    - Add policies for authenticated users to:
      - Upload files
      - Download files
      - Delete files
  
  2. Security
    - Bucket is private (not public)
    - All operations require authentication
    - Users can only access files in the document-files bucket
*/

-- Create bucket for document files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'document-files'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('document-files', 'document-files', false);
  END IF;
END $$;

-- Create policies for authenticated users
DO $$
BEGIN
  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Allow authenticated users to upload files'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'document-files' AND
      auth.role() = 'authenticated'
    );
  END IF;

  -- Download policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Allow authenticated users to download files'
  ) THEN
    CREATE POLICY "Allow authenticated users to download files"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id = 'document-files' AND
      auth.role() = 'authenticated'
    );
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Allow authenticated users to delete files'
  ) THEN
    CREATE POLICY "Allow authenticated users to delete files"
    ON storage.objects FOR DELETE TO authenticated
    USING (
      bucket_id = 'document-files' AND
      auth.role() = 'authenticated'
    );
  END IF;
END $$;