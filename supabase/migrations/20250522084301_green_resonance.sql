/*
  # Fix storage policies for organization assets

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create storage bucket with proper configuration
    - Set up RLS policies with correct permissions
    - Add site_settings table for storing configuration
*/

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site_settings
CREATE POLICY "Public Read Settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

CREATE POLICY "Admin Manage Settings"
ON public.site_settings FOR ALL
TO authenticated
USING (
  (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
);

-- Drop existing policies if they exist
DO $$ 
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Admin Insert Assets" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Admin Update Assets" ON storage.objects');
  EXECUTE format('DROP POLICY IF EXISTS "Admin Delete Assets" ON storage.objects');
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create new policies with proper checks
CREATE POLICY "Public Read Organization Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin Insert Organization Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization_assets' 
  AND (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admin Update Organization Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization_assets'
  AND (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  bucket_id = 'organization_assets'
  AND (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admin Delete Organization Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization_assets'
  AND (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid())
);