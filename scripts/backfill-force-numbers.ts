/**
 * Backfill all force numbers into the uniform company-wide PSG<YYY>/<SEQ> format.
 *
 * Rules (confirmed with stakeholders):
 *  - Format: PSG<YYY>/<SEQ> (YYY = 3-digit year suffix, SEQ = per-year sequence padded to 3).
 *  - Per-year reset: PSG025/001, PSG025/002 … then PSG026/001 next year.
 *  - Every existing/preexisting number is PRESERVED (never renumbered) where it already follows
 *    the PSG format; non-PSG codes (e.g. FORCE-2026-011, SG-2024-042, PERSIST-…, RBAC-1) are
 *    restyled into PSG using their embedded year + number where derivable.
 *  - Every office staff member (User), guard, driver and rider ends up with a force number.
 *  - No two entities share the same force number within a year.
 *
 * Run with:  npx tsx scripts/backfill-force-numbers.ts
 */
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const PSG = /^PSG(\d{3})\/(\d+)$/;
const YEAR_NUM = /^(?:FORCE|SG)-(\d{4})-(\d+)$/;

function yyyOf(fourDigitYear: string): string {
  return String(Number(fourDigitYear) % 1000).padStart(3, "0");
}

void (async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

  const guards = await prisma.guard.findMany({ select: { id: true, guardCode: true, fullName: true } });
  const drivers = await prisma.driver.findMany({ select: { id: true, driverCode: true, forceNumber: true, fullName: true } });
  const users = await prisma.user.findMany({ select: { id: true, name: true, forceNumber: true, role: true } });

  // Track per-year usage so converted/issued numbers never collide within a year.
  const usedByYear = new Map<string, Set<number>>();
  const addUsed = (fn: string) => {
    const m = fn.match(PSG);
    if (!m) return;
    if (!usedByYear.has(m[1])) usedByYear.set(m[1], new Set());
    usedByYear.get(m[1])!.add(Number(m[2]));
  };
  const used = (year: string, seq: number) => usedByYear.get(year)?.has(seq) ?? false;
  const nextSeq = (year: string): number => {
    let n = 1;
    while (used(year, n)) n++;
    usedByYear.set(year, new Set([...(usedByYear.get(year) ?? []), n]));
    return n;
  };
  const reserve = (year: string, seq: number) => {
    if (!usedByYear.has(year)) usedByYear.set(year, new Set());
    usedByYear.get(year)!.add(seq);
  };

  // Seed the usage map with every already-correct force number.
  for (const g of guards) addUsed(g.guardCode);
  for (const d of drivers) if (d.forceNumber) addUsed(d.forceNumber);
  for (const u of users) if (u.forceNumber) addUsed(u.forceNumber);

  const changes: string[] = [];
  const curYear = yyyOf(String(new Date().getFullYear()));

  const assignForceNumber = (existing: string | null | undefined): string => {
    if (existing) {
      const psg = existing.match(PSG);
      if (psg) return existing; // already correct, preserved as-is
      const legacy = existing.match(YEAR_NUM);
      if (legacy) {
        const year = yyyOf(legacy[1]);
        const seq = Number(legacy[2]);
        if (!used(year, seq)) {
          reserve(year, seq);
          return `PSG${year}/${String(seq).padStart(3, "0")}`;
        }
      }
    }
    return `PSG${curYear}/${String(nextSeq(curYear)).padStart(3, "0")}`;
  };

  for (const g of guards) {
    const next = assignForceNumber(g.guardCode);
    if (next !== g.guardCode) {
      await prisma.guard.update({ where: { id: g.id }, data: { guardCode: next } });
      changes.push(`Guard ${g.fullName}: ${g.guardCode} -> ${next}`);
    }
  }
  for (const d of drivers) {
    const next = assignForceNumber(d.forceNumber);
    if (next !== (d.forceNumber ?? null)) {
      await prisma.driver.update({ where: { id: d.id }, data: { forceNumber: next } });
      changes.push(`Driver ${d.fullName}: ${d.forceNumber ?? "(none)"} -> ${next}`);
    }
  }
  for (const u of users) {
    const next = assignForceNumber(u.forceNumber);
    if (next !== (u.forceNumber ?? null)) {
      await prisma.user.update({ where: { id: u.id }, data: { forceNumber: next } });
      changes.push(`User ${u.name} (${u.role}): ${u.forceNumber ?? "(none)"} -> ${next}`);
    }
  }

  console.log(changes.length ? changes.join("\n") : "No changes required — all force numbers already uniform.");
  await prisma.$disconnect();
})();
