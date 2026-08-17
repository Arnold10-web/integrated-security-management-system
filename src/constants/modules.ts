/**
 * Application module / route catalog.
 * Route paths enable deep linking.
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Clock,
  Users,
  Building,
  DollarSign,
  TrendingUp,
  Car,
  Building2,
  Server,
  ShieldAlert,
  Search,
  FileText,
  Briefcase,
  Receipt,
  CreditCard,
  Target,
  GitBranch,
  Star,
  CreditCard,
  BarChart3,
  Scale,
  Award,
  Calendar,
  Banknote,
  Fuel,
  Wrench,
  ClipboardCheck,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import type { UserRole } from "../types";

export interface AppModule {
  id: string;
  path: string;
  label: string;
  department: string;
  icon: LucideIcon;
  badge?: string;
  /** Department group this module is presented under in navigation. */
  group: string;
}

export interface ModuleGroup {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Department-first navigation groups.
 * Modules are presented under these groups in the shell; each group maps to a
 * department in the organizational structure (constitution §7). The
 * `utilities` group holds cross-functional tools that are secondary to the
 * primary department workflow.
 */
export const APP_MODULE_GROUPS: ModuleGroup[] = [
  { id: "directorate", label: "Directorate", icon: LayoutDashboard },
  { id: "operations", label: "Operations", icon: Clock },
  { id: "fleet", label: "Fleet", icon: Car },
  { id: "investigations", label: "Investigations", icon: Search },
  { id: "hr", label: "Human Resources", icon: Users },
  { id: "marketing", label: "Marketing & Sales", icon: TrendingUp },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "administration", label: "Administration", icon: Building2 },
  { id: "it", label: "IT & Systems", icon: Server },
];

export const APP_MODULES: AppModule[] = [
  {
    id: "dashboard",
    path: "/directorate",
    label: "Executive Directorate",
    department: "Directorate",
    icon: LayoutDashboard,
    group: "directorate",
  },
  {
    id: "operations",
    path: "/operations",
    label: "Operations",
    department: "Operations",
    icon: Clock,
    badge: "ARMOURY · CANINE",
    group: "operations",
  },
  {
    id: "investigations",
    path: "/investigations",
    label: "Investigations",
    department: "Investigations",
    icon: Search,
    group: "investigations",
  },
  {
    id: "identity",
    path: "/identity",
    label: "Identity Cards",
    department: "Records",
    icon: CreditCard,
    badge: "PHOTO · SIGNATURE · PRINT",
    group: "hr",
  },
  {
    id: "hr_register",
    path: "/hr/register",
    label: "Register",
    department: "HR",
    icon: Users,
    group: "hr",
  },
  {
    id: "hr_leave",
    path: "/hr/leave",
    label: "Leave Tracker",
    department: "HR",
    icon: Clock,
    group: "hr",
  },
  {
    id: "hr_appraisals",
    path: "/hr/appraisals",
    label: "Staff Appraisals",
    department: "HR",
    icon: Star,
    group: "hr",
  },
  {
    id: "hr_contracts",
    path: "/hr/contracts",
    label: "Contracts",
    department: "HR",
    icon: FileText,
    group: "hr",
  },
  {
    id: "hr_remittances",
    path: "/hr/remittances",
    label: "Remittances",
    department: "HR",
    icon: Banknote,
    group: "hr",
  },
  {
    id: "hr_staff",
    path: "/hr/staff",
    label: "Staff",
    department: "HR",
    icon: Users,
    group: "hr",
  },
  {
    id: "hr_payroll",
    path: "/hr/payroll",
    label: "Payroll",
    department: "HR",
    icon: DollarSign,
    group: "hr",
  },
  {
    id: "finance",
    path: "/finance",
    label: "Overview",
    department: "Finance",
    icon: DollarSign,
    group: "finance",
  },
  {
    id: "finance_invoices",
    path: "/finance/invoices",
    label: "Invoices",
    department: "Finance",
    icon: Receipt,
    group: "finance",
  },
  {
    id: "finance_expenses",
    path: "/finance/expenses",
    label: "Expenses",
    department: "Finance",
    icon: CreditCard,
    group: "finance",
  },
  {
    id: "finance_cashier",
    path: "/finance/cashier",
    label: "Cashier Ledger",
    department: "Finance",
    icon: DollarSign,
    badge: "Advances",
    group: "finance",
  },
  {
    id: "finance_contracts",
    path: "/finance/contracts",
    label: "Contracts",
    department: "Finance",
    icon: FileText,
    group: "finance",
  },
  {
    id: "marketing",
    path: "/marketing",
    label: "Overview",
    department: "Marketing",
    icon: TrendingUp,
    group: "marketing",
  },
  {
    id: "marketing_pipeline",
    path: "/marketing/pipeline",
    label: "Pipeline",
    department: "Marketing",
    icon: Target,
    group: "marketing",
  },
  {
    id: "marketing_campaigns",
    path: "/marketing/campaigns",
    label: "Campaigns",
    department: "Marketing",
    icon: BarChart3,
    group: "marketing",
  },
  {
    id: "clients",
    path: "/clients",
    label: "Client & Sites CRM",
    department: "CRM",
    icon: Building,
    group: "marketing",
  },
  {
    id: "fleet",
    path: "/fleet",
    label: "Overview",
    department: "Fleet",
    icon: Car,
    group: "fleet",
  },
  {
    id: "fleet_register",
    path: "/fleet/register",
    label: "Fleet Register",
    department: "Fleet",
    icon: Car,
    group: "fleet",
  },
  {
    id: "fleet_trips",
    path: "/fleet/trips",
    label: "Trips & Journeys",
    department: "Fleet",
    icon: Clock,
    group: "fleet",
  },
  {
    id: "fleet_fuel",
    path: "/fleet/fuel",
    label: "Fuel Control",
    department: "Fleet",
    icon: Fuel,
    group: "fleet",
  },
  {
    id: "fleet_maintenance",
    path: "/fleet/maintenance",
    label: "Maintenance",
    department: "Fleet",
    icon: Wrench,
    group: "fleet",
  },
  {
    id: "fleet_drivers",
    path: "/fleet/drivers",
    label: "Drivers",
    department: "Fleet",
    icon: Users,
    group: "fleet",
  },
  {
    id: "fleet_inspections",
    path: "/fleet/inspections",
    label: "Daily Inspections",
    department: "Fleet",
    icon: ClipboardCheck,
    group: "fleet",
  },
  {
    id: "fleet_breakdowns",
    path: "/fleet/breakdowns",
    label: "Breakdowns",
    department: "Fleet",
    icon: AlertTriangle,
    group: "fleet",
  },
  {
    id: "fleet_requests",
    path: "/fleet/requests",
    label: "Transport Requests",
    department: "Fleet",
    icon: ClipboardCheck,
    group: "fleet",
  },
  {
    id: "fleet_gps",
    path: "/fleet/gps",
    label: "GPS & Security",
    department: "Fleet",
    icon: MapPin,
    group: "fleet",
  },
  {
    id: "administration",
    path: "/administration",
    label: "Administration",
    department: "Admin",
    icon: Building2,
    group: "administration",
  },
  {
    id: "it",
    path: "/it",
    label: "Information Technology (IT)",
    department: "IT Admin",
    icon: Server,
    group: "it",
  },
  {
    id: "guard_portal",
    path: "/guard-portal",
    label: "Guard Portal",
    department: "Operations",
    icon: ShieldAlert,
    group: "operations",
  },
  {
    id: "recruitment",
    path: "/recruitment",
    label: "Recruitment & Staffing",
    department: "HR",
    icon: Briefcase,
    group: "hr",
  },
  {
    id: "documents",
    path: "/documents",
    label: "Document Management",
    department: "Records",
    icon: FileText,
    group: "hr",
  },
  {
    id: "workflow",
    path: "/workflow",
    label: "Workflow Engine",
    department: "IT Admin",
    icon: GitBranch,
    group: "it",
  },
  {
    id: "esign",
    path: "/esign",
    label: "E-Contracts",
    department: "Legal & Contracts",
    icon: FileText,
    group: "administration",
  },
  {
    id: "reports",
    path: "/reports",
    label: "Reports",
    department: "Directorate",
    icon: BarChart3,
    group: "directorate",
  },
  {
    id: "disciplinary",
    path: "/disciplinary",
    label: "Disciplinary Actions",
    department: "HR",
    icon: Scale,
    group: "hr",
    badge: "Cat 1 · Cat 2",
  },
  {
    id: "records_contracts",
    path: "/records/contracts",
    label: "Contracts",
    department: "Records",
    icon: FileText,
    group: "hr",
    badge: "Inquiries",
  },
];

/**
 * Strict departmental module access by role (client-side gate).
 * Server-side RBAC must mirror this once API auth is enforced.
 */
export function getAllowedModuleIds(role: UserRole): string[] {
  switch (role) {
    case "General Manager":
    case "Director":
      return ["dashboard", "reports", "esign"];

    case "HR Manager":
      return ["hr_register", "hr_leave", "hr_appraisals", "hr_contracts", "hr_remittances", "hr_staff", "hr_payroll", "disciplinary", "recruitment"];
    case "HR Assistant":
      return ["hr_register", "hr_leave", "hr_appraisals", "hr_contracts", "hr_remittances", "hr_staff", "hr_payroll", "recruitment"];

    case "Records Officer":
      return ["identity", "hr_register", "hr_staff", "records_contracts", "documents"];

    case "Business Development Manager":
    case "Sales and Marketing Supervisor":
      return ["marketing", "marketing_pipeline", "marketing_campaigns", "clients", "esign"];

    case "Operations Manager":
      return ["operations", "disciplinary"];
    case "Regional Manager":
      return ["operations", "disciplinary"];
    case "Fleet Manager":
      return ["fleet", "fleet_requests", "fleet_register", "fleet_trips", "fleet_fuel", "fleet_maintenance", "fleet_drivers", "fleet_inspections", "fleet_breakdowns", "fleet_gps"];
    case "Training Officer":
      return ["operations"];
    case "Armorer":
      return ["operations"];
    case "Investigations Officer":
      return ["investigations", "disciplinary"];
    case "K9 Supervisor":
    case "K9 Handler":
      return ["operations"];

    case "Guard Officer":
      return ["guard_portal"];

    case "Finance Manager":
    case "Accountant":
    case "Assistant Accountant":
    case "Internal Auditor":
    case "Cashier":
      return ["finance", "finance_invoices", "finance_expenses", "finance_cashier", "finance_contracts"];

    case "Administrative Officer":
      return ["administration"];

    case "IT Officer":
      return ["it", "workflow", "identity", "esign"];

    default:
      return ["dashboard"];
  }
}

/**
 * Effective module access = role default + per-user overrides (granted by IT).
 * Overrides are keyed by client module id (APP_MODULES) with values:
 *   "view"  → add module access
 *   "full"  → add module access (full permission)
 *   "none"  → explicitly revoke the module even if the role grants it
 * Missing keys inherit the role default.
 */
export function getEffectiveModuleIds(
  role: UserRole,
  customPermissions?: Record<string, "view" | "full" | "none">
): string[] {
  const base = new Set(getAllowedModuleIds(role));
  if (customPermissions) {
    for (const [moduleId, level] of Object.entries(customPermissions)) {
      if (level === "none") {
        base.delete(moduleId);
      } else if (level === "view" || level === "full") {
        base.add(moduleId);
      }
    }
  }
  return Array.from(base);
}

/**
 * §11.4 additive module gating: while acting in another role the user keeps
 * their own modules AND gains the acting role's. This is the union of the base
 * role's module set and the acting role's module set, then overrides applied.
 */
export function getAdditiveModuleIds(
  role: UserRole,
  actingRole: UserRole | undefined,
  customPermissions?: Record<string, "view" | "full" | "none">
): string[] {
  const base = new Set<string>(getAllowedModuleIds(role));
  if (actingRole && actingRole !== role) {
    for (const id of getAllowedModuleIds(actingRole)) base.add(id);
  }
  if (customPermissions) {
    for (const [moduleId, level] of Object.entries(customPermissions)) {
      if (level === "none") {
        base.delete(moduleId);
      } else if (level === "view" || level === "full") {
        base.add(moduleId);
      }
    }
  }
  return Array.from(base);
}

export function getModuleById(id: string): AppModule | undefined {
  return APP_MODULES.find((m) => m.id === id);
}

export function getGroupById(id: string): ModuleGroup | undefined {
  return APP_MODULE_GROUPS.find((g) => g.id === id);
}

export function getModulesByGroup(groupId: string): AppModule[] {
  return APP_MODULES.filter((m) => m.group === groupId);
}

export function getModuleByPath(path: string): AppModule | undefined {
  return APP_MODULES.find((m) => m.path === path || (m.path !== "/" && path.startsWith(m.path + "/")));
}

export function getDefaultPathForRole(role: UserRole): string {
  const allowed = getAllowedModuleIds(role);
  const mod = getModuleById(allowed[0] ?? "dashboard");
  return mod?.path ?? "/directorate";
}
