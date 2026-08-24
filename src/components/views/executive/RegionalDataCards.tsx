import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ChevronRight } from "lucide-react";
import { useDomainStore } from "../../../stores/domainStore";
import { regionalBreakdown } from "../../../utils/executiveStats";
import type { StatsBundle, StatsFilters } from "../../../utils/executiveStats";
import { PanelShell } from "./PanelShell";

/** Per-region operating picture; click-through to the region dashboard. */
export const RegionalDataCards: React.FC<{ bundle: StatsBundle; filters: StatsFilters }> = ({ bundle, filters }) => {
  const navigate = useNavigate();
  const rows = regionalBreakdown(bundle, filters);

  return (
    <PanelShell
      icon={<MapPin className="w-4 h-4 text-cyan-600" />}
      title="Regional Data"
      badge={rows.length}
      badgeTone="slate"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {rows.map((r) => {
          const hot = r.incidents + r.complaints > 0;
          return (
            <button
              key={r.region}
              onClick={() => navigate(`/operations/regions/${encodeURIComponent(r.region)}`)}
              className={`text-left p-4 rounded-xl border bg-slate-50/70 hover:bg-white transition-colors cursor-pointer group ${
                hot ? "border-rose-200 hover:border-rose-400" : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-slate-800 truncate">{r.region}</p>
                <span className="flex items-center gap-1 shrink-0">
                  {hot && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase border border-rose-200">
                      Attention
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1.5">
                <Stat label="Officers" value={r.officers} />
                <Stat label="Deserted" value={r.deserted} tone={r.deserted > 0 ? "text-rose-600" : undefined} />
                <Stat label="Sites" value={r.sites} />
                <Stat label="Clients" value={r.clients} />
                <Stat label="Complaints" value={r.complaints} tone={r.complaints > 0 ? "text-cyan-600" : undefined} />
                <Stat label="Incidents" value={r.incidents} tone={r.incidents > 0 ? "text-rose-600" : undefined} />
              </div>
            </button>
          );
        })}
        {rows.length === 0 && (
          <p className="col-span-full text-xs text-slate-400 font-medium text-center py-8">
            No regional records match the current filters.
          </p>
        )}
      </div>
    </PanelShell>
  );
};

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = "text-slate-800" }) => (
  <div>
    <p className={`text-sm font-black leading-none ${tone}`}>{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{label}</p>
  </div>
);
