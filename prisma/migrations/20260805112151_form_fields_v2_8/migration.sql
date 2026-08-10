-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" TEXT,
ADD COLUMN     "availability" TEXT,
ADD COLUMN     "certifications" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "employerHistory" TEXT,
ADD COLUMN     "expectedSalary" DOUBLE PRECISION,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "interviewScores" JSONB,
ADD COLUMN     "reasonForLeaving" TEXT,
ADD COLUMN     "yearsExperience" INTEGER;

-- AlterTable
ALTER TABLE "CashierTransaction" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "signatureUrl" TEXT;

-- AlterTable
ALTER TABLE "DisciplinaryAction" ADD COLUMN     "actionTaken" TEXT,
ADD COLUMN     "offence" TEXT,
ADD COLUMN     "offenceCategory" TEXT,
ADD COLUMN     "offenceDate" TEXT,
ADD COLUMN     "offenceTime" TEXT,
ADD COLUMN     "zone" TEXT;

-- AlterTable
ALTER TABLE "Guard" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "closeRelatives" TEXT[],
ADD COLUMN     "fatherAlive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fatherResidence" TEXT,
ADD COLUMN     "lc2Chairperson" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "neighbours" TEXT[],
ADD COLUMN     "placeOfBirth" TEXT,
ADD COLUMN     "surnameAtBirth" TEXT,
ADD COLUMN     "tribe" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "balance" INTEGER,
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "entitlement" INTEGER,
ADD COLUMN     "gmApprovedBy" TEXT,
ADD COLUMN     "resumptionDate" TEXT,
ADD COLUMN     "taken" INTEGER;

-- DropEnum
DROP TYPE "UserRole";
