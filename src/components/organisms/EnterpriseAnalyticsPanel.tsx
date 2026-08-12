import React from "react";
import {
  BarChart3, Layers, ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { Guard, ClientSite, Invoice } from "../../types";

interface EnterpriseAnalyticsPanelProps {
  guards: Guard[];
  sites: ClientSite[];
  invoices: Invoice[];
}

export const EnterpriseAnalyticsPanel: React.FC<EnterpriseAnalyticsPanelProps> = ({
  guards,
  sites,
  invoices,
}) => {
  const totalGuards = guards.length;

  const rankData = (["Guard", "K9 Handler", "Armorer", "Site In-Charge", "Inspector"] as const).map((rank) => ({
    rank,
    value: guards.filter((g) => g.designation === rank).length,
  })).filter((d) => d.value > 0);
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
