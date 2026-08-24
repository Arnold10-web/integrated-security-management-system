import React from "react";
import { Users, UserX, Building2, Handshake, MessageSquareWarning, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDomainStore } from "../../../stores/domainStore";
import type { StatsBundle, StatsFilters } from "../../../utils/executiveStats";
import { computeMetric } from "../../../utils/executiveStats";

interface Tile {
  id: string;
  label: string;
  icon: React.ReactNode;
  tone: string;
  to?: string;
  format: (v: unknown) => string;
}

const TILES: Tile[] = [
  { id: "workforce.totalOfficers", label: "Security Officers", icon: <Users className="w-4 h-4" />, tone: "bg-slate-100 text-slate-700", format: (v) => String(v ?? "—"), to: "/hr/register" },
  { id: "workforce.desertionRate", label: "Desertion Rate", icon: <UserX className="w-4 h-4" />, tone: "bg-rose-50 text-rose-600", format: (v) => `${v ?? 0}%`, to: "/hr/register" },
  { id: "clients.unique", label: "Clients", icon: <Handshake className="w-4 h-4" />, tone: "bg-indigo-50 text-indigo-600", format: (v) => String(v ?? "—"), to: "/clients" },
  { id: "clients.compliance", label: "SLA Compliance", icon: <Building2 className="w-4 h-4" />, tone: "bg-emerald-50 text-emerald-600", format: (v) => `${v ?? 0}%`, to: "/clients" },
  { id: "discipline.complaintsOpen", label: "Open Complaints", icon: <MessageSquareWarning className="w-4 h-4" />, tone: "bg-cyan-50 text-cyan-600", format: (v) => String(v ?? "—"), to: "/investigations" },
  { id: "training.recruits", label: "In Training School", icon: <GraduationCap className="w-4 h-4" />, tone: "bg-violet-50 text-violet-600", format: (v) => String(v ?? "—"), to: "/operations" },
];

/** Headline band — exactly six registry-driven tiles; deep stats live with their owners. */
export const StatsBand: React.FC<{ bundle: StatsBundle; filters: StatsFilters }> = ({ bundle, filters }) => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {TILES.map((tile) => {
        const value = computeMetric(tile.id, bundle, filters);
        return (
          <button
            key={tile.id}
            onClick={() => tile.to && navigate(tile.to)}
            className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-left hover:border-slate-400 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-xl ${tile.tone}`}>{tile.icon}</span>
              {tile.to && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              )}
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight leading-none">{tile.format(value)}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">{tile.label}</p>
          </button>
        );
      })}
    </div>
  );
};
