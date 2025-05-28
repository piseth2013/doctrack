/*
  # Update service role permissions

  1. Changes
    - Grant service role full access to users table
    - Grant service role full access to staff table
    - Grant service role full access to verification_codes table
    
  2. Security
    - Service role has elevated privileges for admin operations
    - Maintains RLS policies for regular authenticated users
*/

-- Grant service role access to users table
GRANT ALL ON users TO service_role;

-- Grant service role access to staff table
GRANT ALL ON staff TO service_role;

-- Grant service role access to verification_codes table
GRANT ALL ON verification_codes TO service_role;

-- Grant service role access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;