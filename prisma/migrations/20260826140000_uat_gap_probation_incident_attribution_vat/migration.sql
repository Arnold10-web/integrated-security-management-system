-- §14.2 item 9: probation tracking columns were present in schema.prisma but had
-- never been migrated (drift) — added here so `prisma migrate deploy` converges.
ALTER TABLE "SecurityOfficer" ADD COLUMN     "probationStartDate" TIMESTAMP(3),
ADD COLUMN     "probationEndDate" TIMESTAMP(3),
ADD COLUMN     "probationStatus" TEXT;

-- §14.2 item 16: incident actor attribution + audit trail, persisted server-side
-- (previously only set client-side and silently dropped by the action routes).
ALTER TABLE "Incident" ADD COLUMN     "investigatedBy" TEXT,
ADD COLUMN     "escalatedBy" TEXT,
ADD COLUMN     "resolvedBy" TEXT,
ADD COLUMN     "resolutionNotes" TEXT;

-- §14.2 item 17: VAT inclusive/exclusive toggle (§9.1, 18% Uganda standard).
ALTER TABLE "Invoice" ADD COLUMN     "vatMode" TEXT NOT NULL DEFAULT 'Exclusive',
ADD COLUMN     "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
