-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'Manual',
ALTER COLUMN "stage" SET DEFAULT 'New';

-- Realign existing leads onto the 5-stage owner-based pipeline:
-- Prospect → New, In Negotiation → Qualified, Proposal Sent stays.
UPDATE "Lead" SET "stage" = 'New' WHERE "stage" = 'Prospect';
UPDATE "Lead" SET "stage" = 'Qualified' WHERE "stage" = 'In Negotiation';
UPDATE "Lead" SET "source" = 'Manual' WHERE "source" IS NULL OR "source" = '';
