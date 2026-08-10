import React, { useMemo } from "react";
import {
  ArrowLeft,
  MapPin,
  Users,
  Building2,
  ShieldAlert,
  Activity,
  Dog,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Phone,
  Mail,
  Truck,
  FileWarning,
  ClipboardCheck,
  ChevronRight,
  Layers,
  CircleCheck,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import type {
  RegionalOffice,
  Guard,
  ClientSite,
  Incident,
  DutyRoster,
  PatrolInspectionLog,
  ArmouryItem,
  K9Dog,
  ContractRecord,
  LeaveRequest,
  SiteDeployment,
  DeploymentOrder,
  Complaint,
  DisciplinaryAction,
  Vehicle,
} from "../../types";
import { formatRegionLabel } from "../../constants/regions";
import {
  resolveGuardRegion,
  resolveIncidentRegion,
  resolveRosterRegion,
  resolvePatrolRegion,
  resolveDeploymentRegion,
  resolveLeaveRegion,
  resolveDisciplinaryRegion,
  resolveComplaintRegion,
} from "../../utils/regionUtils";

interface RegionDashboardViewProps {
  regionName: string;
  offices?: RegionalOffice[];
  guards: Guard[];
  sites: ClientSite[];
  incidents: Incident[];
  roster: DutyRoster[];
  patrolInspections: PatrolInspectionLog[];
  armoury: ArmouryItem[];
  k9s: K9Dog[];
  contracts: ContractRecord[];
  leaveRequests: LeaveRequest[];
  deployments: SiteDeployment[];
  deploymentOrders: DeploymentOrder[];
  complaints: Complaint[];
  disciplinaryActions: DisciplinaryAction[];
  vehicles: Vehicle[];
  onBack: () => void;
}

const CHART_COLORS = ["#06b6d4", "#059669", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"];

function severityColor(severity: string): string {
  switch (severity) {
    case "Critical":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "High":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Medium":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}

function slaColor(status: string): string {
  switch (status) {
    case "Compliant":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Attention Needed":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-rose-100 text-rose-700 border-rose-200";
  }
}

export const RegionDashboardView: React.FC<RegionDashboardViewProps> = ({
  regionName,
  offices = [],
  guards,
  sites,
  incidents,
  roster,
  patrolInspections,
  armoury,
  k9s,
  contracts,
  leaveRequests,
  deployments,
  deploymentOrders,
  complaints,
  disciplinaryActions,
  vehicles,
  onBack,
}) => {
  const region = regionName;

  const stats = useMemo(() => {
    const office = offices.find(
      (o) => (o as RegionalOffice).regionName === region || (o as { name?: string }).name === region
    );

    const regionSites = sites.filter((s) => s.region === region);
    const regionGuards = guards.filter((g) => resolveGuardRegion(g, sites) === region);
    const regionIncidents = incidents.filter((i) => resolveIncidentRegion(i, sites) === region);
    const regionRoster = roster.filter((r) => resolveRosterRegion(r, sites) === region);
    const regionPatrols = patrolInspections.filter((p) => resolvePatrolRegion(p, sites) === region);
    const regionContracts = contracts.filter((c) => c.region === region);
    const regionDeployments = deployments.filter((d) => resolveDeploymentRegion(d, sites) === region);
    const regionOrders = deploymentOrders.filter((o) => o.region === region);
    const regionLeave = leaveRequests.filter((l) => resolveLeaveRegion(l, guards, sites) === region);
    const regionComplaints = complaints.filter((c) => resolveComplaintRegion(c, sites) === region);
    const regionDisciplinary = disciplinaryActions.filter((d) => resolveDisciplinaryRegion(d, guards, sites) === region);

    const guardIds = new Set(regionGuards.map((g) => g.id));
    const regionArmouryIssued = armoury.filter(
      (a) => a.assignedToGuardId && guardIds.has(a.assignedToGuardId)
    );
    const handlerIds = new Set(
      regionGuards.filter((g) => g.designation === "K9 Handler").map((g) => g.id)
    );
    const regionK9s = k9s.filter((k) => k.assignedHandlerId && handlerIds.has(k.assignedHandlerId));

    const deployed = regionGuards.filter((g) => g.lifecycleStage === "DEPLOYED").length;
    const onDuty = regionGuards.filter((g) => g.status === "On Duty").length;
    const onLeave = regionGuards.filter((g) => g.status === "On Leave").length;
    const suspended = regionGuards.filter((g) => g.status === "Suspended").length;
    const deserted = regionGuards.filter((g) => g.status === "Deserted").length;

    const compliantSites = regionSites.filter((s) => s.slaStatus === "Compliant").length;
    const atRiskSites = regionSites.filter((s) => s.slaStatus !== "Compliant").length;
    const deployedSites = regionSites.filter((s) => s.deploymentStatus === "Deployed").length;

    const openIncidents = regionIncidents.filter((i) => i.status === "Open" || i.status === "Under Investigation" || i.status === "Escalated");
    const criticalIncidents = regionIncidents.filter((i) => i.severity === "Critical" && openIncidents.includes(i));
    const resolvedIncidents = regionIncidents.filter((i) => i.status === "Resolved");

    const rosterPresent = regionRoster.filter((r) => r.status === "Present").length;
    const rosterAbsent = regionRoster.filter((r) => r.status === "Absent").length;
    const rosterOvertime = regionRoster.filter((r) => r.status === "On Overtime").length;
    const rosterScheduled = regionRoster.filter((r) => r.status === "Scheduled").length;
    const attendancePct = regionRoster.length > 0 ? Math.round((rosterPresent / regionRoster.length) * 100) : 0;

    const activeClientContracts = regionContracts.filter(
      (c) => c.contractType === "Client Contract" && c.status === "Active"
    );
    const contractValue = activeClientContracts.reduce((sum, c) => sum + (c.valueUgx ?? 0), 0);
    const expiringContracts = regionContracts.filter((c) => c.status === "Expiring Soon");

    const pendingLeave = regionLeave.filter((l) => l.status.startsWith("Pending"));

    const totalShiftGuardDemand = regionSites.reduce((sum, s) => sum + s.dayShiftGuards + s.nightShiftGuards, 0);
    const armedGuardsRequired = regionSites.reduce((sum, s) => sum + s.armedGuardsRequired, 0);
    const k9Sites = regionSites.filter((s) => s.k9Required).length;

    const guardStatusData = [
      { name: "On Duty", value: onDuty, color: "#059669" },
      { name: "Off Duty", value: regionGuards.length - onDuty - onLeave - suspended - deserted, color: "#94a3b8" },
      { name: "On Leave", value: onLeave, color: "#f59e0b" },
      { name: "Suspended", value: suspended, color: "#ef4444" },
      { name: "Deserted", value: deserted, color: "#7f1d1d" },
    ].filter((d) => d.value > 0);

    const lifecycleKeys: Guard["lifecycleStage"][] = [
      "ENROLLED",
      "HANDED_TO_OPERATIONS",
      "IN_TRAINING",
      "PASSED_OUT",
      "DEPLOYED",
    ];
    const lifecycleData = lifecycleKeys.map((stage) => ({
      name: (stage ?? "DEPLOYED").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      value: regionGuards.filter((g) => g.lifecycleStage === stage).length,
    }));

    const slaData = ["Compliant", "Understaffed", "Attention Needed"].map((k) => ({
      name: k,
      value: regionSites.filter((s) => s.slaStatus === k).length,
    })).filter((d) => d.value > 0);

    const severityData = ["Critical", "High", "Medium", "Low"].map((k) => ({
      name: k,
      value: regionIncidents.filter((i) => i.severity === k).length,
    })).filter((d) => d.value > 0);

    const rosterData = [
      { name: "Scheduled", value: rosterScheduled, color: "#3b82f6" },
      { name: "Present", value: rosterPresent, color: "#059669" },
      { name: "Absent", value: rosterAbsent, color: "#ef4444" },
      { name: "Overtime", value: rosterOvertime, color: "#8b5cf6" },
    ].filter((d) => d.value > 0);

    const monthLabels: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthLabels.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
      });
    }
    const incidentTrendData = monthLabels.map(({ key, label }) => ({
      name: label,
      incidents: regionIncidents.filter((inc) => (inc.incidentDate ?? "").startsWith(key)).length,
    }));

    const guardsBySite = regionSites.map((s) => ({
      site: s.siteName,
      assigned: regionGuards.filter((g) => g.assignedSite === s.siteName).length,
      demand: s.dayShiftGuards + s.nightShiftGuards,
    }));

    const rankBreakdown = [
      { rank: "Guard", value: regionGuards.filter((g) => g.designation === "Guard").length, color: "#64748b" },
      { rank: "Site In-Charge", value: regionGuards.filter((g) => g.designation === "Site In-Charge").length, color: "#06b6d4" },
      { rank: "Inspector", value: regionGuards.filter((g) => g.designation === "Inspector").length, color: "#8b5cf6" },
      { rank: "K9 Handler", value: regionGuards.filter((g) => g.designation === "K9 Handler").length, color: "#059669" },
      { rank: "Armorer", value: regionGuards.filter((g) => g.designation === "Armorer").length, color: "#f59e0b" },
    ].filter((d) => d.value > 0);

    const zoneInspectors = regionGuards.filter((g) => g.designation === "Inspector");

    const perSiteArmed = regionSites.map((s) => ({
      site: s.siteName,
      armed: (s.dayShiftArmed || 0) + (s.nightShiftArmed || 0),
      unarmed:
        Math.max(0, s.dayShiftGuards - (s.dayShiftArmed || 0)) +
        Math.max(0, s.nightShiftGuards - (s.nightShiftArmed || 0)),
    }));

    const deploymentOrdersOpen = regionOrders.filter((o) => o.status === "Open").length;

    const openComplaints = regionComplaints.filter((c) => c.status === "Open" || c.status === "Investigating");

    const recentIncidents = [...regionIncidents]
      .sort((a, b) => (b.incidentDate ?? "").localeCompare(a.incidentDate ?? ""))
      .slice(0, 8);

    const recentPatrols = [...regionPatrols].sort((a, b) => b.inspectionTime.localeCompare(a.inspectionTime)).slice(0, 6);

    const recentLeave = [...regionLeave].sort((a, b) => b.appliedDate.localeCompare(a.appliedDate)).slice(0, 6);

    const activeDeployments = regionDeployments.filter((d) => d.status === "Active").length;

    const regionVehicles = vehicles.filter((v) => v.deploymentBranch === region);

    const topRiskSites = [...regionSites]
      .filter((s) => s.slaStatus !== "Compliant")
      .sort((a, b) => {
        const rank = (s: ClientSite) =>
          (s.slaStatus === "Understaffed" ? 2 : 1) * 100 + (s.dayShiftGuards + s.nightShiftGuards);
        return rank(b) - rank(a);
      })
      .slice(0, 4);

    return {
      office,
      regionSites,
      regionGuards,
      regionIncidents,
      regionRoster,
      regionPatrols,
      regionContracts,
      regionDeployments,
      regionOrders,
      regionLeave,
      regionComplaints,
      regionDisciplinary,
      regionArmouryIssued,
      regionK9s,
      deployed,
      onDuty,
      compliantSites,
      atRiskSites,
      deployedSites,
      openIncidents,
      criticalIncidents,
      resolvedIncidents,
      attendancePct,
      contractValue,
      expiringContracts,
      pendingLeave,
      totalShiftGuardDemand,
      armedGuardsRequired,
      k9Sites,
      guardStatusData,
      lifecycleData,
      slaData,
      severityData,
      rosterData,
      incidentTrendData,
      guardsBySite,
      rankBreakdown,
      zoneInspectors,
      perSiteArmed,
      deploymentOrdersOpen,
      openComplaints,
      recentIncidents,
      recentPatrols,
      recentLeave,
      activeDeployments,
      regionVehicles,
      topRiskSites,
      guardTotal: regionGuards.length,
      siteTotal: regionSites.length,
    };
  }, [regionName, offices, guards, sites, incidents, roster, patrolInspections, armoury, k9s, contracts, leaveRequests, deployments, deploymentOrders, complaints, disciplinaryActions, vehicles]);

  const {
    office,
    guardTotal,
    siteTotal,
    deployed,
    onDuty,
    compliantSites,
    atRiskSites,
    deployedSites,
    openIncidents,
    criticalIncidents,
    resolvedIncidents,
    attendancePct,
    contractValue,
    expiringContracts,
    pendingLeave,
    totalShiftGuardDemand,
    armedGuardsRequired,
    k9Sites,
    guardStatusData,
    lifecycleData,
    slaData,
    severityData,
    rosterData,
    incidentTrendData,
    guardsBySite,
    rankBreakdown,
    zoneInspectors,
    perSiteArmed,
    deploymentOrdersOpen,
    openComplaints,
    recentIncidents,
    recentPatrols,
    recentLeave,
    activeDeployments,
    regionVehicles,
    topRiskSites,
    regionArmouryIssued,
    regionK9s,
    regionContracts,
    regionIncidents,
    regionRoster,
    regionPatrols,
  } = stats;

  const KPI = ({ icon: Icon, label, value, sub, tone }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub?: React.ReactNode;
    tone: string;
  }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-xl ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-black text-slate-900 leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl shadow-xl border border-slate-700/80 overflow-hidden relative">
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="p-5 sm:p-6 relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
                <MapPin className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{formatRegionLabel(region as never)}</h2>
                  {office && (
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {office.name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Live Analytics
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Regional operations command view — guard strength, site coverage, incidents, attendance,
                  contracts and field supervision in {formatRegionLabel(region as never)}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl border border-slate-700/70 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Regions
              </button>
            </div>
          </div>

          {(office || regionVehicles.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              {office && (
                <>
                  {office.regionalManagerName && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      RM: <strong>{office.regionalManagerName}</strong>
                    </span>
                  )}
                  {office.locationCity && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {office.locationCity}
                    </span>
                  )}
                  {office.armouryVaultStatus && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Vault: {office.armouryVaultStatus}
                    </span>
                  )}
                  {office.phone && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                      {office.phone}
                    </span>
                  )}
                  {office.email && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      {office.email}
                    </span>
                  )}
                </>
              )}
              {regionVehicles.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-200">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  {regionVehicles.length} vehicles in region
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          icon={Users}
          label="Guard Strength"
          value={String(guardTotal)}
          tone="bg-cyan-50 text-cyan-700"
          sub={
            <>
              <span className="text-emerald-600 font-bold">{deployed} deployed</span>
              <span className="mx-1">•</span>
              <span>{onDuty} on duty</span>
            </>
          }
        />
        <KPI
          icon={Building2}
          label="Client Sites"
          value={String(siteTotal)}
          tone="bg-emerald-50 text-emerald-700"
          sub={
            <>
              <span className="text-emerald-600 font-bold">{compliantSites} compliant</span>
              <span className="mx-1">•</span>
              <span>{atRiskSites} at risk</span>
            </>
          }
        />
        <KPI
          icon={ShieldAlert}
          label="Open Incidents"
          value={String(openIncidents.length)}
          tone="bg-rose-50 text-rose-700"
          sub={
            criticalIncidents.length > 0 ? (
              <span className="text-rose-600 font-bold">{criticalIncidents.length} critical</span>
            ) : (
              <span className="text-emerald-600 font-bold">{resolvedIncidents.length} resolved</span>
            )
          }
        />
        <KPI
          icon={Activity}
          label="Shift Attendance"
          value={`${attendancePct}%`}
          tone="bg-violet-50 text-violet-700"
          sub={<span>{regionRoster.length} roster entries</span>}
        />
        <KPI
          icon={Briefcase}
          label="Contract Value"
          value={contractValue > 0 ? `${Math.round(contractValue / 1_000_000)}M UGX` : "—"}
          tone="bg-blue-50 text-blue-700"
          sub={
            expiringContracts.length > 0 ? (
              <span className="text-amber-600 font-bold">{expiringContracts.length} expiring soon</span>
            ) : (
              <span>{regionContracts.length} contracts</span>
            )
          }
        />
        <KPI
          icon={CalendarClock}
          label="Pending Leave"
          value={String(pendingLeave.length)}
          tone="bg-amber-50 text-amber-700"
          sub={<span>{activeDeployments} active deployments</span>}
        />
        <KPI
          icon={Layers}
          label="Armoury Issued"
          value={String(regionArmouryIssued.length)}
          tone="bg-slate-50 text-slate-700"
          sub={<span>{armedGuardsRequired} armed posts required</span>}
        />
        <KPI
          icon={Dog}
          label="Canine Unit"
          value={String(regionK9s.length)}
          tone="bg-teal-50 text-teal-700"
          sub={<span>{k9Sites} K9-required sites</span>}
        />
      </div>

      {/* Risk strip */}
      {(atRiskSites > 0 || criticalIncidents.length > 0 || deploymentOrdersOpen > 0 || openComplaints.length > 0) && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-slate-900">Attention Needed</div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
            {atRiskSites > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                {atRiskSites} sites breaching SLA
              </span>
            )}
            {criticalIncidents.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                {criticalIncidents.length} critical incident{criticalIncidents.length > 1 ? "s" : ""} open
              </span>
            )}
            {deploymentOrdersOpen > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                {deploymentOrdersOpen} open deployment order{deploymentOrdersOpen > 1 ? "s" : ""}
              </span>
            )}
            {openComplaints.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                {openComplaints.length} open complaint{openComplaints.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Guard Status Breakdown</h3>
              <p className="text-[11px] text-slate-500">Active duty posture for all guards in region</p>
            </div>
          </div>
          {guardStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={guardStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="Guards" radius={[6, 6, 0, 0]}>
                  {guardStatusData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No guard records for this region yet" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Site SLA Status</h3>
              <p className="text-[11px] text-slate-500">{siteTotal} client sites across the region</p>
            </div>
          </div>
          {slaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={slaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {slaData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No sites recorded for this region yet" />
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {slaData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Incidents by Severity</h3>
              <p className="text-[11px] text-slate-500">{regionIncidents.length} total incidents logged</p>
            </div>
          </div>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {severityData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No incidents logged in this region" />
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {severityData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Incident Trend</h3>
              <p className="text-[11px] text-slate-500">Incidents logged per month (last 6 months)</p>
            </div>
          </div>
          {incidentTrendData.some((d) => d.incidents > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={incidentTrendData}>
                <defs>
                  <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#ef4444" strokeWidth={2} fill="url(#incidentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No incident activity in the last 6 months" />
          )}
        </div>
      </div>

      {/* Lifecycle + attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Guard Lifecycle Pipeline</h3>
              <p className="text-[11px] text-slate-500">From enrolment to deployment</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lifecycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" name="Guards" radius={[6, 6, 0, 0]} fill="#0ea5e9">
                {lifecycleData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Roster Attendance</h3>
              <p className="text-[11px] text-slate-500">{regionRoster.length} roster entries</p>
            </div>
          </div>
          {rosterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rosterData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {rosterData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No roster entries for this region" />
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {rosterData.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage demand + risk sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Guards Assigned vs Required</h3>
              <p className="text-[11px] text-slate-500">{totalShiftGuardDemand} total shift positions across {siteTotal} sites</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={guardsBySite}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="site" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="assigned" name="Guards Assigned" radius={[6, 6, 0, 0]} fill="#06b6d4" />
              <Bar dataKey="demand" name="Shift Positions" radius={[6, 6, 0, 0]} fill="#cbd5e1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <FileWarning className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">SLA Risk Register</h3>
              <p className="text-[11px] text-slate-500">Sites needing corrective action</p>
            </div>
          </div>
          {topRiskSites.length > 0 ? (
            <div className="space-y-2">
              {topRiskSites.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black text-slate-900 truncate">{s.siteName}</div>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${slaColor(s.slaStatus)}`}>
                      {s.slaStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {s.dayShiftGuards + s.nightShiftGuards} guards on roster · {s.armedGuardsRequired} armed required
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    Client: {s.clientName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <div className="text-xs font-black text-slate-700">All sites compliant</div>
              <div className="text-[10px] text-slate-500">No SLA breaches in this region</div>
            </div>
          )}
        </div>
      </div>

      {/* Field ranks + per-site armed posture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Field Rank & Supervision</h3>
              <p className="text-[11px] text-slate-500">Guard → Site In-Charge → Inspector</p>
            </div>
          </div>
          {rankBreakdown.length > 0 ? (
            <div className="space-y-2">
              {rankBreakdown.map((r) => (
                <div key={r.rank} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="flex items-center gap-2 text-xs font-black text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                    {r.rank}
                  </span>
                  <span className="text-sm font-black text-slate-900">{r.value}</span>
                </div>
              ))}
              {zoneInspectors.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Inspectors on post</div>
                  <div className="flex flex-wrap gap-1.5">
                    {zoneInspectors.map((zi) => (
                      <span key={zi.id} className="inline-flex flex-col px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-[10px] font-bold text-purple-800" title={zi.zone ? `Zone: ${zi.zone}` : "No zone assigned"}>
                        {zi.fullName}
                        {zi.zone ? <span className="text-purple-500">Zone: {zi.zone}</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState label="No rank data for this region" />
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Armed Posture per Site</h3>
              <p className="text-[11px] text-slate-500">Armed vs unarmed guard slots per client site in the region</p>
            </div>
          </div>
          {perSiteArmed.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perSiteArmed}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="site" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="armed" name="Armed" stackId="a" fill="#7c3aed" radius={[0, 0, 4, 4]} />
                <Bar dataKey="unarmed" name="Unarmed" stackId="a" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState label="No sites recorded for this region yet" />
          )}
        </div>
      </div>

      {/* Recent incidents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Recent Incidents</h3>
            <p className="text-[11px] text-slate-500">Latest logged incidents in the region</p>
          </div>
        </div>
        {recentIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="pb-2 pr-3 font-black">Code</th>
                  <th className="pb-2 pr-3 font-black">Incident</th>
                  <th className="pb-2 pr-3 font-black">Site</th>
                  <th className="pb-2 pr-3 font-black">Severity</th>
                  <th className="pb-2 pr-3 font-black">Status</th>
                  <th className="pb-2 font-black">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentIncidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">{inc.incidentCode}</td>
                    <td className="py-2 pr-3 text-xs font-black text-slate-900">{inc.title}</td>
                    <td className="py-2 pr-3 text-[11px] text-slate-600 whitespace-nowrap">{inc.siteName}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${severityColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-[11px] font-bold text-slate-600">{inc.status}</td>
                    <td className="py-2 text-[11px] text-slate-500 whitespace-nowrap">{inc.incidentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState label="No incidents recorded in this region yet" />
        )}
      </div>

      {/* Patrol inspections + leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Recent Patrol Inspections</h3>
              <p className="text-[11px] text-slate-500">Supervisor checks across the region</p>
            </div>
          </div>
          {recentPatrols.length > 0 ? (
            <div className="space-y-2">
              {recentPatrols.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className={`p-2 rounded-lg ${p.overallRating === "Satisfactory" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {p.overallRating === "Satisfactory" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate">{p.siteName}</div>
                    <div className="text-[10px] text-slate-500">
                      {p.supervisorName} • {p.guardOnDuty} • {p.inspectionTime}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${p.overallRating === "Satisfactory" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"}`}>
                      {p.overallRating}
                    </span>
                    <span className="text-[9px] text-slate-400">{p.radioCheckStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No patrol inspections for this region" />
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Leave Requests</h3>
              <p className="text-[11px] text-slate-500">{pendingLeave.length} pending · latest requests below</p>
            </div>
          </div>
          {recentLeave.length > 0 ? (
            <div className="space-y-2">
              {recentLeave.map((l) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-slate-900 truncate">{l.guardName}</div>
                    <div className="text-[10px] text-slate-500">
                      {l.leaveType} • {l.startDate} → {l.endDate} ({l.durationDays}d)
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                    l.status.startsWith("Pending")
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : l.status === "Approved"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-rose-100 text-rose-700 border-rose-200"
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No leave requests for this region" />
          )}
        </div>
      </div>

      {/* Footer strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <MiniStat label="Deployed Sites" value={String(deployedSites)} />
        <MiniStat label="Open Orders" value={String(deploymentOrdersOpen)} />
        <MiniStat label="Active Deployments" value={String(activeDeployments)} />
        <MiniStat label="Patrol Checks" value={String(regionPatrols.length)} />
      </div>
    </div>
  );
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CircleCheck className="w-8 h-8 text-slate-300 mb-2" />
      <div className="text-xs font-black text-slate-400">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3">
      <div className="text-lg font-black text-slate-900">{value}</div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
