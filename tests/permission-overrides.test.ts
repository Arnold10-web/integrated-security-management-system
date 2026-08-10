import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";

dotenv.config();

const BASE = process.env.API_BASE || "http://localhost:3000";

const IT = { email: "joseph.kizza@iscms.ug", password: "password123" };
const GM = { email: "sarah.akello@iscms.ug", password: "password123" };
const OPS = { email: "emma.muwonge@iscms.ug", password: "password123" };
const BDM = { email: "ivan.ssebana@iscms.ug", password: "password123" };

let itToken = "";
let itUserId = "";
let gmId = "";
let opsId = "";
let bdmId = "";

async function login(u: { email: string; password: string }) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(u),
  });
  if (res.status !== 200) throw new Error(`Login failed for ${u.email} (${res.status})`);
  const body = (await res.json()) as { token: string; user: { id: string; customPermissions?: unknown } };
  return body;
}

function auth(path: string, token: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
}

beforeAll(async () => {
  const itLogin = await login(IT);
  itToken = itLogin.token;
  itUserId = itLogin.user.id;

  const usersRes = await auth("/api/auth/users", itToken);
  const users = (await usersRes.json()) as Array<{ id: string; role: string }>;
  gmId = users.find((u) => u.role === "General Manager")!.id;
  opsId = users.find((u) => u.role === "Operations Manager")!.id;
  bdmId = users.find((u) => u.role === "Business Development Manager")!.id;
});

afterAll(async () => {
  // Reset all overrides created by this test suite.
  for (const id of [gmId, opsId, bdmId]) {
    await auth(`/api/auth/users/${id}`, itToken, {
      method: "PUT",
      body: JSON.stringify({ customPermissions: {} }),
    });
  }
});

describe("IT per-user module permission overrides", () => {
  it("login and /api/auth/me surface customPermissions", async () => {
    const body = await login(GM);
    expect(typeof body.user.customPermissions === "object" || body.user.customPermissions === null).toBe(true);
    const me = await auth("/api/auth/me", body.token);
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { customPermissions?: unknown };
    expect("customPermissions" in meBody).toBe(true);
  });

  it("lets the IT Officer revoke a module (finance) for the GM", async () => {
    const put = await auth(`/api/auth/users/${gmId}`, itToken, {
      method: "PUT",
      body: JSON.stringify({ customPermissions: { finance: "none" } }),
    });
    expect(put.status).toBe(200);

    // GM default matrix grants invoices:view; the override must deny it.
    const gm = await login(GM);
    const invoices = await auth("/api/invoices", gm.token);
    expect(invoices.status).toBe(403);
  });

  it("revoking operations cascades to its server sub-modules", async () => {
    const put = await auth(`/api/auth/users/${gmId}`, itToken, {
      method: "PUT",
      body: JSON.stringify({ customPermissions: { operations: "none" } }),
    });
    expect(put.status).toBe(200);

    const gm = await login(GM);
    const guards = await auth("/api/guards", gm.token);
    expect(guards.status).toBe(403);
    const armoury = await auth("/api/armoury", gm.token);
    expect(armoury.status).toBe(403);

    // finance was reset by the previous test, so invoices must be readable again.
    const invoices = await auth("/api/invoices", gm.token);
    expect(invoices.status).toBe(200);
  });

  it("lets the IT Officer grant a module (finance) to a role without it", async () => {
    // BDM has no finance access by default.
    const before = await login(BDM);
    const beforeInvoices = await auth("/api/invoices", before.token);
    expect(beforeInvoices.status).toBe(403);

    const put = await auth(`/api/auth/users/${bdmId}`, itToken, {
      method: "PUT",
      body: JSON.stringify({ customPermissions: { finance: "view" } }),
    });
    expect(put.status).toBe(200);

    const after = await login(BDM);
    const invoices = await auth("/api/invoices", after.token);
    expect(invoices.status).toBe(200);

    // view-only grant must not permit writes.
    const post = await auth("/api/invoices", after.token, {
      method: "POST",
      body: JSON.stringify({ clientName: "Override Test", siteName: "View Site", amount: 1000, dueDate: "2026-09-01" }),
    });
    expect(post.status).toBe(403);
  });

  it("enforces a full grant for a previously accessless role", async () => {
    // Give BDM finance:full; creating an invoice must now succeed.
    const put = await auth(`/api/auth/users/${bdmId}`, itToken, {
      method: "PUT",
      body: JSON.stringify({ customPermissions: { finance: "full" } }),
    });
    expect(put.status).toBe(200);

    const bdm = await login(BDM);
    const post = await auth("/api/invoices", bdm.token, {
      method: "POST",
      body: JSON.stringify({ clientName: "Override Full Test", siteName: "Full Grant Site", amount: 5000, dueDate: "2026-09-01" }),
    });
    expect(post.status).toBe(201);
  });
});
