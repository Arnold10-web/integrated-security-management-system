import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Digital Contract PDF Storage Service
 * Handles: template PDF storage, contract PDF finalization, scanned PDF uploads
 */

const STORAGE_ROOT = path.join(process.cwd(), "digital_contracts");
const TEMPLATES_DIR = path.join(STORAGE_ROOT, "templates");
const CONTRACTS_DIR = path.join(STORAGE_ROOT, "contracts");
const SCANS_DIR = path.join(STORAGE_ROOT, "scans");
const STAMPS_DIR = path.join(STORAGE_ROOT, "stamps");

// Ensure directories exist
[TEMPLATES_DIR, CONTRACTS_DIR, SCANS_DIR, STAMPS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Template PDF Storage ──

export function getTemplateStoragePath(templateId: string, originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  const safeName = `${templateId}${ext}`;
  return path.join(TEMPLATES_DIR, safeName);
}

export function storeTemplatePdf(templateId: string, fileBuffer: Buffer, originalFilename: string): { filePath: string; fileSize: number } {
  const filePath = getTemplateStoragePath(templateId, originalFilename);
  fs.writeFileSync(filePath, fileBuffer);
  return { filePath, fileSize: fileBuffer.length };
}

export function deleteTemplatePdf(filePath: string): void {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getTemplatePdfPath(filePath: string): string | null {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(TEMPLATES_DIR))) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

// ── Contract PDF Storage (finalized signed PDFs) ──

export function storeFinalizedPdf(contractId: string, pdfBuffer: Buffer): string {
  const filename = `finalized_${contractId}_${Date.now()}.pdf`;
  const filePath = path.join(CONTRACTS_DIR, filename);
  fs.writeFileSync(filePath, pdfBuffer);
  return filePath;
}

export function getFinalizedPdfPath(filePath: string): string | null {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(CONTRACTS_DIR))) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

// ── Scanned Contract Storage (old paper contracts) ──

export function storeScannedPdf(contractId: string, fileBuffer: Buffer, originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase() || ".pdf";
  const filename = `scanned_${contractId}_${Date.now()}${ext}`;
  const filePath = path.join(SCANS_DIR, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return filePath;
}

export function getScannedPdfPath(filePath: string): string | null {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(SCANS_DIR))) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

// ── PDF Integrity ──

export function computePdfHash(pdfBuffer: Buffer): string {
  return crypto.createHash("sha256").update(pdfBuffer).digest("hex");
}

export function isPdfFile(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.slice(0, 5).toString() === "%PDF-";
}

export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

// ── Company Stamp Storage ──

const STAMP_FILENAME = "company_stamp";

export function storeStampImage(fileBuffer: Buffer, originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase() || ".png";
  const filename = `${STAMP_FILENAME}${ext}`;
  const filePath = path.join(STAMPS_DIR, filename);
  fs.writeFileSync(filePath, fileBuffer);
  return filePath;
}

export function getStampImagePath(): string | null {
  // Look for any stamp file with common image extensions
  const extensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp"];
  for (const ext of extensions) {
    const filePath = path.join(STAMPS_DIR, `${STAMP_FILENAME}${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

export function deleteStampImage(): void {
  const extensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp"];
  for (const ext of extensions) {
    const filePath = path.join(STAMPS_DIR, `${STAMP_FILENAME}${ext}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
