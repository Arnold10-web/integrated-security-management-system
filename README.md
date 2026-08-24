<div align="center">
<img width="1200" height="475" alt="GHBanner" src="" />
</div>



## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Seed the database with test data (26 users, guards, sites, contracts, incidents):
   `npm run seed`
3. Run the app:
   `npm run dev`

## Documentation

See [`docs/README.md`](docs/README.md) for the full index. Start with:

- `docs/specs/implementation-lockdown-spec.md` — source of truth for system behaviour (RBAC, workflows)
- `docs/specs/master-spec.md` — master constitution: requirements, architecture, implementation record
- `docs/test-logins.md` — seeded test accounts
- `deploy/DEPLOY.md` — UAT deployment on the in-house server
