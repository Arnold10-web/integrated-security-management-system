-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('Open', 'Under Investigation', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "DeploymentOrderStatus" AS ENUM ('Open', 'In Progress', 'Fulfilled', 'Cancelled');

-- CreateEnum
CREATE TYPE "DutyRosterStatus" AS ENUM ('Scheduled', 'Checked In', 'Checked Out', 'Absent', 'Cancelled');

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RevokedToken_userId_idx" ON "RevokedToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ArmouryItem_category_idx" ON "ArmouryItem"("category");

-- CreateIndex
CREATE INDEX "ArmouryItem_condition_idx" ON "ArmouryItem"("condition");

-- CreateIndex
CREATE INDEX "ArmouryItem_location_idx" ON "ArmouryItem"("location");

-- CreateIndex
CREATE INDEX "ArmouryItem_assignedToGuardId_idx" ON "ArmouryItem"("assignedToGuardId");

-- CreateIndex
CREATE INDEX "ArmouryItem_serialNumber_idx" ON "ArmouryItem"("serialNumber");

-- CreateIndex
CREATE INDEX "ArmouryLog_guardId_idx" ON "ArmouryLog"("guardId");

-- CreateIndex
CREATE INDEX "ArmouryLog_locationName_idx" ON "ArmouryLog"("locationName");

-- CreateIndex
CREATE INDEX "ArmouryLog_status_idx" ON "ArmouryLog"("status");

-- CreateIndex
CREATE INDEX "ArmouryLog_dateOut_idx" ON "ArmouryLog"("dateOut");

-- CreateIndex
CREATE INDEX "ClientSite_region_idx" ON "ClientSite"("region");

-- CreateIndex
CREATE INDEX "ClientSite_slaStatus_idx" ON "ClientSite"("slaStatus");

-- CreateIndex
CREATE INDEX "ClientSite_siteName_idx" ON "ClientSite"("siteName");

-- CreateIndex
CREATE INDEX "ClientSite_clientName_idx" ON "ClientSite"("clientName");

-- CreateIndex
CREATE INDEX "ClientSite_deploymentStatus_idx" ON "ClientSite"("deploymentStatus");

-- CreateIndex
CREATE INDEX "DeploymentOrder_siteId_idx" ON "DeploymentOrder"("siteId");

-- CreateIndex
CREATE INDEX "DeploymentOrder_status_idx" ON "DeploymentOrder"("status");

-- CreateIndex
CREATE INDEX "DeploymentOrder_region_idx" ON "DeploymentOrder"("region");

-- CreateIndex
CREATE INDEX "DutyRoster_guardId_idx" ON "DutyRoster"("guardId");

-- CreateIndex
CREATE INDEX "DutyRoster_siteId_idx" ON "DutyRoster"("siteId");

-- CreateIndex
CREATE INDEX "DutyRoster_shiftDate_idx" ON "DutyRoster"("shiftDate");

-- CreateIndex
CREATE INDEX "DutyRoster_status_idx" ON "DutyRoster"("status");

-- CreateIndex
CREATE INDEX "DutyRoster_region_idx" ON "DutyRoster"("region");

-- CreateIndex
CREATE INDEX "Incident_siteName_idx" ON "Incident"("siteName");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_incidentDate_idx" ON "Incident"("incidentDate");

-- CreateIndex
CREATE INDEX "Incident_category_idx" ON "Incident"("category");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_clientName_idx" ON "Invoice"("clientName");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "K9Dog_status_idx" ON "K9Dog"("status");

-- CreateIndex
CREATE INDEX "K9Dog_breed_idx" ON "K9Dog"("breed");

-- CreateIndex
CREATE INDEX "K9Dog_assignedHandlerId_idx" ON "K9Dog"("assignedHandlerId");

-- CreateIndex
CREATE INDEX "K9Log_k9Id_idx" ON "K9Log"("k9Id");

-- CreateIndex
CREATE INDEX "K9Log_siteName_idx" ON "K9Log"("siteName");

-- CreateIndex
CREATE INDEX "K9Log_deploymentDate_idx" ON "K9Log"("deploymentDate");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_deploymentBranch_idx" ON "Vehicle"("deploymentBranch");

-- CreateIndex
CREATE INDEX "Vehicle_driverAssigned_idx" ON "Vehicle"("driverAssigned");

-- CreateIndex
CREATE INDEX "VehicleTripLog_vehicleId_idx" ON "VehicleTripLog"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleTripLog_status_idx" ON "VehicleTripLog"("status");

-- CreateIndex
CREATE INDEX "VehicleTripLog_departureTime_idx" ON "VehicleTripLog"("departureTime");
