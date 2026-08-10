import React from "react";
import { ArrowRight } from "lucide-react";

interface DeptHealth {
  id: string;
  name: string;
  tabId: string;
  deptHead: string;
  icon: React.FC<{ className?: string }>;
  status: "CRITICAL" | "WARNING" | "HEALTHY";
  issuesCount: number;
  metrics: string[];
  actionLabel: string;
}

interface DepartmentHealthCardGridProps {
  departments: DeptHealth[];
  onNavigate: (tabId: string) => void;
}

export const DepartmentHealthCardGrid: React.FC<DepartmentHealthCardGridProps> = ({ departments, onNavigate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept) => {
        const IconComp = dept.icon;
        const isCritical = dept.status === "CRITICAL";
        const isWarning = dept.status === "WARNING";

        return (
          <div
            key={dept.id}
            className={`rounded-2xl border p-4 transition-all space-y-3 flex flex-col justify-between ${
              isCritical
                ? "bg-red-50/40 border-red-200 hover:border-red-300 shadow-sm"
                : isWarning
                ? "bg-amber-50/40 border-amber-200 hover:border-amber-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? "bg-red-100 text-red-700" : isWarning ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{dept.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Head: {dept.deptHead}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 inline-flex items-center gap-1 ${isCritical ? "bg-red-100 text-red-800 border border-red-300" : isWarning ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"}`}>
                  {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-0.5" />}
                  {isCritical ? "CRITICAL ATTENTION" : isWarning ? "ACTION PENDING" : "OPTIMAL HEALTH"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/80 border border-slate-200/60 space-y-1.5 text-xs">
                {dept.metrics.map((metric, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                    <span className="mt-0.5 text-slate-400">•</span>
                    <span className={isCritical || isWarning ? "font-semibold text-slate-800" : ""}>{metric}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => onNavigate(dept.tabId)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isCritical ? "bg-red-600 hover:bg-red-700 text-white shadow-sm" : isWarning ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
            >
              <span>{dept.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
