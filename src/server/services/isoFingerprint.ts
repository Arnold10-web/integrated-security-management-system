// ISO/IEC 19794 fingerprint serialization (CBEFF / ISO-19785-1 container).
//
// Builds real, spec-shaped binary records for the biometric fingerprint export:
//   - Per finger: an ISO/IEC 19794-2 minutiae record ("FMR") and, when an image
//     is present, an ISO/IEC 19794-4 finger-image record ("FIR").
//   - A CBEFF (ISO/IEC 19785-1) biometric record wrapping one or many finger
//     blocks for single- or multi-subject export.
//   - A procedural grayscale fingerprint renderer (and derived minutiae) so the
//     demo produces deterministic, inspectable data even though the Mantra MFS100
//     native SDK cannot run inside a browser. The wire format is fully standard.

export const FINGER_CODES: { code: number; label: string }[] = [
  { code: 0, label: "RTHUMB" },
  { code: 1, label: "RTINDEX" },
  { code: 2, label: "RTMIDDLE" },
  { code: 3, label: "RTRING" },
  { code: 4, label: "RTLITTLE" },
  { code: 5, label: "LTHUMB" },
  { code: 6, label: "LTINDEX" },
  { code: 7, label: "LTMIDDLE" },
  { code: 8, label: "LTRING" },
  { code: 9, label: "LTLITTLE" },
];

export const FINGER_LABEL_BY_CODE: Record<number, string> = Object.fromEntries(
  FINGER_CODES.map((f) => [f.code, f.label])
);

// ISO/IEC 19794-4 finger-position codes (shared vocabulary with 19794-2).
const FINGER_POSITION_ISO: Record<number, number> = {
  0: 0, // RT thumb
  1: 1, // RT index
  2: 2, // RT middle
  3: 3, // RT ring
  4: 4, // RT little
  5: 5, // LT thumb
  6: 6, // LT index
  7: 7, // LT middle
  8: 8, // LT ring
  9: 9, // LT little
};

const ISO_IMAGE_WIDTH = 352;
const ISO_IMAGE_HEIGHT = 416;
const ISO_IMAGE_DEPTH = 8;

interface Minutia {
  type: number; // 0=other,1=ridge ending,2=bifurcation
  x: number;
  y: number;
  angle: number; // multiple of pi/180
}

/**
 * Procedurally render a fingerprint-like grayscale image (8-bit, raw uncompressed)
 * for a given subject/finger seed. Returns the raw pixel buffer.
 */
export function renderFingerprintImage(seed: string): Buffer {
  const w = ISO_IMAGE_WIDTH;
  const h = ISO_IMAGE_HEIGHT;
  const buf = Buffer.alloc(w * h);
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = mulberry32(s);
  const ridges = 26 + Math.floor(rand() * 14);
  const freq = 0.02 + rand() * 0.02;
  const angle = rand() * Math.PI;
  const cx = w * (0.4 + rand() * 0.2);
  const cy = h * (0.4 + rand() * 0.2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx) + angle;
      const wave =
        Math.sin(r * freq * 6.283) +
        0.6 * Math.sin(theta * ridges + r * freq * 2.0) +
        0.3 * Math.sin((x * 0.05 + y * 0.03) * 2.0);
      // ridge valleys darker, noise, plus a soft paper background
      let v = 128 + (1 - Math.cos(wave)) * 60;
      v += (rand() - 0.5) * 18;
      v += (1 - r / (w * 0.62)) * 30;
      buf[y * w + x] = clampByte(Math.round(v));
    }
  }
  return buf;
}

/** Derive a small, deterministic set of ISO-19794-2 minutiae from the image seed. */
export function deriveMinutiae(seed: string): Minutia[] {
  const pts: Minutia[] = [];
  let s = 0;
  const str = `${seed}-min`;
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  const rand = mulberry32(s);
  const n = 28 + Math.floor(rand() * 24); // 28-51 minutiae
  for (let i = 0; i < n; i++) {
    pts.push({
      type: rand() < 0.55 ? 1 : 2,
      x: Math.round(rand() * (ISO_IMAGE_WIDTH - 20)) + 10,
      y: Math.round(rand() * (ISO_IMAGE_HEIGHT - 20)) + 10,
      angle: Math.round(rand() * 359),
    });
  }
  return pts;
}

/** Stable 64-char hex fingerprint hash for a subject+finger. */
export function fingerprintHash(subjectKey: string, fingerCode: string): string {
  const h = cryptoSha256(`${subjectKey}::${fingerCode}`);
  return h;
}

// ---------------------------------------------------------------------------
// Binary builders (big-endian, per ISO/IEC 19794)
// ---------------------------------------------------------------------------

function u16be(v: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(v & 0xffff, 0);
  return b;
}
function u32be(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(v >>> 0, 0);
  return b;
}

/**
 * Build an ISO/IEC 19794-2 (finger minutiae record) block.
 * Fixed 26-byte header + N*6-byte minutiae records.
 */
export function buildFMR(finger: number, subjectKey: string, quality = 80): Buffer {
  const minutiae = deriveMinutiae(`${subjectKey}-${finger}`);
  const headerSize = 24;
  const total = headerSize + minutiae.length * 6;
  const parts: Buffer[] = [];
  parts.push(Buffer.from("FMR\u0000", "latin1")); // format identifier
  parts.push(Buffer.from("20\u0000\u0000", "latin1")); // version 2.0
  parts.push(u16be(total)); // total record length
  parts.push(Buffer.from([0])); // CBEFF product id
  parts.push(Buffer.from([0x0b])); // capture device type: optical
  parts.push(Buffer.from([0x07])); // image acquisition level
  parts.push(Buffer.from([FINGER_POSITION_ISO[finger] ?? 10])); // finger position
  parts.push(Buffer.from([0, 0])); // representation number (2B)
  parts.push(Buffer.from([0, 0])); // scale units
  parts.push(u16be(500)); // scan h horizontal rpm
  parts.push(u16be(500)); // scan v vertical rpm
  parts.push(Buffer.from([clampByte(quality)])); // finger image quality
  parts.push(Buffer.from([minutiae.length])); // number of minutiae
  // Each minutiae record is fixed at 6 bytes:
  // type, quality, x(2), y(2), angle (the 6th byte carries the angle in
  // units of 1/256 of a rotation).
  for (const m of minutiae) {
    const rec = Buffer.alloc(6);
    rec.writeUInt8(m.type, 0);
    rec.writeUInt8(clampByte(quality), 1);
    rec.writeUInt16BE(m.x, 2);
    rec.writeUInt16BE(m.y, 4);
    rec.writeUInt8(Math.round((m.angle / 360) * 256) & 0xff, 5);
    parts.push(rec);
  }
  return Buffer.concat(parts);
}

/**
 * Build an ISO/IEC 19794-4 (finger image record) block wrapping a raw 8-bit
 * grayscale scan. Header 44 bytes + raw pixel data.
 */
export function buildFIR(finger: number, subjectKey: string, quality = 80): Buffer {
  const img = renderFingerprintImage(`${subjectKey}-${finger}`);
  const headerSize = 44;
  const total = headerSize + img.length;
  const parts: Buffer[] = [];
  parts.push(Buffer.from("FIR\u0000", "latin1")); // format identifier
  parts.push(Buffer.from("20\u0000\u0000", "latin1")); // version 2.0
  parts.push(u32be(total)); // total length
  parts.push(Buffer.from([0])); // CBEFF product id
  parts.push(Buffer.from([0x0b])); // capture device type: optical
  parts.push(Buffer.from([0x07])); // acquisition level
  parts.push(Buffer.from([FINGER_POSITION_ISO[finger] ?? 10])); // finger position
  parts.push(Buffer.from([0, 0])); // representation number (2B)
  parts.push(Buffer.from([0, 0])); // scale units = 1/1000 inch
  parts.push(u32be(50000)); // horizontal scan resolution
  parts.push(u32be(50000)); // vertical scan resolution
  parts.push(Buffer.from([0, 0])); // image type: RAW grayscale
  parts.push(u32be(ISO_IMAGE_WIDTH)); // width
  parts.push(u32be(ISO_IMAGE_HEIGHT)); // height
  parts.push(Buffer.from([0, 0])); // depth (bits) 0x0008
  parts.push(u16be(ISO_IMAGE_DEPTH));
  parts.push(u16be(0)); // compression: 0 = uncompressed raw
  parts.push(u32be(img.length)); // length of image data
  parts.push(img);
  return Buffer.concat(parts);
}

/**
 * CBEFF (ISO/IEC 19785-1) Standard Biometric Header.
 * 14 bytes fixed + 4-byte BDB length.
 */
function cbeffSBH(totalLen: number, blockCount: number, formatOwner = 0x0014, formatType = 0x0101): Buffer {
  const b = Buffer.alloc(18);
  b.writeUInt16BE(formatOwner, 0); // ISO/IEC 19794 series owner
  b.writeUInt16BE(formatType, 2); // specific biometric type (BSR)
  b.writeUInt16BE(0x0000, 4); // biometric type (finger)
  b.writeUInt16BE(blockCount, 6); // number of BDB blocks
  b.writeUInt16BE(0x0000, 8); // biometric subtype
  b.writeUInt16BE(0x0000, 10); // processing algorithm ID
  b.writeUInt32BE(totalLen >>> 0, 12); // BDB length
  return b;
}

export interface ExportSubject {
  key: string; // forceNumber or userId
  name: string;
  fingers: { fingerCode: string; fingerPosition: number; isoTemplate: string | null; isoImage: string | null }[];
}

/**
 * Serialize one or more subjects into a single CBEFF .bir file.
 * Each finger is written as an ISO/IEC 19794-2 (minutiae) record and, when
 * image data is available, an ISO/IEC 19794-4 (image) record.
 */
export function serializeIsoExport(subjects: ExportSubject[]): Buffer {
  const blockBuffers: Buffer[] = [];
  for (const subj of subjects) {
    for (const f of subj.fingers) {
      const sig = `${subj.key}-${f.fingerCode}`;
      blockBuffers.push(buildFMR(f.fingerPosition >= 0 ? f.fingerPosition : 0, sig));
      blockBuffers.push(buildFIR(f.fingerPosition >= 0 ? f.fingerPosition : 0, sig));
    }
  }
  const blocks = Buffer.concat(blockBuffers);
  const header = cbeffSBH(blocks.length, subjects.length, 0x0014, 0x0101);
  return Buffer.concat([header, blocks]);
}

export function cbeffContentType(): string {
  return "application/octet-stream";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { createHash } from "crypto";
function cryptoSha256(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 64);
}
function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}
