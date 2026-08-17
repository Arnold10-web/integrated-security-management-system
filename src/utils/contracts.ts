import type { ContractRecord, UserRole } from "../types";
import { MARKETING_ROLES, OPS_MANAGEMENT_ROLES } from "../services/rbacService";

export const CONTRACT_APPROVAL_STEPS = ["GM", "Done"] as const;

export function contractApprovalRolesForStep(step?: string): UserRole[] {
  if (step === "GM") return ["General Manager"];
  return [];
}

export function canProvideSiteSurvey(role?: UserRole): boolean {
  return OPS_MANAGEMENT_ROLES.includes(role as UserRole);
}

export function canIssueContract(c: ContractRecord, role?: UserRole): boolean {
  return c.contractType === "Staff Contract" && c.status === "Draft" && role === "HR Manager";
}

export function canAdvanceApproval(c: ContractRecord, role?: UserRole): boolean {
  if (c.contractType !== "Client Contract" || c.status !== "Draft" || !role) return false;
  return contractApprovalRolesForStep(c.approvalStep).includes(role);
}

export function canArchiveContract(c: ContractRecord, role?: UserRole): boolean {
  return role === "Records Officer" && c.status !== "Archived";
}

export function canVoidContract(c: ContractRecord, role?: UserRole): boolean {
  if (!role) return false;
  return c.contractType === "Staff Contract"
    ? role === "HR Manager"
    : role === "General Manager";
}

export function canEditContract(c: ContractRecord, role?: UserRole): boolean {
  if (!role) return false;
  if (role === "Records Officer") return c.status !== "Archived";
  if (c.contractType === "Staff Contract") {
    if (role === "HR Manager") return c.status !== "Archived";
    if (role === "HR Assistant") return c.status === "Draft";
    return false;
  }
  if (MARKETING_ROLES.includes(role as UserRole)) {
    return c.status === "Draft";
  }
  return false;
}
