import React from "react";
import { RotateCw } from "lucide-react";
import { Vehicle } from "../../types";

interface FleetReplacementTabProps {
  vehicles: Vehicle[];
}

export const FleetReplacementTab: React.FC<FleetReplacementTabProps> = ({ vehicles }) => {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No vehicles in the fleet replacement queue.</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><RotateCw className="w-6 h-6" /></div>
          <div>
            <h3 className="text-base font-black text-slate-900">Vehicle Replacement & Depreciation Lifecycle</h3>
            <p className="text-xs text-slate-500 font-medium">Identify high-maintenance, aging, or unreliable vehicles scheduled for auction or replacement.</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {vehicles.map((v) => (
          <div key={v.id} className="p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700">{v.plateNumber}</span>
                <span className="text-sm font-black text-slate-900">{v.makeModel}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Mileage: <span className="font-mono font-bold text-slate-800">{v.mileageKm.toLocaleString()} KM</span> | Lifetime Maintenance: <span className="font-mono font-bold text-slate-800">UGX {((v.lifetimeMaintenanceCost || 1500000) / 1000000).toFixed(1)}M</span>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase ${
              v.replacementStatus === "Recommended for Replacement" ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}>{v.replacementStatus || "Active Fleet"}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
