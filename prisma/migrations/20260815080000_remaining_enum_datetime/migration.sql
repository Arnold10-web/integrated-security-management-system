-- CreateEnum
CREATE TYPE "GuardStatus" AS ENUM ('On Duty', 'Off Duty', 'On Leave', 'Suspended', 'Deserted', 'Archived');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending Regional Approval', 'Pending HR Approval', 'Pending GM Approval', 'Approved', 'Rejected', 'Completed');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('Draft', 'Active', 'Expiring Soon', 'Expired', 'Pending Renewal', 'Terminated', 'Archived');

-- CreateEnum
CREATE TYPE "GuardDesignation" AS ENUM ('Guard', 'K9 Handler', 'Armorer', 'Site In-Charge', 'Inspector');

-- CreateEnum
CREATE TYPE "ArmouryCondition" AS ENUM ('Excellent', 'Good', 'Requires Service', 'Decommissioned');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Operational', 'In Service', 'Fueling Needed', 'Grounded');

-- CreateEnum
CREATE TYPE "SlaStatus" AS ENUM ('Compliant', 'Understaffed', 'Attention Needed');

-- AlterTable: Safe conversions with USING (preserves data)
ALTER TABLE "Contract" ALTER COLUMN "startDate" TYPE TIMESTAMP(3) USING "startDate"::timestamp;
ALTER TABLE "Contract" ALTER COLUMN "endDate" TYPE TIMESTAMP(3) USING "endDate"::timestamp;

ALTER TABLE "Invoice" ALTER COLUMN "date" TYPE TIMESTAMP(3) USING "date"::timestamp;
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" TYPE TIMESTAMP(3) USING "dueDate"::timestamp;

ALTER TABLE "Guard" ALTER COLUMN "joinDate" TYPE TIMESTAMP(3) USING "joinDate"::timestamp;
ALTER TABLE "Guard" ALTER COLUMN "desertionDate" TYPE TIMESTAMP(3) USING NULLIF("desertionDate", '')::timestamp;

ALTER TABLE "Incident" ALTER COLUMN "incidentDate" TYPE TIMESTAMP(3) USING "incidentDate"::timestamp;

ALTER TABLE "User" ALTER COLUMN "actingExpiresAt" TYPE TIMESTAMP(3) USING NULLIF("actingExpiresAt", '')::timestamp;
ALTER TABLE "User" ALTER COLUMN "actingGrantedAt" TYPE TIMESTAMP(3) USING NULLIF("actingGrantedAt", '')::timestamp;

ALTER TABLE "AuditLog" ALTER COLUMN "timestamp" TYPE TIMESTAMP(3) USING "timestamp"::timestamp;

ALTER TABLE "ClientSite" ALTER COLUMN "slaStatus" DROP DEFAULT;
ALTER TABLE "ClientSite" ALTER COLUMN "slaStatus" TYPE "SlaStatus" USING "slaStatus"::"SlaStatus";
ALTER TABLE "ClientSite" ALTER COLUMN "slaStatus" SET DEFAULT 'Compliant'::"SlaStatus";
ALTER TABLE "ArmouryItem" ALTER COLUMN "condition" DROP DEFAULT;
ALTER TABLE "ArmouryItem" ALTER COLUMN "condition" TYPE "ArmouryCondition" USING "condition"::"ArmouryCondition";
ALTER TABLE "ArmouryItem" ALTER COLUMN "condition" SET DEFAULT 'Good'::"ArmouryCondition";
ALTER TABLE "Vehicle" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Vehicle" ALTER COLUMN "status" TYPE "VehicleStatus" USING "status"::"VehicleStatus";
ALTER TABLE "Vehicle" ALTER COLUMN "status" SET DEFAULT 'Operational'::"VehicleStatus";
ALTER TABLE "Guard" ALTER COLUMN "designation" DROP DEFAULT;
ALTER TABLE "Guard" ALTER COLUMN "designation" TYPE "GuardDesignation" USING "designation"::"GuardDesignation";
ALTER TABLE "Guard" ALTER COLUMN "designation" SET DEFAULT 'Guard'::"GuardDesignation";

-- CreateTable
CREATE TABLE "GuardBiodata" (
    "id" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
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
    CONSTRAINT "GuardBiodata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForceNumberSequence" (
    "year" TEXT NOT NULL,
    "nextSeq" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ForceNumberSequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GuardBiodata_guardId_key" ON "GuardBiodata"("guardId");
CREATE INDEX IF NOT EXISTS "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX IF NOT EXISTS "Contract_region_idx" ON "Contract"("region");
CREATE INDEX IF NOT EXISTS "Contract_status_idx" ON "Contract"("status");
CREATE INDEX IF NOT EXISTS "Document_referenceType_referenceId_idx" ON "Document"("referenceType", "referenceId");
CREATE INDEX IF NOT EXISTS "Document_uploadedBy_idx" ON "Document"("uploadedBy");
CREATE INDEX IF NOT EXISTS "Guard_region_idx" ON "Guard"("region");
CREATE INDEX IF NOT EXISTS "Guard_status_idx" ON "Guard"("status");
CREATE INDEX IF NOT EXISTS "Guard_lifecycleStage_idx" ON "Guard"("lifecycleStage");
CREATE INDEX IF NOT EXISTS "Guard_guardCode_idx" ON "Guard"("guardCode");
CREATE INDEX IF NOT EXISTS "Guard_forceNumber_idx" ON "Guard"("forceNumber");

-- AddForeignKey
ALTER TABLE "GuardBiodata" ADD CONSTRAINT "GuardBiodata_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "Guard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add Document checksum
ALTER TABLE "Document" ADD COLUMN "checksum" TEXT;
