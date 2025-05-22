/*
  # Site Settings and Storage Configuration

  1. New Tables
    - `site_settings` table for storing configuration values
      - `key` (text, primary key)
      - `value` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on site_settings table
    - Public read access to all settings
    - Admin-only access for create/update/delete operations
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

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();