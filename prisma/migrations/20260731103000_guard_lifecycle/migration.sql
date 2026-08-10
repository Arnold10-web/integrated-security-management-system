-- CreateEnum
CREATE TYPE "GuardLifecycleStage" AS ENUM ('ENROLLED', 'HANDED_TO_OPERATIONS', 'IN_TRAINING', 'PASSED_OUT', 'DEPLOYED');

-- AlterTable
ALTER TABLE "Guard" ADD COLUMN     "lifecycleStage" "GuardLifecycleStage" NOT NULL DEFAULT 'ENROLLED';

