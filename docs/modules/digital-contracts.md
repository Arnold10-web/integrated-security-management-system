# Digital Contracts System

> **This document reflects the v2.8 PDF-based Digital Contracts system** and is the single reference for its architecture, security, day-to-day operation, and deployment. Any future code changes must not break the contract lifecycle, signing workflow, PDF finalization, or audit trail without updating this document first.
>
> The old HTML-based e-signature system (Puppeteer, session-based admin, HTML templates) has been fully replaced.

---

## Overview

The Digital Contracts module is a PDF-based contract lifecycle management system built into ISCMS. It handles:

- **Template management** — Fixed legal PDF contracts uploaded once, reused across many contracts
- **Contract creation** — 6-step wizard filling in client-specific fields
- **Approval workflow** — General Manager approval gate for Client Contracts
- **Sequential signing** — Internal signers first, then client signers via secure public links
- **Company stamp** — Overlayed on finalized contracts
- **PDF finalization** — Original template preserved, signature certificate page appended
- **Tamper evidence** — SHA-256 hash of the finalized PDF
- **Scanned old contracts** — Digitization of paper contracts with `SCAN-YYYY-ABBREV-NNN` IDs

**Key principle:** The uploaded PDF template is the source of truth. The system never modifies the contract wording — it only fills in client-specific fields and overlays signatures + company stamp.

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| PDF manipulation | pdf-lib | Load template PDFs, embed signatures/stamp, append certificate page |
| File storage | Local filesystem | Template PDFs, finalized PDFs, scanned PDFs, stamp images |
| Database | Prisma + PostgreSQL | Contract metadata, signer records, audit logs |
| Auth | JWT (existing ISCMS auth) | Admin route protection |
| Signing | Public secure tokens | Client signers access without login |
| Validation | Zod v4 | Schema validation on all API endpoints |

### File Storage Structure

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

### Data Models

```
PdfContractTemplate     — Template metadata (name, category, page count, file path)
DigitalContract         — Contract record (ID, type, status, filled fields, hash, paths)
DigitalContractSigner   — Signer record (name, token, signature data, completion status)
DigitalContractAudit    — Audit trail (event type, description, IP, user agent, crypto hash)
```

Full Prisma schemas: see [Database Schema](#database-schema-key-models).

---

## How It Works (End-to-End Usage)

### Step 0: Upload Company Stamp (Records Officer — one-time setup)

Before creating contracts, upload your company stamp image:

1. Navigate to **Digital Contracts** → **Templates** tab
2. Find the **Company Stamp** section at the top
3. Select a PNG or JPG image of your company stamp
4. Click **Upload Stamp**

**What happens:**
- The stamp image is stored at `digital_contracts/stamps/company_stamp.{png|jpg}`
- It will be automatically overlaid on the signature certificate page of all finalized contracts
- You can remove and replace the stamp at any time

**Important:** The stamp should be a clean image (transparent background recommended) of your official company stamp/seal.

### Step 1: Upload a Template (Records Officer)

1. Navigate to **Digital Contracts** → **Templates** tab
2. Click **Upload Template**
3. Fill in:
   - **Template Name** — e.g., "Client Security Services Contract"
   - **Category** — "Client" or "Staff"
   - **Description** — brief notes about the template
4. Select your **PDF file** (the actual contract document)
5. Click **Upload**

**What happens:**
- The PDF is stored at `digital_contracts/templates/{templateId}.pdf`
- The system records the page count and file size
- The template is now available for contract creation

**Important:** Your PDF must be the complete, finalized contract with all legal text, clauses, and formatting. The system preserves every page exactly as uploaded.

### Step 2: Create a Contract (BDM / Sales Supervisor / HR Manager)

1. Navigate to **Digital Contracts** → **Contracts** tab
2. Click **Create Contract**
3. The 6-step wizard guides you through:

#### Step 1 — Select Template
Choose the uploaded template PDF.

#### Step 2 — Client Details
Fill in the client-specific information:
- Client / Company Name (required)
- Client Location (required)
- Contact Person
- Designation / Position
- Phone
- Email
- Postal Address

These values are stored in `filledFields` (JSON) and can be used to populate the PDF template via mail merge or form fields.

#### Step 3 — Service Details (APPENDIX A)
Define the security services:
- Service Location (required)
- Service Description (defaults to "Security guard services")
- Number of Guards
- Day Shift Rate (UGX per guard)
- Night Shift Rate (UGX per guard)
- Auto-calculated: Day Total, Night Total, Sub Total, VAT (18%), Grand Total

#### Step 4 — Contract Dates
- Contract Date (required)
- Effective Date (required)
- End Date
- Contract Title (auto-generated from client name, or custom)

#### Step 5 — Signatories
Four signature blocks are pre-configured:
1. **Company Representative** — e.g., Managing Director
2. **Company Witness** — e.g., HR Manager
3. **Client Representative** — e.g., Security Manager
4. **Client Witness** — e.g., Procurement Officer

Each signer needs: Full Name (required), Title, Email (for notifications).

#### Step 6 — Review & Create
Review all details and click **Create Contract**.

**What happens:**
- A unique Contract ID is auto-generated (see [Contract ID Naming](#contract-id-naming))
- The contract is created in **Draft** status
- Signers are created with secure tokens (64-char hex, 14-day expiry)
- An audit log entry is recorded

### Step 3: Approval (General Manager — Client Contracts Only)

For **Client Contracts** only:
1. The General Manager reviews the draft contract
2. Clicks **Approve** to move it to **PendingSigning** status
3. This is an optional approval gate — Staff Contracts skip this step

### Step 4: Signing Workflow

Signing is **sequential** — each signer must sign in order before the next can access their link.

#### Internal Signers (Company Rep → Company Witness)
1. The system generates a secure signing link for each internal signer
2. Signers draw their signature on a canvas (mouse, touch, or stylus)
3. The signature is captured as a PNG data URL
4. After signing, the system advances to the next signer

#### Client Signers (Client Rep → Client Witness)
1. After all internal signers complete, the contract status changes to show client signing is ready
2. Client signers receive their secure links
3. They sign using the same canvas interface
4. The standalone signing page (`/digital-sign/{token}`) works on any device — no login required

### Step 5: Finalization

When **all 4 signers** have signed:

1. The system loads the **original template PDF** (all pages of legal text preserved exactly)
2. A **Signature Certificate page** is appended at the end containing:
   - Contract ID and title
   - Finalization timestamp
   - All 4 signature images with names, titles, and signing timestamps
3. The **company stamp** is overlaid on the signature certificate page (if uploaded)
4. The finalized PDF is stored at `digital_contracts/contracts/finalized_{contractId}_{timestamp}.pdf`
5. A **SHA-256 hash** is computed for tamper evidence
6. Contract status changes to **FullySigned**

**Critical:** The original template PDF pages are NEVER modified. Only the signature certificate page is appended.

---

## Contract Lifecycle

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

## Signing Workflow Details

### Sequential Signing Enforcement

Signing is strictly sequential — enforced server-side:

1. Creator initiates signing → contract moves to `PendingSigning`
2. Signer 1 (Company Representative) receives secure link
3. Signer 1 signs → system advances to Signer 2
4. Signer 2 (Company Witness) signs → system advances to Signer 3
5. Signer 3 (Client Representative) signs → system advances to Signer 4
6. Signer 4 (Client Witness) signs → system finalizes the PDF

**Server-side check:** When a signer accesses their link, the system verifies it's their turn by comparing their position in the `signingOrder` array against `currentSignerIndex`. If it's not their turn, access is denied.

### Secure Token Properties

| Property | Value |
|----------|-------|
| Length | 64 hexadecimal characters (256-bit entropy) |
| Generation | `crypto.randomBytes(32).toString('hex')` — CSPRNG |
| Expiry | 14 days from creation |
| Rate limit | 30 requests per 15 minutes per token |
| Usage | Single-use — once signed, the link is consumed |
| Audit | IP address and user agent logged on every access |

### Client Signing Experience

Client signers access a standalone page at `/digital-sign/{token}` — no login required:

1. Page loads the contract PDF in an embedded viewer
2. Signer reads the full contract (all pages preserved)
3. Electronic Record and Signature Disclosure consent checkbox
4. Signer draws signature on canvas (mouse, touch, or stylus)
5. Clicks "Sign & Complete"
6. Signature captured as PNG data URL, sent to server
7. Server validates, stores, and advances to next signer

---

## Contract ID Naming

| Type | Format | Example |
|------|--------|---------|
| Client Contract | `CC-YYYY-ABBREV-NNN` | `CC-2026-URA-001` |
| Staff Contract | `SC-FORCENUMBER-NNN` | `SC-SG-2024-001-001` |
| Scanned (Old Paper) | `SCAN-YYYY-ABBREV-NNN` | `SCAN-2023-KAM-001` |

- **ABBREV** — Auto-generated from the first letter of each word in the company name (e.g., "Uganda Revenue Authority" → "URA"). Can be overridden when creating a contract.
- **NNN** — Sequential counter per client abbreviation, resets each year for Client/Scanned contracts. For Staff contracts, the sequence number tracks contract history per employee.
- **FORCENUMBER** — The staff member's force number (e.g., "SG-2024-001").

---

## Role-Based Access

| Role | Access Level | Can Do |
|------|-------------|--------|
| **Records Officer** | Full | Upload templates, view signed contracts, archive, manage inquiries |
| **BDM / Sales Supervisor** | Create + Sign | Create Client Contracts from templates |
| **HR Manager** | Create + Sign | Create Staff Contracts from templates |
| **General Manager** | Full | Approve + Sign Client Contracts, view all |
| **Finance Manager** | Sign Only | Sign Client Contracts only |
| **Public (no login)** | Sign Only | Client signers access secure links to sign |

Enforcement layers:
- **Admin routes** — Protected by existing ISCMS JWT authentication (`authenticateToken` middleware)
- **Module-level RBAC** — `requireModuleAccess("esign")` middleware on all Digital Contracts routes
- **Public signing routes** — No auth required, but protected by secure token + rate limiting

---

## Scanned Old Contracts

Old paper contracts can be digitized:
1. Click **Upload Scanned Contract** in the Digital Contracts tab
2. Upload the scanned PDF
3. Enter metadata: title, client name, dates, value
4. The system generates a `SCAN-YYYY-ABBREV-NNN` ID
5. The contract appears as **FullySigned** (no signing needed)

---

## API Endpoints

### Templates (`/api/digital-contract-templates`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/digital-contract-templates` | Records Officer+ | Upload template PDF |
| GET | `/api/digital-contract-templates` | All roles | List templates |
| GET | `/api/digital-contract-templates/:id/pdf` | All roles | Download template PDF |
| PUT | `/api/digital-contract-templates/:id` | Records Officer+ | Update template metadata |
| DELETE | `/api/digital-contract-templates/:id` | Records Officer+ | Delete template |
| POST | `/api/digital-contract-templates/stamp` | Records Officer+ | Upload company stamp image |
| GET | `/api/digital-contract-templates/stamp` | All roles | Check if stamp exists |
| DELETE | `/api/digital-contract-templates/stamp` | Records Officer+ | Remove company stamp |

### Contracts (`/api/digital-contracts`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/digital-contracts` | BDM/HR/GM | Create contract from template |
| GET | `/api/digital-contracts` | All roles | List contracts |
| GET | `/api/digital-contracts/:id` | All roles | Get contract details |
| PUT | `/api/digital-contracts/:id` | Creator | Update draft contract |
| POST | `/api/digital-contracts/:id/approve` | General Manager | Approve Client Contract |
| POST | `/api/digital-contracts/:id/send-for-signing` | Creator | Initiate signing workflow |
| POST | `/api/digital-contracts/:id/archive` | Records Officer+ | Archive contract |
| POST | `/api/digital-contracts/scan-upload` | Records Officer+ | Upload scanned contract |
| GET | `/api/digital-contracts/:id/download` | All roles | Download finalized PDF |

### Signing (Public — No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/digital-sign/:token` | Get contract for signing |
| POST | `/api/digital-sign/:token` | Submit signature |
| POST | `/api/digital-sign/:token/decline` | Decline to sign |

---

## Preparing Your Template PDF

Before uploading your actual contract PDF, ensure:

1. **All company details are filled in** — Company name, location, bank details, advocates, etc. These are constant and baked into the template.
2. **Placeholders for client fields** — Use clear markers like `{CLIENT_NAME}`, `{CLIENT_LOCATION}`, etc. The system stores these in `filledFields` for mail merge.
3. **Signature areas are clearly marked** — The system appends a signature certificate page at the end, but you may also want signature lines in the main contract body (for visual reference only — actual signatures go on the certificate page).
4. **PDF is finalized** — No editable form fields needed. The system handles field population and signature overlay separately.
5. **All pages are included** — The system preserves every page exactly as uploaded. If your contract is 14 pages, all 14 pages will be in the final PDF.

### Company Stamp Recommendations

- Use a transparent PNG for best results
- Ensure the stamp image is clear and at least 300 DPI
- The stamp is placed on the signature certificate page (bottom-right area)
- You can replace the stamp at any time — it only affects future contracts

---

## Deployment Checklist

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

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Template upload fails | Ensure file is a valid PDF (starts with `%PDF-`). Max size: 20MB. |
| Contract ID already exists | The system auto-increments the counter. If you see a duplicate, check the database sequence. |
| Signing link says "expired" | Links expire after 14 days. Create a new contract or contact Records Officer. |
| "Not your turn to sign" | Signing is sequential. Wait for previous signers to complete. |
| Finalized PDF missing pages | Verify the template PDF was uploaded correctly. The system loads the original template file. |
| Signature image not embedded | Ensure the signature is drawn on the canvas (not uploaded as a file). Supported formats: PNG, JPEG. |

---

## Database Schema (Key Models)

```prisma
model PdfContractTemplate {
  id              String   @id @default(cuid())
  name            String
  category        String   // "Client", "Staff"
  description     String?
  pdfFileName     String
  fileSize        Int
  pageCount       Int      @default(1)
  filePath        String
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model DigitalContract {
  id                  String   @id @default(cuid())
  contractId          String   @unique  // CC-2026-URA-001
  contractType        String             // "Client", "Staff", "Scanned"
  title               String
  category            String
  templateId          String
  filledFields        Json               // Client-specific field values
  status              String   @default("Draft")
  signingOrder        Json               // Array of signer IDs
  currentSignerIndex  Int      @default(0)
  finalizedPdfPath    String?
  documentHash        String?            // SHA-256 tamper evidence
  isScanned           Boolean  @default(false)
  scannedPdfPath      String?
  isArchived          Boolean  @default(false)
  partyName           String?
  clientAbbreviation  String?
  forceNumber         String?
  startDate           DateTime?
  endDate             DateTime?
  valueUgx            Int?
  createdBy           String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model DigitalContractSigner {
  id              String    @id @default(cuid())
  contractId      String
  signerName      String
  signerTitle     String?
  signerEmail     String?   // Encrypted at rest
  signingOrder    Int
  secureToken     String    @unique  // 64-char hex
  expiresAt       DateTime
  signatureData   String?   // Base64 PNG data URL
  signedAt        DateTime?
  isCompleted     Boolean   @default(false)
  declinedAt      DateTime?
  declineReason   String?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime  @default(now())
}
```

---

## Security Features

### Authentication & Authorization
- Admin routes protected by existing ISCMS JWT authentication; module-level RBAC via `requireModuleAccess("esign")`; role matrix above.
- Public signing routes protected by secure token + rate limiting only.

### Token Security
- **CSPRNG generation** — `crypto.randomBytes(32)` — not `Math.random()` or sequential IDs
- **256-bit entropy** — Brute-force infeasible (2^256 possibilities)
- **14-day expiry** — Tokens auto-expire, preventing stale link abuse
- **Single-use** — Once signed, the token is consumed and cannot be reused
- **Rate limiting** — 30 requests per 15 minutes per token prevents brute-force

### Signature Validation
- **Data URI validation** — Signature must be a valid PNG/JPEG data URL
- **Size limits** — Rejects empty or oversized signature payloads
- **Canvas-only** — Signatures must be drawn on the canvas (not uploaded as files)

### Tamper Evidence
- **SHA-256 hash** — Computed over the complete finalized PDF bytes
- **Stored in database** — `documentHash` field on the contract record
- **Audit logged** — Hash recorded in `DigitalContractAudit` with `cryptoHash` field
- **Verification** — Any modification to the finalized PDF will produce a different hash

### File Storage Security
- **Path traversal protection** — Template and contract file access validated against storage directories
- **Directory isolation** — Templates, contracts, scans, and stamps stored in separate subdirectories
- **No static serving** — PDFs served through authenticated API endpoints only

### Audit Trail

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

### Input Validation
- **Zod schemas** — All API endpoints validate request body with Zod v4
- **File type validation** — PDF files validated by magic bytes (`%PDF-`), images by MIME type
- **File size limits** — Templates: 10MB, Stamps: 5MB, Scans: 20MB
- **AES-256-GCM encryption** for sensitive fields (signer emails)

---

## Compliance

### eIDAS (EU)

The canvas-drawn signature constitutes a **Simple Electronic Signature (SES)** under eIDAS. SES is legally valid for most ordinary business contracts across the EU and most jurisdictions worldwide. For higher-stakes cross-border EU contracts requiring Advanced or Qualified Electronic Signatures (AdES/QES), integration with a qualified trust service provider would be needed — this is beyond the current scope.

### ESIGN Act (US)

The system complies with the ESIGN Act requirements:
- **Intent to sign** — Consent checkbox before signing
- **Association with record** — Signature linked to specific contract
- **Record retention** — Finalized PDFs stored with tamper-evident hashes
- **Opt-out rights** — Signers can decline to sign

### Data Retention

- Contracts are never hard-deleted — voided or archived only
- Finalized PDFs stored indefinitely with SHA-256 hashes
- Audit trail retained for all contract actions
- GDPR retention policy should be documented separately with stated legal basis

---

## What Changed from the Old System

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

## File Reference

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
└── ../public/
    └── digital-sign.html              # Standalone signing page (canvas signature)
```
