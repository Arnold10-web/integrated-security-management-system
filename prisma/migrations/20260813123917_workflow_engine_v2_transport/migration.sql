-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "decidedBy" TEXT,
ADD COLUMN     "meta" TEXT,
ADD COLUMN     "regionScope" TEXT;

-- AlterTable
ALTER TABLE "WorkflowStep" ADD COLUMN     "approverRoles" TEXT,
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "optional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regionScoped" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TransportRequest" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "requesterDepartment" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "travelDate" TEXT NOT NULL,
    "travelTime" TEXT,
    "returnTime" TEXT,
    "vehicleType" TEXT NOT NULL DEFAULT 'Any',
    "passengersCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Pending Fleet',
    "assignedVehicleId" TEXT,
    "assignedVehicle" TEXT,
    "assignedDriverId" TEXT,
    "assignedDriver" TEXT,
    "assignedRiderId" TEXT,
    "assignedRider" TEXT,
    "declinedReason" TEXT,
    "actedBy" TEXT,
    "actedAt" TEXT,
    "approvalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportRequest_requestCode_key" ON "TransportRequest"("requestCode");
