import React from "react";
import { MapPin, Dog } from "lucide-react";
import { ClientSite } from "../../types";

interface DashboardClientSitesListProps {
  sites: ClientSite[];
  onNavigate: (tabId: string) => void;
}

const unarmed = (total: number, armed: number) => Math.max(0, total - (armed || 0));

export const DashboardClientSitesList: React.FC<DashboardClientSitesListProps> = ({ sites, onNavigate }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Deployed Client Sites & Service Status</h3>
          <p className="text-xs text-slate-500">Active guard deployments, armed posture, and K9 requirements by site</p>
        </div>
        <button onClick={() => onNavigate("clients")} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
          View All Sites &rarr;
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {sites.map((s) => (
          <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{s.siteName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{s.zone}</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {s.location}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                <span>☀️ Day: <strong>{s.dayShiftGuards}</strong> <span className="text-emerald-600 font-semibold">({s.dayShiftArmed || 0} armed</span> / <span className="text-slate-500">{unarmed(s.dayShiftGuards, s.dayShiftArmed)} unarmed)</span></span>
                <span>🌙 Night: <strong>{s.nightShiftGuards}</strong> <span className="text-emerald-600 font-semibold">({s.nightShiftArmed || 0} armed</span> / <span className="text-slate-500">{unarmed(s.nightShiftGuards, s.nightShiftArmed)} unarmed)</span></span>
                {s.k9Required && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    <Dog className="w-3 h-3" /> K9 Required
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                s.slaStatus === "Compliant" ? "bg-emerald-100 text-emerald-800" : s.slaStatus === "Understaffed" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"
              }`}>
                {s.slaStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
