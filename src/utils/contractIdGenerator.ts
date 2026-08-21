import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Contract ID Naming Standard
 * ─────────────────────────
 * Client Contract:  CC-YYYY-ABBREV-NNN   (e.g., CC-2026-URA-001)
 * Staff Contract:   SC-FORCENUMBER-NNN   (e.g., SC-SG-2024-001-001)
 * Scanned Contract: SCAN-YYYY-ABBREV-NNN (e.g., SCAN-2023-KAM-001)
 */

function getYear(): number {
  return new Date().getFullYear();
}

/**
 * Generate abbreviation from client/company name.
 * Takes first letter of each word (max 4 chars).
 * User can override this suggestion.
 */
export function generateAbbreviation(companyName: string): string {
  const words = companyName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return "UNK";

  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }

  return words.map((w) => w[0]).join("").substring(0, 4).toUpperCase();
}

/**
 * Get the next sequence number for a given prefix and year.
 * Sequence resets each year.
 */
async function getNextSequence(prefix: string, year: number): Promise<number> {
  const pattern = `${prefix}-${year}-%`;
  const count = await prisma.digitalContract.count({
    where: {
      contractId: { startsWith: `${prefix}-${year}-` },
    },
  });
  return count + 1;
}

/**
 * Get the next sequence number for staff contracts per force number.
 */
async function getNextStaffSequence(forceNumber: string): Promise<number> {
  const pattern = `SC-${forceNumber}-`;
  const count = await prisma.digitalContract.count({
    where: {
      contractId: { startsWith: pattern },
    },
  });
  return count + 1;
}

/**
 * Generate a client contract ID.
 * Format: CC-YYYY-ABBREV-NNN
 */
export async function generateClientContractId(
  companyName: string,
  abbreviation?: string
): Promise<string> {
  const year = getYear();
  const abbrev = (abbreviation || generateAbbreviation(companyName)).toUpperCase();
  const seq = await getNextSequence("CC", year);
  return `CC-${year}-${abbrev}-${String(seq).padStart(3, "0")}`;
}

/**
 * Generate a staff contract ID.
 * Format: SC-FORCENUMBER-NNN
 */
export async function generateStaffContractId(forceNumber: string): Promise<string> {
  const seq = await getNextStaffSequence(forceNumber);
  return `SC-${forceNumber}-${String(seq).padStart(3, "0")}`;
}

/**
 * Generate a scanned contract ID.
 * Format: SCAN-YYYY-ABBREV-NNN
 */
export async function generateScannedContractId(
  companyName: string,
  abbreviation?: string
): Promise<string> {
  const year = getYear();
  const abbrev = (abbreviation || generateAbbreviation(companyName)).toUpperCase();
  const seq = await getNextSequence("SCAN", year);
  return `SCAN-${year}-${abbrev}-${String(seq).padStart(3, "0")}`;
}

/**
 * Generate contract ID based on type and parameters.
 */
export async function generateContractId(
  type: "client" | "staff" | "scanned",
  params: { companyName?: string; forceNumber?: string; abbreviation?: string }
): Promise<string> {
  switch (type) {
    case "client":
      return generateClientContractId(params.companyName || "Unknown", params.abbreviation);
    case "staff":
      return generateStaffContractId(params.forceNumber || "UNKNOWN");
    case "scanned":
      return generateScannedContractId(params.companyName || "Unknown", params.abbreviation);
    default:
      throw new Error(`Unknown contract type: ${type}`);
  }
}
