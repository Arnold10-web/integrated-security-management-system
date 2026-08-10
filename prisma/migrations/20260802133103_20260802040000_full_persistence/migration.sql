-- AlterTable
ALTER TABLE "DutyRoster" ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "VehicleTripLog" (
    "id" TEXT NOT NULL,
    "tripCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "startMileageKm" INTEGER NOT NULL,
    "endMileageKm" INTEGER,
    "distanceKm" INTEGER,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'In Transit',
    "authorizedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleTripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "fuelLitres" DOUBLE PRECISION NOT NULL,
    "costUgx" DOUBLE PRECISION NOT NULL,
    "mileageAtRefillKm" INTEGER NOT NULL,
    "fuelType" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "refillDate" TEXT NOT NULL,
    "approvedBy" TEXT,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Pending FM Approval',
    "approvedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceServiceLog" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mileageAtServiceKm" INTEGER NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "nextDueDate" TEXT NOT NULL,
    "costUgx" DOUBLE PRECISION NOT NULL,
    "workshopName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "approvalStatus" TEXT NOT NULL DEFAULT 'Pending FM Approval',
    "approvedBy" TEXT,
    "approvedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceServiceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "driverCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "licenceClass" TEXT NOT NULL,
    "licenceExpiryDate" TEXT NOT NULL,
    "assignedVehiclePlate" TEXT NOT NULL,
    "dutyShift" TEXT NOT NULL,
    "safetyScorePct" DOUBLE PRECISION NOT NULL,
    "totalTripsCompleted" INTEGER NOT NULL,
    "trainingBadges" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active Duty',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyVehicleInspection" (
    "id" TEXT NOT NULL,
    "inspectionCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "inspectorDriver" TEXT NOT NULL,
    "inspectionDate" TEXT NOT NULL,
    "inspectionTime" TEXT NOT NULL,
    "brakesCheck" TEXT NOT NULL,
    "tyresCheck" TEXT NOT NULL,
    "lightsSirensCheck" TEXT NOT NULL,
    "oilLevelCheck" TEXT NOT NULL,
    "coolantCheck" TEXT NOT NULL,
    "batteryCheck" TEXT NOT NULL,
    "overallCondition" TEXT NOT NULL,
    "defectsNoted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyVehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetBreakdownEmergency" (
    "id" TEXT NOT NULL,
    "incidentCode" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reportedTime" TEXT NOT NULL,
    "recoveryAssigned" TEXT NOT NULL,
    "backupVehicleDispatched" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active Emergency',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetBreakdownEmergency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTripLog_tripCode_key" ON "VehicleTripLog"("tripCode");

-- CreateIndex
CREATE UNIQUE INDEX "FuelLog_voucherCode_key" ON "FuelLog"("voucherCode");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceServiceLog_serviceCode_key" ON "MaintenanceServiceLog"("serviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driverCode_key" ON "Driver"("driverCode");

-- CreateIndex
CREATE UNIQUE INDEX "DailyVehicleInspection_inspectionCode_key" ON "DailyVehicleInspection"("inspectionCode");

-- CreateIndex
CREATE UNIQUE INDEX "FleetBreakdownEmergency_incidentCode_key" ON "FleetBreakdownEmergency"("incidentCode");
