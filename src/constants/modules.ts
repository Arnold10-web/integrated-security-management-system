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
  BarChart3,
  FileText,
  Briefcase,
  GitBranch,
  Star,
  CreditCard,
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
  /** True for cross-functional utility pages (shown in the secondary menu). */
  utility?: boolean;
}

export interface ModuleGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  utility?: boolean;
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
  { id: "investigations", label: "Investigations", icon: Search },
  { id: "hr", label: "Human Resources", icon: Users },
  { id: "marketing", label: "Marketing & Sales", icon: TrendingUp },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "administration", label: "Administration", icon: Building2 },
  { id: "it", label: "IT & Systems", icon: Server },
  { id: "utilities", label: "Utilities", icon: BarChart3, utility: true },
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
    badge: "ARMOURY · CANINE · FLEET",
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
    id: "hr",
    path: "/hr",
    label: "Human Resources",
    department: "HR",
    icon: Users,
    group: "hr",
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
    id: "clients",
    path: "/clients",
    label: "Client & Sites CRM",
    department: "CRM",
    icon: Building,
    group: "marketing",
  },
  {
    id: "finance",
    path: "/finance",
    label: "Finance & Cashier",
    department: "Finance",
    icon: DollarSign,
    group: "finance",
  },
  {
    id: "marketing",
    path: "/marketing",
    label: "Marketing & Sales",
    department: "Marketing",
    icon: TrendingUp,
    group: "marketing",
  },
  {
    id: "fleet",
    path: "/fleet",
    label: "Fleet",
    department: "Operations",
    icon: Car,
    group: "operations",
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
    id: "reports",
    path: "/reports",
    label: "Reports & Analytics",
    department: "All",
    icon: BarChart3,
    group: "utilities",
    utility: true,
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
    department: "All",
    icon: FileText,
    group: "utilities",
    utility: true,
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
    id: "performance_reviews",
    path: "/performance-reviews",
    label: "Performance Reviews",
    department: "HR",
    icon: Star,
    group: "hr",
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
      return ["dashboard", "operations", "hr", "identity", "clients", "finance", "marketing", "fleet", "administration", "reports", "performance_reviews"];

    case "HR Manager":
    case "HR Assistant":
    case "Records Officer":
      return ["hr", "identity", "recruitment", "performance_reviews", "documents"];

    case "Business Development Manager":
    case "Sales and Marketing Supervisor":
      return ["marketing", "clients"];

    case "Operations Manager":
      return ["operations", "fleet", "clients", "performance_reviews", "investigations", "recruitment", "reports"];
    case "Regional Manager":
      return ["operations", "fleet", "investigations"];
    case "Fleet Manager":
      return ["operations", "fleet"];
    case "Training Officer":
      return ["operations"];
    case "Armorer":
      return ["operations"];
    case "Investigations Officer":
      return ["investigations"];
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
      return ["finance"];

    case "Administrative Officer":
      return ["administration"];

    case "IT Officer":
      return ["it", "workflow", "documents", "identity"];

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
