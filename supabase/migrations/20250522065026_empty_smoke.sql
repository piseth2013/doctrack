/*
  # Storage policies for document files

  1. Security
    - Enable policies for authenticated users to:
      - Read all files in document-files bucket
      - Upload files to their own documents
      - Delete their own files (users can delete their files, admins can delete any files)
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "authenticated users can read all files" ON storage.objects;
  DROP POLICY IF EXISTS "users can upload files to their documents" ON storage.objects;
  DROP POLICY IF EXISTS "users can delete their own files" ON storage.objects;
END $$;

-- Create policy to allow authenticated users to read all files
CREATE POLICY "authenticated users can read all files"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'document-files' );

-- Create policy to allow users to upload files to their documents
CREATE POLICY "users can upload files to their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-files' AND
  (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    AND documents.user_id = auth.uid()
  ))
);

-- Create policy to allow users and admins to delete their files
CREATE POLICY "users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-files' AND
  (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    AND (
      documents.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  ))
);