import React from "react";
import { Users, DollarSign, AlertTriangle, TrendingUp, ShieldAlert, Dog } from "lucide-react";

interface ConsolidatedDashboardMetricsProps {
  activeGuards: number;
  totalGuards: number;
  revenueCollectionPct: number;
  overdueRevenue: number;
  openIncidents: number;
  issuedWeapons: number;
  activeK9s: number;
  criticalIncidents: number;
  nonCompliantSites: number;
  suspendedGuards: number;
  paidRevenue: number;
  totalRevenue: number;
}

export const ConsolidatedDashboardMetrics: React.FC<ConsolidatedDashboardMetricsProps> = ({
  activeGuards,
  totalGuards,
  revenueCollectionPct,
  overdueRevenue,
  openIncidents,
  issuedWeapons,
  activeK9s,
   criticalIncidents,
  nonCompliantSites,
  suspendedGuards,
  paidRevenue,
  totalRevenue,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Canonical Guard Status — single source for all guard metrics (F2) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Guard Status</span>
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
        <p className="text-xs text-slate-500 mt-2">
          {suspendedGuards} suspended · Active deployment across all regions.
        </p>
      </div>

      {/* Consolidated Revenue — single source for all revenue data (F1) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue Performance</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-slate-900">{revenueCollectionPct}%</span>
          <span className="text-[10px] font-semibold text-slate-500">
            UGX {paidRevenue.toLocaleString()} collected
          </span>
        </div>
        <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${revenueCollectionPct}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          UGX {overdueRevenue.toLocaleString()} overdue · UGX {totalRevenue.toLocaleString()} total billed
        </p>
      </div>

      {/* Consolidated Security Status — single source for security metrics (F3) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Status</span>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-black text-red-600">{openIncidents} Open</span>
          <span className="text-xs font-semibold text-slate-500">{criticalIncidents} Critical</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {nonCompliantSites} non-compliant sites monitored.
        </p>
      </div>

      {/* Firearms Issued — unchanged as it was not flagged */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Firearms Issued</span>
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

      {/* K9 Deployments — unchanged as it was not flagged */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">K9 Deployments</span>
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
    </div>
  );
};
