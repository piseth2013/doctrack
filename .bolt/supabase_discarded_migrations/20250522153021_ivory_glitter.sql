/*
  # Add storage policies for document files

  1. Storage Policies
    - Create storage bucket for document files if it doesn't exist
    - Enable row level security
    - Add policies for authenticated users to:
      - Upload files
      - Download files
      - Delete files
*/

-- Create bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('document-files', 'document-files', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'document-files' AND
  auth.uid() IS NOT NULL
);

-- Policy to allow authenticated users to download files
CREATE POLICY "Allow authenticated users to download files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'document-files' AND
  auth.uid() IS NOT NULL
);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'document-files' AND
  auth.uid() IS NOT NULL
);