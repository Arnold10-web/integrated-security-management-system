/**
 * Client-side RBAC helpers.
 * NOTE: This is a presentation gate only. True enforcement must live on the
 * Express API with JWT + middleware.
 */

import type { UserRole } from "../types";
import { getAllowedModuleIds, getEffectiveModuleIds, getModuleById } from "../constants/modules";
import { getDepartmentForRole, getRoleNode } from "../constants/organization";

export interface ModulePermission {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

/* Effective role resolution (§5.4): while a granted acting role is unexpired
   the user operates under it (server resolves at sign-in and signs the JWT
   with the acting role). Client mirrors this for presentation gating. */
export function getEffectiveRole(user: { role: UserRole; effectiveRole?: UserRole; actingRole?: UserRole; actingExpiresAt?: string }): UserRole {
  if (user.effectiveRole) return user.effectiveRole;
  if (user.actingRole && user.actingExpiresAt) {
    const expiresAt = new Date(user.actingExpiresAt);
    if (!isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now()) {
      return user.actingRole;
    }
  }
  return user.role;
}

export function isActingInRole(user: { role: UserRole; effectiveRole?: UserRole; actingRole?: UserRole; actingExpiresAt?: string }, role: UserRole): boolean {
  return getEffectiveRole(user) === role && user.actingRole !== undefined && user.role !== role;
}

/* ── Shared role sets (single source of truth for view-level gating) ── */
export const EXECUTIVE_ROLES: UserRole[] = ["General Manager", "Director"];
export const HR_STAFF_ROLES: UserRole[] = ["HR Manager", "HR Assistant", "Records Officer"];
export const HR_APPROVER_ROLES: UserRole[] = ["HR Manager", "HR Assistant"];
export const GUARD_APPRAISAL_ROLES: UserRole[] = ["HR Manager", "Operations Manager", "Regional Manager"];
export const OPS_MANAGEMENT_ROLES: UserRole[] = ["Operations Manager", "Regional Manager"];
export const MARKETING_ROLES: UserRole[] = ["Business Development Manager", "Sales and Marketing Supervisor"];
export const ARMOURY_OPERATOR_ROLES: UserRole[] = ["Armorer", "Operations Manager"];
export const K9_OPERATOR_ROLES: UserRole[] = ["K9 Supervisor", "K9 Handler"];
export const TRAINING_OFFICER_ROLES: UserRole[] = ["Training Officer"];
export const FINANCE_INVOICE_ROLES: UserRole[] = ["Finance Manager", "Accountant"];
export const FINANCE_CASHIER_ROLES: UserRole[] = ["Cashier", "Finance Manager"];
export const FINANCE_CONTRACT_APPROVER_ROLES: UserRole[] = ["Finance Manager"];
export const FINANCE_VIEW_ROLES: UserRole[] = ["Finance Manager", "Accountant", "Assistant Accountant", "Internal Auditor", "Cashier"];
export const COLLECTIONS_VIEW_ROLES: UserRole[] = [...FINANCE_VIEW_ROLES, ...MARKETING_ROLES];
export const ADMIN_REQUISITION_ROLES: UserRole[] = ["Administrative Officer", "Operations Manager", "Regional Manager"];
export const CANDIDATE_REVIEW_ROLES: UserRole[] = [...HR_STAFF_ROLES, ...OPS_MANAGEMENT_ROLES];
export const DESERTION_REPORTING_ROLES: UserRole[] = [...OPS_MANAGEMENT_ROLES, ...HR_APPROVER_ROLES];
export const DEPLOYMENT_OPERATIONS_ROLES: UserRole[] = ["Operations Manager", "Regional Manager", "Armorer", "K9 Supervisor"];

export function isRoleIn(role: UserRole | undefined, roles: UserRole[]): boolean {
  return role !== undefined && roles.includes(role);
}

const FULL_EDIT_ROLES: UserRole[] = [
  "HR Manager",
  "Finance Manager",
  "IT Officer",
];

export function canAccessModule(
  role: UserRole,
  moduleId: string,
  customPermissions?: Record<string, "view" | "full" | "none">
): boolean {
  return getEffectiveModuleIds(role, customPermissions).includes(moduleId);
}

export function getPermissionsForRole(
  role: UserRole,
  moduleName: string,
  customPermissions?: Record<string, "view" | "full" | "none">
): ModulePermission {
  if (!canAccessModule(role, moduleName, customPermissions) && moduleName !== "inventory") {
    // Allow limited cross-module inventory checks for specialist roles below
    const specialist =
      role === "Armorer" && (moduleName === "armoury" || moduleName === "inventory");
    const k9 =
      (role === "K9 Supervisor" || role === "K9 Handler") &&
      (moduleName === "k9" || moduleName === "inventory");
    if (!specialist && !k9) {
      return { canView: false, canEdit: false, canDelete: false, canApprove: false };
    }
  }

  const override = customPermissions?.[moduleName];
  if (override === "none") {
    return { canView: false, canEdit: false, canDelete: false, canApprove: false };
  }
  if (override === "full") {
    return { canView: true, canEdit: true, canDelete: true, canApprove: true };
  }
  if (override === "view") {
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (EXECUTIVE_ROLES.includes(role)) {
    // Directorate reviews KPIs; full approve authority, limited day-to-day edit on ops modules
    if (moduleName === "dashboard") {
      return { canView: true, canEdit: true, canDelete: true, canApprove: true };
    }
    return { canView: true, canEdit: false, canDelete: false, canApprove: true };
  }

  if (role === "Operations Manager") {
    if (moduleName === "clients" || moduleName === "operations") {
      return { canView: true, canEdit: true, canDelete: false, canApprove: true };
    }
    if (moduleName === "performance_reviews" || moduleName === "fleet" || moduleName === "sites") {
      return { canView: true, canEdit: false, canDelete: false, canApprove: true };
    }
    if (moduleName === "invoices" || moduleName === "expenses") {
      return { canView: true, canEdit: false, canDelete: false, canApprove: false };
    }
    if (moduleName === "investigations") {
      return { canView: true, canEdit: false, canDelete: false, canApprove: true };
    }
    if (moduleName === "recruitment") {
      return { canView: true, canEdit: true, canDelete: false, canApprove: true };
    }
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (FULL_EDIT_ROLES.includes(role)) {
    return { canView: true, canEdit: true, canDelete: true, canApprove: true };
  }

  if (role === "Regional Manager") {
    if (moduleName === "clients" || moduleName === "operations") {
      return { canView: true, canEdit: true, canDelete: false, canApprove: true };
    }
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (role === "Armorer" && (moduleName === "armoury" || moduleName === "operations" || moduleName === "inventory")) {
    return { canView: true, canEdit: true, canDelete: false, canApprove: true };
  }

  if ((role === "K9 Supervisor" || role === "K9 Handler") && (moduleName === "k9" || moduleName === "operations" || moduleName === "inventory")) {
    return {
      canView: true,
      canEdit: role === "K9 Supervisor",
      canDelete: false,
      canApprove: role === "K9 Supervisor",
    };
  }

  if (role === "Fleet Manager" && (moduleName === "fleet" || moduleName === "operations")) {
    return { canView: true, canEdit: true, canDelete: false, canApprove: true };
  }

  if (role === "Investigations Officer" && moduleName === "investigations") {
    return { canView: true, canEdit: true, canDelete: false, canApprove: true };
  }

  if (role === "Accountant") {
    // Finance access split (§Phase 3): Accountant edits invoices/expenses but
    // cannot approve or disburse; Assistant Accountant / Internal Auditor / Cashier are view-only on ledgers.
    if (moduleName === "invoices" || moduleName === "expenses") {
      return { canView: true, canEdit: true, canDelete: false, canApprove: false };
    }
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (role === "Cashier") {
    if (moduleName === "finance") {
      return { canView: true, canEdit: true, canDelete: false, canApprove: false };
    }
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (role === "Assistant Accountant" || role === "Internal Auditor") {
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  if (role === "Guard Officer") {
    return { canView: true, canEdit: false, canDelete: false, canApprove: false };
  }

  // Default for standard operations/management roles with module access
  return { canView: true, canEdit: true, canDelete: false, canApprove: true };
}

export function describeAccess(role: UserRole): {
  department: string;
  modules: string[];
  reportsTo?: string;
  title: string;
} {
  const dept = getDepartmentForRole(role);
  const node = getRoleNode(role);
  const modules = getAllowedModuleIds(role)
    .map((id) => getModuleById(id)?.label ?? id);

  return {
    department: dept?.name ?? "Unassigned",
    modules,
    reportsTo: node?.reportsTo,
    title: node?.title ?? role,
  };
}