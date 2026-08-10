import React from "react";
import { Clock } from "lucide-react";
import { AuditLog } from "../../types";

interface DashboardAuditLogProps {
  auditLogs: AuditLog[];
}

export const DashboardAuditLog: React.FC<DashboardAuditLogProps> = ({ auditLogs }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-slate-500" />
        <span>Live Audit Telemetry</span>
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-2 font-mono">
        {auditLogs.slice(0, 20).map((log) => (
          <div key={log.id} className="text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-0.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>{log.action}</span>
              <span className="text-[10px] text-slate-400">{log.timestamp.split(" ")[1]}</span>
            </div>
            <p className="text-slate-600">{log.details}</p>
            <p className="text-[10px] text-slate-400 font-medium">By {log.userName} ({log.userRole})</p>
          </div>
        ))}
      </div>
    </div>
  );
};
