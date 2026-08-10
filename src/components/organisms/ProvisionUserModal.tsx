import React, { useState } from "react";
import type { User, UserRole, Guard } from "../../types";

interface ProvisionUserModalProps {
  guard: Guard | null;
  onClose: () => void;
  onAddUser: (user: Omit<User, "id">) => void;
  onUpdateGuard?: (guardId: string, updates: Partial<Guard>) => void;
}

export const ProvisionUserModal: React.FC<ProvisionUserModalProps> = ({ guard, onClose, onAddUser, onUpdateGuard }) => {
  const [provUserEmail, setProvUserEmail] = useState("");
  const [provUserDept, setProvUserDept] = useState("Operations");
  const [provUserRole, setProvUserRole] = useState<UserRole>("Guard Officer");

  if (!guard) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      name: guard.fullName,
      email: provUserEmail,
      role: provUserRole,
      department: provUserDept,
      status: "Active",
      lastActive: "Just now",
      forceNumber: guard.guardCode,
    });
    if (onUpdateGuard) {
      onUpdateGuard(guard.id, { hasSystemAccount: true });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 font-extrabold text-[10px] rounded-full uppercase border border-cyan-200">
              IT USER PROVISIONING
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">
              Create System Account for {guard.fullName}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Force Number</span>
            <strong className="font-mono text-cyan-700 text-sm">{guard.guardCode}</strong>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Corporate System Email</label>
            <input type="email" required value={provUserEmail}
              onChange={(e) => setProvUserEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select value={provUserDept} onChange={(e) => setProvUserDept(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
                <option value="Field Ops">Field Ops / Guarding</option>
                <option value="Armoury">Armoury Vault</option>
                <option value="Operations">Operations</option>
                <option value="Fleet">Fleet</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">System User Role</label>
              <select value={provUserRole} onChange={(e) => setProvUserRole(e.target.value as UserRole)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
                <option value="Guard Officer">Guard</option>
                <option value="Operations Manager">Operations Manager</option>
                <option value="Armorer">Armorer</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer">Provision User Account</button>
          </div>
        </form>
      </div>
    </div>
  );
};
