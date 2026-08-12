import React from "react";
import { ShieldCheck } from "lucide-react";
import { AuditLog } from "../../types";

interface DashboardAuditLogProps {
  auditLogs: AuditLog[];
}

const SECURITY_RELEVANT = /weapon|armoury|firearm|serial|issue|return|login|logout|incident|critical|disciplinary|revoke|grant/i;

function parseTimestamp(value: string): number {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const time = Date.parse(normalized);
  return Number.isNaN(time) ? 0 : time;
}

export const DashboardAuditLog: React.FC<DashboardAuditLogProps> = ({ auditLogs }) => {
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const recent = auditLogs.filter((log) => parseTimestamp(log.timestamp) >= since24h);
  const flagged = recent.filter((log) => SECURITY_RELEVANT.test(`${log.action} ${log.module} ${log.details}`));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-black text-slate-900">Security Event Summary</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
          <div className="text-2xl font-black text-slate-900">{recent.length}</div>
          <p className="text-[11px] font-semibold text-slate-500">System events in the last 24 hours</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
          <div className="text-2xl font-black text-amber-700">{flagged.length}</div>
          <p className="text-[11px] font-semibold text-amber-600">Security-relevant events flagged for review</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400">
        Full audit telemetry (logins, weapon issue/return, record changes) is maintained under IT &amp; Systems.
      </p>
    </div>
  );
};
