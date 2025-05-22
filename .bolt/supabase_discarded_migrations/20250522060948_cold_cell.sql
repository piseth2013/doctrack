/*
  # Create document files storage bucket

  1. Storage
    - Create a new storage bucket named 'document-files' for storing document files
    - Enable RLS policies for the bucket to control access

  2. Security
    - Add RLS policies to allow:
      - Authenticated users to read all files
      - Users to upload files to their own documents
      - Users to delete their own document files
      - Admins to manage all files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name)
VALUES ('document-files', 'document-files')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for reading files (all authenticated users can read)
CREATE POLICY "Authenticated users can read all files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'document-files');

-- Policy for uploading files (users can upload to their own documents)
CREATE POLICY "Users can upload files to their documents"
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

-- Policy for deleting files (users can delete their own files)
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-files' AND
  (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    AND documents.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ))
);