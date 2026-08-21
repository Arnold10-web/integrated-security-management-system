-- Staff self-service leave: any system user can request leave for themselves
-- and track their annual 21-day entitlement.
ALTER TABLE "LeaveRequest" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'guard';
ALTER TABLE "LeaveRequest" ADD COLUMN "requesterUserId" TEXT;
ALTER TABLE "LeaveRequest" ADD COLUMN "requesterRole" TEXT;

CREATE INDEX "LeaveRequest_requesterUserId_idx" ON "LeaveRequest"("requesterUserId");
CREATE INDEX "LeaveRequest_category_idx" ON "LeaveRequest"("category");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
