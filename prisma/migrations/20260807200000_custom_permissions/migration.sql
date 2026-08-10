-- Add per-user module access overrides (JSON): { moduleName: "view" | "full" | "none" }
ALTER TABLE "User" ADD COLUMN "customPermissions" JSONB;
