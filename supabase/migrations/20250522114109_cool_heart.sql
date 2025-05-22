/*
  # Fix RLS Policies for Storage and Settings

  1. Storage Bucket Setup
    - Create organization_assets bucket if not exists
    - Enable RLS on the bucket
    - Add policies for admin access

  2. Site Settings
    - Add missing RLS policies for site_settings table
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_assets', 'organization_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Admin users can upload organization assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization_assets'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Anyone can view organization assets" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'organization_assets');

CREATE POLICY "Admin users can update organization assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization_assets'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

CREATE POLICY "Admin users can delete organization assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization_assets'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    ))
  );

-- Fix site_settings RLS policies
DROP POLICY IF EXISTS "Admin Manage Settings" ON public.site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Public Read Settings" ON public.site_settings;

-- Create new policies for site_settings
CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT
  USING (true);