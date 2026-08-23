-- AlterTable
ALTER TABLE "DisciplinaryAction" ADD COLUMN     "fineAmountUgx" INTEGER,
ADD COLUMN     "receivedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "nssfNo" TEXT,
ADD COLUMN     "tin" TEXT;
