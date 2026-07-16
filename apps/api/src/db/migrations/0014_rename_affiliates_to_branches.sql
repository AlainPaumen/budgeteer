-- Rename affiliates table to branches
ALTER TABLE affiliates RENAME TO branches;

-- Update foreign key references in locations table
-- Note: SQLite doesn't support ALTER TABLE to change foreign key constraints directly
-- The foreign key constraint will need to be recreated via a full table rebuild
-- For now, we'll just rename the column to match the new table name
ALTER TABLE locations RENAME COLUMN affiliate_id TO branch_id;
