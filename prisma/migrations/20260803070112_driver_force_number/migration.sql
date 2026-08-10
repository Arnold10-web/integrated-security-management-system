-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "forceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_forceNumber_key" ON "Driver"("forceNumber");
