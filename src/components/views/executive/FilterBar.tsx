import React from "react";
import { CalendarRange, MapPin, Search, RotateCcw } from "lucide-react";
import type { PeriodKey } from "../../../utils/executiveStats";

export interface ExecutiveFilters {
  period: PeriodKey;
  region: string | null;
  search: string;
}

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "quarter", label: "Last quarter" },
  { key: "year", label: "Last year" },
  { key: "all", label: "All time" },
];

export const FilterBar: React.FC<{
  filters: ExecutiveFilters;
  regions: string[];
  onChange: (next: Partial<ExecutiveFilters>) => void;
}> = ({ filters, regions, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="relative">
      <CalendarRange className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        value={filters.period}
        onChange={(e) => onChange({ period: e.target.value as PeriodKey })}
        aria-label="Reporting period"
        className="appearance-none pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      >
        {PERIOD_OPTIONS.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>
    </div>

    <div className="relative">
      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        value={filters.region ?? ""}
        onChange={(e) => onChange({ region: e.target.value || null })}
        aria-label="Region filter"
        className="appearance-none pl-8 pr-7 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 min-w-[10rem]"
      >
        <option value="">All regions</option>
        {regions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>

    <div className="relative flex-1 min-w-[12rem] max-w-sm">
      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        placeholder="Search the approvals queue…"
        aria-label="Search approvals queue"
        className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      />
    </div>

    {(filters.period !== "all" || filters.region || filters.search) && (
      <button
        onClick={() => onChange({ period: "all", region: null, search: "" })}
        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <RotateCcw className="w-3 h-3" /> Reset
      </button>
    )}
  </div>
);
