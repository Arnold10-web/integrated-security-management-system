-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "licenceClass" TEXT,
ADD COLUMN     "licenceExpiryDate" TEXT,
ADD COLUMN     "licenceNumber" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "roleType" TEXT;

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "approvedAt" TEXT,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "sourceRef" TEXT,
ALTER COLUMN "status" SET DEFAULT 'Pending FM Approval';
