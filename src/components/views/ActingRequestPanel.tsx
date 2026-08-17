/**
 * §11 acting-privilege delegation — HR side.
 * The HR Manager initiates a request: who needs coverage, for which role, why,
 * and until when. The IT Officer executes the grant on that request (never
 * grants independently). Requested-by / granted-by is visible on both sides.
 */
import React, { useEffect, useState } from "react";
import { Clock3, Send, ShieldAlert, History, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ActingPrivilegeRequest, UserRole } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import { getEffectiveRole } from "../../services/rbacService";

const DELEGABLE_ROLES: UserRole[] = [
  "HR Manager",
  "HR Assistant",
  "Records Officer",
  "Business Development Manager",
  "Sales and Marketing Supervisor",
  "Operations Manager",
  "Regional Manager",
  "Fleet Manager",
  "Training Officer",
  "Investigations Officer",
  "Guard Officer",
  "Armorer",
  "K9 Supervisor",
  "K9 Handler",
  "Finance Manager",
  "Accountant",
  "Assistant Accountant",
  "Internal Auditor",
  "Cashier",
  "Administrative Officer",
  // §11.6: the General Manager may be covered — but ONLY by the Finance
  // Manager. The server enforces this; the selector lists GM only for an FM.
  "General Manager",
];

export const ActingRequestPanel: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);
  const actingRequests = useAuthStore((s) => s.actingRequests);
  const createActingRequest = useAuthStore((s) => s.createActingRequest);
  const fetchActingRequests = useAuthStore((s) => s.fetchActingRequests);

  const [targetUserId, setTargetUserId] = useState("");
  const [actingRole, setActingRole] = useState<UserRole | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchActingRequests();
  }, [fetchActingRequests]);

  if (!currentUser) return null;

  const amIHR = getEffectiveRole(currentUser) === "HR Manager";
  const targetUser = users.find((u) => u.id === targetUserId);
  const gmOnlyByFM = actingRole === "General Manager" && targetUser?.role !== "Finance Manager";

  const futureTime = new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      setError("Select the employee who needs coverage.");
      return;
    }
    if (!actingRole) {
      setError("Select the role they need to act in.");
      return;
    }
    if (actingRole === targetUser?.role) {
      setError("The acting role must differ from the employee's assigned role.");
      return;
    }
    if (gmOnlyByFM) {
      setError("The General Manager may only be covered by the Finance Manager (§11.6).");
      return;
    }
    if (!expiresAt) {
      setError("Set when this coverage ends.");
      return;
    }
    const expiryMs = new Date(expiresAt).getTime();
    if (isNaN(expiryMs)) {
      setError("The expiry must be a valid date and time.");
      return;
    }
    if (expiryMs <= Date.now()) {
      setError("The expiry must be in the future.");
      return;
    }
    if (!reason.trim()) {
      setError("State why this coverage is needed — this goes into the audit trail.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createActingRequest({
        targetUserId,
        actingRole: actingRole as UserRole,
        expiresAt,
        reason: reason.trim(),
      });
      setTargetUserId("");
      setActingRole("");
      setExpiresAt("");
      setReason("");
    } catch (err: any) {
      setError(err?.message || "Failed to submit the acting-privilege request.");
    } finally {
      setSubmitting(false);
    }
  };

  const myRequests = actingRequests.filter((r) => r.requestedById === currentUser.id);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-amber-600" />
          Time-Bound Acting Coverage (HR)
        </h3>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer inline-flex items-center gap-1.5"
        >
          <History className="w-3.5 h-3.5" /> {showHistory ? "Hide history" : `My requests (${myRequests.length})`}
        </button>
      </div>

      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
        When a role is vacant (leave, absence), the HR Manager raises a request
        for an employee to <span className="font-bold text-slate-800">act in</span>{" "}
        another role. The IT Officer executes the grant on this request. Coverage
        takes effect at the employee's next sign-in, is additive (they keep their
        own role), and lapses automatically at the expiry time. Executive roles
        cannot be covered; the General Manager may only be covered by the Finance
        Manager.
      </p>

      {amIHR && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Employee needing coverage</label>
            <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              <option value="">Select employee…</option>
              {users.filter((u) => u.status === "Active" && u.id !== currentUser.id && u.role !== "IT Officer").map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Role to act in</label>
            <select value={actingRole} onChange={(e) => setActingRole(e.target.value as UserRole | "")}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              <option value="">Select role…</option>
              {DELEGABLE_ROLES.filter((r) => r !== targetUser?.role).map((r) => (
                <option key={r} value={r}>{r}{r === "General Manager" ? " (FM only)" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Coverage until</label>
            <input type="datetime-local" value={expiresAt} min={futureTime}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason (audit trail)</label>
            <input type="text" value={reason} placeholder="e.g. HR Manager on leave 14–21 Aug"
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          {gmOnlyByFM && (
            <div className="md:col-span-2 p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px]">
              §11.6: The General Manager may only be covered by the Finance Manager.
            </div>
          )}

          {error && (
            <div className="md:col-span-2 p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px]">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end pt-1">
            <button type="submit" disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Request to IT Officer
            </button>
          </div>
        </form>
      )}

      {!amIHR && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-semibold">
          Only the HR Manager can initiate acting-coverage requests.
        </div>
      )}

      {showHistory && myRequests.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {myRequests.map((r) => <ActingRequestRow key={r.id} request={r} />)}
        </div>
      )}
      {showHistory && myRequests.length === 0 && (
        <p className="text-[11px] text-slate-400 font-semibold">No requests yet.</p>
      )}
    </div>
  );
};

export const ActingRequestRow: React.FC<{ request: ActingPrivilegeRequest }> = ({ request }) => {
  const statusIcon =
    request.status === "Granted" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
    request.status === "Denied" ? <XCircle className="w-3.5 h-3.5 text-rose-600" /> :
    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />;
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="text-[11px] text-slate-600 font-semibold leading-relaxed">
        <div className="font-black text-slate-800 inline-flex items-center gap-1.5">
          {statusIcon}
          {request.targetName} → {request.actingRole}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            request.status === "Granted" ? "bg-emerald-50 text-emerald-700 border-emerald-300" :
            request.status === "Denied" ? "bg-rose-50 text-rose-700 border-rose-300" :
            "bg-amber-50 text-amber-700 border-amber-300"}`}>
            {request.status}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{request.reason}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Until {new Date(request.expiresAt).toLocaleString()} · requested by {request.requestedByName}
          {request.status === "Granted" && request.grantedByName ? ` · granted by ${request.grantedByName}` : ""}
        </div>
      </div>
    </div>
  );
};
