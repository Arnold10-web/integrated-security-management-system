-- AlterTable: Add fingerprint biometric fields to ArmouryLog
ALTER TABLE "ArmouryLog" ADD COLUMN "signOutFingerprintHash" TEXT;
ALTER TABLE "ArmouryLog" ADD COLUMN "fingerprintHash" TEXT;
