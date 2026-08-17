-- Drop the legacy `guardCode` identifier everywhere and make `forceNumber` the
-- sole unique identifier for guards (canonical force/PSG number).
-- The denormalized snapshot columns on related tables are renamed (data preserved).

-- Guard: drop legacy column + its indexes; forceNumber becomes required.
DROP INDEX "Guard_guardCode_key";
DROP INDEX "Guard_guardCode_idx";
ALTER TABLE "Guard" DROP COLUMN "guardCode";
ALTER TABLE "Guard" ALTER COLUMN "forceNumber" SET NOT NULL;
ALTER TABLE "Guard" ALTER COLUMN "forceNumber" SET NOT NULL;

-- Denormalized snapshot columns on related tables: rename (data preserved).
ALTER TABLE "CashierTransaction" RENAME COLUMN "guardCode" TO "forceNumber";
ALTER TABLE "DisciplinaryAction" RENAME COLUMN "guardCode" TO "forceNumber";
ALTER TABLE "LeaveRequest" RENAME COLUMN "guardCode" TO "forceNumber";
ALTER TABLE "PerformanceReview" RENAME COLUMN "guardCode" TO "forceNumber";
