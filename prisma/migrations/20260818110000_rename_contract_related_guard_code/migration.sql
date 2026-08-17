-- Rename denormalized contract snapshot column (data preserved).
ALTER TABLE "Contract" RENAME COLUMN "relatedGuardCode" TO "relatedForceNumber";
