/*
  # Create logo upload bucket and policies
  
  1. Changes
    - Create public storage bucket for logo uploads
    - Add RLS policies for public access
    
  2. Security
    - Enable public read access
    - Allow authenticated users to upload
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logoUpload', 'logoUpload', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the bucket
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'logoUpload');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logoUpload');

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logoUpload');

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logoUpload');