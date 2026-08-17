/**
 * Organizational hierarchy for ISCMS.
 * When business rules are unclear, this structure decides data ownership
 * and approval authority (see constitution §7).
 */

import type { UserRole } from "../types";

export type DepartmentCode =
  | "directorate"
  | "hr"
  | "marketing"
  | "operations"
  | "fleet"
  | "investigations"
  | "finance"
  | "administration"
  | "it"
  | "field";

export interface OrgRoleNode {
  role: UserRole;
  title: string;
  reportsTo?: UserRole;
  description: string;
}

/** Non-login field rank chain (e.g. Guard → Site In-Charge → Inspector). */
export interface FieldRankNode {
  rank: string;
  reportsTo?: string;
  description: string;
}

export interface DepartmentDefinition {
  code: DepartmentCode;
  name: string;
  /** Primary module route ids this department owns or uses. */
  primaryModules: string[];
  headRole: UserRole;
  structure: OrgRoleNode[];
  /** Rank ladder (Guard → Site In-Charge → Inspector → Regional Manager). */
  fieldLadder?: FieldRankNode[];
  /** Preferred name — alias for fieldLadder kept for backward compat. */
  rankLadder?: FieldRankNode[];
  notes?: string;
}

/**
 * Directorate layer — strategic oversight, KPIs, approvals.
 */
export const DIRECTORATE: DepartmentDefinition = {
  code: "directorate",
  name: "Executive Directorate",
  primaryModules: ["dashboard"],
  headRole: "General Manager",
  structure: [
    {
      role: "General Manager",
      title: "General Manager",
      description: "Overall executive authority, company-wide KPIs, final approvals.",
    },
    {
      role: "Director",
      title: "Director",
      reportsTo: "General Manager",
      description: "Board/directorate oversight, strategic review, exception escalations.",
    },
  ],
  notes:
    "Directorate has its own view (Executive Dashboard). It reviews departmental modules and approves but does not edit day-to-day operational data.",
};

/**
 * Operations hierarchy (clarified):
 * Operations Manager
 *   ├── Regional Managers
 *   ├── Armorers
 *   ├── Canine Unit (K9 Supervisor / Handlers)
 *   └── Training Officer
 *
 * Supporting field roles (Guard Officer, etc.) sit under Regional Managers
 * for deployment execution.
 *
 * NOTE: Fleet is an INDEPENDENT department (see FLEET) — the Fleet Manager
 * is no longer a direct report of the Operations Manager.
 * NOTE: Investigations is an INDEPENDENT department (see INVESTIGATIONS).
 * It is not under Operations — it only shares incident/complaint information
 * with Operations for escalation and approval purposes.
 */
export const OPERATIONS: DepartmentDefinition = {
  code: "operations",
  name: "Operations Department",
  primaryModules: ["operations"],
  headRole: "Operations Manager",
  structure: [
    {
      role: "Operations Manager",
      title: "Operations Manager (Department Head)",
      description:
        "Overall head of Operations. Owns deployment, attendance, shifts, armoury, and canine unit.",
    },
    {
      role: "Regional Manager",
      title: "Regional Manager",
      reportsTo: "Operations Manager",
      description: "Regional oversight of their assigned region; guard deployment, attendance, and shift rosters.",
    },
    {
      role: "Armorer",
      title: "Armorer",
      reportsTo: "Operations Manager",
      description: "Firearm vault issue/return, chain of custody, ballistic accountability. Multiple armorers supported per region and per office location.",
    },
    {
      role: "K9 Supervisor",
      title: "Canine Unit Lead",
      reportsTo: "Operations Manager",
      description: "Canine unit supervision, handler pairing, health and deployment certification.",
    },
    {
      role: "K9 Handler",
      title: "K9 Handler",
      reportsTo: "K9 Supervisor",
      description: "Field handler paired with assigned canine.",
    },
    {
      role: "Training Officer",
      title: "Training Officer",
      reportsTo: "Operations Manager",
      description: "Training academy cohorts, pass-out, and operational readiness.",
    },
    {
      role: "Guard Officer",
      title: "Guard",
      reportsTo: "Regional Manager",
      description: "Front-line security officer; uses Guard Portal only.",
    },
  ],
  fieldLadder: [


    {
      rank: "Guard",
      description: "Front-line security officer rostered to a client site post.",
    },
    {
      rank: "Site In-Charge",
      reportsTo: "Guard",
      description:
        "Leads a single site post (assignedSite = their site); supervises the guards rostered to that post.",
    },
    {
      rank: "Inspector",
      reportsTo: "Site In-Charge",
      description:
        "Supervises the sites across a zone (zone = site zone) within a region; inspects posts and rosters.",
    },
    {
      rank: "Regional Manager",
      reportsTo: "Inspector",
      description: "Regional oversight of all zones, sites and ranks within their assigned region.",
    },
  ],
  notes:
    "Fleet is an independent department (see FLEET) — the Fleet Manager reports directly to the Directorate, not to Operations. Armorers are not limited to a single post — the system supports as many as needed across regions and office locations. Investigations is a separate department (see INVESTIGATIONS). Field rank ladder (Guard → Site In-Charge → Inspector → Regional Manager) reflects the supervision chain encoded on Guard records via designation and zone.",
};

/**
 * Fleet department (independent — was previously nested under Operations).
 * Owns vehicles, trips, fuel logs, maintenance, drivers, inspections and
 * breakdowns; reports directly to the Directorate.
 */
export const FLEET: DepartmentDefinition = {
  code: "fleet",
  name: "Fleet Department",
  primaryModules: ["fleet"],
  headRole: "Fleet Manager",
  structure: [
    {
      role: "Fleet Manager",
      title: "Fleet Manager (Department Head)",
      description: "Owns the vehicle & motorcycle register, fuel, maintenance, inspections, driver/rider roster, and transport request approval.",
    },
  ],
  notes:
    "Fleet is an independent top-level department. The Fleet Manager reports directly to the Directorate — not to the Operations Manager.",
};

/**
 * Investigations department (independent):
 * Investigations Officer heads the department. It is NOT under Operations —
 * it shares incident/complaint information with Operations for escalation
 * and approval, but is organizationally independent.
 */
export const INVESTIGATIONS: DepartmentDefinition = {
  code: "investigations",
  name: "Investigations Department",
  primaryModules: ["investigations"],
  headRole: "Investigations Officer",
  structure: [
    {
      role: "Investigations Officer",
      title: "Investigations Officer (Department Head)",
      description:
        "Independent internal investigations — incident logbook, case tracking, evidence, complaints referred for investigation, and disciplinary charge-sheet initiation. Shares information with Operations but is not under Operations.",
    },
  ],
  notes:
    "Investigations is an independent department. It shares information with Operations (incident escalations, disciplinary charge sheets, referred complaints), but reports directly to the Directorate rather than under Operations.",
};

export const HR: DepartmentDefinition = {
  code: "hr",
  name: "Human Resources",
  primaryModules: ["hr"],
  headRole: "HR Manager",
  structure: [
    { role: "HR Manager", title: "HR Manager", description: "Employee records, contracts, discipline, leave, performance source data." },
    { role: "HR Assistant", title: "HR Assistant", reportsTo: "HR Manager", description: "Day-to-day HR processing and records support." },
    { role: "Records Officer", title: "Records Officer", reportsTo: "HR Manager", description: "Personnel file integrity and archival." },
  ],
};

export const MARKETING: DepartmentDefinition = {
  code: "marketing",
  name: "Marketing & Sales",
  primaryModules: ["marketing", "clients"],
  headRole: "Business Development Manager",
  structure: [
    { role: "Business Development Manager", title: "Business Development Manager", description: "Leads, pipeline, client engagement." },
    { role: "Sales and Marketing Supervisor", title: "Sales and Marketing Supervisor", reportsTo: "Business Development Manager", description: "Campaigns, market outreach, and sales pipeline execution." },
  ],
};

export const FINANCE: DepartmentDefinition = {
  code: "finance",
  name: "Finance",
  primaryModules: ["finance"],
  headRole: "Finance Manager",
  structure: [
    { role: "Finance Manager", title: "Finance Manager", description: "Invoices, expenses, budgeting, financial reporting." },
    { role: "Accountant", title: "Accountant", reportsTo: "Finance Manager", description: "Books, reconciliations, reporting." },
    { role: "Assistant Accountant", title: "Assistant Accountant", reportsTo: "Accountant", description: "Transaction support." },
    { role: "Internal Auditor", title: "Internal Auditor", reportsTo: "Finance Manager", description: "Independent financial controls review." },
    { role: "Cashier", title: "Cashier", reportsTo: "Finance Manager", description: "Advances, food, rent, loans, petty cash." },
  ],
};

export const ADMINISTRATION: DepartmentDefinition = {
  code: "administration",
  name: "Administration",
  primaryModules: ["administration"],
  headRole: "Administrative Officer",
  structure: [
    {
      role: "Administrative Officer",
      title: "Administrative Officer",
      description: "Uniforms, shoes, equipment inventory and issuance (distinct from IT assets).",
    },
  ],
};

export const IT: DepartmentDefinition = {
  code: "it",
  name: "Information Technology",
  primaryModules: ["it", "workflow", "documents"],
  headRole: "IT Officer",
  structure: [
    {
      role: "IT Officer",
      title: "IT Officer (Systems Overseer)",
      description: "Users, roles, rights, system health, IT hardware/software assets, PVC ID coordination, technical administration, backups, server monitoring, support tickets, workflow configuration, document management.",
    },
  ],
  notes:
    "IT Officer handles all IT departmental functions — system administration, user management, role creation, server monitoring, support, and IT asset management. IT owns laptops, radios, devices, and licences — distinct from Administration uniform/shoe inventory.",
};

export const ALL_DEPARTMENTS: DepartmentDefinition[] = [
  DIRECTORATE,
  OPERATIONS,
  FLEET,
  INVESTIGATIONS,
  HR,
  MARKETING,
  FINANCE,
  ADMINISTRATION,
  IT,
];

export function getDepartmentForRole(role: UserRole): DepartmentDefinition | undefined {
  return ALL_DEPARTMENTS.find((dept) => dept.structure.some((n) => n.role === role));
}

export function getDirectReports(role: UserRole): OrgRoleNode[] {
  const dept = getDepartmentForRole(role);
  if (!dept) return [];
  return dept.structure.filter((n) => n.reportsTo === role);
}

export function getRoleNode(role: UserRole): OrgRoleNode | undefined {
  for (const dept of ALL_DEPARTMENTS) {
    const node = dept.structure.find((n) => n.role === role);
    if (node) return node;
  }
  return undefined;
}
