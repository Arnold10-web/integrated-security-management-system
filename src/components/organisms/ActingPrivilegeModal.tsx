import React, { useState } from "react";
import { Clock3, RotateCcw, ShieldAlert } from "lucide-react";
import type { User, UserRole } from "../../types";
import { getEffectiveRole } from "../../services/rbacService";

interface ActingPrivilegeModalProps {
  user: User | null;
  onClose: () => void;
  onGrant: (userId: string, actingRole: UserRole, expiresAt: string) => Promise<void>;
  onRevoke: (userId: string) => Promise<void>;
}

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
];

export const ActingPrivilegeModal: React.FC<ActingPrivilegeModalProps> = ({ user, onClose, onGrant, onRevoke }) => {
  const [actingRole, setActingRole] = useState<UserRole | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const effectiveRole = getEffectiveRole(user);
  const hasActiveActing = user.actingRole !== undefined && user.actingRole !== null && effectiveRole !== user.role;

  const futureTime = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actingRole) {
      setError("Select an acting role to delegate.");
      return;
    }
    if (actingRole === user.role) {
      setError("The acting role must differ from the user's assigned role.");
      return;
    }
    if (!expiresAt) {
      setError("Set an expiry date/time for the delegation.");
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
    setSubmitting(true);
    setError(null);
    try {
      await onGrant(user.id, actingRole, expiresAt);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to grant acting privileges.");
      setSubmitting(false);
    }
  };

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
          Delegate a <span className="font-bold text-amber-700">temporary elevated role</span> to this user (e.g. an HR
          Assistant acting as HR Manager while the manager is on leave). The acting role takes effect at the user's next
          sign-in and automatically falls back to their assigned role (<span className="font-bold text-slate-800">{user.role}</span>)
          once the expiry passes. Executive roles (General Manager / Director) and IT Officer cannot be delegated.
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

        <form onSubmit={handleGrant} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Acting Role</label>
            <select value={actingRole} onChange={(e) => setActingRole(e.target.value as UserRole | "")}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              <option value="">Select a role to delegate…</option>
              {DELEGABLE_ROLES.filter((r) => r !== user.role).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Expiry (date &amp; time)</label>
            <input type="datetime-local" value={expiresAt} min={futureTime}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
            <p className="text-[10px] text-slate-400 mt-1">Defaults to 7 days out; align with the leave period.</p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl font-bold text-[11px]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5">
              <Clock3 className="w-4 h-4" /> Grant Acting Privileges
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
