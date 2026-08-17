-- Add missing enum values before conversion
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'Pending';
ALTER TYPE "DutyRosterStatus" ADD VALUE IF NOT EXISTS 'Present';

-- Safe conversion String -> enum without DROP (preserves data) - handle defaults
ALTER TABLE "Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus" USING "status"::"InvoiceStatus";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'Draft'::"InvoiceStatus";

ALTER TABLE "Incident" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Incident" ALTER COLUMN "status" TYPE "IncidentStatus" USING "status"::"IncidentStatus";
ALTER TABLE "Incident" ALTER COLUMN "status" SET DEFAULT 'Open'::"IncidentStatus";

ALTER TABLE "DeploymentOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DeploymentOrder" ALTER COLUMN "status" TYPE "DeploymentOrderStatus" USING "status"::"DeploymentOrderStatus";
ALTER TABLE "DeploymentOrder" ALTER COLUMN "status" SET DEFAULT 'Open'::"DeploymentOrderStatus";

ALTER TABLE "DutyRoster" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DutyRoster" ALTER COLUMN "status" TYPE "DutyRosterStatus" USING "status"::"DutyRosterStatus";
ALTER TABLE "DutyRoster" ALTER COLUMN "status" SET DEFAULT 'Scheduled'::"DutyRosterStatus";
