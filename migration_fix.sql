-- Run this to allow the migration script to upload recipes
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- AFTER the migration is complete, run this to re-enable security
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
