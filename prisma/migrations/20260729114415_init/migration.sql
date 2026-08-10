-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('General_Manager', 'Director', 'Executive', 'HR_Manager', 'HR_Assistant', 'Records_Officer', 'Business_Development_Officer', 'Sales_Marketing_Supervisor_1', 'Sales_Marketing_Supervisor_2', 'Marketing_Lead', 'Operations_Manager', 'Regional_Manager', 'Station_Manager', 'Fleet_Manager', 'Training_Officer', 'Armoury_Officer', 'Investigations_Officer', 'Guard_Officer', 'Armorer', 'K9_Supervisor', 'K9_Handler', 'Site_Supervisor', 'Finance_Manager', 'Accountant', 'Assistant_Accountant_1', 'Assistant_Accountant_2', 'Internal_Auditor', 'Cashier', 'Administrative_Officer', 'IT_Officer', 'IT_Administrator');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "region" TEXT,
    "forceNumber" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guard" (
    "id" TEXT NOT NULL,
    "guardCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "rank" TEXT NOT NULL,
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
    "isDeserter" BOOLEAN NOT NULL DEFAULT false,
    "desertionDate" TEXT,
    "desertionNotes" TEXT,
    "medicalCleared" BOOLEAN NOT NULL DEFAULT false,
    "armedQualified" BOOLEAN NOT NULL DEFAULT false,
    "k9Qualified" BOOLEAN NOT NULL DEFAULT false,
    "joinDate" TEXT NOT NULL,
    "warningLettersCount" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[],
    "idCardStatus" TEXT,
    "idCardNumber" TEXT,
    "idCardIssuedDate" TEXT,
    "idCardExpiryDate" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSite" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "dayShiftGuards" INTEGER NOT NULL DEFAULT 0,
    "nightShiftGuards" INTEGER NOT NULL DEFAULT 0,
    "armedGuardsRequired" INTEGER NOT NULL DEFAULT 0,
    "k9Required" BOOLEAN NOT NULL DEFAULT false,
    "contactPerson" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "slaStatus" TEXT NOT NULL DEFAULT 'Compliant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArmouryItem" (
    "id" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caliberOrSpecs" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'Good',
    "assignedToGuardId" TEXT,
    "assignedToGuardName" TEXT,
    "location" TEXT NOT NULL DEFAULT 'Main Vault',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArmouryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArmouryLog" (
    "id" TEXT NOT NULL,
    "serialNumberLog" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "firearmSerialNumber" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "ammoRoundsOut" INTEGER NOT NULL,
    "dateOut" TEXT NOT NULL,
    "timeOut" TEXT NOT NULL,
    "signOutConfirmed" BOOLEAN NOT NULL,
    "dateIn" TEXT,
    "timeIn" TEXT,
    "ammoRoundsIn" INTEGER,
    "signInConfirmed" BOOLEAN,
    "substituteReceiver" TEXT,
    "armourerInCharge" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Checked Out',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArmouryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "K9Dog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "chipNumber" TEXT NOT NULL,
    "ageYears" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active Duty',
    "assignedHandlerId" TEXT,
    "assignedHandlerName" TEXT,
    "kennelNumber" TEXT NOT NULL,
    "rabiesVaccineDate" TEXT NOT NULL,
    "lastVetCheck" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "currentWeightKg" DOUBLE PRECISION,
    "healthCondition" TEXT,
    "vaccinationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "K9Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "K9HealthInspection" (
    "id" TEXT NOT NULL,
    "inspectionCode" TEXT NOT NULL,
    "k9Id" TEXT NOT NULL,
    "k9Name" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "inspectionDate" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "vaccinationStatus" TEXT NOT NULL,
    "physicalCondition" TEXT NOT NULL,
    "coatAndSkinCheck" TEXT NOT NULL,
    "appetiteAndHydration" TEXT NOT NULL,
    "temperatureCelsius" DOUBLE PRECISION,
    "inspectingOfficer" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "K9HealthInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "K9Log" (
    "id" TEXT NOT NULL,
    "k9Id" TEXT NOT NULL,
    "k9Name" TEXT NOT NULL,
    "handlerName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "deploymentDate" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "trainingScore" TEXT NOT NULL,
    "vetNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "K9Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL,
    "driverAssigned" TEXT NOT NULL,
    "fuelLevelPercentage" INTEGER NOT NULL DEFAULT 100,
    "mileageKm" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Operational',
    "lastServiceDate" TEXT NOT NULL,
    "nextServiceDueKm" INTEGER NOT NULL,
    "chassisNumber" TEXT,
    "insuranceExpiryDate" TEXT,
    "roadLicenceExpiryDate" TEXT,
    "deploymentBranch" TEXT,
    "conditionRating" TEXT,
    "replacementStatus" TEXT,
    "gpsTrackerId" TEXT,
    "lifetimeMaintenanceCost" DOUBLE PRECISION,
    "serviceIntervalKm" INTEGER,
    "lastOilChangeKm" INTEGER,
    "lastOilChangeDate" TEXT,
    "oilStatus" TEXT,
    "lastTyreCheckDate" TEXT,
    "tyreTreadDepthMm" DOUBLE PRECISION,
    "tyreStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "reportedByGuard" TEXT NOT NULL,
    "incidentDate" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "evidenceAttached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashierTransaction" (
    "id" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "guardCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "processedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashierTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Prospect',
    "assignedTo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "budget" DOUBLE PRECISION NOT NULL,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DutyRoster" (
    "id" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "guardName" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "shiftDate" TEXT NOT NULL,
    "shiftType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DutyRoster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatrolInspectionLog" (
    "id" TEXT NOT NULL,
    "inspectionCode" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "guardOnDuty" TEXT NOT NULL,
    "inspectionTime" TEXT NOT NULL,
    "radioCheckStatus" TEXT NOT NULL,
    "uniformTurnout" TEXT NOT NULL,
    "weaponEquipmentCheck" TEXT NOT NULL,
    "overallRating" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatrolInspectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRequisition" (
    "id" TEXT NOT NULL,
    "reqCode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCostUgx" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Pending Approval',
    "dateRequested" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCohort" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "leadInstructor" TEXT NOT NULL,
    "totalRecruits" INTEGER NOT NULL DEFAULT 0,
    "passedOutCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Upcoming Intake',
    "curriculumModules" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitTrainee" (
    "id" TEXT NOT NULL,
    "traineeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationalIdNumber" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "cohortId" TEXT NOT NULL,
    "cohortName" TEXT NOT NULL,
    "assignedRegion" TEXT NOT NULL,
    "drillScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marksmanshipScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "theoryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallStatus" TEXT NOT NULL DEFAULT 'Under Training',
    "assignedForceNumber" TEXT,
    "dateGraduated" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitTrainee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITServer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Operational',
    "cpuUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memoryUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uptime" TEXT NOT NULL DEFAULT '0d 0h 0m',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITServer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITSupportTicket" (
    "id" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITSupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ITAsset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "serialNumberOrKey" TEXT NOT NULL,
    "assignedToPersonOrStation" TEXT NOT NULL,
    "assignedDepartment" TEXT NOT NULL,
    "purchaseDate" TEXT NOT NULL,
    "warrantyExpiryDate" TEXT,
    "valueUgx" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'Operational',
    "softwareVersionOrSpecs" TEXT,
    "ipAddressOrHost" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ITAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalOffice" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "locationCity" TEXT NOT NULL,
    "regionalManagerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activeGuardsCount" INTEGER NOT NULL DEFAULT 0,
    "clientSitesCount" INTEGER NOT NULL DEFAULT 0,
    "armouryVaultStatus" TEXT NOT NULL DEFAULT 'Fully Operational',
    "vehiclesAssigned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalOffice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guard_guardCode_key" ON "Guard"("guardCode");

-- CreateIndex
CREATE UNIQUE INDEX "K9Dog_code_key" ON "K9Dog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "K9HealthInspection_inspectionCode_key" ON "K9HealthInspection"("inspectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_incidentCode_key" ON "Incident"("incidentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PatrolInspectionLog_inspectionCode_key" ON "PatrolInspectionLog"("inspectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCohort_code_key" ON "TrainingCohort"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ITSupportTicket_ticketCode_key" ON "ITSupportTicket"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "ITAsset_assetCode_key" ON "ITAsset"("assetCode");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalOffice_code_key" ON "RegionalOffice"("code");
