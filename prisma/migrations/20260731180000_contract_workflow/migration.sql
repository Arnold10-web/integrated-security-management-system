-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "approvalStep" TEXT,
ADD COLUMN     "approvedAt" TEXT,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "issuedBy" TEXT,
ADD COLUMN     "preparedBy" TEXT,
ADD COLUMN     "relatedGuardCode" TEXT,
ADD COLUMN     "relatedSiteName" TEXT,
ADD COLUMN     "voidReason" TEXT;

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

