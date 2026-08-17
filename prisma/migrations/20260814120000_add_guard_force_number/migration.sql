-- AlterTable
ALTER TABLE "Guard" ADD COLUMN "forceNumber" TEXT;

-- Backfill: the force number is the canonical unique identifier for guards and all staff.
-- Existing guard rows stored the force number in guardCode; copy it across so forceNumber is populated.
UPDATE "Guard" SET "forceNumber" = "guardCode" WHERE "forceNumber" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Guard_forceNumber_key" ON "Guard"("forceNumber");
