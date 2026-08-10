import React from "react";
import { Car } from "lucide-react";
import { Vehicle } from "../../types";

interface DashboardFleetSummaryProps {
  vehicles: Vehicle[];
  onNavigate: (tabId: string) => void;
}

export const DashboardFleetSummary: React.FC<DashboardFleetSummaryProps> = ({ vehicles, onNavigate }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Car className="w-4 h-4 text-blue-600" />
          <span>Fleet & Patrol</span>
        </h3>
        <button onClick={() => onNavigate("fleet")} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
          Manage Fleet
        </button>
      </div>
      <div className="space-y-2">
        {vehicles.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
            <div>
              <p className="font-bold text-slate-800">{v.plateNumber}</p>
              <p className="text-slate-500 text-[11px]">{v.makeModel}</p>
            </div>
            <div className="text-right">
              <span className="font-semibold text-emerald-700">{v.fuelLevelPercentage}% Fuel</span>
              <p className="text-[10px] text-slate-400">{v.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
