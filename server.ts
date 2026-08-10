import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "./src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod/v4";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is required");
  process.exit(1);
}

/* Force Number allocation — uniform company-wide format PSG<YYY>/<SEQ>, e.g. PSG025/001.
   The sequence is PER-YEAR (resets to 001 each year): PSG025/001, PSG025/002 … then PSG026/001 next year.
   The year prefix is the enrolment/hire year and makes each force number unique company-wide even though
   the sequence repeats across years. Existing/preexisting force numbers already use this format and are
   preserved, never renumbered; the per-year max is scanned across Driver.forceNumber, Guard.guardCode
   and User.forceNumber so newly issued numbers never collide within the same year. */
async function nextForceNumber(seq?: number) {
  const yyy = String(new Date().getFullYear() % 1000).padStart(3, "0");
  const [drivers, guards, users] = await Promise.all([
    prisma.driver.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
    prisma.guard.findMany({ select: { guardCode: true } }),
    prisma.user.findMany({ where: { forceNumber: { not: null } }, select: { forceNumber: true } }),
  ]);
  const all = [
    ...drivers.map((d) => d.forceNumber!),
    ...guards.map((g) => g.guardCode!),
    ...users.map((u) => u.forceNumber!),
  ];
  let max = 0;
  for (const fn of all) {
    const m = fn.match(/^PSG(\d{3})\/(\d+)$/);
    if (m && m[1] === yyy) max = Math.max(max, Number(m[2]));
  }
  const next = seq ?? max + 1;
  return `PSG${yyy}/${String(next).padStart(3, "0")}`;
}

/* ─────────────── Security Middleware ─────────────── */

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV !== "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
              imgSrc: ["'self'", "data:", "blob:"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              fontSrc: ["'self'", "data:"],
            },
          }
        : undefined,
  })
);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// 1000/15min keeps brute-force protection while letting the integration test
// suite (which logs in every seeded user per test file) run reliably.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth", authLimiter);

/* ─────────────── File Upload ─────────────── */

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
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
  const filename = req.params.filename;
  const filepath = path.join(uploadDir, filename);
  if (!fs.existsSync(filepath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filepath);
});

/* ─────────────── Zod Schemas ─────────────── */

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createGuardSchema = z.object({
  fullName: z.string().min(1),
  guardCode: z.string().min(1),
  designation: z.string().min(1),
  photoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  phone: z.string().min(1),
  nationalId: z.string().min(1),
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
  startDate: z.string().min(1),
  endDate: z.string().min(1),
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
  relatedGuardCode: z.string().optional(),
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
  incidentDate: z.string().optional(),
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
  dueDate: z.string().min(1),
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
  role: string;
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

/* Time-bound delegation (§5.4): a granted acting role takes effect from the
   next sign-in, and only while actingExpiresAt is still in the future. */
function effectiveRoleFor(user: { role: string; actingRole: string | null; actingExpiresAt: string | null }): string {
  if (user.actingRole && user.actingExpiresAt) {
    const expiresAt = new Date(user.actingExpiresAt);
    if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now()) {
      return user.actingRole;
    }
  }
  return user.role;
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ─────────────── RBAC Middleware ─────────────── */

type AccessLevel = "view" | "full";

const FULL_EDIT_ROLES = [
  "Operations Manager",
  "HR Manager",
  "Finance Manager",
  "IT Officer",
];

/**
 * Module → role → access level.
 * "view"  = can open/read the module.
 * "full"  = can create/edit within the module.
 * Directorate roles (GM/Director) and IT Officer hold View across modules they
 * do not own (least privilege, §15.1); they approve through explicit workflow
 * steps rather than through module-level Full access.
 */
const MODULE_PERMISSIONS: Record<string, Partial<Record<string, AccessLevel>>> = {
  operations: {
    "Operations Manager": "view",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  guards: {
    "HR Manager": "full",
    "HR Assistant": "full",
    "Records Officer": "full",
    "Operations Manager": "view",
    "Regional Manager": "view",
    "Armorer": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  sites: {
    "Business Development Manager": "full",
    "Sales and Marketing Supervisor": "full",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  armoury: {
    "Armorer": "full",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  incidents: {
    "Investigations Officer": "full",
    "Operations Manager": "full",
    "Regional Manager": "full",
    "Guard Officer": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  vehicles: {
    "Fleet Manager": "full",
    "Operations Manager": "view",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  invoices: {
    "Finance Manager": "full",
    "Accountant": "full",
    "Assistant Accountant": "view",
    "Cashier": "view",
    "Internal Auditor": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  expenses: {
    "Finance Manager": "full",
    "Accountant": "full",
    "Assistant Accountant": "view",
    "Cashier": "view",
    "Internal Auditor": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  leads: {
    "Business Development Manager": "full",
    "Sales and Marketing Supervisor": "full",
    "Operations Manager": "view",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  k9s: {
    "K9 Supervisor": "full",
    "K9 Handler": "full",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  hr: {
    "HR Manager": "full",
    "HR Assistant": "full",
    "Records Officer": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  identity: {
    "Records Officer": "full",
    "HR Manager": "view",
    "HR Assistant": "view",
    "IT Officer": "view",
    "General Manager": "view",
    "Director": "view",
  },
  marketing: {
    "Business Development Manager": "full",
    "Sales and Marketing Supervisor": "full",
    "Finance Manager": "view",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  administration: {
    "Administrative Officer": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  it: {
    "IT Officer": "full",
    "General Manager": "view",
    "Director": "view",
  },
  finance: {
    "Finance Manager": "full",
    "Accountant": "full",
    "Assistant Accountant": "full",
    "Cashier": "full",
    "Internal Auditor": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  fleet: {
    "Fleet Manager": "full",
    "Operations Manager": "view",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  roster: {
    "Regional Manager": "full",
    "Operations Manager": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  patrol: {
    "Operations Manager": "full",
    "Regional Manager": "full",
    "Guard Officer": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  requisitions: {
    "Administrative Officer": "full",
    "HR Manager": "full",
    "Finance Manager": "view",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  training: {
    "Training Officer": "full",
    "HR Manager": "full",
    "HR Assistant": "full",
    "Operations Manager": "view",
    "Records Officer": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  recruitment: {
    "HR Manager": "full",
    "HR Assistant": "full",
    "Records Officer": "view",
    "Operations Manager": "full",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  performance: {
    "HR Manager": "full",
    "Operations Manager": "full",
    "Regional Manager": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  workflow: {
    "IT Officer": "full",
    "General Manager": "view",
    "Director": "view",
  },
  documents: {
    "IT Officer": "full",
    "HR Manager": "full",
    "HR Assistant": "full",
    "Records Officer": "full",
    "Finance Manager": "view",
    "Operations Manager": "view",
    "Regional Manager": "view",
    "General Manager": "view",
    "Director": "view",
  },
  campaigns: {
    "Business Development Manager": "full",
    "Sales and Marketing Supervisor": "full",
    "Finance Manager": "view",
    "Operations Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  complaints: {
    "Business Development Manager": "full",
    "Sales and Marketing Supervisor": "full",
    "Operations Manager": "full",
    "Regional Manager": "full",
    "Investigations Officer": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  disciplinary: {
    "HR Manager": "full",
    "HR Assistant": "full",
    "Operations Manager": "full",
    "Regional Manager": "full",
    "Investigations Officer": "full",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  deployments: {
    "Operations Manager": "full",
    "Regional Manager": "full",
    "Business Development Manager": "view",
    "General Manager": "view",
    "Director": "view",
    "IT Officer": "view",
  },
  directorate: {
    "General Manager": "full",
    "Director": "full",
  },
};

/* Server module name → governing client module id.
   Per-user overrides (User.customPermissions) are keyed by client module id so
   the IT Officer grants/revokes whole modules (Operations, HR, Finance …) and
   every server endpoint beneath that module follows the override. */
const SERVER_MODULE_TO_CLIENT: Record<string, string> = {
  guards: "operations",
  armoury: "operations",
  incidents: "operations",
  vehicles: "fleet",
  k9s: "operations",
  roster: "operations",
  patrol: "operations",
  training: "operations",
  deployments: "operations",
  complaints: "operations",
  sites: "clients",
  leads: "marketing",
  invoices: "finance",
  expenses: "finance",
  finance: "finance",
  hr: "hr",
  recruitment: "recruitment",
  performance: "performance_reviews",
  disciplinary: "hr",
  identity: "identity",
  marketing: "marketing",
  campaigns: "marketing",
  administration: "administration",
  requisitions: "administration",
  it: "it",
  workflow: "workflow",
  documents: "documents",
  fleet: "fleet",
  directorate: "dashboard",
};

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
  const base = moduleAccessLevel(moduleName, user.role);
  const overrides = await resolveCustomOverrides(user.userId);
  const clientModule = SERVER_MODULE_TO_CLIENT[moduleName] ?? moduleName;
  const override = overrides[clientModule] ?? overrides[moduleName];
  if (override === "none") return undefined;
  if (override === "view" || override === "full") return override;
  return base;
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
      res.status(403).json({ error: `Access denied: ${user.role} cannot access ${moduleName}` });
      return;
    }
    if (minLevel === "full" && level !== "full") {
      res.status(403).json({ error: `Access denied: ${user.role} has read-only access to ${moduleName}` });
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
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: `Access denied: ${user.role} is not allowed to perform this action` });
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
      res.status(403).json({ error: `Access denied: ${user.role} has no access to any of: ${modules.join(", ")}` });
      return;
    }
    next();
  };
};

/* ─────────────── Auth Routes ─────────────── */

async function seedDatabase() {
  const count = await prisma.user.count();
  if (count > 0) {
    return { message: "Database already seeded" };
  }
  const hashedPassword = await bcrypt.hash("password123", 10);
  await prisma.user.createMany({
    data: [
      { name: "Sarah Akello", email: "sarah.akello@iscms.ug", password: hashedPassword, role: "General Manager", department: "Directorate", region: "Kampala Central" },
      { name: "Emma Muwonge", email: "emma.muwonge@iscms.ug", password: hashedPassword, role: "Operations Manager", department: "Operations", region: "Kampala Central" },
      { name: "Grace Nakato", email: "grace.nakato@iscms.ug", password: hashedPassword, role: "HR Manager", department: "Human Resources", region: "Kampala Central" },
      { name: "David Ssenyonga", email: "david.ssenyonga@iscms.ug", password: hashedPassword, role: "Finance Manager", department: "Finance", region: "Kampala Central" },
      { name: "Joseph Kizza", email: "joseph.kizza@iscms.ug", password: hashedPassword, role: "IT Officer", department: "Information Technology", region: "Kampala Central" },
    ],
  });
  await prisma.region.createMany({
    data: [
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
    ],
  });
}

app.post("/api/auth/seed", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  void seedDatabase().then((result) => {
    res.json(result ?? { message: "Database seeded with 5 users and 13 regions. Use email + password123 to login" });
  });
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password format", details: parsed.error.issues });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const effectiveRole = effectiveRoleFor(user);
  const token = jwt.sign({ userId: user.id, role: effectiveRole }, JWT_SECRET, { expiresIn: "24h" });
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

/* Account provisioning is exclusive to the IT Officer (§28.9). The registered
   account is created in an "Active" state but no session token is issued here —
   the new user signs in through /api/auth/login. */
app.post("/api/auth/register", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const parsed = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
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

app.get("/api/auth/users", authenticateToken, requireModuleAccess("it"), async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true, status: true, region: true, customPermissions: true, actingRole: true, actingExpiresAt: true, actingGrantedBy: true, actingGrantedAt: true, createdAt: true } });
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

/* Time-bound acting-privileges delegation (§5.4). IT Officer (full) only.
   Validation: acting role must be a valid role, not the user's own role, not
   an executive role, and expiry must be a parseable future date. */
app.put("/api/auth/users/:id/acting", authenticateToken, requireModuleAccess("it", "full"), async (req, res) => {
  const { id } = req.params;
  const parsed = z.object({
    actingRole: z.string().min(1),
    expiresAt: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const { actingRole, expiresAt } = parsed.data;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (id === (req as any).user.userId) {
    res.status(400).json({ error: "Acting privileges cannot be granted to yourself" });
    return;
  }
  if (target.role === "IT Officer") {
    res.status(400).json({ error: "Acting privileges cannot be granted to an IT Officer" });
    return;
  }
  if (actingRole === target.role) {
    res.status(400).json({ error: "Acting role must differ from the user's assigned role" });
    return;
  }
  if (!VALID_USER_ROLES.includes(actingRole as (typeof VALID_USER_ROLES)[number])) {
    res.status(400).json({ error: `Invalid acting role: ${actingRole}` });
    return;
  }
  if (actingRole === "IT Officer") {
    res.status(400).json({ error: "Acting IT Officer privileges are not permitted (self-escalation guard)" });
    return;
  }
  if (actingRole === "General Manager" || actingRole === "Director") {
    res.status(400).json({ error: "Executive roles (General Manager / Director) cannot be delegated as acting privileges" });
    return;
  }
  const expires = new Date(expiresAt);
  if (isNaN(expires.getTime())) {
    res.status(400).json({ error: "expiresAt must be a valid date" });
    return;
  }
  if (expires.getTime() <= Date.now()) {
    res.status(400).json({ error: "expiresAt must be in the future" });
    return;
  }
  const actor = await prisma.user.findUnique({ where: { id: (req as any).user.userId }, select: { name: true } });
  const updated = await prisma.user.update({
    where: { id },
    data: { actingRole, actingExpiresAt: expires.toISOString(), actingGrantedBy: actor?.name || "IT Officer", actingGrantedAt: new Date().toISOString() },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action: "Acting Privileges Granted",
      module: "IT Admin",
      details: `IT Officer granted ${target.name} (${target.role}) temporary ${actingRole} acting privileges until ${expires.toISOString()}`,
    },
  });
  res.json({ ...updated, effectiveRole: effectiveRoleFor(updated) });
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
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

function isRegionalManager(user: JwtPayload): boolean {
  return user.role === "Regional Manager";
}

app.get("/api/guards", authenticateToken, requireModuleAccess("guards"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let filtered = await prisma.guard.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) filtered = filtered.filter((g) => g.region === region);
  }
  res.json(filtered);
});

app.post("/api/guards", authenticateToken, async (req, res) => {
  const actorRole = (req as any).user?.role as string | undefined;
  if (!actorRole) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!GUARD_CREATORS.includes(actorRole)) {
    res.status(403).json({ error: `Access denied: guard enrolment is restricted to ${GUARD_CREATORS.join(" and ")}` });
    return;
  }
  const parsed = createGuardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const guard = await prisma.guard.create({
    data: {
      ...parsed.data,
      certifications: ["Basic Security Training", "Crowd Control & Ethics"],
      joinDate: parsed.data.joinDate || new Date().toISOString().split("T")[0],
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action: "Guard Enrolment",
      module: "Guard Personnel",
      details: `Enrolled guard officer ${guard.fullName} (${guard.guardCode}) to ${guard.assignedSite}.`,
    },
  });
  res.status(201).json(guard);
});

app.put("/api/guards/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const actorRole = (req as any).user?.role as string | undefined;
  if (!actorRole) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const isHR = GUARD_CREATORS.includes(actorRole);
  const isRecords = actorRole === "Records Officer";
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
  const guard = await prisma.guard.update({ where: { id }, data: parsed.data });
  res.json(guard);
});

app.put("/api/guards/:id/lifecycle", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!GUARD_LIFECYCLE_ROLES.includes(user.role)) {
    res.status(403).json({ error: `Access denied: ${user.role} cannot move guards through the lifecycle` });
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
    if (terminationCategory === "Terminated" && user.role !== "HR Manager") {
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
        ...(terminationCategory === "Deserted" ? { isDeserter: true, desertionDate: parsed.data.terminationDate || new Date().toISOString().split("T")[0], desertionNotes: desertionNotes ?? null } : {}),
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
          message: `${guard.fullName} (${guard.guardCode}) passed out of the Academy and is ready for deployment.`,
          module: "Operations",
        },
        {
          targetRole: "Regional Manager",
          type: "info",
          title: "Guard Passed Out",
          message: `${guard.fullName} (${guard.guardCode}) passed out of the Academy and is ready for deployment.`,
          module: "Operations",
        },
      ],
    });
  }
  if (terminationCategory) {
    const detail = `${guard.fullName} (${guard.guardCode}) ${terminationCategory.toLowerCase()} by ${user.role}. Reason: ${terminationReason}`;
    await prisma.auditLog.createMany({
      data: [
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${terminationCategory}`, module: "HR", details: detail },
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${terminationCategory}`, module: "Operations", details: detail },
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${terminationCategory}`, module: "Finance", details: detail },
      ],
    });
  }
  res.json(guard);
});

app.put("/api/guards/:id/issue-id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (user.role !== "Records Officer") {
    res.status(403).json({ error: "ID card issuance is the responsibility of the Records Officer" });
    return;
  }
  const parsed = z.object({
    idCardNumber: z.string().min(1),
    idCardExpiryDate: z.string().min(1),
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
      idCardExpiryDate: parsed.data.idCardExpiryDate,
    },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user.userId,
      userRole: user.role,
      action: "ID Card Issued",
      module: "HR",
      details: `Records Officer issued ID ${parsed.data.idCardNumber} to ${guard.fullName} (${guard.guardCode}).`,
    },
  });
  res.json(guard);
});

app.put("/api/guards/:id/archive", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const actorRole = (req as any).user?.role as string | undefined;
  if (!actorRole || (actorRole !== "HR Manager" && actorRole !== "HR Assistant")) {
    res.status(403).json({ error: "Access denied: guard archival is restricted to HR Manager / HR Assistant" });
    return;
  }
  const guard = await prisma.guard.update({
    where: { id },
    data: { status: "Archived", lifecycleStage: "DEPLOYED" },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: actorRole,
      action: "Guard Archived",
      module: "HR",
      details: `Archived guard ${guard.fullName} (${guard.guardCode}).`,
    },
  });
  res.json(guard);
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action: "Guard Hard Deleted",
      module: "HR",
      details: `IT Officer hard-deleted guard ${guard.fullName} (${guard.guardCode}).`,
    },
  });
  res.json({ message: "Guard permanently removed" });
});

/* ─────────────── CRUD: Sites ─────────────── */

app.get("/api/sites", authenticateToken, requireModuleAccess("sites"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  let sites = await prisma.clientSite.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) sites = sites.filter((s) => s.region === region);
  }
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
  if (user.role === "Sales and Marketing Supervisor") {
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
  const site = await prisma.clientSite.create({
    data: { ...parsed.data, wonBy: actorName },
  });
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user.userId,
      userRole: user.role,
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
  const site = await prisma.clientSite.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  const actorName = (await contractActorName(req)) || user.role;
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: user.userId,
      userRole: user.role,
      action: "Site Contract Updated",
      module: "Client CRM",
      details: `Updated contract site ${site.siteName} for ${site.clientName}. Edited by ${actorName}.`,
    },
  });
  res.json(site);
});

/* ─────────────── CRUD: Contracts (Staff + Client SLA Vault) ─────────────── */

const HIGH_VALUE_THRESHOLD = 100_000_000;

const STAFF_CONTRACT_ORIGINATORS = ["HR Manager", "HR Assistant"];
const CLIENT_CONTRACT_ORIGINATORS = ["Business Development Manager", "Sales and Marketing Supervisor"];
/* Roles allowed to read the contract vault — mirrors §9.7: HR (staff contracts),
   Marketing (client contracts), Operations (SLA step), Finance (pricing step),
   Directorate (GM approval), Records Officer (archive), Internal Auditor
   (contract pricing, §28.7) and IT Officer (read-only troubleshooting, §28.9). */
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
  "region", "autoRenew", "paymentTerms", "billingCycle", "slaTerms", "notes", "relatedGuardCode", "scanPages",
];
const CLIENT_CONTRACT_DRAFT_FIELDS = [
  "title", "partyName", "category", "startDate", "endDate", "valueUgx", "documentRef", "managedBy",
  "region", "autoRenew", "paymentTerms", "billingCycle", "slaTerms", "notes", "relatedSiteName", "scanPages",
];
const CONTRACT_ARCHIVAL_FIELDS = ["documentRef", "notes", "managedBy", "scanPages"];

function contractApprovalRolesForStep(step: string): string[] {
  if (step === "BD") return ["Business Development Manager"];
  if (step === "Finance") return ["Finance Manager"];
  if (step === "GM") return ["General Manager"];
  return [];
}

function contractEffectiveStatus(c: { status: string; endDate: string }): string {
  if (["Draft", "Terminated", "Archived", "Pending Renewal"].includes(c.status)) return c.status;
  const today = new Date();
  const end = new Date(c.endDate + "T23:59:59");
  const days = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "Expired";
  if (days <= 60) return "Expiring Soon";
  return c.status;
}

async function contractActorName(req: express.Request): Promise<string> {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) return "System";
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  return dbUser?.name || user.role;
}

async function contractAudit(req: express.Request, action: string, details: string) {
  await prisma.auditLog.create({
    data: {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action,
      module: "HR",
      details,
    },
  });
}

function contractAllowedEditFields(c: { contractType: string; status: string; approvalStep?: string | null }, role: string): string[] {
  if (role === "Records Officer") return CONTRACT_ARCHIVAL_FIELDS;
  if (c.contractType === "Staff Contract") {
    if (role === "HR Manager") return STAFF_CONTRACT_EDIT_FIELDS;
    if (role === "HR Assistant") return c.status === "Draft" ? STAFF_CONTRACT_EDIT_FIELDS : [];
    return [];
  }
  if (role === "Business Development Manager" || role === "Sales and Marketing Supervisor") {
    return c.status === "Draft" ? CLIENT_CONTRACT_DRAFT_FIELDS : ["valueUgx", "paymentTerms", "billingCycle", "slaTerms", "autoRenew", "notes"];
  }
  if (role === "Operations Manager" || role === "Regional Manager") {
    return c.approvalStep === "Operations" ? ["slaTerms", "relatedSiteName", "region", "notes"] : [];
  }
  if (role === "Finance Manager") {
    return c.approvalStep === "Finance" ? ["valueUgx", "paymentTerms", "billingCycle", "slaTerms", "notes"] : [];
  }
  return [];
}

app.get("/api/contracts", authenticateToken, requireAnyRole(...CONTRACT_READ_ROLES), async (_req, res) => {
  const contracts = await prisma.contract.findMany({ orderBy: { endDate: "asc" } });
  res.json(contracts.map((c) => ({ ...c, status: contractEffectiveStatus(c) })));
});

app.post("/api/contracts", authenticateToken, async (req, res) => {
  const parsed = createContractSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const actorRole = (req as any).user?.role as string | undefined;
  if (!actorRole) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const actorName = await contractActorName(req);
  const isClient = parsed.data.contractType === "Client Contract";
  const allowed = isClient ? CLIENT_CONTRACT_ORIGINATORS : STAFF_CONTRACT_ORIGINATORS;
  if (!allowed.includes(actorRole)) {
    res.status(403).json({ error: `Access denied: ${actorRole} cannot create ${parsed.data.contractType}s` });
    return;
  }
  const data: Record<string, unknown> = { ...parsed.data, createdBy: actorName, preparedBy: actorName };
  let action = "Contract Drafted";
  if (isClient) {
    data.status = "Draft";
    data.approvalStep = "BD";
    action = "Client Contract Onboarded";
  } else {
    if (actorRole === "HR Assistant" || !data.status || data.status === "Draft") {
      data.status = "Draft";
      action = "Staff Contract Drafted";
    } else {
      data.status = "Active";
      data.issuedBy = actorName;
      action = "Staff Contract Issued";
    }
  }
  const contract = await prisma.contract.create({ data });
  await contractAudit(req, action, `${action}: '${contract.title}' (${contract.contractCode}) for ${contract.partyName}.`);
  res.status(201).json(contract);
});

app.put("/api/contracts/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const actorRole = (req as any).user?.role as string | undefined;
  if (!actorRole) {
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
    if (actorRole !== "HR Manager") {
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
    const step = existing.approvalStep || "BD";
    const approvers = contractApprovalRolesForStep(step);
    if (!approvers.includes(actorRole)) {
      res.status(403).json({ error: `Access denied: ${actorRole} cannot approve at step '${step}'` });
      return;
    }
    const next =
      step === "BD" ? "Finance"
        : step === "Finance" ? ((existing.valueUgx ?? 0) >= HIGH_VALUE_THRESHOLD ? "GM" : "Done")
        : "Done";
    const data: Record<string, unknown> = { approvalStep: next };
    if (next === "Done") {
      data.status = "Active";
      data.approvedBy = actorName;
      data.approvedAt = new Date().toISOString().split("T")[0];
    }
    const updated = await prisma.contract.update({ where: { id }, data });
    await contractAudit(req, "Contract Approval Advanced", `${actorRole} advanced '${updated.title}' (${updated.contractCode}) to approval step '${next}'.`);
    res.json(updated);
    return;
  }

  if (action === "survey") {
    if (!["Operations Manager", "Regional Manager"].includes(actorRole)) {
      res.status(403).json({ error: `Access denied: ${actorRole} cannot record a site survey` });
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
    await contractAudit(req, "Site Survey Recorded", `${actorRole} recorded a site survey for '${updated.title}' (${updated.contractCode}).`);
    res.json(updated);
    return;
  }

  if (action === "archive") {
    if (actorRole !== "Records Officer") {
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
    if (!voiders.includes(actorRole)) {
      res.status(403).json({ error: `Access denied: ${actorRole} cannot void this contract` });
      return;
    }
    const updated = await prisma.contract.update({ where: { id }, data: { status: "Terminated", voidReason } });
    await contractAudit(req, "Contract Terminated", `${actorRole} terminated '${updated.title}' (${updated.contractCode}). Reason: ${voidReason}`);
    res.json(updated);
    return;
  }

  const parsed = createContractSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const allowedFields = contractAllowedEditFields(existing, actorRole);
  if (allowedFields.length === 0) {
    res.status(403).json({ error: `Access denied: ${actorRole} cannot edit this contract in its current state` });
    return;
  }
  const disallowed = Object.keys(parsed.data).filter((k) => !allowedFields.includes(k));
  if (disallowed.length > 0) {
    res.status(403).json({ error: `Access denied: field(s) not editable by ${actorRole}: ${disallowed.join(", ")}` });
    return;
  }
  const updated = await prisma.contract.update({ where: { id }, data: parsed.data });
  await contractAudit(req, "Contract Updated", `${actorRole} updated '${updated.title}' (${updated.contractCode}).`);
  res.json(updated);
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
      incidentDate: parsed.data.incidentDate || new Date().toISOString().split("T")[0],
    },
  });
  res.status(201).json(incident);
});

app.put("/api/incidents/:id/investigate", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "Investigations Officer") {
    res.status(403).json({ error: "Only the Investigations Officer can open an investigation" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Under Investigation" } });
  res.json(incident);
});

app.put("/api/incidents/:id/escalate", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !INCIDENT_HANDLERS.includes(user.role)) {
    res.status(403).json({ error: "Access denied: cannot escalate this incident" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Escalated" } });
  res.json(incident);
});

app.put("/api/incidents/:id/ops-close", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "Operations Manager") {
    res.status(403).json({ error: "Only the Operations Manager can close escalated incidents" });
    return;
  }
  const { id } = req.params;
  const incident = await prisma.incident.update({ where: { id }, data: { status: "Resolved" } });
  res.json(incident);
});

app.put("/api/incidents/:id/resolve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !INCIDENT_HANDLERS.includes(user.role)) {
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
  const vehicle = await prisma.vehicle.create({
    data: { ...parsed.data, lastServiceDate: new Date().toISOString().split("T")[0] },
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

app.get("/api/invoices", authenticateToken, requireModuleAccess("invoices"), async (_req, res) => {
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
        data: { ...parsed.data, invoiceNumber: invNumber, date: new Date().toISOString().split("T")[0], status: "Draft" },
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
  if (!user || user.role !== "Finance Manager") {
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
  const approver = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: "Pending", approvedBy: approver?.name ?? "Finance Manager", approvedAt: new Date(), sentAt: new Date() },
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
  if ((status === "Paid" || status === "Overdue") && existing.status === "Draft") {
    res.status(400).json({ error: "A Draft invoice must be approved before it can be marked Paid or Overdue" });
    return;
  }
  const data: Record<string, unknown> = { status };
  if (typeof body.clientName === "string") data.clientName = body.clientName;
  if (typeof body.siteName === "string") data.siteName = body.siteName;
  if (typeof body.invoiceNumber === "string") data.invoiceNumber = body.invoiceNumber;
  if (typeof body.amount === "number") data.amount = body.amount;
  if (typeof body.dueDate === "string") data.dueDate = body.dueDate;
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
  if (!user || user.role !== "Finance Manager") {
    res.status(403).json({ error: "Only the Finance Manager can approve expenses" });
    return;
  }
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const overThreshold = existing.amount > 10_000_000;
  const expense = await prisma.expense.update({
    where: { id },
    data: overThreshold
      ? { status: "Pending GM Approval", approvedBy: actorName }
      : { status: "Approved", approvedBy: actorName },
  });
  res.json(expense);
});

app.put("/api/expenses/:id/gm-approve", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "General Manager") {
    res.status(403).json({ error: "Only the General Manager can give final approval on high-value expenses" });
    return;
  }
  const { id } = req.params;
  const actorName = (await contractActorName(req)) || user.role;
  const expense = await prisma.expense.update({ where: { id }, data: { status: "Approved", approvedBy: actorName } });
  res.json(expense);
});

app.put("/api/expenses/:id/reject", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || (user.role !== "Finance Manager" && user.role !== "General Manager")) {
    res.status(403).json({ error: "Only Finance Manager or General Manager can reject expenses" });
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
  if (!user || (user.role !== "Cashier" && user.role !== "Finance Manager")) {
    res.status(403).json({ error: "Only the Cashier (or Finance Manager) can initiate a disbursement" });
    return;
  }
  const parsed = z.object({
    guardName: z.string().min(1),
    guardCode: z.string().min(1),
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
  if (!user || user.role !== "Finance Manager") {
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
  if (!user || user.role !== "Finance Manager") {
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
  if (!user || user.role !== "Business Development Manager") {
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

app.get("/api/armoury-logs", authenticateToken, requireModuleAccess("armoury"), async (_req, res) => {
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
    if (user.role !== role) {
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

app.get("/api/patrol-inspections", authenticateToken, requireModuleAccess("patrol"), async (_req, res) => {
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

app.get("/api/roster", authenticateToken, requireModuleAccess("roster"), async (_req, res) => {
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

app.get("/api/requisitions", authenticateToken, requireModuleAccess("requisitions"), async (_req, res) => {
  const rows = await prisma.adminRequisition.findMany({ orderBy: { createdAt: "desc" } });
  res.json(rows);
});

app.post("/api/requisitions", authenticateToken, requireModuleAccess("requisitions", "full"), async (req, res) => {
  const row = await prisma.adminRequisition.create({
    data: { ...whitelistFields(req.body, REQ_KEYS), status: req.body.status || "Pending Approval" } as any,
  });
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action: "Requisition Approved",
      module: "Administration",
      details: `GM approved requisition ${updated.reqCode} (${updated.itemDescription}, UGX ${updated.estimatedCostUgx}) for ${updated.department}.`,
    },
  });
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
      action: "Requisition Rejected",
      module: "Administration",
      details: `GM rejected requisition ${updated.reqCode} (${updated.itemDescription}). Reason: ${reason}`,
    },
  });
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
        guardCode: forceNumber,
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

/* ─────────────── CRUD: K9 (Write Ops) ─────────────── */

const K9_KEYS = ["name", "breed", "chipNumber", "ageYears", "status", "assignedHandlerId", "assignedHandlerName", "kennelNumber", "rabiesVaccineDate", "lastVetCheck", "specialization", "currentWeightKg", "healthCondition", "vaccinationStatus"];

app.post("/api/k9s", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const code = `K9-2026-${String((await prisma.k9Dog.count()) + 1).padStart(2, "0")}`;
  const row = await prisma.k9Dog.create({ data: { ...whitelistFields(req.body, K9_KEYS), code } as any });
  res.status(201).json(row);
});

app.put("/api/k9s/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
  const row = await prisma.k9Dog.update({ where: { id: req.params.id }, data: whitelistFields(req.body, K9_KEYS) as any });
  res.json(row);
});

app.delete("/api/k9s/:id", authenticateToken, requireModuleAccess("k9s", "full"), async (req, res) => {
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

app.get("/api/audit-logs", authenticateToken, requireAnyRole("IT Officer", "Internal Auditor", "General Manager", "Director"), async (_req, res) => {
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
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: (req as any).user?.userId || "system",
      userRole: (req as any).user?.role || "system",
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

/* ─────────────── CRUD: Leave Requests ─────────────── */

app.get("/api/leave-requests", authenticateToken, requireAnyRole("Guard Officer", "Regional Manager", "Operations Manager", "HR Manager", "HR Assistant"), async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const requests = await prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } });
  if (isRegionalManager(user)) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
    const region = dbUser?.region;
    if (region) {
      const guards = await prisma.guard.findMany({ where: { region }, select: { id: true } });
      const guardIds = new Set(guards.map((g) => g.id));
      res.json(requests.filter((r) => guardIds.has(r.guardId)));
      return;
    }
  }
  if (user.role === "Guard Officer") {
    const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { name: true } });
    const myGuard = await prisma.guard.findFirst({
      where: { OR: [{ linkedUserId: user.userId }, { fullName: me?.name ?? "__none__" }] },
      select: { id: true },
    });
    if (myGuard) {
      res.json(requests.filter((r) => r.guardId === myGuard.id));
      return;
    }
    res.json([]);
    return;
  }
  res.json(requests);
});

app.post("/api/leave-requests", authenticateToken, async (req, res) => {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const allowedRequesters = ["Guard Officer", "Regional Manager", "Operations Manager", "HR Manager", "HR Assistant"];
  if (!allowedRequesters.includes(user.role)) {
    res.status(403).json({ error: `Access denied: ${user.role} cannot submit leave requests` });
    return;
  }
  const parsed = z.object({
    guardId: z.string().min(1),
    guardName: z.string().min(1),
    guardCode: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    durationDays: z.number().int().positive(),
    reason: z.string().min(1),
    reliefGuardName: z.string().optional(),
    reliefGuardCode: z.string().optional(),
    contactAddress: z.string().optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  if (user.role === "Regional Manager") {
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
    },
  });
  res.status(201).json(leave);
});

app.put("/api/leave-requests/:id/approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "Regional Manager") {
    res.status(403).json({ error: "Only a Regional Manager can give the initial leave approval" });
    return;
  }
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  const guard = await prisma.guard.findUnique({ where: { id: existing.guardId } });
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { region: true } });
  if (guard && dbUser?.region && guard.region && guard.region !== dbUser.region) {
    res.status(403).json({ error: "Access denied: this leave request is outside your region" });
    return;
  }
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Pending Ops Approval", approvedBy: user.userId },
  });
  res.json(leave);
});

app.put("/api/leave-requests/:id/ops-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "Operations Manager") {
    res.status(403).json({ error: "Only the Operations Manager can approve at this leave step" });
    return;
  }
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Pending HR Review", approvedBy: user.userId },
  });
  res.json(leave);
});

app.put("/api/leave-requests/:id/hr-approve", authenticateToken, requireModuleAccess("hr", "full"), async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || (user.role !== "HR Manager" && user.role !== "HR Assistant")) {
    res.status(403).json({ error: "Only HR roles can approve at this leave step" });
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
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "Pending GM Approval",
      notes: parsed.success && parsed.data.resumptionDate ? `${existing.notes ? existing.notes + " " : ""}Resumption: ${parsed.data.resumptionDate}` : existing.notes,
      entitlement: parsed.success ? parsed.data.entitlement : undefined,
      taken: parsed.success ? parsed.data.taken : undefined,
      balance: parsed.success ? parsed.data.balance : undefined,
      resumptionDate: parsed.success ? parsed.data.resumptionDate : undefined,
    },
  });
  res.json(leave);
});

app.put("/api/leave-requests/:id/gm-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || (user.role !== "General Manager" && user.role !== "Director")) {
    res.status(403).json({ error: "Only the General Manager can give the final leave approval" });
    return;
  }
  const existing = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Leave request not found" });
    return;
  }
  if (existing.status !== "Pending GM Approval") {
    res.status(400).json({ error: "Leave request must be at the Pending GM Approval stage before final approval" });
    return;
  }
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Approved", gmApprovedBy: user.userId, approvedBy: user.userId },
  });
  res.json(leave);
});

app.put("/api/leave-requests/:id/reject", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !["Regional Manager", "Operations Manager", "HR Manager", "HR Assistant", "General Manager", "Director"].includes(user.role)) {
    res.status(403).json({ error: "Access denied: cannot reject this leave request" });
    return;
  }
  const parsed = z.object({ notes: z.string().optional() }).safeParse(req.body);
  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: { status: "Rejected", notes: parsed.success ? parsed.data.notes : undefined },
  });
  res.json(leave);
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
      steps: { create: steps },
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

/* ─────────────── CRUD: Approvals ─────────────── */

app.get("/api/approvals", authenticateToken, requireModuleAccess("workflow"), async (_req, res) => {
  const approvals = await prisma.approval.findMany({
    include: { actions: { orderBy: { stepOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(approvals);
});

app.post("/api/approvals", authenticateToken, requireModuleAccess("workflow"), async (req, res) => {
  const parsed = z.object({
    workflowId: z.string().min(1),
    referenceType: z.string().min(1),
    referenceId: z.string().min(1),
    requestedBy: z.string().min(1),
    requestedByName: z.string().min(1),
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
    },
  });
  res.status(201).json(approval);
});

app.put("/api/approvals/:id/act", authenticateToken, async (req, res) => {
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
  const workflow = await prisma.workflow.findUnique({ where: { id: approval.workflowId }, include: { steps: { orderBy: { stepOrder: "asc" } } } });
  const currentStepDef = workflow?.steps.find(s => s.stepOrder === approval.currentStep);
  if (!currentStepDef || currentStepDef.approverRole !== user.role) {
    const expectedRole = currentStepDef?.approverRole ?? "an authorized role";
    res.status(403).json({ error: `Access denied: ${user.role} cannot act on this approval; requires ${expectedRole}` });
    return;
  }

  await prisma.approvalAction.create({
    data: {
      approvalId: id,
      stepOrder: approval.currentStep,
      actorRole: user.role,
      actorName: user.userId,
      action: parsed.data.action,
      comment: parsed.data.comment,
      actedAt: new Date(),
    },
  });

  if (parsed.data.action === "Rejected") {
    await prisma.approval.update({ where: { id }, data: { status: "Rejected" } });
    res.json({ status: "Rejected" });
    return;
  }

  if (approval.currentStep >= approval.totalSteps) {
    await prisma.approval.update({ where: { id }, data: { status: "Approved" } });
    res.json({ status: "Approved" });
    return;
  }

  await prisma.approval.update({ where: { id }, data: { currentStep: approval.currentStep + 1 } });
  res.json({ status: `Advanced to step ${approval.currentStep + 1}` });
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
  if (isHRCategory && !HR_DOC_ROLES.includes(user.role)) {
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
    if (doc.category && HR_CATEGORIES.some((c) => doc.category.toUpperCase().includes(c.toUpperCase())) && !HR_DOC_ROLES.includes(user.role)) {
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
    interviewScores: z.record(z.number()).optional(),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }
  const candidate = await prisma.candidate.create({
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
    interviewScores: z.record(z.number()).optional(),
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
  const candidate = await prisma.candidate.update({ where: { id }, data: parsed.data });

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
    guardCode: z.string().min(1),
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
  if (!user || user.role !== "Finance Manager") {
    res.status(403).json({ error: "Only the Finance Manager can approve campaign budgets" });
    return;
  }
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  const actorName = (await contractActorName(req)) || user.role;
  const overThreshold = existing.budget > 10_000_000;
  const campaign = await prisma.campaign.update({
    where: { id },
    data: overThreshold
      ? { budgetStatus: "Pending GM Approval", budgetApprovedBy: actorName }
      : { budgetStatus: "Approved", budgetApprovedBy: actorName, budgetApprovedAt: new Date().toISOString().split("T")[0] },
  });
  res.json(campaign);
});

app.put("/api/campaigns/:id/gm-approve", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "General Manager") {
    res.status(403).json({ error: "Only the General Manager can give final approval on campaign budgets above threshold" });
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
  if (!user || user.role === "Director") {
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
      status: "Under Investigation",
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
    guardCode: z.string().min(1),
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
  if (!user || user.role !== "Regional Manager") {
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
  if (!user || user.role !== "Operations Manager") {
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
  if (!user || user.role !== "HR Manager") {
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
        ...(category === "Desertion" ? { isDeserter: true, desertionDate: new Date().toISOString().split("T")[0] } : {}),
      },
    });
    const detail = `${existing.guardName} (${existing.guardCode}) ${category.toLowerCase()} after disciplinary chain. Reason: ${existing.reason}`;
    await prisma.auditLog.createMany({
      data: [
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${category}`, module: "HR", details: detail },
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${category}`, module: "Operations", details: detail },
        { timestamp: new Date().toISOString().replace("T", " ").substring(0, 19), userName: user.userId, userRole: user.role, action: `Guard ${category}`, module: "Finance", details: detail },
      ],
    });
  }
  res.json(action);
});

app.put("/api/disciplinary/:id/reject", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || !["Regional Manager", "Operations Manager", "HR Manager"].includes(user.role)) {
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
  if (!["Operations Manager", "Regional Manager"].includes(user.role)) {
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
    prisma.incident.count({ where: { status: { in: ["Open", "Under Investigation"] } } }),
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
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [{ userId: user.userId }, { targetRole: user.role }],
    },
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

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Unhandled route error:", err);
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

startServer().catch(console.error);
