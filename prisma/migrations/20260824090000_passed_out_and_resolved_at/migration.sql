-- AlterTable
ALTER TABLE "SecurityOfficer" ADD COLUMN     "passedOutDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "resolvedAt" TIMESTAMP(3);
