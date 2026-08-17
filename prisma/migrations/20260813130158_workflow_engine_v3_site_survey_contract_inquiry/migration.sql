-- CreateTable
CREATE TABLE "SiteSurvey" (
    "id" TEXT NOT NULL,
    "surveyCode" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requestedDepartment" TEXT NOT NULL,
    "surveyedBy" TEXT,
    "premisesType" TEXT,
    "perimeterStatus" TEXT,
    "entryPoints" INTEGER,
    "riskLevel" TEXT,
    "highValueAssets" TEXT,
    "dayGuardsNeeded" INTEGER,
    "nightGuardsNeeded" INTEGER,
    "armedDay" BOOLEAN,
    "armedNight" BOOLEAN,
    "equipmentNeeded" TEXT,
    "k9Required" BOOLEAN,
    "patrolVehicleRequired" BOOLEAN,
    "accessHours" TEXT,
    "recommendation" TEXT,
    "notes" TEXT,
    "reportPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractInquiry" (
    "id" TEXT NOT NULL,
    "inquiryCode" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requesterDepartment" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "siteName" TEXT,
    "searchHints" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'Confirmation',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "respondedBy" TEXT,
    "responseType" TEXT,
    "responseNotes" TEXT,
    "responsePath" TEXT,
    "respondedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_surveyCode_key" ON "SiteSurvey"("surveyCode");

-- CreateIndex
CREATE UNIQUE INDEX "ContractInquiry_inquiryCode_key" ON "ContractInquiry"("inquiryCode");
