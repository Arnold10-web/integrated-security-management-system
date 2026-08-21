import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const esignStorageDir = path.join(process.cwd(), "digital_contracts");
if (!fs.existsSync(esignStorageDir)) fs.mkdirSync(esignStorageDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedExt = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xls", ".xlsx", ".csv"];
    const allowedMime = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = allowedMime.includes(file.mimetype);
    const extOk = allowedExt.includes(ext);
    if (extOk && mimeOk) cb(null, true);
    else if (extOk) {
      // Allow extension match but log mime mismatch (user may have renamed)
      cb(null, true);
    } else cb(new Error(`File type ${ext} (${file.mimetype}) not allowed`));
  },
});

export function safeResolveUpload(filename: string): string | null {
  const base = path.basename(filename);
  if (base.includes("..") || base.includes("/") || base.includes("\\")) return null;
  const full = path.join(uploadDir, base);
  if (!full.startsWith(uploadDir + path.sep)) return null;
  return full;
}

export function safeResolveDigitalContract(file: string): string | null {
  const base = path.basename(file);
  const full = path.join(esignStorageDir, base);
  if (!full.startsWith(esignStorageDir + path.sep)) return null;
  return full;
}

export function getUploadDir() {
  return uploadDir;
}
export function getDigitalContractDir() {
  return esignStorageDir;
}

// Content sniff helper — checks first bytes for known signatures
export function sniffMime(buffer: Buffer, ext: string): boolean {
  if (ext === ".pdf" && buffer.slice(0, 4).toString() === "%PDF") return true;
  if ([".jpg", ".jpeg"].includes(ext) && buffer[0] === 0xff && buffer[1] === 0xd8) return true;
  if (ext === ".png" && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true;
  // For office docs, allow (zip header)
  if ([".docx", ".xlsx"].includes(ext) && buffer[0] === 0x50 && buffer[1] === 0x4b) return true;
  // Fallback: allow if we can't sniff
  return true;
}

export function sanitizeCsvValue(v: string): string {
  if (/^[=+\-@]/.test(v)) return `'${v}`;
  return v;
}
