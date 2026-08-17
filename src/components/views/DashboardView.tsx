import React from "react";
import {
  ShieldCheck,
} from "lucide-react";
import { Guard, ClientSite, Incident, AuditLog, UserRole, Invoice, ArmouryItem, K9Dog } from "../../types";
import { ConsolidatedDashboardMetrics, DashboardClientSitesList, DashboardAuditLog, EnterpriseAnalyticsPanel, ExecutiveAlertsStrip } from "../organisms";
import { consolidateDashboardMetrics } from "../../utils/dashboardMetrics";

interface DashboardViewProps {
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  auditLogs: AuditLog[];
  activeRole: UserRole;
  onNavigate: (tabId: string) => void;
  armoury?: ArmouryItem[];
  k9s?: K9Dog[];
  invoices?: Invoice[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  guards, sites, incidents, auditLogs, activeRole, onNavigate,
  armoury = [], k9s = [],
  invoices = [],
}) => {
  const issuedWeapons = armoury.filter((a) => a.location === "Issued Out").length;
  const activeK9s = k9s.filter((d) => d.status === "Active Duty").length;

  const metrics = consolidateDashboardMetrics({
    guards, sites, incidents, invoices, k9s, armoury,
  });

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

      {/* Critical Alerts Strip — decision items first (F4) */}
      <ExecutiveAlertsStrip
        criticalIncidents={metrics.executiveAttention.criticalIncidents}
        nonCompliantSites={metrics.executiveAttention.nonCompliantSites}
        suspendedGuards={metrics.executiveAttention.suspendedGuards}
        overdueRevenue={metrics.executiveAttention.overdueRevenue}
        onNavigate={onNavigate}
      />

      {/* Consolidated Strategic KPIs — single source for all summary metrics (F1, F2, F3) */}
      <ConsolidatedDashboardMetrics
        activeGuards={metrics.guards.active}
        totalGuards={metrics.guards.required}
        revenueCollectionPct={metrics.revenue.collectionPercentage}
        overdueRevenue={metrics.revenue.overdue}
        openIncidents={metrics.alerts.open}
        issuedWeapons={issuedWeapons}
        activeK9s={activeK9s}
        criticalIncidents={metrics.alerts.critical}
        nonCompliantSites={metrics.executiveAttention.nonCompliantSites}
        suspendedGuards={metrics.guards.suspended}
        paidRevenue={metrics.revenue.paid}
        totalRevenue={metrics.revenue.total}
      />

      {/* Enterprise Analytics — drill-down charts, not summary duplicates */}
      <EnterpriseAnalyticsPanel guards={guards} sites={sites} invoices={invoices} />

      {/* Client Sites */}
      <DashboardClientSitesList sites={sites} onNavigate={onNavigate} />

      {/* Security Event Summary — hidden for GM/Director executive view */}
      {activeRole !== "General Manager" && activeRole !== "Director" && (
        <DashboardAuditLog auditLogs={auditLogs} />
      )}
    </div>
  );
};
