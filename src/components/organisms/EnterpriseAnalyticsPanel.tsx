import React from "react";
import {
  Users, DollarSign, AlertTriangle, CalendarRange, BarChart3, Layers, ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { Guard, ClientSite, Incident, Invoice, LeaveRequest, PerformanceReviewRecord } from "../../types";

interface EnterpriseAnalyticsPanelProps {
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  invoices: Invoice[];
  leaveRequests: LeaveRequest[];
  performanceReviews: PerformanceReviewRecord[];
}

export const EnterpriseAnalyticsPanel: React.FC<EnterpriseAnalyticsPanelProps> = ({
  guards,
  sites,
  incidents,
  invoices,
  leaveRequests,
  performanceReviews,
}) => {
  const totalGuards = guards.length;
  const activeGuards = guards.filter((g) => g.status === "On Duty").length;
  const openIncidents = incidents.filter((i) => i.status !== "Resolved").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "Critical" && i.status !== "Resolved").length;
  const pendingLeave = leaveRequests.filter((r) => r.status === "Pending HR Review" || r.status === "Pending Regional Approval").length;
  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);
  const paidRevenue = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const revenueCollectionPct = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const rankData = (["Guard", "K9 Handler", "Armorer", "Site In-Charge", "Inspector"] as const).map((rank) => ({
    rank,
    value: guards.filter((g) => g.designation === rank).length,
  }));
  const rankColors: Record<string, string> = {
    "Guard": "#0ea5e9", "K9 Handler": "#8b5cf6", "Armorer": "#f59e0b", "Site In-Charge": "#06b6d4", "Inspector": "#7c3aed",
  };
  const armedByRegion = [...new Set(sites.map((s) => s.region).filter(Boolean))].map((region) => {
    const regionSites = sites.filter((s) => s.region === region);
    return {
      region,
      armed: regionSites.reduce((sum, s) => sum + (s.dayShiftArmed || 0) + (s.nightShiftArmed || 0), 0),
      unarmed: regionSites.reduce((sum, s) => sum + ((s.dayShiftGuards || 0) - (s.dayShiftArmed || 0)) + ((s.nightShiftGuards || 0) - (s.nightShiftArmed || 0)), 0),
    };
  });
  const totalArmed = sites.reduce((sum, s) => sum + (s.dayShiftArmed || 0) + (s.nightShiftArmed || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-black text-slate-900">Enterprise Analytics & Trends</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 space-y-2">
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold"><Users className="w-4 h-4" /><span>Guard Strength</span></div>
          <div className="text-2xl font-black text-slate-900">{totalGuards}</div>
          <div className="text-[10px] text-slate-500">
            <span className="text-emerald-600 font-bold">{activeGuards} on duty</span>
            <span className="mx-1">•</span>
            <span className="text-amber-600 font-bold">{guards.filter((g) => g.status === "On Leave").length} on leave</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(activeGuards / Math.max(totalGuards, 1)) * 100}%` }} />
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold"><DollarSign className="w-4 h-4" /><span>Revenue Collection</span></div>
          <div className="text-2xl font-black text-slate-900">{revenueCollectionPct}%</div>
          <div className="text-[10px] text-slate-500">
            <span className="font-bold">UGX {paidRevenue.toLocaleString()} collected</span>
            <span className="mx-1">of</span>
            <span className="text-amber-600 font-bold">UGX {totalRevenue.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${revenueCollectionPct}%` }} />
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold"><AlertTriangle className="w-4 h-4" /><span>Incidents</span></div>
          <div className="text-2xl font-black text-slate-900">{incidents.length}</div>
          <div className="text-[10px] text-slate-500">
            <span className="text-rose-600 font-bold">{openIncidents} open</span>
            <span className="mx-1">•</span>
            <span className="font-bold">{criticalIncidents} critical</span>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl border border-purple-100 space-y-2">
          <div className="flex items-center gap-2 text-purple-700 text-xs font-bold"><CalendarRange className="w-4 h-4" /><span>Leave & Reviews</span></div>
          <div className="text-2xl font-black text-slate-900">{pendingLeave}</div>
          <div className="text-[10px] text-slate-500">
            <span className="text-blue-600 font-bold">{pendingLeave} pending leave</span>
            <span className="mx-1">•</span>
            <span className="text-purple-600 font-bold">{performanceReviews.length} reviews completed</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Guard Status Distribution</h4>
          <div className="space-y-1.5">
            {(["On Duty", "Off Duty", "On Leave", "Suspended", "Deserted", "Archived"] as const).map((status) => {
              const count = guards.filter((g) => g.status === status).length;
              const pct = totalGuards > 0 ? (count / totalGuards) * 100 : 0;
              const colors: Record<string, string> = { "On Duty": "bg-emerald-500", "Off Duty": "bg-slate-400", "On Leave": "bg-blue-500", "Suspended": "bg-amber-500", "Deserted": "bg-rose-500", "Archived": "bg-gray-500" };
              return (
                <div key={status} className="flex items-center gap-3 text-[11px]">
                  <span className="w-20 font-medium text-slate-600">{status}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-700">{count} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Revenue by Invoice Status</h4>
          <div className="space-y-1.5">
            {(["Paid", "Pending", "Overdue"] as const).map((status) => {
              const total = invoices.filter((i) => i.status === status).reduce((s, i) => s + i.amount, 0);
              const grandTotal = invoices.reduce((s, i) => s + i.amount, 0);
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              const colors: Record<string, string> = { "Paid": "bg-emerald-500", "Pending": "bg-amber-500", "Overdue": "bg-rose-500" };
              return (
                <div key={status} className="flex items-center gap-3 text-[11px]">
                  <span className="w-20 font-medium text-slate-600">{status}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-28 text-right font-bold text-slate-700">UGX {total.toLocaleString()} ({Math.round(pct)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Field Rank Distribution</h4>
          </div>
          {rankData.some((r) => r.value > 0) ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={rankData} layout="vertical" margin={{ left: 40, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="rank" width={92} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" name="Guards" radius={[0, 4, 4, 0]}>
                  {rankData.map((d) => <Cell key={d.rank} fill={rankColors[d.rank] ?? "#0ea5e9"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No rank data recorded</div>
          )}
          <p className="text-[10px] text-slate-400">Site In-Charge & Inspector are field supervision ranks on the operations ladder</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Armed Posture by Region</h4>
          </div>
          {armedByRegion.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={armedByRegion} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="region" tick={{ fontSize: 8 }} interval={0} angle={-15} textAnchor="end" height={44} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="armed" name="Armed" stackId="a" fill="#7c3aed" radius={[0, 0, 4, 4]} />
                <Bar dataKey="unarmed" name="Unarmed" stackId="a" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No region data recorded</div>
          )}
          <p className="text-[10px] text-slate-400">{totalArmed.toLocaleString()} total armed guard slots across all regions</p>
        </div>
      </div>
    </div>
  );
};
