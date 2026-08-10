import { create } from "zustand";
import type { AuditLog, User } from "../types";
import { initialAuditLogs } from "../data/mockData";
import { createAuditLogEntry } from "../services/auditService";

interface AuditState {
  logs: AuditLog[];
  addLog: (
    action: string,
    details: string,
    module?: string,
    actor?: User | null
  ) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: initialAuditLogs,
  addLog: (action, details, module = "System Operations", actor) => {
    const entry = createAuditLogEntry({
      action,
      details,
      module,
      userName: actor?.name,
      userRole: actor?.role,
    });
    set((s) => ({ logs: [entry, ...s.logs] }));
  },
}));
