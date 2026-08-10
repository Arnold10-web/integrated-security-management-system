-- AlterTable
ALTER TABLE "ClientSite" ADD COLUMN     "dayShiftArmed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nightShiftArmed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Guard" ADD COLUMN     "zone" TEXT;
