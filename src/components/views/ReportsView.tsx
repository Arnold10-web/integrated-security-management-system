import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import type { Guard, ClientSite, Incident, Vehicle, Invoice, Expense, LeaveRequest, PerformanceReviewRecord } from "../../types";

interface ReportsViewProps {
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  vehicles: Vehicle[];
  invoices: Invoice[];
  expenses: Expense[];
  leaveRequests: LeaveRequest[];
  performanceReviews: PerformanceReviewRecord[];
}

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#064e3b", "#047857"];
const PIE_COLORS = ["#059669", "#f59e0b", "#ef4444", "#3b82f6"];

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  guards, sites, incidents, vehicles, invoices, expenses, leaveRequests, performanceReviews,
}) => {
  const siteStatusData = useMemo(() => [
    { name: "Compliant", value: sites.filter((s) => s.slaStatus === "Compliant").length },
    { name: "Understaffed", value: sites.filter((s) => s.slaStatus === "Understaffed").length },
    { name: "Attention", value: sites.filter((s) => s.slaStatus === "Attention Needed").length },
  ], [sites]);

  const guardStatusData = useMemo(() => [
    { name: "On Duty", value: guards.filter((g) => g.status === "On Duty").length },
    { name: "Off Duty", value: guards.filter((g) => g.status === "Off Duty").length },
    { name: "On Leave", value: guards.filter((g) => g.status === "On Leave").length },
    { name: "Suspended", value: guards.filter((g) => g.status === "Suspended").length },
  ], [guards]);

  const incidentSeverityData = useMemo(() => [
    { name: "Low", value: incidents.filter((i) => i.severity === "Low").length },
    { name: "Medium", value: incidents.filter((i) => i.severity === "Medium").length },
    { name: "High", value: incidents.filter((i) => i.severity === "High").length },
    { name: "Critical", value: incidents.filter((i) => i.severity === "Critical").length },
  ], [incidents]);

  const designationData = useMemo(() => {
    const counts: Record<string, number> = {};
    guards.forEach((g) => { counts[g.designation] = (counts[g.designation] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [guards]);

  const armedByRegionData = useMemo(() => {
    const map: Record<string, { armed: number; unarmed: number }> = {};
    sites.forEach((s) => {
      const region = s.region || "Unassigned";
      map[region] = map[region] || { armed: 0, unarmed: 0 };
      map[region].armed += (s.dayShiftArmed || 0) + (s.nightShiftArmed || 0);
      map[region].unarmed += Math.max(0, s.dayShiftGuards - (s.dayShiftArmed || 0)) + Math.max(0, s.nightShiftGuards - (s.nightShiftArmed || 0));
    });
    return Object.entries(map).map(([region, v]) => ({ region, armed: v.armed, unarmed: v.unarmed }));
  }, [sites]);

  const slaByZoneData = useMemo(() => {
    const zones: Record<string, { total: number; compliant: number }> = {};
    sites.forEach((s) => {
      zones[s.zone] = zones[s.zone] || { total: 0, compliant: 0 };
      zones[s.zone].total += 1;
      if (s.slaStatus === "Compliant") zones[s.zone].compliant += 1;
    });
    return Object.entries(zones).map(([zone, v]) => ({ zone, Compliant: v.compliant, AtRisk: v.total - v.compliant }));
  }, [sites]);

  const monthlyInvoiceData = useMemo(() => {
    const months: Record<string, number> = {};
    invoices.forEach((inv) => {
      const m = inv.date.substring(0, 7);
      months[m] = (months[m] || 0) + inv.amount;
    });
    return Object.entries(months).sort().map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  const topClientsData = useMemo(() => {
    const byClient: Record<string, number> = {};
    invoices.forEach((inv) => {
      if (inv.status === "Paid") byClient[inv.clientName] = (byClient[inv.clientName] || 0) + inv.amount;
    });
    return Object.entries(byClient)
      .map(([client, amount]) => ({ client, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [invoices]);

  const totalRevenue = invoices.reduce((s, i) => s + (i.status === "Paid" ? i.amount : 0), 0);
  const pendingLeave = leaveRequests.filter((l) => l.status === "Pending Regional Approval" || l.status === "Pending HR Review").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <button onClick={() => downloadCsv("guards_report.csv",
            ["Force Number", "Name", "Designation", "Zone", "Status", "Site", "Phone"],
            guards.map((g) => [g.guardCode, g.fullName, g.designation, g.zone || "", g.status, g.assignedSite, g.phone])
          )} className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-800 transition-all">
            <Download className="w-3.5 h-3.5" /> Export Guards
          </button>
          <button onClick={() => downloadCsv("sites_report.csv",
            ["Client", "Site", "Zone", "Region", "Day", "Day Armed", "Night", "Night Armed", "SLA", "Deployment"],
            sites.map((s) => [s.clientName, s.siteName, s.zone, s.region || "", String(s.dayShiftGuards), String(s.dayShiftArmed || 0), String(s.nightShiftGuards), String(s.nightShiftArmed || 0), s.slaStatus, s.deploymentStatus || "Not Deployed"])
          )} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-purple-500 transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Sites
          </button>
          <button onClick={() => downloadCsv("incidents_report.csv",
            ["Code", "Title", "Severity", "Status", "Date"],
            incidents.map((i) => [i.incidentCode, i.title, i.severity, i.status, i.incidentDate])
          )} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-500 transition-all">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Incidents
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Guards</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{guards.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Sites</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{sites.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Open Incidents</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{incidents.filter((i) => i.status !== "Resolved").length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Revenue (UGX)</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Leave</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingLeave}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Guard Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={guardStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {guardStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Site SLA Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={siteStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {siteStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Incident Severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentSeverityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {incidentSeverityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Monthly Revenue (UGX)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyInvoiceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Guard Rank & Designation Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={designationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Armed vs Unarmed Guard Strength by Region</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={armedByRegionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="region" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="armed" name="Armed" stackId="a" fill="#7c3aed" />
              <Bar dataKey="unarmed" name="Unarmed" stackId="a" fill="#c4b5fd" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">SLA Compliance by Zone</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={slaByZoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="zone" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="Compliant" stackId="a" fill="#059669" />
              <Bar dataKey="AtRisk" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <h3 className="text-xs font-black text-slate-700 mb-4">Top Clients by Revenue (UGX)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topClientsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="client" width={120} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#d97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h3 className="text-xs font-black text-slate-700 mb-3">Quick Export</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Vehicles", data: vehicles.map((v) => [v.plateNumber, v.vehicleType, v.driverAssigned, v.status, String(v.mileageKm)]), headers: ["Plate", "Type", "Driver", "Status", "Mileage"] },
            { label: "Invoices", data: invoices.map((i) => [i.invoiceNumber, i.clientName, String(i.amount), i.status, i.dueDate]), headers: ["Invoice", "Client", "Amount", "Status", "Due"] },
            { label: "Expenses", data: expenses.map((e) => [e.category, e.description, String(e.amount), e.status, e.date]), headers: ["Category", "Description", "Amount", "Status", "Date"] },
            { label: "Leave Requests", data: leaveRequests.map((l) => [l.guardCode, l.guardName, l.leaveType, l.status, l.appliedDate]), headers: ["Code", "Name", "Type", "Status", "Applied"] },
            { label: "Performance Reviews", data: performanceReviews.map((p) => [p.guardCode, p.guardName, p.reviewPeriod, p.overallRating, p.evaluationDate]), headers: ["Code", "Name", "Period", "Rating", "Date"] },
          ].map(({ label, data, headers }) => (
            <button key={label} onClick={() => downloadCsv(`${label.toLowerCase().replace(/\s+/g, "_")}.csv`, headers, data)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 cursor-pointer transition-all">
              {label} CSV
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
