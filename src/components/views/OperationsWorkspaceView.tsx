/**
 * Operations Workspace — the single curated landing for the Operations module.
 *
 * The Operations Manager / Regional Manager / Fleet Manager get a tabbed
 * workspace. Full CRUD is deliberately restricted: only Deployment Orders and
 * Guard Lifecycle transitions are owned here. Armoury, K9 and Patrol are
 * read-only with "log activity" actions (issue/return, deployment, vet check,
 * patrol radio check). Armorer, K9 Supervisor/Handler and Training Officer get
 * their dedicated management views via OperationsPage role-branching.
 *
 * Regional Managers see the same workspace scoped to their region.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Car,
  MapPin,
  ClipboardList,
  Truck,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Fuel,
  Users,
  Briefcase,
  Shield,
  Dog,
  ShieldCheck,
  ScrollText,
  FileText,
  BarChart3,
  Search,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole } from "../../services/rbacService";
import {
  CommandStrip,
  ShiftsAttendancePanel,
  GuardLifecycleBoard,
  TrainingAcademyOversight,
  InvestigationsCollaboration,
  ArmouryStatusPanel,
  K9ReadinessPanel,
  StaffClientAnalytics,
  RecruitmentPipeline,
  ActivityAuditFeed,
} from "./OpsDeepPanels";
import { SiteSurveysPanel } from "./SiteSurveysPanel";
import { ContractsSnapshotPanel } from "./ContractsSnapshotPanel";
import { ReportsView } from "./ReportsView";
import type {
  AdminRequisition,
  DeploymentOrder,
  Guard,
  K9Log,
  K9HealthInspection,
  PatrolInspectionLog,
  TransportRequest,
  UserRole,
} from "../../types";

const FLEET_MANAGER: UserRole = "Fleet Manager";
const OPERATIONS_MANAGER: UserRole = "Operations Manager";
const REGIONAL_MANAGER: UserRole = "Regional Manager";

const LIFECYCLE_FLOW: Guard["lifecycleStage"][] = [
  "ENROLLED",
  "HANDED_TO_OPERATIONS",
  "IN_TRAINING",
  "PASSED_OUT",
  "DEPLOYED",
];

const TABS = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "deployments", label: "Deployments", icon: Briefcase },
  { id: "personnel", label: "Personnel", icon: Users },
  { id: "armoury", label: "Armoury", icon: Shield },
  { id: "k9", label: "Canine Unit", icon: Dog },
  { id: "patrol", label: "Patrols", icon: ShieldCheck },
  { id: "incidents", label: "Incidents", icon: AlertTriangle },
  { id: "surveys", label: "Surveys & Contracts", icon: FileText },
  { id: "oversight", label: "Oversight", icon: ScrollText },
  { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_STYLE: Record<string, string> = {
  "Pending Fleet": "bg-amber-100 text-amber-700 border-amber-200",
  "Pending Approval": "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Declined: "bg-rose-100 text-rose-700 border-rose-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Procured: "bg-sky-100 text-sky-700 border-sky-200",
  "In Transit": "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const badge = (status: string) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
  >
    {status}
  </span>
);

export const OperationsWorkspaceView: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const activeRole = getEffectiveRole(currentUser) ?? null;

  const isFleetManager = activeRole === FLEET_MANAGER;
  const isOpsManager = activeRole === OPERATIONS_MANAGER;
  const isRM = activeRole === REGIONAL_MANAGER;
  const region = isRM ? currentUser?.region : undefined;

  const [tab, setTab] = useState<TabId>("overview");
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);

  const myName = currentUser?.name ?? "";
  const myId = currentUser?.id ?? "";

  const myTransport = useMemo(
    () => domain.transportRequests.filter((t) => t.requestedBy === myId || t.requestedByName === myName),
    [domain.transportRequests, myName, myId]
  );
  const myRequisitions = useMemo(
    () => domain.adminRequisitions.filter((r) => r.requestedBy === myName),
    [domain.adminRequisitions, myName]
  );
  const pendingTransport = useMemo(
    () => domain.transportRequests.filter((t) => t.status === "Pending Fleet"),
    [domain.transportRequests]
  );

  const scopeLabel = isRM && region ? region : "All Regions";

  return (
    <div className="space-y-6">
      {/* Header + pinned quick actions */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-900 text-cyan-300">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-black uppercase border border-cyan-800">
                Operations Workspace
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {activeRole} • {scopeLabel}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
              Command Overview
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isOpsManager
                ? "Regions, deployments, and your open requests — everything an operations lead needs in one place."
                : "Regions, fleet readiness, deployments, and your open requests — everything an operations lead needs in one place."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransportModal(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Truck className="w-4 h-4" /> Request Transport
          </button>
          <button
            onClick={() => setShowReqModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4" /> New Requisition
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                active ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Overview ─── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <CommandStrip region={region} />

          <div className={`grid gap-6 ${isOpsManager ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
            <section className={`bg-white rounded-3xl p-5 border border-slate-200 shadow-sm ${isOpsManager ? "" : "lg:col-span-2"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Regions Command</h2>
                </div>
                {isOpsManager && (
                  <button
                    onClick={() => navigate("/operations/regions")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    Region dashboards <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domain.regionalOffices
                  .filter((office) => !isRM || office.regionName === region)
                  .map((office) => {
                    const openOrders = domain.deploymentOrders.filter(
                      (d) => d.region === office.regionName && d.status === "Open"
                    ).length;
                    return (
                      <button
                        key={office.id}
                        onClick={() => navigate(`/operations/regions/${encodeURIComponent(office.regionName)}`)}
                        className="text-left p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{office.name}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{office.locationCity}</p>
                            </div>
                          </div>
                          {openOrders > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
                              {openOrders} open
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-black text-slate-900">{office.activeGuardsCount}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Guards</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900">{office.clientSitesCount}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Sites</p>
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900">{office.vehiclesAssigned}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicles</p>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3" /> RM: {office.regionalManagerName}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </section>

            {isFleetManager ? (
              <TransportInbox
                pending={pendingTransport}
                vehicles={domain.vehicles}
                drivers={domain.drivers}
                onAct={domain.actOnTransportRequest}
              />
            ) : isOpsManager ? null : (
              <FleetReadinessPanel />
            )}
          </div>

          <div className={`grid gap-6 ${isOpsManager ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
            <MyRequestsPanel transport={myTransport} requisitions={myRequisitions} role={activeRole} />
            {isFleetManager ? (
              <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
                <p className="text-xs font-black text-slate-700">Fleet Manager — your transport queue is above</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-xs">
                  Approved and declined requests notify the requester immediately.
                </p>
              </section>
            ) : isOpsManager ? null : (
              <FleetSummaryPanel />
            )}
          </div>
        </div>
      )}

      {/* ─── Deployments ─── */}
      {tab === "deployments" && <DeploymentsTab region={region} />}

      {/* ─── Personnel ─── */}
      {tab === "personnel" && <PersonnelTab region={region} />}

      {/* ─── Armoury ─── */}
      {tab === "armoury" && <ArmouryTab />}

      {/* ─── K9 ─── */}
      {tab === "k9" && <K9Tab />}

      {/* ─── Patrol ─── */}
      {tab === "patrol" && <PatrolTab />}

      {/* ─── Surveys & Contracts ─── */}
      {tab === "surveys" && (
        <div className="space-y-6">
          <SiteSurveysPanel />
          <ContractsSnapshotPanel />
        </div>
      )}

      {/* ─── Incidents (single tab/section per §10/§12) ─── */}
      {tab === "incidents" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Incidents Collaboration</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Security incidents, breaches and complaints surfaced here for Operations — full case management lives in the Investigations module.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {domain.incidents.filter((i) => i.status !== "Resolved").length} open · {domain.incidents.filter((i) => i.status === "Resolved").length} resolved
            </span>
          </div>
          <div className="space-y-3">
            {domain.incidents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-xs text-slate-400 italic">
                No incidents recorded yet.
              </div>
            ) : (
              domain.incidents.map((inc) => (
                <div key={inc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{inc.incidentCode}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inc.severity === "Critical" ? "bg-red-600 text-white" : inc.severity === "High" ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-800"
                      }`}>{inc.severity}</span>
                      {inc.status === "Resolved"
                        ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Resolved</span>
                        : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">{inc.status}</span>}
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-2">{inc.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <strong>{inc.siteName}</strong> · Reported by {inc.reportedByGuard} on {inc.incidentDate}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{inc.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Oversight ─── */}
      {tab === "oversight" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ShiftsAttendancePanel region={region} />
            <TrainingAcademyOversight />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <InvestigationsCollaboration region={region} />
            <StaffClientAnalytics region={region} />
            <RecruitmentPipeline />
          </div>
          <ActivityAuditFeed />
        </div>
      )}

      {/* ─── Reports ─── */}
      {tab === "reports" && (
        <ReportsView
          guards={domain.guards}
          sites={domain.sites}
          incidents={domain.incidents}
          vehicles={domain.vehicles}
          invoices={domain.invoices}
          expenses={domain.expenses}
          leaveRequests={domain.leaveRequests}
          performanceReviews={domain.performanceReviews}
        />
      )}

      {/* Quick-action note for non-Ops roles */}
      {!isOpsManager && !isRM && !isFleetManager && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-[11px] text-indigo-700 font-semibold">
          <strong>Ops view note:</strong> As {activeRole}, you can raise transport and requisition requests above; the
          full Operations module (roster, deployments, armoury, K9, contracts) is managed by Operations staff.
        </div>
      )}

      {showTransportModal && (
        <TransportRequestModal
          requesterName={myName}
          requesterId={myId}
          requesterDept={currentUser?.department ?? ""}
          onClose={() => setShowTransportModal(false)}
          onSubmit={(data) => {
            domain.addTransportRequest(data);
            setShowTransportModal(false);
          }}
        />
      )}
      {showReqModal && (
        <RequisitionModal
          requesterName={myName}
          onClose={() => setShowReqModal(false)}
          onSubmit={(data) => {
            domain.addRequisition(data);
            setShowReqModal(false);
          }}
        />
      )}
    </div>
  );
};

/* ---------------- My Requests ---------------- */

const MyRequestsPanel: React.FC<{ transport: TransportRequest[]; requisitions: AdminRequisition[]; role: UserRole | null }> = ({
  transport,
  requisitions,
  role,
}) => (
  <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
    <div className="flex items-center gap-2 mb-4">
      <ClipboardList className="w-4 h-4 text-cyan-600" />
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">My Requests</h2>
      <span className="text-[10px] text-slate-400 font-bold ml-auto">
        transport → Fleet Manager · requisitions → Administration (GM final)
      </span>
    </div>
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {transport.map((t) => (
        <div key={t.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-xs font-black text-slate-700 truncate">
                {t.requestCode} — {t.purpose}
              </p>
            </div>
            {badge(t.status)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
            {t.destination} • {t.requesterDepartment} • {t.travelDate}
          </p>
          {t.status === "Approved" && t.assignedVehicle && (
            <p className="mt-1 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <Car className="w-3 h-3" /> {t.assignedVehicle}
              {t.assignedDriver ? ` • Driver: ${t.assignedDriver}` : ""}
              {t.assignedRider ? ` • Rider: ${t.assignedRider}` : ""}
            </p>
          )}
          {t.status === "Declined" && t.declinedReason && (
            <p className="mt-1 text-[11px] text-rose-600 font-bold">Reason: {t.declinedReason}</p>
          )}
        </div>
      ))}
      {requisitions.map((r) => (
        <div key={r.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ClipboardList className="w-4 h-4 text-slate-400 shrink-0" />
              <p className="text-xs font-black text-slate-700 truncate">
                {r.reqCode} — {r.itemDescription}
              </p>
            </div>
            {badge(r.status)}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
            Qty {r.quantity} • UGX {r.estimatedCostUgx.toLocaleString()} • {r.priority} priority
          </p>
          {r.status === "Rejected" && r.rejectionReason && (
            <p className="mt-1 text-[11px] text-rose-600 font-bold">Reason: {r.rejectionReason}</p>
          )}
        </div>
      ))}
      {transport.length === 0 && requisitions.length === 0 && (
        <p className="text-xs text-slate-400 font-medium text-center py-8">
          No requests yet. Use Request Transport or New Requisition to get started — you'll be notified on every decision.
        </p>
      )}
      {role === FLEET_MANAGER && (
        <p className="text-[10px] text-slate-400 font-semibold">Fleet Manager: your approval queue is the Fleet Readiness panel.</p>
      )}
    </div>
  </section>
);

/* ---------------- Deployments tab ---------------- */

const DeploymentsTab: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const [showCreate, setShowCreate] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const orders = domain.deploymentOrders.filter((o) => !region || o.region === region);
  const open = orders.filter((o) => o.status === "Open");

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Deployment Orders</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
              {open.length} open
            </span>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Issue Deployment Order
          </button>
        </div>
        <div className="space-y-2">
          {orders.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-8">No deployment orders yet.</p>
          ) : (
            orders.map((o) => {
              const fillPct = o.requiredHeadcount ? Math.round((o.assignedGuardIds.length / o.requiredHeadcount) * 100) : 0;
              return (
                <div key={o.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {o.orderCode} — {o.siteName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {o.clientName} • {o.requiredHeadcount} required · {o.assignedGuardIds.length} assigned · {o.shiftType} ·{" "}
                          {o.region ?? "HQ"} • {o.targetStartDate} → {o.targetEndDate}
                        </p>
                      </div>
                    </div>
                    {badge(o.status)}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${fillPct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-500">{fillPct}% filled</span>
                    {o.status === "Open" && (
                      <button
                        onClick={() => setAssigning(o.id)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Assign Guards
                      </button>
                    )}
                    {o.status === "Open" && (
                      <button
                        onClick={() => domain.cancelDeploymentOrder(o.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onSubmit={(data) => domain.addDeploymentOrder(data)} />}
      {assigning && (
        <AssignGuardsModal
          order={orders.find((o) => o.id === assigning)!}
          onClose={() => setAssigning(null)}
          onAssign={(guardIds) => {
            domain.assignDeploymentOrder(assigning, guardIds);
            setAssigning(null);
          }}
        />
      )}
    </div>
  );
};

const CreateOrderModal: React.FC<{ onClose: () => void; onSubmit: (data: Omit<DeploymentOrder, "id" | "orderCode" | "status" | "assignedGuardIds">) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const [siteId, setSiteId] = useState("");
  const [clientName, setClientName] = useState("");
  const [region, setRegion] = useState(domain.regionalOffices[0]?.regionName ?? "");
  const [requiredHeadcount, setRequiredHeadcount] = useState(4);
  const [shiftType, setShiftType] = useState("Day Shift");
  const [targetStartDate, setTargetStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetEndDate, setTargetEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const site = domain.sites.find((s) => s.id === siteId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      siteId,
      siteName: site?.siteName ?? "",
      clientName,
      region: site?.region ?? region,
      requiredHeadcount,
      shiftType,
      targetStartDate,
      targetEndDate,
      requestedBy: "Operations",
      notes: notes || undefined,
    });
  };

  return (
    <ModalOverlay title="Issue Deployment Order" icon={<Briefcase className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Client Site *</label>
          <select
            required
            value={siteId}
            onChange={(e) => {
              setSiteId(e.target.value);
              const s = domain.sites.find((x) => x.id === e.target.value);
              if (s) setClientName(s.clientName ?? s.siteName);
            }}
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
          >
            <option value="">Select site…</option>
            {domain.sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.siteName} — {s.region ?? "HQ"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Client Name *</label>
          <input required value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Required Headcount *</label>
            <input type="number" min={1} required value={requiredHeadcount} onChange={(e) => setRequiredHeadcount(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Shift Type *</label>
            <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Day Shift</option>
              <option>Night Shift</option>
              <option>24-Hour</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Start Date *</label>
            <input type="date" required value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">End Date *</label>
            <input type="date" required value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Region</label>
          <input value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">
            Issue Order
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
};

const AssignGuardsModal: React.FC<{ order: DeploymentOrder; onClose: () => void; onAssign: (guardIds: string[]) => void }> = ({ order, onClose, onAssign }) => {
  const domain = useDomainStore();
  const [selected, setSelected] = useState<string[]>([]);
  const available = domain.guards.filter((g) => g.lifecycleStage === "DEPLOYED" || !g.lifecycleStage);
  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <ModalOverlay title={`Assign Guards — ${order.orderCode}`} icon={<Users className="w-4 h-4" />} onClose={onClose}>
      <p className="text-[11px] text-slate-500 font-semibold mb-3">
        {order.siteName} · {order.requiredHeadcount} required · {selected.length} selected
      </p>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {available.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
              selected.includes(g.id) ? "bg-cyan-50 border-cyan-300 text-cyan-900" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <span>{g.forceNumber || g.forceNumber} — {g.fullName}</span>
            <span className="text-[10px] text-slate-400">{g.location ?? "—"}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
          Cancel
        </button>
        <button type="button" onClick={() => onAssign(selected)} disabled={selected.length === 0} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer">
          Assign {selected.length} Guard{selected.length === 1 ? "" : "s"}
        </button>
      </div>
    </ModalOverlay>
  );
};

/* ---------------- Personnel tab ---------------- */

const PersonnelTab: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const [query, setQuery] = useState("");
  const guards = domain.guards.filter((g) => !region || g.region === region || g.location === region);
  const filtered = guards.filter((g) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (g.fullName ?? "").toLowerCase().includes(q) || (g.forceNumber ?? g.forceNumber).toLowerCase().includes(q);
  });

  const advance = (g: Guard) => {
    const idx = LIFECYCLE_FLOW.indexOf(g.lifecycleStage ?? "ENROLLED");
    const next = LIFECYCLE_FLOW[Math.min(idx + 1, LIFECYCLE_FLOW.length - 1)];
    domain.moveGuardLifecycle(g.id, { lifecycleStage: next });
  };
  const regress = (g: Guard) => {
    const idx = LIFECYCLE_FLOW.indexOf(g.lifecycleStage ?? "ENROLLED");
    const prev = LIFECYCLE_FLOW[Math.max(idx - 1, 0)];
    domain.moveGuardLifecycle(g.id, { lifecycleStage: prev });
  };

  return (
    <div className="space-y-6">
      <GuardLifecycleBoard region={region} />
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Personnel by Force Number</h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search force number / name…"
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 w-64"
            />
          </div>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-8">No personnel match.</p>
          ) : (
            filtered.map((g) => {
              const stage = g.lifecycleStage ?? "ENROLLED";
              const idx = LIFECYCLE_FLOW.indexOf(stage);
              return (
                <div key={g.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800">
                      <span className="text-violet-700">{g.forceNumber || g.forceNumber}</span> — {g.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {g.location ?? g.region ?? "—"} • {g.armedQualified ? "Armed" : "Unarmed"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      idx >= 4 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-violet-100 text-violet-700 border-violet-200"
                    }`}>
                      {stage.replace(/_/g, " ")}
                    </span>
                    <button onClick={() => regress(g)} disabled={idx === 0} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer">
                      ←
                    </button>
                    <button onClick={() => advance(g)} disabled={idx === LIFECYCLE_FLOW.length - 1} className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 text-white rounded-lg text-[10px] font-bold cursor-pointer">
                      Advance →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="mt-3 text-[10px] text-slate-400 font-semibold">
          Lifecycle is owned by Operations: ENROLLED → HANDED TO OPERATIONS → IN TRAINING → PASSED OUT → DEPLOYED.
        </p>
      </section>
    </div>
  );
};

/* ---------------- Armoury tab ---------------- */

const ArmouryTab: React.FC = () => {
  const domain = useDomainStore();
  const [mode, setMode] = useState<"issue" | "return" | null>(null);
  const checkedOut = domain.armouryLogs.filter((l) => l.status === "Checked Out");

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-800 font-semibold">
        Ops logs armoury activity (issue / return). Master records — serial numbers, quantities, service status — are owned by the Armorer.
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setMode("issue")} className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
          <Shield className="w-4 h-4" /> Log Issue
        </button>
        <button onClick={() => setMode("return")} disabled={checkedOut.length === 0} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
          <XCircle className="w-4 h-4" /> Log Return ({checkedOut.length} out)
        </button>
      </div>
      <ArmouryStatusPanel />
      {mode === "issue" && (
        <IssueArmouryModal
          onClose={() => setMode(null)}
          onSubmit={(d) => {
            domain.issueArmouryItem(d.assetId, d.guardId, d.locationName, d.ammoRoundsOut, d.dateOut, d.timeOut, true, d.armourerInCharge, d.notes);
            setMode(null);
          }}
        />
      )}
      {mode === "return" && (
        <ReturnArmouryModal
          onClose={() => setMode(null)}
          onSubmit={(d) => {
            domain.returnArmouryItem(d.logId, d.ammoRoundsIn, d.dateIn, d.timeIn, true, d.substituteReceiver, d.notes);
            setMode(null);
          }}
        />
      )}
    </div>
  );
};

const IssueArmouryModal: React.FC<{ onClose: () => void; onSubmit: (d: { assetId: string; guardId: string; locationName: string; ammoRoundsOut: number; dateOut: string; timeOut: string; armourerInCharge: string; notes: string }) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const available = domain.armoury.filter((a) => a.availableQuantity > 0);
  const [assetId, setAssetId] = useState("");
  const [guardId, setGuardId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [ammoRoundsOut, setAmmoRoundsOut] = useState(0);
  const [dateOut, setDateOut] = useState(new Date().toISOString().split("T")[0]);
  const [timeOut, setTimeOut] = useState("");
  const [notes, setNotes] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ assetId, guardId, locationName, ammoRoundsOut, dateOut, timeOut, armourerInCharge: "Operations Log", notes });
  };
  return (
    <ModalOverlay title="Log Armoury Issue" icon={<Shield className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Item *</label>
          <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select item…</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.serialNumber}) — {a.availableQuantity} available
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Guard (force number) *</label>
          <select required value={guardId} onChange={(e) => setGuardId(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select guard…</option>
            {domain.guards.map((g) => (
              <option key={g.id} value={g.id}>
                {g.forceNumber || g.forceNumber} — {g.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Duty Location *</label>
          <input required value={locationName} onChange={(e) => setLocationName(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Rounds Out *</label>
            <input type="number" min={0} required value={ammoRoundsOut} onChange={(e) => setAmmoRoundsOut(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Time Out *</label>
            <input type="time" required value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <input type="date" required value={dateOut} onChange={(e) => setDateOut(e.target.value)} className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer">Confirm Issue</button>
        </div>
      </form>
    </ModalOverlay>
  );
};

const ReturnArmouryModal: React.FC<{ onClose: () => void; onSubmit: (d: { logId: string; ammoRoundsIn: number; dateIn: string; timeIn: string; substituteReceiver?: string; notes?: string }) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const checkedOut = domain.armouryLogs.filter((l) => l.status === "Checked Out");
  const [logId, setLogId] = useState("");
  const [ammoRoundsIn, setAmmoRoundsIn] = useState(0);
  const [dateIn, setDateIn] = useState(new Date().toISOString().split("T")[0]);
  const [timeIn, setTimeIn] = useState("");
  const [notes, setNotes] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ logId, ammoRoundsIn, dateIn, timeIn, notes });
  };
  return (
    <ModalOverlay title="Log Armoury Return" icon={<XCircle className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Checked-Out Log *</label>
          <select required value={logId} onChange={(e) => setLogId(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select issue log…</option>
            {checkedOut.map((l) => (
              <option key={l.id} value={l.id}>
                {l.assetName} ({l.firearmSerialNumber}) — {l.guardName}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Rounds In *</label>
            <input type="number" min={0} required value={ammoRoundsIn} onChange={(e) => setAmmoRoundsIn(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Time In *</label>
            <input type="time" required value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <input type="date" required value={dateIn} onChange={(e) => setDateIn(e.target.value)} className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer">Confirm Return</button>
        </div>
      </form>
    </ModalOverlay>
  );
};

/* ---------------- K9 tab ---------------- */

const K9Tab: React.FC = () => {
  const domain = useDomainStore();
  const [mode, setMode] = useState<"deployment" | "vet" | null>(null);
  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[11px] text-emerald-800 font-semibold">
        Ops logs canine activity (deployments, vet checks). Dog records, pairing and kennel management are owned by the K9 Supervisor.
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setMode("deployment")} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
          <Dog className="w-4 h-4" /> Log Deployment
        </button>
        <button onClick={() => setMode("vet")} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" /> Log Vet Check
        </button>
      </div>
      <K9ReadinessPanel />
      {mode === "deployment" && (
        <LogK9DeploymentModal
          onClose={() => setMode(null)}
          onSubmit={(log) => {
            domain.logK9Deployment(log);
            setMode(null);
          }}
        />
      )}
      {mode === "vet" && (
        <LogK9VetModal
          onClose={() => setMode(null)}
          onSubmit={(ins) => {
            domain.addK9HealthInspection(ins);
            setMode(null);
          }}
        />
      )}
    </div>
  );
};

const LogK9DeploymentModal: React.FC<{ onClose: () => void; onSubmit: (log: Omit<K9Log, "id">) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const dogs = domain.k9s.filter((k) => k.status === "Active Duty");
  const [k9Id, setK9Id] = useState("");
  const [siteName, setSiteName] = useState("");
  const [deploymentDate, setDeploymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [shiftType, setShiftType] = useState<"Day Shift" | "Night Shift">("Day Shift");
  const [trainingScore, setTrainingScore] = useState<"Outstanding" | "Satisfactory" | "Needs Refresher">("Satisfactory");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const dog = dogs.find((k) => k.id === k9Id);
    onSubmit({ k9Id, k9Name: dog?.name ?? "", handlerName: dog?.assignedHandlerName ?? "—", siteName, deploymentDate, shiftType, trainingScore });
  };
  return (
    <ModalOverlay title="Log K9 Deployment" icon={<Dog className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Dog *</label>
          <select required value={k9Id} onChange={(e) => setK9Id(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select dog…</option>
            {dogs.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.code}) — {k.assignedHandlerName ?? "no handler"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Deployment Site *</label>
          <input required value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Date *</label>
            <input type="date" required value={deploymentDate} onChange={(e) => setDeploymentDate(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Shift *</label>
            <select value={shiftType} onChange={(e) => setShiftType(e.target.value as "Day Shift" | "Night Shift")} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Day Shift</option>
              <option>Night Shift</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Performance *</label>
          <select value={trainingScore} onChange={(e) => setTrainingScore(e.target.value as "Outstanding" | "Satisfactory" | "Needs Refresher")} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option>Outstanding</option>
            <option>Satisfactory</option>
            <option>Needs Refresher</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">Log Deployment</button>
        </div>
      </form>
    </ModalOverlay>
  );
};

const LogK9VetModal: React.FC<{ onClose: () => void; onSubmit: (ins: Omit<K9HealthInspection, "id" | "inspectionCode">) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const [k9Id, setK9Id] = useState("");
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState(30);
  const [vaccinationStatus, setVaccinationStatus] = useState<K9HealthInspection["vaccinationStatus"]>("Up to Date - Fully Vaccinated");
  const [physicalCondition, setPhysicalCondition] = useState<K9HealthInspection["physicalCondition"]>("Optimal / Fit for Duty");
  const [coatAndSkinCheck, setCoatAndSkinCheck] = useState<K9HealthInspection["coatAndSkinCheck"]>("Normal & Clean");
  const [appetiteAndHydration, setAppetiteAndHydration] = useState<K9HealthInspection["appetiteAndHydration"]>("Normal / Healthy");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const dog = domain.k9s.find((k) => k.id === k9Id);
    onSubmit({
      k9Id,
      k9Name: dog?.name ?? "",
      handlerName: dog?.assignedHandlerName ?? "—",
      inspectionDate,
      weightKg,
      vaccinationStatus,
      physicalCondition,
      coatAndSkinCheck,
      appetiteAndHydration,
      inspectingOfficer: "Operations Log",
    });
  };
  return (
    <ModalOverlay title="Log K9 Vet Check" icon={<Plus className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Dog *</label>
          <select required value={k9Id} onChange={(e) => setK9Id(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select dog…</option>
            {domain.k9s.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} ({k.code})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Date *</label>
            <input type="date" required value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Weight (kg) *</label>
            <input type="number" min={1} required value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Vaccination Status *</label>
          <select value={vaccinationStatus} onChange={(e) => setVaccinationStatus(e.target.value as K9HealthInspection["vaccinationStatus"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option>Up to Date - Fully Vaccinated</option>
            <option>Rabies Booster Due</option>
            <option>Deworming Required</option>
            <option>Pending Vet Booster</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Physical Condition *</label>
          <select value={physicalCondition} onChange={(e) => setPhysicalCondition(e.target.value as K9HealthInspection["physicalCondition"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option>Optimal / Fit for Duty</option>
            <option>Minor Fatigue / Rest Prescribed</option>
            <option>Under Veterinary Treatment</option>
            <option>Unfit for Duty</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Coat & Skin *</label>
            <select value={coatAndSkinCheck} onChange={(e) => setCoatAndSkinCheck(e.target.value as K9HealthInspection["coatAndSkinCheck"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Normal & Clean</option>
              <option>Skin Rash / Mange</option>
              <option>Ticks / Parasites Found</option>
              <option>Wounds / Abrasions</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Appetite *</label>
            <select value={appetiteAndHydration} onChange={(e) => setAppetiteAndHydration(e.target.value as K9HealthInspection["appetiteAndHydration"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Normal / Healthy</option>
              <option>Reduced Appetite</option>
              <option>Dehydrated</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">Save Vet Check</button>
        </div>
      </form>
    </ModalOverlay>
  );
};

/* ---------------- Patrol tab ---------------- */

const PatrolTab: React.FC = () => {
  const domain = useDomainStore();
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3 text-[11px] text-cyan-800 font-semibold">
        Ops records patrol & radio checks at client sites. Inspections are owned by operations supervisors.
      </div>
      <button onClick={() => setShowLog(true)} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
        <ShieldCheck className="w-4 h-4" /> Log Patrol & Radio Check
      </button>
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Recent Patrol & Radio Checks</h2>
        </div>
        <div className="space-y-2">
          {domain.patrolInspections.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-8">No patrol inspections recorded yet.</p>
          ) : (
            domain.patrolInspections
              .slice()
              .reverse()
              .map((p) => (
                <div key={p.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-800">
                      {p.inspectionCode} — {p.siteName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {p.supervisorName} • {p.guardOnDuty} • {p.inspectionTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      p.radioCheckStatus === "Responsive & Clear" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200"
                    }`}>{p.radioCheckStatus}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      p.overallRating === "Satisfactory" ? "bg-cyan-100 text-cyan-700 border-cyan-200" : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>{p.overallRating}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>
      {showLog && (
        <LogPatrolModal
          onClose={() => setShowLog(false)}
          onSubmit={(p) => {
            domain.addPatrolInspection(p);
            setShowLog(false);
          }}
        />
      )}
    </div>
  );
};

const LogPatrolModal: React.FC<{ onClose: () => void; onSubmit: (p: Omit<PatrolInspectionLog, "id">) => void }> = ({ onClose, onSubmit }) => {
  const domain = useDomainStore();
  const [siteName, setSiteName] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const [guardOnDuty, setGuardOnDuty] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [radioCheckStatus, setRadioCheckStatus] = useState<PatrolInspectionLog["radioCheckStatus"]>("Responsive & Clear");
  const [uniformTurnout, setUniformTurnout] = useState<PatrolInspectionLog["uniformTurnout"]>("Compliant");
  const [weaponEquipmentCheck, setWeaponEquipmentCheck] = useState<PatrolInspectionLog["weaponEquipmentCheck"]>("Secured & Safe");
  const [overallRating, setOverallRating] = useState<PatrolInspectionLog["overallRating"]>("Satisfactory");
  const [remarks, setRemarks] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ inspectionCode: `PIC-${Date.now().toString().slice(-6)}`, siteName, supervisorName, guardOnDuty, inspectionTime, radioCheckStatus, uniformTurnout, weaponEquipmentCheck, overallRating, remarks });
  };
  return (
    <ModalOverlay title="Log Patrol & Radio Check" icon={<ShieldCheck className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Site *</label>
          <select required value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
            <option value="">Select site…</option>
            {domain.sites.map((s) => (
              <option key={s.id} value={s.siteName}>{s.siteName}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Supervisor *</label>
            <input required value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Guard On Duty *</label>
            <input required value={guardOnDuty} onChange={(e) => setGuardOnDuty(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Inspection Time *</label>
          <input type="time" required value={inspectionTime} onChange={(e) => setInspectionTime(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Radio Check *</label>
            <select value={radioCheckStatus} onChange={(e) => setRadioCheckStatus(e.target.value as PatrolInspectionLog["radioCheckStatus"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Responsive & Clear</option>
              <option>Delayed Response</option>
              <option>Unresponsive</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Uniform Turnout *</label>
            <select value={uniformTurnout} onChange={(e) => setUniformTurnout(e.target.value as PatrolInspectionLog["uniformTurnout"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Compliant</option>
              <option>Minor Flaw</option>
              <option>Non-Compliant</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Weapon Check *</label>
            <select value={weaponEquipmentCheck} onChange={(e) => setWeaponEquipmentCheck(e.target.value as PatrolInspectionLog["weaponEquipmentCheck"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Secured & Safe</option>
              <option>Defect Noted</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Overall *</label>
            <select value={overallRating} onChange={(e) => setOverallRating(e.target.value as PatrolInspectionLog["overallRating"])} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white">
              <option>Satisfactory</option>
              <option>Needs Corrective Action</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Remarks</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer">Save Inspection</button>
        </div>
      </form>
    </ModalOverlay>
  );
};

/* ---------------- Fleet Summary (read-only, boss view) ---------------- */

const FleetSummaryPanel: React.FC = () => {
  const domain = useDomainStore();
  const vehicles = domain.vehicles;
  const drivers = domain.drivers;

  const available = vehicles.filter((v) => v.status === "Operational").length;
  const grounded = vehicles.filter((v) => v.status === "Grounded").length;
  const fueling = vehicles.filter((v) => v.status === "Fueling Needed").length;
  const riders = drivers.filter((d) => d.roleType === "Rider" && d.status === "Active Duty").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active Duty").length;
  const lowFuel = vehicles.filter((v) => v.fuelLevelPercentage <= 25).length;

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Fuel className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Fleet Readiness</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black border border-slate-200">
          Independent Dept
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-2xl font-black text-emerald-700">{available}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Available</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-black text-slate-700">{vehicles.length}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Fleet</p>
        </div>
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
          <p className="text-2xl font-black text-rose-600">{grounded}</p>
          <p className="text-[10px] text-rose-600 font-bold uppercase">Grounded</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-2xl font-black text-amber-600">{fueling}</p>
          <p className="text-[10px] text-amber-600 font-bold uppercase">Needs Fuel</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
          <Car className="w-3 h-3" /> {activeDrivers} drivers • {riders} riders active
        </p>
        <p className="text-[11px] text-slate-500 font-semibold">
          <span className={lowFuel > 0 ? "text-amber-600 font-black" : ""}>{lowFuel}</span> vehicles ≤25% fuel
        </p>
      </div>
    </section>
  );
};

/* ---------------- Fleet Readiness (detail list) ---------------- */

const FleetReadinessPanel: React.FC = () => {
  const domain = useDomainStore();
  const vehicles = domain.vehicles;
  const drivers = domain.drivers;

  const available = vehicles.filter((v) => v.status === "Operational").length;
  const grounded = vehicles.filter((v) => v.status === "Grounded").length;
  const fueling = vehicles.filter((v) => v.status === "Fueling Needed").length;
  const riders = drivers.filter((d) => d.roleType === "Rider" && d.status === "Active Duty").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active Duty").length;
  const lowFuel = vehicles.filter((v) => v.fuelLevelPercentage <= 25).length;

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="w-4 h-4 text-cyan-600" />
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Fleet Readiness</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
          <p className="text-2xl font-black text-emerald-700">{available}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Available</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-2xl font-black text-slate-700">{vehicles.length}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Total Fleet</p>
        </div>
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
          <p className="text-2xl font-black text-rose-600">{grounded}</p>
          <p className="text-[10px] text-rose-600 font-bold uppercase">Grounded</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
          <p className="text-2xl font-black text-amber-600">{fueling}</p>
          <p className="text-[10px] text-amber-600 font-bold uppercase">Needs Fuel</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
          <Car className="w-3 h-3" /> {activeDrivers} drivers • {riders} riders active
        </p>
        <p className="text-[11px] text-slate-500 font-semibold">
          <span className={lowFuel > 0 ? "text-amber-600 font-black" : ""}>{lowFuel}</span> vehicles ≤25% fuel
        </p>
      </div>
      <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
        {vehicles.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <Car className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">
                  {v.plateNumber} — {v.makeModel}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">{v.vehicleType}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              {badge(v.status)}
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Fuel {v.fuelLevelPercentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ---------------- Transport Inbox ---------------- */

interface TransportInboxProps {
  pending: TransportRequest[];
  vehicles: { id: string; plateNumber: string; makeModel: string; vehicleType: string; status: string }[];
  drivers: { id: string; fullName: string; roleType?: string; status: string }[];
  onAct: (id: string, data: { action: "Approved" | "Declined"; assignedVehicleId?: string; assignedVehicle?: string; assignedDriverId?: string; assignedDriver?: string; assignedRiderId?: string; assignedRider?: string; declinedReason?: string }) => void;
}

const TRANSPORT_DECLINE_REASONS = [
  "No driver available",
  "No rider available",
  "Vehicle in maintenance",
  "Motorcycle in maintenance",
  "Vehicle already assigned",
  "Request timing conflicts with existing trips",
  "Destination outside service area",
  "Insufficient notice",
] as const;

export const TransportInbox: React.FC<TransportInboxProps> = ({ pending, vehicles, drivers, onAct }) => {
  const [actingId, setActingId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [declinePreset, setDeclinePreset] = useState("");
  const [declineReason, setDeclineReason] = useState("");

  const effectiveDeclineReason = declinePreset === "__other__" ? declineReason.trim() : declinePreset;

  const availableVehicles = vehicles.filter((v) => v.status !== "Grounded");
  const activeDrivers = drivers.filter((d) => d.status === "Active Duty");
  const activeRiders = drivers.filter((d) => d.roleType === "Rider" && d.status === "Active Duty");

  const confirmApprove = () => {
    if (!actingId) return;
    const v = availableVehicles.find((x) => x.id === vehicleId);
    const d = activeDrivers.find((x) => x.id === driverId);
    const r = activeRiders.find((x) => x.id === riderId);
    onAct(actingId, {
      action: "Approved",
      assignedVehicleId: v?.id,
      assignedVehicle: v ? `${v.plateNumber} (${v.makeModel})` : undefined,
      assignedDriverId: d?.id,
      assignedDriver: d?.fullName,
      assignedRiderId: r?.id,
      assignedRider: r?.fullName,
    });
    setActingId(null);
    setVehicleId("");
    setDriverId("");
    setRiderId("");
  };

  const confirmDecline = () => {
    if (!actingId || !effectiveDeclineReason) return;
    onAct(actingId, { action: "Declined", declinedReason: effectiveDeclineReason });
    setActingId(null);
    setDeclinePreset("");
    setDeclineReason("");
  };

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Transport Inbox</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-black border border-cyan-200">
          {pending.length} awaiting
        </span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {pending.map((t) => {
          const isActing = actingId === t.id;
          return (
            <div key={t.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-700 truncate">
                    {t.requestCode} — {t.purpose}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {t.requestedByName} • {t.requesterDepartment} • {t.destination} • {t.travelDate}
                    {t.travelTime ? ` @ ${t.travelTime}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Persons: {t.passengersCount} • Type: {t.vehicleType}
                  </p>
                </div>
              </div>
              {isActing ? (
                <div className="mt-3 space-y-2">
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="">Assign vehicle…</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plateNumber} — {v.makeModel} ({v.vehicleType})
                      </option>
                    ))}
                  </select>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="">Assign driver…</option>
                    {activeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={riderId}
                    onChange={(e) => setRiderId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                  >
                    <option value="">Assign rider (optional)…</option>
                    {activeRiders.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                  <div className="border-t border-slate-200 pt-2 mt-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1.5">
                      To decline, pick a reason (or write your own)
                    </p>
                    <select
                      value={declinePreset}
                      onChange={(e) => setDeclinePreset(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
                    >
                      <option value="">Decline reason…</option>
                      {TRANSPORT_DECLINE_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="__other__">Other — write custom reason…</option>
                    </select>
                    {declinePreset === "__other__" && (
                      <input
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        placeholder="Write the decline reason…"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white mt-2"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={confirmApprove}
                      disabled={!vehicleId}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                    </button>
                    <button
                      onClick={confirmDecline}
                      disabled={!effectiveDeclineReason}
                      className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> Decline
                    </button>
                    <button
                      onClick={() => {
                        setActingId(null);
                        setDeclinePreset("");
                        setDeclineReason("");
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setActingId(t.id);
                      setVehicleId("");
                      setDriverId("");
                      setRiderId("");
                      setDeclineReason("");
                    }}
                    className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Review & Assign
                  </button>
                  <button
                    onClick={() => onAct(t.id, { action: "Declined", declinedReason: "Unavailable" })}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 inline mr-1" /> Decline
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {pending.length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-8">
            No transport requests awaiting approval.
          </p>
        )}
      </div>
    </section>
  );
};

/* ---------------- Transport Request Modal ---------------- */

interface TransportRequestModalProps {
  requesterName: string;
  requesterId: string;
  requesterDept: string;
  onClose: () => void;
  onSubmit: (data: Omit<TransportRequest, "id" | "requestCode" | "status">) => void;
}

const TransportRequestModal: React.FC<TransportRequestModalProps> = ({
  requesterName,
  requesterId,
  requesterDept,
  onClose,
  onSubmit,
}) => {
  const [requesterDepartment, setRequesterDepartment] = useState(requesterDept || "Operations");
  const [purpose, setPurpose] = useState("");
  const [destination, setDestination] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [passengersCount, setPassengersCount] = useState(1);
  const [vehicleType, setVehicleType] = useState<"Car" | "Motorcycle" | "Any">("Any");
  const [specialRequests, setSpecialRequests] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      requestedBy: requesterId,
      requestedByName: requesterName,
      requesterDepartment,
      destination,
      purpose: specialRequests ? `${purpose} — ${specialRequests}` : purpose,
      travelDate,
      travelTime: travelTime || undefined,
      returnTime: returnTime || undefined,
      vehicleType,
      passengersCount,
    });
  };

  return (
    <ModalOverlay title="Request Transport" icon={<Truck className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Requesting Department *</label>
          <input
            required
            value={requesterDepartment}
            onChange={(e) => setRequesterDepartment(e.target.value)}
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Purpose *</label>
          <input
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Site inspection in Mbarara"
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Destination *</label>
            <input
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City / site"
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Travel Date *</label>
            <input
              type="date"
              required
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Departure Time</label>
            <input
              type="time"
              value={travelTime}
              onChange={(e) => setTravelTime(e.target.value)}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Return Time</label>
            <input
              type="time"
              value={returnTime}
              onChange={(e) => setReturnTime(e.target.value)}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Passengers *</label>
            <input
              type="number"
              min={1}
              value={passengersCount}
              onChange={(e) => setPassengersCount(Number(e.target.value))}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Vehicle Type *</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as "Car" | "Motorcycle" | "Any")}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              <option>Any</option>
              <option>Car</option>
              <option>Motorcycle</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Special Requests / Notes</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={2}
            placeholder="Armed escort required, sensitive cargo, etc."
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Submit Request
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
};

/* ---------------- Requisition Modal ---------------- */

interface RequisitionModalProps {
  requesterName: string;
  onClose: () => void;
  onSubmit: (data: Omit<AdminRequisition, "id">) => void;
}

const RequisitionModal: React.FC<RequisitionModalProps> = ({ requesterName, onClose, onSubmit }) => {
  const [department, setDepartment] = useState("Operations");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedCostUgx, setEstimatedCostUgx] = useState(250000);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      reqCode: `REQ-${Date.now().toString().slice(-6)}`,
      department,
      requestedBy: requesterName,
      itemDescription,
      quantity,
      estimatedCostUgx,
      priority,
      status: "Pending Approval",
      dateRequested: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <ModalOverlay title="New Requisition" icon={<ClipboardList className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Department *</label>
          <input
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Item / Service Required *</label>
          <input
            required
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="e.g. 200 litres generator diesel, 10 pairs of tactical boots…"
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Quantity *</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Est. Cost (UGX) *</label>
            <input
              type="number"
              min={0}
              value={estimatedCostUgx}
              onChange={(e) => setEstimatedCostUgx(Number(e.target.value))}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Priority *</label>
          <div className="mt-1 flex gap-2">
            {(["High", "Medium", "Low"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  priority === p
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Submit Requisition
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
};

/* ---------------- Shared Modal Overlay ---------------- */

interface ModalOverlayProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ title, icon, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">{icon}</div>
          <h3 className="text-sm font-black text-slate-800">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
          aria-label="Close"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
