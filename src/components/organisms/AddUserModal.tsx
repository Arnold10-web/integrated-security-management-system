import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import type { User, UserRole } from "../../types";
import { UGANDA_REGIONS } from "../../data/mockData";

interface AddUserModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, "id">) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ show, onClose, onSubmit }) => {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [deptInput, setDeptInput] = useState("Operations");
  const [roleInput, setRoleInput] = useState<UserRole>("Operations Manager");
  const [regionInput, setRegionInput] = useState("Kampala Central");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: nameInput,
      email: emailInput,
      phone: phoneInput || "+256 700 000 000",
      department: deptInput,
      role: roleInput,
      region: regionInput || "Kampala Central",
      status: "Active",
      lastActive: "Just now",
    });
    setNameInput("");
    setEmailInput("");
    setPhoneInput("");
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-600" />
            Provision New Departmental User Account
          </h3>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input type="text" required placeholder="e.g., Joan Nansubuga"
              value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Department Email Address</label>
            <input type="email" required placeholder="e.g., j.nansubuga@enterprise-security.co.ug"
              value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Contact</label>
            <input type="text" placeholder="+256 700 123 456"
              value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select value={deptInput} onChange={(e) => setDeptInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none">
                <option value="Executive Directorate">Executive Directorate</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Operations">Operations</option>
                <option value="Investigations">Investigations</option>
                <option value="Finance">Finance</option>
                <option value="Administrations">Administrations</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
              <select value={roleInput} onChange={(e) => { const r = e.target.value as UserRole; setRoleInput(r); if (r === "Investigations Officer") setDeptInput("Investigations"); }}
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
            <select value={regionInput} onChange={(e) => setRegionInput(e.target.value)}
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
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer">Create & Provision User</button>
          </div>
        </form>
      </div>
    </div>
  );
};
