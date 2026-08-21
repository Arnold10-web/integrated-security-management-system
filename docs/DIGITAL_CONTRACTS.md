# Digital Contracts System — Documentation

## Overview

The Digital Contracts module replaces the old HTML-based e-signature system with a PDF-based workflow. Fixed legal contract PDFs are uploaded as templates, contracts are created from those templates with auto-generated IDs, signed sequentially (internal signers first, then client via secure link), and stored with tamper-evident SHA-256 hashes.

**Key principle:** The uploaded PDF template is the source of truth. The system never modifies the contract wording — it only fills in client-specific fields and overlays signatures + company stamp.

---

## How It Works (End-to-End)

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

#### Signing Link Security
- 64-character hexadecimal token (256-bit entropy)
- 14-day expiration
- Rate limited: 30 requests per 15 minutes per token
- Single-use: once signed, the link is consumed
- IP address and user agent logged for audit

### Step 5: Finalization

When **all 4 signers** have signed:

1. The system loads the **original template PDF** (all 14 pages of legal text preserved)
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

---

## Contract Lifecycle

```
Draft → PendingApproval (Client only) → PendingSigning → PartiallySigned → FullySigned → Archived
```

| Status | Description |
|--------|-------------|
| Draft | Contract created, editable by creator |
| PendingApproval | Awaiting General Manager approval (Client Contracts only) |
| PendingSigning | Approved, signing workflow initiated |
| PartiallySigned | Some signers have signed, waiting for others |
| FullySigned | All signers completed, PDF finalized with hash |
| Archived | Contract moved to archive (read-only) |

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

### Templates
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

### Contracts
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

## File Storage Structure

```
digital_contracts/
├── templates/
│   └── {templateId}.pdf                    # Original template PDFs
├── contracts/
│   └── finalized_{contractId}_{ts}.pdf     # Finalized signed PDFs
├── scans/
│   └── scanned_{contractId}_{ts}.pdf       # Scanned old contracts
└── stamps/
    └── company_stamp.{png|jpg}             # Company stamp image
```

---

## Preparing Your Template PDF

Before uploading your actual contract PDF, ensure:

1. **All company details are filled in** — Company name, location, bank details, advocates, etc. These are constant and baked into the template.
2. **Placeholders for client fields** — Use clear markers like `{CLIENT_NAME}`, `{CLIENT_LOCATION}`, etc. The system stores these in `filledFields` for mail merge.
3. **Signature areas are clearly marked** — The system appends a signature certificate page at the end, but you may also want signature lines in the main contract body (for visual reference only — actual signatures go on the certificate page).
4. **PDF is finalized** — No editable form fields needed. The system handles field population and signature overlay separately.
5. **All pages are included** — The system preserves every page exactly as uploaded. If your contract is 14 pages, all 14 pages will be in the final PDF.

### Company Stamp

Upload your company stamp image (PNG or JPG) before creating contracts:

1. Navigate to **Digital Contracts** → **Templates** tab
2. Use the **Company Stamp** section at the top
3. Upload a clean image of your company stamp/seal
4. The stamp will be automatically overlaid on the signature certificate page of all finalized contracts

**Recommendations:**
- Use a transparent PNG for best results
- Ensure the stamp image is clear and at least 300 DPI
- The stamp is placed on the signature certificate page (bottom-right area)
- You can replace the stamp at any time — it only affects future contracts

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

- **AES-256-GCM encryption** for sensitive fields (signer emails)
- **SHA-256 document hashing** for tamper evidence on finalized PDFs
- **Secure tokens** — 256-bit entropy, single-use, 14-day expiry
- **Rate limiting** — 30 requests per 15 minutes per signing token
- **Sequential signing** — Enforced server-side, cannot be bypassed
- **Audit logging** — Every action (create, view, sign, decline, archive) logged with IP and user agent
- **PDF path traversal protection** — Template and contract file access validated against storage directories
- **Company stamp** — Overlayed on finalized contracts for official authentication
