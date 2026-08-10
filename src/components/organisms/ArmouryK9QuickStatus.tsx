import React from "react";
import { ShieldAlert, Dog } from "lucide-react";
import { ArmouryItem, K9Dog } from "../../types";

interface ArmouryK9QuickStatusProps {
  armoury: ArmouryItem[];
  k9s: K9Dog[];
  onNavigate: (tabId: string) => void;
}

export const ArmouryK9QuickStatus: React.FC<ArmouryK9QuickStatusProps> = ({ armoury, k9s, onNavigate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">Armoury Vault Summary</h4>
          </div>
          <button onClick={() => onNavigate("armoury")} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
            Manage Vault
          </button>
        </div>
        <ul className="space-y-2 text-xs">
          {armoury.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-slate-400 font-mono text-[11px]">{item.serialNumber}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                item.location === "Main Vault"
                  ? "bg-slate-100 text-slate-700"
                  : item.location === "Issued Out"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {item.location}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dog className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">K9 Dog & Handler Roster</h4>
          </div>
          <button onClick={() => onNavigate("k9")} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
            View K9 Unit
          </button>
        </div>
        <ul className="space-y-2 text-xs">
          {k9s.map((dog) => (
            <li key={dog.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
              <div>
                <p className="font-semibold text-slate-800">{dog.name} ({dog.breed})</p>
                <p className="text-slate-400 text-[11px]">Handler: {dog.assignedHandlerName || "Unassigned"}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                dog.status === "Active Duty"
                  ? "bg-emerald-100 text-emerald-800"
                  : dog.status === "In Training"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {dog.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
