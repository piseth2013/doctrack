/*
  # Add storage policies for document files
  
  1. Changes
    - Create document-files storage bucket
    - Add storage policies for authenticated users to:
      - Upload files
      - Download files
      - Delete files
  
  2. Security
    - Enable RLS on storage objects
    - Policies restricted to authenticated users
*/

-- Create the storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);

-- Create document-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_accessed_at timestamptz DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to download files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'document-files' AND
    auth.role() = 'authenticated'
);