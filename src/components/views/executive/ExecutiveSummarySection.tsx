/**
 * Executive Summary section for the Reports page.
 * Renders every metric in the registry grouped by section — one definition,
 * one row each, exported as CSV from the same values shown on dashboards.
 */

import React, { useMemo } from "react";
import { Download, ClipboardList } from "lucide-react";
import { useDomainStore } from "../../../stores/domainStore";
import { useAuthStore } from "../../../stores/authStore";
import {
  listMetrics,
  type StatsBundle,
  type StatsFilters,
  type MetricSection,
} from "../../../utils/executiveStats";

const SECTION_ORDER: MetricSection[] = ["Workforce", "Training School", "Operations", "Discipline", "Clients & Sites"];

const SECTION_COLORS: Record<MetricSection, string> = {
  Workforce: "bg-slate-100 text-slate-600",
  "Training School": "bg-violet-100 text-violet-700",
  Operations: "bg-cyan-100 text-cyan-700",
  Discipline: "bg-rose-100 text-rose-700",
  "Clients & Sites": "bg-emerald-100 text-emerald-700",
};

export const ExecutiveSummarySection: React.FC<{ filters?: StatsFilters }> = ({ filters = { period: "all", region: null } }) => {
  const domain = useDomainStore();
  const users = useAuthStore((s) => s.users);

  const bundle: StatsBundle = useMemo(
    () => ({
      officers: domain.securityOfficers,
      users,
      sites: domain.sites,
      complaints: domain.complaints,
      incidents: domain.incidents,
      trainingCohorts: domain.trainingCohorts,
      recruitTrainees: domain.recruitTrainees,
    }),
    [domain.securityOfficers, users, domain.sites, domain.complaints, domain.incidents, domain.trainingCohorts, domain.recruitTrainees]
  );

  const metrics = useMemo(() => listMetrics().map((m) => ({
    def: m,
    value: m.compute(bundle, filters),
    formatted: m.unit === "pct" ? `${m.compute(bundle, filters)}%` : String(m.compute(bundle, filters) ?? "—"),
  })), [bundle, filters]);

  const exportCsv = () => {
    const csv = [
      ["Metric ID", "Label", "Section", "Owner", "Unit", "Value"].join(","),
      ...metrics.map((m) => [m.def.id, m.def.label, m.def.section, m.def.owner, m.def.unit, String(m.value ?? "")].map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "executive_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Executive Summary</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black border border-slate-200">
            {metrics.length} metrics · single source of truth
          </span>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-800 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export Executive CSV
        </button>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-x-6">
        {SECTION_ORDER.map((section) => (
          <div key={section} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${SECTION_COLORS[section]}`}>{section}</span>
              <span className="text-[10px] font-bold text-slate-400">
                owned by {[...new Set(metrics.filter((m) => m.def.section === section).map((m) => m.def.owner))].join(", ")}
              </span>
            </div>
            <table className="w-full text-xs">
              <tbody>
                {metrics.filter((m) => m.def.section === section).map((m) => (
                  <tr key={m.def.id} className="border-b border-slate-50 last:border-0" title={m.def.description}>
                    <td className="py-1.5 pr-2 font-semibold text-slate-600">{m.def.label}</td>
                    <td className="py-1.5 pl-2 text-right font-black text-slate-900 whitespace-nowrap">{m.formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
};
