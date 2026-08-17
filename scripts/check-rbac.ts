#!/usr/bin/env tsx
/**
 * check:rbac — fails if server/client RBAC tables diverge from single source.
 * Verifies that src/config/permissions.ts is the only MODULE_PERMISSIONS definition.
 */
import fs from "fs";

const forbiddenPatterns = [
  { file: "server.ts", pattern: /const MODULE_PERMISSIONS/ },
  { file: "src/services/rbacService.ts", pattern: /const FULL_EDIT_ROLES|MODULE_PERMISSIONS/ },
  { file: "src/constants/modules.ts", pattern: /function getAllowedModuleIds.*switch/ },
];

let failed = false;
for (const { file, pattern } of forbiddenPatterns) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, "utf-8");
  // server.ts should now import, not define
  if (file === "server.ts" && pattern.test(content)) {
    console.error(`FAIL: ${file} still defines MODULE_PERMISSIONS — should import from src/config/permissions.ts`);
    failed = true;
  }
}

// Verify single source exists and has expected keys
import { MODULE_PERMISSIONS, SERVER_MODULE_TO_CLIENT } from "../src/config/permissions.ts";
const requiredModules = ["guards","sites","armoury","incidents","vehicles","k9s","hr","finance","leave","it","workflow"];
for (const m of requiredModules) {
  if (!MODULE_PERMISSIONS[m]) {
    console.error(`FAIL: MODULE_PERMISSIONS missing module "${m}"`);
    failed = true;
  }
}
if (!SERVER_MODULE_TO_CLIENT["guards"]) {
  console.error(`FAIL: SERVER_MODULE_TO_CLIENT missing mapping`);
  failed = true;
}

// Check K9 Handler is view-only (least privilege)
if (MODULE_PERMISSIONS["k9s"]?.["K9 Handler"] !== "view") {
  console.error(`FAIL: K9 Handler should be "view" on k9s, got "${MODULE_PERMISSIONS["k9s"]?.["K9 Handler"]}"`);
  failed = true;
}

if (failed) {
  console.error("\ncheck:rbac FAILED");
  process.exit(1);
}
console.log("check:rbac OK — single source of truth verified");
