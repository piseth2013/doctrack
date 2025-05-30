-- Drop foreign key constraints first
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_position_id_fkey;
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_office_id_fkey;

-- Drop the staff table
DROP TABLE IF EXISTS staff;