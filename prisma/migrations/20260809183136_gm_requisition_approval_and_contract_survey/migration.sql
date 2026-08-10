-- AlterTable
ALTER TABLE "AdminRequisition" ADD COLUMN     "approvedAt" TEXT,
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "siteSurvey" TEXT,
ADD COLUMN     "siteSurveyAt" TEXT,
ADD COLUMN     "siteSurveyBy" TEXT;
