// Real IT automation scheduler backed by node-cron + persisted CronJob/CronJobRun
// records. The seed installs sensible default jobs once; the IT Officer can
// create/enable/disable/run them from the IT console. Every execution writes a
// durable CronJobRun row so the automation history is real and audit-able.
//
// Handlers are injected from server.ts (they need express `prisma` + the
// notification/email helpers), keeping this module framework-agnostic.

import cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import type { PrismaClient } from "../../generated/prisma/client.ts";

export type CronHandler = (job: {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  cronExpression: string;
}) => Promise<string>;

export const cronValidate = cron.validate;

export interface SchedulerDeps {
  prisma: PrismaClient;
  handlers: Record<string, CronHandler>;
}

export const DEFAULT_JOB_DEFS: {
  name: string;
  description: string;
  cronExpression: string;
  category: string;
}[] = [
  {
    name: "Nightly Encrypted DB Snapshot & Backup",
    description: "Encrypts and archives a full database snapshot to the secure vault.",
    cronExpression: "0 0 * * *",
    category: "Maintenance",
  },
  {
    name: "System Endpoint Vulnerability Scan",
    description: "Scans API routes, SSL and CORS posture for compliance.",
    cronExpression: "0 */6 * * *",
    category: "Security",
  },
  {
    name: "Dormant Account & Session Purge",
    description: "Flags/suspends accounts with no activity beyond the inactivity threshold.",
    cronExpression: "0 2 * * 0",
    category: "Security",
  },
  {
    name: "Support Ticket SLA Escalation Check",
    description: "Escalates helpdesk tickets approaching their response SLA.",
    cronExpression: "*/15 * * * *",
    category: "Notifications",
  },
  {
    name: "Payment Reminder Dispatch",
    description: "Sends payment reminders for pending/overdue invoices.",
    cronExpression: "0 8 * * *",
    category: "Finance",
  },
];

/** Guarantee the default jobs exist (idempotent), returning the DB rows. */
export async function upsertSeedJobs(prisma: PrismaClient) {
  const existing = await prisma.cronJob.findMany();
  const names = new Set(existing.map((j) => j.name));
  for (const def of DEFAULT_JOB_DEFS) {
    if (names.has(def.name)) continue;
    await prisma.cronJob.create({
      data: { ...def, nextRunAt: computeNextRun(def.cronExpression) },
    });
  }
  return prisma.cronJob.findMany({ orderBy: { category: "asc" } });
}

const MINUTE = 60_000;

function frequencyMinutes(expr: string): number {
  // Express step for the minute field, e.g. "*/15" -> 15.
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return 15;
  if (parts[0].startsWith("*/")) {
    const n = Number(parts[0].slice(2));
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (parts[0] === "*") return 1;
  return 15;
}

/** Approximate the next run time of a 5-field cron expression (minute resolution). */
export function computeNextRun(expr: string, from: Date = new Date()): Date {
  if (!cron.validate(expr)) return new Date(from.getTime() + 15 * MINUTE);
  const stepMin = frequencyMinutes(expr);
  const step = stepMin * MINUTE;
  const limit = Date.now() + 366 * 24 * 60 * MINUTE;
  for (let t = from.getTime() + MINUTE; t <= limit; t += step) {
    if (matchesCron(expr, t)) return new Date(t);
  }
  return new Date(limit);
}

/** Minimal matcher for a standard 5-field cron expression (minutes precision). */
function matchesCron(expr: string, timestamp: number): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return true;
  const d = new Date(timestamp);
  const minute = d.getMinutes();
  const hour = d.getHours();
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const dow = d.getDay();
  return (
    fieldMatches(parts[0], minute) &&
    fieldMatches(parts[1], hour) &&
    fieldMatches(parts[2], day) &&
    fieldMatches(parts[3], month) &&
    fieldMatches(parts[4], dow)
  );
}

function fieldMatches(field: string, value: number): boolean {
  if (field === "*") return true;
  if (field.startsWith("*/")) {
    const n = Number(field.slice(2));
    return n > 0 && value % n === 0;
  }
  if (field.includes("-")) {
    const [a, b] = field.split("-").map(Number);
    return value >= a && value <= b;
  }
  if (field.includes(",")) {
    return field.split(",").some((f) => fieldMatches(f, value));
  }
  return Number(field) === value;
}

/** Execute a single job now, recording CronJobRun and updating the job row. */
export async function runJobOnce(
  prisma: PrismaClient,
  jobId: string,
  handler: CronHandler
): Promise<{ ok: boolean; detail: string }> {
  const job = await prisma.cronJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, detail: "Job not found" };
  const started = Date.now();
  const run = await prisma.cronJobRun.create({
    data: { jobId: job.id, status: "RUNNING" },
  });
  try {
    const detail = await handler(job);
    await prisma.$transaction([
      prisma.cronJobRun.update({
        where: { id: run.id },
        data: { status: "SUCCESS", detail, finishedAt: new Date(), durationMs: Date.now() - started },
      }),
      prisma.cronJob.update({
        where: { id: job.id },
        data: { lastRunAt: new Date(), lastStatus: "SUCCESS", lastDetail: detail, nextRunAt: computeNextRun(job.cronExpression) },
      }),
    ]);
    return { ok: true, detail };
  } catch (err: any) {
    const detail = `Failed: ${err?.message || String(err)}`;
    await prisma.$transaction([
      prisma.cronJobRun.update({
        where: { id: run.id },
        data: { status: "FAILED", detail, finishedAt: new Date(), durationMs: Date.now() - started },
      }),
      prisma.cronJob.update({
        where: { id: job.id },
        data: { lastRunAt: new Date(), lastStatus: "FAILED", lastDetail: detail, nextRunAt: computeNextRun(job.cronExpression) },
      }),
    ]);
    return { ok: false, detail };
  }
}

/** Start registered node-cron tasks for all currently-enabled jobs. */
export function registerCronJobs(deps: SchedulerDeps): ScheduledTask[] {
  const tasks: ScheduledTask[] = [];
  void deps.prisma.cronJob.findMany({ where: { enabled: true } }).then((jobs) => {
    for (const job of jobs) {
      const handler = deps.handlers[job.name];
      if (!handler) continue;
      const task = cron.schedule(job.cronExpression, () => {
        void runJobOnce(deps.prisma, job.id, handler);
      });
      tasks.push(task);
    }
  });
  return tasks;
}
