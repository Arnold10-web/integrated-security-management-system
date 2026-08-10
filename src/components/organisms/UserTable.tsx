import React from "react";
import { Users, MapPin, Compass, ShieldCheck, Edit3, Ban, Trash2, Clock3 } from "lucide-react";
import type { User } from "../../types";
import { getEffectiveRole, isActingInRole } from "../../services/rbacService";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleSuspend: (userId: string) => void;
  onDelete: (userId: string) => void;
  onTriggerWalkthrough?: (user: User) => void;
  onEditPermissions?: (user: User) => void;
  onManageActing?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onToggleSuspend, onDelete, onTriggerWalkthrough, onEditPermissions, onManageActing }) => {
  const overrideCount = (u: User) => (u.customPermissions ? Object.keys(u.customPermissions).length : 0);
  const actingActive = (u: User) => isActingInRole(u, getEffectiveRole(u));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-600" />
          Provisioned Enterprise Staff Accounts & Rights Matrix
        </h3>
        <span className="text-xs text-slate-500 font-semibold">{users.length} Users Listed</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">User Identity & Contact</th>
              <th className="p-3.5">Department</th>
              <th className="p-3.5">Region Attachment</th>
              <th className="p-3.5">Assigned Role</th>
              <th className="p-3.5">Account Status</th>
              <th className="p-3.5">Last Active</th>
              <th className="p-3.5 text-right">IT Access Controls</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic text-xs">No users found matching the filters.</td>
                </tr>
              ) : (users.map((u) => {
              const isSuspended = u.status === "Suspended";
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-500">{u.email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                      {u.department}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200 text-[11px] font-extrabold inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-600" />
                      {u.region || "Central (Kampala HQ)"}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-cyan-700">
                    {u.role}
                    {actingActive(u) && u.actingRole && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-amber-700">
                        <Clock3 className="w-3 h-3" />
                        Acting as {u.actingRole}
                        {u.actingExpiresAt && <span className="text-amber-600 font-semibold">until {new Date(u.actingExpiresAt).toLocaleDateString()}</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                      isSuspended
                        ? "bg-rose-100 text-rose-800 border-rose-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 font-medium text-[11px]">{u.lastActive}</td>
                  <td className="p-3.5 text-right space-x-1">
                    {onTriggerWalkthrough && (
                      <button onClick={() => onTriggerWalkthrough(u)}
                        className="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                        title="Launch System Onboarding for User">
                        <Compass className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Tour</span>
                      </button>
                    )}
                    {onEditPermissions && (
                      <button onClick={() => onEditPermissions(u)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold border ${
                          overrideCount(u) > 0
                            ? "bg-violet-100 hover:bg-violet-200 text-violet-800 border-violet-300"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                        title="Grant / Revoke Module Access Overrides">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Permissions</span>
                        {overrideCount(u) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-violet-800 text-white text-[9px] font-black">{overrideCount(u)}</span>
                        )}
                      </button>
                    )}
                    {onManageActing && (
                      <button onClick={() => onManageActing(u)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold border ${
                          actingActive(u)
                            ? "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                        title="Grant / Revoke Time-Bound Acting Privileges">
                        <Clock3 className="w-3.5 h-3.5" />
                        <span>{actingActive(u) ? "Revoke Acting" : "Acting"}</span>
                      </button>
                    )}
                    <button onClick={() => onEdit(u)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                      title="Edit User Role & Dept">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => onToggleSuspend(u.id)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold ${
                        isSuspended
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                          : "bg-amber-100 hover:bg-amber-200 text-amber-800"
                      }`}
                      title={isSuspended ? "Re-activate Account" : "Suspend Account"}>
                      <Ban className="w-3.5 h-3.5" />
                      <span>{isSuspended ? "Activate" : "Suspend"}</span>
                    </button>
                    <button onClick={() => onDelete(u.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                      title="Delete User Account">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
