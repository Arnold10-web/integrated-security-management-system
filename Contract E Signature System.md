# Contract E-Signature System — Security Review & Hardened Implementation Blueprint

This reviews the draft CLM (Contract Lifecycle Management) design and code you were
brainstorming, flags what's genuinely risky before this goes on an internet-facing
HP ProLiant MicroServer Gen10, and gives you fixed code + a rollout checklist.

**Read order if you're short on time:** Section 1 (critical fixes) → Section 4 (server
hardening) → Section 5 (adding your real templates). Sections 2–3 are the "why."

---

## 1. Critical fixes — do these before deployment

### 1.1 No authentication on admin routes

The three admin endpoints (`/api/admin/contracts`, `.../download/:id`,
`.../archive/:id`) have no auth middleware. On a server reachable from the internet,
that means anyone who guesses or finds the URL pattern can list every contract,
download signed PDFs by walking through IDs, or archive records.

Add a login-gated session and a middleware that every admin route requires:

```javascript
const bcrypt = require('bcrypt');
const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET, // long random string, from env, never hardcoded
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, httpOnly: true, sameSite: 'strict', maxAge: 8 * 60 * 60 * 1000 }
}));

function requireAdmin(req, res, next) {
    if (!req.session.adminUserId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    next();
}

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await db.query('SELECT id, password_hash FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    req.session.adminUserId = result.rows[0].id;
    res.json({ success: true });
});

// Apply to every admin route:
app.get('/api/admin/contracts', requireAdmin, async (req, res) => { /* ... */ });
app.get('/api/admin/contracts/download/:id', requireAdmin, async (req, res) => { /* ... */ });
app.post('/api/admin/contracts/archive/:id', requireAdmin, async (req, res) => { /* ... */ });
```

`cookie.secure: true` requires HTTPS (see §4.1) — sessions won't work over plain
HTTP with that flag set, which is intentional: it forces you to terminate TLS
properly rather than accidentally running admin login over an unencrypted
connection.

### 1.2 Unsafe HTML injection into the Puppeteer-rendered PDF

`generateContractPDF` drops `base64Signature` straight into an `<img src="...">`
attribute with no validation. If that string isn't actually a clean PNG data URI —
say it contains a stray `"` — it can break out of the attribute and inject HTML/JS
into the page Puppeteer is about to render, and Puppeteer is launched with
`--no-sandbox`, which removes Chromium's process-isolation protection. Combined,
that's a path from "malformed request" to script execution inside your PDF
pipeline, and potentially to server-side request forgery (Puppeteer will happily
fetch any external URL referenced in the HTML, which could be used to probe your
internal network).

Fix both the input and the blast radius:

```javascript
// 1. Validate the signature is actually what you expect, reject anything else
const PNG_DATA_URI = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

function isValidSignature(dataUri) {
    if (typeof dataUri !== 'string' || !PNG_DATA_URI.test(dataUri)) return false;
    const approxBytes = (dataUri.length * 3) / 4;
    return approxBytes < 2 * 1024 * 1024; // reject absurdly large payloads
}

// In the sign-contract handler, before anything else:
if (!isValidSignature(signatureImage)) {
    return res.status(400).json({ error: 'Invalid signature data.' });
}

// 2. Stop Puppeteer from fetching anything off-box — no reason a signed
//    contract page needs to load external resources
async function generateContractPDF(contractTitle, contractHtml, base64Signature, auditLogs) {
    const browser = await puppeteer.launch({ headless: true }); // sandbox left ON
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url === 'about:blank') req.continue();
        else req.abort();
    });

    // ...rest unchanged, contractHtml itself now also needs escaping — see 1.3
}
```

Removing `--no-sandbox` is the right default; only add it back if you're running
Puppeteer inside a container where the kernel truly can't give it a sandbox, and
if you do, treat that container as a hard trust boundary (its own user, no
access to the rest of the filesystem, no outbound network beyond what §1.2's
interception already blocks).

### 1.3 Template variables aren't escaped

`parseTemplate` does a raw string-replace with no HTML escaping, and the result
gets set via `.innerHTML` on the signer's page. Anything stored in
`variable_data` — a client's name, an address, a free-text field — is inserted
as live HTML. If any of that data ever originates from a form a client filled
in (not just an internal admin), this is a straightforward stored-XSS path
into the signing page a client sees, and it also feeds into the PDF pipeline
from §1.2.

Swap the hand-rolled replace for something that escapes by default, and only
allow specific fields to skip escaping if you deliberately need rich text
(and even then, sanitize rather than trust):

```javascript
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseTemplate(htmlTemplate, variablesObj) {
    let compiledHtml = htmlTemplate;
    if (!variablesObj) return compiledHtml;
    for (const [key, value] of Object.entries(variablesObj)) {
        compiledHtml = compiledHtml.replace(new RegExp(`{{${key}}}`, 'g'), escapeHtml(value));
    }
    return compiledHtml;
}
```

If you outgrow this (conditionals, loops, repeated sections in templates),
switch to **Handlebars** — it escapes `{{var}}` by default and only skips
escaping for the explicit `{{{var}}}` triple-brace syntax, so the safe path is
the default rather than something you have to remember.

### 1.4 Hardcoded database credentials

```javascript
const db = new Pool({
    connectionString: process.env.DATABASE_URL
});
```

Put `DATABASE_URL` and every other secret (`SESSION_SECRET`, `DB_ENCRYPTION_KEY`)
in a `.env` file that's in `.gitignore`, never in a file that gets committed.

### 1.5 Token generation and lifetime

The draft references `secure_token` but never shows how it's created. Generate
it server-side with a CSPRNG, not `Math.random()` or a sequential ID:

```javascript
const crypto = require('crypto');
const secureToken = crypto.randomBytes(32).toString('hex');
```

Also add an expiry column (`expires_at`) and check it in both the fetch and
sign endpoints, and rate-limit both routes (see §1.6) so tokens can't be
brute-forced even though they're long.

### 1.6 No rate limiting or security headers

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const signingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use('/api/get-contract/', signingLimiter);
app.use('/api/sign-contract/', signingLimiter);

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/api/admin/login', loginLimiter);
```

### 1.7 Weak tamper-evidence hash

Right now the "tamper evidence" hash is `sha256(signatureImage + contractId)` —
it proves the signature blob wasn't altered, but says nothing about the
*contract text itself*. If someone edited the template after signing, this
hash wouldn't catch it. Hash the fully compiled document instead:

```javascript
const cryptoHash = crypto.createHash('sha256')
    .update(compiledContractBodyHtml + signatureImage + data.contract_id)
    .digest('hex');
```

Better still, hash the final generated PDF bytes once `generateContractPDF`
returns, and store *that* — it's the artifact you'll actually be asked to
verify later.

---

## 2. Correcting the compliance claims

Worth being precise about this, because overclaiming compliance is its own
legal risk — if a contract's enforceability is ever challenged, you want your
paperwork to match what the system actually does.

- **eIDAS (EU):** a canvas-drawn image, as implemented here, is a **Simple
  Electronic Signature (SES)**, not an Advanced or Qualified one (AdES/QES).
  SES is legally valid for most ordinary business contracts across the EU and
  most jurisdictions worldwide (this part of the original pitch is fine) —
  but AdES requires the signature to be uniquely linked to and capable of
  identifying the signer, created using means they alone control, and linked
  to the data such that any later change is detectable at a cryptographic
  level (typically PKI-based, not an image). If you'll ever need AdES/QES for
  higher-stakes cross-border EU contracts, that means integrating a qualified
  trust service provider — not something this architecture gets you on its
  own.
- **PDF/A (ISO 19005):** Puppeteer's `page.pdf()` produces a standard PDF, not
  a PDF/A file. True PDF/A conformance needs embedded fonts, specific XMP
  metadata, and constraints on encryption/transparency that aren't handled
  here. If long-term archival conformance actually matters for you, that's a
  separate conversion step (and something worth validating with a tool like
  veraPDF), not something to claim by default.
- **HIPAA:** only relevant if the contracts involve protected health
  information. Worth confirming that's actually in scope before spending
  effort on HIPAA-specific controls — otherwise it's scope creep that
  distracts from the fixes that do apply here.
- **GDPR retention vs. erasure:** "never delete" and the right to erasure
  (Art. 17) are in tension. It's a defensible position — retention for legal
  claims/tax-audit purposes is a recognized basis — but it needs to be written
  down as an explicit retention policy with a stated legal basis, not just
  assumed. Worth a short data retention policy document alongside this system.

---

## 3. Server hardening — HP ProLiant MicroServer Gen10, internet-facing

Since this box will be reachable from the internet via your ISP connection,
treat "internet-facing" as the operating assumption for every layer, not just
the app:

**Network edge**
- Don't expose Node directly. Put nginx or Caddy in front as a reverse proxy,
  terminating TLS (Let's Encrypt/certbot for free certs, auto-renewing).
  Only port 443 should be reachable from the WAN.
- Firewall (`ufw`/`iptables`): default-deny inbound, explicit allow for 443
  and whatever port you use for SSH management — and put SSH behind a VPN or
  restrict it to known IPs rather than leaving it open to the world.
- **iLO (the out-of-band management interface) must never be exposed to the
  internet.** Keep it on an isolated management VLAN or behind the same VPN,
  and change the default iLO credentials immediately if you haven't.
- Consider a tunnel service (e.g., Cloudflare Tunnel) as an alternative to
  directly forwarding ports on your ISP router — it avoids exposing your
  office's public IP and gives you a WAF/DDoS layer for free, at the cost of
  routing traffic through a third party, which is a trade-off worth thinking
  through for contract data specifically.

**Host**
- Run the Node process as a dedicated non-root user, not root.
- Enable unattended security upgrades (`unattended-upgrades` on
  Debian/Ubuntu) so OS-level CVEs get patched automatically.
- Disable SSH password auth entirely — key-only, plus `fail2ban` on top.
- Full-disk encryption (LUKS) on the volume holding `secure_storage` and the
  database, given this is a physical box that could be stolen, not a cloud VM
  with datacenter physical security.
- Postgres should bind to `localhost` only — never expose 5432 externally,
  firewall it regardless.

**Resilience**
- RAID (the Gen10 supports basic RAID configurations) for disk redundancy.
- A UPS — a physical server is vulnerable to power-loss corruption in a way a
  cloud instance isn't.
- Encrypted backups following the 3-2-1 rule (3 copies, 2 media types, 1
  offsite), with periodic *tested* restores, not just backup jobs that run
  and are never verified.
- Ship audit logs to a second location (a separate syslog target or
  append-only store) — if this server is ever compromised, you don't want the
  attacker able to also erase the evidence trail.

**Dependencies**
- `npm audit` regularly, and keep an eye on Puppeteer's bundled Chromium
  version specifically — it ships its own browser and needs updating
  independently of the OS.

---

## 4. Adding your organization's existing contract templates

Two approaches, both reusing the schema already in the draft:

### Option A — templates stored in the database (recommended)

Add a dedicated table so templates are managed independently of individual
contracts, and versioned:

```sql
CREATE TABLE contract_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    body_html TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

When a new contract is created from a template, **copy the resolved HTML into
`contracts.template_body` at creation time** rather than referencing the
template live — that column already exists in your schema. This matters for
two reasons: (1) if someone edits the base template later, contracts already
sent for signature won't silently change underneath the signer, and (2) it
keeps your tamper-evidence hash in §1.7 meaningful, since it's hashing the
exact text the signer actually saw.

```javascript
app.post('/api/admin/contracts', requireAdmin, async (req, res) => {
    const { templateId, title, variableData } = req.body;
    const template = await db.query('SELECT body_html FROM contract_templates WHERE id = $1', [templateId]);
    if (template.rows.length === 0) return res.status(404).json({ error: 'Template not found.' });

    const secureToken = crypto.randomBytes(32).toString('hex');
    await db.query(
        `INSERT INTO contracts (title, template_body, status) VALUES ($1, $2, 'pending') RETURNING id`,
        [title, template.rows[0].body_html]
    );
    // then create the corresponding contract_signers row with secureToken and variableData
});
```

### Converting your existing templates

Most likely your organization's contracts currently live as Word docs or
PDFs. To bring them in:

1. Convert each to clean, semantic HTML (headings, paragraphs, tables where
   needed — avoid copying over Word's inline style bloat).
2. Replace the variable parts (client name, dates, amounts, addresses) with
   `{{placeholder}}` tokens matching the `{{key}}` syntax the code already
   expects.
3. Insert each as a row in `contract_templates`.
4. If the templates have any conditional sections (e.g., a clause that only
   appears for certain contract types), that's the point where the custom
   regex replace stops being enough — worth switching to Handlebars at that
   stage, since it supports `{{#if}}` blocks natively and, as noted in §1.3,
   escapes by default.

### Option B — templates as files in the repo

If you'd rather keep templates in version control alongside the code (useful
if legal wants to track template changes via git diffs), store them as
`.html` files under a `/templates` directory, read with `fs.readFileSync` at
contract-creation time, but still copy the resolved content into
`contracts.template_body` — same reasoning as above. This is a reasonable
choice if template changes should go through code review; the DB approach is
better if non-technical staff need to update templates without a deploy.

---

## 6. Complete Implementation — Database Through Client

Everything below is meant to drop into an existing Node/Express + PostgreSQL
setup: new tables alongside what you already have, and a small set of files
you can add to your project structure. It implements every fix from Section 1
— auth on admin routes, escaped template variables, validated signatures,
sandboxed/network-restricted PDF rendering, CSPRNG tokens with expiry, rate
limiting, and full-document hashing — wired together end to end.

```
project-root/
├── .env                        # not committed — see 6.1
├── app.js                      # 6.9
├── db.js                       # 6.3
├── middleware/
│   └── auth.js                 # 6.5
├── routes/
│   ├── admin.js                # 6.7
│   └── signing.js              # 6.8
├── services/
│   └── pdf-generator.js        # 6.6
├── utils/
│   └── security.js             # 6.4
├── scripts/
│   └── create-admin.js         # 6.13
├── secure_storage/             # finalized PDFs land here — chmod 700
└── public/
    ├── sign.html                # 6.10
    └── admin/
        ├── login.html            # 6.11
        └── dashboard.html        # 6.12
```

### 6.1 Dependencies & environment

```bash
npm install express pg bcrypt express-session connect-pg-simple helmet express-rate-limit puppeteer dotenv
```

`.env` (never committed — add to `.gitignore`):

```
DATABASE_URL=postgresql://user:password@localhost:5432/contracts_db
SESSION_SECRET=replace_with_a_long_random_string
DB_ENCRYPTION_KEY=replace_with_a_different_long_random_string
PORT=3000
NODE_ENV=production
```

Generate strong values for the two secrets with, e.g., `openssl rand -hex 32`.

### 6.2 Database schema (full)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    body_html TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    template_id INTEGER REFERENCES contract_templates(id),
    template_body TEXT NOT NULL,          -- snapshot copied at creation time, see §4
    contract_type VARCHAR(100) DEFAULT 'Standard',
    status VARCHAR(50) DEFAULT 'pending', -- pending | signed | archived
    document_hash TEXT,                   -- full-document tamper-evidence hash, see §1.7
    finalized_pdf_path TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contract_signers (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    secure_token VARCHAR(64) UNIQUE NOT NULL,
    encrypted_email BYTEA NOT NULL,
    encrypted_variable_data BYTEA NOT NULL,
    signature_data TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_signers_token ON contract_signers(secure_token);

CREATE TABLE contract_audit_logs (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    event_type VARCHAR(100) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    crypto_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contracts_archive_status ON contracts(is_archived, status);
```

`connect-pg-simple` (the session store used in §6.9) creates its own
`session` table automatically on first run — nothing to add here for that.

### 6.3 `db.js` — connection pool

```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = pool;
```

### 6.4 `utils/security.js` — shared security helpers

```javascript
const crypto = require('crypto');

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

const PNG_DATA_URI = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

function isValidSignature(dataUri) {
    if (typeof dataUri !== 'string' || !PNG_DATA_URI.test(dataUri)) return false;
    const approxBytes = (dataUri.length * 3) / 4;
    return approxBytes > 500 && approxBytes < 2 * 1024 * 1024; // reject empty or oversized
}

// Escapes every substituted value by default — safe path is the default path.
function parseTemplate(htmlTemplate, variablesObj) {
    let compiledHtml = htmlTemplate;
    if (!variablesObj) return compiledHtml;
    for (const [key, value] of Object.entries(variablesObj)) {
        compiledHtml = compiledHtml.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), escapeHtml(value));
    }
    return compiledHtml;
}

function hashDocument(compiledHtml, signatureImage, contractId) {
    return crypto.createHash('sha256')
        .update(compiledHtml + signatureImage + contractId)
        .digest('hex');
}

module.exports = { escapeHtml, generateSecureToken, isValidSignature, parseTemplate, hashDocument };
```

### 6.5 `middleware/auth.js`

```javascript
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.adminUserId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    next();
}

module.exports = { requireAdmin };
```

### 6.6 `services/pdf-generator.js`

Sandbox stays on, network access is restricted to `data:` URIs only, and
every value coming from a request (audit fields, title) is escaped before
it's rendered — the earlier version of this function was the injection point
described in §1.2.

```javascript
const puppeteer = require('puppeteer');
const { escapeHtml } = require('../utils/security');

async function generateContractPDF(contractTitle, compiledContractHtml, base64Signature, auditLogs) {
    const browser = await puppeteer.launch({ headless: true }); // sandbox intentionally left on
    try {
        const page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.startsWith('data:') || url === 'about:blank') req.continue();
            else req.abort(); // no external fetches from inside the rendered document
        });

        const layout = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; line-height: 1.5; padding: 40px; color: #222; }
                    h1 { text-align: center; color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .signature-section { margin-top: 50px; page-break-inside: avoid; border-top: 1px solid #ccc; padding-top: 20px; }
                    .signature-img { border-bottom: 1px solid #000; max-width: 250px; height: auto; display: block; margin-top: 10px; }
                    .audit-section { margin-top: 80px; font-size: 11px; color: #555; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; page-break-inside: avoid; }
                    .audit-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .audit-table td { padding: 4px 0; vertical-align: top; }
                    .audit-title { font-weight: bold; font-size: 13px; color: #111; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(contractTitle)}</h1>
                <div class="contract-body">${compiledContractHtml}</div>
                <div class="signature-section">
                    <p><strong>Executed Electronically By:</strong></p>
                    <img class="signature-img" src="${base64Signature}" alt="Client Signature" />
                    <p style="font-size: 12px; color: #444; margin-top: 5px;">Date Signed: ${new Date().toUTCString()}</p>
                </div>
                <div class="audit-section">
                    <div class="audit-title">Security Audit Log Certificate</div>
                    <table class="audit-table">
                        <tr><td><strong>Signing IP Address:</strong></td><td>${escapeHtml(auditLogs.ip_address)}</td></tr>
                        <tr><td><strong>Client Browser Agent:</strong></td><td>${escapeHtml(auditLogs.user_agent)}</td></tr>
                        <tr><td><strong>Tamper Evidence SHA-256 Hash:</strong></td><td><code>${auditLogs.crypto_hash}</code></td></tr>
                    </table>
                </div>
            </body>
            </html>
        `;

        await page.setContent(layout, { waitUntil: 'networkidle0' });
        return await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '0.75in', right: '0.75in', bottom: '0.75in', left: '0.75in' }
        });
    } finally {
        await browser.close();
    }
}

module.exports = { generateContractPDF };
```

Note `base64Signature` is trusted here only because `routes/signing.js` (§6.8)
already validated it with `isValidSignature` before this function is ever
called — that check is what makes it safe to drop into the `src` attribute
unescaped (escaping a data URI would corrupt it).

### 6.7 `routes/admin.js`

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { generateSecureToken } = require('../utils/security');

// --- AUTH ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });

    const result = await db.query('SELECT id, password_hash FROM admin_users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

    req.session.adminUserId = result.rows[0].id;
    res.json({ success: true });
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', requireAdmin, (req, res) => res.json({ authenticated: true }));

// --- TEMPLATES ---
router.post('/templates', requireAdmin, async (req, res) => {
    const { name, bodyHtml } = req.body;
    if (!name || !bodyHtml) return res.status(400).json({ error: 'Name and body required.' });

    const result = await db.query(
        'INSERT INTO contract_templates (name, body_html) VALUES ($1, $2) RETURNING id, name, created_at',
        [name, bodyHtml]
    );
    res.json({ success: true, template: result.rows[0] });
});

router.get('/templates', requireAdmin, async (req, res) => {
    const result = await db.query('SELECT id, name, version, created_at FROM contract_templates ORDER BY created_at DESC');
    res.json({ success: true, templates: result.rows });
});

// --- CONTRACTS ---
router.post('/contracts', requireAdmin, async (req, res) => {
    const { templateId, title, contractType, signerEmail, variableData } = req.body;
    if (!templateId || !title || !signerEmail) {
        return res.status(400).json({ error: 'templateId, title, and signerEmail are required.' });
    }

    const template = await db.query('SELECT body_html FROM contract_templates WHERE id = $1', [templateId]);
    if (template.rows.length === 0) return res.status(404).json({ error: 'Template not found.' });

    const client = await db.connect(); // dedicated client for the transaction — see note below
    try {
        await client.query('BEGIN');

        const contractResult = await client.query(
            `INSERT INTO contracts (title, template_id, template_body, contract_type, status)
             VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
            [title, templateId, template.rows[0].body_html, contractType || 'Standard']
        );
        const contractId = contractResult.rows[0].id;

        const secureToken = generateSecureToken();
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day link expiry

        await client.query(
            `INSERT INTO contract_signers (contract_id, secure_token, encrypted_email, encrypted_variable_data, expires_at)
             VALUES ($1, $2, pgp_sym_encrypt($3, $4), pgp_sym_encrypt($5, $4), $6)`,
            [contractId, secureToken, signerEmail, process.env.DB_ENCRYPTION_KEY, JSON.stringify(variableData || {}), expiresAt]
        );

        await client.query('COMMIT');
        res.json({ success: true, contractId, signingUrl: `/sign/${secureToken}` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to create contract.' });
    } finally {
        client.release();
    }
});

router.get('/contracts', requireAdmin, async (req, res) => {
    try {
        const { search, status } = req.query;
        let queryText = 'SELECT id, title, status, contract_type, is_archived, created_at FROM contracts WHERE 1=1';
        const queryParams = [];

        if (status) {
            queryParams.push(status);
            queryText += ` AND status = $${queryParams.length}`;
        }
        if (search) {
            queryParams.push(`%${search}%`);
            queryText += ` AND title ILIKE $${queryParams.length}`;
        }
        queryText += ' ORDER BY created_at DESC LIMIT 200';

        const result = await db.query(queryText, queryParams);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to search contract registry.' });
    }
});

router.get('/contracts/download/:id', requireAdmin, async (req, res) => {
    try {
        const contractId = req.params.id;
        if (!/^\d+$/.test(contractId)) return res.status(400).json({ error: 'Invalid contract id.' });

        const result = await db.query('SELECT title, finalized_pdf_path, status FROM contracts WHERE id = $1', [contractId]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found.' });

        const contract = result.rows[0];
        if (contract.status !== 'signed' || !contract.finalized_pdf_path || !fs.existsSync(contract.finalized_pdf_path)) {
            return res.status(400).json({ error: 'PDF not available for this contract.' });
        }

        const safeTitle = contract.title.toLowerCase().replace(/[^a-z0-9]/gi, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_signed.pdf"`);
        fs.createReadStream(contract.finalized_pdf_path).pipe(res);
    } catch (error) {
        res.status(500).json({ error: 'Download failed.' });
    }
});

router.post('/contracts/archive/:id', requireAdmin, async (req, res) => {
    try {
        const contractId = req.params.id;
        if (!/^\d+$/.test(contractId)) return res.status(400).json({ error: 'Invalid contract id.' });

        await db.query(
            `UPDATE contracts SET is_archived = true, archived_at = NOW(), status = 'archived' WHERE id = $1`,
            [contractId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to archive contract.' });
    }
});

module.exports = router;
```

Worth calling out: the original draft ran `BEGIN`/`COMMIT` directly against
the shared pool (`db.query('BEGIN')`). With a connection pool, each
`pool.query()` call can be handed a *different* underlying connection, which
silently breaks transaction atomicity — the `BEGIN` might land on one
connection and the following inserts on another. The fix is to check out a
single dedicated client with `pool.connect()` for the lifetime of the
transaction, as above, and always `client.release()` in a `finally` block.
The same pattern is used in `routes/signing.js` below.

### 6.8 `routes/signing.js`

```javascript
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { isValidSignature, parseTemplate, hashDocument } = require('../utils/security');
const { generateContractPDF } = require('../services/pdf-generator');

router.get('/get-contract/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const queryText = `
            SELECT c.template_body,
                   pgp_sym_decrypt(s.encrypted_variable_data, $2) AS variable_data
            FROM contract_signers s
            JOIN contracts c ON s.contract_id = c.id
            WHERE s.secure_token = $1 AND s.is_completed = false AND s.expires_at > NOW()
        `;
        const result = await db.query(queryText, [token, process.env.DB_ENCRYPTION_KEY]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Signature link expired or invalid.' });
        }

        const variables = JSON.parse(result.rows[0].variable_data);
        const compiledHtml = parseTemplate(result.rows[0].template_body, variables);
        res.json({ html: compiledHtml }); // variables are escaped inside parseTemplate
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not load document.' });
    }
});

router.post('/sign-contract/:token', async (req, res) => {
    const { token } = req.params;
    const { signatureImage } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    if (!isValidSignature(signatureImage)) {
        return res.status(400).json({ error: 'Invalid signature data.' });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const checkResult = await client.query(
            `SELECT s.id AS signer_id, s.encrypted_variable_data, c.id AS contract_id, c.title, c.template_body
             FROM contract_signers s
             JOIN contracts c ON s.contract_id = c.id
             WHERE s.secure_token = $1 AND s.is_completed = false AND s.expires_at > NOW()
             FOR UPDATE`,
            [token]
        );
        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Link is invalid, expired, or already used.' });
        }

        const data = checkResult.rows[0];
        const decrypted = await client.query(
            'SELECT pgp_sym_decrypt($1, $2) AS variable_data',
            [data.encrypted_variable_data, process.env.DB_ENCRYPTION_KEY]
        );
        const variables = JSON.parse(decrypted.rows[0].variable_data);
        const compiledContractBodyHtml = parseTemplate(data.template_body, variables);
        const cryptoHash = hashDocument(compiledContractBodyHtml, signatureImage, data.contract_id);

        await client.query(
            `UPDATE contract_signers SET signature_data = $1, signed_at = NOW(), is_completed = true WHERE id = $2`,
            [signatureImage, data.signer_id]
        );
        await client.query(
            `INSERT INTO contract_audit_logs (contract_id, event_type, ip_address, user_agent, crypto_hash)
             VALUES ($1, 'SIGNATURE_CAPTURED', $2, $3, $4)`,
            [data.contract_id, clientIp, userAgent, cryptoHash]
        );

        const pdfBuffer = await generateContractPDF(
            data.title,
            compiledContractBodyHtml,
            signatureImage,
            { ip_address: clientIp, user_agent: userAgent, crypto_hash: cryptoHash }
        );

        const filename = `executed_contract_${data.contract_id}_${Date.now()}.pdf`;
        const storageDirectory = path.join(__dirname, '..', 'secure_storage');
        if (!fs.existsSync(storageDirectory)) fs.mkdirSync(storageDirectory, { recursive: true });
        const finalPath = path.join(storageDirectory, filename);
        fs.writeFileSync(finalPath, pdfBuffer);

        await client.query(
            `UPDATE contracts SET status = 'signed', finalized_pdf_path = $1, document_hash = $2 WHERE id = $3`,
            [finalPath, cryptoHash, data.contract_id]
        );

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Could not complete signing.' });
    } finally {
        client.release();
    }
});

module.exports = router;
```

### 6.9 `app.js` — wiring it together

```javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const db = require('./db');
const adminRoutes = require('./routes/admin');
const signingRoutes = require('./routes/signing');

const app = express();

app.set('trust proxy', 1); // required behind nginx so secure cookies & client IPs resolve correctly

app.use(helmet());
app.use(express.json({ limit: '5mb' })); // signature payloads are small; no need for more
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new pgSession({ pool: db, tableName: 'session', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // requires HTTPS — see §3
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/get-contract', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));
app.use('/api/sign-contract', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

app.use('/api/admin', adminRoutes);
app.use('/api', signingRoutes);

app.get('/sign/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign.html'));
});

// Bound to localhost only — nginx handles the public-facing side, per §3
app.listen(process.env.PORT || 3000, '127.0.0.1', () => {
    console.log(`Contract system listening on 127.0.0.1:${process.env.PORT || 3000}`);
});
```

### 6.10 `public/sign.html` — signer-facing page

Consent gating gates both the canvas and the submit button; the drawn
signature is only sent once consent is checked and something has actually
been drawn.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Review and Sign Document</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; background-color: #fcfcfc; }
        .contract-box { border: 1px solid #ddd; padding: 40px; background: #fff; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: 6px; min-height: 200px; }
        .consent-container { border: 1px solid #ccc; padding: 15px; background-color: #fafafa; font-size: 13px; line-height: 1.4; margin-bottom: 15px; border-radius: 4px; }
        .canvas-container { border: 2px dashed #a1a1a1; background: #fdfdfd; display: inline-block; position: relative; margin-top: 15px; border-radius: 4px; }
        canvas { cursor: crosshair; display: block; }
        .buttons { margin-top: 20px; }
        button { padding: 12px 24px; font-size: 15px; margin-right: 12px; cursor: pointer; border-radius: 4px; font-weight: 500; }
        .btn-clear { background: #f0f0f0; border: 1px solid #ccc; color: #444; }
        .btn-submit { background: #0066cc; color: white; border: none; }
        .btn-submit:hover:not(:disabled) { background: #0052a3; }
        .btn-submit:disabled { background: #99b8d9; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="contract-box" id="contractContent">Loading document…</div>

    <div class="consent-container">
        <p style="margin-top: 0; font-weight: bold; color: #111;">Electronic Record and Signature Disclosure Consent</p>
        <p style="color: #555;">
            By checking the box below and signing with the canvas, you consent to conduct
            this transaction electronically. Your drawn signature carries the same legal
            weight as a handwritten signature on paper.
        </p>
        <label style="display: flex; align-items: flex-start; margin-top: 12px; font-weight: 600; cursor: pointer;">
            <input type="checkbox" id="consentCheckbox" style="margin-right: 8px; margin-top: 3px;">
            I have read, understood, and agree to the Electronic Disclosure Terms.
        </label>
    </div>

    <h3>Draw your signature below:</h3>
    <div class="canvas-container">
        <canvas id="signatureCanvas" width="550" height="160"></canvas>
    </div>

    <div class="buttons">
        <button class="btn-clear" id="clearBtn">Clear</button>
        <button class="btn-submit" id="submitBtn" disabled>Sign & Complete</button>
    </div>

    <script>
        const canvas = document.getElementById('signatureCanvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let hasDrawn = false;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        const token = window.location.pathname.split('/').pop();
        const consentCheckbox = document.getElementById('consentCheckbox');
        const submitBtn = document.getElementById('submitBtn');

        function updateSubmitState() {
            submitBtn.disabled = !(consentCheckbox.checked && hasDrawn);
        }
        consentCheckbox.addEventListener('change', updateSubmitState);

        async function loadContract() {
            try {
                const res = await fetch(`/api/get-contract/${token}`);
                const data = await res.json();
                // The server escapes every signer-supplied variable before returning this HTML;
                // the surrounding template markup itself comes only from admin-authored templates.
                document.getElementById('contractContent').innerHTML = data.html || `<p>${data.error}</p>`;
            } catch (err) {
                document.getElementById('contractContent').innerHTML = '<p>Failed to load document.</p>';
            }
        }
        loadContract();

        function getCoords(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }

        function startDrawing(e) {
            isDrawing = true;
            hasDrawn = true;
            const coords = getCoords(e);
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
            updateSubmitState();
            if (e.touches) e.preventDefault();
        }

        function draw(e) {
            if (!isDrawing) return;
            const coords = getCoords(e);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            if (e.touches) e.preventDefault();
        }

        function stopDrawing() { isDrawing = false; }

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        window.addEventListener('touchend', stopDrawing);

        document.getElementById('clearBtn').addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasDrawn = false;
            updateSubmitState();
        });

        submitBtn.addEventListener('click', async () => {
            const signatureImage = canvas.toDataURL('image/png');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing…';

            try {
                const response = await fetch(`/api/sign-contract/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ signatureImage })
                });
                const result = await response.json();
                if (result.success) {
                    alert('Signed successfully. This document is now finalized.');
                    window.location.reload();
                } else {
                    alert('Error: ' + result.error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign & Complete';
                }
            } catch (err) {
                alert('Network error — please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign & Complete';
            }
        });
    </script>
</body>
</html>
```

### 6.11 `public/admin/login.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Admin Login</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f4f5f7; }
  .card { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); width: 320px; }
  input { width: 100%; padding: 10px; margin-top: 6px; margin-bottom: 16px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
  button { width: 100%; padding: 10px; background: #0066cc; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
  #error { color: #c0392b; font-size: 13px; margin-bottom: 12px; min-height: 16px; }
</style>
</head>
<body>
  <form class="card" id="loginForm">
    <h2>Admin Login</h2>
    <div id="error"></div>
    <label>Username</label>
    <input type="text" id="username" required autocomplete="username">
    <label>Password</label>
    <input type="password" id="password" required autocomplete="current-password">
    <button type="submit">Sign In</button>
  </form>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('error');
        errorEl.textContent = '';

        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
            window.location.href = '/admin/dashboard.html';
        } else {
            errorEl.textContent = result.error || 'Login failed.';
        }
    });
  </script>
</body>
</html>
```

### 6.12 `public/admin/dashboard.html`

Renders contract data with `textContent`, never `innerHTML` — contract
titles and types ultimately originate from admin input, but treating all
server data as untrusted on the render path is the cheap, durable habit
worth keeping.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Contracts Dashboard</title>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; background: #f4f5f7; color: #222; }
  header { background: #111; color: #fff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  main { max-width: 1000px; margin: 24px auto; padding: 0 20px; }
  .panel { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
  input, select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
  button { padding: 8px 14px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-right: 6px; }
  .btn-primary { background: #0066cc; color: #fff; }
  .btn-secondary { background: #eee; color: #333; }
  .status { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  .status-pending { background: #fff3cd; color: #856404; }
  .status-signed { background: #d4edda; color: #155724; }
  .status-archived { background: #e2e3e5; color: #383d41; }
</style>
</head>
<body>
  <header>
    <h2>Contracts Dashboard</h2>
    <button class="btn-secondary" id="logoutBtn">Log out</button>
  </header>
  <main>
    <div class="panel">
      <h3>Create Contract</h3>
      <form id="createForm">
        <input type="number" id="templateId" placeholder="Template ID" required>
        <input type="text" id="title" placeholder="Contract title" required>
        <input type="email" id="signerEmail" placeholder="Signer email" required>
        <input type="text" id="variableData" placeholder='Variables JSON e.g. {"clientName":"Acme"}'>
        <button type="submit" class="btn-primary">Create & Get Signing Link</button>
      </form>
      <p id="createResult"></p>
    </div>

    <div class="panel">
      <h3>Contracts</h3>
      <input type="text" id="searchBox" placeholder="Search by title...">
      <table>
        <thead><tr><th>Title</th><th>Status</th><th>Type</th><th>Created</th><th></th></tr></thead>
        <tbody id="contractsBody"></tbody>
      </table>
    </div>
  </main>

  <script>
    async function checkAuth() {
        const res = await fetch('/api/admin/me');
        if (res.status === 401) window.location.href = '/admin/login.html';
    }
    checkAuth();

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/admin/login.html';
    });

    async function loadContracts(search = '') {
        const res = await fetch(`/api/admin/contracts?search=${encodeURIComponent(search)}`);
        if (res.status === 401) return window.location.href = '/admin/login.html';
        const { data } = await res.json();

        const tbody = document.getElementById('contractsBody');
        tbody.innerHTML = '';
        data.forEach(contract => {
            const tr = document.createElement('tr');

            const titleTd = document.createElement('td');
            titleTd.textContent = contract.title;
            tr.appendChild(titleTd);

            const statusTd = document.createElement('td');
            const badge = document.createElement('span');
            badge.className = `status status-${contract.status}`;
            badge.textContent = contract.status;
            statusTd.appendChild(badge);
            tr.appendChild(statusTd);

            const typeTd = document.createElement('td');
            typeTd.textContent = contract.contract_type;
            tr.appendChild(typeTd);

            const createdTd = document.createElement('td');
            createdTd.textContent = new Date(contract.created_at).toLocaleDateString();
            tr.appendChild(createdTd);

            const actionsTd = document.createElement('td');
            if (contract.status === 'signed') {
                const dlBtn = document.createElement('button');
                dlBtn.className = 'btn-secondary';
                dlBtn.textContent = 'Download';
                dlBtn.onclick = () => window.open(`/api/admin/contracts/download/${contract.id}`, '_blank');
                actionsTd.appendChild(dlBtn);
            }
            if (!contract.is_archived) {
                const archBtn = document.createElement('button');
                archBtn.className = 'btn-secondary';
                archBtn.textContent = 'Archive';
                archBtn.onclick = async () => {
                    await fetch(`/api/admin/contracts/archive/${contract.id}`, { method: 'POST' });
                    loadContracts(document.getElementById('searchBox').value);
                };
                actionsTd.appendChild(archBtn);
            }
            tr.appendChild(actionsTd);
            tbody.appendChild(tr);
        });
    }
    loadContracts();

    let searchTimeout;
    document.getElementById('searchBox').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadContracts(e.target.value), 300);
    });

    document.getElementById('createForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const templateId = document.getElementById('templateId').value;
        const title = document.getElementById('title').value;
        const signerEmail = document.getElementById('signerEmail').value;
        let variableData = {};
        const rawVars = document.getElementById('variableData').value;
        if (rawVars) {
            try { variableData = JSON.parse(rawVars); }
            catch { document.getElementById('createResult').textContent = 'Variables must be valid JSON.'; return; }
        }

        const res = await fetch('/api/admin/contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId, title, signerEmail, variableData })
        });
        const result = await res.json();
        const resultEl = document.getElementById('createResult');
        if (result.success) {
            resultEl.textContent = `Created. Signing link: ${window.location.origin}${result.signingUrl}`;
            loadContracts();
        } else {
            resultEl.textContent = result.error || 'Failed to create contract.';
        }
    });
  </script>
</body>
</html>
```

### 6.13 Bootstrapping the first admin user

There's deliberately no public "register admin" endpoint — that would be
another unauthenticated route capable of creating accounts with access to
every contract. Instead, create the first account from the command line,
directly on the server:

```javascript
// scripts/create-admin.js
// Usage: node scripts/create-admin.js <username> <password>
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db');

async function main() {
    const [, , username, password] = process.argv;
    if (!username || !password) {
        console.error('Usage: node scripts/create-admin.js <username> <password>');
        process.exit(1);
    }
    const hash = await bcrypt.hash(password, 12);
    await db.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', [username, hash]);
    console.log(`Admin user "${username}" created.`);
    process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

Run it once after the schema is applied: `node scripts/create-admin.js you@yourorg.com <a-strong-password>`.
Add further admins the same way, or build an authenticated
`POST /api/admin/users` route later once at least one admin exists to gate it.

## 7. Rollout checklist

- [ ] Add admin authentication (§1.1) and apply to all `/api/admin/*` routes
- [ ] Validate signature data URIs and block Puppeteer's network access (§1.2)
- [ ] Escape template variables; consider migrating to Handlebars (§1.3)
- [ ] Move all secrets to environment variables (§1.4)
- [ ] Generate tokens with `crypto.randomBytes`; add expiry (§1.5)
- [ ] Add `helmet` + rate limiting on login and signing routes (§1.6)
- [ ] Hash the full compiled document, not just the signature (§1.7)
- [ ] Write down an actual GDPR retention policy with a stated legal basis (§2)
- [ ] Reverse proxy + TLS in front of Node; nothing but 443 open externally (§3)
- [ ] iLO isolated from the internet, default credentials changed (§3)
- [ ] Full-disk encryption, RAID, UPS, tested encrypted backups (§3)
- [ ] Migrate your real templates into `contract_templates` (§4)
- [ ] Apply the schema in §6.2 and set the two secrets in `.env` (§6.1)
- [ ] Wire in `app.js`, `routes/`, `services/`, `utils/`, and `middleware/` from §6
- [ ] Run `scripts/create-admin.js` once to create the first admin account (§6.13)
- [ ] Confirm `secure_storage/` is `chmod 700` and outside any statically-served path

---

*This document reflects a review of the draft architecture as of the code and
markdown you shared. It's a starting point, not a final security sign-off —
worth a second pass once the fixes above are actually implemented, and
before any real client data touches the system.*
