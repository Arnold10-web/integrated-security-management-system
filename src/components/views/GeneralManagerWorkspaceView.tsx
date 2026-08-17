/**
 * General Manager workspace (Directorate landing for GM / Director).
 * - Requisitions awaiting GM final approval (approve / reject with reason).
 * - Engine approvals inbox: pending approvals at a step the GM/Director can act on.
 * - Cross-department snapshot: site surveys, contract inquiries, transport requests.
 */

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, ClipboardList, Workflow, Truck, MapPin, Search, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole } from "../../services/rbacService";
import type { Approval, UserRole } from "../../types";

const GENERAL_MANAGER: UserRole = "General Manager";

export const GeneralManagerWorkspaceView: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const activeRole = getEffectiveRole(currentUser) ?? null;

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actingApprovalId, setActingApprovalId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");

  const pendingRequisitions = useMemo(
    () => domain.adminRequisitions.filter((r) => r.status === "Pending Approval"),
    [domain.adminRequisitions]
  );

  const gmApprovals = useMemo(() => {
    const role = activeRole ?? GENERAL_MANAGER;
    return domain.approvals.filter((a) => {
      if (a.status !== "Pending") return false;
      const wf = domain.workflows.find((w) => w.id === a.workflowId || w.code === a.workflowCode);
      const step = wf?.steps.find((s) => s.stepOrder === a.currentStep);
      const roles = step ? step.approverRoles && step.approverRoles.length > 0 ? step.approverRoles : [step.approverRole] : [];
      if (!roles.includes(role)) return false;
      if (step?.regionScoped && a.regionScope && currentUser?.region && a.regionScope !== currentUser.region) return false;
      return true;
    });
  }, [domain.approvals, domain.workflows, activeRole, currentUser?.region]);

  const pendingTransport = useMemo(
    () => domain.transportRequests.filter((t) => t.status === "Pending Fleet"),
    [domain.transportRequests]
  );

  const pendingInquiries = useMemo(
    () => domain.contractInquiries.filter((i) => i.status === "Pending"),
    [domain.contractInquiries]
  );

  const openSurveys = useMemo(
    () => domain.siteSurveys.filter((s) => s.status === "Requested" || s.status === "In Progress"),
    [domain.siteSurveys]
  );

  const confirmReject = (id: string) => {
    domain.rejectRequisition(id, rejectReason || "Not approved");
    setRejectingId(null);
    setRejectReason("");
  };

  const actOnApproval = (approval: Approval) => {
    domain.actOnApproval(approval.id, "Approved", approvalComment || undefined);
    setActingApprovalId(null);
    setApprovalComment("");
  };

  const rejectApproval = (approval: Approval) => {
    domain.actOnApproval(approval.id, "Rejected", approvalComment || "Rejected by GM");
    setActingApprovalId(null);
    setApprovalComment("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-900 text-amber-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-900/60 text-amber-300 text-[10px] font-black uppercase border border-amber-800">
                Executive Workspace
              </span>
              <span className="text-xs text-slate-400 font-semibold">{activeRole}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
              Final Approvals & Company Overview
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Everything needing the General Manager's signature, plus live cross-department posture.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/reports")}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
          >
            Reports <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requisitions awaiting GM */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Requisitions Awaiting Approval</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
                {pendingRequisitions.length}
              </span>
            </div>
            <button
              onClick={() => navigate("/administration")}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
            >
              Administration <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {pendingRequisitions.map((r) => {
              const isRejecting = rejectingId === r.id;
              return (
                <div key={r.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-700 truncate">
                        {r.reqCode} — {r.itemDescription}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {r.requestedBy} • {r.department} • Qty {r.quantity} • UGX {r.estimatedCostUgx.toLocaleString()} • {r.priority}
                      </p>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase border border-amber-200">
                      Pending Approval
                    </span>
                  </div>
                  {isRejecting ? (
                    <div className="mt-3 space-y-2">
                      <input
                        autoFocus
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Rejection reason (required)…"
                        className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmReject(r.id)}
                          disabled={!rejectReason.trim()}
                          className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 inline mr-1" /> Confirm Reject
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason(""); }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => domain.approveRequisition(r.id)}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => { setRejectingId(r.id); setRejectReason(""); }}
                        className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {pendingRequisitions.length === 0 && (
              <p className="text-xs text-slate-400 font-medium text-center py-8">No requisitions awaiting your approval.</p>
            )}
          </div>
        </section>

        {/* Posture snapshot */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Company Posture</h2>
          </div>
          <SnapshotRow icon={<Workflow className="w-4 h-4" />} label="Engine approvals for you" value={gmApprovals.length} tone="amber" />
          <SnapshotRow icon={<Truck className="w-4 h-4" />} label="Transport awaiting Fleet" value={pendingTransport.length} tone="cyan" />
          <SnapshotRow icon={<Search className="w-4 h-4" />} label="Contract inquiries pending" value={pendingInquiries.length} tone="indigo" />
          <SnapshotRow icon={<MapPin className="w-4 h-4" />} label="Open site surveys" value={openSurveys.length} tone="emerald" />
          <div className="pt-2">
            <button
              onClick={() => navigate("/workflow")}
              className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Workflow className="w-3.5 h-3.5" /> Open Workflow Engine
            </button>
          </div>
        </section>
      </div>

      {/* Approvals inbox */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Approvals Inbox</h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black border border-amber-200">
              {gmApprovals.length}
            </span>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {gmApprovals.map((a) => {
            const wf = domain.workflows.find((w) => w.id === a.workflowId || w.code === a.workflowCode);
            const step = wf?.steps.find((s) => s.stepOrder === a.currentStep);
            const isActing = actingApprovalId === a.id;
            return (
              <div key={a.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-700 truncate">
                      {a.workflowCode} — {wf?.name ?? a.referenceType} ({a.referenceType})
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Requested by {a.requestedByName} • Step {a.currentStep}/{a.totalSteps}: {step?.name ?? "—"}
                      {a.regionScope ? ` • Region: ${a.regionScope}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase border border-amber-200">
                    Pending
                  </span>
                </div>
                {isActing ? (
                  <div className="mt-3 space-y-2">
                    <input
                      autoFocus
                      value={approvalComment}
                      onChange={(e) => setApprovalComment(e.target.value)}
                      placeholder="Comment (optional)…"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => actOnApproval(a)}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                      </button>
                      <button
                        onClick={() => rejectApproval(a)}
                        className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject
                      </button>
                      <button
                        onClick={() => { setActingApprovalId(null); setApprovalComment(""); }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActingApprovalId(a.id); setApprovalComment(""); }}
                    className="mt-3 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Review & Decide
                  </button>
                )}
              </div>
            );
          })}
          {gmApprovals.length === 0 && (
            <p className="text-xs text-slate-400 font-medium text-center py-8">No approvals are awaiting your step right now.</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
            <MapPin className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Regional Rollup & Exceptions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {regionRows(domain).map((r) => (
            <div key={r.region} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-800">{r.region}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${r.openIncidents > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {r.openIncidents > 0 ? `${r.openIncidents} incident${r.openIncidents > 1 ? "s" : ""}` : "Clear"}
                </span>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                {r.guards} guards deployed · {r.sites} client site{r.sites === 1 ? "" : "s"} · {r.orders} open deployment order{r.orders === 1 ? "" : "s"}
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${r.guards ? Math.min(100, (r.guards / (r.sites || 1) / 4) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
        {regionRows(domain).length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-6">No regional records yet.</p>
        )}
      </section>
    </div>
  );
};

const regionRows = (domain: {
  guards: { region?: string }[];
  sites: { region?: string }[];
  incidents: { region?: string; status: string }[];
  deploymentOrders: { region?: string; status: string }[];
}) => {
  const map = new Map<string, { region: string; guards: number; sites: number; openIncidents: number; orders: number }>();
  const row = (name: string) => {
    if (!map.has(name)) map.set(name, { region: name, guards: 0, sites: 0, openIncidents: 0, orders: 0 });
    return map.get(name)!;
  };
  for (const g of domain.guards) if (g.region) row(g.region).guards += 1;
  for (const s of domain.sites) if (s.region) row(s.region).sites += 1;
  for (const i of domain.incidents) if (i.region && (i.status === "Open" || i.status === "Under Investigation")) row(i.region).openIncidents += 1;
  for (const o of domain.deploymentOrders) if (o.region && o.status === "Open") row(o.region).orders += 1;
  return [...map.values()].sort((a, b) => b.guards - a.guards);
};

const SnapshotRow: React.FC<{ icon: React.ReactNode; label: string; value: number; tone: string }> = ({ icon, label, value, tone }) => {
  const tones: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700",
    cyan: "bg-cyan-100 text-cyan-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl ${tones[tone] ?? "bg-slate-100 text-slate-600"}`}>{icon}</div>
        <p className="text-[11px] font-bold text-slate-600">{label}</p>
      </div>
      <span className="text-xl font-black text-slate-800">{value}</span>
    </div>
  );
};
