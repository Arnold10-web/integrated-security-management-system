/**
 * §11 acting-privilege delegation — IT side.
 * The IT Officer executes (or denies) HR-initiated requests. They do NOT grant
 * independently: there is no "grant now" button outside a request. Both the HR
 * request and the IT grant are recorded in the audit trail.
 */
import React, { useEffect, useState } from "react";
import { Clock3, CheckCheck, XCircle, ShieldAlert, Loader2, ListChecks } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { ActingRequestRow } from "./ActingRequestPanel";

export const ActingRequestsITQueue: React.FC = () => {
  const actingRequests = useAuthStore((s) => s.actingRequests);
  const fetchActingRequests = useAuthStore((s) => s.fetchActingRequests);
  const executeActingRequest = useAuthStore((s) => s.executeActingRequest);
  const denyActingRequest = useAuthStore((s) => s.denyActingRequest);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActingRequests();
  }, [fetchActingRequests]);

  const pending = actingRequests.filter((r) => r.status === "Pending");
  const decided = actingRequests.filter((r) => r.status !== "Pending");

  const handleExecute = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await executeActingRequest(id);
    } catch (err: any) {
      setError(err?.message || "Failed to execute the request.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeny = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await denyActingRequest(id);
    } catch (err: any) {
      setError(err?.message || "Failed to deny the request.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-cyan-600" />
          Acting Coverage Queue
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-black">
              {pending.length} pending
            </span>
          )}
        </h3>
      </div>

      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
        HR raises acting-coverage requests here. You execute the grant on the
        request — you do not decide independently (§11). Both the HR request and
        the grant are recorded in the audit trail, and coverage is additive.
      </p>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px]">
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-400 font-semibold">
          <ShieldAlert className="w-4 h-4" /> No pending acting-coverage requests.
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
              <div className="min-w-0 flex-1">
                <ActingRequestRow request={r} />
              </div>
              <div className="flex gap-2 shrink-0 pt-1">
                <button
                  onClick={() => handleExecute(r.id)}
                  disabled={busyId === r.id}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Execute Grant
                </button>
                <button
                  onClick={() => handleDeny(r.id)}
                  disabled={busyId === r.id}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock3 className="w-3 h-3" /> Decided requests
            </div>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {decided.map((r) => <ActingRequestRow key={r.id} request={r} />)}
          </div>
        </>
      )}
    </div>
  );
};
