-- CreateTable
CREATE TABLE "DeploymentOrder" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "region" TEXT,
    "requiredHeadcount" INTEGER NOT NULL,
    "shiftType" TEXT NOT NULL,
    "targetStartDate" TEXT NOT NULL,
    "targetEndDate" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "assignedGuardIds" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeploymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeploymentOrder_orderCode_key" ON "DeploymentOrder"("orderCode");
