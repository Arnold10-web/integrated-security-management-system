import { PrismaClient } from "../../generated/prisma/client.ts";

export async function nextForceNumber(prisma: PrismaClient, seq?: number): Promise<string> {
  const yyy = String(new Date().getFullYear() % 1000).padStart(3, "0");
  if (seq !== undefined) return `PSG${yyy}/${String(seq).padStart(3, "0")}`;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.forceNumberSequence.findUnique({ where: { year: yyy } });
      if (!existing) {
        const [drivers, guards, users] = await Promise.all([
          tx.driver.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
          tx.guard.findMany({ select: { forceNumber: true } }),
          tx.user.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
        ]);
        const all = [
          ...drivers.map((d) => d.forceNumber!),
          ...guards.map((g) => g.forceNumber),
          ...users.map((u) => u.forceNumber!),
        ];
        let max = 0;
        for (const fn of all) {
          const m = fn.match(/^PSG(\d{3})\/(\d+)$/);
          if (m && m[1] === yyy) max = Math.max(max, Number(m[2]));
        }
        await tx.forceNumberSequence.create({ data: { year: yyy, nextSeq: max + 2 } });
        return max + 1;
      }
      const next = existing.nextSeq;
      await tx.forceNumberSequence.update({ where: { year: yyy }, data: { nextSeq: next + 1 } });
      return next;
    });
    return `PSG${yyy}/${String(updated).padStart(3, "0")}`;
  } catch {
    const [drivers, guards, users] = await Promise.all([
      prisma.driver.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
      prisma.guard.findMany({ select: { forceNumber: true } }),
      prisma.user.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
    ]);
    const all = [
      ...drivers.map((d) => d.forceNumber!),
      ...guards.map((g) => g.forceNumber),
      ...users.map((u) => u.forceNumber!),
    ];
    let max = 0;
    for (const fn of all) {
      const m = fn.match(/^PSG(\d{3})\/(\d+)$/);
      if (m && m[1] === yyy) max = Math.max(max, Number(m[2]));
    }
    return `PSG${yyy}/${String(max + 1).padStart(3, "0")}`;
  }
}
