-- Add missing enum values for safe conversion follow-up
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'Pending GM Approval';
ALTER TYPE "DeploymentOrderStatus" ADD VALUE IF NOT EXISTS 'Assigned';
ALTER TYPE "DeploymentOrderStatus" ADD VALUE IF NOT EXISTS 'Filled';
-- DutyRosterStatus Present already added in previous migration, but ensure
ALTER TYPE "DutyRosterStatus" ADD VALUE IF NOT EXISTS 'Present';
-- IncidentStatus Escalated already exists, ensure
ALTER TYPE "IncidentStatus" ADD VALUE IF NOT EXISTS 'Escalated';
