/**
 * Input sanitization using DOMPurify (trusted library).
 */

import DOMPurify from "dompurify";

type PurifyConfig = {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
};

function purify(input: string, options?: PurifyConfig): string {
  if (typeof input !== "string") return "";
  if (typeof window !== "undefined") {
    return DOMPurify.sanitize(input, options as any) as unknown as string;
  }
  return input.replace(/<[^>]*>?/gm, "").trim();
}

/** Full HTML sanitize — strips scripts and dangerous attributes. */
export function sanitizeInput(input: string): string {
  return purify(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/** Email: strip tags and illegal characters, keep email-safe charset. */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") return "";
  const cleaned = purify(email, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .replace(/[^\w.@+\-]/gi, "");
  return cleaned;
}

/**
 * Form free-text values: no HTML tags, no javascript: URIs.
 * Does not attempt SQL filtering (that belongs in parameterized queries / Zod).
 */
export function sanitizeFormValue(value: string): string {
  if (typeof value !== "string") return "";
  return purify(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/javascript\s*:/gi, "")
    .trim();
}

/** Soft HTML allowlist for rich notes (if ever needed). */
export function sanitizeRichText(html: string): string {
  return purify(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"],
    ALLOWED_ATTR: [],
  });
}
