# Digital Contract System — Architecture & Security Review

> **This document reflects the v2.8 PDF-based Digital Contracts system.**
> The old HTML-based e-signature system (Puppeteer, session-based admin, HTML templates) has been fully replaced.
> This document serves as the architectural reference and protection spec for the current system.

---

## 1. System Overview

The Digital Contracts module is a PDF-based contract lifecycle management system built into ISCMS. It handles:

- **Template management** — Fixed legal PDF contracts uploaded once, reused across many contracts
- **Contract creation** — 6-step wizard filling in client-specific fields
- **Approval workflow** — General Manager approval gate for Client Contracts
- **Sequential signing** — Internal signers first, then client signers via secure public links
- **Company stamp** — Overlayed on finalized contracts
- **PDF finalization** — Original template preserved, signature certificate page appended
- **Tamper evidence** — SHA-256 hash of the finalized PDF
- **Scanned old contracts** — Digitization of paper contracts with `SCAN-YYYY-ABBREV-NNN` IDs

---

## 2. Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| PDF manipulation | pdf-lib | Load template PDFs, embed signatures/stamp, append certificate page |
| File storage | Local filesystem | Template PDFs, finalized PDFs, scanned PDFs, stamp images |
| Database | Prisma + PostgreSQL | Contract metadata, signer records, audit logs |
| Auth | JWT (existing ISCMS auth) | Admin route protection |
| Signing | Public secure tokens | Client signers access without login |
| Validation | Zod v4 | Schema validation on all API endpoints |

### 2.2 File Storage Structure

```
digital_contracts/
├── templates/
│   └── {templateId}.pdf                    # Original template PDFs (NEVER modified)
├── contracts/
│   └── finalized_{contractId}_{ts}.pdf     # Finalized signed PDFs
├── scans/
│   └── scanned_{contractId}_{ts}.pdf       # Scanned old contracts
└── stamps/
    └── company_stamp.{png|jpg}             # Company stamp image
```

### 2.3 Database Models

```
PdfContractTemplate     — Template metadata (name, category, page count, file path)
DigitalContract         — Contract record (ID, type, status, filled fields, hash, paths)
DigitalContractSigner   — Signer record (name, token, signature data, completion status)
DigitalContractAudit    — Audit trail (event type, description, IP, user agent, crypto hash)
```

---

## 3. Contract Lifecycle

```
Draft → PendingApproval (Client only) → PendingSigning → PartiallySigned → FullySigned → Archived
```

| Status | Description | Who triggers |
|--------|-------------|-------------|
| Draft | Contract created, editable by creator | BDM / HR Manager / Sales Supervisor |
| PendingApproval | Awaiting GM approval (Client Contracts only) | BDM / Sales Supervisor |
| PendingSigning | Approved, signing workflow initiated | Creator |
| PartiallySigned | Some signers completed, waiting for others | System (auto) |
| FullySigned | All signers completed, PDF finalized | System (auto) |
| Archived | Contract moved to archive (read-only) | Records Officer |

---

## 4. Signing Workflow

### 4.1 Sequential Signing Enforcement

Signing is strictly sequential — enforced server-side:

1. Creator initiates signing → contract moves to `PendingSigning`
2. Signer 1 (Company Representative) receives secure link
3. Signer 1 signs → system advances to Signer 2
4. Signer 2 (Company Witness) signs → system advances to Signer 3
5. Signer 3 (Client Representative) signs → system advances to Signer 4
6. Signer 4 (Client Witness) signs → system finalizes the PDF

**Server-side check:** When a signer accesses their link, the system verifies it's their turn by comparing their position in the `signingOrder` array against `currentSignerIndex`. If it's not their turn, access is denied.

### 4.2 Secure Token Properties

| Property | Value |
|----------|-------|
| Length | 64 hexadecimal characters (256-bit entropy) |
| Generation | `crypto.randomBytes(32).toString('hex')` — CSPRNG |
| Expiry | 14 days from creation |
| Rate limit | 30 requests per 15 minutes per token |
| Usage | Single-use — once signed, the link is consumed |
| Audit | IP address and user agent logged on every access |

### 4.3 Client Signing Experience

Client signers access a standalone page at `/digital-sign/{token}` — no login required:

1. Page loads the contract PDF in an embedded viewer
2. Signer reads the full contract (all pages preserved)
3. Electronic Record and Signature Disclosure consent checkbox
4. Signer draws signature on canvas (mouse, touch, or stylus)
5. Clicks "Sign & Complete"
6. Signature captured as PNG data URL, sent to server
7. Server validates, stores, and advances to next signer

---

## 5. PDF Finalization

When all signers have signed:

1. **Load original template PDF** — The original uploaded PDF (all pages of legal text preserved exactly)
2. **Append Signature Certificate page** — A new page added at the end containing:
   - Contract ID and title
   - Finalization timestamp
   - All 4 signature images with names, titles, and signing timestamps
3. **Overlay company stamp** — If a stamp image is uploaded, it's drawn on the certificate page
4. **Compute SHA-256 hash** — Hash of the complete finalized PDF bytes for tamper evidence
5. **Store finalized PDF** — Saved to `digital_contracts/contracts/`
6. **Update contract status** — `FullySigned` with `finalizedPdfPath` and `documentHash`

**Critical:** The original template PDF pages are NEVER modified. Only the signature certificate page is appended.

---

## 6. Contract ID Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Client Contract | `CC-YYYY-ABBREV-NNN` | `CC-2026-URA-001` |
| Staff Contract | `SC-FORCENUMBER-NNN` | `SC-SG-2024-001-001` |
| Scanned (Old Paper) | `SCAN-YYYY-ABBREV-NNN` | `SCAN-2023-KAM-001` |

- **ABBREV** — Auto-generated from first letter of each word in company name (e.g., "Uganda Revenue Authority" → "URA"). User can override.
- **NNN** — Sequential counter per client abbreviation. Resets each year for Client/Scanned. For Staff, tracks contract history per employee.

---

## 7. Security Features

### 7.1 Authentication & Authorization

- **Admin routes** — Protected by existing ISCMS JWT authentication (`authenticateToken` middleware)
- **Module-level RBAC** — `requireModuleAccess("esign")` middleware on all Digital Contracts routes
- **Role-based access** — Records Officer (full), BDM (create + sign), HR Manager (create + sign), General Manager (full), Finance Manager (sign only)
- **Public signing routes** — No auth required, but protected by secure token + rate limiting

### 7.2 Token Security

- **CSPRNG generation** — `crypto.randomBytes(32)` — not `Math.random()` or sequential IDs
- **256-bit entropy** — Brute-force infeasible (2^256 possibilities)
- **14-day expiry** — Tokens auto-expire, preventing stale link abuse
- **Single-use** — Once signed, the token is consumed and cannot be reused
- **Rate limiting** — 30 requests per 15 minutes per token prevents brute-force

### 7.3 Signature Validation

- **Data URI validation** — Signature must be a valid PNG/JPEG data URL
- **Size limits** — Rejects empty or oversized signature payloads
- **Canvas-only** — Signatures must be drawn on the canvas (not uploaded as files)

### 7.4 Tamper Evidence

- **SHA-256 hash** — Computed over the complete finalized PDF bytes
- **Stored in database** — `documentHash` field on the contract record
- **Audit logged** — Hash recorded in `DigitalContractAudit` with `cryptoHash` field
- **Verification** — Any modification to the finalized PDF will produce a different hash

### 7.5 File Storage Security

- **Path traversal protection** — Template and contract file access validated against storage directories
- **Directory isolation** — Templates, contracts, scans, and stamps stored in separate subdirectories
- **No static serving** — PDFs served through authenticated API endpoints only

### 7.6 Audit Trail

Every action is logged in `DigitalContractAudit`:

| Event Type | Description |
|-----------|-------------|
| Created | Contract created from template |
| Viewed | Signing page accessed (with IP + user agent) |
| Signed | Signature captured (with signer name, IP, user agent) |
| Declined | Signer declined (with reason) |
| Approved | GM approved contract content |
| SentForSigning | Signing workflow initiated |
| Completed | All signers finished, PDF finalized (with crypto hash) |
| Archived | Contract archived |

### 7.7 Input Validation

- **Zod schemas** — All API endpoints validate request body with Zod v4
- **File type validation** — PDF files validated by magic bytes (`%PDF-`), images by MIME type
- **File size limits** — Templates: 10MB, Stamps: 5MB, Scans: 20MB

---

## 8. API Endpoints

### 8.1 Templates (`/api/digital-contract-templates`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Records Officer+ | Upload template PDF |
| GET | `/` | All roles | List templates |
| GET | `/:id/pdf` | All roles | Download template PDF |
| PUT | `/:id` | Records Officer+ | Update template metadata |
| DELETE | `/:id` | Records Officer+ | Delete template |
| POST | `/stamp` | Records Officer+ | Upload company stamp image |
| GET | `/stamp` | All roles | Check if stamp exists |
| DELETE | `/stamp` | Records Officer+ | Remove company stamp |

### 8.2 Contracts (`/api/digital-contracts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | BDM/HR/GM | Create contract from template |
| GET | `/` | All roles | List contracts |
| GET | `/:id` | All roles | Get contract details |
| PUT | `/:id` | Creator | Update draft contract |
| POST | `/:id/approve` | General Manager | Approve Client Contract |
| POST | `/:id/send-for-signing` | Creator | Initiate signing workflow |
| POST | `/:id/archive` | Records Officer+ | Archive contract |
| POST | `/scan-upload` | Records Officer+ | Upload scanned contract |
| GET | `/:id/download` | All roles | Download finalized PDF |

### 8.3 Signing (Public — No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/digital-sign/:token` | Get contract for signing |
| POST | `/api/digital-sign/:token` | Submit signature |
| POST | `/api/digital-sign/:token/decline` | Decline to sign |

---

## 9. Compliance

### 9.1 eIDAS (EU)

The canvas-drawn signature constitutes a **Simple Electronic Signature (SES)** under eIDAS. SES is legally valid for most ordinary business contracts across the EU and most jurisdictions worldwide. For higher-stakes cross-border EU contracts requiring Advanced or Qualified Electronic Signatures (AdES/QES), integration with a qualified trust service provider would be needed — this is beyond the current scope.

### 9.2 ESIGN Act (US)

The system complies with the ESIGN Act requirements:
- **Intent to sign** — Consent checkbox before signing
- **Association with record** — Signature linked to specific contract
- **Record retention** — Finalized PDFs stored with tamper-evident hashes
- **Opt-out rights** — Signers can decline to sign

### 9.3 Data Retention

- Contracts are never hard-deleted — voided or archived only
- Finalized PDFs stored indefinitely with SHA-256 hashes
- Audit trail retained for all contract actions
- GDPR retention policy should be documented separately with stated legal basis

---

## 10. What Changed from the Old System

| Aspect | Old System (HTML-based) | New System (PDF-based) |
|--------|------------------------|----------------------|
| Templates | HTML with `{{variables}}` | Fixed PDF documents |
| Rendering | Puppeteer HTML→PDF | pdf-lib PDF manipulation |
| Signatures | Single signer per contract | 4 sequential signers |
| Company stamp | Not supported | Overlayed on finalized PDF |
| Contract IDs | Sequential numbers | `CC-YYYY-ABBREV-NNN` format |
| Approval | None | GM approval gate for Client Contracts |
| Finalization | New PDF generated from HTML | Original template preserved, certificate appended |
| Tamper evidence | Hash of signature + contract ID | SHA-256 of complete finalized PDF bytes |
| Admin interface | Standalone admin dashboard | Integrated into ISCMS sidebar |
| Auth | Session-based admin login | JWT-based (existing ISCMS auth) |
| Database | Raw SQL with `pg` pool | Prisma ORM with PostgreSQL |
| Security | Manual implementation | Zod validation, rate limiting, audit logging |

---

## 11. Deployment Checklist

- [ ] Ensure `digital_contracts/` directory exists and is writable by the Node process
- [ ] Upload company stamp image (PNG/JPG) via Digital Contracts → Templates tab
- [ ] Upload actual contract PDF templates (e.g., client security services contract)
- [ ] Verify template PDFs are complete with all company details pre-filled
- [ ] Test contract creation with sample client data
- [ ] Test signing workflow with internal signers
- [ ] Test client signing via secure link
- [ ] Verify finalized PDF preserves all template pages + signature certificate + stamp
- [ ] Verify SHA-256 hash is computed and stored
- [ ] Test scanned old contract upload
- [ ] Confirm role-based access for all user roles
- [ ] Verify audit trail entries for all actions

---

## 12. File Reference

```
src/
├── routes/
│   ├── digitalContractTemplates.ts    # Template CRUD + stamp upload
│   ├── digitalContracts.ts            # Contract CRUD + approval + archive
│   └── digitalSigning.ts              # Public signing API + PDF finalization
├── services/
│   └── digitalContractPdfService.ts   # PDF/storage services (templates, contracts, scans, stamps)
├── utils/
│   ├── digitalContractSecurity.ts     # Token generation, encryption, hashing
│   └── contractIdGenerator.ts         # Auto-generated contract IDs
├── components/
│   ├── organisms/
│   │   ├── SimpleTemplateUploader.tsx     # PDF template upload form
│   │   ├── DigitalContractWizard.tsx      # 6-step contract creation wizard
│   │   ├── EmbeddedSigningWidget.tsx      # Signing widget
│   │   └── PdfTemplateBuilder.tsx         # Legacy drag-and-drop builder (superseded)
│   └── views/
│       └── DigitalContractsView.tsx       # Main view (templates + contracts tabs)
├── constants/
│   └── modules.ts                     # Tab renamed to "Digital Contracts"
├── config/
│   └── permissions.ts                 # Records Officer + General Manager access
└── public/
    └── digital-sign.html              # Standalone signing page (canvas signature)
```

---

*This document reflects the Digital Contracts system as of v2.8. It is the single reference for architecture, security, and deployment of the contract system. Any future code changes must not break the contract lifecycle, signing workflow, PDF finalization, or audit trail without updating this document first.*
