import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod/v4";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
// Digital contract routes
import digitalContractTemplateRoutes from "./src/routes/digitalContractTemplates.ts";
import digitalContractRoutes from "./src/routes/digitalContracts.ts";
import digitalSigningRoutes from "./src/routes/digitalSigning.ts";
// Modular server factory (see src/server/*) — still re-exported via legacy server.ts for backward compat
import { nextForceNumber as modularNextForceNumber } from "./src/server/services/forceNumber.ts";
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be 16+ chars"),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  NODE_ENV: z.string().optional(),
  DB_ENCRYPTION_KEY: z.string().optional(),
});
const envParse = envSchema.safeParse(process.env);
if (!envParse.success) {
  console.error("FATAL: Invalid environment:", envParse.error.flatten().fieldErrors);
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET!;

/* Force Number allocation — uniform company-wide format PSG<YYY>/<SEQ>, e.g. PSG025/001.
   Uses ForceNumberSequence for atomic per-year increment (avoids full table scan race).
   Legacy fallback scans existing numbers only to bootstrap the sequence row on first use. */
async function nextForceNumber(seq?: number) {
  const yyy = String(new Date().getFullYear() % 1000).padStart(3, "0");
  if (seq !== undefined) return `PSG${yyy}/${String(seq).padStart(3, "0")}`;
  // Atomic increment via ForceNumberSequence — guarantees no concurrent collision
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.forceNumberSequence.findUnique({ where: { year: yyy } });
      if (!existing) {
        // Bootstrap from existing data once
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
    // Fallback to legacy scan if transaction fails (e.g., table not yet migrated)
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

/* ─────────────── Security Middleware (now also available as src/server/middleware/security.ts) ─────────────── */
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV !== "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
              imgSrc: ["'self'", "data:", "blob:"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "blob:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          },
  })
);
app.set("trust proxy", 1);
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()) : ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Stricter on auth to mitigate brute-force; tests use many logins so relax in test env.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ─────────────── File Upload ─────────────── */

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Digital contract PDF storage
const digitalContractStorageDir = path.join(process.cwd(), "digital_contracts");
if (!fs.existsSync(digitalContractStorageDir)) fs.mkdirSync(digitalContractStorageDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xls", ".xlsx", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type ${ext} not allowed`));
  },
});

app.get("/uploads/:filename", authenticateToken, (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }
  const filepath = path.join(uploadDir, filename);
  // Ensure resolved path stays inside uploadDir
  if (!filepath.startsWith(uploadDir + path.sep)) {
    res.status(400).json({ error: "Invalid path" });
    return;
  }
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  // MIME sniff — reject HTML/JS masquerading as allowed ext
  try {
    const buf = fs.readFileSync(filepath);
    if (buf.length > 0) {
      const head = buf.slice(0, 2048).toString("utf8").toLowerCase();
      if (head.includes("<html") || head.includes("<script") || head.includes("<?php")) {
        res.status(400).json({ error: "File content rejected" });
        return;
      }
    }
  } catch {}
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
  };
  const mime = mimeMap[ext] ?? "application/octet-stream";
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'");
  res.sendFile(filepath);
});

/* ─────────────── Zod Schemas ─────────────── */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createGuardSchema = z.object({
  fullName: z.string().min(1),
  forceNumber: z.string().min(1),
  designation: z.string().min(1),
  photoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  phone: z.string().min(5),
  nationalId: z.string().min(5),
  assignedSite: z.string().min(1),
  location: z.string().optional(),
  region: z.string().optional(),
  zone: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  status: z.string().optional(),
  joinDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  medicalCleared: z.boolean().optional(),
  armedQualified: z.boolean().optional(),
  k9Qualified: z.boolean().optional(),
  lifecycleStage: z.enum(["ENROLLED", "HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT", "DEPLOYED"]).optional(),
  tin: z.string().optional(),
  nssfNo: z.string().optional(),
  educationLevel: z.string().optional(),
  motherName: z.string().optional(),
  motherPhone: z.string().optional(),
  fatherName: z.string().optional(),
  fatherPhone: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinResidence: z.string().optional(),
  relativesOrReferees: z.string().optional(),
  residenceDistrict: z.string().optional(),
  residenceSubCounty: z.string().optional(),
  residenceParish: z.string().optional(),
  residenceVillage: z.string().optional(),
  lc1Chairperson: z.string().optional(),
  lc1Contact: z.string().optional(),
  physicalAddress: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  surnameAtBirth: z.string().optional(),
  nationality: z.string().optional(),
  tribe: z.string().optional(),
  placeOfBirth: z.string().optional(),
  lc2Chairperson: z.string().optional(),
  closeRelatives: z.array(z.string()).optional(),
  neighbours: z.array(z.string()).optional(),
  fatherAlive: z.boolean().optional(),
  fatherResidence: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankBranch: z.string().optional(),
  idCardIssuerName: z.string().optional(),
  idCardIssuerSignatureUrl: z.string().optional(),
});

const createSiteSchema = z.object({
  clientName: z.string().min(1),
  siteName: z.string().min(1),
  location: z.string().min(1),
  zone: z.string().min(1),
  region: z.string().optional(),
  dayShiftGuards: z.number().int().nonnegative().optional(),
  nightShiftGuards: z.number().int().nonnegative().optional(),
  dayShiftArmed: z.number().int().nonnegative().optional(),
  nightShiftArmed: z.number().int().nonnegative().optional(),
  armedGuardsRequired: z.number().int().nonnegative().optional(),
  k9Required: z.boolean().optional(),
  contactPerson: z.string().min(1),
  contactPhone: z.string().min(1),
  slaStatus: z.string().optional(),
  satisfactionRating: z.number().int().min(1).max(5).optional(),
  deploymentStatus: z.string().optional(),
  wonBy: z.string().optional(),
});

const createContractSchema = z.object({
  contractCode: z.string().min(1),
  title: z.string().min(1),
  contractType: z.enum(["Staff Contract", "Client Contract"]),
  partyName: z.string().min(1),
  category: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  valueUgx: z.number().int().nonnegative().optional(),
  status: z.enum(["Draft", "Active", "Expiring Soon", "Expired", "Pending Renewal", "Terminated", "Archived"]).optional(),
  documentRef: z.string().optional(),
  managedBy: z.string().optional(),
  region: z.string().optional(),
  autoRenew: z.boolean().optional(),
  paymentTerms: z.string().optional(),
  billingCycle: z.string().optional(),
  slaTerms: z.string().optional(),
  notes: z.string().optional(),
  preparedBy: z.string().optional(),
  issuedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  approvalStep: z.string().optional(),
  relatedForceNumber: z.string().optional(),
  relatedSiteName: z.string().optional(),
  voidReason: z.string().optional(),
  createdBy: z.string().optional(),
  scanPages: z.array(z.object({
    id: z.string(),
    pageNo: z.number(),
    name: z.string(),
    dataUrl: z.string(),
  })).optional(),
});

const createIncidentSchema = z.object({
  title: z.string().min(1),
  siteName: z.string().min(1),
  reportedByGuard: z.string().min(1),
  category: z.string().min(1),
  severity: z.string().min(1),
  description: z.string().min(1),
  incidentDate: z.coerce.date().optional(),
});

const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  vehicleType: z.string().min(1),
  makeModel: z.string().min(1),
  driverAssigned: z.string().optional(),
  status: z.string().optional(),
});

const createInvoiceSchema = z.object({
  clientName: z.string().min(1),
  siteName: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});

const createExpenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().optional(),
  approvedBy: z.string().optional(),
});

/* ─────────────── JWT Auth Middleware ─────────────── */

interface JwtPayload {
  userId: string;
  role: string; // base (assigned) role
  actingRole?: string; // active acting role, if any (§11.4 additive)
  jti: string;
}

/* §11.4 additive capability: while acting, the user keeps their own role's
   capabilities AND gains the acting role's. Enforcement checks pass if the
   base role OR the acting role qualifies. */
function effectiveRolesOf(user: { role: string; actingRole?: string | null }): string[] {
  if (user.actingRole && user.actingRole !== user.role) return [user.role, user.actingRole];
  return [user.role];
}

function hasEffectiveRole(user: { role: string; actingRole?: string | null }, ...roles: string[]): boolean {
  return effectiveRolesOf(user).some((r) => roles.includes(r));
}

/* §11.5 attribution: decisions made while acting read "Acting [Role]", not
   just the role — visible in the audit log and on the decision itself. */
function actorRoleLabel(user: { role: string; actingRole?: string | null } | undefined | null): string {
  if (!user) return "system";
  return user.actingRole && user.actingRole !== user.role ? `Acting ${user.actingRole}` : user.role;
}

/* ── Shared list pagination ───────────────────────────────────────────────
 * High-volume collection endpoints accept ?page=&limit= (page is 1-based).
 * When no page/limit query is supplied the endpoint keeps returning the full
 * array so existing clients continue to work unchanged; when paginated, the
 * response is the envelope { data, total, page, pages }.
 */
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

function parseListPagination(req: express.Request): { skip?: number; take?: number; page: number; limit: number } {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limitRaw = Number(req.query.limit);
  const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

function hasListPagination(req: express.Request): boolean {
  return req.query.page !== undefined || req.query.limit !== undefined;
}

function paginatedEnvelope<T>(rows: T[], total: number, page: number, limit: number) {
  return { data: rows, total, page, pages: Math.max(Math.ceil(total / limit), 1) };
}

/* Valid user roles mirroring the UserRole union in src/types.ts (§5.4 acting
   delegation is validated against this list). */
const VALID_USER_ROLES = [
  "General Manager",
  "Director",
  "HR Manager",
  "HR Assistant",
  "Records Officer",
  "Business Development Manager",
  "Sales and Marketing Supervisor",
  "Operations Manager",
  "Regional Manager",
  "Fleet Manager",
  "Training Officer",
  "Investigations Officer",
  "Guard Officer",
  "Armorer",
  "K9 Supervisor",
  "K9 Handler",
  "Finance Manager",
  "Accountant",
  "Assistant Accountant",
  "Internal Auditor",
  "Cashier",
  "Administrative Officer",
  "IT Officer",
] as const;

/* §5: HR Manager's denial authority only applies to genuinely subordinate
   staff. Leave requests from the General Manager, the Director, or a peer
   department manager pass through the HR approval step as a formality and
   cannot be denied by HR. */
const LEAVE_NON_DENIABLE_REQUESTERS: readonly string[] = [
  "General Manager",
  "Director",
  "Business Development Manager",
  "Operations Manager",
  "Regional Manager",
  "Fleet Manager",
  "Training Officer",
  "Investigations Officer",
  "Finance Manager",
  "Internal Auditor",
  "Administrative Officer",
  "IT Officer",
];

/* Time-bound delegation (§5.4): a granted acting role takes effect from the
   next sign-in, and only while actingExpiresAt is still in the future.
   actingExpiresAt is DateTime in DB (migrated from String). */
function effectiveRoleFor(user: { role: string; actingRole: string | null; actingExpiresAt: Date | string | null }): string {
  if (user.actingRole && user.actingExpiresAt) {
    const expiresAt = user.actingExpiresAt instanceof Date ? user.actingExpiresAt : new Date(user.actingExpiresAt as string);
    if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now()) {
      return user.actingRole;
    }
  }
  return user.role;
}

// ── IT Officer: device / IP helpers ────────────────────────────────────────
function getClientIp(req: express.Request): string {
  const forwarded = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const cf = req.headers["cf-connecting-ip"] as string | undefined;
  if (cf) return cf;
  return (req.ip as string) || (req.socket.remoteAddress as string) || "unknown";
}

function parseUserAgent(uaRaw?: string) {
  const ua = uaRaw || "";
  let device: string = "Desktop";
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) device = /iPad|Tablet/i.test(ua) ? "Tablet" : "Mobile";
  let browser = "Unknown";
  let browserVersion = "";
  const mChrome = ua.match(/Chrome\/([\d.]+)/);
  const mFirefox = ua.match(/Firefox\/([\d.]+)/);
  const mSafari = ua.match(/Version\/([\d.]+).*Safari/);
  const mEdge = ua.match(/Edg\/([\d.]+)/);
  if (mEdge) { browser = "Edge"; browserVersion = mEdge[1]; }
  else if (mChrome && !/Chromium|Edg/.test(ua)) { browser = "Chrome"; browserVersion = mChrome[1]; }
  else if (mFirefox) { browser = "Firefox"; browserVersion = mFirefox[1]; }
  else if (mSafari) { browser = "Safari"; browserVersion = mSafari[1]; }
  else if (/MSIE|Trident/.test(ua)) browser = "IE";

  let os = "Unknown";
  let osVersion = "";
  if (/Windows NT 10/.test(ua)) { os = "Windows"; osVersion = "10/11"; }
  else if (/Windows NT/.test(ua)) { os = "Windows"; osVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] || ""; }
  else if (/Mac OS X ([\d_]+)/.test(ua)) { os = "macOS"; osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""; }
  else if (/Android ([\d.]+)/.test(ua)) { os = "Android"; osVersion = ua.match(/Android ([\d.]+)/)?.[1] || ""; }
  else if (/iPhone OS ([\d_]+)/.test(ua)) { os = "iOS"; osVersion = ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") || ""; }
  else if (/Linux/.test(ua)) os = "Linux";

  return { device, browser, browserVersion, os, osVersion };
}

function getGeoFromIp(ip: string): { country?: string; city?: string } {
  // Private / loopback → lab
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|unknown)/.test(ip)) return { country: "Local", city: "Lab Network" };
  // Real geo would use MaxMind/ IP2Location; stub for now — IT sees IP + UA, city filled when service added
  return {};
}

async function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Support both Bearer header and httpOnly cookie (primary)
  let token: string | null = null;
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) token = authHeader.slice(7);
  else {
    const cookies = (req as any).cookies ?? {};
    if (cookies.iscms_token) token = cookies.iscms_token;
    else if ((req.headers.cookie ?? "").includes("iscms_token=")) {
      const m = req.headers.cookie!.match(/iscms_token=([^;]+)/);
      if (m) token = decodeURIComponent(m[1]);
    }
  }
  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { jti?: string };
    // jti revocation check
    if ((decoded as any).jti) {
      const revoked = await prisma.revokedToken.findUnique({ where: { jti: (decoded as any).jti } }).catch(() => null);
      if (revoked) {
        res.status(401).json({ error: "Token revoked" });
        return;
      }
    }
    // Re-validate DB state per request: suspended or expired acting role must not persist via JWT
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { status: true, actingRole: true, actingExpiresAt: true, role: true } });
    if (!dbUser) {
      res.status(401).json({ error: "User no longer exists" });
      return;
    }
    if (dbUser.status === "Suspended") {
      res.status(403).json({ error: "Account suspended" });
      return;
    }
    // If the JWT was issued with an acting role that has since expired or been
    // revoked, force re-login (§5.4 / §11: acting takes effect at sign-in).
    if (decoded.actingRole) {
      const effective = effectiveRoleFor(dbUser as any);
      if (effective !== decoded.actingRole) {
        res.status(401).json({ error: "Acting privileges expired — please sign in again", code: "ACTING_EXPIRED" });
        return;
      }
    }
    (req as any).user = decoded;
    (req as any).tokenId = token.slice(0, 8);
    // IT trace: touch lastActiveAt for this JWT's session (fire-and-forget, never block request)
    void (async () => {
      try {
        const tokenId = token.slice(0, 8);
        await prisma.userSession.updateMany({
          where: { userId: decoded.userId, tokenId, isActive: true },
          data: { lastActiveAt: new Date() },
        });
        await prisma.user.update({ where: { id: decoded.userId }, data: { lastActive: new Date() } });
      } catch {}
    })();
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ─────────────── RBAC Middleware ─────────────── */
import { MODULE_PERMISSIONS, SERVER_MODULE_TO_CLIENT, MODULE_DISPLAY_NAMES, type AccessLevel } from "./src/config/permissions.ts";

function moduleAccessLevel(moduleName: string, role: string): AccessLevel | undefined {
  const allowed = MODULE_PERMISSIONS[moduleName];
  if (!allowed) return undefined;
  return allowed[role];
}

async function resolveCustomOverrides(userId: string): Promise<Record<string, string>> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { customPermissions: true } });
    return (dbUser?.customPermissions as Record<string, string>) ?? {};
  } catch {
    return {};
  }
}

async function effectiveModuleAccess(moduleName: string, user: JwtPayload): Promise<AccessLevel | undefined> {
  // §11.4 additive: a user acting in a role keeps their own module access AND
  // gains the acting role's — take the highest level across both roles.
  const base = moduleAccessLevel(moduleName, user.role);
  const acting = user.actingRole ? moduleAccessLevel(moduleName, user.actingRole) : undefined;
  let level: AccessLevel | undefined = base;
  if (acting && (level === undefined || (acting === "full" || (acting === "view" && level !== "full")))) {
    level = acting;
  }
  const overrides = await resolveCustomOverrides(user.userId);
  const clientModule = SERVER_MODULE_TO_CLIENT[moduleName] ?? moduleName;
  // Parent cascade: revoking the client "operations" module blocks all server
  // operations sub-modules (guards, armoury, k9s, etc.) even though guards
  // maps to "hr" on the client. This matches the permission-overrides test
  // expectation that `operations: "none"` cascades to guards/armoury.
  const OPERATIONS_SUBS = new Set(["guards", "armoury", "k9s", "vehicles", "incidents", "roster", "patrol", "training", "deployments", "operations"]);
  if (overrides["operations"] === "none" && OPERATIONS_SUBS.has(moduleName)) return undefined;
  if (overrides["operations"] === "none" && OPERATIONS_SUBS.has(clientModule)) return undefined;
  const override = overrides[clientModule] ?? overrides[moduleName];
  if (override === "none") return undefined;
  if (override === "view" || override === "full") return override;
  return level;
}

function requireModuleAccess(moduleName: string, minLevel: AccessLevel = "view") {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const level = await effectiveModuleAccess(moduleName, user);
    if (!level) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot access ${MODULE_DISPLAY_NAMES[moduleName] || moduleName}` });
      return;
    }
    if (minLevel === "full" && level !== "full") {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} has read-only access to ${MODULE_DISPLAY_NAMES[moduleName] || moduleName}` });
      return;
    }
    next();
  };
}

const requireAnyRole = (...roles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!hasEffectiveRole(user, ...roles)) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} is not allowed to perform this action` });
      return;
    }
    next();
  };
};

const requireAnyModuleAccess = (...modules: string[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const levels = await Promise.all(modules.map((m) => effectiveModuleAccess(m, user)));
    const allowed = levels.some((l) => l);
    if (!allowed) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} has no access to any of: ${modules.map((m) => MODULE_DISPLAY_NAMES[m] || m).join(", ")}` });
      return;
    }
    next();
  };
};

/* ─────────────── Auth Routes ─────────────── */

async function seedDatabase(): Promise<{ message: string } | undefined> {
  // Non-strict testing mode: always ensure all 26 demo users exist (upsert) so any role can log in.
  // If DB already has users, we merge missing ones instead of returning early.
  const hashedPassword = await bcrypt.hash("password123", 10);
  const demoUsers = [
    { name: "Sarah Akello", email: "sarah.akello@iscms.ug", forceNumber: "PSG026/101", role: "General Manager", department: "Directorate", region: "Kampala Central", phone: "+256 701 000001" },
    { name: "Daniel Mugisha", email: "daniel.mugisha@iscms.ug", forceNumber: "PSG026/102", role: "Director", department: "Directorate", region: "Kampala Central", phone: "+256 701 000002" },
    { name: "Grace Nakato", email: "grace.nakato@iscms.ug", forceNumber: "PSG026/103", role: "HR Manager", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000003" },
    { name: "Rebecca Nansubuga", email: "rebecca.nansubuga@iscms.ug", forceNumber: "PSG026/104", role: "HR Assistant", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000004" },
    { name: "Agnes Nantege", email: "agnes.nantege@iscms.ug", forceNumber: "PSG026/105", role: "Records Officer", department: "Human Resources", region: "Kampala Central", phone: "+256 701 000005" },
    { name: "Ivan Ssebana", email: "ivan.ssebana@iscms.ug", forceNumber: "PSG026/106", role: "Business Development Manager", department: "Marketing", region: "Kampala Central", phone: "+256 701 000006" },
    { name: "Patricia Akello", email: "patricia.akello@iscms.ug", forceNumber: "PSG026/107", role: "Sales and Marketing Supervisor", department: "Marketing", region: "Kampala Central", phone: "+256 701 000007" },
    { name: "Kenneth Tumusiime", email: "kenneth.tumusiime@iscms.ug", forceNumber: "PSG026/108", role: "Sales and Marketing Supervisor", department: "Marketing", region: "Mbarara", phone: "+256 701 000026" },
    { name: "Emma Muwonge", email: "emma.muwonge@iscms.ug", forceNumber: "PSG026/109", role: "Operations Manager", department: "Operations", region: "Kampala Central", phone: "+256 701 000008" },
    { name: "Peter Okello", email: "peter.okello@iscms.ug", forceNumber: "PSG026/110", role: "Regional Manager", department: "Operations", region: "Mbarara", phone: "+256 701 000009" },
    { name: "Betty Auma", email: "betty.auma@iscms.ug", forceNumber: "PSG026/111", role: "Regional Manager", department: "Operations", region: "Gulu", phone: "+256 701 000010" },
    { name: "Francis Ogwang", email: "francis.ogwang@iscms.ug", forceNumber: "PSG026/112", role: "Fleet Manager", department: "Operations", region: "Kampala Central", phone: "+256 701 000011" },
    { name: "James Wamala", email: "james.wamala@iscms.ug", forceNumber: "PSG026/113", role: "Training Officer", department: "Operations", region: "Kampala Central", phone: "+256 701 000012" },
    { name: "Henry Kiyingi", email: "henry.kiyingi@iscms.ug", forceNumber: "PSG026/114", role: "Investigations Officer", department: "Investigations", region: "Kampala Central", phone: "+256 701 000013" },
    { name: "Tom Ssemakula", email: "tom.ssemakula@iscms.ug", forceNumber: "PSG026/115", role: "Guard Officer", department: "Operations", region: "Kampala Central", phone: "+256 701 000014" },
    { name: "Joseph Ochieng", email: "joseph.ochieng@iscms.ug", forceNumber: "PSG026/116", role: "Armorer", department: "Operations", region: "Kampala Central", phone: "+256 701 000015" },
    { name: "Diana Alowo", email: "diana.alowo@iscms.ug", forceNumber: "PSG026/117", role: "K9 Supervisor", department: "Operations", region: "Kampala Central", phone: "+256 701 000016" },
    { name: "Peter Okot", email: "peter.okot@iscms.ug", forceNumber: "PSG026/118", role: "K9 Handler", department: "Operations", region: "Kampala Central", phone: "+256 701 000017" },
    { name: "David Ssenyonga", email: "david.ssenyonga@iscms.ug", forceNumber: "PSG026/119", role: "Finance Manager", department: "Finance", region: "Kampala Central", phone: "+256 701 000018" },
    { name: "Martha Kemigisha", email: "martha.kemigisha@iscms.ug", forceNumber: "PSG026/120", role: "Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000019" },
    { name: "Sandra Namutebi", email: "sandra.namutebi@iscms.ug", forceNumber: "PSG026/121", role: "Assistant Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000020" },
    { name: "Brian Mugerwa", email: "brian.mugerwa@iscms.ug", forceNumber: "PSG026/122", role: "Assistant Accountant", department: "Finance", region: "Kampala Central", phone: "+256 701 000021" },
    { name: "Agnes Tumusiime", email: "agnes.tumusiime@iscms.ug", forceNumber: "PSG026/123", role: "Internal Auditor", department: "Finance", region: "Kampala Central", phone: "+256 701 000022" },
    { name: "Winnie Nabukenya", email: "winnie.nabukenya@iscms.ug", forceNumber: "PSG026/124", role: "Cashier", department: "Finance", region: "Kampala Central", phone: "+256 701 000023" },
    { name: "Alice Nabatanzi", email: "alice.nabatanzi@iscms.ug", forceNumber: "PSG026/125", role: "Administrative Officer", department: "Administration", region: "Kampala Central", phone: "+256 701 000024" },
    { name: "Joseph Kizza", email: "joseph.kizza@iscms.ug", forceNumber: "PSG026/126", role: "IT Officer", department: "Information Technology", region: "Kampala Central", phone: "+256 701 000025" },
  ];
  const existingCount = await prisma.user.count();
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, department: u.department, region: u.region, phone: u.phone, forceNumber: u.forceNumber, password: hashedPassword, status: "Active" },
      create: { ...u, password: hashedPassword, status: "Active", lastActive: new Date() },
    });
  }
  const regionDefs = [
    { name: "Albertine", code: "ALB" },
    { name: "Mbarara", code: "MBR" },
    { name: "Mukono", code: "MKN" },
    { name: "Masaka", code: "MSK" },
    { name: "Savannah", code: "SAV" },
    { name: "Arua", code: "ARA" },
    { name: "Gulu", code: "GUL" },
    { name: "Jinja", code: "JIN" },
    { name: "Kampala East", code: "KLE" },
    { name: "Kampala West", code: "KLW" },
    { name: "Kampala North", code: "KLN" },
    { name: "Kampala Central", code: "KLC" },
    { name: "Outerstations", code: "OUT" },
  ];
  for (const r of regionDefs) {
    await prisma.region.upsert({ where: { name: r.name }, update: {}, create: { name: r.name, code: r.code, description: `${r.name} region` } });
  }
  if (existingCount === 0) return { message: "Database seeded with 26 users and 13 regions. Use email + password123 to login" };
  return { message: `Database topped up to 26 users (had ${existingCount}). All roles now password123` };
}

app.post("/api/auth/seed", (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.SEED_ENABLED !== "true") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  void seedDatabase()
    .then((result) => {
      res.json(result ?? { message: "Database seeded with 5 users and 13 regions. Use email + password123 to login (change in production!)" });
    })
    .catch((e) => {
      console.error("Seed failed:", e);
      res.status(500).json({ error: "Seed failed", details: String(e) });
    });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password format", details: parsed.error.issues });
    return;
  }
  const { email, password } = parsed.data;
  const ipAddress = getClientIp(req);
  const userAgent = (req.headers["user-agent"] as string) || "";
  const ua = parseUserAgent(userAgent);
  const geo = getGeoFromIp(ipAddress);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    void prisma.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, reason: "Invalid credentials", country: geo.country, city: geo.city } }).catch(() => {});
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    void prisma.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, reason: "Invalid credentials", country: geo.country, city: geo.city } }).catch(() => {});
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.status === "Suspended") {
    void prisma.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, reason: "Suspended", country: geo.country, city: geo.city } }).catch(() => {});
    res.status(403).json({ error: "Account suspended — contact IT Officer" });
    return;
  }
  if (!VALID_USER_ROLES.includes(user.role as (typeof VALID_USER_ROLES)[number])) {
    void prisma.loginAttempt.create({ data: { email, ipAddress, userAgent, success: false, reason: "Role not allowed", country: geo.country, city: geo.city } }).catch(() => {});
    res.status(403).json({ error: "This account type cannot sign in directly" });
    return;
  }
  const effectiveRole = effectiveRoleFor(user);
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId: user.id, role: user.role, actingRole: effectiveRole !== user.role ? effectiveRole : undefined, jti }, JWT_SECRET, { expiresIn: "15m" });
  const refreshTokenRaw = crypto.randomBytes(32).toString("hex");
  const refreshHash = crypto.createHash("sha256").update(refreshTokenRaw).digest("hex");
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // Persist refresh token hash (httpOnly rotation)
  void prisma.refreshToken
    .create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: refreshExpiresAt,
        userAgent,
        ipAddress,
      },
    })
    .catch(() => {});
  // Set httpOnly cookies — primary auth (15m) + refresh (7d)
  res.cookie("iscms_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie("refresh_token", refreshTokenRaw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
  const tokenId = token.slice(0, 8);
  void (async () => {
    try {
      await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } });
      await prisma.userSession.create({
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          ipAddress,
          userAgent,
          device: ua.device,
          browser: ua.browser,
          browserVersion: ua.browserVersion,
          os: ua.os,
          osVersion: ua.osVersion,
          country: geo.country,
          city: geo.city,
          tokenId,
          isActive: true,
        },
      });
      await prisma.loginAttempt.create({ data: { email, ipAddress, userAgent, success: true, country: geo.country, city: geo.city } });
      await prisma.auditLog.create({
        data: {
          timestamp: new Date(),
          userName: user.id,
          userRole: actorRoleLabel(user),
          action: "Login",
          module: "Auth",
          details: `Login from ${ipAddress} (${ua.browser} on ${ua.os} / ${ua.device})`,
          ipAddress,
          userAgent,
        },
      });
    } catch {}
  })();
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      effectiveRole,
      actingRole: user.actingRole,
      actingExpiresAt: user.actingExpiresAt,
      actingGrantedBy: user.actingGrantedBy,
      actingGrantedAt: user.actingGrantedAt,
      department: user.department,
      status: user.status,
      region: user.region,
      customPermissions: user.customPermissions ?? null,
    },
  });
});

// Refresh — rotates httpOnly access token using refresh_token cookie (7d, hashed in DB)
app.post("/api/auth/refresh", async (req, res) => {
  const cookies = (req as any).cookies ?? {};
  let raw = cookies.refresh_token as string | undefined;
  if (!raw && req.headers.cookie) {
    const m = req.headers.cookie.match(/refresh_token=([^;]+)/);
    if (m) raw = decodeURIComponent(m[1]);
  }
  if (!raw) { res.status(401).json({ error: "Refresh token required" }); return; }
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.status === "Suspended") { res.status(401).json({ error: "User not found or suspended" }); return; }
  const effectiveRole = effectiveRoleFor(user as any);
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId: user.id, role: user.role, actingRole: effectiveRole !== user.role ? effectiveRole : undefined, jti }, JWT_SECRET, { expiresIn: "15m" });
  // Rotate refresh: revoke old, issue new
  await prisma.refreshToken.update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } }).catch(() => {});
  const newRaw = crypto.randomBytes(32).toString("hex");
  const newHash = crypto.createHash("sha256").update(newRaw).digest("hex");
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: newHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), userAgent: req.headers["user-agent"]?.slice(0, 300), ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? (req.socket.remoteAddress ?? "") },
  });
  res.cookie("iscms_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("refresh_token", newRaw, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000, path: "/api/auth" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, effectiveRole, actingRole: user.actingRole, actingExpiresAt: user.actingExpiresAt } });
});

// Logout — revoke jti + refresh, clear cookies
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload & { jti?: string };
  if (user?.jti) {
    const exp = new Date(Date.now() + 15 * 60 * 1000);
    void prisma.revokedToken.create({ data: { jti: user.jti, userId: user.userId, expiresAt: exp } }).catch(() => {});
  }
  const cookies = (req as any).cookies ?? {};
  let raw = cookies.refresh_token as string | undefined;
  if (!raw && req.headers.cookie) {
    const m = req.headers.cookie.match(/refresh_token=([^;]+)/);
    if (m) raw = decodeURIComponent(m[1]);
  }
  if (raw) {
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    void prisma.refreshToken.update({ where: { tokenHash: hash }, data: { revokedAt: new Date() } }).catch(() => {});
  }
  // Clear session
  const tokenId = (user as any)?.jti ? (user as any).jti.slice(0, 8) : "";
  if (tokenId) void prisma.userSession.updateMany({ where: { userId: user.userId, tokenId, isActive: true }, data: { isActive: false, logoutAt: new Date() } }).catch(() => {});
  res.clearCookie("iscms_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/api/auth" });
  res.json({ ok: true });
});

/* Account provisioning is exclusive to the IT Officer (§28.9). The registered
   account is created in an "Active" state but no session token is issued here —
   the new user signs in through /api/auth/login. */
app.post("/api/auth/register", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const parsed = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must be 8+ chars with letters and numbers"),
    role: z.string().min(1),
    department: z.string().min(1),
    region: z.string().optional(),
    customPermissions: z.record(z.string(), z.enum(["view", "full", "none"])).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { name, email, password, role, department, region, customPermissions } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, department, region, status: "Active", customPermissions: customPermissions ?? undefined },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "User Created",
      module: "IT Admin",
      details: `IT Officer created account for ${name} (${email}) as ${role}`,
    },
  });
  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, customPermissions: user.customPermissions ?? null },
  });
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const effectiveRole = effectiveRoleFor(dbUser);
  res.json({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    effectiveRole,
    actingRole: dbUser.actingRole,
    actingExpiresAt: dbUser.actingExpiresAt,
    actingGrantedBy: dbUser.actingGrantedBy,
    actingGrantedAt: dbUser.actingGrantedAt,
    department: dbUser.department,
    status: dbUser.status,
    region: dbUser.region,
    customPermissions: dbUser.customPermissions ?? null,
  });
});

app.get("/api/auth/users", authenticateToken, requireAnyModuleAccess("it", "hr", "identity"), async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true, status: true, region: true, forceNumber: true, phone: true, customPermissions: true, actingRole: true, actingExpiresAt: true, actingGrantedBy: true, actingGrantedAt: true, createdAt: true, idCardStatus: true, idCardNumber: true, idCardIssuedDate: true, idCardExpiryDate: true, idCardIssuerName: true, idCardIssuerSignatureUrl: true, photoUrl: true, signatureUrl: true, dateOfBirth: true, gender: true, maritalStatus: true, educationLevel: true, motherName: true, motherPhone: true, fatherName: true, fatherPhone: true, nextOfKinName: true, nextOfKinRelationship: true, nextOfKinPhone: true, nextOfKinResidence: true, relativesOrReferees: true, residenceDistrict: true, residenceSubCounty: true, residenceParish: true, residenceVillage: true, lc1Chairperson: true, lc1Contact: true, physicalAddress: true, emergencyContactPhone: true, surnameAtBirth: true, nationality: true, tribe: true, placeOfBirth: true, lc2Chairperson: true, closeRelatives: true, neighbours: true, fatherAlive: true, fatherResidence: true } });
  res.json(users.map((u) => ({ ...u, effectiveRole: effectiveRoleFor(u) })));
});

app.put("/api/auth/users/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    name: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    region: z.string().optional(),
    status: z.string().optional(),
    customPermissions: z.record(z.string(), z.enum(["view", "full", "none"])).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const user = await prisma.user.update({ where: { id }, data: parsed.data });
  res.json(user);
});

/* ── Time-bound acting-privileges delegation (§11) ────────────────────────
   HR Manager initiates the request — who needs coverage, for which role, and
   why. IT Officer executes the grant on that request and does not decide
   independently. Full audit trail on both sides: the HR request and the IT
   grant are both recorded. Executive-target rule (§11.6): Director is never
   delegable; the General Manager may be covered ONLY by the Finance Manager. */
const EXECUTIVE_TARGET_ROLES = ["General Manager", "Director"];

function actingGrantError(target: { id: string; role: string }, actingRole: string, expires: Date, actorUserId: string): string | null {
  if (target.id === actorUserId) return "Acting privileges cannot be granted to yourself";
  if (target.role === "IT Officer") return "Acting privileges cannot be granted to an IT Officer";
  if (actingRole === target.role) return "Acting role must differ from the user's assigned role";
  if (!VALID_USER_ROLES.includes(actingRole as (typeof VALID_USER_ROLES)[number])) return `Invalid acting role: ${actingRole}`;
  if (actingRole === "IT Officer") return "Acting IT Officer privileges are not permitted (self-escalation guard)";
  if (actingRole === "Director") return "The Director role cannot be delegated as an acting privilege";
  if (actingRole === "General Manager" && target.role !== "Finance Manager") {
    return "The General Manager may only be covered by the Finance Manager (§11.6)";
  }
  if (expires.getTime() <= Date.now()) return "expiresAt must be in the future";
  return null;
}

/* §11.1 — HR Manager initiates: who needs coverage, for which role, and why. */
app.post("/api/auth/acting-requests", authenticateToken, requireAnyRole("HR Manager"), async (req, res) => {
  const parsed = z.object({
    targetUserId: z.string().min(1),
    actingRole: z.string().min(1),
    expiresAt: z.string().min(1),
    reason: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { targetUserId, actingRole, expiresAt, reason } = parsed.data;
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const expires = new Date(expiresAt);
  if (isNaN(expires.getTime())) {
    res.status(400).json({ error: "expiresAt must be a valid date" });
    return;
  }
  const invalid = actingGrantError(target, actingRole, expires, (req as any).user.userId);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }
  const hrActor = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, select: { name: true } });
  const request = await prisma.actingPrivilegeRequest.create({
    data: {
      targetUserId: target.id,
      targetName: target.name,
      actingRole,
      reason,
      expiresAt: expires,
      status: "Pending",
      requestedById: (req as any).user.userId,
      requestedByName: hrActor?.name || "HR Manager",
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Acting Privileges Requested",
      module: "HR",
      details: `${hrActor?.name || "HR Manager"} requested ${target.name} (${target.role}) cover ${actingRole} until ${expires.toISOString()} — reason: ${reason}`,
    },
  });
  res.status(201).json(request);
});

/* §11.2 — HR Manager and IT Officer can view requests (IT needs the queue). */
app.get("/api/auth/acting-requests", authenticateToken, requireAnyRole("HR Manager", "IT Officer"), async (_req, res) => {
  const requests = await prisma.actingPrivilegeRequest.findMany({ orderBy: { createdAt: "desc" } });
  res.json(requests);
});

/* §11.2 — IT Officer executes the grant on the HR request. */
app.put("/api/auth/acting-requests/:id/execute", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const request = await prisma.actingPrivilegeRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ error: "Acting privilege request not found" });
    return;
  }
  if (request.status !== "Pending") {
    res.status(400).json({ error: `Request is already '${request.status}'` });
    return;
  }
  const target = await prisma.user.findUnique({ where: { id: request.targetUserId } });
  if (!target) {
    res.status(404).json({ error: "Target user not found" });
    return;
  }
  const invalid = actingGrantError(target, request.actingRole, request.expiresAt, (req as any).user.userId);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }
  const itActor = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, select: { name: true } });
  const updated = await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: { actingRole: request.actingRole, actingExpiresAt: request.expiresAt, actingGrantedBy: itActor?.name || "IT Officer", actingGrantedAt: new Date() },
    }),
    prisma.actingPrivilegeRequest.update({
      where: { id: request.id },
      data: { status: "Granted", grantedById: (req as any).user.userId, grantedByName: itActor?.name || "IT Officer", grantedAt: new Date() },
    }),
  ]);
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Acting Privileges Granted",
      module: "IT Admin",
      details: `${itActor?.name || "IT Officer"} executed HR request '${request.id}' — ${target.name} (${target.role}) granted ${request.actingRole} until ${request.expiresAt.toISOString()}. Requested by ${request.requestedByName}.`,
    },
  });
  res.json({ ...updated[0], effectiveRole: effectiveRoleFor(updated[0]) });
});

/* IT Officer may deny a pending HR request (never grants without one). */
app.put("/api/auth/acting-requests/:id/deny", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const request = await prisma.actingPrivilegeRequest.findUnique({ where: { id: req.params.id } });
  if (!request) {
    res.status(404).json({ error: "Acting privilege request not found" });
    return;
  }
  if (request.status !== "Pending") {
    res.status(400).json({ error: `Request is already '${request.status}'` });
    return;
  }
  const itActor = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, select: { name: true } });
  const denied = await prisma.actingPrivilegeRequest.update({
    where: { id: request.id },
    data: { status: "Denied", grantedById: (req as any).user.userId, grantedByName: itActor?.name || "IT Officer", grantedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Acting Privileges Denied",
      module: "IT Admin",
      details: `${itActor?.name || "IT Officer"} denied HR request '${request.id}' — ${request.targetName} was not granted ${request.actingRole}.`,
    },
  });
  res.json(denied);
});

app.delete("/api/auth/users/:id/acting", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { actingRole: null, actingExpiresAt: null, actingGrantedBy: null, actingGrantedAt: null },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Acting Privileges Revoked",
      module: "IT Admin",
      details: `IT Officer revoked acting privileges from ${target.name} (${target.role})`,
    },
  });
  res.json({ ...updated, effectiveRole: effectiveRoleFor(updated) });
});

/* ─────────────── CRUD: Guards ─────────────── */

const GUARD_CREATORS = ["HR Manager", "HR Assistant"];
const GUARD_LIFECYCLE_ROLES = ["Operations Manager", "Regional Manager", "HR Manager", "HR Assistant"];
const GUARD_ID_FIELDS = ["idCardStatus", "idCardNumber", "idCardIssuedDate", "idCardExpiryDate", "idCardIssuerName", "idCardIssuerSignatureUrl", "photoUrl", "signatureUrl"];

/* The UI sends human-readable designations ("K9 Handler", "Site In-Charge")
   which are @map'd in the schema; Prisma expects the enum member names. */
const mapGuardDesignation = (v: string) =>
  v === "K9 Handler" ? "K9_Handler" : v === "Site In-Charge" ? "Site_In_Charge" : v;
/* Reverse mapping on read so the client always sees the display strings. */
const unmapGuardDesignation = (v: string) =>
  v === "K9_Handler" ? "K9 Handler" : v === "Site_In_Charge" ? "Site In-Charge" : v;

function isRegionalManager(user: JwtPayload): boolean {
  return hasEffectiveRole(user, "Regional Manager");
}

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/api/guards", authenticateToken, requireModuleAccess("guards"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const where: any = {};
  // Push region filter into DB instead of in-memory scan
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (dbUser?.region) where.region = dbUser.region;
  }
  // Optional query filters: ?region=&status=&search=
  if (typeof req.query.region === "string" && req.query.region) where.region = req.query.region;
  if (typeof req.query.status === "string" && req.query.status) where.status = req.query.status;
  // ?page=&limit= → paginated envelope; otherwise full list (legacy clients)
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.guard.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.guard.count({ where }),
    ]);
    res.json(paginatedEnvelope(rows.map((g) => ({ ...g, designation: unmapGuardDesignation(g.designation) })), total, page, limit));
    return;
  }
  const guards = await prisma.guard.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: req.query.limit ? Math.min(Number(req.query.limit), 100) : undefined,
    skip: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json(guards.map((g) => ({ ...g, designation: unmapGuardDesignation(g.designation) })));
});

app.post("/api/guards", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!GUARD_CREATORS.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: `Access denied: guard enrolment is restricted to ${GUARD_CREATORS.join(" and ")}` });
    return;
  }
  const parsed = createGuardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { guard } = await prisma.$transaction(async (tx) => {
    const g = await (tx.guard.create as any)({
      data: {
        ...(parsed.data as any),
        designation: parsed.data.designation ? mapGuardDesignation(parsed.data.designation) : parsed.data.designation,
        forceNumber: parsed.data.forceNumber,
        certifications: ["Basic Security Training", "Crowd Control & Ethics"],
        joinDate: parsed.data.joinDate ? new Date(parsed.data.joinDate as any) : new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: (req as any).user?.userId || "system",
        userRole: actorRoleLabel((req as any).user) || "system",
        action: "Guard Enrolment",
        module: "Guard Personnel",
        details: `Enrolled guard officer ${g.fullName} (${g.forceNumber}) to ${g.assignedSite}.`,
      },
    });
    return { guard: g };
  });
  res.status(201).json({ ...guard, designation: unmapGuardDesignation(guard.designation) });
});

app.put("/api/guards/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const isHR = GUARD_CREATORS.some((r) => hasEffectiveRole(user, r));
  const isRecords = hasEffectiveRole(user, "Records Officer");
  if (!isHR && !isRecords) {
    res.status(403).json({ error: "Access denied: guard records are editable by HR roles; ID issuance is handled by the Records Officer" });
    return;
  }
  const parsed = createGuardSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (!isHR) {
    const allowed = Object.keys(parsed.data).filter((k) => GUARD_ID_FIELDS.includes(k));
    if (allowed.length !== Object.keys(parsed.data).length) {
      res.status(403).json({ error: `Access denied: Records Officer may only update ID fields (${GUARD_ID_FIELDS.join(", ")})` });
      return;
    }
  }
  if (isHR && !isRecords) {
    const idKeys = Object.keys(parsed.data).filter((k) => GUARD_ID_FIELDS.includes(k));
    if (idKeys.length > 0) {
      res.status(403).json({ error: `Access denied: ID card fields (${idKeys.join(", ")}) are the responsibility of the Records Officer — use the Records issuance flow` });
      return;
    }
  }
  const guard = await prisma.guard.findUnique({ where: { id } });
  if (!guard) {
    res.status(404).json({ error: "Guard not found" });
    return;
  }
  // §5: a promotion changing the printed designation triggers a reissue
  // entry in the Records Officer queue (ID card must reflect the new title).
  let data = { ...(parsed.data as any) };
  if (data.designation) data.designation = mapGuardDesignation(data.designation);
  if (
    data.designation &&
    data.designation !== guard.designation &&
    (guard.idCardStatus === "Issued & Active" || guard.idCardStatus === "Reissue Required")
  ) {
    data.idCardStatus = "Reissue Required";
  }
  const updated = await (prisma.guard.update as any)({ where: { id }, data });
  res.json({ ...updated, designation: unmapGuardDesignation(updated.designation) });
});

app.put("/api/guards/:id/lifecycle", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!GUARD_LIFECYCLE_ROLES.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot move guards through the lifecycle` });
    return;
  }
  if (isRegionalManager(user)) {
    const guard = await prisma.guard.findUnique({ where: { id }, select: { region: true } });
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (!guard) {
      res.status(404).json({ error: "Guard not found" });
      return;
    }
    if (dbUser?.region && guard.region && guard.region !== dbUser.region) {
      res.status(403).json({ error: "Access denied: this guard is outside your region" });
      return;
    }
  }
  const parsed = z.object({
    stage: z.enum(["ENROLLED", "HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT", "DEPLOYED"]).optional(),
    lifecycleStage: z.enum(["ENROLLED", "HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT", "DEPLOYED"]).optional(),
    status: z.string().optional(),
    terminationReason: z.string().optional(),
    terminationDate: z.string().optional(),
    terminationCategory: z.enum(["Terminated", "Suspended", "Deserted"]).optional(),
    desertionNotes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (parsed.data.lifecycleStage && !parsed.data.stage) {
    parsed.data.stage = parsed.data.lifecycleStage;
  }
  const { terminationCategory, terminationReason, desertionNotes, stage, ...rest } = parsed.data;
  if (terminationCategory) {
    if (terminationCategory === "Terminated" && !hasEffectiveRole(user, "HR Manager")) {
      res.status(403).json({ error: "Only the HR Manager can record a termination (final disciplinary step)" });
      return;
    }
    if (!terminationReason || !terminationReason.trim()) {
      res.status(400).json({ error: "A reason is required to suspend/terminate/mark a guard as deserted" });
      return;
    }
  }
  const guard = await prisma.guard.update({
    where: { id },
    data: {
      ...rest,
      ...(stage ? { lifecycleStage: stage } : {}),
      ...(terminationCategory ? {
        status: terminationCategory,
        terminationReason,
        terminationDate: parsed.data.terminationDate || new Date().toISOString().split("T")[0],
        terminationCategory,
        ...(terminationCategory === "Deserted" ? { isDeserter: true, desertionDate: parsed.data.terminationDate ? new Date(parsed.data.terminationDate) : new Date(), desertionNotes: desertionNotes ?? null } : {}),
      } : {}),
    },
  });
  if (stage === "PASSED_OUT") {
    await prisma.notification.createMany({
      data: [
        {
          targetRole: "Operations Manager",
          type: "success",
          title: "Guard Passed Out",
          message: `${guard.fullName} (${guard.forceNumber}) passed out of the Academy and is ready for deployment.`,
          module: "Operations",
        },
        {
          targetRole: "Regional Manager",
          type: "info",
          title: "Guard Passed Out",
          message: `${guard.fullName} (${guard.forceNumber}) passed out of the Academy and is ready for deployment.`,
          module: "Operations",
        },
      ],
    });
  }
  if (terminationCategory) {
    const detail = `${guard.fullName} (${guard.forceNumber}) ${terminationCategory.toLowerCase()} by ${user.role}. Reason: ${terminationReason}`;
    await prisma.auditLog.createMany({
      data: [
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${terminationCategory}`, module: "HR", details: detail },
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${terminationCategory}`, module: "Operations", details: detail },
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${terminationCategory}`, module: "Finance", details: detail },
      ],
    });
  }
  res.json({ ...guard, designation: unmapGuardDesignation(guard.designation) });
});

app.put("/api/guards/:id/issue-id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!hasEffectiveRole(user, "Records Officer")) {
    res.status(403).json({ error: "ID card issuance is the responsibility of the Records Officer" });
    return;
  }
  const parsed = z.object({
    idCardNumber: z.string().min(1),
    idCardExpiryDate: z.string().min(1).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const guard = await prisma.guard.update({
    where: { id },
    data: {
      idCardStatus: "Issued & Active",
      idCardNumber: parsed.data.idCardNumber,
      idCardIssuedDate: new Date().toISOString().split("T")[0],
      idCardExpiryDate: parsed.data.idCardExpiryDate ?? (() => {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 3);
        return expiry.toISOString().split("T")[0];
      })(),
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "ID Card Issued",
      module: "HR",
      details: `Records Officer issued ID ${parsed.data.idCardNumber} to ${guard.fullName} (${guard.forceNumber}).`,
    },
  });
  res.json({ ...guard, designation: unmapGuardDesignation(guard.designation) });
});

/* Staff (plastic) identity card issuance — Records Officer only. Issue date is
   always today; expiry is automatically +3 years (server-authoritative so a
   client-generated card and the DB record can never disagree). */
app.put("/api/auth/users/:id/issue-id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!hasEffectiveRole(user, "Records Officer")) {
    res.status(403).json({ error: "Staff ID card issuance is the responsibility of the Records Officer" });
    return;
  }
  const parsed = z.object({
    idCardNumber: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const staff = await prisma.user.findUnique({ where: { id } });
  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }
  const issuedDate = new Date().toISOString().split("T")[0];
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 3);
  const expiryDate = expiry.toISOString().split("T")[0];
  const userRecord = await prisma.user.update({
    where: { id },
    data: {
      idCardStatus: "Issued & Active",
      idCardNumber: parsed.data.idCardNumber,
      idCardIssuedDate: issuedDate,
      idCardExpiryDate: expiryDate,
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Staff ID Card Issued",
      module: "HR",
      details: `Records Officer issued staff ID ${parsed.data.idCardNumber} to ${staff.name} (${staff.forceNumber ?? "no force number"}). Expires ${expiryDate}.`,
    },
  });
  res.json(userRecord);
});

app.put("/api/guards/:id/archive", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || (!hasEffectiveRole(user, "HR Manager") && !hasEffectiveRole(user, "HR Assistant"))) {
    res.status(403).json({ error: "Access denied: guard archival is restricted to HR Manager / HR Assistant" });
    return;
  }
  const guard = await prisma.guard.update({
    where: { id },
    data: { status: "Archived", lifecycleStage: "DEPLOYED" },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Guard Archived",
      module: "HR",
      details: `Archived guard ${guard.fullName} (${guard.forceNumber}).`,
    },
  });
  res.json({ ...guard, designation: unmapGuardDesignation(guard.designation) });
});

app.delete("/api/guards/:id", authenticateToken, requireAnyRole("IT Officer"), async (req, res) => {
  const { id } = req.params;
  const guard = await prisma.guard.findUnique({ where: { id } });
  if (!guard) {
    res.status(404).json({ error: "Guard not found" });
    return;
  }
  await prisma.guard.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Guard Hard Deleted",
      module: "HR",
      details: `IT Officer hard-deleted guard ${guard.fullName} (${guard.forceNumber}).`,
    },
  });
  res.json({ message: "Guard permanently removed" });
});

/* ─────────────── CRUD: Sites ─────────────── */

app.get("/api/sites", authenticateToken, requireModuleAccess("sites"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const where: any = {};
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (dbUser?.region) where.region = dbUser.region;
  }
  if (typeof req.query.region === "string" && req.query.region) where.region = req.query.region;
  const sites = await prisma.clientSite.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: req.query.limit ? Math.min(Number(req.query.limit), 100) : undefined,
    skip: req.query.offset ? Number(req.query.offset) : undefined,
  });
  res.json(sites);
});

app.post("/api/sites", authenticateToken, requireModuleAccess("sites", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = createSiteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  // Attribution rule: the deal-closer who creates the site must be the same
  // person whose lead reached "Closed Won" (proving they originated and drove
  // the deal). The Business Development Manager, who monitors every deal, can
  // create the site for any won contract.
  if (hasEffectiveRole(user, "Sales and Marketing Supervisor")) {
    const actorName = (await contractActorName(req)) || user.role;
    const matchingLead = await prisma.lead.findFirst({
      where: {
        companyName: { equals: parsed.data.clientName, mode: "insensitive" },
        stage: "Closed Won",
        OR: [{ assignedTo: actorName }, { wonBy: actorName }],
      },
    });
    if (!matchingLead) {
      res.status(403).json({ error: "Attribution required: this deal must originate from a lead assigned to you that reached 'Closed Won' before the site can be created." });
      return;
    }
  }
  const actorName = (await contractActorName(req)) || user.role;
  const site = await (prisma.clientSite.create as any)({
    data: { ...(parsed.data as any), wonBy: actorName },
  });
  await (prisma.auditLog.create as any)({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Site Contract Onboarded",
      module: "Client CRM",
      details: `Added new contract site ${site.siteName} for ${site.clientName}. Deal credited to ${actorName}.`,
    },
  });
  res.status(201).json(site);
});

app.put("/api/sites/:id", authenticateToken, requireModuleAccess("sites", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = createSiteSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const existing = await prisma.clientSite.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Site not found" });
    return;
  }
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (dbUser?.region && existing.region !== dbUser.region) {
      res.status(403).json({ error: "Regional Managers may only edit sites within their own region." });
      return;
    }
  }
  const site = await (prisma.clientSite.update as any)({
    where: { id: req.params.id },
    data: parsed.data as any,
  });
  const actorName = (await contractActorName(req)) || user.role;
  await (prisma.auditLog.create as any)({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Site Contract Updated",
      module: "Client CRM",
      details: `Updated contract site ${site.siteName} for ${site.clientName}. Edited by ${actorName}.`,
    },
  });
  res.json(site);
});

/* ─────────────── CRUD: Contracts (Staff + Client SLA Vault) ─────────────── */

const STAFF_CONTRACT_ORIGINATORS = ["HR Manager", "HR Assistant"];
const CLIENT_CONTRACT_ORIGINATORS = ["Business Development Manager", "Sales and Marketing Supervisor"];
/* Roles allowed to read the contract vault — mirrors §9.7: HR (staff contracts),
   Marketing (client contracts), Operations (SLA step), Directorate (GM approval),
   Records Officer (archive), Internal Auditor (contract pricing, §28.7) and IT Officer
   (read-only troubleshooting, §28.9). */
const CONTRACT_READ_ROLES = [
  "General Manager",
  "Director",
  "HR Manager",
  "HR Assistant",
  "Records Officer",
  "Business Development Manager",
  "Sales and Marketing Supervisor",
  "Operations Manager",
  "Regional Manager",
  "Finance Manager",
  "Internal Auditor",
  "IT Officer",
];

const STAFF_CONTRACT_EDIT_FIELDS = [
  "title", "partyName", "category", "startDate", "endDate", "valueUgx", "documentRef", "managedBy",
  "region", "autoRenew", "paymentTerms", "billingCycle", "slaTerms", "notes", "relatedForceNumber", "scanPages",
];
const CLIENT_CONTRACT_DRAFT_FIELDS = [
  "title", "partyName", "category", "startDate", "endDate", "valueUgx", "documentRef", "managedBy",
  "region", "autoRenew", "paymentTerms", "billingCycle", "slaTerms", "notes", "relatedSiteName", "scanPages",
];
const CONTRACT_ARCHIVAL_FIELDS = ["documentRef", "notes", "managedBy", "scanPages"];

function contractApprovalRolesForStep(step: string): string[] {
  if (step === "GM") return ["General Manager"];
  return [];
}

function contractEffectiveStatus(c: { status: string; endDate: string | Date }): string {
  if (["Draft", "Terminated", "Archived", "Pending Renewal"].includes(c.status)) return c.status;
  const today = new Date();
  const end = c.endDate instanceof Date ? c.endDate : new Date(String(c.endDate) + "T23:59:59");
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "Expired";
  if (days <= 60) return "Expiring Soon";
  return c.status;
}

async function contractActorName(req: express.Request): Promise<string> {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) return "System";
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const name = dbUser?.name || user.role;
  // §11.5: decisions made while acting carry the acting marker on the record itself.
  if (user.actingRole && user.actingRole !== user.role) return `${name} (Acting ${user.actingRole})`;
  return name;
}

async function contractAudit(req: express.Request, action: string, details: string) {
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action,
      module: "HR",
      details,
    },
  });
}

function contractAllowedEditFields(c: { contractType: string; status: string; approvalStep?: string | null }, roles: string[]): string[] {
  const result = new Set<string>();
  for (const role of roles) {
    if (role === "Records Officer") {
      CONTRACT_ARCHIVAL_FIELDS.forEach((f) => result.add(f));
      continue;
    }
    if (c.contractType === "Staff Contract") {
      if (role === "HR Manager") {
        STAFF_CONTRACT_EDIT_FIELDS.forEach((f) => result.add(f));
      } else if (role === "HR Assistant" && c.status === "Draft") {
        STAFF_CONTRACT_EDIT_FIELDS.forEach((f) => result.add(f));
      }
      continue;
    }
    if (role === "Business Development Manager" || role === "Sales and Marketing Supervisor") {
      (c.status === "Draft" ? CLIENT_CONTRACT_DRAFT_FIELDS : ["valueUgx", "paymentTerms", "billingCycle", "slaTerms", "autoRenew", "notes"]).forEach((f) => result.add(f));
      continue;
    }
    if ((role === "Operations Manager" || role === "Regional Manager") && c.approvalStep === "Operations") {
      ["slaTerms", "relatedSiteName", "region", "notes"].forEach((f) => result.add(f));
    }
  }
  return [...result];
}

app.get("/api/contracts", authenticateToken, requireAnyRole(...CONTRACT_READ_ROLES), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.contract.findMany({ orderBy: { endDate: "asc" }, take, skip }),
      prisma.contract.count(),
    ]);
    res.json(paginatedEnvelope(rows.map((c) => ({ ...c, status: contractEffectiveStatus(c) })), total, page, limit));
    return;
  }
  const contracts = await prisma.contract.findMany({ orderBy: { endDate: "asc" } });
  res.json(contracts.map((c) => ({ ...c, status: contractEffectiveStatus(c) })));
});

app.post("/api/contracts", authenticateToken, async (req, res) => {
  const parsed = createContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actorName = await contractActorName(req);
  const isClient = parsed.data.contractType === "Client Contract";
  const allowed = isClient ? CLIENT_CONTRACT_ORIGINATORS : STAFF_CONTRACT_ORIGINATORS;
  if (!allowed.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot create ${parsed.data.contractType}s` });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data, createdBy: actorName, preparedBy: actorName };
  let action = "Contract Drafted";
  if (isClient) {
    data.status = "Draft";
    data.approvalStep = "GM";
    action = "Client Contract Onboarded";
  } else {
    if (hasEffectiveRole(user, "HR Assistant") || !data.status || data.status === "Draft") {
      data.status = "Draft";
      action = "Staff Contract Drafted";
    } else {
      data.status = "Active";
      data.issuedBy = actorName;
      action = "Staff Contract Issued";
    }
  }
  const contract = await (prisma.contract.create as any)({ data: data as any });
  await contractAudit(req, action, `${action}: '${contract.title}' (${contract.contractCode}) for ${contract.partyName}.`);
  res.status(201).json(contract);
});

app.put("/api/contracts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }
  const action = (req.body?.action as string | undefined) || "edit";
  const actorName = await contractActorName(req);

  if (action === "issue") {
    if (existing.contractType !== "Staff Contract") {
      res.status(400).json({ error: "Only staff contracts can be issued" });
      return;
    }
    if (!hasEffectiveRole(user, "HR Manager")) {
      res.status(403).json({ error: "Only the HR Manager can issue staff contracts" });
      return;
    }
    const updated = await prisma.contract.update({
      where: { id },
      data: { status: "Active", issuedBy: actorName, voidReason: null },
    });
    await contractAudit(req, "Staff Contract Issued", `HR Manager issued employment contract '${updated.title}' (${updated.contractCode}) for ${updated.partyName}.`);
    res.json(updated);
    return;
  }

  if (action === "approve") {
    if (existing.contractType !== "Client Contract") {
      res.status(400).json({ error: "Only client contracts require approval steps" });
      return;
    }
    if (existing.status !== "Draft") {
      res.status(400).json({ error: `Cannot approve a contract in status '${existing.status}'` });
      return;
    }
    const step = existing.approvalStep || "GM";
    const approvers = contractApprovalRolesForStep(step);
    if (!approvers.some((r) => hasEffectiveRole(user, r))) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot approve at step '${step}'` });
      return;
    }
    const data: Record<string, unknown> = { approvalStep: "Done" };
    data.status = "Active";
    data.approvedBy = actorName;
    data.approvedAt = new Date().toISOString().split("T")[0];
    const updated = await prisma.contract.update({ where: { id }, data });
    await contractAudit(req, "Contract Approval Advanced", `${actorRoleLabel(user)} approved '${updated.title}' (${updated.contractCode}); contract is now Active.`);
    res.json(updated);
    return;
  }

  if (action === "survey") {
    if (!["Operations Manager", "Regional Manager"].some((r) => hasEffectiveRole(user, r))) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot record a site survey` });
      return;
    }
    const siteSurvey = typeof req.body?.siteSurvey === "string" && req.body.siteSurvey.trim() ? req.body.siteSurvey.trim() : "";
    if (!siteSurvey) {
      res.status(400).json({ error: "A site survey report is required" });
      return;
    }
    const updated = await prisma.contract.update({
      where: { id },
      data: { siteSurvey, siteSurveyBy: actorName, siteSurveyAt: new Date().toISOString().split("T")[0] },
    });
    await contractAudit(req, "Site Survey Recorded", `${actorRoleLabel(user)} recorded a site survey for '${updated.title}' (${updated.contractCode}).`);
    res.json(updated);
    return;
  }

  if (action === "archive") {
    if (!hasEffectiveRole(user, "Records Officer")) {
      res.status(403).json({ error: "Only the Records Officer can archive contracts" });
      return;
    }
    const updated = await prisma.contract.update({ where: { id }, data: { status: "Archived" } });
    await contractAudit(req, "Contract Archived", `Records Officer archived '${updated.title}' (${updated.contractCode}) for ${updated.partyName}.`);
    res.json(updated);
    return;
  }

  if (action === "void") {
    const voidReason = typeof req.body?.voidReason === "string" && req.body.voidReason.trim() ? req.body.voidReason.trim() : "";
    if (!voidReason) {
      res.status(400).json({ error: "A void reason is required to terminate a contract" });
      return;
    }
    const voiders =
      existing.contractType === "Staff Contract"
        ? ["HR Manager"]
        : ["General Manager"];
    if (!voiders.some((r) => hasEffectiveRole(user, r))) {
      res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot void this contract` });
      return;
    }
    const updated = await prisma.contract.update({ where: { id }, data: { status: "Terminated", voidReason } });
    await contractAudit(req, "Contract Terminated", `${actorRoleLabel(user)} terminated '${updated.title}' (${updated.contractCode}). Reason: ${voidReason}`);
    res.json(updated);
    return;
  }

  const parsed = createContractSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const allowedFields = contractAllowedEditFields(existing, effectiveRolesOf(user));
  if (allowedFields.length === 0) {
    res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot edit this contract in its current state` });
    return;
  }
  const disallowed = Object.keys(parsed.data).filter((k) => !allowedFields.includes(k));
  if (disallowed.length > 0) {
    res.status(403).json({ error: "You don't have permission to perform this action" });
    return;
  }
  const updated = await prisma.contract.update({ where: { id }, data: parsed.data });
  await contractAudit(req, "Contract Updated", `${actorRoleLabel(user)} updated '${updated.title}' (${updated.contractCode}).`);
  res.json(updated);
});

/* ─────────────── Digital Contracts (PDF-based) ─────────────── */
app.use("/api/digital-contract-templates", authenticateToken, requireModuleAccess("documents", "full"), digitalContractTemplateRoutes);
app.use("/api/digital-contracts", authenticateToken, requireModuleAccess("documents"), digitalContractRoutes);
app.use("/api/digital-sign", digitalSigningRoutes);

// ── Serve the embedded public signing page ──
app.get("/digital-sign/:token", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "sign-contract.html"));
});

/* ─────────────── CRUD: Incidents ─────────────── */

const INCIDENT_HANDLERS = ["Investigations Officer", "Operations Manager", "Regional Manager"];

app.get("/api/incidents", authenticateToken, requireModuleAccess("incidents"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let incidents = await prisma.incident.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const sites = await prisma.clientSite.findMany({ where: { region }, select: { siteName: true } });
      const siteNames = new Set(sites.map((s) => s.siteName));
      incidents = incidents.filter((i) => siteNames.has(i.siteName));
    }
  }
  if (hasListPagination(req)) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limitRaw = Number(req.query.limit);
    const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    res.json(paginatedEnvelope(incidents.slice((page - 1) * limit, page * limit), incidents.length, page, limit));
    return;
  }
  res.json(incidents);
});

app.post("/api/incidents", authenticateToken, requireModuleAccess("incidents", "full"), async (req, res) => {
  const parsed = createIncidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const code = `INC-2026-${String((await prisma.incident.count()) + 1).padStart(3, "0")}`;
  const incident = await prisma.incident.create({
    data: {
      ...parsed.data,
      incidentCode: code,
      incidentDate: parsed.data.incidentDate || new Date(),
    },
  });
  res.status(201).json(incident);
});

app.put("/api/incidents/:id/investigate", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Investigations Officer")) {
    res.status(403).json({ error: "Only the Investigations Officer can open an investigation" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "UnderInvestigation" } });
  res.json(incident);
});

app.put("/api/incidents/:id/escalate", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !INCIDENT_HANDLERS.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: "Access denied: cannot escalate this incident" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Escalated" } });
  res.json(incident);
});

app.put("/api/incidents/:id/ops-close", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Operations Manager")) {
    res.status(403).json({ error: "Only the Operations Manager can close escalated incidents" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Resolved" } });
  res.json(incident);
});

app.put("/api/incidents/:id/resolve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !INCIDENT_HANDLERS.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: "Access denied: only Investigations, Operations Manager, or a Regional Manager can resolve incidents" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Resolved" } });
  res.json(incident);
});

/* ─────────────── CRUD: Vehicles ─────────────── */

app.get("/api/vehicles", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });
  res.json(vehicles);
});

app.post("/api/vehicles", authenticateToken, requireModuleAccess("vehicles", "full"), async (req, res) => {
  const parsed = createVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const vehicle = await (prisma.vehicle.create as any)({
    data: { ...(parsed.data as any), lastServiceDate: new Date().toISOString().split("T")[0], nextServiceDueKm: 5000, status: (parsed.data as any).status || "Operational" },
  });
  res.status(201).json(vehicle);
});

/* ─────────────── CRUD: Invoices / Expenses / Cashier ─────────────── */

/* Invoice numbers follow INV-2026-NNNN; the next number is derived from the
   current max rather than row count so gaps/seed entries never cause a unique
   collision. Callers retry on UniqueConstraintViolation for concurrent inserts. */
async function nextInvoiceNumber(): Promise<string> {
  const rows = await prisma.$queryRaw<{ m: string | null }[]>`
    SELECT MAX(SUBSTRING("invoiceNumber" FROM 10 FOR 4)) AS m
    FROM "Invoice"
    WHERE "invoiceNumber" LIKE 'INV-2026-%'
  `;
  const max = rows[0]?.m ? parseInt(rows[0].m, 10) : 0;
  return `INV-2026-${String(max + 1).padStart(4, "0")}`;
}

app.get("/api/invoices", authenticateToken, requireModuleAccess("invoices"), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take, skip }),
      prisma.invoice.count(),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
  res.json(invoices);
});

app.post("/api/invoices", authenticateToken, requireModuleAccess("invoices", "full"), async (req, res) => {
  const parsed = createInvoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  // Count-based numbering can race under concurrent inserts (unique constraint).
  // Retry by re-reading the count; a hard failure returns 500 instead of hanging.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const invNumber = await nextInvoiceNumber();
      const invoice = await prisma.invoice.create({
        data: { ...parsed.data, invoiceNumber: invNumber, date: new Date(), status: "Draft" },
      });
      res.status(201).json(invoice);
      return;
    } catch (err) {
      const isUniqueViolation = String((err as Error)?.cause ?? err).includes("UniqueConstraintViolation");
      if (attempt === 3 || !isUniqueViolation) {
        res.status(500).json({ error: "Failed to create invoice" });
        return;
      }
    }
  }
});

/* Invoice approval before send (§Phase 3): invoices are created in Draft and
   must be approved by the Finance Manager before they become Pending (sent to
   client). Only an approved invoice may transition to Paid/Overdue. */
app.put("/api/invoices/:id/approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Finance Manager")) {
    res.status(403).json({ error: "Only the Finance Manager can approve an invoice for sending" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (existing.status !== "Draft") {
    res.status(400).json({ error: "Only a Draft invoice can be approved for sending" });
    return;
  }
  const overThreshold = existing.amount >= 100_000_000;
  const approver = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const invoice = await prisma.invoice.update({
    where: { id },
    data: overThreshold
      ? { status: "PendingGMApproval", approvedBy: approver?.name ?? "Finance Manager", approvedAt: new Date() }
      : { status: "Pending", approvedBy: approver?.name ?? "Finance Manager", approvedAt: new Date(), sentAt: new Date() },
  });
  res.json(invoice);
});

/* High-value invoices (≥100M UGX) require GM final approval (mirrors expense model). */
app.put("/api/invoices/:id/gm-approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can give final approval on high-value invoices" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (existing.status !== "PendingGMApproval") {
    res.status(400).json({ error: "Only an invoice pending GM approval can be finalized" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: "Pending", approvedBy: actorName, approvedAt: new Date(), sentAt: new Date() },
  });
  res.json(invoice);
});

/* Finance Manager / Accountant update an invoice (billing fields or lifecycle
   status). A Draft invoice can never be saved back to Draft and only approved
   invoices move to Paid/Overdue. */
app.put("/api/invoices/:id", authenticateToken, requireModuleAccess("invoices", "full"), async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const body = req.body ?? {};
  const status = typeof body.status === "string" ? body.status : existing.status;
  if (status === "Draft") {
    res.status(400).json({ error: "An invoice cannot be reverted to Draft" });
    return;
  }
  if ((status === "Paid" || status === "Overdue") && (existing.status === "Draft" || existing.status === "PendingGMApproval")) {
    res.status(400).json({ error: "A Draft invoice must be approved before it can be marked Paid or Overdue" });
    return;
  }
  const data: Record<string, unknown> = { status };
  if (typeof body.clientName === "string") data.clientName = body.clientName;
  if (typeof body.siteName === "string") data.siteName = body.siteName;
  if (typeof body.invoiceNumber === "string") data.invoiceNumber = body.invoiceNumber;
  if (typeof body.amount === "number") data.amount = body.amount;
  if (typeof body.dueDate === "string") data.dueDate = new Date(body.dueDate);
  else if (body.dueDate instanceof Date) data.dueDate = body.dueDate;
  const invoice = await prisma.invoice.update({ where: { id }, data });
  res.json(invoice);
});

app.delete("/api/invoices/:id", authenticateToken, requireModuleAccess("invoices", "full"), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.invoice.delete({ where: { id } });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Invoice not found" });
  }
});

/* ─────────────── Marketing-origin collection reminders ───────────────
   Africa's Talking SMS + SendGrid email, credentials in .env:
   AT_SMS_USERNAME / AT_SMS_API_KEY / AT_SMS_SENDER_ID / SENDGRID_API_KEY / REMINDER_FROM_EMAIL.
   If credentials are not configured the reminder is still logged as Skipped. */
function sendAtSms(to: string, message: string): Promise<boolean> {
  const key = process.env.AT_SMS_API_KEY;
  if (!key) return Promise.resolve(false);
  return fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "apiKey": key },
    body: new URLSearchParams({
      username: process.env.AT_SMS_USERNAME || "",
      to,
      message,
      from: process.env.AT_SMS_SENDER_ID || "",
    }).toString(),
  }).then((r) => r.ok).catch(() => false);
}

function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) return Promise.resolve(false);
  return fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.REMINDER_FROM_EMAIL || "billing@iscms.ug" },
      subject,
      content: [{ type: "text/plain", value: html }],
    }),
  }).then((r) => r.ok).catch(() => false);
}

app.post("/api/invoices/:id/remind", authenticateToken, requireAnyRole("Finance Manager", "Business Development Manager", "Sales and Marketing Supervisor"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (invoice.status !== "Pending" && invoice.status !== "Overdue") {
    res.status(400).json({ error: "Only sent (Pending/Overdue) invoices can be reminded" });
    return;
  }
  const triggerer = await prisma.user.findUnique({ where: { id: user!.userId }, select: { name: true, role: true } });
  const message = `Dear ${invoice.clientName}, this is a payment reminder for invoice ${invoice.invoiceNumber} of UGX ${invoice.amount.toLocaleString()} due ${invoice.dueDate}. Please settle at your earliest convenience. — ISCMS Billing`;
  const recipient = (triggerer?.role === "Business Development Manager" || triggerer?.role === "Sales and Marketing Supervisor")
    ? (req.body?.recipient as string | undefined)
    : undefined;
  const emailOk = recipient ? await sendEmail(recipient, `Payment reminder ${invoice.invoiceNumber}`, message) : false;
  const smsOk = recipient ? await sendAtSms(recipient, message) : false;
  const delivered = emailOk || smsOk;
  const reason = !recipient
    ? "No client contact on file — configure a recipient email/phone"
    : !emailOk && !smsOk
      ? "Reminder credentials not configured in .env"
      : undefined;
  const reminder = await prisma.reminder.create({
    data: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      channel: emailOk && smsOk ? "sms+email" : emailOk ? "email" : smsOk ? "sms" : "none",
      recipient: recipient || "",
      status: delivered ? "Sent" : "Skipped",
      reason,
      message,
      triggeredBy: triggerer?.name ?? user!.role,
    },
  });
  res.status(delivered ? 200 : 202).json(reminder);
});

/* Read-only collections view for Finance + Marketing (marketing-led collections). */
app.get("/api/collections", authenticateToken, requireAnyRole("Finance Manager", "Accountant", "Assistant Accountant", "Internal Auditor", "Cashier", "Business Development Manager", "Sales and Marketing Supervisor"), async (_req, res) => {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: "desc" } });
  res.json(invoices);
});

app.get("/api/expenses", authenticateToken, requireModuleAccess("expenses"), async (_req, res) => {
  const expenses = await prisma.expense.findMany({ orderBy: { createdAt: "desc" } });
  res.json(expenses);
});

app.post("/api/expenses", authenticateToken, requireModuleAccess("expenses", "full"), async (req, res) => {
  const parsed = createExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      approvedBy: "",
      status: "Pending",
      date: parsed.data.date || new Date().toISOString().split("T")[0],
    },
  });
  res.status(201).json(expense);
});

app.put("/api/expenses/:id/approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can approve expenses" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const expense = await prisma.expense.update({
    where: { id },
    data: { status: "Approved", approvedBy: actorName },
  });
  res.json(expense);
});

/* Legacy endpoint retained for any expenses already sitting in PendingGMApproval
   from before the §2 no-threshold change — GM finalizes directly. */
app.put("/api/expenses/:id/gm-approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can give final approval on expenses" });
    return;
  }
  const { id } = req.params;
  const actorName = (await contractActorName(req)) || user.role;
  const expense = await prisma.expense.update({ where: { id }, data: { status: "Approved", approvedBy: actorName } });
  res.json(expense);
});

app.put("/api/expenses/:id/reject", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can reject expenses" });
    return;
  }
  const { id } = req.params;
  const expense = await prisma.expense.update({ where: { id }, data: { status: "Rejected" } });
  res.json(expense);
});

app.get("/api/cashier-transactions", authenticateToken, requireModuleAccess("finance"), async (_req, res) => {
  const transactions = await prisma.cashierTransaction.findMany({ orderBy: { createdAt: "desc" } });
  res.json(transactions);
});

app.post("/api/cashier-transactions", authenticateToken, requireModuleAccess("finance", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || (!hasEffectiveRole(user, "Cashier") && !hasEffectiveRole(user, "Finance Manager"))) {
    res.status(403).json({ error: "Only the Cashier (or Finance Manager) can initiate a disbursement" });
    return;
  }
  const parsed = z.object({
    guardName: z.string().min(1),
    forceNumber: z.string().min(1),
    type: z.string().min(1),
    amount: z.number().positive(),
    date: z.string().optional(),
    phone: z.string().optional(),
    signatureUrl: z.string().optional(),
    notes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const cashier = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const tx = await prisma.cashierTransaction.create({
    data: {
      ...parsed.data,
      processedBy: cashier?.name ?? user.role,
      date: parsed.data.date || new Date().toISOString().split("T")[0],
      status: "Pending Approval",
    },
  });
  res.status(201).json(tx);
});

/* Cashier disbursement FM-approval flow (§Phase 3): a Cashier-initiated
   disbursement stays Pending Approval until the Finance Manager signs off. */
app.put("/api/cashier-transactions/:id/approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Finance Manager")) {
    res.status(403).json({ error: "Only the Finance Manager can approve a cashier disbursement" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.cashierTransaction.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  if (existing.status !== "Pending Approval") {
    res.status(400).json({ error: "Only a Pending Approval disbursement can be approved" });
    return;
  }
  const approver = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const tx = await prisma.cashierTransaction.update({
    where: { id },
    data: { status: "Disbursed", approvedBy: approver?.name ?? "Finance Manager", approvedAt: new Date() },
  });
  res.json(tx);
});

app.put("/api/cashier-transactions/:id/reject", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Finance Manager")) {
    res.status(403).json({ error: "Only the Finance Manager can reject a cashier disbursement" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.cashierTransaction.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  if (existing.status !== "Pending Approval") {
    res.status(400).json({ error: "Only a Pending Approval disbursement can be rejected" });
    return;
  }
  const approver = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const tx = await prisma.cashierTransaction.update({
    where: { id },
    data: { status: "Rejected", rejectedBy: approver?.name ?? "Finance Manager" },
  });
  res.json(tx);
});

/* ─────────────── CRUD: Leads ─────────────── */

function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim();
}

const LEAD_STAGES = ["New", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"] as const;

app.get("/api/leads", authenticateToken, requireModuleAccess("leads"), async (_req, res) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  res.json(leads);
});

app.post("/api/leads", authenticateToken, requireModuleAccess("leads", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = z.object({
    companyName: z.string().min(1),
    contactPerson: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    estimatedValue: z.number(),
    // Mandatory at creation — every lead must have a source channel picked.
    source: z.string().min(1),
    assignedTo: z.string().optional(),
    ownerId: z.string().optional(),
    region: z.string().optional(),
    followUpDate: z.string().nullable().optional(),
    lastContactedAt: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed (source is mandatory)", details: parsed.error.issues });
    return;
  }
  const actor = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const actorName = actor?.name || user.role;
  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      stage: "New",
      wonBy: null,
      assignedTo: parsed.data.assignedTo || actorName,
      ownerId: parsed.data.ownerId || user.userId,
    },
  });
  res.status(201).json(lead);
});

app.put("/api/leads/:id", authenticateToken, requireModuleAccess("leads", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = z.object({
    stage: z.enum(LEAD_STAGES).optional(),
    assignedTo: z.string().optional(),
    region: z.string().optional(),
    estimatedValue: z.number().optional(),
    companyName: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().min(1).optional(),
    lostReason: z.string().optional(),
    followUpDate: z.string().nullable().optional(),
    lastContactedAt: z.string().nullable().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  const actor = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const actorName = actor?.name || user.role;

  // Owner-only stage advancement: only the lead's owner may move its stage
  // (the BDM's control mechanism is reassignment, not direct editing).
  if (parsed.data.stage !== undefined) {
    const isOwner = existing.ownerId === user.userId || existing.assignedTo === actorName;
    const isUnassigned = !existing.ownerId && (existing.assignedTo === "" || existing.assignedTo === "Unassigned");
    if (!isOwner && !isUnassigned) {
      res.status(403).json({ error: "Only the lead owner can advance its stage. Ask the Business Development Manager to reassign ownership." });
      return;
    }
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.stage === "Closed Won") {
    data.wonBy = actorName;
    data.lostReason = null;
  } else if (parsed.data.stage !== undefined) {
    // A lead that leaves "Closed Won"/"Closed Lost" is no longer terminal.
    data.wonBy = null;
    data.lostReason = parsed.data.stage === "Closed Lost" ? parsed.data.lostReason ?? null : null;
  }
  const lead = await prisma.lead.update({ where: { id }, data });
  res.json(lead);
});

/* BDM-only reassignment — moving a lead's ownership is the BDM's sole editing
   control (a Sales and Marketing Supervisor cannot reassign their own lead). */
app.put("/api/leads/:id/reassign", authenticateToken, requireModuleAccess("leads", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Business Development Manager")) {
    res.status(403).json({ error: "Only the Business Development Manager can reassign lead ownership" });
    return;
  }
  const parsed = z.object({
    assignedTo: z.string().min(1),
    ownerId: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  // Ownership binding follows the reassignment: if no new owner id is supplied,
  // clear the previous owner's binding so only the assignedTo name grants rights.
  const lead = await prisma.lead.update({ where: { id }, data: { assignedTo: parsed.data.assignedTo, ownerId: parsed.data.ownerId ?? null } });
  res.json(lead);
});

app.delete("/api/leads/:id", authenticateToken, requireModuleAccess("leads", "full"), async (req, res) => {
  await prisma.lead.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ─────────────── Public website intake (no auth — rate limited + honeypot) ───────────────
   The company website (a separate public site) POSTs here. Leads are auto-tagged
   source "Website" and left unassigned for the BDM to route to a Supervisor. */

const publicLeadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const publicComplaintLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

app.post("/api/public/leads", publicLeadLimiter, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  // Honeypot: bots that fill the invisible "website" field are silently dropped.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    res.status(200).json({ ok: true });
    return;
  }
  const parsed = z.object({
    companyName: z.string().trim().min(1).max(300),
    contactPerson: z.string().trim().min(1).max(200),
    email: z.string().email(),
    phone: z.string().trim().min(1).max(40),
    estimatedValue: z.number().nonnegative().optional(),
    region: z.string().trim().max(100).optional(),
  }).safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const lead = await prisma.lead.create({
    data: {
      companyName: sanitizeText(parsed.data.companyName),
      contactPerson: sanitizeText(parsed.data.contactPerson),
      email: parsed.data.email.trim(),
      phone: sanitizeText(parsed.data.phone),
      estimatedValue: parsed.data.estimatedValue ?? 0,
      region: parsed.data.region ? sanitizeText(parsed.data.region) : null,
      source: "Website",
      stage: "New",
      assignedTo: "Unassigned",
      ownerId: null,
      wonBy: null,
    },
  });
  res.status(201).json(lead);
});

app.post("/api/public/complaints", publicComplaintLimiter, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  // Honeypot: bots that fill the invisible "website" field are silently dropped.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    res.status(200).json({ ok: true });
    return;
  }
  const parsed = z.object({
    clientName: z.string().trim().min(1).max(200),
    siteName: z.string().trim().max(200).optional(),
    category: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(4000),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().trim().max(40).optional(),
    satisfactionRating: z.number().int().min(1).max(5).optional(),
  }).safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const code = `CMPL-WEB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String((await prisma.complaint.count()) + 1).padStart(3, "0")}`;
  const complaint = await prisma.complaint.create({
    data: {
      clientName: sanitizeText(parsed.data.clientName),
      siteName: parsed.data.siteName ? sanitizeText(parsed.data.siteName) : "Website Submission",
      category: sanitizeText(parsed.data.category),
      description: sanitizeText(parsed.data.description),
      satisfactionRating: parsed.data.satisfactionRating,
      complaintCode: code,
      reportedDate: new Date().toISOString().split("T")[0],
      ownedBy: "Marketing",
      status: "Open",
    },
  });
  res.status(201).json(complaint);
});

/* ─────────────── CRUD: K9 ─────────────── */

app.get("/api/k9s", authenticateToken, requireModuleAccess("k9s"), async (_req, res) => {
  const k9s = await prisma.k9Dog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(k9s);
});

app.get("/api/k9-logs", authenticateToken, requireModuleAccess("k9s"), async (_req, res) => {
  const logs = await prisma.k9Log.findMany({ orderBy: { createdAt: "desc" } });
  res.json(logs);
});

app.get("/api/armoury", authenticateToken, requireModuleAccess("armoury"), async (_req, res) => {
  const items = await prisma.armouryItem.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

app.get("/api/armoury-logs", authenticateToken, requireModuleAccess("armoury"), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.armouryLog.findMany({ orderBy: { createdAt: "desc" }, take, skip }),
      prisma.armouryLog.count(),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const logs = await prisma.armouryLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(logs);
});

/* ─────────────── CRUD: Fleet Operations (Trips / Fuel / Maintenance / Drivers / Inspections / Breakdowns) ─────────────── */

const whitelistFields = (body: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
};

const requireRole = (role: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!hasEffectiveRole(user, role)) {
      res.status(403).json({ error: `Access denied: requires role ${role}` });
      return;
    }
    next();
  };
};

// ── Trips ──
const TRIP_KEYS = ["vehicleId", "plateNumber", "driverName", "destination", "purpose", "startMileageKm", "endMileageKm", "distanceKm", "departureTime", "arrivalTime", "status", "authorizedBy"];

app.get("/api/trips", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.vehicleTripLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/trips", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const tripCode = `TRP-2026-${String((await prisma.vehicleTripLog.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.vehicleTripLog.create({
    data: { ...whitelistFields(req.body, TRIP_KEYS), tripCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/trips/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.vehicleTripLog.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, TRIP_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/trips/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  await prisma.vehicleTripLog.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ── Fuel Logs ──
const FUEL_KEYS = ["vehicleId", "plateNumber", "driverName", "fuelLitres", "costUgx", "mileageAtRefillKm", "fuelType", "stationName", "refillDate", "reconciled", "approvedBy"];

app.get("/api/fuel-logs", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.fuelLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/fuel-logs", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const voucherCode = `FVR-2026-${String((await prisma.fuelLog.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.fuelLog.create({
    data: {
      ...whitelistFields(req.body, FUEL_KEYS),
      voucherCode,
      status: req.body.reconciled ? "Approved" : "Pending FM Approval",
      approvedBy: "",
    } as any,
  });
  res.status(201).json(row);
});

app.put("/api/fuel-logs/:id/approve", authenticateToken, requireModuleAccess("fleet"), requireRole("Fleet Manager"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const approver = await prisma.user.findUnique({ where: { id: user.userId } });
  const row = await prisma.fuelLog.update({
    where: { id: req.params.id },
    data: { status: "Approved", reconciled: true, approvedBy: approver?.name || "Fleet Manager", approvedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(row);
});

app.put("/api/fuel-logs/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.fuelLog.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, FUEL_KEYS) as any,
  });
  res.json(row);
});

// ── Maintenance ──
const MAINT_KEYS = ["vehicleId", "plateNumber", "serviceType", "description", "mileageAtServiceKm", "serviceDate", "nextDueDate", "costUgx", "workshopName", "status"];

app.get("/api/maintenance", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.maintenanceServiceLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/maintenance", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const serviceCode = `WO-2026-${String((await prisma.maintenanceServiceLog.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.maintenanceServiceLog.create({
    data: { ...whitelistFields(req.body, MAINT_KEYS), serviceCode, approvalStatus: "Pending FM Approval" } as any,
  });
  res.status(201).json(row);
});

app.put("/api/maintenance/:id/approve", authenticateToken, requireModuleAccess("fleet"), requireRole("Fleet Manager"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const approver = await prisma.user.findUnique({ where: { id: user.userId } });
  const row = await prisma.maintenanceServiceLog.update({
    where: { id: req.params.id },
    data: { approvalStatus: "Approved", approvedBy: approver?.name || "Fleet Manager", approvedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(row);
});

app.put("/api/maintenance/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.maintenanceServiceLog.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, MAINT_KEYS) as any,
  });
  res.json(row);
});

// ── Drivers ──
const DRIVER_KEYS = ["fullName", "roleType", "forceNumber", "contactPhone", "nationalId", "licenceNumber", "licenceClass", "licenceExpiryDate", "assignedVehiclePlate", "dutyShift", "safetyScorePct", "totalTripsCompleted", "trainingBadges", "status", "sourceRef", "approvedBy", "approvedAt"];

app.get("/api/drivers", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.driver.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/drivers", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const driverCode = `DRV-UG-${String((await prisma.driver.count()) + 1).padStart(2, "0")}`;
  const fields = whitelistFields(req.body, DRIVER_KEYS) as any;
  if (!fields.forceNumber) fields.forceNumber = await nextForceNumber();
  const row = await prisma.driver.create({
    data: { ...fields, driverCode },
  });
  res.status(201).json(row);
});

app.put("/api/drivers/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.driver.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, DRIVER_KEYS) as any,
  });
  res.json(row);
});

app.put("/api/drivers/:id/approve", authenticateToken, requireModuleAccess("fleet"), requireRole("Fleet Manager"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const approver = await prisma.user.findUnique({ where: { id: user.userId } });
  const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  const row = await prisma.driver.update({
    where: { id: req.params.id },
    data: { status: "Active Duty", approvedBy: approver?.name || "Fleet Manager", approvedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(row);
});

// ── Daily Inspections ──
const INSPECTION_KEYS = ["vehicleId", "plateNumber", "inspectorDriver", "inspectionDate", "inspectionTime", "brakesCheck", "tyresCheck", "lightsSirensCheck", "oilLevelCheck", "coolantCheck", "batteryCheck", "overallCondition", "defectsNoted"];

app.get("/api/inspections", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.dailyVehicleInspection.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/inspections", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const inspectionCode = `DVI-2026-${String((await prisma.dailyVehicleInspection.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.dailyVehicleInspection.create({
    data: { ...whitelistFields(req.body, INSPECTION_KEYS), inspectionCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/inspections/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.dailyVehicleInspection.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, INSPECTION_KEYS) as any,
  });
  res.json(row);
});

// ── Breakdown Emergencies ──
const BREAKDOWN_KEYS = ["vehicleId", "plateNumber", "driverName", "location", "issueType", "description", "reportedTime", "recoveryAssigned", "backupVehicleDispatched", "status"];

app.get("/api/breakdowns", authenticateToken, requireModuleAccess("fleet"), async (_req, res) => {
  const rows = await prisma.fleetBreakdownEmergency.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/breakdowns", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const incidentCode = `EMG-2026-${String((await prisma.fleetBreakdownEmergency.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.fleetBreakdownEmergency.create({
    data: { ...whitelistFields(req.body, BREAKDOWN_KEYS), incidentCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/breakdowns/:id", authenticateToken, requireModuleAccess("fleet", "full"), async (req, res) => {
  const row = await prisma.fleetBreakdownEmergency.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, BREAKDOWN_KEYS) as any,
  });
  res.json(row);
});

/* ─────────────── CRUD: Patrol Inspections ─────────────── */

const PATROL_KEYS = ["siteName", "supervisorName", "guardOnDuty", "inspectionTime", "radioCheckStatus", "uniformTurnout", "weaponEquipmentCheck", "overallRating", "remarks"];

app.get("/api/patrol-inspections", authenticateToken, requireModuleAccess("patrol"), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.patrolInspectionLog.findMany({ orderBy: { createdAt: "desc" }, take, skip }),
      prisma.patrolInspectionLog.count(),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const rows = await prisma.patrolInspectionLog.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/patrol-inspections", authenticateToken, requireModuleAccess("patrol", "full"), async (req, res) => {
  const inspectionCode = `PTL-2026-${String((await prisma.patrolInspectionLog.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.patrolInspectionLog.create({
    data: { ...whitelistFields(req.body, PATROL_KEYS), inspectionCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/patrol-inspections/:id", authenticateToken, requireModuleAccess("patrol", "full"), async (req, res) => {
  const row = await prisma.patrolInspectionLog.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, PATROL_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/patrol-inspections/:id", authenticateToken, requireModuleAccess("patrol", "full"), async (req, res) => {
  await prisma.patrolInspectionLog.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ─────────────── CRUD: Duty Roster ─────────────── */

const ROSTER_KEYS = ["guardId", "guardName", "siteId", "siteName", "region", "shiftDate", "shiftType", "status", "checkInTime", "checkOutTime"];

app.get("/api/roster", authenticateToken, requireModuleAccess("roster"), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.dutyRoster.findMany({ orderBy: { createdAt: "desc" }, take, skip }),
      prisma.dutyRoster.count(),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const rows = await prisma.dutyRoster.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/roster", authenticateToken, requireModuleAccess("roster", "full"), async (req, res) => {
  const row = await prisma.dutyRoster.create({
    data: whitelistFields(req.body, ROSTER_KEYS) as any,
  });
  res.status(201).json(row);
});

app.put("/api/roster/:id", authenticateToken, requireModuleAccess("roster", "full"), async (req, res) => {
  const row = await prisma.dutyRoster.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, ROSTER_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/roster/:id", authenticateToken, requireModuleAccess("roster", "full"), async (req, res) => {
  await prisma.dutyRoster.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ─────────────── CRUD: Admin Requisitions ─────────────── */

const REQ_KEYS = ["reqCode", "department", "requestedBy", "itemDescription", "quantity", "estimatedCostUgx", "priority", "status", "dateRequested", "issuedToGuardId", "issuedToGuardName", "issuedToGuardCode", "itemUnitCostUgx", "issuedDate"];

app.get("/api/requisitions", authenticateToken, async (_req, res) => {
  const rows = await prisma.adminRequisition.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/requisitions", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    department: z.string().min(1),
    requestedBy: z.string().min(1),
    itemDescription: z.string().min(1),
    quantity: z.number().int().positive(),
    estimatedCostUgx: z.number().nonnegative(),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    dateRequested: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const reqCode = `REQ-${new Date().getFullYear()}-${String((await prisma.adminRequisition.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.adminRequisition.create({
    data: {
      reqCode,
      department: parsed.data.department,
      requestedBy: parsed.data.requestedBy,
      itemDescription: parsed.data.itemDescription,
      quantity: parsed.data.quantity,
      estimatedCostUgx: parsed.data.estimatedCostUgx,
      priority: parsed.data.priority ?? "Medium",
      status: "Pending Approval",
      dateRequested: parsed.data.dateRequested ?? new Date().toISOString().split("T")[0],
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Requisition Submitted",
      module: "Administration",
      details: `${parsed.data.requestedBy} (${parsed.data.department}) requisitioned ${parsed.data.quantity} × ${parsed.data.itemDescription} (${reqCode}) for GM approval`,
    },
  });
  await notifyRole("General Manager", "info", "New Requisition", `${parsed.data.requestedBy} (${parsed.data.department}) requisitioned ${parsed.data.quantity} × ${parsed.data.itemDescription} (${reqCode}) — awaiting your approval.`, "Administration");
  const reqUser = await prisma.user.findFirst({ where: { name: parsed.data.requestedBy }, select: { id: true } });
  if (reqUser) {
    await notifyUser(reqUser.id, "info", "Requisition Received", `${reqCode} (${parsed.data.quantity} × ${parsed.data.itemDescription}) has been submitted to the General Manager for approval — you will be notified on decision.`, "Administration");
  }
  res.status(201).json(row);
});

app.put("/api/requisitions/:id", authenticateToken, requireModuleAccess("requisitions", "full"), async (req, res) => {
  const row = await prisma.adminRequisition.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, REQ_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/requisitions/:id", authenticateToken, requireModuleAccess("requisitions", "full"), async (req, res) => {
  await prisma.adminRequisition.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.put("/api/requisitions/:id/approve", authenticateToken, requireModuleAccess("requisitions"), requireRole("General Manager"), async (req, res) => {
  const existing = await prisma.adminRequisition.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Requisition not found" });
    return;
  }
  if (existing.status !== "Pending Approval") {
    res.status(400).json({ error: `Cannot approve a requisition in status '${existing.status}'` });
    return;
  }
  const actor = await contractActorName(req);
  const updated = await prisma.adminRequisition.update({
    where: { id: req.params.id },
    data: { status: "Approved", approvedBy: actor, approvedAt: new Date().toISOString().split("T")[0], rejectedBy: null, rejectionReason: null },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Requisition Approved",
      module: "Administration",
      details: `GM approved requisition ${updated.reqCode} (${updated.itemDescription}, UGX ${updated.estimatedCostUgx}) for ${updated.department}.`,
    },
  });
  const requester = await prisma.user.findFirst({ where: { name: existing.requestedBy }, select: { id: true } });
  if (requester) {
    await notifyUser(requester.id, "success", "Requisition Approved", `${updated.reqCode} (${updated.itemDescription}) approved by the General Manager.`, "Administration");
  }
  res.json(updated);
});

app.put("/api/requisitions/:id/reject", authenticateToken, requireModuleAccess("requisitions"), requireRole("General Manager"), async (req, res) => {
  const existing = await prisma.adminRequisition.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Requisition not found" });
    return;
  }
  if (existing.status !== "Pending Approval") {
    res.status(400).json({ error: `Cannot reject a requisition in status '${existing.status}'` });
    return;
  }
  const reason = typeof req.body?.reason === "string" && req.body.reason.trim() ? req.body.reason.trim() : "";
  if (!reason) {
    res.status(400).json({ error: "A rejection reason is required" });
    return;
  }
  const actor = await contractActorName(req);
  const updated = await prisma.adminRequisition.update({
    where: { id: req.params.id },
    data: { status: "Rejected", rejectedBy: actor, rejectionReason: reason, approvedBy: null, approvedAt: null },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Requisition Rejected",
      module: "Administration",
      details: `GM rejected requisition ${updated.reqCode} (${updated.itemDescription}). Reason: ${reason}`,
    },
  });
  const requester = await prisma.user.findFirst({ where: { name: existing.requestedBy }, select: { id: true } });
  if (requester) {
    await notifyUser(requester.id, "warning", "Requisition Rejected", `${updated.reqCode} (${updated.itemDescription}) was rejected by the General Manager. Reason: ${reason}`, "Administration");
  }
  res.json(updated);
});

/* ─────────────── CRUD: Training Cohorts & Recruit Trainees ─────────────── */

const COHORT_KEYS = ["name", "startDate", "endDate", "location", "leadInstructor", "totalRecruits", "passedOutCount", "status", "curriculumModules"];

app.get("/api/cohorts", authenticateToken, requireModuleAccess("training"), async (_req, res) => {
  const rows = await prisma.trainingCohort.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/cohorts", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  const code = `COH-2026-${String((await prisma.trainingCohort.count()) + 1).padStart(2, "0")}`;
  const row = await prisma.trainingCohort.create({
    data: { ...whitelistFields(req.body, COHORT_KEYS), code } as any,
  });
  res.status(201).json(row);
});

app.put("/api/cohorts/:id", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  const row = await prisma.trainingCohort.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, COHORT_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/cohorts/:id", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  await prisma.trainingCohort.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const TRAINEE_KEYS = ["fullName", "nationalIdNumber", "age", "cohortId", "cohortName", "assignedRegion", "drillScore", "marksmanshipScore", "theoryScore", "overallStatus", "assignedForceNumber", "dateGraduated"];

app.get("/api/trainees", authenticateToken, requireModuleAccess("training"), async (_req, res) => {
  const rows = await prisma.recruitTrainee.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/trainees", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  const traineeCode = `TRN-2026-${String((await prisma.recruitTrainee.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.recruitTrainee.create({
    data: { ...whitelistFields(req.body, TRAINEE_KEYS), traineeCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/trainees/:id", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  const row = await prisma.recruitTrainee.update({
    where: { id: req.params.id },
    data: whitelistFields(req.body, TRAINEE_KEYS) as any,
  });
  res.json(row);
});

app.delete("/api/trainees/:id", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  await prisma.recruitTrainee.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.put("/api/trainees/:id/graduate", authenticateToken, requireModuleAccess("training", "full"), async (req, res) => {
  const graduateDate = new Date().toISOString().split("T")[0];
  const trainee = await prisma.recruitTrainee.findUnique({ where: { id: req.params.id } });
  if (!trainee) {
    res.status(404).json({ error: "Trainee not found" });
    return;
  }
  const forceNumber: string = req.body?.forceNumber || (await nextForceNumber());
  const result = await prisma.$transaction([
    prisma.recruitTrainee.update({
      where: { id: trainee.id },
      data: { overallStatus: "Graduated & Certified", assignedForceNumber: forceNumber, dateGraduated: graduateDate },
    }),
    prisma.trainingCohort.updateMany({
      where: { id: trainee.cohortId },
      data: { passedOutCount: { increment: 1 } },
    }),
    prisma.guard.create({
      data: {
        forceNumber,
        fullName: trainee.fullName,
        nationalId: trainee.nationalIdNumber,
        designation: "Guard",
        assignedSite: "Standby Operations Reserve",
        location: trainee.assignedRegion || "Kampala Central",
        phone: "+256 700 000000",
        joinDate: graduateDate,
        status: "Off Duty",
        medicalCleared: true,
        armedQualified: true,
        certifications: ["Pass-Out Drill Certification", "Tactical & Firearms Proficiency"],
      },
    }),
  ]);
  res.json(result[0]);
});

/* ─────────────── CRUD: IT Servers / Tickets / Assets ─────────────── */

const IT_SERVER_KEYS = ["name", "ipAddress", "status", "cpuUsage", "memoryUsage", "uptime"];

app.get("/api/it-servers", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const rows = await prisma.iTServer.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/it-servers", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const row = await prisma.iTServer.create({ data: whitelistFields(req.body, IT_SERVER_KEYS) as any });
  res.status(201).json(row);
});

app.put("/api/it-servers/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const row = await prisma.iTServer.update({ where: { id: req.params.id }, data: whitelistFields(req.body, IT_SERVER_KEYS) as any });
  res.json(row);
});

app.delete("/api/it-servers/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  await prisma.iTServer.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const IT_TICKET_KEYS = ["reportedBy", "subject", "priority", "status", "createdDate"];

app.get("/api/it-tickets", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const rows = await prisma.iTSupportTicket.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/it-tickets", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const ticketCode = `IT-2026-${String((await prisma.iTSupportTicket.count()) + 1).padStart(3, "0")}`;
  const row = await prisma.iTSupportTicket.create({
    data: { ...whitelistFields(req.body, IT_TICKET_KEYS), ticketCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/it-tickets/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const row = await prisma.iTSupportTicket.update({ where: { id: req.params.id }, data: whitelistFields(req.body, IT_TICKET_KEYS) as any });
  res.json(row);
});

app.delete("/api/it-tickets/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  await prisma.iTSupportTicket.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const IT_ASSET_KEYS = ["name", "category", "serialNumberOrKey", "assignedToPersonOrStation", "assignedDepartment", "purchaseDate", "warrantyExpiryDate", "valueUgx", "condition", "softwareVersionOrSpecs", "ipAddressOrHost", "notes"];

app.get("/api/it-assets", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const rows = await prisma.iTAsset.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/it-assets", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const isSoftware = req.body?.category === "Software License & SaaS";
  const prefix = isSoftware ? "IT-SW-2026-" : "IT-HW-2026-";
  const assetCode = `${prefix}${String((await prisma.iTAsset.count()) + 1).padStart(2, "0")}`;
  const row = await prisma.iTAsset.create({
    data: { ...whitelistFields(req.body, IT_ASSET_KEYS), assetCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/it-assets/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const row = await prisma.iTAsset.update({ where: { id: req.params.id }, data: whitelistFields(req.body, IT_ASSET_KEYS) as any });
  res.json(row);
});

app.delete("/api/it-assets/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  await prisma.iTAsset.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ─────────────── IT Officer: Device / IP Sessions & Access Intelligence ─────────────── */

app.get("/api/it/sessions", authenticateToken, requireModuleAccess("it"), async (req, res) => {
  const { userId, ipAddress, device, isActive, search, page = "1", limit = "50" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (ipAddress) where.ipAddress = { contains: String(ipAddress), mode: "insensitive" as const };
  if (device) where.device = String(device);
  if (isActive !== undefined && isActive !== "") where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { email: { contains: String(search), mode: "insensitive" as const } },
      { ipAddress: { contains: String(search), mode: "insensitive" as const } },
      { userAgent: { contains: String(search), mode: "insensitive" as const } },
      { browser: { contains: String(search), mode: "insensitive" as const } },
      { os: { contains: String(search), mode: "insensitive" as const } },
    ];
  }
  const take = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const [rows, total] = await Promise.all([
    prisma.userSession.findMany({ where, orderBy: { lastActiveAt: "desc" }, take, skip, include: { user: { select: { name: true, region: true, department: true, status: true } } } }),
    prisma.userSession.count({ where }),
  ]);
  // Enrich with suspicious flag: same user previously seen different IP/device
  res.json({ data: rows, total, page: Number(page) || 1, pages: Math.ceil(total / take) });
});

app.get("/api/it/sessions/stats", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const [total, active, byDevice, byBrowser, byOs, uniqueIps, recentLogins, failedLast24h] = await Promise.all([
    prisma.userSession.count(),
    prisma.userSession.count({ where: { isActive: true } }),
    prisma.userSession.groupBy({ by: ["device"], _count: { device: true } }),
    prisma.userSession.groupBy({ by: ["browser"], _count: { browser: true } }),
    prisma.userSession.groupBy({ by: ["os"], _count: { os: true } }),
    prisma.userSession.findMany({ distinct: ["ipAddress"], select: { ipAddress: true } }).then((r) => r.length),
    prisma.userSession.count({ where: { loginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  const activeByRole = await prisma.userSession.groupBy({ by: ["role"], _count: { role: true }, where: { isActive: true } });
  res.json({
    totalSessions: total,
    activeSessions: active,
    uniqueIps,
    loginsLast24h: recentLogins,
    failedLoginsLast24h: failedLast24h,
    byDevice: byDevice.map((r) => ({ device: r.device || "Unknown", count: r._count.device })),
    byBrowser: byBrowser.map((r) => ({ browser: r.browser || "Unknown", count: r._count.browser })),
    byOs: byOs.map((r) => ({ os: r.os || "Unknown", count: r._count.os })),
    activeByRole: activeByRole.map((r) => ({ role: r.role, count: r._count.role })),
  });
});

app.get("/api/it/sessions/:id", authenticateToken, requireModuleAccess("it"), async (req, res) => {
  const row = await prisma.userSession.findUnique({ where: { id: req.params.id }, include: { user: { select: { name: true, email: true, role: true, region: true, department: true, status: true } } } });
  if (!row) { res.status(404).json({ error: "Session not found" }); return; }
  // Also fetch user's other recent IPs to flag suspicious new device/IP
  const recentPeers = await prisma.userSession.findMany({
    where: { userId: row.userId, id: { not: row.id } },
    orderBy: { loginAt: "desc" },
    take: 10,
    select: { ipAddress: true, device: true, browser: true, os: true, loginAt: true },
  });
  const isNewIp = !recentPeers.some((p) => p.ipAddress === row.ipAddress);
  const isNewDevice = !recentPeers.some((p) => p.device === row.device && p.browser === row.browser && p.os === row.os);
  res.json({ ...row, isNewIp, isNewDevice, recentPeers });
});

app.post("/api/it/sessions/:id/terminate", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const row = await prisma.userSession.findUnique({ where: { id: req.params.id } });
  if (!row) { res.status(404).json({ error: "Session not found" }); return; }
  if (!row.isActive) { res.status(400).json({ error: "Session already terminated" }); return; }
  const updated = await prisma.userSession.update({ where: { id: row.id }, data: { isActive: false, logoutAt: new Date() } });
  const actor = (req as any).user as JwtPayload;
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: actor.userId,
      userRole: actorRoleLabel(actor),
      action: "Session Terminated",
      module: "IT Admin",
      details: `IT Officer ${actor.role} terminated session ${row.id} for ${row.email} (${row.ipAddress} / ${row.device})`,
      ipAddress: getClientIp(req),
      userAgent: (req.headers["user-agent"] as string) || "",
    },
  });
  res.json(updated);
});

app.get("/api/it/login-attempts", authenticateToken, requireModuleAccess("it"), async (req, res) => {
  const { email, ipAddress, success, page = "1", limit = "50" } = req.query as Record<string, string>;
  const where: Record<string, unknown> = {};
  if (email) where.email = { contains: String(email), mode: "insensitive" as const };
  if (ipAddress) where.ipAddress = { contains: String(ipAddress), mode: "insensitive" as const };
  if (success !== undefined && success !== "") where.success = success === "true";
  const take = Math.min(Number(limit) || 50, 200);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const [rows, total] = await Promise.all([
    prisma.loginAttempt.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    prisma.loginAttempt.count({ where }),
  ]);
  res.json({ data: rows, total, page: Number(page) || 1, pages: Math.ceil(total / take) });
});

app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  const tokenId = (req as any).tokenId as string | undefined;
  const user = (req as any).user as JwtPayload;
  if (tokenId) {
    await prisma.userSession.updateMany({ where: { userId: user.userId, tokenId, isActive: true }, data: { isActive: false, logoutAt: new Date() } });
  } else if (user) {
    await prisma.userSession.updateMany({ where: { userId: user.userId, isActive: true }, data: { isActive: false, logoutAt: new Date() } });
  }
  const ipAddress = getClientIp(req);
  const userAgent = (req.headers["user-agent"] as string) || "";
  if (user) {
    await prisma.auditLog.create({
      data: { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: "Logout", module: "Auth", details: `Logout from ${ipAddress}`, ipAddress, userAgent },
    });
  }
  res.json({ ok: true });
});

app.get("/api/it/my-sessions", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const rows = await prisma.userSession.findMany({ where: { userId: user.userId }, orderBy: { lastActiveAt: "desc" }, take: 20 });
  res.json(rows);
});

app.get("/api/it/system-health", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const mem = process.memoryUsage();
  const uptimeSec = process.uptime();
  const cpus = (await import("os")).cpus();
  const totalMem = (await import("os")).totalmem();
  const freeMem = (await import("os")).freemem();
  const [dbUsers, dbSessionsActive, dbAttemptsFailed24h, dbServers] = await Promise.all([
    prisma.user.count(),
    prisma.userSession.count({ where: { isActive: true } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.iTServer.count(),
  ]);
  res.json({
    uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`,
    uptimeSec: Math.floor(uptimeSec),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuModel: cpus[0]?.model || "unknown",
    cpuCount: cpus.length,
    memory: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, external: mem.external, systemTotal: totalMem, systemFree: freeMem },
    db: { users: dbUsers, activeSessions: dbSessionsActive, failedLogins24h: dbAttemptsFailed24h, servers: dbServers },
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────── CRUD: K9 (Write Ops) ─────────────── */

const K9_KEYS = ["name", "breed", "chipNumber", "ageYears", "status", "assignedHandlerId", "assignedHandlerName", "kennelNumber", "rabiesVaccineDate", "lastVetCheck", "specialization", "currentWeightKg", "healthCondition", "vaccinationStatus"];

app.post("/api/k9s", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const k9User = (req as any).user as JwtPayload | undefined;
  if (k9User?.role !== "K9 Supervisor") {
    res.status(403).json({ error: "Only the K9 Supervisor can manage K9 dog records" });
    return;
  }
  const code = `K9-2026-${String((await prisma.k9Dog.count()) + 1).padStart(2, "0")}`;
  const row = await prisma.k9Dog.create({ data: { ...whitelistFields(req.body, K9_KEYS), code } as any });
  res.status(201).json(row);
});

app.put("/api/k9s/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const k9User = (req as any).user as JwtPayload | undefined;
  if (k9User?.role !== "K9 Supervisor") {
    res.status(403).json({ error: "Only the K9 Supervisor can manage K9 dog records" });
    return;
  }
  const row = await prisma.k9Dog.update({ where: { id: req.params.id }, data: whitelistFields(req.body, K9_KEYS) as any });
  res.json(row);
});

app.delete("/api/k9s/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const k9User = (req as any).user as JwtPayload | undefined;
  if (k9User?.role !== "K9 Supervisor") {
    res.status(403).json({ error: "Only the K9 Supervisor can manage K9 dog records" });
    return;
  }
  await prisma.k9Dog.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const K9_LOG_KEYS = ["k9Id", "k9Name", "handlerName", "siteName", "deploymentDate", "shiftType", "trainingScore", "vetNotes"];

app.post("/api/k9-logs", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const row = await prisma.k9Log.create({ data: whitelistFields(req.body, K9_LOG_KEYS) as any });
  res.status(201).json(row);
});

const K9_HEALTH_KEYS = ["k9Id", "k9Name", "handlerName", "inspectionDate", "weightKg", "vaccinationStatus", "physicalCondition", "coatAndSkinCheck", "appetiteAndHydration", "temperatureCelsius", "inspectingOfficer", "notes"];

app.get("/api/k9-health", authenticateToken, requireModuleAccess("k9s"), async (_req, res) => {
  const rows = await prisma.k9HealthInspection.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/k9-health", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const inspectionCode = `K9-MED-2026-${String((await prisma.k9HealthInspection.count()) + 1).padStart(2, "0")}`;
  const row = await prisma.k9HealthInspection.create({
    data: { ...whitelistFields(req.body, K9_HEALTH_KEYS), inspectionCode } as any,
  });
  res.status(201).json(row);
});

app.put("/api/k9-health/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const row = await prisma.k9HealthInspection.update({ where: { id: req.params.id }, data: whitelistFields(req.body, K9_HEALTH_KEYS) as any });
  res.json(row);
});

app.delete("/api/k9-health/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  await prisma.k9HealthInspection.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

/* ─────────────── CRUD: Armoury (Write Ops + Issue/Return) ─────────────── */

const ARMOURY_KEYS = ["assetTag", "serialNumber", "category", "name", "caliberOrSpecs", "totalQuantity", "availableQuantity", "condition", "assignedToGuardId", "assignedToGuardName", "location"];

app.post("/api/armoury", authenticateToken, requireModuleAccess("armoury", "full"), async (req, res) => {
  const row = await prisma.armouryItem.create({ data: whitelistFields(req.body, ARMOURY_KEYS) as any });
  res.status(201).json(row);
});

app.put("/api/armoury/:id", authenticateToken, requireModuleAccess("armoury", "full"), async (req, res) => {
  const row = await prisma.armouryItem.update({ where: { id: req.params.id }, data: whitelistFields(req.body, ARMOURY_KEYS) as any });
  res.json(row);
});

app.delete("/api/armoury/:id", authenticateToken, requireModuleAccess("armoury", "full"), async (req, res) => {
  await prisma.armouryItem.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

app.post("/api/armoury-logs", authenticateToken, requireModuleAccess("armoury", "full"), async (req, res) => {
  const { assetId, guardId, locationName, ammoRoundsOut, dateOut, timeOut, signOutConfirmed, armourerInCharge, notes } = req.body || {};
  const item = await prisma.armouryItem.findUnique({ where: { id: assetId } });
  const guard = await prisma.guard.findUnique({ where: { id: guardId } });
  if (!item || !guard) {
    res.status(400).json({ error: "Armoury item or guard not found" });
    return;
  }
  const serialNumberLog = `SL-2026-${String((await prisma.armouryLog.count()) + 1).padStart(3, "0")}`;
  const [log] = await prisma.$transaction([
    prisma.armouryLog.create({
      data: {
        serialNumberLog,
        guardId: guard.id,
        guardName: guard.fullName,
        locationName: locationName || guard.assignedSite || "Assigned Duty Post",
        firearmSerialNumber: item.serialNumber,
        assetName: item.name,
        assetTag: item.assetTag,
        ammoRoundsOut: Number(ammoRoundsOut) || 0,
        dateOut: dateOut || new Date().toISOString().split("T")[0],
        timeOut: timeOut || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        signOutConfirmed: Boolean(signOutConfirmed),
        armourerInCharge: armourerInCharge || "Armourer Officer",
        status: "Checked Out",
        notes: notes || null,
      },
    }),
    prisma.armouryItem.update({
      where: { id: item.id },
      data: {
        availableQuantity: Math.max(0, item.availableQuantity - 1),
        location: "Issued Out",
        assignedToGuardId: guard.id,
        assignedToGuardName: guard.fullName,
      },
    }),
  ]);
  res.status(201).json(log);
});

app.put("/api/armoury-logs/:id/return", authenticateToken, requireModuleAccess("armoury", "full"), async (req, res) => {
  const { ammoRoundsIn, dateIn, timeIn, signInConfirmed, substituteReceiver, notes } = req.body || {};
  const log = await prisma.armouryLog.findUnique({ where: { id: req.params.id } });
  if (!log) {
    res.status(404).json({ error: "Armoury log not found" });
    return;
  }
  const [updated] = await prisma.$transaction([
    prisma.armouryLog.update({
      where: { id: log.id },
      data: {
        ammoRoundsIn: ammoRoundsIn !== undefined ? Number(ammoRoundsIn) : null,
        dateIn: dateIn || new Date().toISOString().split("T")[0],
        timeIn: timeIn || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        signInConfirmed: Boolean(signInConfirmed),
        substituteReceiver: substituteReceiver || null,
        status: "Returned",
        notes: notes ? (log.notes ? `${log.notes} | Return Note: ${notes}` : `Return Note: ${notes}`) : log.notes,
      },
    }),
    prisma.armouryItem.updateMany({
      where: { serialNumber: log.firearmSerialNumber },
      data: {
        availableQuantity: { increment: 1 },
        location: "Main Vault",
        assignedToGuardId: null,
        assignedToGuardName: null,
      },
    }),
  ]);
  res.json(updated);
});

/* ─────────────── CRUD: Audit Logs ─────────────── */

app.get("/api/audit-logs", authenticateToken, requireAnyRole("IT Officer", "Internal Auditor", "General Manager", "Director"), async (req, res) => {
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take, skip }),
      prisma.auditLog.count(),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  res.json(logs);
});

/* ─────────────── CRUD: Regions ─────────────── */

app.get("/api/regions", authenticateToken, requireAnyModuleAccess("it", "hr", "operations", "marketing", "sites", "fleet", "finance", "recruitment", "administration", "directorate", "documents"), async (_req, res) => {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  res.json(regions);
});

app.get("/api/regional-offices", authenticateToken, requireAnyModuleAccess("it", "operations", "directorate"), async (_req, res) => {
  const offices = await prisma.regionalOffice.findMany({
    include: { region: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  res.json(
    offices.map((o) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      regionName: o.region?.name ?? "",
      locationCity: o.locationCity,
      regionalManagerName: o.regionalManagerName,
      phone: o.phone,
      email: o.email,
      activeGuardsCount: o.activeGuardsCount,
      clientSitesCount: o.clientSitesCount,
      armouryVaultStatus: o.armouryVaultStatus,
      vehiclesAssigned: o.vehiclesAssigned,
    }))
  );
});

app.post("/api/regions", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const parsed = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const region = await prisma.region.create({ data: parsed.data });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Region Created",
      module: "IT Admin",
      details: `Created new region ${region.name} (${region.code})`,
    },
  });
  res.status(201).json(region);
});

app.put("/api/regions/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const region = await prisma.region.update({ where: { id }, data: parsed.data });
  res.json(region);
});

app.delete("/api/regions/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  await prisma.region.delete({ where: { id } });
  res.json({ success: true });
});

/* ─────────────── Leave Workflow Helpers ─────────────── */

async function notifyRole(targetRole: string, type: string, title: string, message: string, module?: string) {
  await prisma.notification.create({
    data: { type, title, message, module, targetRole, userId: null },
  });
}

async function notifyUser(targetUserId: string, type: string, title: string, message: string, module?: string) {
  await prisma.notification.create({
    data: { type, title, message, module, targetRole: null, userId: targetUserId },
  });
}

async function createLeaveApproval(leaveId: string, requesterId: string, requesterName: string, guardId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { code: "LEAVE-REQ" }, include: { steps: { orderBy: { stepOrder: "asc" } } } });
  if (!workflow) return null;
  const isGuardLeave = !!(await prisma.guard.findUnique({ where: { id: guardId } }));
  const approval = await prisma.approval.create({
    data: {
      workflowId: workflow.id,
      workflowCode: workflow.code,
      referenceType: "LeaveRequest",
      referenceId: leaveId,
      totalSteps: workflow.steps.length,
      currentStep: 1,
      requestedBy: requesterId,
      requestedByName: requesterName,
      regionScope: null,
      meta: isGuardLeave ? JSON.stringify({ excludeOptional: true }) : JSON.stringify({ excludeOptional: false }),
    },
  });
  return approval;
}

async function computeLeaveBalance(guardId: string, currentDuration: number) {
  // §5 leave-balance fix: entitlement/taken/balance derive from the guard's
  // leave history instead of rendering as blank dashes. Annual entitlement is
  // 21 days; taken = previously approved annual leave + the current request.
  const year = new Date().getFullYear();
  const history = await prisma.leaveRequest.findMany({
    where: { guardId, status: "Approved" },
  });
  const entitlement = ANNUAL_LEAVE_ENTITLEMENT_DAYS;
  const priorTaken = history
    .filter((l) => {
      const d = l.startDate ? new Date(l.startDate) : null;
      return !d || Number.isNaN(d.getTime()) || d.getFullYear() === year;
    })
    .reduce((sum, l) => sum + (l.durationDays || 0), 0);
  const taken = priorTaken + currentDuration;
  return { entitlement, taken, balance: entitlement - taken };
}

/* Annual leave entitlement per staff member / guard (company policy). */
const ANNUAL_LEAVE_ENTITLEMENT_DAYS = 21;

/* Days of approved annual leave already spent by a user in the current leave
 * year, plus what is still committed to pending requests. */
async function computeUserLeaveSummary(userId: string) {
  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const mine = await prisma.leaveRequest.findMany({
    where: {
      category: "staff",
      requesterUserId: userId,
      leaveType: "Annual Leave",
      OR: [
        { status: "Approved" },
        { status: "Pending HR Approval" },
        { status: "Pending GM Approval" },
      ],
    },
  });
  const inYear = (l: { startDate: string }) => {
    const d = l.startDate ? new Date(l.startDate) : null;
    return d && !Number.isNaN(d.getTime()) ? d >= yearStart && d < yearEnd : true;
  };
  const taken = mine.filter((l) => l.status === "Approved" && inYear(l)).reduce((s, l) => s + (l.durationDays || 0), 0);
  const pending = mine.filter((l) => l.status !== "Approved").reduce((s, l) => s + (l.durationDays || 0), 0);
  return {
    year,
    entitlement: ANNUAL_LEAVE_ENTITLEMENT_DAYS,
    taken,
    pending,
    remaining: Math.max(ANNUAL_LEAVE_ENTITLEMENT_DAYS - taken - pending, 0),
  };
}

async function actOnLeaveApproval(leaveId: string, action: "Approved" | "Rejected", user: JwtPayload, comment?: string) {
  const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
  if (!leave || !leave.approvalId) {
    throw new Error("Leave request not found or not linked to an approval");
  }
  const approval = await prisma.approval.findUnique({ where: { id: leave.approvalId }, include: { actions: true } });
  if (!approval) {
    throw new Error("Approval not found");
  }
  const workflow = await prisma.workflow.findUnique({ where: { id: approval.workflowId }, include: { steps: { orderBy: { stepOrder: "asc" } } } });
  if (!workflow) {
    throw new Error("Workflow not found");
  }
  const currentStepDef = workflow.steps.find((s) => s.stepOrder === approval.currentStep);
  if (!currentStepDef || !approverRolesOf(currentStepDef).some((r) => hasEffectiveRole(user, r))) {
    throw new Error(`Access denied: ${actorRoleLabel(user)} cannot act on this approval; requires ${currentStepDef ? approverRolesOf(currentStepDef).join(" or ") : "an authorized role"}`);
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  const actorName = dbUser?.name ? (user.actingRole && user.actingRole !== user.role ? `${dbUser.name} (Acting ${user.actingRole})` : dbUser.name) : user.role;
  await prisma.approvalAction.create({
    data: {
      approvalId: approval.id,
      stepOrder: approval.currentStep,
      actorRole: actorRoleLabel(user),
      actorName,
      action,
      comment,
      actedAt: new Date(),
    },
  });

  if (action === "Rejected") {
    await prisma.approval.update({ where: { id: approval.id }, data: { status: "Rejected", decidedBy: actorName, decidedAt: new Date() } });
    await prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: "Rejected" } });
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user.userId,
        userRole: actorRoleLabel(user),
        action: "Leave Rejected",
        module: "HR",
        details: `${leave.guardName} leave request ${leaveId} rejected by ${actorName}`,
      },
    });
    await notifyUser((leave as any).requestedBy ?? leave.guardId, "error", "Leave Rejected", `${leave.guardName} leave (${leave.leaveType}) was rejected by ${actorName}${comment ? ` — ${comment}` : ""}.`, "HR");
    return { status: "Rejected" };
  }

  const meta = approval.meta ? safeJson(approval.meta) : null;
  let nextStep = approval.currentStep + 1;
  while (nextStep <= approval.totalSteps) {
    const stepDef = workflow.steps.find((s) => s.stepOrder === nextStep);
    const skipped = stepDef?.optional && (meta?.excludeOptional === true || (Array.isArray(meta?.skipOptionalStepOrders) && (meta as any).skipOptionalStepOrders.includes(nextStep)));
    if (!skipped) break;
    await prisma.approvalAction.create({
      data: {
        approvalId: approval.id,
        stepOrder: nextStep,
        actorRole: "System",
        actorName: "System",
        action: "Skipped (optional)",
        actedAt: new Date(),
      },
    });
    nextStep += 1;
  }

  if (nextStep > approval.totalSteps) {
    await prisma.approval.update({ where: { id: approval.id }, data: { status: "Approved", decidedBy: actorName, decidedAt: new Date() } });
    await prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: "Approved", approvedBy: actorName, gmApprovedBy: actorName } });
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user.userId,
        userRole: actorRoleLabel(user),
        action: "Leave Approved",
        module: "HR",
        details: `${leave.guardName} leave request ${leaveId} fully approved by ${actorName}`,
      },
    });
    await notifyUser((leave as any).requestedBy ?? leave.guardId, "success", "Leave Approved", `${leave.guardName} leave (${leave.leaveType}) has been fully approved.`, "HR");
    return { status: "Approved" };
  }

  await prisma.approval.update({ where: { id: approval.id }, data: { currentStep: nextStep } });
  const nextStepDef = workflow.steps.find((s) => s.stepOrder === nextStep);
  let nextStatus = "Pending HR Approval";
  if (nextStepDef?.name?.includes("GM")) {
    nextStatus = "Pending GM Approval";
  }
  await prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: nextStatus, approvedBy: actorName } });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Leave Advanced",
      module: "HR",
      details: `${leave.guardName} leave request ${leaveId} advanced to step ${nextStep} by ${actorName}`,
    },
  });
  if (nextStatus === "Pending GM Approval") {
    await notifyRole("General Manager", "info", "Leave Awaiting GM Approval", `${leave.guardName} leave (${leave.leaveType}) approved by HR Manager — awaiting your final approval.`, "HR");
  } else {
    await notifyUser((leave as any).requestedBy ?? leave.guardId, "info", "Leave Progressing", `${leave.guardName} leave (${leave.leaveType}) approved by ${actorName}; continuing through the approval flow.`, "HR");
  }
  return { status: `Advanced to step ${nextStep}` };
}

/* ─────────────── CRUD: Leave Requests ─────────────── */

app.get("/api/leave-requests", authenticateToken, requireModuleAccess("leave"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const requests = await prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } });
  let visible = requests;
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const guards = await prisma.guard.findMany({ where: { region }, select: { id: true } });
      const guardIds = new Set(guards.map((g) => g.id));
      visible = requests.filter((r) => guardIds.has(r.guardId));
    }
  } else if (hasEffectiveRole(user, "Guard Officer")) {
    const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
    const myGuard = await prisma.guard.findFirst({
      where: { OR: [{ linkedUserId: user.userId }, { fullName: me?.name ?? "__none__" }] },
      select: { id: true },
    });
    visible = myGuard ? requests.filter((r) => r.guardId === myGuard.id) : [];
  }
  if (hasListPagination(req)) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limitRaw = Number(req.query.limit);
    const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    res.json(paginatedEnvelope(visible.slice((page - 1) * limit, page * limit), visible.length, page, limit));
    return;
  }
  res.json(visible);
});

app.post("/api/leave-requests", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  /* Staff self-service: any authenticated employee may request leave for
   * themselves (no guardId in the body). The request follows the same
   * HR Manager → optional GM approval workflow as guard leave. */
  const isSelfService = !req.body?.guardId || req.body?.selfService === true;
  if (isSelfService) {
    const parsed = z.object({
      leaveType: z.string().min(1),
      startDate: z.string().min(1),
      endDate: z.string().min(1),
      durationDays: z.number().int().positive(),
      reason: z.string().min(1),
      contactAddress: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
      return;
    }
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      res.status(404).json({ error: "User record not found" });
      return;
    }
    const summary = await computeUserLeaveSummary(user.userId);
    if (parsed.data.leaveType === "Annual Leave" && parsed.data.durationDays > summary.remaining) {
      res.status(400).json({
        error: `Insufficient annual leave balance: you have ${summary.remaining} of ${summary.entitlement} day(s) left for ${summary.year} (${summary.taken} spent, ${summary.pending} pending). Requested ${parsed.data.durationDays} day(s).`,
      });
      return;
    }
    const start = new Date(parsed.data.startDate);
    const end = new Date(parsed.data.endDate);
    const resumptionDate = !Number.isNaN(end.getTime())
      ? new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : undefined;
    const leave = await prisma.leaveRequest.create({
      data: {
        category: "staff",
        requesterUserId: dbUser.id,
        requesterRole: actorRoleLabel(user),
        guardId: dbUser.id,
        guardName: dbUser.name,
        forceNumber: dbUser.forceNumber || `STAFF-${dbUser.id.slice(-6).toUpperCase()}`,
        leaveType: parsed.data.leaveType,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        durationDays: parsed.data.durationDays,
        reason: parsed.data.reason,
        contactAddress: parsed.data.contactAddress,
        appliedDate: new Date().toISOString().split("T")[0],
        status: "Pending HR Approval",
        entitlement: ANNUAL_LEAVE_ENTITLEMENT_DAYS,
        taken: summary.taken + (parsed.data.leaveType === "Annual Leave" ? parsed.data.durationDays : 0),
        balance: summary.remaining - (parsed.data.leaveType === "Annual Leave" ? parsed.data.durationDays : 0),
        resumptionDate,
      },
    });
    const approval = await createLeaveApproval(leave.id, user.userId, dbUser.name, "");
    if (approval) {
      await prisma.leaveRequest.update({ where: { id: leave.id }, data: { approvalId: approval.id } });
    }
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        userName: user.userId,
        userRole: actorRoleLabel(user),
        action: "Leave Requested",
        module: "HR",
        details: `${dbUser.name} requested ${parsed.data.leaveType} from ${parsed.data.startDate} to ${parsed.data.endDate}`,
      },
    });
    await notifyRole("HR Manager", "info", "New Leave Request", `${dbUser.name} (${actorRoleLabel(user)}) requested ${parsed.data.leaveType} for ${parsed.data.durationDays} day(s) from ${parsed.data.startDate}.`, "HR");
    const result = await prisma.leaveRequest.findUnique({ where: { id: leave.id } });
    res.status(201).json(result);
    return;
  }
  const allowedRequesters = ["Guard Officer", "Regional Manager", "Operations Manager", "HR Manager", "HR Assistant"];
  if (!allowedRequesters.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot submit leave requests` });
    return;
  }
  const parsed = z.object({
    guardId: z.string().min(1),
    guardName: z.string().min(1),
    forceNumber: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    durationDays: z.number().int().positive(),
    reason: z.string().min(1),
    reliefGuardName: z.string().optional(),
    reliefForceNumber: z.string().optional(),
    contactAddress: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (hasEffectiveRole(user, "Regional Manager")) {
    const guard = await prisma.guard.findUnique({ where: { id: parsed.data.guardId } });
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (guard && dbUser?.region && guard.region && guard.region !== dbUser.region) {
      res.status(403).json({ error: "Access denied: you may only request leave for guards in your own region" });
      return;
    }
  }
  const leave = await prisma.leaveRequest.create({
    data: {
      ...parsed.data,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending HR Approval",
    },
  });
  const approval = await createLeaveApproval(leave.id, user.userId, parsed.data.guardName, parsed.data.guardId);
  if (approval) {
    await prisma.leaveRequest.update({ where: { id: leave.id }, data: { approvalId: approval.id } });
  }
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Leave Requested",
      module: "HR",
      details: `${parsed.data.guardName} requested ${parsed.data.leaveType} from ${parsed.data.startDate} to ${parsed.data.endDate}`,
    },
  });
  await notifyRole("HR Manager", "info", "New Leave Request", `${parsed.data.guardName} (${parsed.data.forceNumber}) requested ${parsed.data.leaveType} for ${parsed.data.durationDays} day(s) from ${parsed.data.startDate}.`, "HR");
  const result = await prisma.leaveRequest.findUnique({ where: { id: leave.id } });
  res.status(201).json(result);
});

/* ── My Leave: self-service summary for the signed-in user (any role) ── */
app.get("/api/my/leave", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) {
    res.status(404).json({ error: "User record not found" });
    return;
  }
  // Own staff requests + any guard-leave requests linked to this user's guard record.
  const myGuard = await prisma.guard.findFirst({
    where: { OR: [{ linkedUserId: dbUser.id }, { fullName: dbUser.name }] },
    select: { id: true },
  });
  const where = myGuard
    ? { OR: [{ requesterUserId: dbUser.id }, { guardId: myGuard.id }] }
    : { requesterUserId: dbUser.id };
  const [requests, summary] = await Promise.all([
    prisma.leaveRequest.findMany({ where, orderBy: { createdAt: "desc" } }),
    computeUserLeaveSummary(dbUser.id),
  ]);
  if (hasListPagination(req)) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limitRaw = Number(req.query.limit);
    const limit = Math.min(Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    res.json({ ...paginatedEnvelope(requests.slice((page - 1) * limit, page * limit), requests.length, page, limit), summary });
    return;
  }
  res.json({ requests, summary });
});

/* Owner withdrawal: a requester may cancel their own still-pending request. */
app.delete("/api/leave-requests/:id", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id } });
  if (!leave) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  const isOwner = leave.requesterUserId === user.userId;
  const canManage = hasEffectiveRole(user, "HR Manager") || isRegionalManager(user);
  if (!isOwner && !canManage) {
    res.status(403).json({ error: "You may only withdraw your own leave requests" });
    return;
  }
  if (!["Pending HR Approval", "Pending GM Approval"].includes(leave.status)) {
    res.status(400).json({ error: `Only pending requests can be withdrawn (current status: ${leave.status})` });
    return;
  }
  await prisma.leaveRequest.delete({ where: { id: leave.id } });
  if (leave.approvalId) {
    await prisma.approval.update({ where: { id: leave.approvalId }, data: { status: "Cancelled" } }).catch(() => {});
  }
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Leave Request Withdrawn",
      module: "HR",
      details: `${leave.guardName} withdrew their ${leave.leaveType} request (${leave.startDate} → ${leave.endDate})`,
    },
  });
  res.json({ ok: true });
});

app.put("/api/leave-requests/:id/approve", authenticateToken, async (req, res) => {
  res.status(410).json({ error: "Regional Manager leave approval step removed. Submit → HR Manager → optional GM." });
});

app.put("/api/leave-requests/:id/ops-approve", authenticateToken, async (req, res) => {
  res.status(410).json({ error: "Operations Manager leave approval step removed. Submit → HR Manager → optional GM." });
});

app.put("/api/leave-requests/:id/hr-approve", authenticateToken, requireModuleAccess("hr", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!hasEffectiveRole(user, "HR Manager")) {
    res.status(403).json({ error: "Only the HR Manager can approve leave at this step (HR Assistant is not an approver)" });
    return;
  }
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  const parsed = z.object({
    entitlement: z.number().int().optional(),
    taken: z.number().int().optional(),
    balance: z.number().int().optional(),
    resumptionDate: z.string().optional(),
  }).safeParse(req.body);
  try {
    const result = await actOnLeaveApproval(id, "Approved", user, parsed.success && parsed.data.resumptionDate ? `Resumption: ${parsed.data.resumptionDate}` : undefined);
    if (result.status === "Approved" || result.status === "Advanced to step 2") {
      const leave = await prisma.leaveRequest.findUnique({ where: { id } });
      const updateData: Record<string, unknown> = { status: leave?.status };
      if (parsed.success) {
        updateData.entitlement = parsed.data.entitlement;
        updateData.taken = parsed.data.taken;
        updateData.balance = parsed.data.balance;
        updateData.resumptionDate = parsed.data.resumptionDate;
        if (parsed.data.resumptionDate) {
          updateData.notes = existing.notes ? `${existing.notes} Resumption: ${parsed.data.resumptionDate}` : `Resumption: ${parsed.data.resumptionDate}`;
        }
      }
      if (updateData.entitlement === undefined || updateData.taken === undefined || updateData.balance === undefined) {
        const computed = await computeLeaveBalance(existing.guardId, existing.durationDays);
        updateData.entitlement = computed.entitlement;
        updateData.taken = computed.taken;
        updateData.balance = computed.balance;
      }
      await prisma.leaveRequest.update({ where: { id }, data: updateData });
      res.json(await prisma.leaveRequest.findUnique({ where: { id } }));
    } else {
      res.json(await prisma.leaveRequest.findUnique({ where: { id } }));
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/leave-requests/:id/gm-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can give the final leave approval" });
    return;
  }
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  try {
    const result = await actOnLeaveApproval(id, "Approved", user);
    res.json(await prisma.leaveRequest.findUnique({ where: { id } }));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/leave-requests/:id/reject", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = z.object({ notes: z.string().optional() }).safeParse(req.body);
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  // §5: HR Manager's denial authority only applies to genuinely subordinate
  // staff. Leave from the General Manager or a peer department manager is a
  // formality — the approval step is recorded but cannot be denied.
  const requesterRole = existing.approvalId
    ? (await prisma.approval.findUnique({ where: { id: existing.approvalId }, select: { requestedBy: true } }))?.requestedBy
    : undefined;
  const requesterRoleResolved = requesterRole
    ? (await prisma.user.findUnique({ where: { id: requesterRole }, select: { role: true } }))?.role
    : undefined;
  if (requesterRoleResolved && LEAVE_NON_DENIABLE_REQUESTERS.includes(requesterRoleResolved as any)) {
    res.status(403).json({ error: "Leave requests from the General Manager or peer department managers cannot be denied by HR — the approval step is a formality; escalate to the General Manager." });
    return;
  }
  try {
    await actOnLeaveApproval(id, "Rejected", user, parsed.success ? parsed.data.notes : undefined);
    res.json(await prisma.leaveRequest.findUnique({ where: { id } }));
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

/* ─────────────── CRUD: Workflow ─────────────── */

app.get("/api/workflows", authenticateToken, requireModuleAccess("workflow"), async (_req, res) => {
  const workflows = await prisma.workflow.findMany({ include: { steps: { orderBy: { stepOrder: "asc" } } }, orderBy: { createdAt: "desc" } });
  res.json(workflows);
});

app.post("/api/workflows", authenticateToken, requireModuleAccess("workflow", "full"), async (req, res) => {
  const parsed = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    description: z.string().optional(),
    module: z.string().min(1),
    steps: z.array(z.object({
      stepOrder: z.number().int().positive(),
      name: z.string().min(1),
      approverRole: z.string().min(1),
      approverRoles: z.array(z.string()).optional(),
      optional: z.boolean().optional(),
      regionScoped: z.boolean().optional(),
      condition: z.string().optional(),
      escalationHours: z.number().int().optional(),
    })).min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { steps, ...workflowData } = parsed.data;
  const workflow = await prisma.workflow.create({
    data: {
      ...workflowData,
      steps: {
        create: steps.map((s) => ({
          stepOrder: s.stepOrder,
          name: s.name,
          approverRole: s.approverRole,
          approverRoles: s.approverRoles ? JSON.stringify(s.approverRoles) : null,
          optional: s.optional ?? false,
          regionScoped: s.regionScoped ?? false,
          condition: s.condition,
          escalationHours: s.escalationHours,
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  res.status(201).json(workflow);
});

app.put("/api/workflows/:id", authenticateToken, requireModuleAccess("workflow", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    name: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    description: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const workflow = await prisma.workflow.update({ where: { id }, data: parsed.data });
  res.json(workflow);
});

app.delete("/api/workflows/:id", authenticateToken, requireModuleAccess("workflow", "full"), async (req, res) => {
  const { id } = req.params;
  await prisma.workflowStep.deleteMany({ where: { workflowId: id } });
  await prisma.approval.deleteMany({ where: { workflowId: id } });
  await prisma.workflow.delete({ where: { id } });
  res.json({ ok: true });
});

/* ─────────────── CRUD: Approvals ─────────────── */

app.get("/api/approvals", authenticateToken, requireModuleAccess("workflow"), async (_req, res) => {
  const approvals = await prisma.approval.findMany({
    include: { actions: { orderBy: { stepOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(approvals);
});

/* Parse a workflow step's approver set: explicit JSON array or single role. */
function approverRolesOf(step: { approverRole: string; approverRoles?: string | null }): string[] {
  if (step.approverRoles) {
    try {
      const parsed = JSON.parse(step.approverRoles);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(String);
    } catch {
      /* fall through to single role */
    }
  }
  return [step.approverRole];
}

function safeJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

app.post("/api/approvals", authenticateToken, requireModuleAccess("workflow"), async (req, res) => {
  const parsed = z.object({
    workflowId: z.string().min(1),
    referenceType: z.string().min(1),
    referenceId: z.string().min(1),
    requestedBy: z.string().min(1),
    requestedByName: z.string().min(1),
    regionScope: z.string().optional(),
    meta: z.object({
      excludeOptional: z.boolean().optional(),
      skipOptionalStepOrders: z.array(z.number().int()).optional(),
    }).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const workflow = await prisma.workflow.findUnique({ where: { id: parsed.data.workflowId }, include: { steps: true } });
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }
  const hasRegionScopedStep = workflow.steps.some((s) => s.regionScoped);
  const approval = await prisma.approval.create({
    data: {
      workflowId: workflow.id,
      workflowCode: workflow.code,
      referenceType: parsed.data.referenceType,
      referenceId: parsed.data.referenceId,
      totalSteps: workflow.steps.length,
      currentStep: 1,
      requestedBy: parsed.data.requestedBy,
      requestedByName: parsed.data.requestedByName,
      regionScope: parsed.data.regionScope ?? null,
      meta: parsed.data.meta ? JSON.stringify(parsed.data.meta) : null,
    },
  });
  res.status(201).json(approval);
});

app.put("/api/approvals/:id/act", authenticateToken, requireModuleAccess("workflow"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    action: z.enum(["Approved", "Rejected"]),
    comment: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const approval = await prisma.approval.findUnique({ where: { id }, include: { actions: true } });
  if (!approval) {
    res.status(404).json({ error: "Approval not found" });
    return;
  }
  const user = (req as any).user as JwtPayload;
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  const workflow = await prisma.workflow.findUnique({ where: { id: approval.workflowId }, include: { steps: { orderBy: { stepOrder: "asc" } } } });
  const currentStepDef = workflow?.steps.find(s => s.stepOrder === approval.currentStep);
  if (!currentStepDef || !approverRolesOf(currentStepDef).some((r) => hasEffectiveRole(user, r))) {
    const expectedRole = currentStepDef ? approverRolesOf(currentStepDef).join(" or ") : "an authorized role";
    res.status(403).json({ error: `Access denied: ${actorRoleLabel(user)} cannot act on this approval; requires ${expectedRole}` });
    return;
  }
  if (currentStepDef.regionScoped) {
    const approvalRegion = approval.regionScope;
    if (approvalRegion && dbUser?.region && dbUser.region !== approvalRegion) {
      res.status(403).json({ error: `Access denied: this approval is scoped to region '${approvalRegion}'` });
      return;
    }
  }

  const actorName = dbUser?.name || user.role;
  await prisma.approvalAction.create({
    data: {
      approvalId: id,
      stepOrder: approval.currentStep,
      actorRole: actorRoleLabel(user),
      actorName,
      action: parsed.data.action,
      comment: parsed.data.comment,
      actedAt: new Date(),
    },
  });

  if (parsed.data.action === "Rejected") {
    await prisma.approval.update({ where: { id }, data: { status: "Rejected", decidedBy: actorName, decidedAt: new Date() } });
    res.json({ status: "Rejected" });
    return;
  }

  /* Advance, skipping steps the requester opted out of (meta.excludeOptional /
     skipOptionalStepOrders) — records an auto-skip action for each. */
  const meta = approval.meta ? safeJson(approval.meta) : null;
  let nextStep = approval.currentStep + 1;
  while (nextStep <= approval.totalSteps) {
    const stepDef = workflow?.steps.find((s) => s.stepOrder === nextStep);
    const skipped = stepDef?.optional && (meta?.excludeOptional === true || (Array.isArray(meta?.skipOptionalStepOrders) && (meta as any).skipOptionalStepOrders.includes(nextStep)));
    if (!skipped) break;
    await prisma.approvalAction.create({
      data: {
        approvalId: id,
        stepOrder: nextStep,
        actorRole: "System",
        actorName: "System",
        action: "Skipped (optional)",
        actedAt: new Date(),
      },
    });
    nextStep += 1;
  }

  if (nextStep > approval.totalSteps) {
    await prisma.approval.update({ where: { id }, data: { status: "Approved", decidedBy: actorName, decidedAt: new Date() } });
    res.json({ status: "Approved" });
    return;
  }

  await prisma.approval.update({ where: { id }, data: { currentStep: nextStep } });
  res.json({ status: `Advanced to step ${nextStep}` });
});

/* ─────────────── CRUD: Transport Requests ─────────────── */

app.get("/api/transport-requests", authenticateToken, requireAnyModuleAccess("fleet", "roster", "hr", "it", "workflow", "requisitions", "administration"), async (_req, res) => {
  const rows = await prisma.transportRequest.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/transport-requests", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    requestedByName: z.string().min(1),
    requesterDepartment: z.string().min(1),
    destination: z.string().min(1),
    purpose: z.string().min(1),
    travelDate: z.string().min(1),
    travelTime: z.string().optional(),
    returnTime: z.string().optional(),
    vehicleType: z.enum(["Car", "Motorcycle", "Any"]).optional(),
    passengersCount: z.number().int().positive().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const request = await prisma.transportRequest.create({
    data: {
      requestCode: `TRP-${Date.now().toString().slice(-6)}`,
      requestedBy: user.userId,
      requestedByName: parsed.data.requestedByName,
      requesterDepartment: parsed.data.requesterDepartment,
      destination: parsed.data.destination,
      purpose: parsed.data.purpose,
      travelDate: parsed.data.travelDate,
      travelTime: parsed.data.travelTime ?? null,
      returnTime: parsed.data.returnTime ?? null,
      vehicleType: parsed.data.vehicleType ?? "Any",
      passengersCount: parsed.data.passengersCount ?? 1,
      status: "Pending Fleet",
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Transport Requested",
      module: "Transport",
      details: `${parsed.data.requestedByName} (${parsed.data.requesterDepartment}) requested transport to ${parsed.data.destination} — ${request.requestCode}`,
    },
  });
  await notifyRole("Fleet Manager", "info", "New Transport Request", `${parsed.data.requestedByName} (${parsed.data.requesterDepartment}) requested transport to ${parsed.data.destination} on ${parsed.data.travelDate} — ${request.requestCode}.`, "Transport");
  if (dbUser) {
    await notifyUser(user.userId, "info", "Transport Request Received", `${request.requestCode} to ${parsed.data.destination} (${parsed.data.travelDate}) is with the Fleet Manager — you will be notified on approval.`, "Transport");
  }
  res.status(201).json(request);
});

app.put("/api/transport-requests/:id/act", authenticateToken, requireRole("Fleet Manager"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    action: z.enum(["Approved", "Declined"]),
    assignedVehicleId: z.string().optional(),
    assignedVehicle: z.string().optional(),
    assignedDriverId: z.string().optional(),
    assignedDriver: z.string().optional(),
    assignedRiderId: z.string().optional(),
    assignedRider: z.string().optional(),
    declinedReason: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const existing = await prisma.transportRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Transport request not found" });
    return;
  }
  if (existing.status !== "Pending Fleet") {
    res.status(400).json({ error: `Cannot act on a request in status '${existing.status}'` });
    return;
  }
  const isApproved = parsed.data.action === "Approved";
  if (isApproved && !parsed.data.assignedVehicle) {
    res.status(400).json({ error: "An assigned vehicle is required when approving" });
    return;
  }
  if (!isApproved && !parsed.data.declinedReason) {
    res.status(400).json({ error: "A decline reason is required" });
    return;
  }
  const actorName = (await contractActorName(req)) || "Fleet Manager";
  const updated = await prisma.transportRequest.update({
    where: { id },
    data: {
      status: isApproved ? "Approved" : "Declined",
      assignedVehicleId: parsed.data.assignedVehicleId ?? null,
      assignedVehicle: parsed.data.assignedVehicle ?? null,
      assignedDriverId: parsed.data.assignedDriverId ?? null,
      assignedDriver: parsed.data.assignedDriver ?? null,
      assignedRiderId: parsed.data.assignedRiderId ?? null,
      assignedRider: parsed.data.assignedRider ?? null,
      declinedReason: isApproved ? null : parsed.data.declinedReason ?? null,
      actedBy: actorName,
      actedAt: new Date().toISOString(),
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: isApproved ? "Transport Approved" : "Transport Declined",
      module: "Transport",
      details: isApproved
        ? `${existing.requestCode} approved → ${parsed.data.assignedVehicle} / ${parsed.data.assignedDriver ?? parsed.data.assignedRider ?? "assigned"}`
        : `${existing.requestCode} declined: ${parsed.data.declinedReason}`,
    },
  });
  await notifyUser(existing.requestedBy, isApproved ? "success" : "warning", isApproved ? "Transport Approved" : "Transport Declined", isApproved
    ? `${existing.requestCode} granted — ${parsed.data.assignedVehicle}${parsed.data.assignedDriver ? `, driver ${parsed.data.assignedDriver}` : ""}.`
    : `${existing.requestCode} declined: ${parsed.data.declinedReason}.`, "Transport");
  res.json(updated);
});

/* ─────────────── CRUD: Site Surveys ─────────────── */

const SITE_SURVEY_MODULES = ["operations", "roster", "marketing", "workflow", "administration", "requisitions", "hr"];

app.get("/api/site-surveys", authenticateToken, requireAnyModuleAccess(...SITE_SURVEY_MODULES), async (_req, res) => {
  const rows = await prisma.siteSurvey.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/site-surveys", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    clientName: z.string().min(1),
    siteName: z.string().min(1),
    region: z.string().optional(),
    requestedByName: z.string().min(1),
    requestedDepartment: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const survey = await prisma.siteSurvey.create({
    data: {
      surveyCode: `SS-${Date.now().toString().slice(-6)}`,
      clientName: parsed.data.clientName,
      siteName: parsed.data.siteName,
      region: parsed.data.region ?? null,
      requestedBy: user.userId,
      requestedByName: parsed.data.requestedByName,
      requestedDepartment: parsed.data.requestedDepartment,
      status: "Requested",
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Site Survey Requested",
      module: "Operations",
      details: `${parsed.data.requestedByName} requested site survey for ${parsed.data.clientName} — ${parsed.data.siteName}`,
    },
  });
  await notifyRole("Operations Manager", "info", "New Site Survey", `${parsed.data.requestedByName} requested a site survey for ${parsed.data.clientName} at ${parsed.data.siteName} — ${survey.surveyCode}.`, "Operations");
  res.status(201).json(survey);
});

async function siteSurveyActorCanAct(req: express.Request, res: express.Response, surveyId: string): Promise<boolean> {
  const user = (req as any).user as JwtPayload;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  if (!hasEffectiveRole(user, "Operations Manager") && !hasEffectiveRole(user, "Regional Manager")) {
    res.status(403).json({ error: "Only the Operations Manager or a Regional Manager can act on site surveys" });
    return false;
  }
  const survey = await prisma.siteSurvey.findUnique({ where: { id: surveyId } });
  if (!survey) {
    res.status(404).json({ error: "Site survey not found" });
    return false;
  }
  if (hasEffectiveRole(user, "Regional Manager") && survey.region) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    if (dbUser?.region && survey.region !== dbUser.region) {
      res.status(403).json({ error: `Access denied: this survey is scoped to region '${survey.region}'` });
      return false;
    }
  }
  return true;
}

app.put("/api/site-surveys/:id/start", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!(await siteSurveyActorCanAct(req, res, id))) return;
  const actorName = (await contractActorName(req)) || "Operations";
  const parsed = z.object({ surveyedBy: z.string().optional() }).safeParse(req.body);
  const survey = await prisma.siteSurvey.update({
    where: { id },
    data: { status: "In Progress", surveyedBy: parsed.success && parsed.data.surveyedBy ? parsed.data.surveyedBy : actorName },
  });
  res.json(survey);
});

app.put("/api/site-surveys/:id/complete", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (!(await siteSurveyActorCanAct(req, res, id))) return;
  const parsed = z.object({
    premisesType: z.string().optional(),
    perimeterStatus: z.string().optional(),
    entryPoints: z.number().int().optional(),
    riskLevel: z.string().optional(),
    highValueAssets: z.string().optional(),
    dayGuardsNeeded: z.number().int().optional(),
    nightGuardsNeeded: z.number().int().optional(),
    armedDay: z.boolean().optional(),
    armedNight: z.boolean().optional(),
    equipmentNeeded: z.string().optional(),
    k9Required: z.boolean().optional(),
    patrolVehicleRequired: z.boolean().optional(),
    accessHours: z.string().optional(),
    recommendation: z.string().optional(),
    notes: z.string().optional(),
  }).safeParse(req.body);
  const survey = await prisma.siteSurvey.update({
    where: { id },
    data: {
      ...(parsed.success ? parsed.data : {}),
      status: "Completed",
      reportPath: `survey-${id}-report`,
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Site Survey Completed",
      module: "Operations",
      details: `${survey.surveyCode} completed → report ready for contract drafting`,
    },
  });
  await notifyUser(survey.requestedBy, "success", "Site Survey Completed", `${survey.surveyCode} for ${survey.clientName} / ${survey.siteName} is complete and a draft contract was created.`, "Operations");
  await notifyRole("Records Officer", "info", "Draft Contract From Survey", `${survey.surveyCode} completed — a draft contract for ${survey.clientName} / ${survey.siteName} awaits your review.`, "Records");
  const actorName = (await contractActorName(req)) || "Operations";
  const draftContract = await prisma.contract.create({
    data: {
      contractCode: `CTR-DRAFT-${Date.now().toString().slice(-6)}`,
      title: `Draft: ${survey.clientName} / ${survey.siteName}`,
      contractType: "Client Contract",
      partyName: survey.clientName,
      category: "Corporate Client Service Agreement",
      startDate: new Date(Date.now() + 30 * 86400000),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: "Draft",
      managedBy: "Records Officer",
      region: survey.region ?? undefined,
      relatedSiteName: survey.siteName,
      siteSurvey: survey.surveyCode,
      siteSurveyBy: survey.surveyedBy ?? actorName,
      siteSurveyAt: new Date().toISOString().split("T")[0],
      createdBy: actorName,
      preparedBy: actorName,
      notes: `Draft from site survey ${survey.surveyCode}. Recommend: ${survey.recommendation ?? "TBD"}`,
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Contract Draft Created from Survey",
      module: "Operations",
      details: `${draftContract.contractCode} drafted from ${survey.surveyCode}`,
    },
  });
  res.json(survey);
});

app.put("/api/site-surveys/:id/cancel", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const survey = await prisma.siteSurvey.findUnique({ where: { id } });
  if (!survey) {
    res.status(404).json({ error: "Site survey not found" });
    return;
  }
  const user = (req as any).user as JwtPayload;
  const canCancel = hasEffectiveRole(user, "Operations Manager") || hasEffectiveRole(user, "Regional Manager") || user.userId === survey.requestedBy;
  if (!canCancel) {
    res.status(403).json({ error: "Access denied: you cannot cancel this survey" });
    return;
  }
  const updated = await prisma.siteSurvey.update({ where: { id }, data: { status: "Cancelled" } });
  res.json(updated);
});

/* ─────────────── CRUD: Contract Inquiries ─────────────── */

const CONTRACT_INQUIRY_MODULES = ["identity", "hr", "workflow", "operations", "marketing", "finance", "administration", "fleet", "requisitions"];

app.get("/api/contract-inquiries", authenticateToken, requireAnyModuleAccess(...CONTRACT_INQUIRY_MODULES), async (_req, res) => {
  const rows = await prisma.contractInquiry.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/contract-inquiries", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    requestedByName: z.string().min(1),
    requesterDepartment: z.string().min(1),
    clientName: z.string().min(1),
    siteName: z.string().optional(),
    searchHints: z.string().optional(),
    purpose: z.enum(["Confirmation", "Full Copy"]).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const inquiry = await prisma.contractInquiry.create({
    data: {
      inquiryCode: `CI-${Date.now().toString().slice(-6)}`,
      requestedBy: user.userId,
      requestedByName: parsed.data.requestedByName,
      requesterDepartment: parsed.data.requesterDepartment,
      clientName: parsed.data.clientName,
      siteName: parsed.data.siteName ?? null,
      searchHints: parsed.data.searchHints ?? null,
      purpose: parsed.data.purpose ?? "Confirmation",
      status: "Pending",
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: user.userId,
      userRole: actorRoleLabel(user),
      action: "Contract Inquiry Raised",
      module: "Records",
      details: `${parsed.data.requestedByName} requested ${parsed.data.purpose ?? "Confirmation"} for ${parsed.data.clientName}`,
    },
  });
  await notifyRole("Records Officer", "info", "New Contract Inquiry", `${parsed.data.requestedByName} (${parsed.data.requesterDepartment}) requested ${parsed.data.purpose ?? "Confirmation"} for ${parsed.data.clientName}${parsed.data.siteName ? ` at ${parsed.data.siteName}` : ""} — ${inquiry.inquiryCode}.`, "Records");
  res.status(201).json(inquiry);
});

app.put("/api/contract-inquiries/:id/respond", authenticateToken, requireRole("Records Officer"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    responseType: z.enum(["Confirmation", "Full Copy"]),
    responseNotes: z.string().optional(),
    responsePath: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const existing = await prisma.contractInquiry.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Contract inquiry not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || "Records Officer";
  const updated = await prisma.contractInquiry.update({
    where: { id },
    data: {
      status: "Answered",
      respondedBy: actorName,
      responseType: parsed.data.responseType,
      responseNotes: parsed.data.responseNotes ?? null,
      responsePath: parsed.data.responsePath ?? null,
      respondedAt: new Date().toISOString().split("T")[0],
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date(),
      userName: (req as any).user?.userId || "system",
      userRole: actorRoleLabel((req as any).user) || "system",
      action: "Contract Inquiry Answered",
      module: "Records",
      details: `${existing.inquiryCode} responded (${parsed.data.responseType})`,
    },
  });
  await notifyUser(existing.requestedBy, "success", "Contract Inquiry Answered", `${existing.inquiryCode} for ${existing.clientName} was answered by the Records Officer (${parsed.data.responseType}).`, "Records");
  res.json(updated);
});

/* ─────────────── CRUD: Documents ─────────────── */

const HR_CATEGORIES = ["HR", "Personnel", "Employment", "Disciplinary", "Staff", "Guard File"];
const FINANCE_CATEGORIES = ["Finance", "Invoice", "Expense", "Payroll", "Vendor"];
const HR_DOC_ROLES = ["HR Manager", "HR Assistant", "Records Officer", "IT Officer"];
const FINANCE_DOC_ROLES = ["Finance Manager", "Accountant", "Assistant Accountant", "Internal Auditor", "Cashier", "IT Officer"];

function docCategoryVisibleTo(category: string, role: string): boolean {
  if (category && HR_CATEGORIES.some((c) => category.toUpperCase().includes(c.toUpperCase()))) return HR_DOC_ROLES.includes(role);
  if (category && FINANCE_CATEGORIES.some((c) => category.toUpperCase().includes(c.toUpperCase()))) return FINANCE_DOC_ROLES.includes(role);
  return true;
}

app.get("/api/documents", authenticateToken, requireModuleAccess("documents"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const documents = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });
  const filtered = documents.filter((d) => docCategoryVisibleTo(d.category, user.role));
  res.json(filtered);
});

app.post("/api/documents/upload", authenticateToken, requireModuleAccess("documents", "full"), upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    referenceType: z.string().min(1),
    referenceId: z.string().min(1),
    notes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const isHRCategory = HR_CATEGORIES.some((c) => parsed.data.category.toUpperCase().includes(c.toUpperCase()));
  if (isHRCategory && !HR_DOC_ROLES.some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: "Access denied: HR documents are restricted to HR roles and the Records Officer" });
    return;
  }
  const doc = await prisma.document.create({
    data: {
      code: `DOC-${Date.now()}`,
      name: parsed.data.name,
      category: parsed.data.category,
      referenceType: parsed.data.referenceType,
      referenceId: parsed.data.referenceId,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.filename,
      uploadedBy: user.userId,
      notes: parsed.data.notes,
    },
  });
  res.status(201).json(doc);
});

app.delete("/api/documents/:id", authenticateToken, requireModuleAccess("documents", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (doc) {
    if (doc.category && HR_CATEGORIES.some((c) => doc.category.toUpperCase().includes(c.toUpperCase())) && !HR_DOC_ROLES.some((r) => hasEffectiveRole(user, r))) {
      res.status(403).json({ error: "Access denied: cannot delete HR documents" });
      return;
    }
    const filePath = path.join(uploadDir, doc.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.document.delete({ where: { id } });
  }
  res.json({ success: true });
});

/* ─────────────── CRUD: Job Postings & Candidates ─────────────── */

app.get("/api/job-postings", authenticateToken, requireModuleAccess("recruitment"), async (_req, res) => {
  const postings = await prisma.jobPosting.findMany({ include: { candidates: true }, orderBy: { createdAt: "desc" } });
  res.json(postings);
});

app.post("/api/job-postings", authenticateToken, requireModuleAccess("recruitment", "full"), async (req, res) => {
  const parsed = z.object({
    title: z.string().min(1),
    code: z.string().min(1),
    department: z.string().min(1),
    location: z.string().min(1),
    description: z.string().min(1),
    requirements: z.string().min(1),
    positionsCount: z.number().int().positive().default(1),
    salaryRange: z.string().optional(),
    closesDate: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const posting = await prisma.jobPosting.create({
    data: { ...parsed.data, postedDate: new Date().toISOString().split("T")[0] },
  });
  res.status(201).json(posting);
});

app.put("/api/job-postings/:id", authenticateToken, requireModuleAccess("recruitment", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    status: z.string().optional(),
    title: z.string().optional(),
    closesDate: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const posting = await prisma.jobPosting.update({ where: { id }, data: parsed.data });
  res.json(posting);
});

app.get("/api/candidates", authenticateToken, requireModuleAccess("recruitment"), async (_req, res) => {
  const candidates = await prisma.candidate.findMany({ orderBy: { createdAt: "desc" } });
  res.json(candidates);
});

app.post("/api/candidates", authenticateToken, requireModuleAccess("recruitment", "full"), async (req, res) => {
  const parsed = z.object({
    jobPostingId: z.string().min(1),
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    source: z.string().optional(),
    notes: z.string().optional(),
    roleType: z.string().optional(),
    licenceNumber: z.string().optional(),
    licenceClass: z.string().optional(),
    licenceExpiryDate: z.string().optional(),
    nationalId: z.string().optional(),
    gender: z.string().optional(),
    age: z.string().optional(),
    address: z.string().optional(),
    expectedSalary: z.number().optional(),
    availability: z.string().optional(),
    education: z.string().optional(),
    certifications: z.string().optional(),
    yearsExperience: z.number().optional(),
    employerHistory: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    interviewScores: z.any().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const candidate = await (prisma.candidate.create as any)({
    data: { ...parsed.data, appliedDate: new Date().toISOString().split("T")[0] },
  });
  res.status(201).json(candidate);
});

app.put("/api/candidates/:id", authenticateToken, requireModuleAccess("recruitment", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    status: z.string().optional(),
    interviewDate: z.string().optional(),
    interviewScore: z.number().optional(),
    notes: z.string().optional(),
    roleType: z.string().optional(),
    licenceNumber: z.string().optional(),
    licenceClass: z.string().optional(),
    licenceExpiryDate: z.string().optional(),
    nationalId: z.string().optional(),
    gender: z.string().optional(),
    age: z.string().optional(),
    address: z.string().optional(),
    expectedSalary: z.number().optional(),
    availability: z.string().optional(),
    education: z.string().optional(),
    certifications: z.string().optional(),
    yearsExperience: z.number().optional(),
    employerHistory: z.string().optional(),
    reasonForLeaving: z.string().optional(),
    interviewScores: z.any().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  const candidate = await (prisma.candidate.update as any)({ where: { id }, data: parsed.data as any });

  // On hire of a Driver/Rider candidate, capture licence details from recruitment into the Fleet register.
  if (parsed.data.status === "Hired" && (existing.roleType === "Driver" || existing.roleType === "Rider")) {
    const alreadyOnboarded = await prisma.driver.findFirst({ where: { sourceRef: id } });
    if (!alreadyOnboarded) {
      const driverCount = await prisma.driver.count();
      await prisma.driver.create({
        data: {
          driverCode: `DRV-CAND-${String(driverCount + 1).padStart(3, "0")}`,
          forceNumber: await nextForceNumber(),
          roleType: existing.roleType || "Driver",
          fullName: existing.fullName,
          contactPhone: existing.phone,
          nationalId: existing.nationalId || null,
          licenceNumber: existing.licenceNumber || "PENDING",
          licenceClass: existing.licenceClass || "Class B & DL (Light/Heavy)",
          licenceExpiryDate: existing.licenceExpiryDate || "2030-12-31",
          assignedVehiclePlate: "Unassigned",
          dutyShift: "On Call Standby",
          safetyScorePct: 0,
          totalTripsCompleted: 0,
          trainingBadges: [],
          sourceRef: id,
          status: "Pending FM Approval",
        },
      });
    }
  }

  res.json(candidate);
});

/* ─────────────── CRUD: Performance Reviews ─────────────── */

app.get("/api/performance-reviews", authenticateToken, requireModuleAccess("performance"), async (_req, res) => {
  const reviews = await prisma.performanceReview.findMany({ orderBy: { createdAt: "desc" } });
  res.json(reviews);
});

app.post("/api/performance-reviews", authenticateToken, requireModuleAccess("performance", "full"), async (req, res) => {
  const parsed = z.object({
    guardId: z.string().min(1),
    guardName: z.string().min(1),
    forceNumber: z.string().min(1),
    reviewPeriod: z.string().min(1),
    reviewType: z.string().min(1),
    evaluatorName: z.string().min(1),
    disciplineScore: z.number().min(0).max(5),
    punctualityScore: z.number().min(0).max(5),
    clientRatingScore: z.number().min(0).max(5),
    appearanceScore: z.number().min(0).max(5),
    incidentHandlingScore: z.number().min(0).max(5),
    overallRating: z.string().min(1),
    recommendation: z.string().min(1),
    comments: z.string().optional(),
    keyStrengths: z.string().optional(),
    growthAreas: z.string().optional(),
    developmentGoals: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const review = await prisma.performanceReview.create({
    data: { ...parsed.data, evaluationDate: new Date().toISOString().split("T")[0] },
  });
  res.status(201).json(review);
});

/* ─────────────── CRUD: Custom Roles ─────────────── */

app.get("/api/custom-roles", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const roles = await prisma.customRoleDefinition.findMany({ orderBy: { createdAt: "desc" } });
  res.json(roles);
});

app.post("/api/custom-roles", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const parsed = z.object({
    roleName: z.string().min(1),
    department: z.string().min(1),
    description: z.string().optional(),
    allowedModules: z.array(z.string()).min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const role = await prisma.customRoleDefinition.create({
    data: { ...parsed.data, createdBy: (req as any).user?.userId || "system" },
  });
  res.status(201).json(role);
});

app.delete("/api/custom-roles/:id", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  await prisma.customRoleDefinition.delete({ where: { id } });
  res.json({ success: true });
});

/* ─────────────── CRUD: Campaigns (Marketing, budget approval by Finance) ─────────────── */

app.get("/api/campaigns", authenticateToken, requireModuleAccess("campaigns"), async (_req, res) => {
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: "desc" } });
  res.json(campaigns);
});

app.post("/api/campaigns", authenticateToken, requireModuleAccess("campaigns", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    name: z.string().min(1),
    channel: z.string().min(1),
    budget: z.number().nonnegative(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const campaign = await prisma.campaign.create({
    data: { ...parsed.data, proposedBy: actorName, budgetStatus: "Pending Finance Approval" },
  });
  res.status(201).json(campaign);
});

app.put("/api/campaigns/:id", authenticateToken, requireModuleAccess("campaigns", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    name: z.string().optional(),
    channel: z.string().optional(),
    leadsGenerated: z.number().optional(),
    conversions: z.number().optional(),
    budget: z.number().nonnegative().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.budget !== undefined) data.budgetStatus = "Pending Finance Approval";
  const campaign = await prisma.campaign.update({ where: { id }, data });
  res.json(campaign);
});

app.put("/api/campaigns/:id/approve-budget", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can approve campaign budgets" });
    return;
  }
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const campaign = await prisma.campaign.update({
    where: { id },
    data: { budgetStatus: "Approved", budgetApprovedBy: actorName, budgetApprovedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(campaign);
});

/* Legacy endpoint retained for campaigns already sitting in Pending GM Approval
   from before the §2 no-threshold change — GM finalizes directly. */
app.put("/api/campaigns/:id/gm-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "General Manager")) {
    res.status(403).json({ error: "Only the General Manager can give final approval on campaign budgets" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const campaign = await prisma.campaign.update({
    where: { id },
    data: { budgetStatus: "Approved", budgetApprovedBy: actorName, budgetApprovedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(campaign);
});

/* ─────────────── CRUD: Complaints (Marketing owns satisfaction, Ops resolves, IO investigates) ─────────────── */

app.get("/api/complaints", authenticateToken, requireModuleAccess("complaints"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let complaints = await prisma.complaint.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const sites = await prisma.clientSite.findMany({ where: { region }, select: { siteName: true } });
      const siteNames = new Set(sites.map((s) => s.siteName));
      complaints = complaints.filter((c) => siteNames.has(c.siteName));
    }
  }
  res.json(complaints);
});

app.post("/api/complaints", authenticateToken, requireModuleAccess("complaints", "full"), async (req, res) => {
  const parsed = z.object({
    clientName: z.string().min(1),
    siteName: z.string().min(1),
    category: z.string().min(1),
    description: z.string().min(1),
    satisfactionRating: z.number().int().min(1).max(5).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const code = `CMPL-2026-${String((await prisma.complaint.count()) + 1).padStart(3, "0")}`;
  const complaint = await prisma.complaint.create({
    data: {
      ...parsed.data,
      complaintCode: code,
      reportedDate: new Date().toISOString().split("T")[0],
      ownedBy: "Marketing",
    },
  });
  res.status(201).json(complaint);
});

app.put("/api/complaints/:id", authenticateToken, requireModuleAccess("complaints", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    category: z.string().optional(),
    description: z.string().optional(),
    satisfactionRating: z.number().int().min(1).max(5).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data };
  const complaint = await prisma.complaint.update({ where: { id }, data });
  res.json(complaint);
});

app.put("/api/complaints/:id/resolve", authenticateToken, requireModuleAccess("complaints", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    resolutionNotes: z.string().min(1),
    satisfactionRating: z.number().int().min(1).max(5).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status: "Resolved",
      resolvedBy: actorName,
      resolutionNotes: parsed.data.resolutionNotes,
      satisfactionRating: parsed.data.satisfactionRating,
    },
  });
  const site = await prisma.clientSite.findFirst({ where: { siteName: complaint.siteName } });
  if (site && parsed.data.satisfactionRating) {
    await prisma.clientSite.update({ where: { id: site.id }, data: { satisfactionRating: parsed.data.satisfactionRating } });
  }
  res.json(complaint);
});

app.put("/api/complaints/:id/refer", authenticateToken, requireModuleAccess("complaints", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || hasEffectiveRole(user, "Director")) {
    res.status(403).json({ error: "Access denied: cannot refer this complaint for investigation" });
    return;
  }
  const parsed = z.object({
    linkedIncidentCode: z.string().optional(),
  }).safeParse(req.body);
  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      referredForInvestigation: true,
      status: "UnderInvestigation",
      linkedIncidentCode: parsed.success ? parsed.data.linkedIncidentCode : undefined,
    },
  });
  res.json(complaint);
});

/* ─────────────── CRUD: Disciplinary Actions (RM → Ops → HR chain) ─────────────── */

app.get("/api/disciplinary", authenticateToken, requireModuleAccess("disciplinary"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let actions = await prisma.disciplinaryAction.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const guardIds = new Set((await prisma.guard.findMany({ where: { region }, select: { id: true } })).map((g) => g.id));
      actions = actions.filter((a) => guardIds.has(a.guardId));
    }
  }
  res.json(actions);
});

app.post("/api/disciplinary", authenticateToken, requireModuleAccess("disciplinary", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    guardId: z.string().min(1),
    guardName: z.string().min(1),
    forceNumber: z.string().min(1),
    actionType: z.string().min(1),
    reason: z.string().min(1),
    severity: z.string().optional(),
    linkedIncidentCode: z.string().optional(),
    linkedComplaintCode: z.string().optional(),
    offenceCategory: z.enum(["Category 1", "Category 2"]).optional(),
    offence: z.string().optional(),
    offenceDate: z.string().optional(),
    offenceTime: z.string().optional(),
    zone: z.string().optional(),
    actionTaken: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const code = `DISC-2026-${String((await prisma.disciplinaryAction.count()) + 1).padStart(3, "0")}`;
  const action = await prisma.disciplinaryAction.create({
    data: {
      ...parsed.data,
      actionCode: code,
      initiatedBy: actorName,
      status: parsed.data.actionType === "Warning Letter" ? "Pending Ops Approval" : "Initiated",
    },
  });
  res.status(201).json(action);
});

app.put("/api/disciplinary/:id/regional-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Regional Manager")) {
    res.status(403).json({ error: "Only a Regional Manager can approve at this disciplinary step" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const action = await prisma.disciplinaryAction.update({ where: { id }, data: { status: "Pending Ops Approval", regionalApprovedBy: actorName } });
  res.json(action);
});

app.put("/api/disciplinary/:id/ops-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "Operations Manager")) {
    res.status(403).json({ error: "Only the Operations Manager can approve at this disciplinary step" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const action = await prisma.disciplinaryAction.update({ where: { id }, data: { status: "Pending HR Approval", operationsApprovedBy: actorName } });
  res.json(action);
});

app.put("/api/disciplinary/:id/hr-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !hasEffectiveRole(user, "HR Manager")) {
    res.status(403).json({ error: "Only the HR Manager gives the final disciplinary sign-off" });
    return;
  }
  const existing = await prisma.disciplinaryAction.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Disciplinary action not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const action = await prisma.disciplinaryAction.update({
    where: { id },
    data: { status: "Finalized", hrApprovedBy: actorName, approvedAt: new Date().toISOString().split("T")[0] },
  });
  if (existing.actionType === "Warning Letter") {
    await prisma.guard.update({
      where: { id: existing.guardId },
      data: { warningLettersCount: { increment: 1 } },
    });
  }
  if (existing.actionType === "Suspension" || existing.actionType === "Termination" || existing.actionType === "Desertion") {
    const reason = `${existing.actionType} - ${existing.reason}`;
    const category = existing.actionType;
    await prisma.guard.update({
      where: { id: existing.guardId },
      data: {
        status: category === "Suspension" ? "Suspended" : category,
        terminationReason: existing.reason,
        terminationDate: new Date().toISOString().split("T")[0],
        terminationCategory: category,
        ...(category === "Desertion" ? { isDeserter: true, desertionDate: new Date() } : {}),
      },
    });
    const detail = `${existing.guardName} (${existing.forceNumber}) ${category.toLowerCase()} after disciplinary chain. Reason: ${existing.reason}`;
    await prisma.auditLog.createMany({
      data: [
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${category}`, module: "HR", details: detail },
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${category}`, module: "Operations", details: detail },
        { timestamp: new Date(), userName: user.userId, userRole: actorRoleLabel(user), action: `Guard ${category}`, module: "Finance", details: detail },
      ],
    });
  }
  res.json(action);
});

app.put("/api/disciplinary/:id/reject", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !["Regional Manager", "Operations Manager", "HR Manager"].some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: "Access denied: cannot reject this disciplinary action" });
    return;
  }
  const action = await prisma.disciplinaryAction.update({ where: { id }, data: { status: "Rejected" } });
  res.json(action);
});

/* ─────────────── CRUD: Site Deployments (Ops picks guards after a contract is won) ─────────────── */

app.get("/api/deployments", authenticateToken, requireModuleAccess("deployments"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let deployments = await prisma.siteDeployment.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const siteIds = new Set((await prisma.clientSite.findMany({ where: { region }, select: { id: true } })).map((s) => s.id));
      deployments = deployments.filter((d) => siteIds.has(d.siteId));
    }
  }
  res.json(deployments);
});

app.post("/api/deployments", authenticateToken, requireModuleAccess("deployments", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = z.object({
    siteId: z.string().min(1),
    siteName: z.string().min(1),
    clientName: z.string().min(1),
    guardId: z.string().min(1),
    guardName: z.string().min(1),
    shiftType: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const code = `DEP-2026-${String((await prisma.siteDeployment.count()) + 1).padStart(3, "0")}`;
  const deployment = await prisma.siteDeployment.create({
    data: {
      ...parsed.data,
      deploymentCode: code,
      deployedBy: actorName,
      deployedAt: new Date().toISOString().split("T")[0],
    },
  });
  await prisma.guard.update({
    where: { id: parsed.data.guardId },
    data: { lifecycleStage: "DEPLOYED", assignedSite: parsed.data.siteName },
  });
  await prisma.clientSite.update({ where: { id: parsed.data.siteId }, data: { deploymentStatus: "Deployed" } });
  res.status(201).json(deployment);
});

app.put("/api/deployments/:id/end", authenticateToken, requireModuleAccess("deployments", "full"), async (req, res) => {
  const { id } = req.params;
  const deployment = await prisma.siteDeployment.update({ where: { id }, data: { status: "Ended" } });
  res.json(deployment);
});

/* ─────────────── Deployment Orders (Ops issues → RM fills from region guard pool) ─────────────── */

app.get("/api/deployment-orders", authenticateToken, requireModuleAccess("deployments"), async (_req, res) => {
  const orders = await prisma.deploymentOrder.findMany({ orderBy: { createdAt: "desc" } });
  res.json(orders);
});

app.post("/api/deployment-orders", authenticateToken, requireModuleAccess("deployments", "full"), requireRole("Operations Manager"), async (req, res) => {
  const parsed = z.object({
    siteId: z.string().min(1),
    siteName: z.string().min(1),
    clientName: z.string().min(1),
    region: z.string().optional(),
    requiredHeadcount: z.number().int().positive(),
    shiftType: z.string().min(1),
    targetStartDate: z.string().min(1),
    targetEndDate: z.string().min(1),
    notes: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const user = (req as any).user as JwtPayload;
  const actorName = (await prisma.user.findUnique({ where: { id: user.userId } }))?.name || user.role;
  const orderCode = `ORD-2026-${String((await prisma.deploymentOrder.count()) + 1).padStart(3, "0")}`;
  const order = await prisma.deploymentOrder.create({
    data: { ...parsed.data, orderCode, requestedBy: actorName, status: "Open", assignedGuardIds: [] },
  });
  await prisma.notification.createMany({
    data: [
      {
        targetRole: "Regional Manager",
        type: "info",
        title: "Deployment Order Issued",
        message: `${order.orderCode} — ${order.requiredHeadcount} guard(s) for ${order.siteName} (${order.region ?? "HQ"}). Review and fill the order.`,
        module: "Operations",
      },
    ],
  });
  res.status(201).json(order);
});

app.put("/api/deployment-orders/:id/assign", authenticateToken, requireModuleAccess("deployments", "full"), requireRole("Regional Manager"), async (req, res) => {
  const parsed = z.object({ guardIds: z.array(z.string().min(1)).min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const order = await prisma.deploymentOrder.findUnique({ where: { id: req.params.id } });
  if (!order) {
    res.status(404).json({ error: "Deployment order not found" });
    return;
  }
  if (order.status !== "Open") {
    res.status(400).json({ error: `Order is already ${order.status}` });
    return;
  }
  const user = (req as any).user as JwtPayload;
  const rmUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (order.region && rmUser?.region && order.region !== rmUser.region) {
    res.status(403).json({ error: `Order region ${order.region} does not match your region ${rmUser.region}` });
    return;
  }
  const guardIds = [...new Set(parsed.data.guardIds)].slice(0, order.requiredHeadcount);
  const guards = await prisma.guard.findMany({
    where: {
      id: { in: guardIds },
      lifecycleStage: "PASSED_OUT",
      ...(order.region ? { region: order.region } : {}),
    },
  });
  if (guards.length === 0) {
    res.status(400).json({ error: "No deployable (passed-out) guards found in the order region pool" });
    return;
  }
  const actorName = rmUser?.name || user.role;

  const assignedGuardIds = guards.map((g) => g.id);
  const tx = await prisma.$transaction([
    ...guards.map((g) =>
      prisma.siteDeployment.create({
        data: {
          deploymentCode: `DEP-2026-${Date.now()}-${g.id.slice(-4)}`,
          siteId: order.siteId,
          siteName: order.siteName,
          clientName: order.clientName,
          guardId: g.id,
          guardName: g.fullName,
          shiftType: order.shiftType,
          deployedBy: `${actorName} (via ${order.orderCode})`,
          deployedAt: new Date().toISOString().split("T")[0],
          status: "Active",
        },
      })
    ),
    ...guards.map((g) =>
      prisma.guard.update({ where: { id: g.id }, data: { lifecycleStage: "DEPLOYED", assignedSite: order.siteName } })
    ),
    prisma.clientSite.updateMany({ where: { id: order.siteId }, data: { deploymentStatus: "Deployed" } }),
    prisma.deploymentOrder.update({
      where: { id: order.id },
      data: { assignedGuardIds, status: assignedGuardIds.length >= order.requiredHeadcount ? "Filled" : "Assigned" },
    }),
  ]);
  res.json(tx[tx.length - 1]);
});

app.put("/api/deployment-orders/:id/cancel", authenticateToken, requireModuleAccess("deployments", "full"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  if (!["Operations Manager", "Regional Manager"].some((r) => hasEffectiveRole(user, r))) {
    res.status(403).json({ error: "Only an Operations Manager or Regional Manager can cancel a deployment order" });
    return;
  }
  const order = await prisma.deploymentOrder.update({ where: { id: req.params.id }, data: { status: "Cancelled" } });
  res.json(order);
});

/* ─────────────── Analytics ─────────────── */

app.get("/api/analytics/summary", authenticateToken, requireModuleAccess("directorate"), async (_req, res) => {
  const [
    totalGuards,
    activeGuards,
    totalSites,
    openIncidents,
    totalVehicles,
    activeK9s,
    pendingLeave,
    totalUsers,
  ] = await Promise.all([
    prisma.guard.count(),
    prisma.guard.count({ where: { status: "On Duty" } }),
    prisma.clientSite.count(),
    prisma.incident.count({ where: { status: { in: ["Open", "UnderInvestigation"] } } }),
    prisma.vehicle.count(),
    prisma.k9Dog.count({ where: { status: "Active Duty" } }),
    prisma.leaveRequest.count({ where: { status: { in: ["Pending Regional Approval", "Pending Ops Approval", "Pending HR Review", "Pending GM Approval"] } } }),
    prisma.user.count(),
  ]);
  res.json({
    totalGuards,
    activeGuards,
    totalSites,
    openIncidents,
    totalVehicles,
    activeK9s,
    pendingLeave,
    totalUsers,
  });
});

/* ─────────────── Durable Notifications (Phase 5) ─────────────── */

const createNotificationSchema = z.object({
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  title: z.string().min(1),
  message: z.string().min(1),
  module: z.string().optional(),
  targetRole: z.string().optional(),
  targetUserId: z.string().optional(),
});

app.get("/api/notifications", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const where = {
    OR: [{ userId: user.userId }, { targetRole: user.role }],
  };
  if (hasListPagination(req)) {
    const { skip, take, page, limit } = parseListPagination(req);
    const [rows, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.notification.count({ where }),
    ]);
    res.json(paginatedEnvelope(rows, total, page, limit));
    return;
  }
  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(notifications);
});

app.post("/api/notifications", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const parsed = createNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { targetRole, targetUserId, ...rest } = parsed.data;
  const notification = await prisma.notification.create({
    data: {
      ...rest,
      targetRole: targetRole ?? null,
      userId: targetUserId ?? (targetRole ? null : user.userId),
    },
  });
  res.status(201).json(notification);
});

app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const { id } = req.params;
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  const owned = existing.userId === user.userId || existing.targetRole === user.role;
  if (!owned) {
    res.status(403).json({ error: "Access denied: notification belongs to another user" });
    return;
  }
  const updated = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  res.json(updated);
});

app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  await prisma.notification.updateMany({
    where: {
      readAt: null,
      OR: [{ userId: user.userId }, { targetRole: user.role }],
    },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

app.delete("/api/notifications/:id", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const { id } = req.params;
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  const owned = existing.userId === user.userId || existing.targetRole === user.role;
  if (!owned) {
    res.status(403).json({ error: "Access denied: notification belongs to another user" });
    return;
  }
  await prisma.notification.delete({ where: { id } });
  res.json({ ok: true });
});


/* ─────────────── Health ─────────────── */

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ─────────────── DOCX Download ─────────────── */

app.use("/public", express.static(path.join(process.cwd(), "public")));

/* ─────────────── Vite Dev Middleware ─────────────── */

/**
 * Express 4 does not catch errors thrown inside async route handlers, which
 * leaves the request hanging forever. Wrap every registered layer so rejected
 * promises are forwarded to the error middleware (500) instead.
 */
function wrapAsyncRouteErrors() {
  const wrapLayer = (layer: any) => {
    const handle = layer.handle;
    if (!handle) return;
    // Recurse into nested router/route stacks so async middleware + handlers inside are covered.
    if (typeof handle === "function" && Array.isArray(handle.stack)) {
      for (const inner of handle.stack) wrapLayer(inner);
      return;
    }
    if (typeof handle !== "function" || handle.length > 4) return;
    layer.handle = (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const result = handle(req, res, next);
        if (result && typeof result.catch === "function") {
          result.catch((err: Error) => next(err));
        }
      } catch (err) {
        next(err as Error);
      }
    };
  };
  const stack = (app as any)._router?.stack ?? [];
  for (const layer of stack) wrapLayer(layer);
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  wrapAsyncRouteErrors();

  // Testing auto-seed: deploy → login with no manual Railway curl. When SEED_ENABLED=true top-up to 26 users.
  if (process.env.SEED_ENABLED === "true") {
    try {
      const r = await seedDatabase();
      if (r) console.log(`[seed] ${r.message}`);
    } catch (e) {
      console.error("[seed] auto-seed failed:", e);
    }
  }

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled route error:", err);
    if (res.headersSent) return;
    // Multer file-filter errors should be 400
    if (err.message?.includes("File type")) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
      } catch {}
      process.exit(0);
    });
    // Force exit if not closed in 10s
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  return server;
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

startServer().catch(console.error);
