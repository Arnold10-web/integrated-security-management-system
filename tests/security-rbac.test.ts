import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const BASE = process.env.API_BASE || "http://localhost:3000";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface LoginUser {
  name: string;
  email: string;
  role: string;
}

const USERS: LoginUser[] = [
  { name: "Sarah Akello", email: "sarah.akello@iscms.ug", role: "General Manager" },
  { name: "Grace Nakato", email: "grace.nakato@iscms.ug", role: "HR Manager" },
  { name: "Rebecca Nansubuga", email: "rebecca.nansubuga@iscms.ug", role: "HR Assistant" },
  { name: "Agnes Nantege", email: "agnes.nantege@iscms.ug", role: "Records Officer" },
  { name: "Alice Nabatanzi", email: "alice.nabatanzi@iscms.ug", role: "Administrative Officer" },
  { name: "Ivan Ssebana", email: "ivan.ssebana@iscms.ug", role: "Business Development Manager" },
  { name: "Patricia Akello", email: "patricia.akello@iscms.ug", role: "Sales and Marketing Supervisor" },
  { name: "Emma Muwonge", email: "emma.muwonge@iscms.ug", role: "Operations Manager" },
  { name: "Peter Okello", email: "peter.okello@iscms.ug", role: "Regional Manager" },
  { name: "Betty Auma", email: "betty.auma@iscms.ug", role: "Regional Manager" },
  { name: "Francis Ogwang", email: "francis.ogwang@iscms.ug", role: "Fleet Manager" },
  { name: "Tom Ssemakula", email: "tom.ssemakula@iscms.ug", role: "Guard Officer" },
  { name: "David Ssenyonga", email: "david.ssenyonga@iscms.ug", role: "Finance Manager" },
  { name: "Martha Kemigisha", email: "martha.kemigisha@iscms.ug", role: "Accountant" },
  { name: "Sandra Namutebi", email: "sandra.namutebi@iscms.ug", role: "Assistant Accountant" },
  { name: "Winnie Nabukenya", email: "winnie.nabukenya@iscms.ug", role: "Cashier" },
  { name: "Joseph Ochieng", email: "joseph.ochieng@iscms.ug", role: "Armorer" },
  { name: "Joseph Kizza", email: "joseph.kizza@iscms.ug", role: "IT Officer" },
];

const tokens = new Map<string, string>();

beforeAll(async () => {
  // Remove any leftover RBAC test data so the suite is repeatable.
  await prisma.deploymentOrder.deleteMany({ where: { notes: { startsWith: "RBAC" } } });
  const rbacCandidates = await prisma.candidate.findMany({ where: { nationalId: { startsWith: "NIN-RBAC" } }, select: { id: true } });
  await prisma.driver.deleteMany({ where: { sourceRef: { in: rbacCandidates.map((c) => c.id) } } });
  await prisma.candidate.deleteMany({ where: { nationalId: { startsWith: "NIN-RBAC" } } });
  await prisma.jobPosting.deleteMany({ where: { code: { startsWith: "RBAC-JOB" } } });
  await prisma.lead.deleteMany({ where: { companyName: { startsWith: "RBAC" } } });
  await prisma.clientSite.deleteMany({ where: { siteName: { startsWith: "RBAC-TEST" } } });
  await prisma.contract.deleteMany({ where: { contractCode: { startsWith: "CTR-RBCTEST" } } });
  await prisma.invoice.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.reminder.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.cashierTransaction.deleteMany({ where: { guardName: { startsWith: "RBAC" } } });
  await prisma.incident.deleteMany({ where: { title: { startsWith: "RBAC" } } });
  await prisma.notification.deleteMany({ where: { title: { startsWith: "RBAC" } } });
  await prisma.notification.deleteMany({ where: { message: { contains: "RBAC" } } });
  const rbacLeaves = await prisma.leaveRequest.findMany({ where: { guardName: { startsWith: "RBAC" } }, select: { id: true, approvalId: true } });
  for (const l of rbacLeaves) {
    if (l.approvalId) {
      await prisma.approvalAction.deleteMany({ where: { approvalId: l.approvalId } });
      await prisma.approval.delete({ where: { id: l.approvalId } });
    }
  }
  await prisma.leaveRequest.deleteMany({ where: { guardName: { startsWith: "RBAC" } } });
  await prisma.transportRequest.deleteMany({ where: { requestedByName: { startsWith: "RBAC" } } });
  await prisma.contractInquiry.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.siteSurvey.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.contract.deleteMany({ where: { OR: [{ contractCode: { startsWith: "CTR-RBCTEST" } }, { title: { startsWith: "Draft: RBAC" } }] } });
  await prisma.adminRequisition.deleteMany({ where: { itemDescription: { startsWith: "RBAC" } } });
  await prisma.guard.deleteMany({ where: { forceNumber: { startsWith: "PSG026/RBAC" } } });

  for (const u of USERS) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: u.email, password: "password123" }),
    });
    if (res.status !== 200) {
      throw new Error(`Server not ready or login failed for ${u.email} (${res.status}). Start the server on :3000 first.`);
    }
    const body = (await res.json()) as { token: string };
    tokens.set(u.role + "|" + u.name, body.token);
  }
});

afterAll(async () => {
  // Remove any RBAC test data created during this run so no test/seed records
  // (e.g. RBAC-TEST-SITE client sites) leak into the shared dev database and
  // render on real dashboards. Mirrors the beforeAll cleanup above.
  await prisma.deploymentOrder.deleteMany({ where: { notes: { startsWith: "RBAC" } } });
  const rbacCandidates = await prisma.candidate.findMany({ where: { nationalId: { startsWith: "NIN-RBAC" } }, select: { id: true } });
  await prisma.driver.deleteMany({ where: { sourceRef: { in: rbacCandidates.map((c) => c.id) } } });
  await prisma.candidate.deleteMany({ where: { nationalId: { startsWith: "NIN-RBAC" } } });
  await prisma.jobPosting.deleteMany({ where: { code: { startsWith: "RBAC-JOB" } } });
  await prisma.lead.deleteMany({ where: { companyName: { startsWith: "RBAC" } } });
  await prisma.clientSite.deleteMany({ where: { siteName: { startsWith: "RBAC" } } });
  await prisma.contract.deleteMany({ where: { contractCode: { startsWith: "RBAC" } } });
  await prisma.invoice.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.reminder.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.cashierTransaction.deleteMany({ where: { guardName: { startsWith: "RBAC" } } });
  await prisma.incident.deleteMany({ where: { title: { startsWith: "RBAC" } } });
  await prisma.notification.deleteMany({ where: { title: { startsWith: "RBAC" } } });
  await prisma.notification.deleteMany({ where: { message: { contains: "RBAC" } } });
  const rbacLeaves = await prisma.leaveRequest.findMany({ where: { guardName: { startsWith: "RBAC" } }, select: { id: true, approvalId: true } });
  for (const l of rbacLeaves) {
    if (l.approvalId) {
      await prisma.approvalAction.deleteMany({ where: { approvalId: l.approvalId } });
      await prisma.approval.delete({ where: { id: l.approvalId } });
    }
  }
  await prisma.leaveRequest.deleteMany({ where: { guardName: { startsWith: "RBAC" } } });
  await prisma.transportRequest.deleteMany({ where: { requestedByName: { startsWith: "RBAC" } } });
  await prisma.contractInquiry.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.siteSurvey.deleteMany({ where: { clientName: { startsWith: "RBAC" } } });
  await prisma.contract.deleteMany({ where: { OR: [{ contractCode: { startsWith: "CTR-RBCTEST" } }, { title: { startsWith: "Draft: RBAC" } }] } });
  await prisma.adminRequisition.deleteMany({ where: { itemDescription: { startsWith: "RBAC" } } });
  await prisma.guard.deleteMany({ where: { forceNumber: { startsWith: "PSG026/RBAC" } } });
  await prisma.siteDeployment.deleteMany({ where: { siteName: { startsWith: "RBAC" } } });
});

function token(role: string, name?: string): string {
  const t = name ? tokens.get(`${role}|${name}`) : [...tokens.entries()].find(([k]) => k.startsWith(`${role}|`))?.[1];
  if (!t) throw new Error(`No token for ${role}${name ? " " + name : ""}`);
  return t;
}

function authed(path: string, role: string, name?: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token(role, name)}`,
      ...(init?.headers ?? {}),
    },
  });
}

function unauthed(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, init);
}

/* ─────────── Security: authentication & transport protection ─────────── */

describe("Security — authentication & hardened headers", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await unauthed("/api/guards");
    expect(res.status).toBe(401);
  });

  it("rejects a tampered/invalid bearer token with 401", async () => {
    const res = await fetch(`${BASE}/api/guards`, {
      headers: { Authorization: "Bearer not.a.valid.jwt" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid credentials with 401", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sarah.akello@iscms.ug", password: "wrong-password" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns a token for valid credentials", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sarah.akello@iscms.ug", password: "password123" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token?: string };
    expect(body.token).toBeTruthy();
  });

  it("sets hardened security headers on API responses", async () => {
    const res = await unauthed("/api/guards");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-dns-prefetch-control")).toBe("off");
    expect(res.headers.get("x-frame-options")).not.toBeNull();
    expect(res.headers.get("content-security-policy")).not.toBeNull();
  });
});

/* ─────────── RBAC: Client Sites (Marketing/Sales create; Ops view-only; RM excluded) ─────────── */

describe("RBAC — Client Sites", () => {
  it("blocks Regional Manager entirely (no sites access)", async () => {
    const res = await authed("/api/sites", "Regional Manager", "Peter Okello");
    expect(res.status).toBe(403);
  });

  it("blocks Records Officer from sites (view)", async () => {
    const res = await authed("/api/sites", "Records Officer");
    expect(res.status).toBe(403);
  });

  it("allows Operations Manager to view sites", async () => {
    const res = await authed("/api/sites", "Operations Manager");
    expect(res.status).toBe(200);
    const sites = (await res.json()) as unknown[];
    expect(Array.isArray(sites)).toBe(true);
  });

  it("blocks Operations Manager from creating sites (view-only)", async () => {
    const res = await authed("/api/sites", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        clientName: "RBAC-TEST",
        siteName: "RBAC-TEST-SITE",
        location: "Kampala",
        zone: "Central",
        contactPerson: "Test",
        contactPhone: "+256 700 000000",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("allows Business Development Manager to create sites (Marketing/Sales)", async () => {
    const res = await authed("/api/sites", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        clientName: "RBAC-TEST Client",
        siteName: "RBAC-TEST-SITE",
        location: "Kampala",
        zone: "Central",
        region: "Kampala Central",
        contactPerson: "Test Contact",
        contactPhone: "+256 700 000000",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("lets Sales and Marketing Supervisor create sites (attribution flow)", async () => {
    // Sales must originate the deal: create a lead assigned to them, close it won, then onboard the site.
    const leadRes = await authed("/api/leads", "Sales and Marketing Supervisor", undefined, {
      method: "POST",
      body: JSON.stringify({
        companyName: "RBAC-TEST Client",
        contactPerson: "Test Contact",
        email: "rbac.lead@test.ug",
        phone: "+256 700 000001",
        estimatedValue: 50000000,
        source: "Referral",
        assignedTo: "Patricia Akello",
        region: "Kampala Central",
      }),
    });
    expect(leadRes.status).toBe(201);
    const lead = (await leadRes.json()) as { id: string };

    const wonRes = await authed(`/api/leads/${lead.id}`, "Sales and Marketing Supervisor", undefined, {
      method: "PUT",
      body: JSON.stringify({ stage: "Closed Won" }),
    });
    expect(wonRes.status).toBe(200);

    const siteRes = await authed("/api/sites", "Sales and Marketing Supervisor", undefined, {
      method: "POST",
      body: JSON.stringify({
        clientName: "RBAC-TEST Client",
        siteName: "RBAC-TEST-SITE-2",
        location: "Kampala",
        zone: "Central",
        region: "Kampala Central",
        contactPerson: "Test Contact",
        contactPhone: "+256 700 000001",
      }),
    });
    expect(siteRes.status).toBe(201);
  });
});

/* ─────────── RBAC: Lead reassignment ownership binding ─────────── */

describe("RBAC — Lead Ownership & Reassignment", () => {
  it("requires a source channel at lead creation (400 without it)", async () => {
    const res = await authed("/api/leads", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        companyName: "RBAC-NO-SOURCE",
        contactPerson: "Test Contact",
        email: "rbac.nosource@test.ug",
        phone: "+256 700 000050",
        estimatedValue: 5000000,
      }),
    });
    expect(res.status).toBe(400);
  });

  it("blocks Sales and Marketing Supervisor from reassigning lead ownership", async () => {
    const create = await authed("/api/leads", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        companyName: "RBAC-REASSIGN-GUARD",
        contactPerson: "Test Contact",
        email: "rbac.reassign.guard@test.ug",
        phone: "+256 700 000051",
        estimatedValue: 1000000,
        source: "Referral",
        assignedTo: "Patricia Akello",
      }),
    });
    expect(create.status).toBe(201);
    const lead = (await create.json()) as { id: string };

    const res = await authed(`/api/leads/${lead.id}/reassign`, "Sales and Marketing Supervisor", undefined, {
      method: "PUT",
      body: JSON.stringify({ assignedTo: "Ivan Ssebana" }),
    });
    expect(res.status).toBe(403);
  });

  it("reassigning clears the old owner's binding and transfers advance rights", async () => {
    // Patricia (supervisor) originates the deal and owns it by name assignment.
    const create = await authed("/api/leads", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        companyName: `RBAC-REASSIGN-${Date.now()}`,
        contactPerson: "Test Contact",
        email: `rbac.reassign.${Date.now()}@test.ug`,
        phone: "+256 700 000052",
        estimatedValue: 2000000,
        source: "LinkedIn",
        assignedTo: "Patricia Akello",
        region: "Kampala Central",
      }),
    });
    expect(create.status).toBe(201);
    const lead = (await create.json()) as { id: string };

    const patAdvance = await authed(`/api/leads/${lead.id}`, "Sales and Marketing Supervisor", undefined, {
      method: "PUT",
      body: JSON.stringify({ stage: "Qualified" }),
    });
    expect(patAdvance.status).toBe(200);

    // BDM reassigns to Ivan without supplying a new owner id.
    const reassign = await authed(`/api/leads/${lead.id}/reassign`, "Business Development Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ assignedTo: "Ivan Ssebana" }),
    });
    expect(reassign.status).toBe(200);
    const after = (await reassign.json()) as { assignedTo: string; ownerId: string | null };
    expect(after.assignedTo).toBe("Ivan Ssebana");
    expect(after.ownerId).toBeNull();

    // Patricia no longer matches ownerId or assignedTo — she is locked out.
    const patBlocked = await authed(`/api/leads/${lead.id}`, "Sales and Marketing Supervisor", undefined, {
      method: "PUT",
      body: JSON.stringify({ stage: "Proposal Sent" }),
    });
    expect(patBlocked.status).toBe(403);

    // The new owner advances the deal.
    const ivanAdvance = await authed(`/api/leads/${lead.id}`, "Business Development Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ stage: "Proposal Sent" }),
    });
    expect(ivanAdvance.status).toBe(200);
  });
});

/* ─────────── RBAC: Guard records (HR creates; RO only ID fields) ─────────── */

describe("RBAC — Guard Records", () => {
  it("allows HR Manager to view guards", async () => {
    const res = await authed("/api/guards", "HR Manager");
    expect(res.status).toBe(200);
  });

  it("blocks Operations Manager from enrolling guards", async () => {
    const res = await authed("/api/guards", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ fullName: "RBAC Test", forceNumber: "RBAC-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Records Officer from enrolling guards (creation is HR-only)", async () => {
    const res = await authed("/api/guards", "Records Officer", undefined, {
      method: "POST",
      body: JSON.stringify({ fullName: "RBAC Test", forceNumber: "RBAC-2" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Records Officer from editing non-ID guard fields", async () => {
    const list = (await (await authed("/api/guards", "Records Officer")).json()) as { id: string; fullName: string }[];
    const target = list[0];
    const res = await authed(`/api/guards/${target.id}`, "Records Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({ fullName: "Hacked Name Change" }),
    });
    expect(res.status).toBe(403);
  });

  it("allows Records Officer to update ID-card fields only", async () => {
    const list = (await (await authed("/api/guards", "Records Officer")).json()) as {
      id: string;
      idCardStatus: string;
      idCardNumber: string | null;
      idCardIssuedDate: string | null;
      idCardExpiryDate: string | null;
    }[];
    const target = list.find((g) => g.idCardStatus === "Issued & Active") ?? list[0];
    const current = target.idCardStatus ?? "Issued & Active";
    const res = await authed(`/api/guards/${target.id}`, "Records Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({
        idCardStatus: current,
        photoUrl: "data:image/jpeg;base64,Q0FQX1RFTlNU",
        signatureUrl: "data:image/png;base64,U0lHX1RFTlNU",
      }),
    });
    expect(res.status).toBe(200);
  });
});

/* ─────────── RBAC: Deployment Orders (Ops issues; RM fills) ─────────── */

describe("RBAC — Deployment Orders", () => {
  let orderId: string | null = null;
  let siteId: string | null = null;

  it("blocks Regional Manager from issuing an order (Ops-only)", async () => {
    const res = await authed("/api/deployment-orders", "Regional Manager", "Peter Okello", {
      method: "POST",
      body: JSON.stringify({
        siteId: "x",
        siteName: "X",
        clientName: "X",
        region: "Mbarara",
        requiredHeadcount: 2,
        shiftType: "Day",
        targetStartDate: "2026-08-01",
        targetEndDate: "2026-08-31",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("allows Operations Manager to issue an order", async () => {
    const sites = (await (await authed("/api/sites", "Operations Manager")).json()) as { id: string; siteName: string; clientName: string; region: string }[];
    siteId = sites[0]?.id ?? null;
    const res = await authed("/api/deployment-orders", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        siteId: siteId ?? "site-placeholder",
        siteName: sites[0]?.siteName ?? "RBAC Test Site",
        clientName: sites[0]?.clientName ?? "RBAC Test Client",
        region: "Gulu",
        requiredHeadcount: 2,
        shiftType: "Day",
        targetStartDate: "2026-08-01",
        targetEndDate: "2026-08-31",
        notes: "RBAC-TEST",
      }),
    });
    expect(res.status).toBe(201);
    const order = (await res.json()) as { id: string };
    orderId = order.id;
  });

  it("blocks Operations Manager from filling (assigning) an order (RM-only)", async () => {
    if (!orderId) throw new Error("no order created");
    const res = await authed(`/api/deployment-orders/${orderId}/assign`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ guardIds: ["anything"] }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Regional Manager from filling an order outside their region", async () => {
    if (!orderId) throw new Error("no order created");
    const res = await authed(`/api/deployment-orders/${orderId}/assign`, "Regional Manager", "Peter Okello", {
      method: "PUT",
      body: JSON.stringify({ guardIds: ["anything"] }),
    });
    expect(res.status).toBe(403);
  });

  it("allows the matching Regional Manager to fill an order (region gate passed)", async () => {
    if (!orderId) throw new Error("no order created");
    const res = await authed(`/api/deployment-orders/${orderId}/assign`, "Regional Manager", "Betty Auma", {
      method: "PUT",
      body: JSON.stringify({ guardIds: ["no-such-guard-1", "no-such-guard-2"] }),
    });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});

/* ─────────── Deployment: only passed-out guards are deployable ─────────── */

describe("Deployment — passed-out gate (two-step fill flow)", () => {
  let guardId: string;
  let forceNumber: string;
  let orderId: string;

  beforeAll(async () => {
    forceNumber = `RBAC-DEPLOY-${Date.now()}`;
    const createGuard = await authed("/api/guards", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        fullName: "Deploy Gate Test Guard",
        forceNumber,
        designation: "Guard",
        phone: "+256 700 000098",
        nationalId: `NIN-RBAC-${Date.now()}`,
        assignedSite: "RBAC Deploy Test Site",
        region: "Gulu",
        status: "Off Duty",
        joinDate: "2026-08-01",
      }),
    });
    expect(createGuard.status).toBe(201);
    guardId = ((await createGuard.json()) as { id: string }).id;

    const createOrder = await authed("/api/deployment-orders", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        siteId: "site-placeholder",
        siteName: "RBAC Deploy Test Site",
        clientName: "RBAC Deploy Client",
        region: "Gulu",
        requiredHeadcount: 1,
        shiftType: "Day",
        targetStartDate: "2026-08-01",
        targetEndDate: "2026-08-31",
        notes: "RBAC-DEPLOY-GATE",
      }),
    });
    expect(createOrder.status).toBe(201);
    orderId = ((await createOrder.json()) as { id: string }).id;
  });

  it("rejects assigning a guard who is not yet passed out", async () => {
    const res = await authed(`/api/deployment-orders/${orderId}/assign`, "Regional Manager", "Betty Auma", {
      method: "PUT",
      body: JSON.stringify({ guardIds: [guardId] }),
    });
    expect(res.status).toBe(400);
  });

  it("passes a guard out via the lifecycleStage alias (client payload) and notifies OM/RM", async () => {
    const res = await authed(`/api/guards/${guardId}/lifecycle`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ lifecycleStage: "PASSED_OUT" }),
    });
    expect(res.status).toBe(200);
    const dbGuard = await prisma.guard.findUnique({ where: { id: guardId }, select: { lifecycleStage: true } });
    expect(dbGuard?.lifecycleStage).toBe("PASSED_OUT");
    const notifications = await prisma.notification.findMany({
      where: { title: "Guard Passed Out", targetRole: { in: ["Operations Manager", "Regional Manager"] } },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    expect(notifications.some((n) => n.message.includes(forceNumber))).toBe(true);
  });

  it("allows the matching RM to assign the now-passed-out guard", async () => {
    const res = await authed(`/api/deployment-orders/${orderId}/assign`, "Regional Manager", "Betty Auma", {
      method: "PUT",
      body: JSON.stringify({ guardIds: [guardId] }),
    });
    expect(res.status).toBe(200);
    const dbGuard = await prisma.guard.findUnique({ where: { id: guardId }, select: { lifecycleStage: true, assignedSite: true } });
    expect(dbGuard?.lifecycleStage).toBe("DEPLOYED");
  });

  afterAll(async () => {
    await prisma.siteDeployment.deleteMany({ where: { siteName: "RBAC Deploy Test Site" } });
    await prisma.deploymentOrder.deleteMany({ where: { notes: "RBAC-DEPLOY-GATE" } });
    await prisma.notification.deleteMany({ where: { title: "Guard Passed Out", message: { contains: forceNumber } } });
    await prisma.guard.deleteMany({ where: { forceNumber } });
  });
});

/* ─────────── Phase 4: OM analytics-only oversight (view across non-ops modules) ─────────── */
/* Per realignment: OM is informed oversight — view-only on Armoury, K9, Fleet, Training,
   sites, leads, HR & marketing; hands-on owner only where Operations runs the workflow
   (incidents, deployment orders, guard lifecycle). */

describe("Phase 4 — OM analytics-only oversight", () => {
  const viewOnlyModules = [
    { name: "guards", path: "/api/guards", body: { fullName: "RBAC OM", forceNumber: "RBAC-OM" } },
    { name: "vehicles", path: "/api/vehicles", body: { plateNumber: "RBAC-OM-1", vehicleType: "Truck", makeModel: "Test" } },
    { name: "k9s", path: "/api/k9s", body: { dogName: "RBAC OM", handlerName: "RBAC" } },
    { name: "armoury", path: "/api/armoury", body: { weaponCode: "RBAC-OM", weaponType: "Pistol" } },
    { name: "sites", path: "/api/sites", body: { siteName: "RBAC-TEST OM", clientName: "RBAC" } },
    { name: "leads", path: "/api/leads", body: { companyName: "RBAC OM", contactName: "RBAC" } },
    { name: "training", path: "/api/cohorts", body: { cohortCode: "RBAC-OM", title: "RBAC" } },
  ];

  it.each(viewOnlyModules)("is view-only on $name (read allowed, create denied)", async ({ path, body }) => {
    const read = await authed(path, "Operations Manager");
    expect(read.status).toBe(200);
    const create = await authed(path, "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify(body),
    });
    expect(create.status).toBe(403);
  });

  it("can open guard records but cannot enroll (create) guards", async () => {
    const res = await authed("/api/guards", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ fullName: "RBAC OM", forceNumber: "RBAC-OM-2" }),
    });
    expect(res.status).toBe(403);
  });

  it("is a hands-on owner on incidents (create allowed)", async () => {
    const res = await authed("/api/incidents", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        title: "RBAC OM oversight test",
        siteName: "RBAC Test Site",
        reportedByGuard: "RBAC Tester",
        category: "Security",
        severity: "Low",
        description: "Verification that OM is a hands-on incident owner.",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("is a hands-on owner on deployment orders (create allowed)", async () => {
    const sites = (await (await authed("/api/sites", "Operations Manager")).json()) as { id: string; siteName: string }[];
    const res = await authed("/api/deployment-orders", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        siteId: sites[0]?.id ?? "site-placeholder",
        siteName: sites[0]?.siteName ?? "RBAC Test Site",
        clientName: "RBAC Test Client",
        region: "Kampala",
        requiredHeadcount: 2,
        shiftType: "Day",
        targetStartDate: "2026-08-01",
        targetEndDate: "2026-08-31",
        notes: "RBAC OM",
      }),
    });
    expect(res.status).toBe(201);
  });

  it("can move guards through the lifecycle (OM runs the training pipeline step)", async () => {
    const guards = (await (await authed("/api/guards", "Operations Manager")).json()) as { id: string }[];
    const target = guards[0];
    const res = await authed(`/api/guards/${target.id}/lifecycle`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
  });
});

/* ─────────── RBAC: Fleet approvals (Fleet Manager only) ─────────── */

describe("RBAC — Driver Licence Approvals", () => {
  it("blocks Operations Manager from approving a driver (Fleet-only)", async () => {
    const drivers = (await (await authed("/api/drivers", "Operations Manager")).json()) as { id: string }[];
    const target = drivers[0];
    const res = await authed(`/api/drivers/${target.id}/approve`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it("lets Fleet Manager through the RBAC gate (approve path is Fleet-scoped)", async () => {
    const res = await authed("/api/drivers/no-such-driver/approve", "Fleet Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.status).toBe(404);
  });
});

/* ─────────── RBAC: Contracts approval chain (Marketing drafts → GM sole approval, no threshold, no Finance step) ─────────── */
/* Spec (ISCMS-Implementation-Lockdown-Spec §6): Marketing drafts the client contract, General Manager is the sole approver for ALL client contracts with no amount threshold. Finance and BDM are not approvers. OM is out of contract approval entirely — site-survey support only. */

describe("RBAC — Contract Approval Chain", () => {
  let contractId: string | null = null;

  it("blocks Operations Manager from creating staff contracts (HR-only)", async () => {
    const res = await authed("/api/contracts", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        contractCode: "CTR-RBCTEST-STAFF",
        title: "RBAC Staff",
        contractType: "Staff Contract",
        partyName: "Test Employee",
        category: "Employment",
        startDate: "2026-08-01",
        endDate: "2027-07-31",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("lets Business Development Manager create a Draft client contract at GM step", async () => {
    const res = await authed("/api/contracts", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        contractCode: "CTR-RBCTEST-CLIENT",
        title: "RBAC Client Contract",
        contractType: "Client Contract",
        partyName: "RBAC Test Ltd",
        category: "Corporate Client Service Agreement",
        startDate: "2026-08-01",
        endDate: "2028-07-31",
        valueUgx: 50000000,
      }),
    });
    expect(res.status).toBe(201);
    const contract = (await res.json()) as { id: string; status: string; approvalStep: string };
    expect(contract.status).toBe("Draft");
    expect(contract.approvalStep).toBe("GM");
    contractId = contract.id;
  });

  it("blocks Operations Manager from editing at the GM step", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ slaTerms: "Hacked terms" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Operations Manager from approving (OM has zero contract authority)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Finance Manager from approving (Finance not part of the chain)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Business Development Manager from approving (Marketing drafts but does not approve)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Business Development Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Finance Manager from editing a client contract (no Finance validation step)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ slaTerms: "4 day guards, 2 night guards" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets Operations Manager record a supporting site survey (survey support only, no approval rights)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "survey", siteSurvey: "Site verified: perimeter sound, 4 access points, 3 day + 2 night guards sufficient." }),
    });
    expect(res.status).toBe(200);
    const contract = (await res.json()) as { siteSurvey: string; approvalStep: string };
    expect(contract.siteSurvey).toContain("perimeter sound");
    expect(contract.approvalStep).toBe("GM");
  });

  it("lets General Manager approve directly → Done/Active (sole approver, no threshold)", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const contract = (await res.json()) as { approvalStep: string; status: string };
    expect(contract.approvalStep).toBe("Done");
    expect(contract.status).toBe("Active");
  });

  it("blocks non-Records roles from archiving contracts", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "archive" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets Records Officer archive the completed contract", async () => {
    if (!contractId) throw new Error("no contract created");
    const res = await authed(`/api/contracts/${contractId}`, "Records Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "archive" }),
    });
    expect(res.status).toBe(200);
    const contract = (await res.json()) as { status: string };
    expect(contract.status).toBe("Archived");
  });
});

/* ─────────── RBAC: Client contracts — no GM threshold (any value, sole GM approval) ─────────── */

describe("RBAC — Contract Approval Chain (no threshold — high-value contract)", () => {
  let highContractId: string | null = null;

  it("lets Business Development Manager create a high-value client contract", async () => {
    const res = await authed("/api/contracts", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        contractCode: "CTR-RBCTEST-HIGH",
        title: "RBAC High-Value Contract",
        contractType: "Client Contract",
        partyName: "RBAC High Value Ltd",
        category: "Corporate Client Service Agreement",
        startDate: "2026-08-01",
        endDate: "2028-07-31",
        valueUgx: 135000000,
      }),
    });
    expect(res.status).toBe(201);
    highContractId = ((await res.json()) as { id: string }).id;
  });

  it("blocks Finance Manager from approving a high-value contract (no Finance step at any value)", async () => {
    if (!highContractId) throw new Error("no high-value contract created");
    const res = await authed(`/api/contracts/${highContractId}`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets General Manager approve a high-value contract directly → Active (no 100M gate)", async () => {
    if (!highContractId) throw new Error("no high-value contract created");
    const res = await authed(`/api/contracts/${highContractId}`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "approve" }),
    });
    expect(res.status).toBe(200);
    const contract = (await res.json()) as { approvalStep: string; status: string };
    expect(contract.approvalStep).toBe("Done");
    expect(contract.status).toBe("Active");
  });

  it("blocks non-GM roles from voiding a client contract (GM-only void, mandatory reason)", async () => {
    if (!highContractId) throw new Error("no high-value contract created");
    const res = await authed(`/api/contracts/${highContractId}`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "void", voidReason: "Try" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets General Manager void a client contract with a mandatory reason", async () => {
    if (!highContractId) throw new Error("no high-value contract created");
    const res = await authed(`/api/contracts/${highContractId}`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "void", voidReason: "Client closed operations after contract expiry" }),
    });
    expect(res.status).toBe(200);
    const contract = (await res.json()) as { status: string; voidReason: string };
    expect(contract.status).toBe("Terminated");
    expect(contract.voidReason).toContain("Client closed");
  });
});

/* ─────────── RBAC: Admin requisitions — GM approves every one, no threshold ─────────── */

describe("RBAC — Requisition Approval (GM-only, every requisition)", () => {
  let reqId: string | null = null;

  it("lets Administrative Officer create a requisition (Pending Approval)", async () => {
    const res = await authed("/api/requisitions", "Administrative Officer", undefined, {
      method: "POST",
      body: JSON.stringify({
        reqCode: "ADM-REQ-RBCTEST-001",
        department: "Operations",
        requestedBy: "Test Requester",
        itemDescription: "RBAC test first aid kits",
        quantity: 5,
        estimatedCostUgx: 450000,
        priority: "High",
        dateRequested: "2026-08-09",
      }),
    });
    expect(res.status).toBe(201);
    reqId = ((await res.json()) as { id: string }).id;
  });

  it("blocks Administrative Officer from approving a requisition (GM-only)", async () => {
    if (!reqId) throw new Error("no requisition created");
    const res = await authed(`/api/requisitions/${reqId}/approve`, "Administrative Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it("blocks Finance Manager from approving a requisition (GM-only)", async () => {
    if (!reqId) throw new Error("no requisition created");
    const res = await authed(`/api/requisitions/${reqId}/approve`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(403);
  });

  it("lets General Manager approve a pending requisition (no threshold — any amount)", async () => {
    if (!reqId) throw new Error("no requisition created");
    const res = await authed(`/api/requisitions/${reqId}/approve`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const req = (await res.json()) as { status: string; approvedBy: string };
    expect(req.status).toBe("Approved");
    expect(req.approvedBy).toBe("Sarah Akello");
  });

  it("blocks approving an already-approved requisition", async () => {
    if (!reqId) throw new Error("no requisition created");
    const res = await authed(`/api/requisitions/${reqId}/approve`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("lets General Manager reject a second requisition with a mandatory reason", async () => {
    const created = await authed("/api/requisitions", "Administrative Officer", undefined, {
      method: "POST",
      body: JSON.stringify({
        reqCode: "ADM-REQ-RBCTEST-002",
        department: "Administrations",
        requestedBy: "Test Requester",
        itemDescription: "RBAC test office chairs",
        quantity: 3,
        estimatedCostUgx: 1200000,
        priority: "Medium",
        dateRequested: "2026-08-09",
      }),
    });
    expect(created.status).toBe(201);
    const req = (await created.json()) as { id: string };
    const res = await authed(`/api/requisitions/${req.id}/reject`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ reason: "Not in current budget cycle" }),
    });
    expect(res.status).toBe(200);
    const rejected = (await res.json()) as { status: string; rejectionReason: string; rejectedBy: string };
    expect(rejected.status).toBe("Rejected");
    expect(rejected.rejectionReason).toBe("Not in current budget cycle");
    expect(rejected.rejectedBy).toBe("Sarah Akello");
  });

  it("requires a reason to reject a requisition", async () => {
    const created = await authed("/api/requisitions", "Administrative Officer", undefined, {
      method: "POST",
      body: JSON.stringify({
        reqCode: "ADM-REQ-RBCTEST-003",
        department: "Human Resources",
        requestedBy: "Test Requester",
        itemDescription: "RBAC test staff ID badges",
        quantity: 20,
        estimatedCostUgx: 300000,
        priority: "Low",
        dateRequested: "2026-08-09",
      }),
    });
    expect(created.status).toBe(201);
    const req = (await created.json()) as { id: string };
    const res = await authed(`/api/requisitions/${req.id}/reject`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ reason: "" }),
    });
    expect(res.status).toBe(400);
  });
});

/* ─────────── RBAC: Recruitment (HR + Operations Manager, v3.0) ─────────── */

describe("RBAC — Recruitment (HR + Operations)", () => {
  let postingId: string | null = null;

  it("allows Operations Manager to view recruitment candidates (v3.0 Ops recruitment)", async () => {
    const res = await authed("/api/candidates", "Operations Manager");
    expect(res.status).toBe(200);
  });

  it("allows HR Manager to view recruitment candidates", async () => {
    const res = await authed("/api/candidates", "HR Manager");
    expect(res.status).toBe(200);
  });

  it("blocks Records Officer from creating candidates (HR-only full access)", async () => {
    const res = await authed("/api/candidates", "Records Officer", undefined, {
      method: "POST",
      body: JSON.stringify({ jobPostingId: "x", fullName: "RBAC Test Candidate", email: "rbac@test.ug", phone: "+256 700 000002" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets HR Manager open a job posting (recruitment is HR-owned)", async () => {
    const res = await authed("/api/job-postings", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        title: "Security Guard (RBAC Test)",
        code: "RBAC-JOB-001",
        department: "Operations",
        location: "Kampala",
        description: "Test posting",
        requirements: "Valid NIN",
        positionsCount: 2,
      }),
    });
    expect(res.status).toBe(201);
    const posting = (await res.json()) as { id: string };
    postingId = posting.id;
  });

  it("allows HR Assistant to create a candidate against an HR job posting", async () => {
    if (!postingId) throw new Error("no posting created");
    const res = await authed("/api/candidates", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        jobPostingId: postingId,
        fullName: "RBAC Test Candidate",
        email: "rbac.candidate@test.ug",
        phone: "+256 700 000002",
        roleType: "Security Guard",
        nationalId: "NIN-RBAC-0001",
      }),
    });
    expect(res.status).toBe(201);
  });
});

describe("RBAC — Rider onboarding (riders are first-class in the Fleet register)", () => {
  let riderCandidateId: string | null = null;
  let riderDriverCode: string | null = null;

  beforeAll(async () => {
    const leftover = await prisma.candidate.findMany({ where: { nationalId: { startsWith: "NIN-RBAC-RIDER" } } });
    await prisma.driver.deleteMany({ where: { sourceRef: { in: leftover.map((c) => c.id) } } });
    await prisma.candidate.deleteMany({ where: { nationalId: { startsWith: "NIN-RBAC-RIDER" } } });
    await prisma.jobPosting.deleteMany({ where: { code: "RBAC-JOB-RIDER" } });
  });

  it("creates a job posting and a Rider candidate with a motorcycle licence", async () => {
    const post = await authed("/api/job-postings", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        title: "Tactical Rider (RBAC Test)",
        code: "RBAC-JOB-RIDER",
        department: "Operations",
        location: "Kampala",
        description: "Test rider posting",
        requirements: "Valid Class A licence",
        positionsCount: 2,
      }),
    });
    expect(post.status).toBe(201);
    const posting = (await post.json()) as { id: string };

    const res = await authed("/api/candidates", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        jobPostingId: posting.id,
        fullName: "Rider RBAC Candidate",
        email: "rider.rbac@test.ug",
        phone: "+256 700 000003",
        roleType: "Rider",
        nationalId: "NIN-RBAC-RIDER-0001",
        licenceNumber: "UG-DL-555001",
        licenceClass: "Class A (Motorcycles)",
        licenceExpiryDate: "2028-05-20",
      }),
    });
    expect(res.status).toBe(201);
    const candidate = (await res.json()) as { id: string };
    riderCandidateId = candidate.id;
  });

  it("hiring a Rider creates a pending Fleet record marked as Rider (not Driver)", async () => {
    if (!riderCandidateId) throw new Error("no rider candidate");
    const res = await authed(`/api/candidates/${riderCandidateId}`, "HR Assistant", undefined, {
      method: "PUT",
      body: JSON.stringify({ status: "Hired", interviewDate: "2026-07-10", interviewScore: 88, notes: "Hired as tactical rider" }),
    });
    expect(res.status).toBe(200);

    const drivers = (await (await authed("/api/drivers", "Fleet Manager")).json()) as Array<{
      roleType?: string;
      fullName: string;
      licenceClass: string;
      licenceNumber: string;
      sourceRef: string;
      status: string;
      driverCode: string;
      forceNumber?: string;
    }>;
    const rider = drivers.find((d) => d.sourceRef === riderCandidateId);
    expect(rider).toBeDefined();
    expect(rider!.roleType).toBe("Rider");
    expect(rider!.forceNumber).toMatch(/^PSG\d{3}\/\d{3,}$/);
    expect(rider!.licenceClass).toBe("Class A (Motorcycles)");
    expect(rider!.licenceNumber).toBe("UG-DL-555001");
    expect(rider!.status).toBe("Pending FM Approval");
    riderDriverCode = rider!.driverCode;
  });

  it("Fleet Manager can approve the onboarded rider", async () => {
    const drivers = (await (await authed("/api/drivers", "Fleet Manager")).json()) as Array<{ id: string; sourceRef: string }>;
    const rider = drivers.find((d) => d.sourceRef === riderCandidateId);
    if (!rider) throw new Error("rider not onboarded");
    const res = await authed(`/api/drivers/${rider.id}/approve`, "Fleet Manager", undefined, { method: "PUT" });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as { status: string; roleType?: string };
    expect(updated.status).toBe("Active Duty");
    expect(updated.roleType).toBe("Rider");
  });

  it("leaves a traceable rider code for the audit trail", async () => {
    expect(riderDriverCode).toBeTruthy();
  });

  it("issues a uniform PSG<YY>/<SEQ> force number that is unique company-wide", async () => {
    const drivers = (await (await authed("/api/drivers", "Fleet Manager")).json()) as Array<{ forceNumber?: string }>;
    const fns = drivers.map((d) => d.forceNumber).filter((f): f is string => Boolean(f));
    const psg = fns.filter((f) => /^PSG\d{3}\/\d+$/.test(f));
    expect(psg.length).toBeGreaterThan(0);
    expect(new Set(psg).size).toBe(psg.length);
  });
});

/* ─────────── RBAC: Acting-privileges delegation (§11, HR-initiated / IT-executed) ─────────── */

describe("RBAC — Acting Privileges (§11 HR requests, IT executes, additive)", () => {
  let targetId: string | null = null;
  let financeManagerId: string | null = null;
  let draftContractId: string | null = null;
  let requestId: string | null = null;

  const freshLogin = async (email: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    expect(res.status).toBe(200);
    return (await res.json()) as { token: string; user: { role: string; effectiveRole: string; actingRole?: string } };
  };

  beforeAll(async () => {
    // Clean up any leftover acting grants/requests so the suite is repeatable.
    await prisma.actingPrivilegeRequest.deleteMany({});
    await prisma.user.updateMany({ where: { email: "rebecca.nansubuga@iscms.ug" }, data: { actingRole: null, actingExpiresAt: null, actingGrantedBy: null, actingGrantedAt: null } });
    await prisma.user.updateMany({ where: { email: "david.ssenyonga@iscms.ug" }, data: { actingRole: null, actingExpiresAt: null, actingGrantedBy: null, actingGrantedAt: null } });
    await prisma.contract.deleteMany({ where: { contractCode: { startsWith: "CTR-ACTING" } } });
    const users = (await (await authed("/api/auth/users", "IT Officer")).json()) as Array<{ id: string; email: string }>;
    targetId = users.find((u) => u.email === "rebecca.nansubuga@iscms.ug")?.id ?? null;
    financeManagerId = users.find((u) => u.email === "david.ssenyonga@iscms.ug")?.id ?? null;
  });

  it("blocks non-HR roles from initiating an acting-coverage request", async () => {
    if (!targetId) throw new Error("no target user");
    const res = await authed("/api/auth/acting-requests", "IT Officer", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: targetId, actingRole: "HR Manager", expiresAt: "2026-09-01T00:00:00Z", reason: "RBAC test" }),
    });
    expect(res.status).toBe(403);
  });

  it("blocks an invalid/expired acting-coverage request", async () => {
    if (!targetId) throw new Error("no target user");
    const res = await authed("/api/auth/acting-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: targetId, actingRole: "HR Manager", expiresAt: "2020-01-01T00:00:00Z", reason: "RBAC test" }),
    });
    expect(res.status).toBe(400);
  });

  it("lets the HR Manager initiate a request (who, role, why)", async () => {
    if (!targetId) throw new Error("no target user");
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const res = await authed("/api/auth/acting-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: targetId, actingRole: "HR Manager", expiresAt, reason: "HR Manager on leave 14–21 Aug" }),
    });
    expect(res.status).toBe(201);
    const request = (await res.json()) as { id: string; status: string; requestedByName: string; reason: string };
    expect(request.status).toBe("Pending");
    expect(request.requestedByName).toBe("Grace Nakato");
    expect(request.reason).toBe("HR Manager on leave 14–21 Aug");
    requestId = request.id;
  });

  it("rejects a self-initiated request (targeting the requester)", async () => {
    const grace = (await (await authed("/api/auth/users", "IT Officer")).json()) as Array<{ id: string; email: string }>;
    const graceId = grace.find((u) => u.email === "grace.nakato@iscms.ug")?.id;
    if (!graceId) throw new Error("no HR Manager");
    const res = await authed("/api/auth/acting-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: graceId, actingRole: "General Manager", expiresAt: "2026-09-01T00:00:00Z", reason: "RBAC test" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects requests for an executive role except the FM→GM exception (§11.6)", async () => {
    if (!targetId) throw new Error("no target user");
    const res = await authed("/api/auth/acting-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: targetId, actingRole: "General Manager", expiresAt: "2026-09-01T00:00:00Z", reason: "RBAC test" }),
    });
    expect(res.status).toBe(400);
    const fmRes = await authed("/api/auth/acting-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ targetUserId: financeManagerId, actingRole: "General Manager", expiresAt: "2026-09-01T00:00:00Z", reason: "GM coverage by FM" }),
    });
    expect(fmRes.status).toBe(201);
  });

  it("blocks non-IT roles from executing an HR request", async () => {
    if (!requestId) throw new Error("no request");
    const res = await authed(`/api/auth/acting-requests/${requestId}/execute`, "HR Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("lets the IT Officer execute the grant on the HR request", async () => {
    if (!requestId) throw new Error("no request");
    const res = await authed(`/api/auth/acting-requests/${requestId}/execute`, "IT Officer", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as { actingRole: string; actingGrantedBy: string };
    expect(updated.actingRole).toBe("HR Manager");
    expect(updated.actingGrantedBy).toBe("Joseph Kizza");
  });

  it("cannot execute the same request twice", async () => {
    if (!requestId) throw new Error("no request");
    const res = await authed(`/api/auth/acting-requests/${requestId}/execute`, "IT Officer", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(400);
  });

  it("signs the JWT with base role + actingRole (additive, §11.4)", async () => {
    const body = await freshLogin("rebecca.nansubuga@iscms.ug");
    expect(body.user.role).toBe("HR Assistant");
    expect(body.user.effectiveRole).toBe("HR Manager");
    expect(body.user.actingRole).toBe("HR Manager");
    const payload = JSON.parse(Buffer.from(body.token.split(".")[1], "base64url").toString()) as { role: string; actingRole?: string };
    expect(payload.role).toBe("HR Assistant");
    expect(payload.actingRole).toBe("HR Manager");
  });

  it("lets the acting HR Manager issue a staff contract (HR-Manager-only, §11.5 attribution)", async () => {
    const created = await authed("/api/contracts", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        contractCode: "CTR-ACTING-001",
        title: "Acting Privileges Staff Contract",
        contractType: "Staff Contract",
        partyName: "Acting Test Employee",
        category: "Employment",
        startDate: "2026-08-10",
        endDate: "2027-08-09",
      }),
    });
    expect(created.status).toBe(201);
    const draft = (await created.json()) as { id: string; status: string };
    expect(draft.status).toBe("Draft");
    draftContractId = draft.id;

    const login = await freshLogin("rebecca.nansubuga@iscms.ug");
    const res = await fetch(`${BASE}/api/contracts/${draftContractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
      body: JSON.stringify({ action: "issue" }),
    });
    expect(res.status).toBe(200);
    const issued = (await res.json()) as { status: string; issuedBy: string };
    expect(issued.status).toBe("Active");
    expect(issued.issuedBy).toContain("Acting HR Manager");
  });

  it("keeps the acting user's own role capabilities (additive, not swap)", async () => {
    // An HR Assistant can still draft a staff contract after acting grant.
    const created = await authed("/api/contracts", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        contractCode: "CTR-ACTING-002",
        title: "Additive Own-Role Contract",
        contractType: "Staff Contract",
        partyName: "Additive Test Employee",
        category: "Employment",
        startDate: "2026-08-10",
        endDate: "2027-08-09",
      }),
    });
    expect(created.status).toBe(201);
  });

  it("records both the HR request and the IT grant in the audit trail", async () => {
    const audit = (await (await authed("/api/audit-logs", "IT Officer")).json()) as Array<{ action: string; details: string; userRole: string }>;
    const actions = audit.filter((a) => a.action.includes("Acting Privileges"));
    expect(actions.some((a) => a.action === "Acting Privileges Requested")).toBe(true);
    expect(actions.some((a) => a.action === "Acting Privileges Granted")).toBe(true);
  });

  it("rejects revoking acting privileges by non-IT roles", async () => {
    if (!targetId) throw new Error("no target user");
    const res = await authed(`/api/auth/users/${targetId}/acting`, "HR Manager", undefined, { method: "DELETE" });
    expect(res.status).toBe(403);
  });

  it("lets IT Officer revoke acting privileges", async () => {
    if (!targetId) throw new Error("no target user");
    const res = await authed(`/api/auth/users/${targetId}/acting`, "IT Officer", undefined, { method: "DELETE" });
    expect(res.status).toBe(200);
    const revoked = (await res.json()) as { actingRole: string | null };
    expect(revoked.actingRole).toBeNull();
  });

  it("falls back to the base role after revocation", async () => {
    if (!draftContractId) throw new Error("no draft contract");
    const login = await freshLogin("rebecca.nansubuga@iscms.ug");
    expect(login.user.effectiveRole).toBe("HR Assistant");
    const res = await fetch(`${BASE}/api/contracts/${draftContractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${login.token}` },
      body: JSON.stringify({ action: "issue" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("RBAC — Invoice approval before send (Phase 3)", () => {
  let draftId = "";
  let sentId = "";

  it("creates an invoice in Draft (approval required before sending)", async () => {
    const res = await authed("/api/invoices", "Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({
        clientName: "RBAC-APPROVAL",
        siteName: "RBAC Test Site",
        amount: 15000000,
        dueDate: "2026-09-10",
      }),
    });
    expect(res.status).toBe(201);
    const inv = (await res.json()) as { id: string; status: string };
    expect(inv.status).toBe("Draft");
    draftId = inv.id;
  });

  it("blocks the Accountant from approving an invoice (FM-only)", async () => {
    const res = await authed(`/api/invoices/${draftId}/approve`, "Accountant", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("blocks the Cashier from approving an invoice (FM-only)", async () => {
    const res = await authed(`/api/invoices/${draftId}/approve`, "Cashier", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("blocks the Assistant Accountant from creating an invoice (view-only)", async () => {
    const res = await authed("/api/invoices", "Assistant Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({ clientName: "RBAC-VIEW", siteName: "S", amount: 1000, dueDate: "2026-09-10" }),
    });
    expect(res.status).toBe(403);
  });

  it("lets the Assistant Accountant read the invoice ledger (view-only access)", async () => {
    const res = await authed("/api/invoices", "Assistant Accountant");
    expect(res.status).toBe(200);
  });

  it("lets the Finance Manager approve a Draft invoice for sending", async () => {
    const res = await authed(`/api/invoices/${draftId}/approve`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(200);
    const inv = (await res.json()) as { status: string; approvedBy: string | null; sentAt: string | null };
    expect(inv.status).toBe("Pending");
    expect(inv.approvedBy).toBeTruthy();
    expect(inv.sentAt).toBeTruthy();
    sentId = draftId;
  });

  it("cannot approve the same invoice twice (already sent)", async () => {
    const res = await authed(`/api/invoices/${sentId}/approve`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(400);
  });

  it("cannot mark a Draft invoice Paid or Overdue before approval", async () => {
    const res = await authed("/api/invoices", "Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({ clientName: "RBAC-UNPAID", siteName: "S", amount: 900000, dueDate: "2026-09-10" }),
    });
    const inv = (await res.json()) as { id: string };
    const upd = await authed(`/api/invoices/${inv.id}`, "Accountant", undefined, {
      method: "PUT",
      body: JSON.stringify({ status: "Paid" }),
    });
    expect(upd.status).toBe(400);
  });
});

describe("RBAC — Cashier disbursement FM-approval flow (Phase 3)", () => {
  let pendingId = "";
  let rejectId = "";

  it("lets the Cashier request a disbursement (Pending Approval)", async () => {
    const res = await authed("/api/cashier-transactions", "Cashier", undefined, {
      method: "POST",
      body: JSON.stringify({
        guardName: "RBAC-Guard Cashier",
        forceNumber: "SG-RBAC-001",
        type: "Salary Advance",
        amount: 200000,
        phone: "+256700000001",
      }),
    });
    expect(res.status).toBe(201);
    const tx = (await res.json()) as { id: string; status: string };
    expect(tx.status).toBe("Pending Approval");
    pendingId = tx.id;
  });

  it("blocks the Cashier from approving their own disbursement (FM-only)", async () => {
    const res = await authed(`/api/cashier-transactions/${pendingId}/approve`, "Cashier", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("blocks the Accountant from approving a disbursement (FM-only)", async () => {
    const res = await authed(`/api/cashier-transactions/${pendingId}/approve`, "Accountant", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("blocks the Accountant from requesting a disbursement (Cashier/FM only)", async () => {
    const res = await authed("/api/cashier-transactions", "Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({ guardName: "RBAC-Blocked", forceNumber: "SG-X", type: "Salary Advance", amount: 1000 }),
    });
    expect(res.status).toBe(403);
  });

  it("lets the Finance Manager approve the pending disbursement", async () => {
    const res = await authed(`/api/cashier-transactions/${pendingId}/approve`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(200);
    const tx = (await res.json()) as { status: string; approvedBy: string | null };
    expect(tx.status).toBe("Disbursed");
    expect(tx.approvedBy).toBeTruthy();
  });

  it("rejects an already-approved disbursement (idempotency guard)", async () => {
    const res = await authed(`/api/cashier-transactions/${pendingId}/approve`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(400);
  });

  it("lets the Finance Manager reject a different pending disbursement", async () => {
    const create = await authed("/api/cashier-transactions", "Cashier", undefined, {
      method: "POST",
      body: JSON.stringify({ guardName: "RBAC-Guard Reject", forceNumber: "SG-RBAC-002", type: "Meal Allowance", amount: 80000 }),
    });
    const tx = (await create.json()) as { id: string };
    rejectId = tx.id;
    const res = await authed(`/api/cashier-transactions/${rejectId}/reject`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(200);
    const rejected = (await res.json()) as { status: string; rejectedBy: string | null };
    expect(rejected.status).toBe("Rejected");
    expect(rejected.rejectedBy).toBeTruthy();
  });

  it("blocks the Cashier from reading FM-approval mutations (FM-only)", async () => {
    const res = await authed(`/api/cashier-transactions/${rejectId}/approve`, "Cashier", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });
});

describe("RBAC — Marketing-led collection reminders & collections view (Phase 3)", () => {
  let draftId = "";
  let sentId = "";

  it("seeds a Draft and an approved invoice for reminder tests", async () => {
    const createDraft = await authed("/api/invoices", "Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({ clientName: "RBAC-REMIND", siteName: "S", amount: 3000000, dueDate: "2026-09-10" }),
    });
    expect(createDraft.status).toBe(201);
    draftId = ((await createDraft.json()) as { id: string }).id;

    const createSent = await authed("/api/invoices", "Accountant", undefined, {
      method: "POST",
      body: JSON.stringify({ clientName: "RBAC-REMIND-2", siteName: "S", amount: 4500000, dueDate: "2026-08-01" }),
    });
    sentId = ((await createSent.json()) as { id: string }).id;
    const approved = await authed(`/api/invoices/${sentId}/approve`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(approved.status).toBe(200);
  });

  it("blocks reminding a Draft invoice (not yet sent)", async () => {
    const res = await authed(`/api/invoices/${draftId}/remind`, "Business Development Manager", undefined, { method: "POST", body: "{}" });
    expect(res.status).toBe(400);
  });

  it("logs a reminder for a sent invoice (skipped when credentials absent)", async () => {
    const res = await authed(`/api/invoices/${sentId}/remind`, "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({ recipient: "client@rbac.ug" }),
    });
    expect([200, 202]).toContain(res.status);
    const reminder = (await res.json()) as { status: string; invoiceNumber: string; clientName: string };
    expect(reminder.invoiceNumber).toBeTruthy();
    expect(reminder.clientName).toContain("RBAC-REMIND");
    expect(["Sent", "Skipped"]).toContain(reminder.status);
  });

  it("lets the Sales and Marketing Supervisor trigger a reminder too", async () => {
    const res = await authed(`/api/invoices/${sentId}/remind`, "Sales and Marketing Supervisor", undefined, {
      method: "POST",
      body: JSON.stringify({ recipient: "+256700000099" }),
    });
    expect([200, 202]).toContain(res.status);
  });

  it("exposes the read-only collections view to Marketing (BDM)", async () => {
    const res = await authed("/api/collections", "Business Development Manager");
    expect(res.status).toBe(200);
    const cols = (await res.json()) as { clientName: string }[];
    expect(cols.some((c) => c.clientName.startsWith("RBAC-REMIND"))).toBe(true);
  });

  it("exposes the read-only collections view to Assistant Accountant", async () => {
    const res = await authed("/api/collections", "Assistant Accountant");
    expect(res.status).toBe(200);
  });

  it("blocks the Operations Manager from the marketing collections view", async () => {
    const res = await authed("/api/collections", "Operations Manager");
    expect(res.status).toBe(403);
  });
});

/* ─────────── Phase 5: Durable (DB-persisted) notifications ─────────── */

describe("Phase 5 — Durable notifications", () => {
  let userScopedId = "";
  let roleScopedId = "";

  it("returns an empty list for a fresh user", async () => {
    const res = await authed("/api/notifications", "General Manager");
    expect(res.status).toBe(200);
  });

  it("persists a user-scoped notification and lists it back", async () => {
    const create = await authed("/api/notifications", "Finance Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        type: "success",
        title: "RBAC NOTIF created",
        message: "Finance Manager created this durable notification.",
        module: "Finance",
      }),
    });
    expect(create.status).toBe(201);
    userScopedId = ((await create.json()) as { id: string }).id;

    const list = (await (await authed("/api/notifications", "Finance Manager")).json()) as { id: string; title: string; readAt: string | null }[];
    expect(list.some((n) => n.id === userScopedId && n.readAt === null)).toBe(true);
  });

  it("does not leak a user-scoped notification to another user", async () => {
    const list = (await (await authed("/api/notifications", "Operations Manager")).json()) as { id: string }[];
    expect(list.some((n) => n.id === userScopedId)).toBe(false);
  });

  it("blocks marking another user's notification as read (ownership)", async () => {
    const res = await authed(`/api/notifications/${userScopedId}/read`, "Operations Manager", undefined, {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(403);
  });

  it("marks a notification as read", async () => {
    const res = await authed(`/api/notifications/${userScopedId}/read`, "Finance Manager", undefined, {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(200);
    const updated = (await res.json()) as { readAt: string | null };
    expect(updated.readAt).toBeTruthy();
  });

  it("persists a role-scoped notification delivered to every holder of that role", async () => {
    const create = await authed("/api/notifications", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        type: "info",
        title: "RBAC ROLE NOTIF",
        message: "All Regional Managers should see this.",
        module: "Operations",
        targetRole: "Regional Manager",
      }),
    });
    expect(create.status).toBe(201);
    roleScopedId = ((await create.json()) as { id: string }).id;

    const list = (await (await authed("/api/notifications", "Regional Manager", "Peter Okello")).json()) as { id: string }[];
    expect(list.some((n) => n.id === roleScopedId)).toBe(true);
  });

  it("deletes a notification via the API", async () => {
    const res = await authed(`/api/notifications/${userScopedId}`, "Finance Manager", undefined, { method: "DELETE" });
    expect(res.status).toBe(200);
    const list = (await (await authed("/api/notifications", "Finance Manager")).json()) as { id: string }[];
    expect(list.some((n) => n.id === userScopedId)).toBe(false);
  });

  it("marks all notifications read for the current user", async () => {
    const res = await authed("/api/notifications/read-all", "Regional Manager", "Peter Okello", {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(200);
    const list = (await (await authed("/api/notifications", "Regional Manager", "Peter Okello")).json()) as { readAt: string | null }[];
    expect(list.every((n) => n.readAt !== null)).toBe(true);
  });
});

/* ─────────── P6: force-number identity on guard enrolment ─────────── */

describe("P6 RBAC — guard enrolment defaults forceNumber (canonical unique identifier)", () => {
  let guardId: string | null = null;

  it("rejects guard creation by non-HR roles", async () => {
    const res = await authed("/api/guards", "Finance Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        fullName: "RBAC FN Denied",
        forceNumber: "PSG026/RBAC00",
        designation: "Guard",
        region: "Kampala Central",
        phone: "+256 700 000099",
        nationalId: "CM99999999ABC",
        assignedSite: "RBAC Site",
        location: "Kampala",
        joinDate: "2026-08-14",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("HR Manager creates a guard and forceNumber defaults to forceNumber", async () => {
    const res = await authed("/api/guards", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        fullName: "RBAC ForceNumber Guard",
        forceNumber: "PSG026/RBAC01",
        designation: "Guard",
        region: "Kampala Central",
        phone: "+256 700 000099",
        nationalId: "CM99999998ABC",
        assignedSite: "RBAC Site",
        location: "Kampala",
        joinDate: "2026-08-14",
      }),
    });
    expect(res.status).toBe(201);
    const guard = (await res.json()) as { id: string; forceNumber: string };
    expect(guard.forceNumber).toBe("PSG026/RBAC01");
    guardId = guard.id;
  });

  it("explicit forceNumber is honoured when supplied", async () => {
    const res = await authed("/api/guards", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        fullName: "RBAC Explicit FN Guard",
        forceNumber: "PSG026/RBAC02",
        designation: "Guard",
        region: "Kampala Central",
        phone: "+256 700 000098",
        nationalId: "CM99999997ABC",
        assignedSite: "RBAC Site",
        location: "Kampala",
        joinDate: "2026-08-14",
      }),
    });
    expect(res.status).toBe(201);
    const guard = (await res.json()) as { forceNumber: string };
    expect(guard.forceNumber).toBe("PSG026/RBAC02");
  });

  it("each guard carries a unique force number on the roster read", async () => {
    const roster = (await (await authed("/api/guards", "HR Manager")).json()) as Array<{ forceNumber: string }>;
    const fns = roster.filter((g) => g.forceNumber.startsWith("PSG026/RBAC")).map((g) => g.forceNumber);
    expect(new Set(fns).size).toBe(fns.length);
    expect(fns).toContain("PSG026/RBAC01");
    if (!guardId) throw new Error("no guard created");
  });

  it("a promotion changing designation flags the ID card for reissue (§5)", async () => {
    if (!guardId) throw new Error("no guard created");
    const issued = await authed(`/api/guards/${guardId}/issue-id`, "Records Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({ idCardNumber: "IDC-RBAC-001", idCardExpiryDate: "2028-08-14" }),
    });
    expect(issued.status).toBe(200);
    expect(((await issued.json()) as { idCardStatus: string }).idCardStatus).toBe("Issued & Active");
    const updated = await authed(`/api/guards/${guardId}`, "HR Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ designation: "Inspector" }),
    });
    expect(updated.status).toBe(200);
    const body = (await updated.json()) as { idCardStatus: string; designation: string };
    expect(body.designation).toBe("Inspector");
    expect(body.idCardStatus).toBe("Reissue Required");
  });

  it("mapped guard designations round-trip as display strings (K9 Handler / Site In-Charge)", async () => {
    if (!guardId) throw new Error("no guard created");
    const put = await authed(`/api/guards/${guardId}`, "HR Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ designation: "Site In-Charge" }),
    });
    expect(put.status).toBe(200);
    const body = (await put.json()) as { designation: string };
    expect(body.designation).toBe("Site In-Charge");
    const roster = (await (await authed("/api/guards", "HR Manager")).json()) as Array<{ id: string; designation: string }>;
    expect(roster.find((g) => g.id === guardId)?.designation).toBe("Site In-Charge");
    const reverted = await authed(`/api/guards/${guardId}`, "HR Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ designation: "Guard" }),
    });
    expect(reverted.status).toBe(200);
  });
});

/* ─────────── P6: leave workflow engine (HR Manager → optional GM) ─────────── */

describe("P6 RBAC — leave engine realignment (submit → HR Manager → optional GM)", () => {
  let guardLeaveId: string | null = null;
  let staffLeaveId: string | null = null;

  it("rejects leave submission by a non-requester role", async () => {
    const res = await authed("/api/leave-requests", "Finance Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        guardId: "fake",
        guardName: "RBAC-DENIED",
        forceNumber: "PSG000/000",
        leaveType: "Annual",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        durationDays: 5,
        reason: "RBAC test",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("Guard Officer submits leave for a real guard (guard leave → GM step auto-skipped)", async () => {
    const guard = await prisma.guard.findUnique({ where: { forceNumber: "PSG026/RBAC01" } });
    if (!guard) throw new Error("RBAC guard not found");
    const res = await authed("/api/leave-requests", "Guard Officer", "Tom Ssemakula", {
      method: "POST",
      body: JSON.stringify({
        guardId: guard.id,
        guardName: "RBAC ForceNumber Guard",
        forceNumber: "PSG026/RBAC01",
        leaveType: "Annual",
        startDate: "2026-09-01",
        endDate: "2026-09-05",
        durationDays: 5,
        reason: "RBAC guard leave flow",
      }),
    });
    expect(res.status).toBe(201);
    guardLeaveId = ((await res.json()) as { id: string }).id;
    const leave = await prisma.leaveRequest.findUnique({ where: { id: guardLeaveId } });
    expect(leave?.approvalId).toBeTruthy();
  });

  it("HR Assistant is not an approver (403)", async () => {
    if (!guardLeaveId) throw new Error("no leave");
    const res = await authed(`/api/leave-requests/${guardLeaveId}/hr-approve`, "HR Assistant", undefined, {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(403);
  });

  it("HR Manager approves a guard leave straight to Approved (GM step optional)", async () => {
    if (!guardLeaveId) throw new Error("no leave");
    const res = await authed(`/api/leave-requests/${guardLeaveId}/hr-approve`, "HR Manager", undefined, {
      method: "PUT",
      body: "{}",
    });
    expect(res.status).toBe(200);
    const leave = await prisma.leaveRequest.findUnique({ where: { id: guardLeaveId } });
    expect(leave?.status).toBe("Approved");
    const approval = await prisma.approval.findUnique({ where: { id: leave!.approvalId! }, include: { actions: true } });
    expect(approval?.status).toBe("Approved");
  });

  it("staff leave (no guard record) advances HR → GM and GM approves to Approved", async () => {
    const res = await authed("/api/leave-requests", "HR Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        guardId: "staff-non-guard-id-0000",
        guardName: "RBAC Staff Member",
        forceNumber: "PSG026/RBAC-STF",
        leaveType: "Study",
        startDate: "2026-09-10",
        endDate: "2026-09-14",
        durationDays: 5,
        reason: "RBAC staff leave flow",
      }),
    });
    expect(res.status).toBe(201);
    staffLeaveId = ((await res.json()) as { id: string }).id;

    const hr = await authed(`/api/leave-requests/${staffLeaveId}/hr-approve`, "HR Manager", undefined, { method: "PUT", body: "{}" });
    expect(hr.status).toBe(200);
    const mid = await prisma.leaveRequest.findUnique({ where: { id: staffLeaveId } });
    expect(mid?.status).toBe("Pending GM Approval");

    const gm = await authed(`/api/leave-requests/${staffLeaveId}/gm-approve`, "General Manager", undefined, { method: "PUT", body: "{}" });
    expect(gm.status).toBe(200);
    const final = await prisma.leaveRequest.findUnique({ where: { id: staffLeaveId } });
    expect(final?.status).toBe("Approved");
  });

  it("legacy regional/ops leave-approval routes are removed (410)", async () => {
    if (!guardLeaveId) throw new Error("no leave");
    const legacy = await authed(`/api/leave-requests/${guardLeaveId}/approve`, "Regional Manager", "Peter Okello", { method: "PUT", body: "{}" });
    expect(legacy.status).toBe(410);
    const legacyOps = await authed(`/api/leave-requests/${guardLeaveId}/ops-approve`, "Operations Manager", undefined, { method: "PUT", body: "{}" });
    expect(legacyOps.status).toBe(410);
  });

  it("HR Manager cannot deny leave requested by a peer department manager (§5)", async () => {
    const res = await authed("/api/leave-requests", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        guardId: "staff-non-guard-id-peer",
        guardName: "RBAC Peer Manager",
        forceNumber: "PSG026/RBAC-PEER",
        leaveType: "Annual Leave",
        startDate: "2026-10-01",
        endDate: "2026-10-05",
        durationDays: 5,
        reason: "RBAC peer-level leave flow",
      }),
    });
    expect(res.status).toBe(201);
    const peerLeaveId = ((await res.json()) as { id: string }).id;
    const reject = await authed(`/api/leave-requests/${peerLeaveId}/reject`, "HR Manager", undefined, { method: "PUT", body: "{}" });
    expect(reject.status).toBe(403);
    const stillPending = await prisma.leaveRequest.findUnique({ where: { id: peerLeaveId } });
    expect(stillPending?.status).toBe("Pending HR Approval");
  });

  it("HR Manager CAN deny leave requested by a subordinate staff member (§5)", async () => {
    const res = await authed("/api/leave-requests", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        guardId: "staff-non-guard-id-sub",
        guardName: "RBAC Subordinate",
        forceNumber: "PSG026/RBAC-SUB",
        leaveType: "Sick Leave",
        startDate: "2026-11-01",
        endDate: "2026-11-02",
        durationDays: 2,
        reason: "RBAC subordinate leave flow",
      }),
    });
    expect(res.status).toBe(201);
    const subLeaveId = ((await res.json()) as { id: string }).id;
    const reject = await authed(`/api/leave-requests/${subLeaveId}/reject`, "HR Manager", undefined, { method: "PUT", body: "{}" });
    expect(reject.status).toBe(200);
    const rejectedRow = await prisma.leaveRequest.findUnique({ where: { id: subLeaveId } });
    expect(rejectedRow?.status).toBe("Rejected");
  });

  it("leave submission notifies the HR Manager via a role-scoped notification", async () => {
    const list = (await (await authed("/api/notifications", "HR Manager")).json()) as { title: string; message: string }[];
    expect(list.some((n) => n.title === "New Leave Request" && n.message.includes("PSG026/RBAC01"))).toBe(true);
  });
});

/* ─────────── P6: transport inbox (Fleet Manager only) ─────────── */

describe("P6 RBAC — transport request act is Fleet Manager only", () => {
  let trId: string | null = null;

  it("any authenticated user can submit a transport request", async () => {
    const res = await authed("/api/transport-requests", "HR Assistant", undefined, {
      method: "POST",
      body: JSON.stringify({
        requestedByName: "RBAC Transport User",
        requesterDepartment: "Human Resources",
        destination: "RBAC Depot",
        purpose: "RBAC transport flow",
        travelDate: "2026-08-20",
      }),
    });
    expect(res.status).toBe(201);
    trId = ((await res.json()) as { id: string }).id;
  });

  it("non-Fleet-Manager cannot act on the request (403)", async () => {
    if (!trId) throw new Error("no transport");
    const res = await authed(`/api/transport-requests/${trId}/act`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "Approved", assignedVehicle: "UAY 123Z" }),
    });
    expect(res.status).toBe(403);
  });

  it("Fleet Manager decline requires a reason (400)", async () => {
    if (!trId) throw new Error("no transport");
    const res = await authed(`/api/transport-requests/${trId}/act`, "Fleet Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "Declined" }),
    });
    expect(res.status).toBe(400);
  });

  it("Fleet Manager approves with an assigned vehicle", async () => {
    if (!trId) throw new Error("no transport");
    const res = await authed(`/api/transport-requests/${trId}/act`, "Fleet Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ action: "Approved", assignedVehicle: "UAY 123Z", assignedDriver: "RBAC Driver" }),
    });
    expect(res.status).toBe(200);
    const row = await prisma.transportRequest.findUnique({ where: { id: trId } });
    expect(row?.status).toBe("Approved");
  });

  it("transport submit notifies the Fleet Manager", async () => {
    const list = (await (await authed("/api/notifications", "Fleet Manager")).json()) as { title: string }[];
    expect(list.some((n) => n.title === "New Transport Request")).toBe(true);
  });
});

/* ─────────── P6: contract inquiry (Records Officer responds) ─────────── */

describe("P6 RBAC — contract inquiry response is Records Officer only", () => {
  let inquiryId: string | null = null;

  it("any authenticated user can raise an inquiry", async () => {
    const res = await authed("/api/contract-inquiries", "Operations Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        requestedByName: "RBAC Ops User",
        requesterDepartment: "Operations",
        clientName: "RBAC Inquiry Client",
        siteName: "RBAC Inquiry Site",
        purpose: "Confirmation",
      }),
    });
    expect(res.status).toBe(201);
    inquiryId = ((await res.json()) as { id: string }).id;
  });

  it("non-Records-Officer cannot respond (403)", async () => {
    if (!inquiryId) throw new Error("no inquiry");
    const res = await authed(`/api/contract-inquiries/${inquiryId}/respond`, "Finance Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ responseType: "Confirmation" }),
    });
    expect(res.status).toBe(403);
  });

  it("Records Officer responds and the requester is notified", async () => {
    if (!inquiryId) throw new Error("no inquiry");
    const res = await authed(`/api/contract-inquiries/${inquiryId}/respond`, "Records Officer", undefined, {
      method: "PUT",
      body: JSON.stringify({ responseType: "Confirmation", responseNotes: "RBAC verification" }),
    });
    expect(res.status).toBe(200);
    const row = await prisma.contractInquiry.findUnique({ where: { id: inquiryId } });
    expect(row?.status).toBe("Answered");
    const list = (await (await authed("/api/notifications", "Operations Manager")).json()) as { title: string; message: string }[];
    expect(list.some((n) => n.title === "Contract Inquiry Answered" && n.message.includes("RBAC Inquiry Client"))).toBe(true);
  });
});

/* ─────────── P6: site surveys (Ops Manager / Regional Manager act) ─────────── */

describe("P6 RBAC — site survey actions are Ops Manager / Regional Manager only", () => {
  let surveyId: string | null = null;

  it("creates a survey (any authenticated requester)", async () => {
    const res = await authed("/api/site-surveys", "Business Development Manager", undefined, {
      method: "POST",
      body: JSON.stringify({
        clientName: "RBAC Survey Client",
        siteName: "RBAC Survey Site",
        region: "Kampala West",
        requestedByName: "RBAC BDM User",
        requestedDepartment: "Business Development",
      }),
    });
    expect(res.status).toBe(201);
    surveyId = ((await res.json()) as { id: string }).id;
  });

  it("a non-ops role cannot start the survey (403)", async () => {
    if (!surveyId) throw new Error("no survey");
    const res = await authed(`/api/site-surveys/${surveyId}/start`, "Finance Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("Regional Manager of a different region is blocked from acting (403)", async () => {
    if (!surveyId) throw new Error("no survey");
    const res = await authed(`/api/site-surveys/${surveyId}/start`, "Regional Manager", "Betty Auma", { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("Operations Manager completes the survey and a draft contract is created", async () => {
    if (!surveyId) throw new Error("no survey");
    const start = await authed(`/api/site-surveys/${surveyId}/start`, "Operations Manager", undefined, { method: "PUT", body: "{}" });
    expect(start.status).toBe(200);
    const complete = await authed(`/api/site-surveys/${surveyId}/complete`, "Operations Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ riskLevel: "Low", dayGuardsNeeded: 2, nightGuardsNeeded: 2, recommendation: "Proceed to contract" }),
    });
    expect(complete.status).toBe(200);
    const survey = await prisma.siteSurvey.findUnique({ where: { id: surveyId } });
    expect(survey?.status).toBe("Completed");
    const draft = await prisma.contract.findFirst({ where: { siteSurvey: survey!.surveyCode } });
    expect(draft).toBeTruthy();
    expect(draft?.status).toBe("Draft");
  });
});

/* ─────────── P6: requisitions (GM final approver) ─────────── */

describe("P6 RBAC — requisitions open to any staff, GM is the final approver", () => {
  let reqId: string | null = null;

  it("any staff member can submit a requisition", async () => {
    const res = await authed("/api/requisitions", "IT Officer", undefined, {
      method: "POST",
      body: JSON.stringify({
        department: "IT",
        requestedBy: "Joseph Kizza",
        itemDescription: "RBAC-requisition-item",
        quantity: 2,
        estimatedCostUgx: 250000,
        priority: "High",
      }),
    });
    expect(res.status).toBe(201);
    reqId = ((await res.json()) as { id: string }).id;
  });

  it("non-GM cannot approve a requisition (403)", async () => {
    if (!reqId) throw new Error("no req");
    const res = await authed(`/api/requisitions/${reqId}/approve`, "Administrative Officer", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(403);
  });

  it("GM rejection requires a reason (400)", async () => {
    if (!reqId) throw new Error("no req");
    const res = await authed(`/api/requisitions/${reqId}/reject`, "General Manager", undefined, { method: "PUT", body: "{}" });
    expect(res.status).toBe(400);
  });

  it("GM rejects with a reason and the requester is notified", async () => {
    if (!reqId) throw new Error("no req");
    const res = await authed(`/api/requisitions/${reqId}/reject`, "General Manager", undefined, {
      method: "PUT",
      body: JSON.stringify({ reason: "RBAC rejection reason" }),
    });
    expect(res.status).toBe(200);
    const row = await prisma.adminRequisition.findUnique({ where: { id: reqId } });
    expect(row?.status).toBe("Rejected");
    const list = (await (await authed("/api/notifications", "IT Officer")).json()) as { title: string; message: string }[];
    expect(list.some((n) => n.title === "Requisition Rejected" && n.message.includes("RBAC rejection reason"))).toBe(true);
  });
});


