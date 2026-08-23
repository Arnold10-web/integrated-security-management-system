/*
  Warnings:

  - You are about to drop the column `issuedToGuardCode` on the `AdminRequisition` table. All the data in the column will be lost.
  - You are about to drop the column `issuedToGuardId` on the `AdminRequisition` table. All the data in the column will be lost.
  - You are about to drop the column `issuedToGuardName` on the `AdminRequisition` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToGuardId` on the `ArmouryItem` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToGuardName` on the `ArmouryItem` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `ArmouryLog` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `ArmouryLog` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `CashierTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `CashierTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `armedGuardsRequired` on the `ClientSite` table. All the data in the column will be lost.
  - You are about to drop the column `dayShiftGuards` on the `ClientSite` table. All the data in the column will be lost.
  - You are about to drop the column `nightShiftGuards` on the `ClientSite` table. All the data in the column will be lost.
  - You are about to drop the column `documentHash` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedPdfPath` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `templateBody` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `assignedGuardIds` on the `DeploymentOrder` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `DisciplinaryAction` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `DisciplinaryAction` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `DutyRoster` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `DutyRoster` table. All the data in the column will be lost.
  - You are about to drop the column `reportedByGuard` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reliefGuardName` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `guardOnDuty` on the `PatrolInspectionLog` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `PerformanceReview` table. All the data in the column will be lost.
  - You are about to drop the column `activeGuardsCount` on the `RegionalOffice` table. All the data in the column will be lost.
  - You are about to drop the column `guardId` on the `SiteDeployment` table. All the data in the column will be lost.
  - You are about to drop the column `guardName` on the `SiteDeployment` table. All the data in the column will be lost.
  - You are about to drop the column `dayGuardsNeeded` on the `SiteSurvey` table. All the data in the column will be lost.
  - You are about to drop the column `nightGuardsNeeded` on the `SiteSurvey` table. All the data in the column will be lost.
  - You are about to drop the `ContractEsignAudit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContractSigner` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContractTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Guard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GuardBiodata` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `forceNumber` to the `ArmouryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `ArmouryLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `CashierTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `DisciplinaryAction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forceNumber` to the `DutyRoster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `DutyRoster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reportedBySecurityOfficer` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `LeaveRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerOnDuty` to the `PatrolInspectionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `PerformanceReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forceNumber` to the `SiteDeployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `securityOfficerName` to the `SiteDeployment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SecurityOfficerLifecycleStage" AS ENUM ('ENROLLED', 'HANDED_TO_OPERATIONS', 'IN_TRAINING', 'PASSED_OUT', 'DEPLOYED');

-- CreateEnum
CREATE TYPE "SecurityOfficerStatus" AS ENUM ('On Duty', 'Off Duty', 'On Leave', 'Suspended', 'Deserted', 'Archived');

-- CreateEnum
CREATE TYPE "SecurityOfficerDesignation" AS ENUM ('Security Officer', 'K9 Handler', 'Armorer', 'Site In-Charge', 'Inspector');

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_templateId_fkey";

-- DropForeignKey
ALTER TABLE "ContractEsignAudit" DROP CONSTRAINT "ContractEsignAudit_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ContractSigner" DROP CONSTRAINT "ContractSigner_contractId_fkey";

-- DropForeignKey
ALTER TABLE "GuardBiodata" DROP CONSTRAINT "GuardBiodata_guardId_fkey";

-- DropIndex
DROP INDEX "ArmouryItem_assignedToGuardId_idx";

-- DropIndex
DROP INDEX "ArmouryLog_guardId_idx";

-- DropIndex
DROP INDEX "Contract_templateId_idx";

-- DropIndex
DROP INDEX "DutyRoster_guardId_idx";

-- DropIndex
DROP INDEX "PdfContractTemplate_id_key";

-- AlterTable
ALTER TABLE "AdminRequisition" DROP COLUMN "issuedToGuardCode",
DROP COLUMN "issuedToGuardId",
DROP COLUMN "issuedToGuardName",
ADD COLUMN     "issuedToForceNumber" TEXT,
ADD COLUMN     "issuedToSecurityOfficerName" TEXT;

-- AlterTable
ALTER TABLE "ArmouryItem" DROP COLUMN "assignedToGuardId",
DROP COLUMN "assignedToGuardName",
ADD COLUMN     "assignedToForceNumber" TEXT,
ADD COLUMN     "assignedToSecurityOfficerName" TEXT;

-- AlterTable
ALTER TABLE "ArmouryLog" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "forceNumber" TEXT NOT NULL,
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CashierTransaction" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClientSite" DROP COLUMN "armedGuardsRequired",
DROP COLUMN "dayShiftGuards",
DROP COLUMN "nightShiftGuards",
ADD COLUMN     "armedSecurityOfficersRequired" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dayShiftSecurityOfficers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nightShiftSecurityOfficers" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "documentHash",
DROP COLUMN "finalizedPdfPath",
DROP COLUMN "templateBody",
DROP COLUMN "templateId";

-- AlterTable
ALTER TABLE "DeploymentOrder" DROP COLUMN "assignedGuardIds",
ADD COLUMN     "assignedSecurityOfficerForceNumbers" TEXT[];

-- AlterTable
ALTER TABLE "DigitalContract" ALTER COLUMN "contractType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DisciplinaryAction" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DutyRoster" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "forceNumber" TEXT NOT NULL,
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "reportedByGuard",
ADD COLUMN     "reportedBySecurityOfficer" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "guardId",
DROP COLUMN "guardName",
DROP COLUMN "reliefGuardName",
ADD COLUMN     "reliefSecurityOfficerName" TEXT,
ADD COLUMN     "securityOfficerName" TEXT NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'security_officer';

-- AlterTable
ALTER TABLE "PatrolInspectionLog" DROP COLUMN "guardOnDuty",
ADD COLUMN     "securityOfficerOnDuty" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PerformanceReview" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RegionalOffice" DROP COLUMN "activeGuardsCount",
ADD COLUMN     "activeSecurityOfficersCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SiteDeployment" DROP COLUMN "guardId",
DROP COLUMN "guardName",
ADD COLUMN     "forceNumber" TEXT NOT NULL,
ADD COLUMN     "securityOfficerName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SiteSurvey" DROP COLUMN "dayGuardsNeeded",
DROP COLUMN "nightGuardsNeeded",
ADD COLUMN     "daySecurityOfficersNeeded" INTEGER,
ADD COLUMN     "nightSecurityOfficersNeeded" INTEGER;

-- DropTable
DROP TABLE "ContractEsignAudit";

-- DropTable
DROP TABLE "ContractSigner";

-- DropTable
DROP TABLE "ContractTemplate";

-- DropTable
DROP TABLE "Guard";

-- DropTable
DROP TABLE "GuardBiodata";

-- DropEnum
DROP TYPE "GuardDesignation";

-- DropEnum
DROP TYPE "GuardLifecycleStage";

-- DropEnum
DROP TYPE "GuardStatus";

-- CreateTable
CREATE TABLE "SecurityOfficer" (
    "id" TEXT NOT NULL,
    "forceNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "signatureUrl" TEXT,
    "designation" "SecurityOfficerDesignation" NOT NULL DEFAULT 'Security Officer',
    "monthlySalaryUgx" INTEGER NOT NULL DEFAULT 180000,
    "phone" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "tin" TEXT,
    "nssfNo" TEXT,
    "assignedSite" TEXT NOT NULL,
    "location" TEXT,
    "bankAccount" TEXT,
    "bankName" TEXT,
    "finishedProbation" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Off Duty',
    "lifecycleStage" "SecurityOfficerLifecycleStage" NOT NULL DEFAULT 'ENROLLED',
    "isDeserter" BOOLEAN NOT NULL DEFAULT false,
    "desertionDate" TIMESTAMP(3),
    "desertionNotes" TEXT,
    "medicalCleared" BOOLEAN NOT NULL DEFAULT false,
    "armedQualified" BOOLEAN NOT NULL DEFAULT false,
    "k9Qualified" BOOLEAN NOT NULL DEFAULT false,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "region" TEXT,
    "zone" TEXT,
    "warningLettersCount" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[],
    "terminationReason" TEXT,
    "terminationDate" TEXT,
    "terminationCategory" TEXT,
    "idCardStatus" TEXT,
    "idCardNumber" TEXT,
    "idCardIssuedDate" TEXT,
    "idCardExpiryDate" TEXT,
    "idCardIssuerName" TEXT,
    "idCardIssuerSignatureUrl" TEXT,
    "hasSystemAccount" BOOLEAN NOT NULL DEFAULT false,
    "linkedUserId" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "educationLevel" TEXT,
    "motherName" TEXT,
    "motherPhone" TEXT,
    "fatherName" TEXT,
    "fatherPhone" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinRelationship" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinResidence" TEXT,
    "relativesOrReferees" TEXT,
    "residenceDistrict" TEXT,
    "residenceSubCounty" TEXT,
    "residenceParish" TEXT,
    "residenceVillage" TEXT,
    "lc1Chairperson" TEXT,
    "lc1Contact" TEXT,
    "physicalAddress" TEXT,
    "emergencyContactPhone" TEXT,
    "surnameAtBirth" TEXT,
    "nationality" TEXT,
    "tribe" TEXT,
    "placeOfBirth" TEXT,
    "lc2Chairperson" TEXT,
    "closeRelatives" TEXT[],
    "neighbours" TEXT[],
    "fatherAlive" BOOLEAN NOT NULL DEFAULT false,
    "fatherResidence" TEXT,
    "bankAccountName" TEXT,
    "bankBranch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityOfficer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityOfficerBiodata" (
    "id" TEXT NOT NULL,
    "forceNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "tribe" TEXT,
    "placeOfBirth" TEXT,
    "educationLevel" TEXT,
    "motherName" TEXT,
    "motherPhone" TEXT,
    "fatherName" TEXT,
    "fatherPhone" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinRelationship" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinResidence" TEXT,
    "relativesOrReferees" TEXT,
    "residenceDistrict" TEXT,
    "residenceSubCounty" TEXT,
    "residenceParish" TEXT,
    "residenceVillage" TEXT,
    "lc1Chairperson" TEXT,
    "lc1Contact" TEXT,
    "physicalAddress" TEXT,
    "emergencyContactPhone" TEXT,
    "surnameAtBirth" TEXT,
    "lc2Chairperson" TEXT,
    "closeRelatives" TEXT[],
    "neighbours" TEXT[],
    "fatherAlive" BOOLEAN,
    "fatherResidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityOfficerBiodata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityOfficerEmploymentContract" (
    "id" TEXT NOT NULL,
    "contractCode" TEXT NOT NULL,
    "forceNumber" TEXT NOT NULL,
    "securityOfficerName" TEXT NOT NULL,
    "monthlySalaryUgx" INTEGER NOT NULL DEFAULT 180000,
    "startDate" TEXT NOT NULL,
    "probationMonths" INTEGER NOT NULL DEFAULT 3,
    "interpreterName" TEXT,
    "interpreterLanguage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "officerSignatureUrl" TEXT,
    "officerSignedAt" TIMESTAMP(3),
    "hrSignerName" TEXT,
    "hrSignatureUrl" TEXT,
    "hrSignedAt" TIMESTAMP(3),
    "witnessName" TEXT,
    "witnessDesignation" TEXT,
    "pdfPath" TEXT,
    "checksum" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityOfficerEmploymentContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecurityOfficer_forceNumber_key" ON "SecurityOfficer"("forceNumber");

-- CreateIndex
CREATE INDEX "SecurityOfficer_region_idx" ON "SecurityOfficer"("region");

-- CreateIndex
CREATE INDEX "SecurityOfficer_status_idx" ON "SecurityOfficer"("status");

-- CreateIndex
CREATE INDEX "SecurityOfficer_lifecycleStage_idx" ON "SecurityOfficer"("lifecycleStage");

-- CreateIndex
CREATE INDEX "SecurityOfficer_forceNumber_idx" ON "SecurityOfficer"("forceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityOfficerBiodata_forceNumber_key" ON "SecurityOfficerBiodata"("forceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityOfficerEmploymentContract_contractCode_key" ON "SecurityOfficerEmploymentContract"("contractCode");

-- CreateIndex
CREATE INDEX "SecurityOfficerEmploymentContract_forceNumber_idx" ON "SecurityOfficerEmploymentContract"("forceNumber");

-- CreateIndex
CREATE INDEX "SecurityOfficerEmploymentContract_status_idx" ON "SecurityOfficerEmploymentContract"("status");

-- CreateIndex
CREATE INDEX "ArmouryItem_assignedToForceNumber_idx" ON "ArmouryItem"("assignedToForceNumber");

-- CreateIndex
CREATE INDEX "ArmouryLog_forceNumber_idx" ON "ArmouryLog"("forceNumber");

-- CreateIndex
CREATE INDEX "DutyRoster_forceNumber_idx" ON "DutyRoster"("forceNumber");

-- AddForeignKey
ALTER TABLE "SecurityOfficerBiodata" ADD CONSTRAINT "SecurityOfficerBiodata_forceNumber_fkey" FOREIGN KEY ("forceNumber") REFERENCES "SecurityOfficer"("forceNumber") ON DELETE CASCADE ON UPDATE CASCADE;
