-- Rename denormalized relief guard snapshot column (data preserved).
ALTER TABLE "LeaveRequest" RENAME COLUMN "reliefGuardCode" TO "reliefForceNumber";
