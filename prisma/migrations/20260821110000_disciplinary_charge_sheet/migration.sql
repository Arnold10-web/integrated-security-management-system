-- Charge sheet adaptation: hearing/employee response, rejection trail, archived PDF link
ALTER TABLE "DisciplinaryAction" ADD COLUMN "hearingDate" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "employeeResponse" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "responseRecordedBy" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "responseRecordedAt" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "resolutionNotes" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "rejectedBy" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "rejectedAt" TEXT;
ALTER TABLE "DisciplinaryAction" ADD COLUMN "archivedPdfPath" TEXT;
