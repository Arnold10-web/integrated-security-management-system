# ISCMS Documentation

Project documentation for the Integrated Security Company Management System.

## Specs (`specs/`)

| Document | Purpose |
|---|---|
| [`master-spec.md`](specs/master-spec.md) | Master project constitution: requirements, architecture, data model, API surface, role-level access matrix (§28), build record (§30) — **plus the Implementation Lockdown Spec (Part II, §§31–45), the authoritative behavioural source of truth** for org structure, RBAC, and workflow chains. |
| [`project-review-and-workplan.md`](specs/project-review-and-workplan.md) | Consolidated code review + role-centric workspace & workflow blueprint with implementation history (Parts 1–6). |

**Precedence:** within `master-spec.md`, §§31–45 override earlier sections; master-spec overrides the workplan.

## Modules (`modules/`)

| Document | Purpose |
|---|---|
| [`digital-contracts.md`](modules/digital-contracts.md) | Digital Contracts system (v2.8 PDF-based): usage guide, architecture, security model, API reference, deployment checklist. |

## Reference

| Document | Purpose |
|---|---|
| [`test-logins.md`](test-logins.md) | Seeded test accounts (shared password `password123`). |
| [`UI_TEXT_GUIDELINES.md`](UI_TEXT_GUIDELINES.md) | Standards for user-facing text and tooltips: removing generic copy, contextual empty states, when/how to write tooltips, print-document text rules, review checklist. |
| [`DEAD_CODE_FINDINGS_2026-08-24.md`](DEAD_CODE_FINDINGS_2026-08-24.md) | Dead-code sweep results: 21 orphaned files removed (~2,540 lines), items kept intentionally. |
| [`project-review-findings-2026-08-23.md`](project-review-findings-2026-08-23.md) | Dated findings from the 2026-08-23 full-repo static review + live API probe. |

## Deployment notes (`../deploy/`)

| Document | Purpose |
|---|---|
| [`DEPLOY.md`](../deploy/DEPLOY.md) | Deploy on the in-house HP ProLiant microserver (UAT). |
| [`HARDENING.md`](../deploy/HARDENING.md) | Internet-facing hardening checklist. |
| [`railway-lockfile-fix.md`](../deploy/railway-lockfile-fix.md) | Fix for Railway `bun install --frozen-lockfile` failures. |

## Conventions

- Filenames are kebab-case.
- Historical session logs were removed from the repo; the durable outcome of each batch lives in `specs/master-spec.md` §30 and `specs/project-review-and-workplan.md`.
- **Terminology (v3.3):** personnel records formerly called "guards" are **Security Officers** platform-wide (model `SecurityOfficer`, key `forceNumber`, role `Security Officer`). Dated documents may retain the legacy term as historical wording.
