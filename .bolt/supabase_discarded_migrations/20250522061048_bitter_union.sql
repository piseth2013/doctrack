/*
  # Create document files storage bucket
  
  1. Storage
    - Creates a new storage bucket named 'document-files' for storing document attachments
    - Sets up RLS policies for secure access control
  
  2. Security
    - Enables RLS on the bucket
    - Adds policies for:
      - Reading: All authenticated users can read files
      - Uploading: Users can only upload to their own documents
      - Deleting: Users can delete their own files, admins can delete any files
*/

-- Create the storage bucket using the storage extension
SELECT storage.create_bucket('document-files');

-- Create policies using storage functions
SELECT storage.create_policy(
  'document-files',
  'authenticated users can read all files',
  'SELECT',
  'authenticated',
  true
);

SELECT storage.create_policy(
  'document-files',
  'users can upload files to their documents',
  'INSERT',
  'authenticated',
  storage.foldername(name) = 'documents' AND
  (EXISTS (
    SELECT 1 FROM documents
    WHERE documents.id::text = (regexp_match(name, '^documents/([^/]+)/.*$'))[1]
    AND documents.user_id = auth.uid()
  ))
);

SELECT storage.create_policy(
  'document-files',
  'users can delete their own files',
  'DELETE',
  'authenticated',
  storage.foldername(name) = 'documents' AND
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