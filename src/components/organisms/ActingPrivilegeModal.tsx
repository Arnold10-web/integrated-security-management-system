import React, { useState } from "react";
import { Clock3, RotateCcw, ShieldAlert, ListChecks } from "lucide-react";
import type { User } from "../../types";
import { getEffectiveRole } from "../../services/rbacService";

interface ActingPrivilegeModalProps {
  user: User | null;
  onClose: () => void;
  onRevoke: (userId: string) => Promise<void>;
}

export const ActingPrivilegeModal: React.FC<ActingPrivilegeModalProps> = ({ user, onClose, onRevoke }) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const effectiveRole = getEffectiveRole(user);
  const hasActiveActing = user.actingRole !== undefined && user.actingRole !== null && effectiveRole !== user.role;

  const handleRevoke = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onRevoke(user.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke acting privileges.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Clock3 className="w-5 h-5 text-amber-600" />
            Time-Bound Acting Privileges — {user.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold">✕</button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Acting coverage is <span className="font-bold text-slate-800">requested by the HR Manager</span> and{" "}
          <span className="font-bold text-slate-800">executed here by the IT Officer</span>. The acting role takes
          effect at the user's next sign-in, is additive (they keep their own role's capabilities), and falls back to
          their assigned role (<span className="font-bold text-slate-800">{user.role}</span>) once the expiry passes.
          Executive roles (General Manager / Director) and IT Officer are not delegable; the General Manager may only be
          covered by the Finance Manager.
        </p>

        {hasActiveActing && (
          <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-300 rounded-2xl">
            <div className="text-[11px] text-amber-900 font-semibold leading-relaxed">
              <div className="font-black flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Currently acting as {user.actingRole}
              </div>
              <div className="text-[10px] text-amber-800 mt-0.5">
                {user.actingExpiresAt
                  ? `Expires ${new Date(user.actingExpiresAt).toLocaleString()}`
                  : "No expiry recorded"}
                {user.actingGrantedBy ? ` · granted by ${user.actingGrantedBy}` : ""}
              </div>
            </div>
            <button onClick={handleRevoke} disabled={submitting}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Revoke Now
            </button>
          </div>
        )}

        {!hasActiveActing && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 font-semibold leading-relaxed flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-400 shrink-0" />
            This user has no active acting coverage. To grant it, act on a pending
            request in the <span className="font-bold">Acting Coverage Queue</span> above.
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
};
