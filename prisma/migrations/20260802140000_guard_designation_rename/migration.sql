-- Rename Guard.rank to Guard.designation (guards hold designations, not military ranks)
ALTER TABLE "Guard" RENAME COLUMN "rank" TO "designation";
