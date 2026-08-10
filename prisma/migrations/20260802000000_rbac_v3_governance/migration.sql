-- Role rename: Business Development Officer -> Business Development Manager
ALTER TYPE "UserRole" RENAME VALUE 'Business_Development_Officer' TO 'Business_Development_Manager';

-- Guard: region + termination fields
ALTER TABLE "Guard" ADD COLUMN "region" TEXT,
  ADD COLUMN "terminationReason" TEXT,
  ADD COLUMN "terminationDate" TEXT,
  ADD COLUMN "terminationCategory" TEXT;

-- ClientSite: satisfaction + deployment handoff
ALTER TABLE "ClientSite" ADD COLUMN "satisfactionRating" INTEGER,
  ADD COLUMN "deploymentStatus" TEXT NOT NULL DEFAULT 'Not Deployed',
  ADD COLUMN "wonBy" TEXT;

-- Lead: region + wonBy attribution
ALTER TABLE "Lead" ADD COLUMN "region" TEXT,
  ADD COLUMN "wonBy" TEXT;

-- Campaign: budget approval flow
ALTER TABLE "Campaign" ADD COLUMN "proposedBy" TEXT,
  ADD COLUMN "budgetStatus" TEXT NOT NULL DEFAULT 'Pending',
  ADD COLUMN "budgetApprovedBy" TEXT,
  ADD COLUMN "budgetApprovedAt" TEXT;

-- CashierTransaction: link to guard record (auto-flow to HR)
ALTER TABLE "CashierTransaction" ADD COLUMN "guardId" TEXT;

-- AdminRequisition: guard issuance with cost (HR inherits cost)
ALTER TABLE "AdminRequisition" ADD COLUMN "issuedToGuardId" TEXT,
  ADD COLUMN "issuedToGuardName" TEXT,
  ADD COLUMN "issuedToGuardCode" TEXT,
  ADD COLUMN "itemUnitCostUgx" DOUBLE PRECISION,
  ADD COLUMN "issuedDate" TEXT;

-- New models
CREATE TABLE "DisciplinaryAction" (
  "id" TEXT NOT NULL,
  "actionCode" TEXT NOT NULL,
  "guardId" TEXT NOT NULL,
  "guardName" TEXT NOT NULL,
  "guardCode" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'Medium',
  "status" TEXT NOT NULL DEFAULT 'Initiated',
  "initiatedBy" TEXT NOT NULL,
  "regionalApprovedBy" TEXT,
  "operationsApprovedBy" TEXT,
  "hrApprovedBy" TEXT,
  "approvedAt" TEXT,
  "linkedIncidentCode" TEXT,
  "linkedComplaintCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DisciplinaryAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Complaint" (
  "id" TEXT NOT NULL,
  "complaintCode" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "satisfactionRating" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "ownedBy" TEXT NOT NULL DEFAULT 'Marketing',
  "resolvedBy" TEXT,
  "resolutionNotes" TEXT,
  "referredForInvestigation" BOOLEAN NOT NULL DEFAULT false,
  "linkedIncidentCode" TEXT,
  "reportedDate" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteDeployment" (
  "id" TEXT NOT NULL,
  "deploymentCode" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "clientName" TEXT NOT NULL,
  "guardId" TEXT NOT NULL,
  "guardName" TEXT NOT NULL,
  "shiftType" TEXT NOT NULL,
  "deployedBy" TEXT NOT NULL,
  "deployedAt" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteDeployment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DisciplinaryAction_actionCode_key" ON "DisciplinaryAction"("actionCode");
CREATE UNIQUE INDEX "Complaint_complaintCode_key" ON "Complaint"("complaintCode");
CREATE UNIQUE INDEX "SiteDeployment_deploymentCode_key" ON "SiteDeployment"("deploymentCode");
