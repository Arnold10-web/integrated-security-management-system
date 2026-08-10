import React from "react";
import {
  ShieldCheck, Activity, Users, DollarSign, BarChart3, Building,
} from "lucide-react";
import { Guard, ClientSite, Incident, AuditLog, UserRole, Invoice, LeaveRequest, PerformanceReviewRecord, ArmouryItem, K9Dog } from "../../types";
import { DashboardKpiCards, DepartmentDirectoryGrid, DashboardClientSitesList, DashboardAuditLog, EnterpriseAnalyticsPanel, ExecutiveAlertsStrip } from "../organisms";

interface DashboardViewProps {
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  activeRole: UserRole;
  onNavigate: (tabId: string) => void;
  armoury?: ArmouryItem[];
  k9s?: K9Dog[];
  leaveRequests?: LeaveRequest[];
  invoices?: Invoice[];
  performanceReviews?: PerformanceReviewRecord[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  guards, sites, incidents, auditLogs, activeRole, onNavigate,
  armoury = [], k9s = [],
  leaveRequests = [], invoices = [], performanceReviews = [],
}) => {
  const activeGuards = guards.filter((g) => g.status === "On Duty").length;
  const issuedWeapons = armoury.filter((a) => a.location === "Issued Out").length;
  const activeK9s = k9s.filter((d) => d.status === "Active Duty").length;
  const totalGuards = guards.length;
  const openIncidents = incidents.filter((i) => i.status !== "Resolved").length;
  const criticalIncidents = incidents.filter((i) => i.severity === "Critical" && i.status !== "Resolved").length;
  const nonCompliantSites = sites.filter((s) => s.slaStatus !== "Compliant").length;
  const suspendedGuards = guards.filter((g) => g.status === "Suspended").length;
  const overdueRevenue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  const directoryDepts = [
    { icon: Activity, iconBg: "bg-blue-100 text-blue-700", label: "Operations", head: "Richard Okello", role: "Ops Head" },
    { icon: Users, iconBg: "bg-purple-100 text-purple-700", label: "Human Resources", head: "Grace Kiconco", role: "HR Head" },
    { icon: ShieldCheck, iconBg: "bg-emerald-100 text-emerald-700", label: "Client CRM", head: "David Ssemwogerere", role: "Client Rep" },
    { icon: DollarSign, iconBg: "bg-amber-100 text-amber-700", label: "Finance & Cashier", head: "Agnes Nabanja", role: "Finance Head" },
    { icon: BarChart3, iconBg: "bg-rose-100 text-rose-700", label: "Marketing & Sales", head: "Brian Mukasa", role: "Sales Lead" },
    { icon: Building, iconBg: "bg-indigo-100 text-indigo-700", label: "Fleet", head: "Patrick Kigozi", role: "Fleet Head" },
    { icon: ShieldCheck, iconBg: "bg-cyan-100 text-cyan-700", label: "IT & Systems", head: "Alex Ssenyonjo", role: "IT Head" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Executive Directorate: {activeRole}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Corporate Governance & Strategic Oversight</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">Enterprise-wide KPIs and strategic performance indicators.</p>
        </div>
      </div>

      {/* Strategic KPIs */}
      <DashboardKpiCards activeGuards={activeGuards} totalGuards={totalGuards} issuedWeapons={issuedWeapons} activeK9s={activeK9s} openIncidents={openIncidents} />

      {/* Enterprise Analytics */}
      <EnterpriseAnalyticsPanel guards={guards} sites={sites} incidents={incidents} invoices={invoices} leaveRequests={leaveRequests} performanceReviews={performanceReviews} />

      {/* Critical Alerts Strip */}
      <ExecutiveAlertsStrip
        criticalIncidents={criticalIncidents}
        nonCompliantSites={nonCompliantSites}
        suspendedGuards={suspendedGuards}
        overdueRevenue={overdueRevenue}
        onNavigate={onNavigate}
      />

      {/* Enterprise Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Departmental Leadership & RBAC</h3>
            <p className="text-xs text-slate-500">Department heads responsible for each operational unit</p>
          </div>
        </div>
        <DepartmentDirectoryGrid departments={directoryDepts} />
      </div>

      {/* Client Sites */}
      <DashboardClientSitesList sites={sites} onNavigate={onNavigate} />

      <DashboardAuditLog auditLogs={auditLogs} />
    </div>
  );
};
