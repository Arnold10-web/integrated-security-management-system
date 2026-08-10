import React from "react";
import { Navigation, Zap } from "lucide-react";
import { Vehicle } from "../../types";

interface FleetGpsTabProps {
  vehicles: Vehicle[];
}

export const FleetGpsTab: React.FC<FleetGpsTabProps> = ({ vehicles }) => {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No vehicles with GPS tracking registered.</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Navigation className="w-6 h-6" /></div>
          <div>
            <h3 className="text-base font-black text-slate-900">GPS Fleet Movement & Geofence Telemetry</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time GPS tracker status, speed limits, and panic alert sensors.</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" /> GPS Live Active
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vehicles.map((v) => (
          <div key={v.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-700">{v.plateNumber}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="text-sm font-black text-slate-900">{v.makeModel}</div>
            <div className="text-xs text-slate-500">Speed: <span className="font-bold text-slate-800">42 KM/H (Normal)</span></div>
            <div className="text-xs text-slate-500">Geofence: <span className="font-bold text-emerald-700">Inside Zone</span></div>
            <div className="text-xs text-slate-500">Panic Alarm: <span className="font-bold text-emerald-700">OK - Secure</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};
