-- CreateTable
CREATE TABLE "PdfContractTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "pdfFilePath" TEXT NOT NULL,
    "pdfFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "fieldDefinitions" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalContract" (
    "id" TEXT NOT NULL,
    "contractCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "filledFields" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "signingOrder" JSONB NOT NULL,
    "currentSignerIndex" INTEGER NOT NULL DEFAULT 0,
    "finalizedPdfPath" TEXT,
    "documentHash" TEXT,
    "isScanned" BOOLEAN NOT NULL DEFAULT false,
    "scannedPdfPath" TEXT,
    "scannedAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "partyName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "valueUgx" INTEGER,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalContractSigner" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT,
    "signerEmail" TEXT,
    "signingOrder" INTEGER NOT NULL,
    "secureToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "signatureData" TEXT,
    "signedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalContractSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalContractAudit" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "cryptoHash" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigitalContractAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PdfContractTemplate_id_key" ON "PdfContractTemplate"("id");

-- CreateIndex
CREATE INDEX "PdfContractTemplate_category_idx" ON "PdfContractTemplate"("category");

-- CreateIndex
CREATE INDEX "PdfContractTemplate_isActive_idx" ON "PdfContractTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalContract_contractCode_key" ON "DigitalContract"("contractCode");

-- CreateIndex
CREATE INDEX "DigitalContract_category_idx" ON "DigitalContract"("category");

-- CreateIndex
CREATE INDEX "DigitalContract_status_idx" ON "DigitalContract"("status");

-- CreateIndex
CREATE INDEX "DigitalContract_templateId_idx" ON "DigitalContract"("templateId");

-- CreateIndex
CREATE INDEX "DigitalContract_endDate_idx" ON "DigitalContract"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalContractSigner_secureToken_key" ON "DigitalContractSigner"("secureToken");

-- CreateIndex
CREATE INDEX "DigitalContractSigner_contractId_idx" ON "DigitalContractSigner"("contractId");

-- CreateIndex
CREATE INDEX "DigitalContractSigner_secureToken_idx" ON "DigitalContractSigner"("secureToken");

-- CreateIndex
CREATE INDEX "DigitalContractSigner_signingOrder_idx" ON "DigitalContractSigner"("signingOrder");

-- CreateIndex
CREATE INDEX "DigitalContractAudit_contractId_idx" ON "DigitalContractAudit"("contractId");

-- CreateIndex
CREATE INDEX "DigitalContractAudit_eventType_idx" ON "DigitalContractAudit"("eventType");

-- AddForeignKey
ALTER TABLE "DigitalContract" ADD CONSTRAINT "DigitalContract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PdfContractTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalContractSigner" ADD CONSTRAINT "DigitalContractSigner_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DigitalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalContractAudit" ADD CONSTRAINT "DigitalContractAudit_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "DigitalContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
