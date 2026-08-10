import React from "react";
import { AlertOctagon } from "lucide-react";
import { FleetBreakdownEmergency } from "../../types";

interface FleetBreakdownsTabProps {
  breakdowns: FleetBreakdownEmergency[];
}

export const FleetBreakdownsTab: React.FC<FleetBreakdownsTabProps> = ({ breakdowns }) => {
  if (breakdowns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No breakdown emergencies recorded.</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {breakdowns.map((brk) => (
        <div key={brk.id} className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700"><AlertOctagon className="w-6 h-6" /></div>
              <div>
                <span className="font-bold text-rose-700 text-xs">{brk.incidentCode}</span>
                <h3 className="text-base font-black text-slate-900">{brk.issueType} on {brk.plateNumber}</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-xs">{brk.status}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div><span className="text-slate-400 font-bold block">Driver Officer:</span><span className="font-extrabold text-slate-900">{brk.driverName}</span></div>
            <div><span className="text-slate-400 font-bold block">Breakdown Location:</span><span className="font-extrabold text-slate-900">{brk.location}</span></div>
            <div><span className="text-slate-400 font-bold block">Backup Unit Dispatched:</span><span className="font-extrabold text-blue-700">{brk.backupVehicleDispatched || "Dispatched"}</span></div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 font-medium">{brk.description}</div>
        </div>
      ))}
    </div>
  );
};
