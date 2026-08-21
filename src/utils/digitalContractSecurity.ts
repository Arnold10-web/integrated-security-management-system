import crypto from "crypto";

/**
 * Digital Contract Security Utilities
 * Handles: token generation, signature validation, document hashing, encryption
 */

const PNG_DATA_URI = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isValidSignature(dataUri: unknown): boolean {
  if (typeof dataUri !== "string" || !PNG_DATA_URI.test(dataUri)) return false;
  const approxBytes = (dataUri.length * 3) / 4;
  return approxBytes > 500 && approxBytes < 2 * 1024 * 1024;
}

export function hashDocument(pdfBytes: Buffer, contractId: string): string {
  return crypto
    .createHash("sha256")
    .update(pdfBytes)
    .update(contractId)
    .digest("hex");
}

export function hashFieldData(fields: Record<string, unknown>, contractId: string): string {
  const serialized = JSON.stringify(fields, Object.keys(fields).sort());
  return crypto.createHash("sha256").update(serialized).update(contractId).digest("hex");
}

// ── AES-256-GCM Encryption for PII ──

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function deriveKey(passphrase: string): Buffer {
  return crypto.scryptSync(passphrase, "iscms-digital-contract-salt", 32);
}

export function encryptField(plaintext: string): string {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) return plaintext;
  const cipherKey = deriveKey(key);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, cipherKey, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptField(ciphertext: string): string {
  const key = process.env.DB_ENCRYPTION_KEY;
  if (!key) return ciphertext;
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext;
  const cipherKey = deriveKey(key);
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, cipherKey, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encryptJson(obj: Record<string, unknown>): string {
  return encryptField(JSON.stringify(obj));
}

export function decryptJson(ciphertext: string): Record<string, unknown> {
  try {
    return JSON.parse(decryptField(ciphertext));
  } catch {
    return {};
  }
}
