-- AlterTable: Remove fieldDefinitions from PdfContractTemplate
ALTER TABLE "PdfContractTemplate" DROP COLUMN "fieldDefinitions";

-- AlterTable: Add new fields to DigitalContract
ALTER TABLE "DigitalContract" ADD COLUMN "contractId" TEXT NOT NULL;
ALTER TABLE "DigitalContract" ADD COLUMN "contractType" TEXT NOT NULL DEFAULT 'Client';
ALTER TABLE "DigitalContract" ADD COLUMN "clientAbbreviation" TEXT;
ALTER TABLE "DigitalContract" ADD COLUMN "forceNumber" TEXT;

-- AlterTable: Rename contractCode to contractId
-- Note: contractCode was the old field, contractId replaces it with the new naming standard
ALTER TABLE "DigitalContract" DROP COLUMN "contractCode";

-- CreateIndex
CREATE UNIQUE INDEX "DigitalContract_contractId_key" ON "DigitalContract"("contractId");

-- CreateIndex
CREATE INDEX "DigitalContract_contractId_idx" ON "DigitalContract"("contractId");
