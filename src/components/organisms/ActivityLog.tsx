import React, { useMemo } from "react";
import { Clock, ShieldCheck, Users, FileText, Settings, Car, DollarSign, Search, Activity } from "lucide-react";
import { useAuditStore } from "../../stores/auditStore";
import { useAuthStore } from "../../stores/authStore";
import type { AuditLog } from "../../types";

const MODULE_ICON_MAP: Record<string, React.ReactNode> = {
  "Security & Auth": <ShieldCheck className="w-3 h-3" />,
  "User Management": <Users className="w-3 h-3" />,
  "RBAC Security": <ShieldCheck className="w-3 h-3" />,
  "Identity & Records": <FileText className="w-3 h-3" />,
  "Training": <Users className="w-3 h-3" />,
  "Operations": <Activity className="w-3 h-3" />,
  "Fleet": <Car className="w-3 h-3" />,
  "Finance": <DollarSign className="w-3 h-3" />,
  "HR": <Users className="w-3 h-3" />,
  "IT": <Settings className="w-3 h-3" />,
  "Administration": <Settings className="w-3 h-3" />,
};

const MODULE_DOT_COLOR: Record<string, string> = {
  "Security & Auth": "bg-rose-500",
  "User Management": "bg-blue-500",
  "RBAC Security": "bg-red-600",
  "Identity & Records": "bg-indigo-500",
  "Training": "bg-emerald-500",
  "Operations": "bg-amber-500",
  "Fleet": "bg-orange-500",
  "Finance": "bg-green-500",
  "HR": "bg-purple-500",
  "IT": "bg-cyan-600",
  "Administration": "bg-slate-500",
};

function getDotColor(module: string): string {
  for (const [key, color] of Object.entries(MODULE_DOT_COLOR)) {
    if (module.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "bg-slate-400";
}

function getIcon(module: string): React.ReactNode {
  for (const [key, icon] of Object.entries(MODULE_ICON_MAP)) {
    if (module.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return <Clock className="w-3 h-3" />;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts.replace(" ", "T"));
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  } catch {
    return ts;
  }
}

export const ActivityLog: React.FC<{ maxEntries?: number }> = ({ maxEntries = 25 }) => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logs = useAuditStore((s) => s.logs);

  const userLogs = useMemo(() => {
    if (!currentUser) return [];
    return logs
      .filter((l: AuditLog) => l.userName === currentUser.name)
      .slice(0, maxEntries);
  }, [logs, currentUser, maxEntries]);

  if (!currentUser) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-900 text-white">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">My Activity</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Recent actions by you</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">
          {userLogs.length} entries
        </span>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {userLogs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No activity recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100" />
            <div className="divide-y divide-slate-50">
              {userLogs.map((log: AuditLog) => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors relative">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full ${getDotColor(log.module)} shrink-0 ring-2 ring-white z-10`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wide">{log.action}</span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">
                        {getIcon(log.module)}
                        {log.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug truncate">{log.details}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
