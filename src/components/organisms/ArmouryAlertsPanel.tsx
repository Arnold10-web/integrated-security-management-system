import React from "react";
import { Bell, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, X, ShieldAlert, Shield, Clock, Zap, Wrench, CheckCircle2 } from "lucide-react";

interface ArmouryAlert {
  id: string;
  category: "OVERDUE_RETURNS" | "MAINTENANCE" | "RESERVES";
  severity: string;
  title: string;
  description: string;
  badgeText: string;
  actionText: string;
  onAction: () => void;
}

interface ArmouryAlertsPanelProps {
  alerts: ArmouryAlert[];
  filteredAlerts: ArmouryAlert[];
  filter: "ALL" | "OVERDUE_RETURNS" | "MAINTENANCE" | "RESERVES";
  onFilterChange: (f: "ALL" | "OVERDUE_RETURNS" | "MAINTENANCE" | "RESERVES") => void;
  dismissedAlertIds: string[];
  onDismissAlert: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canAct?: boolean;
}

export const ArmouryAlertsPanel: React.FC<ArmouryAlertsPanelProps> = ({
  alerts,
  filteredAlerts,
  filter,
  onFilterChange,
  onDismissAlert,
  isCollapsed,
  onToggleCollapse,
  canAct = true,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
            alerts.length > 0 ? "bg-amber-500 text-white shadow-sm" : "bg-emerald-500 text-white shadow-sm"
          }`}>
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Automated Armoury Vault & Return Warning Center
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                alerts.length > 0
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}>
                <Zap className="w-3 h-3 text-rose-600" />
                <span>{alerts.length} Vault Warning(s) Triggered</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time automated compliance monitor tracking shift return deadlines, firearm pin maintenance schedules, and ammunition stock reserve levels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => onFilterChange("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => onFilterChange("OVERDUE_RETURNS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filter === "OVERDUE_RETURNS"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-rose-700 hover:bg-rose-100/50"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Overdue Returns ({alerts.filter((a) => a.category === "OVERDUE_RETURNS").length})</span>
            </button>
            <button
              onClick={() => onFilterChange("MAINTENANCE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filter === "MAINTENANCE"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-700 hover:bg-amber-100/50"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Service ({alerts.filter((a) => a.category === "MAINTENANCE").length})</span>
            </button>
            <button
              onClick={() => onFilterChange("RESERVES")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                filter === "RESERVES"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-700 hover:bg-blue-100/50"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Vault Reserves ({alerts.filter((a) => a.category === "RESERVES").length})</span>
            </button>
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer border border-slate-200"
            title={isCollapsed ? "Expand Vault Warnings" : "Collapse Vault Warnings"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div>
          {filteredAlerts.length === 0 ? (
            <div className="p-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">All Armoury Assets & Shift Returns Fully Compliant</h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                No overdue firearm shift returns detected. All issued weapons have been returned to the vault or are within their active deployment window, and ammo stock levels remain optimal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredAlerts.map((alert) => {
                const isCrit = alert.severity === "CRITICAL";
                const isHigh = alert.severity === "HIGH";

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isCrit
                        ? "bg-rose-50/50 border-rose-200 shadow-sm"
                        : isHigh
                        ? "bg-amber-50/50 border-amber-200 shadow-sm"
                        : "bg-blue-50/30 border-blue-200"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            isCrit
                              ? "bg-rose-600 text-white"
                              : isHigh
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {isCrit ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{alert.severity}</span>
                        </span>

                        <button
                          onClick={() => onDismissAlert(alert.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                          title="Dismiss Alert"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{alert.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{alert.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                        {alert.badgeText}
                      </span>
                      {canAct ? (
                        <button
                          onClick={alert.onAction}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                            isCrit
                              ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                              : isHigh
                              ? "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                          }`}
                        >
                          <span>{alert.actionText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-100 shrink-0">
                          Armorer action required
                        </span>
                      )}
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
