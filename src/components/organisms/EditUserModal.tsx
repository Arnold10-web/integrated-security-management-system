import React, { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";
import type { User, UserRole } from "../../types";
import { UGANDA_REGIONS } from "../../data/mockData";

interface EditUserModalProps {
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: string, updates: Partial<User>) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSubmit }) => {
  const [localUser, setLocalUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) setLocalUser({ ...user });
  }, [user]);

  if (!user || !localUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(localUser.id, {
      name: localUser.name,
      email: localUser.email,
      department: localUser.department,
      role: localUser.role,
      region: localUser.region,
      phone: localUser.phone,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-600" />
            Modify User Rights & Department
          </h3>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input type="text" required value={localUser.name}
              onChange={(e) => setLocalUser({ ...localUser, name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Department Email</label>
            <input type="email" required value={localUser.email}
              onChange={(e) => setLocalUser({ ...localUser, email: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select value={localUser.department}
                onChange={(e) => setLocalUser({ ...localUser, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
                <option value="Executive Directorate">Executive Directorate</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Operations">Operations</option>
                <option value="Investigations">Investigations</option>
                <option value="Finance & Cashier">Finance & Cashier</option>
                <option value="Administrations">Administrations</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Designation</label>
              <select value={localUser.role}
                onChange={(e) => { const r = e.target.value as UserRole; setLocalUser({ ...localUser, role: r, department: r === "Investigations Officer" ? "Investigations" : localUser.department }); }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
                <option value="General Manager">General Manager</option>
                <option value="Director">Director</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Assistant">HR Assistant</option>
                <option value="Records Officer">Records Officer</option>
                <option value="Business Development Manager">Business Development Manager</option>
                <option value="Sales and Marketing Supervisor">Sales and Marketing Supervisor</option>
                <option value="Operations Manager">Operations Manager</option>
                <option value="Regional Manager">Regional Manager</option>
                <option value="Fleet Manager">Fleet Manager</option>
                <option value="Training Officer">Training Officer</option>
                <option value="Armorer">Armorer</option>
                <option value="Investigations Officer">Investigations Officer</option>
                <option value="Guard Officer">Guard Officer</option>
                <option value="K9 Supervisor">K9 Supervisor</option>
                <option value="K9 Handler">K9 Handler</option>
                <option value="Finance Manager">Finance Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="Assistant Accountant">Assistant Accountant</option>
                <option value="Internal Auditor">Internal Auditor</option>
                <option value="Cashier">Cashier</option>
                <option value="Administrative Officer">Administrative Officer</option>
                <option value="IT Officer">IT Officer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Regional Station / Branch Attachment</label>
            <select value={localUser.region || "Kampala Central"}
              onChange={(e) => setLocalUser({ ...localUser, region: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
              {UGANDA_REGIONS.map((reg) => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};
