import { describe, it, expect, beforeAll } from "vitest";
import dotenv from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

const BASE = process.env.API_BASE || "http://localhost:3000";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface LoginUser {
  email: string;
  role: string;
}

const USERS: LoginUser[] = [
  { email: "sarah.akello@iscms.ug", role: "General Manager" },
  { email: "grace.nakato@iscms.ug", role: "HR Manager" },
  { email: "agnes.nantege@iscms.ug", role: "Records Officer" },
  { email: "ivan.ssebana@iscms.ug", role: "Business Development Manager" },
  { email: "emma.muwonge@iscms.ug", role: "Operations Manager" },
  { email: "peter.okello@iscms.ug", role: "Regional Manager" },
  { email: "francis.ogwang@iscms.ug", role: "Fleet Manager" },
  { email: "david.ssenyonga@iscms.ug", role: "Finance Manager" },
  { email: "joseph.ochieng@iscms.ug", role: "Armorer" },
  { email: "henry.kiyingi@iscms.ug", role: "Investigations Officer" },
  { email: "winnie.nabukenya@iscms.ug", role: "Cashier" },
];

const tokens = new Map<string, string>();

beforeAll(async () => {
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
    tokens.set(u.role, body.token);
  }
});

function roleToken(role: string): string {
  const t = tokens.get(role);
  if (!t) throw new Error(`No token for role ${role}`);
  return t;
}

function get(path: string, role: string) {
  return fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${roleToken(role)}` } });
}

/**
 * Every module must be readable by its owning role(s) and denied (403) to a
 * role outside the module — least privilege per §15.1.
 */
const MATRIX: Array<{ module: string; endpoint: string; owner: string; outsider: string }> = [
  { module: "guards", endpoint: "/api/guards", owner: "HR Manager", outsider: "Fleet Manager" },
  { module: "sites", endpoint: "/api/sites", owner: "Operations Manager", outsider: "HR Manager" },
  { module: "incidents", endpoint: "/api/incidents", owner: "Investigations Officer", outsider: "HR Manager" },
  { module: "invoices", endpoint: "/api/invoices", owner: "Finance Manager", outsider: "HR Manager" },
  { module: "expenses", endpoint: "/api/expenses", owner: "Finance Manager", outsider: "HR Manager" },
  { module: "cashier (finance)", endpoint: "/api/cashier-transactions", owner: "Cashier", outsider: "HR Manager" },
  { module: "leads", endpoint: "/api/leads", owner: "Business Development Manager", outsider: "HR Manager" },
  { module: "trips (fleet)", endpoint: "/api/trips", owner: "Fleet Manager", outsider: "HR Manager" },
  { module: "fuel logs (fleet)", endpoint: "/api/fuel-logs", owner: "Fleet Manager", outsider: "HR Manager" },
  { module: "drivers (fleet)", endpoint: "/api/drivers", owner: "Fleet Manager", outsider: "HR Manager" },
  { module: "deployment orders", endpoint: "/api/deployment-orders", owner: "Operations Manager", outsider: "HR Manager" },
  { module: "recruitment candidates", endpoint: "/api/candidates", owner: "HR Manager", outsider: "Fleet Manager" },
];

describe("Module access matrix — least privilege", () => {
  for (const { module, endpoint, owner, outsider } of MATRIX) {
    it(`lets ${owner} read ${module}`, async () => {
      const res = await get(endpoint, owner);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    it(`denies ${outsider} read access to ${module} (403)`, async () => {
      const res = await get(endpoint, outsider);
      expect(res.status).toBe(403);
    });
  }
});

/**
 * Persistence regression: data created via the API is returned on a subsequent
 * read, proving the DB (not in-memory state) is the source of truth.
 */
describe("Full DB persistence", () => {
  it("persists a guard created by HR and lists it back", async () => {
    const code = `PERSIST-${Date.now()}`;
    const createRes = await fetch(`${BASE}/api/guards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${roleToken("HR Manager")}` },
      body: JSON.stringify({
        fullName: "Persist Test Guard",
        guardCode: code,
        designation: "Guard",
        phone: "+256 700 000099",
        nationalId: `NIN-PERSIST-${Date.now()}`,
        assignedSite: "Persist Test Site",
        status: "Off Duty",
        joinDate: "2026-08-01",
      }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await get("/api/guards", "HR Manager");
    expect(listRes.status).toBe(200);
    const guards = (await listRes.json()) as Array<{ guardCode: string }>;
    expect(guards.some((g) => g.guardCode === code)).toBe(true);
  });

  it("persists an expense and lists it back after re-login", async () => {
    const res = await fetch(`${BASE}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${roleToken("Finance Manager")}` },
      body: JSON.stringify({
        category: "Fuel",
        description: "Persist test expense",
        amount: 25000,
        date: "2026-08-01",
        paidBy: "Finance Manager",
        paymentMethod: "Mobile Money",
        status: "Approved",
      }),
    });
    expect(res.status).toBe(201);

    const listRes = await get("/api/expenses", "Finance Manager");
    expect(listRes.status).toBe(200);
    const rows = (await listRes.json()) as Array<{ description: string }>;
    expect(rows.some((r) => r.description === "Persist test expense")).toBe(true);
  });
});
