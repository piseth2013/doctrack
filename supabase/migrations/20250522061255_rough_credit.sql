/*
  # Storage bucket and policies setup
  
  1. Changes
    - Create storage bucket for document files
    - Add policies for file access control:
      - Read access for authenticated users
      - Upload access for document owners
      - Delete access for document owners and admins
  
  2. Security
    - All operations require authentication
    - Users can only upload to their own documents
    - Only document owners and admins can delete files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', false)
ON CONFLICT (id) DO NOTHING;

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