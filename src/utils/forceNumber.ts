/**
 * Uniform company-wide force-number allocation for ALL staff (guards, staff, drivers, riders).
 * Format: PSG<YYY>/<SEQ>  — e.g. PSG025/001 (025 = 3-digit year suffix for 2025, 001 = sequence number).
 * The sequence is PER-YEAR (resets to 001 each year): PSG025/001, PSG025/002 … then PSG026/001 next year.
 * The same <SEQ> may exist in different years — the year prefix makes each force number unique company-wide.
 * Existing/preexisting force numbers already follow this format and are preserved, never renumbered.
 */

const PSG_PATTERN = /^PSG(\d{3})\/(\d+)$/;

/** Returns the next force number in the PSG<YYY>/<SEQ> series for the given year, scanning existing PSG numbers. */
export function nextForceNumber(existing: string[] = [], now = new Date()): string {
  const yyy = String(now.getFullYear() % 1000).padStart(3, "0");
  let max = 0;
  for (const fn of existing) {
    const m = fn.match(PSG_PATTERN);
    if (m && m[1] === yyy) max = Math.max(max, Number(m[2]));
  }
  return `PSG${yyy}/${String(max + 1).padStart(3, "0")}`;
}

/** True when the given value is a valid force number (PSG series or any legacy force number format). */
export function isValidForceNumber(value: string): boolean {
  return /^[A-Za-z0-9/.-]{3,32}$/.test(value.trim());
}
