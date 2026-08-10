import React from "react";
import { Bell, Zap, CheckCircle2, AlertTriangle, Clock, X, ArrowRight, ChevronDown, ChevronUp, AlertOctagon, Wrench, ShieldCheck } from "lucide-react";

interface FleetAlert {
  id: string; vehicleId: string; plateNumber: string;
  category: "CRITICAL" | "MAINTENANCE" | "LICENCES";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string; description: string; dueDateOrKm: string;
  actionText: string; onAction: () => void;
}

interface FleetAlertsPanelProps {
  alerts: FleetAlert[];
  filter: "ALL" | "CRITICAL" | "MAINTENANCE" | "LICENCES";
  onFilterChange: (f: "ALL" | "CRITICAL" | "MAINTENANCE" | "LICENCES") => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onDismiss: (id: string) => void;
}

export const FleetAlertsPanel: React.FC<FleetAlertsPanelProps> = ({ alerts, filter, onFilterChange, collapsed, onToggleCollapse, onDismiss }) => {
  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.category === filter);
  const severity = (sev: string) => sev === "CRITICAL" ? "rose" : sev === "HIGH" ? "amber" : "blue";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${alerts.length > 0 ? "bg-amber-500 text-white shadow-sm" : "bg-emerald-500 text-white shadow-sm"}`}>
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Automated Fleet Expiry & Maintenance Warning Center</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${alerts.length > 0 ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>
                <Zap className="w-3 h-3 text-rose-600" />
                <span>{alerts.length} Active Warning(s) Triggered</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time automated compliance monitor continuously evaluating odometer milestones, road licence expiries, insurance policies, tyre treads, and permit renewals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {(["ALL","CRITICAL","MAINTENANCE","LICENCES"] as const).map((f) => (
              <button key={f} onClick={() => onFilterChange(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filter === f
                    ? f === "ALL" ? "bg-white text-slate-900 shadow-sm"
                    : f === "CRITICAL" ? "bg-rose-600 text-white shadow-sm"
                    : f === "MAINTENANCE" ? "bg-amber-600 text-white shadow-sm"
                    : "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}>
                {f === "ALL" ? null : f === "CRITICAL" ? <AlertOctagon className="w-3.5 h-3.5" /> : f === "MAINTENANCE" ? <Wrench className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{f === "ALL" ? `All (${alerts.length})` : f === "CRITICAL" ? `Critical (${alerts.filter(a => a.category === "CRITICAL" || a.severity === "CRITICAL").length})` : f === "MAINTENANCE" ? `Service (${alerts.filter(a => a.category === "MAINTENANCE").length})` : `Renewals (${alerts.filter(a => a.category === "LICENCES").length})`}</span>
              </button>
            ))}
          </div>
          <button onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer border border-slate-200">
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          {filtered.length === 0 ? (
            <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">No Active Compliance or Maintenance Warnings</h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">All vehicle road licences, insurance coverages, odometer service intervals, oil statuses, and driver permit renewals are operating within optimal parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((alert) => {
                const sev = alert.severity;
                const bg = severity(sev);
                return (
                  <div key={alert.id} className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${sev === "CRITICAL" ? "bg-rose-50/50 border-rose-200 shadow-sm" : sev === "HIGH" ? "bg-amber-50/50 border-amber-200 shadow-sm" : "bg-blue-50/30 border-blue-200"}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 bg-${bg}-600 text-white`}>
                          {sev === "CRITICAL" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{sev}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[10px]">{alert.plateNumber}</span>
                          <button onClick={() => onDismiss(alert.id)} className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer" title="Dismiss Alert"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{alert.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{alert.description}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-slate-500 font-mono">{alert.dueDateOrKm}</span>
                      <button onClick={alert.onAction} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 bg-${bg}-600 hover:bg-${bg}-700 text-white shadow-xs`}>
                        <span>{alert.actionText}</span><ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
