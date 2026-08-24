# ISCMS Documentation

Project documentation for the Integrated Security Company Management System.

## Specs (`specs/`)

| Document | Purpose |
|---|---|
| [`implementation-lockdown-spec.md`](specs/implementation-lockdown-spec.md) | **Single source of truth** for how ISCMS is supposed to behave — org structure, RBAC, and every workflow chain. Supersedes the other specs where they conflict. |
| [`master-spec.md`](specs/master-spec.md) | Master project constitution: requirements, architecture, data model, API surface, role-level access, implementation record (§30 changelog). |
| [`project-review-and-workplan.md`](specs/project-review-and-workplan.md) | Consolidated code review + role-centric workspace & workflow blueprint with implementation history (Parts 1–6). |

**Precedence:** lockdown spec > master spec > workplan.

## Modules (`modules/`)

| Document | Purpose |
|---|---|
| [`digital-contracts.md`](modules/digital-contracts.md) | Digital Contracts system (v2.8 PDF-based): usage guide, architecture, security model, API reference, deployment checklist. |

## Reference

| Document | Purpose |
|---|---|
| [`test-logins.md`](test-logins.md) | Seeded test accounts (shared password `password123`). |
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
