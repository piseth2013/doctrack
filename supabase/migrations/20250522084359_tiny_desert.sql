/*
  # Create site settings table
  
  1. New Tables
    - `site_settings`
      - `key` (text, primary key)
      - `value` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on site_settings table
    - Add policy for public read access
    - Add policy for admin management
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

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();