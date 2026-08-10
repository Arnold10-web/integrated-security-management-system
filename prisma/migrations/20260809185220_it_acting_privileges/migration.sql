-- AlterTable
ALTER TABLE "User" ADD COLUMN     "actingExpiresAt" TEXT,
ADD COLUMN     "actingGrantedAt" TEXT,
ADD COLUMN     "actingGrantedBy" TEXT,
ADD COLUMN     "actingRole" TEXT;
