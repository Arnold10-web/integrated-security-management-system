-- Rename field rank "Zone Inspector" -> "Inspector"
-- Inspectors supervise zones; the zone attribute on the Guard record is unchanged.
UPDATE "Guard" SET "designation" = 'Inspector' WHERE "designation" = 'Zone Inspector';
