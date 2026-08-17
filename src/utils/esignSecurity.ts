/**
 * E-Signature security helpers — implements §1.2, §1.3, §1.5, §1.7 of
 * Contract E Signature System.md, scoped to ISCMS.
 *
 * - All template variable substitution is HTML-escaped by default.
 * - Signature data-URIs are strictly validated (PNG only, size-bounded).
 * - Tokens are CSPRNG (32 bytes hex), never sequential.
 * - Document hash covers compiled HTML + signature + contractId.
 * - At-rest encryption for signer email / variableData uses AES-256-GCM
 *   with DB_ENCRYPTION_KEY (falls back to no-op when key is absent in dev/test).
 */
import crypto from "crypto";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 hex chars, 256-bit
}

const PNG_DATA_URI = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidSignature(dataUri: unknown): boolean {
  if (typeof dataUri !== "string" || !PNG_DATA_URI.test(dataUri)) return false;
  // Approx decoded bytes without actually decoding (3/4 * length)
  const approxBytes = (dataUri.length * 3) / 4;
  // Reject empty sigs (< ~500B is just the PNG header, no stroke) and huge payloads (>2MiB)
  return approxBytes > 500 && approxBytes < 2 * 1024 * 1024;
}

/**
 * Safe template compiler — escapes every substituted value.
 * Mirrors utils/security.js §6.4 but uses \s* tolerant placeholders.
 */
export function parseTemplate(htmlTemplate: string, variablesObj?: Record<string, unknown> | null): string {
  let compiled = htmlTemplate ?? "";
  if (!variablesObj) return compiled;
  for (const [key, value] of Object.entries(variablesObj)) {
    const re = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, "g");
    compiled = compiled.replace(re, escapeHtml(value));
  }
  return compiled;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hashDocument(compiledHtml: string, signatureImage: string, contractId: string): string {
  return crypto.createHash("sha256").update(compiledHtml + signatureImage + contractId).digest("hex");
}

// ── Optional at-rest encryption for signer PII ────────────────────────────
// When DB_ENCRYPTION_KEY is set (32-byte hex or any string), we derive a
// 32-byte key via SHA-256 and use AES-256-GCM. The ciphertext format is
// `iv:authTag:ciphertext` (all hex). When the key is absent (dev/test) or
// decryption fails (legacy unencrypted row), we fall back to plaintext so
// existing data and tests remain readable.

function deriveKey(): Buffer | null {
  const raw = process.env.DB_ENCRYPTION_KEY;
  if (!raw) return null;
  // Accept hex 64-char (32 bytes) or any passphrase — derive via SHA-256 for determinism
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptField(plaintext: string): string {
  const key = deriveKey();
  if (!key) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptField(ciphertext: string): string {
  const key = deriveKey();
  if (!key) return ciphertext;
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext; // legacy plaintext
  try {
    const [ivHex, tagHex, encHex] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const dec = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return ciphertext; // corrupted / legacy — return as-is
  }
}

export function encryptJson(obj: unknown): string {
  return encryptField(JSON.stringify(obj ?? {}));
}

export function decryptJson(ciphertext: string): Record<string, unknown> {
  const plain = decryptField(ciphertext);
  try {
    return JSON.parse(plain) as Record<string, unknown>;
  } catch {
    return {};
  }
}
