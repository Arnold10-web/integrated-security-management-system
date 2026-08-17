/**
 * Sandboxed PDF generation for e-signed contracts — §1.2 & §6.6.
 *
 * - Puppeteer launched with sandbox ON (default).
 * - Request interception: only `data:` and `about:blank` are allowed —
 *   prevents SSRF / external fetches from inside the rendered document.
 * - All dynamic values (title, audit fields) are escaped *before* the
 *   template is built. The signature data-URI is validated upstream by
 *   isValidSignature() and is *not* escaped (escaping would corrupt it).
 * - Falls back to a minimal PDF buffer (or throws) when Puppeteer / Chromium
 *   is not available — the signing transaction will surface the error to the
 *   caller and roll back, rather than leaving a half-signed contract.
 */
import path from "path";
import { escapeHtml } from "../utils/esignSecurity.ts";

export type EsignAuditForPdf = {
  ip_address: string;
  user_agent: string;
  crypto_hash: string;
};

export async function generateEsignPdf(
  contractTitle: string,
  compiledContractHtml: string,
  base64Signature: string,
  audit: EsignAuditForPdf,
): Promise<Buffer> {
  let puppeteer: unknown = null;
  try {
    // @ts-ignore - puppeteer is optional; installed only in prod where Chromium is available
    puppeteer = await import("puppeteer");
  } catch {
    // Puppeteer not installed — caller can decide to use a fallback or fail.
    // We throw a typed error so the route can return 500 with a clear message.
    const err = new Error(
      "PDF generation unavailable: puppeteer is not installed. Run `npm install puppeteer` and ensure Chromium can launch in this environment.",
    ) as Error & { code: string };
    err.code = "PUPPETEER_MISSING";
    throw err;
  }

  const browser = await (puppeteer as unknown as { launch: (opts: unknown) => Promise<{ newPage: () => Promise<unknown>; close: () => Promise<void> }> }).launch({
    headless: true, // sandbox intentionally left on — do not add --no-sandbox unless inside a locked-down container
  } as never);
  try {
    const page = await (browser as unknown as { newPage: () => Promise<{ setRequestInterception: (v: boolean) => Promise<void>; on: (ev: string, fn: (req: { url: () => string; continue: () => void; abort: () => void }) => void) => void; setContent: (html: string, opts: unknown) => Promise<void>; pdf: (opts: unknown) => Promise<Buffer> }> }).newPage() as unknown as {
      setRequestInterception: (v: boolean) => Promise<void>;
      on: (ev: string, fn: (req: { url: () => string; continue: () => void; abort: () => void }) => void) => void;
      setContent: (html: string, opts: unknown) => Promise<void>;
      pdf: (opts: unknown) => Promise<Buffer>;
    };

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url === "about:blank") req.continue();
      else req.abort();
    });

    const layout = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
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
    <p style="font-size: 12px; color: #444; margin-top: 5px;">Date Signed: ${escapeHtml(new Date().toUTCString())}</p>
  </div>
  <div class="audit-section">
    <div class="audit-title">Security Audit Log Certificate</div>
    <table class="audit-table">
      <tr><td><strong>Signing IP Address:</strong></td><td>${escapeHtml(audit.ip_address)}</td></tr>
      <tr><td><strong>Client Browser Agent:</strong></td><td>${escapeHtml(audit.user_agent)}</td></tr>
      <tr><td><strong>Tamper Evidence SHA-256 Hash:</strong></td><td><code>${escapeHtml(audit.crypto_hash)}</code></td></tr>
    </table>
  </div>
</body>
</html>`;

    await page.setContent(layout, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.75in", right: "0.75in", bottom: "0.75in", left: "0.75in" },
    });
    return Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf as unknown as Uint8Array);
  } finally {
    await (browser as unknown as { close: () => Promise<void> }).close();
  }
}

// Helper used by tests/dev when puppeteer is absent — returns a deterministic
// dummy PDF so the rest of the signing flow can be exercised without Chromium.
export function dummyPdfBytes(contractTitle: string, contractId: string): Buffer {
  const text = `%PDF-1.4\n%Dummy E-Sign PDF for ${contractTitle} (${contractId})\n`;
  return Buffer.from(text, "utf8");
}
