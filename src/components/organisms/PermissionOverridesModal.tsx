import React, { useState } from "react";
import { ShieldCheck, RotateCcw } from "lucide-react";
import type { User } from "../../types";
import { APP_MODULES } from "../../constants/modules";
import { getAllowedModuleIds } from "../../constants/modules";

type OverrideLevel = "view" | "full" | "none";

interface PermissionOverridesModalProps {
  user: User | null;
  onClose: () => void;
  onSubmit: (userId: string, updates: Partial<User>) => void;
}

const LEVEL_OPTIONS: { value: OverrideLevel; label: string }[] = [
  { value: "view", label: "View" },
  { value: "full", label: "Full" },
  { value: "none", label: "None" },
];

export const PermissionOverridesModal: React.FC<PermissionOverridesModalProps> = ({ user, onClose, onSubmit }) => {
  const [overrides, setOverrides] = useState<Record<string, OverrideLevel>>(
    () => (user?.customPermissions ? { ...user.customPermissions } : {})
  );

  if (!user) return null;

  const roleDefaults = getAllowedModuleIds(user.role);

  const setLevel = (moduleId: string, level: OverrideLevel) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (level === "view" || level === "full") {
        next[moduleId] = level;
      } else {
        delete next[moduleId];
      }
      return next;
    });
  };

  const currentLevel = (moduleId: string): OverrideLevel | "inherit" =>
    overrides[moduleId] ?? "inherit";

  const countOverrides = Object.keys(overrides).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customPermissions: Record<string, OverrideLevel> = {};
    for (const [moduleId, level] of Object.entries(overrides)) {
      customPermissions[moduleId] = level;
    }
    onSubmit(user.id, { customPermissions });
    onClose();
  };

  const handleReset = () => {
    setOverrides({});
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            Module Access Overrides — {user.name}
          </h3>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold">✕</button>
        </div>

        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Per-user overrides on top of the role matrix (<span className="font-bold text-cyan-700">{user.role}</span>).
          Select <span className="font-bold">View</span> or <span className="font-bold">Full</span> to grant a module,
          or <span className="font-bold">None</span> to explicitly revoke it. <span className="font-bold">Inherit</span> falls back to the role default.
        </p>

        <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-2.5">Module</th>
                <th className="p-2.5">Department</th>
                <th className="p-2.5">Role Default</th>
                <th className="p-2.5 w-36">Override Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {APP_MODULES.map((mod) => {
                const roleDefault = roleDefaults.includes(mod.id) ? "Granted" : "—";
                const level = currentLevel(mod.id);
                return (
                  <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <mod.icon className="w-4 h-4 text-cyan-600" />
                        {mod.label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{mod.id}</div>
                    </td>
                    <td className="p-2.5 text-[11px]">{mod.department}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        roleDefault === "Granted"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {roleDefault}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={level}
                        onChange={(e) => setLevel(mod.id, e.target.value as OverrideLevel)}
                        className={`w-full p-2 bg-slate-50 border rounded-lg font-semibold text-xs outline-none cursor-pointer ${
                          level === "none"
                            ? "border-rose-300 text-rose-700"
                            : level === "full"
                            ? "border-cyan-300 text-cyan-800"
                            : level === "view"
                            ? "border-amber-300 text-amber-800"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        <option value="inherit">Inherit (role default)</option>
                        {LEVEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 font-semibold">
            {countOverrides === 0
              ? "No overrides — all modules follow the role matrix."
              : `${countOverrides} module override${countOverrides === 1 ? "" : "s"} active.`}
            <button onClick={handleReset}
              className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer">
              <RotateCcw className="w-3 h-3" /> Reset All
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
            <button onClick={handleSubmit}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl font-black shadow-md cursor-pointer">Save Permission Overrides</button>
          </div>
        </div>
      </div>
    </div>
  );
};
