-- Copy position names from positions table to profiles if position column exists
UPDATE profiles p
SET position = pos.name
FROM positions pos
WHERE pos.id = (
  SELECT s.position_id 
  FROM staff s 
  WHERE s.email = p.email
)
AND p.position IS NULL;

-- Drop foreign key constraints referencing positions table
ALTER TABLE staff
DROP CONSTRAINT IF EXISTS staff_position_id_fkey;

-- Drop positions table since data is now in profiles
DROP TABLE IF EXISTS positions;