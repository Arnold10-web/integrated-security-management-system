import React from "react";
import { Users, ShieldAlert, Dog, AlertTriangle, TrendingUp } from "lucide-react";

interface DashboardKpiCardsProps {
  activeGuards: number;
  totalGuards: number;
  issuedWeapons: number;
  activeK9s: number;
  openIncidents: number;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  activeGuards,
  totalGuards,
  issuedWeapons,
  activeK9s,
  openIncidents,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Post Deployment */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Post Deployment</span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900">
            {activeGuards} <span className="text-xs font-semibold text-slate-500">/ {totalGuards} Total</span>
          </span>
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            <TrendingUp className="w-3 h-3 mr-1" />100% On-Time
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(activeGuards / Math.max(totalGuards, 1)) * 100}%` }} />
        </div>
      </div>

      {/* Firearms Issued */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Firearms Issued Out</span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900">{issuedWeapons} Assets</span>
          <span className="text-xs font-semibold text-slate-500">Serials Verified</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">All checkouts signed off by the Armorer & Operations Manager.</p>
      </div>

      {/* K9 Active Duty */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">K9 Unit Deployments</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Dog className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900">{activeK9s} Active</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Vet Cleared</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Explosive & Patrol dogs paired with certified handlers.</p>
      </div>

      {/* Incidents Metric */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Security Alerts</span>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-red-600">{openIncidents} Open</span>
          <span className="text-xs font-semibold text-slate-500">Under Review</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Site perimeter incidents with evidence attachments.</p>
      </div>
    </div>
  );
};
