/**
 * Audit logging service — every important action must be traceable (constitution §15.3).
 */

import type { AuditLog, UserRole } from "../types";

export function createAuditLogEntry(params: {
  action: string;
  details: string;
  module?: string;
  userName?: string;
  userRole?: UserRole | string;
}): AuditLog {
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    action: params.action,
    userName: params.userName ?? "System User",
    userRole: (params.userRole ?? "System") as UserRole,
    module: params.module ?? "System Operations",
    details: params.details,
  };
}
