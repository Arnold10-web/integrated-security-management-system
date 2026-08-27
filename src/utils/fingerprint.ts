// Browser-safe fingerprint capture utilities for the Mantra MFS100 demo.
// Produces a displayable thumbnail plus record fields (hash, optional base64
// template/image markers). The authoritative ISO/IEC 19794 FMR/FIR blocks are
// regenerated deterministically server-side at export time, so the browser only
// needs to capture the subject/finger association + a per-finger thumbnail.

export interface CapturedFinger {
  fingerPosition: number;
  fingerCode: string;
  imageData: string; // data URL thumbnail
  hash: string;
  qualityScore: number;
  capturedAt: string;
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

const W = 96;
const H = 120;

/**
 * Render a deterministic fingerprint-like grayscale thumbnail (data URL) for a
 * given subject+finger seed, so re-capturing the same subject looks stable.
 */
export function renderFingerprintThumb(seed: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(W, H);
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = mulberry32(s);
  const ridges = 26 + Math.floor(rand() * 14);
  const freq = 0.02 + rand() * 0.02;
  const angle = rand() * Math.PI;
  const cx = W * (0.4 + rand() * 0.2);
  const cy = H * (0.4 + rand() * 0.2);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx) + angle;
      const wave =
        Math.sin(r * freq * 6.283) +
        0.6 * Math.sin(theta * ridges + r * freq * 2.0) +
        0.3 * Math.sin((x * 0.05 + y * 0.03) * 2.0);
      let v = 128 + (1 - Math.cos(wave)) * 60;
      v += (rand() - 0.5) * 18;
      v += (1 - r / (W * 0.62)) * 30;
      const g = clampByte(v);
      const idx = (y * W + x) * 4;
      img.data[idx] = g;
      img.data[idx + 1] = g;
      img.data[idx + 2] = g;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Stable SHA-256 hex fingerprint hash (browser WebCrypto). Falls back to a
 * deterministic pseudo hash if WebCrypto is unavailable.
 */
export async function fingerprintHash(subjectKey: string, fingerCode: string): Promise<string> {
  const input = `${subjectKey}::${fingerCode}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest("SHA-256", data);
      const bytes = Array.from(new Uint8Array(digest));
      return bytes.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
    }
  } catch {
    /* fall through to pseudo hash */
  }
  const chars = "0123456789abcdef";
  let out = "";
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  }
  for (let i = 0; i < 64; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    out += chars[h & 0xf];
  }
  return out;
}

/**
 * Deterministic placeholder base64 for the ISO template/image record fields.
 * The real FMR/FIR blocks are regenerated server-side; these fields exist to
 * satisfy the data model and give a human-inspectable marker.
 */
export function fingerprintMarkerBase64(seed: string): string {
  const plain = `ISO/IEC 19794 demo :: ${seed}`;
  try {
    if (typeof btoa === "function") return btoa(unescape(encodeURIComponent(plain)));
  } catch {
    /* ignore */
  }
  return "";
}

/** Generate a single captured finger record for a given position + subject key. */
export async function captureFinger(
  subjectKey: string,
  fingerPosition: number,
  fingerCode: string
): Promise<CapturedFinger> {
  const seed = `${subjectKey}-${fingerCode}`;
  const thumb = renderFingerprintThumb(seed);
  const hash = await fingerprintHash(subjectKey, fingerCode);
  const quality = 78 + Math.floor(Math.random() * 18);
  return {
    fingerPosition,
    fingerCode,
    imageData: thumb,
    hash,
    qualityScore: quality,
    capturedAt: new Date().toISOString(),
  };
}
