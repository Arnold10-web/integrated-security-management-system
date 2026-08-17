-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "documentHash" TEXT,
ADD COLUMN     "finalizedPdfPath" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateBody" TEXT,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Guard" ALTER COLUMN "joinDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Incident" ALTER COLUMN "incidentDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSigner" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "secureToken" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signerName" TEXT,
    "variableData" JSONB,
    "signatureData" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractEsignAudit" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "cryptoHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractEsignAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractSigner_secureToken_key" ON "ContractSigner"("secureToken");

-- CreateIndex
CREATE INDEX "ContractSigner_contractId_idx" ON "ContractSigner"("contractId");

-- CreateIndex
CREATE INDEX "ContractSigner_secureToken_idx" ON "ContractSigner"("secureToken");

-- CreateIndex
CREATE INDEX "ContractSigner_expiresAt_idx" ON "ContractSigner"("expiresAt");

-- CreateIndex
CREATE INDEX "ContractEsignAudit_contractId_idx" ON "ContractEsignAudit"("contractId");

-- CreateIndex
CREATE INDEX "Contract_templateId_idx" ON "Contract"("templateId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSigner" ADD CONSTRAINT "ContractSigner_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractEsignAudit" ADD CONSTRAINT "ContractEsignAudit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
