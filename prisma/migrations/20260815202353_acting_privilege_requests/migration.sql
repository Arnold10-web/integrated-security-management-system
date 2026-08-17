-- CreateTable
CREATE TABLE "ActingPrivilegeRequest" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "actingRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "requestedById" TEXT NOT NULL,
    "requestedByName" TEXT NOT NULL,
    "grantedById" TEXT,
    "grantedByName" TEXT,
    "grantedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActingPrivilegeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActingPrivilegeRequest_status_idx" ON "ActingPrivilegeRequest"("status");

-- CreateIndex
CREATE INDEX "ActingPrivilegeRequest_requestedById_idx" ON "ActingPrivilegeRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ActingPrivilegeRequest_targetUserId_idx" ON "ActingPrivilegeRequest"("targetUserId");
