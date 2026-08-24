# Dead Code Findings & Cleanup — 2026-08-24

**Scope:** full `src/` tree (222 TS/TSX files, excluding Prisma generated client), root-level scripts, package scripts.
**Method:** import-graph scan (exact module-path matching for every import site across all code files, tests, configs, and `server.ts`), cross-checked against dynamic imports (`import()` / `lazy()`), route tables in `src/App.tsx`, and `package.json` scripts.
**Result:** **21 dead files removed (~2,540 lines)**. Build, lint, and unit tests verified green after removal.

---

## Executive summary

The codebase carries a significant amount of orphaned code: components built for features that were
later implemented differently (PDF template builder, embedded signing widget), hooks extracted from
views that were refactored away (fleet forms/alerts/subsystems, IT maintenance), an unused modular
server scaffold superseded by the monolithic `server.ts`, and several validation/service modules that
were written but never wired. None of these are reachable from any entry point — they inflate the
bundle analysis, confuse greps, and slow every future audit.

Nothing removed was "useful but unreachable" except two items explicitly kept and listed in the
"Kept — potentially useful" section below.

---

## Removed (dead — zero import sites anywhere)

### UI components (referenced only in docs/spec prose)
| File | Lines | Notes |
|---|---|---|
| `src/components/organisms/PdfTemplateBuilder.tsx` | 654 | Drag-and-drop PDF field-placement builder. The live system uses server-side `pdf-lib` template rendering instead (`server.ts`, `digitalContractTemplates.ts`). Largest single win. |
| `src/components/ui/OrgHierarchyPanel.tsx` | 126 | Org-chart panel; the live hierarchy renders via `constants/organization.ts` + `UserRolesView`. |
| `src/components/SectionViewer.tsx` | 154 | Generic section viewer; nothing mounts it. |
| `src/components/organisms/EmbeddedSigningWidget.tsx` | 93 | Embedded e-sign widget; signing happens through `DigitalContractsView` + `digitalSigning.ts` routes instead. |
| `src/components/atoms/SecurityOfficerAvatar.tsx` | 22 | Avatar atom never imported; views inline their own avatar markup. |

### Hooks (extracted during old refactors, superseded by view-local state)
| File | Lines | Notes |
|---|---|---|
| `src/hooks/useFleetForms.ts` | 412 | Form-state hook for Fleet; live `FleetView` manages its own state. |
| `src/hooks/useFleetAlerts.ts` | 184 | Fleet alert hook; alerts now derive in-view from store data. |
| `src/hooks/useITSystemMaintenance.ts` | 155 | IT maintenance scheduling hook; logic lives in `ITAdminView`. |
| `src/hooks/useFleetSubsystems.ts` | 27 | Sub-tab helper for the old fleet layout. |

### Unused modular server scaffold (`server.ts` is the real server; this tree was never wired)
| File | Lines | Notes |
|---|---|---|
| `src/server/app.ts` | 19 | Alternate `createApp()` bootstrap; `npm run dev`/`build`/`start` all use `server.ts`. |
| `src/server/config.ts` | 27 | Env schema duplicate of the one inside `server.ts`. |
| `src/server/middleware/auth.ts` | 104 | JWT middleware duplicate of `authenticateToken` in `server.ts`. |
| `src/server/middleware/security.ts` | 86 | Helmet/CORS setup duplicate; `server.ts` configures its own. |
| `src/server/middleware/upload.ts` | 83 | Multer upload helpers; `server.ts` has its own upload handling. |
| `src/server/routers/auth.ts` | 54 | Auth router never mounted. |
| `src/server/routers/securityOfficers.ts` | 26 | Router stub never mounted. |

> Kept from this subtree: `src/server/services/forceNumber.ts` — it IS imported by `server.ts`
> (`modularNextForceNumber`). Do not delete.

### Services / stores / utils with zero references in any code file
| File | Lines | Notes |
|---|---|---|
| `src/validation/schemas.ts` | 78 | Zod schemas never imported; server validates inline. |
| `src/services/zodSchemas.ts` | 94 | Same story; constants duplicated in `config/permissions.ts` etc. |
| `src/services/validationService.ts` | 76 | Validator functions never called. |
| `src/stores/securityOfficersStore.ts` | 47 | Zustand store duplicate; officers live in `domainStore`. |
| `src/utils/exportUtils.ts` | 16 | CSV export helper never imported (components use jspdf/file-saver directly). |

**Total removed: 21 files, ~2,540 lines.**
Empty directories left behind were pruned; `src/server/services/` retained for the live force-number service.

---

## Kept — flagged as useful-but-unused (do NOT delete yet)

These exports are unreferenced today but are either part of the documented RBAC surface,
recently added by ongoing work, or generic utilities worth keeping:

- `src/services/rbacService.ts`: `canAccessModule`, `getPermissionsForRole`, `describeAccess`,
  `FINANCE_VIEW_ROLES`, `COLLECTIONS_VIEW_ROLES` — public API of the RBAC layer; documented in
  master-spec §RBAC. Candidate for adoption in views rather than deletion.
- `src/utils/executiveStats.ts`: exported types (`TrainingStats`, `OfficerStats`, …) and
  `METRIC_REGISTRY` — the registry is the intended single source for future dashboard panels;
  types are consumed implicitly via inference.
- `src/utils/trainingPipeline.ts`: `PipelineStage`, officer bucket helpers (`awaitingOfficers`,
  `inTrainingOfficers`, `passedOutOfficers`) — used by tests and reserved for the pipeline UI's
  next iteration.
- `src/utils/index.ts`: `formatCurrency` — generic formatter; likely to be adopted as views migrate.
- Root debug scripts `verify_it.mjs`, `verify_final.mjs` (Playwright smoke checks) and
  `check-seed.cjs` / `check-seed-simple.js` (DB seed sanity) — dev-time tools, not bundled into the
  app. They are near-duplicates of each other; consider consolidating into `scripts/` later, but
  they can be useful for manual verification.

## Also noted (cosmetic, not acted on)

- A handful of single unused exports inside otherwise-live files (e.g. `LoginResponse` type in
  `authApi.ts`, `CONTRACT_APPROVAL_STEPS` in `utils/contracts.ts`, `sanitizeInput` variants in
  `sanitizer.ts`). These are one-line trims with no bundle impact; left for a future tidy pass.

---

## Verification after removal

| Gate | Command | Result |
|---|---|---|
| Types | `npm run lint` (`tsc --noEmit`) | ✅ exit 0 |
| Unit tests | `vitest run trainingPipeline executiveStats force-number` | ✅ 27/27 passed |
| Build | `npm run build` (vite + esbuild server) | ✅ exit 0 |

(Server-dependent integration suites remain excluded per prior findings: they require a live API on
`:3000` and fail identically on the pristine tree due to login rate-limiting.)

## Recommended follow-ups

1. Consolidate the four root-level debug scripts into `scripts/` with a README note.
2. Adopt or delete the unused RBAC helper functions in a deliberate pass (they document intent).
3. Enable ESLint `no-unused-vars`/`unused-imports` plugin in CI to prevent re-accumulation.
