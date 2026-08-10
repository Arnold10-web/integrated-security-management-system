/**
 * Governance panels for the RBAC v3 approval chains:
 *  - Complaints (Marketing-owned, resolve mirrors rating to ClientSite)
 *  - Disciplinary chain (IO -> Regional Manager -> Ops Manager -> HR Manager)
 *  - Deployments (Ops Manager / Regional Manager hand-off)
 *  - Campaign budget approvals (FM -> GM for >10M UGX)
 *  - Guard availability by region (Marketing read-only aggregate)
 *  - Guard lifecycle (Ops/RM/HR) + ID issuance (Records Officer)
 *  - Expense approval chain (FM -> GM for >10M UGX)
 */

import React, { useState } from "react";
import { Shield, AlertTriangle, UserCheck, BadgeCheck, MapPin, CreditCard, GitBranch, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import type { DisciplinaryAction, UserRole } from "../../types";
import { DESERTION_REPORTING_ROLES, MARKETING_ROLES, isRoleIn } from "../../services/rbacService";

const FINANCE_MANAGER: UserRole = "Finance Manager";
const GENERAL_MANAGER: UserRole = "General Manager";
const INVESTIGATIONS_OFFICER: UserRole = "Investigations Officer";
const RECORDS_OFFICER: UserRole = "Records Officer";

const CATEGORY_1_OFFENCES = [
  "Desertion",
  "Theft or attempted theft",
  "Forgery or fraud",
  "Alcohol / drug abuse on duty",
  "Gross insubordination",
  "Refusal to obey lawful orders",
  "Incitement of others to disobey",
  "Loss or abandonment of firearm",
  "Unauthorised use of company weapons",
  "Possession of non-company weapons",
  "Deliberately deleting company information",
  "Criminal conviction",
  "Failure to attend a disciplinary hearing",
];

const CATEGORY_2_OFFENCES = [
  "Failure to follow Standard Operating Procedures (SOPs)",
  "Unauthorised absence from duty",
  "Poor performance",
  "Unruly or aggressive behaviour",
  "Sexual harassment",
  "Unauthorised use of company fleet",
  "Reckless driving",
  "Gross negligence",
  "Failure to report a Category 1 offence",
  "Failure to register attendance",
  "Abandoning post",
  "Uniform / equipment misuse",
  "Supplying false information",
  "Abuse or loss of company/client property",
  "Assault causing serious harm",
  "Negligent firing or loss of a bullet",
  "Failure to report within the time limit",
];

const badge = (color: string, label: string) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${color}`}>{label}</span>
);

const statusBadge = (status: string | undefined) => {
  const s = status ?? "Unknown";
  const map: Record<string, string> = {
    "Open": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    "Investigating": "bg-blue-500/10 text-blue-600 border-blue-500/30",
    "Resolved": "bg-green-500/10 text-green-600 border-green-500/30",
    "Referred": "bg-purple-500/10 text-purple-600 border-purple-500/30",
    "Initiated": "bg-slate-500/10 text-slate-600 border-slate-500/30",
    "Pending Regional Approval": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    "Pending Ops Approval": "bg-blue-500/10 text-blue-600 border-blue-500/30",
    "Pending HR Approval": "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
    "Finalized": "bg-green-500/10 text-green-600 border-green-500/30",
    "Rejected": "bg-red-500/10 text-red-600 border-red-500/30",
    "Approved": "bg-green-500/10 text-green-600 border-green-500/30",
    "Pending Finance Approval": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    "Pending GM Approval": "bg-purple-500/10 text-purple-600 border-purple-500/30",
    "Active": "bg-green-500/10 text-green-600 border-green-500/30",
    "Completed": "bg-slate-500/10 text-slate-600 border-slate-500/30",
  };
  return badge(map[s] ?? "bg-slate-500/10 text-slate-600 border-slate-500/30", s);
};

const card = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5";

const btn = (variant: "primary" | "ghost" | "danger" | "success" = "primary", small = false) =>
  `cursor-pointer font-bold rounded-xl transition-colors ${small ? "px-2.5 py-1 text-[11px]" : "px-4 py-2 text-xs"} ${
    variant === "primary"
      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
      : variant === "success"
      ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
      : variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
  }`;

const inputCls = "w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-white";

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0"><Icon size={16} /></div>
      <div>
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ============================ COMPLAINTS ============================ */

export const ComplaintsPanel: React.FC = () => {
  const complaints = useDomainStore((s) => s.complaints);
  const addComplaint = useDomainStore((s) => s.addComplaint);
  const resolveComplaint = useDomainStore((s) => s.resolveComplaint);
  const referComplaint = useDomainStore((s) => s.referComplaint);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [category, setCategory] = useState("Service Quality");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<number>(4);

  const canManage = isRoleIn(role, MARKETING_ROLES);
  const canResolve = canManage;
  const canRefer = role === INVESTIGATIONS_OFFICER;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !siteName) return;
    addComplaint({
      complaintCode: `CMP-${Date.now()}`,
      clientName,
      siteName,
      category,
      description,
      reportedDate: new Date().toISOString(),
    });
    setClientName(""); setSiteName(""); setDescription(""); setShowForm(false);
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Shield} title="Client Complaints & Satisfaction" sub="Marketing owns the resolution; ratings mirror to the client site" />
        {canManage && (
          <button className={btn()} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "+ New Complaint"}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <form onSubmit={submit} className="mb-4 space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            <input className={inputCls} placeholder="Site Name" value={siteName} onChange={(e) => setSiteName(e.target.value)} required />
          </div>
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Service Quality</option>
            <option>Conduct of Guards</option>
            <option>Billing / Invoicing</option>
            <option>Response Time</option>
            <option>Equipment & Armoury</option>
            <option>Other</option>
          </select>
          <textarea className={inputCls} placeholder="Description of complaint" value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} />
          <div className="flex justify-end">
            <button type="submit" className={btn("primary", true)}>Log Complaint</button>
          </div>
        </form>
      )}

      {complaints.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No complaints logged.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {complaints.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs text-slate-900">{c.clientName} — {c.siteName}</span>
                  {statusBadge(c.status)}
                  <span className="text-[10px] text-slate-400 font-mono">{c.complaintCode}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{c.description}</p>
                {c.satisfactionRating != null && (
                  <p className="text-[11px] mt-1"><span className="font-bold">Rating:</span> {"★".repeat(c.satisfactionRating)}{"☆".repeat(5 - c.satisfactionRating)} ({c.satisfactionRating}/5)</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {c.status !== "Resolved" && canResolve && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min={1} max={5} value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-14 p-1 border border-slate-300 rounded-lg text-[11px]"
                    />
                    <button className={btn("success", true)} onClick={() => resolveComplaint(c.id, { satisfactionRating: rating })}>Resolve</button>
                  </div>
                )}
                {c.status !== "Referred" && c.status !== "Resolved" && canRefer && (
                  <button className={btn("ghost", true)} onClick={() => referComplaint(c.id, "Referred by Investigations Officer")}>
                    Refer for Investigation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ DISCIPLINARY ============================ */

export const DisciplinaryPanel: React.FC = () => {
  const actions = useDomainStore((s) => s.disciplinaryActions);
  const addDisciplinaryAction = useDomainStore((s) => s.addDisciplinaryAction);
  const regionalApproveDisciplinary = useDomainStore((s) => s.regionalApproveDisciplinary);
  const opsApproveDisciplinary = useDomainStore((s) => s.opsApproveDisciplinary);
  const hrApproveDisciplinary = useDomainStore((s) => s.hrApproveDisciplinary);
  const rejectDisciplinaryAction = useDomainStore((s) => s.rejectDisciplinaryAction);
  const guards = useDomainStore((s) => s.guards);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const [showForm, setShowForm] = useState(false);
  const [guardId, setGuardId] = useState("");
  const [actionType, setActionType] = useState<DisciplinaryAction["actionType"]>("Warning Letter");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [offenceCategory, setOffenceCategory] = useState<"Category 1" | "Category 2">("Category 1");
  const [offence, setOffence] = useState("");
  const [offenceDate, setOffenceDate] = useState("");
  const [offenceTime, setOffenceTime] = useState("");
  const [zone, setZone] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const canInitiate = role === INVESTIGATIONS_OFFICER;
  const isRegional = role === "Regional Manager";
  const isOps = role === "Operations Manager";
  const isHR = role === "HR Manager";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const g = guards.find((x) => x.id === guardId);
    if (!g) return;
    addDisciplinaryAction({
      actionCode: `DISC-${Date.now()}`,
      guardId,
      guardName: g.fullName,
      guardCode: g.guardCode,
      actionType,
      reason: reason || offence || "Disciplinary grounds recorded on charge sheet.",
      severity: severity as DisciplinaryAction["severity"],
      offenceCategory,
      offence: offence || undefined,
      offenceDate: offenceDate || undefined,
      offenceTime: offenceTime || undefined,
      zone: zone || undefined,
      actionTaken: actionTaken || undefined,
    });
    setGuardId(""); setReason(""); setOffence(""); setOffenceDate(""); setOffenceTime(""); setZone(""); setActionTaken(""); setShowForm(false);
  };

  const offenceList = offenceCategory === "Category 1" ? CATEGORY_1_OFFENCES : CATEGORY_2_OFFENCES;

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={AlertTriangle} title="Disciplinary Actions" sub="Charge Sheet (Cat 1 / Cat 2) · Chain: Investigations Officer → Regional Manager → Operations Manager → HR Manager" />
        {canInitiate && (
          <button className={btn()} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Close" : "+ Initiate Action"}
          </button>
        )}
      </div>

      {showForm && canInitiate && (
        <form onSubmit={submit} className="mb-4 space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={guardId} onChange={(e) => setGuardId(e.target.value)} required>
              <option value="">Select Guard...</option>
              {guards.map((g) => <option key={g.id} value={g.id}>{g.fullName} ({g.guardCode})</option>)}
            </select>
            <select className={inputCls} value={actionType} onChange={(e) => setActionType(e.target.value as DisciplinaryAction["actionType"])}>
              <option>Warning Letter</option>
              <option>Suspension</option>
              <option>Termination</option>
              <option>Desertion</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <select className={inputCls} value={offenceCategory} onChange={(e) => { setOffenceCategory(e.target.value as "Category 1" | "Category 2"); setOffence(""); }}>
              <option value="Category 1">Category 1 Offences</option>
              <option value="Category 2">Category 2 Offences</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={offence} onChange={(e) => setOffence(e.target.value)}>
              <option value="">Select offence...</option>
              {offenceList.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <select className={inputCls} value={actionType} onChange={(e) => setActionType(e.target.value as DisciplinaryAction["actionType"])}>
              <option>Warning Letter</option>
              <option>Suspension</option>
              <option>Termination</option>
              <option>Desertion</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} type="date" value={offenceDate} onChange={(e) => setOffenceDate(e.target.value)} />
            <input className={inputCls} type="time" value={offenceTime} onChange={(e) => setOffenceTime(e.target.value)} />
          </div>
          <input className={inputCls} placeholder="Zone / location of offence" value={zone} onChange={(e) => setZone(e.target.value)} />
          <input className={inputCls} placeholder="Action taken (e.g. Weapon impounded, hearing scheduled)" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} />
          <textarea className={inputCls} placeholder="Reason / grounds" value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
          <div className="flex justify-end">
            <button type="submit" className={btn("primary", true)}>Initiate</button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No disciplinary actions recorded.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {actions.map((a) => (
            <div key={a.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs text-slate-900">{a.guardName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{a.guardCode}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30 font-bold uppercase">{a.actionType}</span>
                  {statusBadge(a.status)}
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">{a.reason}</p>
              {a.offenceCategory && (
                <p className="text-[11px] text-slate-600 mt-1">
                  <span className="font-black text-red-600 uppercase">{a.offenceCategory}:</span> {a.offence || a.reason}
                </p>
              )}
              {(a.offenceDate || a.zone) && (
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {a.offenceDate}{a.offenceTime ? ` @ ${a.offenceTime}` : ""}{a.zone ? ` · ${a.zone}` : ""}
                </p>
              )}
              {a.actionTaken && (
                <p className="text-[11px] text-slate-600 mt-1"><span className="font-bold text-slate-800">Action taken:</span> {a.actionTaken}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {a.status === "Initiated" && isRegional && (
                  <button className={btn("success", true)} onClick={() => regionalApproveDisciplinary(a.id)}>Regional Approve</button>
                )}
                {a.status === "Pending Regional Approval" && isOps && (
                  <button className={btn("success", true)} onClick={() => opsApproveDisciplinary(a.id)}>Ops Approve</button>
                )}
                {a.status === "Pending Ops Approval" && isHR && (
                  <button className={btn("success", true)} onClick={() => hrApproveDisciplinary(a.id)}>HR Finalize</button>
                )}
                {a.status !== "Finalized" && a.status !== "Rejected" && (isRegional || isOps || isHR) && (
                  <button className={btn("danger", true)} onClick={() => rejectDisciplinaryAction(a.id, "Rejected at review")}>Reject</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ DEPLOYMENTS ============================ */

export const DeploymentsPanel: React.FC = () => {
  const deployments = useDomainStore((s) => s.deployments);
  const deploymentOrders = useDomainStore((s) => s.deploymentOrders);
  const addDeploymentOrder = useDomainStore((s) => s.addDeploymentOrder);
  const assignDeploymentOrder = useDomainStore((s) => s.assignDeploymentOrder);
  const cancelDeploymentOrder = useDomainStore((s) => s.cancelDeploymentOrder);
  const endDeployment = useDomainStore((s) => s.endDeployment);
  const guards = useDomainStore((s) => s.guards);
  const sites = useDomainStore((s) => s.sites);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const isOps = role === "Operations Manager";
  const isRM = role === "Regional Manager";
  const canDeploy = isOps || isRM;

  // ── Order issuance (Ops only) ──
  const [showIssue, setShowIssue] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [headcount, setHeadcount] = useState(2);
  const [shiftType, setShiftType] = useState("Day Shift");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // ── Order assignment (RM only) ──
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);

  const issueOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const site = sites.find((x) => x.id === siteId);
    if (!site) return;
    addDeploymentOrder({
      siteId,
      siteName: site.siteName,
      clientName: site.clientName,
      region: site.region,
      requiredHeadcount: headcount,
      shiftType,
      targetStartDate: startDate,
      targetEndDate: endDate,
      requestedBy: currentUser?.name ?? "Operations Manager",
      notes,
    });
    setSiteId(""); setHeadcount(2); setShiftType("Day Shift"); setStartDate(""); setEndDate(""); setNotes(""); setShowIssue(false);
  };

  const openAssign = (orderId: string) => {
    setAssigningId((v) => (v === orderId ? null : orderId));
    setSelectedGuards([]);
  };

  const availablePool = (orderRegion?: string) =>
    guards.filter(
      (g) =>
        g.lifecycleStage === "PASSED_OUT" &&
        (g.region === orderRegion || (!orderRegion && !g.region)) &&
        (isRM ? (currentUser?.region ? g.region === currentUser.region : true) : true)
    );

  const assignOrder = (orderId: string) => {
    assignDeploymentOrder(orderId, selectedGuards);
    setAssigningId(null);
    setSelectedGuards([]);
  };

  const toggleGuard = (guardId: string, cap: number) => {
    setSelectedGuards((prev) =>
      prev.includes(guardId) ? prev.filter((g) => g !== guardId) : prev.length >= cap ? prev : [...prev, guardId]
    );
  };

  const myOrders = deploymentOrders.filter((o) => (isRM ? o.region === currentUser?.region : true));

  return (
    <div className="space-y-5">
      {/* ── Deployment Orders ── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle icon={GitBranch} title="Deployment Orders" sub="Ops issues a request → Regional Manager fills it from the region guard pool" />
          {isOps && (
            <button className={btn()} onClick={() => setShowIssue((v) => !v)}>
              {showIssue ? "Close" : "+ Issue Order"}
            </button>
          )}
        </div>

        {showIssue && isOps && (
          <form onSubmit={issueOrder} className="mb-4 space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                <option value="">Select site...</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.siteName} ({s.region ?? "HQ"})</option>)}
              </select>
              <select className={inputCls} value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
                <option>Day Shift</option>
                <option>Night Shift</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min={1} max={20} className={inputCls} value={headcount} onChange={(e) => setHeadcount(Number(e.target.value))} placeholder="Required headcount" />
              <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className={btn("primary", true)}>Issue Order</button>
            </div>
          </form>
        )}

        {myOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No deployment orders in your scope yet.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {myOrders.map((o) => {
              const pool = availablePool(o.region);
              return (
                <div key={o.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-slate-900">{o.orderCode} · {o.siteName}</span>
                        {statusBadge(o.status)}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {o.shiftType} · {o.requiredHeadcount} guard(s) · {o.clientName} · {o.region ?? "HQ"} · by {o.requestedBy}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {o.targetStartDate} → {o.targetEndDate} · assigned {o.assignedGuardIds.length}/{o.requiredHeadcount}
                        {o.notes ? ` · ${o.notes}` : ""}
                      </p>

                      {/* Two-step progress: Step 1 Ops issues (count) → Step 2 RM assigns (guards) */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${o.status === "Cancelled" ? "bg-slate-400" : o.status === "Filled" ? "bg-emerald-600" : "bg-blue-600"}`}
                            style={{ width: `${o.requiredHeadcount > 0 ? Math.min(100, (o.assignedGuardIds.length / o.requiredHeadcount) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          Step 1 Ops issues · Step 2 {isRM ? "You fill" : "RM fills"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {o.status === "Open" && isRM && (
                        <button className={btn("primary", true)} onClick={() => openAssign(o.id)}>
                          {assigningId === o.id ? "Close" : "Assign Guards"}
                        </button>
                      )}
                      {(o.status === "Open" || o.status === "Assigned") && canDeploy && (
                        <button className={btn("danger", true)} onClick={() => cancelDeploymentOrder(o.id)}>Cancel</button>
                      )}
                    </div>
                  </div>

                  {assigningId === o.id && o.status === "Open" && (
                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200">
                      <p className="text-[11px] font-black text-slate-700 mb-2">
                        Step 2 — select up to {o.requiredHeadcount} guard(s) from the {o.region ?? "unassigned"} pool ({pool.length} available):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                        {pool.map((g) => {
                          const atCap = selectedGuards.length >= o.requiredHeadcount && !selectedGuards.includes(g.id);
                          return (
                            <label key={g.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${atCap ? "border-slate-200 opacity-40 cursor-not-allowed" : "border-slate-200 cursor-pointer hover:bg-slate-50"}`}>
                              <input type="checkbox" checked={selectedGuards.includes(g.id)} disabled={atCap} onChange={() => toggleGuard(g.id, o.requiredHeadcount)} />
                              <span className="truncate">{g.fullName} <span className="text-slate-400">({g.guardCode})</span></span>
                            </label>
                          );
                        })}
                        {pool.length === 0 && <p className="text-[11px] text-slate-400 col-span-full">No available guards in this region pool.</p>}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] font-bold text-slate-500">{selectedGuards.length}/{o.requiredHeadcount} selected</span>
                        <button className={btn("success", true)} disabled={selectedGuards.length === 0} onClick={() => assignOrder(o.id)}>
                          Assign {selectedGuards.length} Guard(s)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Direct Deployments list ── */}
      <div className={card}>
        <SectionTitle icon={UserCheck} title="Guard Deployments" sub="Deployments created from filled orders (RM) or direct hand-off" />
        <div className="mt-3">
          {deployments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No deployments yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {deployments.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-xs text-slate-900">{d.guardName} → {d.siteName}</span>
                      {statusBadge(d.status)}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{d.shiftType} · {d.clientName} · by {d.deployedBy} · {new Date(d.deployedAt).toLocaleDateString()}</p>
                  </div>
                  {d.status === "Active" && canDeploy && (
                    <button className={btn("ghost", true)} onClick={() => endDeployment(d.id)}>End</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================ CAMPAIGN BUDGETS ============================ */

export const CampaignBudgetPanel: React.FC = () => {
  const campaigns = useDomainStore((s) => s.campaigns);
  const approveCampaignBudget = useDomainStore((s) => s.approveCampaignBudget);
  const gmApproveCampaignBudget = useDomainStore((s) => s.gmApproveCampaignBudget);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const isFM = role === FINANCE_MANAGER;
  const isGM = role === GENERAL_MANAGER;

  const pending = campaigns.filter((c) => c.budgetStatus === "Pending Finance Approval" || c.budgetStatus === "Pending GM Approval");

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={BadgeCheck} title="Campaign Budget Approvals" sub="Finance Manager approves; budgets >10M UGX additionally require GM final approval" />
      </div>
      {pending.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No campaigns pending budget approval.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {campaigns.filter((c) => c.budgetStatus && c.budgetStatus !== "Approved").map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs text-slate-900">{c.name}</span>
                  {statusBadge(c.budgetStatus)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.channel} · UGX {c.budget.toLocaleString()} · {c.leadsGenerated} leads · proposed by {c.proposedBy ?? "—"}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {c.budgetStatus === "Pending Finance Approval" && isFM && (
                  <button className={btn("success", true)} onClick={() => approveCampaignBudget(c.id)}>Approve Budget</button>
                )}
                {c.budgetStatus === "Pending GM Approval" && isGM && (
                  <button className={btn("success", true)} onClick={() => gmApproveCampaignBudget(c.id)}>GM Final Approve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ GUARD AVAILABILITY (Marketing) ============================ */

export const GuardAvailabilityByRegion: React.FC = () => {
  const guards = useDomainStore((s) => s.guards);
  const regions = useDomainStore((s) => s.regions);

  const grouped = guards.reduce<Record<string, { total: number; deployed: number; available: number }>>((acc, g) => {
    const region = g.region ?? "Central (Kampala HQ)";
    const key = regions.find((r) => r.regionName === region)?.name ?? region;
    acc[key] = acc[key] ?? { total: 0, deployed: 0, available: 0 };
    acc[key].total += 1;
    if (g.lifecycleStage === "DEPLOYED") acc[key].deployed += 1;
    else acc[key].available += 1;
    return acc;
  }, {});

  return (
    <div className={card}>
      <div className="mb-4"><SectionTitle icon={MapPin} title="Guard Availability by Region" sub="Aggregate view shared with Marketing for pipeline planning" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.entries(grouped).map(([region, stats]) => (
          <div key={region} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <p className="font-black text-xs text-slate-900">{region}</p>
              <p className="text-[11px] text-slate-500">{stats.total} guards · {stats.deployed} deployed</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${stats.available > 0 ? "bg-green-500/10 text-green-600 border border-green-500/30" : "bg-amber-500/10 text-amber-600 border border-amber-500/30"}`}>
                {stats.available} available
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================ GUARD LIFECYCLE (HR/Ops) ============================ */

export const GuardLifecyclePanel: React.FC = () => {
  const guards = useDomainStore((s) => s.guards);
  const moveGuardLifecycle = useDomainStore((s) => s.moveGuardLifecycle);
  const issueGuardId = useDomainStore((s) => s.issueGuardId);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const [guardId, setGuardId] = useState("");
  const [stage, setStage] = useState("PASSED_OUT");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("stage");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiry, setIdExpiry] = useState("");

  const canMove = isRoleIn(role, DESERTION_REPORTING_ROLES);
  const canTerminate = role === "HR Manager";
  const canIssueId = role === RECORDS_OFFICER;

  const selected = guards.find((g) => g.id === guardId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardId) return;
    if (action === "issue") {
      issueGuardId(guardId, { idCardNumber: idNumber, idCardExpiryDate: idExpiry });
      setIdNumber(""); setIdExpiry("");
      return;
    }
    if (action === "terminate") {
      if (!reason.trim()) return;
      const payload: Record<string, string> = {
        terminationCategory: "Terminated",
        terminationReason: reason,
        terminationDate: new Date().toISOString().split("T")[0],
      };
      moveGuardLifecycle(guardId, payload);
      setReason("");
      return;
    }
    moveGuardLifecycle(guardId, { lifecycleStage: stage as "PASSED_OUT" });
  };

  return (
    <div className={card}>
      <div className="mb-4"><SectionTitle icon={GitBranch} title="Guard Lifecycle & ID Issuance" sub="Ops/RM move stages; HR records termination; Records Officer issues ID cards" /></div>
      <form onSubmit={submit} className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <select className={inputCls} value={guardId} onChange={(e) => setGuardId(e.target.value)} required>
          <option value="">Select guard...</option>
          {guards.map((g) => <option key={g.id} value={g.id}>{g.fullName} ({g.guardCode}) — {g.lifecycleStage ?? "n/a"}</option>)}
        </select>

        {canMove && action === "stage" && (
          <div className="grid grid-cols-2 gap-3">
            <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="ENROLLED">ENROLLED</option>
              <option value="HANDED_TO_OPERATIONS">HANDED_TO_OPERATIONS</option>
              <option value="IN_TRAINING">IN_TRAINING</option>
              <option value="PASSED_OUT">PASSED_OUT</option>
              <option value="DEPLOYED">DEPLOYED</option>
            </select>
            <div className="flex gap-2 items-center">
              <button type="submit" className={btn("primary", true)}>Move Stage</button>
              <select className={`${inputCls} w-auto`} value={action} onChange={(e) => setAction(e.target.value)}>
                <option value="stage">Stage move</option>
                {canTerminate && <option value="terminate">Terminate</option>}
                {canIssueId && <option value="issue">Issue ID</option>}
              </select>
            </div>
          </div>
        )}

        {action === "terminate" && canTerminate && (
          <div className="space-y-2">
            <textarea className={inputCls} placeholder="Termination reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
            <button type="submit" className={btn("danger", true)}>Terminate Guard</button>
          </div>
        )}

        {action === "issue" && canIssueId && (
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="ID Card Number (e.g. IDC-2026-SG001)" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
            <input className={inputCls} type="date" value={idExpiry} onChange={(e) => setIdExpiry(e.target.value)} required />
            <div className="col-span-2 flex justify-end">
              <button type="submit" className={btn("primary", true)}>Issue ID Card</button>
            </div>
          </div>
        )}

        {selected && (
          <p className="text-[11px] text-slate-500">
            <strong>{selected.fullName}</strong> · stage <strong>{selected.lifecycleStage ?? "n/a"}</strong> · ID status <strong>{selected.idCardStatus ?? "n/a"}</strong>
            {selected.terminationCategory && ` · ${selected.terminationCategory} (${selected.terminationDate})`}
          </p>
        )}
      </form>
    </div>
  );
};

/* ============================ EXPENSE APPROVAL (Finance) ============================ */

export const ExpenseApprovalPanel: React.FC = () => {
  const expenses = useDomainStore((s) => s.expenses);
  const approveExpense = useDomainStore((s) => s.approveExpense);
  const gmApproveExpense = useDomainStore((s) => s.gmApproveExpense);
  const rejectExpense = useDomainStore((s) => s.rejectExpense);
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role;

  const isFM = role === FINANCE_MANAGER;
  const isGM = role === GENERAL_MANAGER;

  const pending = expenses.filter((e) => e.status === "Pending" || e.status === "Pending GM Approval");

  return (
    <div className={card}>
      <div className="mb-4"><SectionTitle icon={CreditCard} title="Expense Approval Chain" sub="Accountant submits → Finance Manager approves → GM final for >10M UGX" /></div>
      {pending.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center">No expenses awaiting approval.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {pending.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs text-slate-900">{e.description}</span>
                  {statusBadge(e.status)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{e.category} · UGX {e.amount.toLocaleString()} · submitted by {e.submittedBy ?? "—"}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {e.status === "Pending" && isFM && (
                  <>
                    <button className={btn("success", true)} onClick={() => approveExpense(e.id)}>Approve</button>
                    <button className={btn("danger", true)} onClick={() => rejectExpense(e.id)}>Reject</button>
                  </>
                )}
          {e.status === "Pending GM Approval" && isGM && (
            <>
              <button className={btn("success", true)} onClick={() => gmApproveExpense(e.id)}>GM Approve</button>
              <button className={btn("danger", true)} onClick={() => rejectExpense(e.id)}>Reject</button>
            </>
          )}
        </div>
      </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================ CORPORATE GOVERNANCE & STRATEGIC OVERSIGHT ============================ */

export const CorporateGovernancePanel: React.FC = () => {
  const domain = useDomainStore();
  const contracts = domain.contracts;
  const sites = domain.sites;
  const invoices = domain.invoices;
  const incidents = domain.incidents;
  const disciplinary = domain.disciplinaryActions;
  const complaints = domain.complaints;

  const fmtCurrency = (v: number) =>
    `UGX ${v.toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;

  const contractStats = React.useMemo(
    () => ({
      active: contracts.filter((c) => c.status === "Active").length,
      expiringSoon: contracts.filter((c) => c.status === "Expiring Soon").length,
      expired: contracts.filter((c) => c.status === "Expired").length,
      terminated: contracts.filter((c) => c.status === "Terminated").length,
    }),
    [contracts]
  );

  const slaStats = React.useMemo(
    () => ({
      compliant: sites.filter((s) => s.slaStatus === "Compliant").length,
      atRisk: sites.filter((s) => s.slaStatus !== "Compliant").length,
    }),
    [sites]
  );

  const financialStats = React.useMemo(
    () => ({
      totalRevenue: invoices.reduce((s, i) => s + i.amount, 0),
      paidRevenue: invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0),
      overdueRevenue: invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0),
    }),
    [invoices]
  );

  const criticalIncidents = incidents.filter(
    (i) => i.severity === "Critical" && i.status !== "Resolved"
  );
  const unresolvedComplaints = complaints.filter((c) => c.status !== "Resolved");
  const openDisciplinary = disciplinary.filter((d) => d.status !== "Finalized" && d.status !== "Rejected");

  const alertCount = criticalIncidents.length + unresolvedComplaints.length + openDisciplinary.length;

  return (
    <div className={card}>
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-xl bg-slate-900 text-white shrink-0">
          <FileText size={16} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">Corporate Governance &amp; Strategic Oversight</h3>
          <p className="text-[11px] text-slate-500">Executive Directorate — contract compliance, SLA health, financial KPIs, and compliance alerts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-slate-900">{contractStats.active}</div>
          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle size={10} /> Active Contracts
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-amber-700">{contractStats.expiringSoon}</div>
          <div className="text-[11px] text-amber-600 flex items-center justify-center gap-1">
            <Clock size={10} /> Expiring Soon
          </div>
        </div>
        <div className="bg-rose-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-rose-700">{contractStats.expired + contractStats.terminated}</div>
          <div className="text-[11px] text-rose-600 flex items-center justify-center gap-1">
            <XCircle size={10} /> Expired / Terminated
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-blue-700">{slaStats.compliant}</div>
          <div className="text-[11px] text-blue-600 flex items-center justify-center gap-1">
            <BadgeCheck size={10} /> SLA Compliant Sites
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[11px] text-slate-500 mb-1">Financial Health</div>
          <div className="text-sm font-black text-slate-900">{fmtCurrency(financialStats.totalRevenue)}</div>
          <div className="text-[11px] text-slate-500">
            {fmtCurrency(financialStats.paidRevenue)} paid · {fmtCurrency(financialStats.overdueRevenue)} overdue
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[11px] text-slate-500 mb-1">Compliance Alerts</div>
          <div className="text-sm font-black text-rose-700">{alertCount} open items</div>
          <div className="text-[11px] text-slate-500">
            {criticalIncidents.length} critical incidents · {unresolvedComplaints.length} complaints · {openDisciplinary.length} disciplinary
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="text-[11px] text-slate-500 mb-1">SLA Risk</div>
          <div className="text-sm font-black text-amber-700">{slaStats.atRisk} sites at risk</div>
          <div className="text-[11px] text-slate-500">
            {sites.length > 0 ? Math.round((slaStats.atRisk / sites.length) * 100) : 0}% of sites non-compliant
          </div>
        </div>
      </div>

      {alertCount > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-700 mb-1">Items Requiring Executive Attention</div>
          {criticalIncidents.map((inc) => (
            <div key={inc.id} className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle size={12} className="text-rose-600 mt-0.5 shrink-0" />
              <div className="text-[12px] text-slate-700">
                <strong>Critical Incident:</strong> {inc.title} — {inc.description}
              </div>
            </div>
          ))}
          {unresolvedComplaints.map((c) => (
            <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle size={12} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[12px] text-slate-700">
                <strong>Unresolved Complaint:</strong> {c.clientName} — {c.siteName} ({c.category})
              </div>
            </div>
          ))}
          {openDisciplinary.map((d) => (
            <div key={d.id} className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 border border-rose-200">
              <AlertTriangle size={12} className="text-rose-600 mt-0.5 shrink-0" />
              <div className="text-[12px] text-slate-700">
                <strong>Disciplinary Action:</strong> {d.guardName} — {d.offence}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
