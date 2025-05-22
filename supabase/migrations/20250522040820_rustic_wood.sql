/*
  # Create demo admin user

  1. Changes
    - Insert demo admin user into auth.users table
    - Insert corresponding profile into public.profiles table
  
  2. Security
    - Uses secure password hashing
    - Sets up admin role for the demo user
*/

-- First, insert the demo user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo.admin@doctrack.com',
  crypt('Demo123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Then, insert the corresponding profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  department,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'demo.admin@doctrack.com',
  'Demo Admin',
  'admin',
  'Administration',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;