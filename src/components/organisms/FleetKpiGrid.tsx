import React from "react";
import { Car, CheckCircle2, Fuel, Wrench } from "lucide-react";

interface FleetKpiGridProps {
  totalVehicles: number;
  operationalVehicles: number;
  totalFuelUgx: number;
  fuelLogsLength: number;
  inServiceVehicles: number;
  maintenanceLogsLength: number;
}

export const FleetKpiGrid: React.FC<FleetKpiGridProps> = ({
  totalVehicles, operationalVehicles, totalFuelUgx, fuelLogsLength, inServiceVehicles, maintenanceLogsLength,
}) => {
  const readinessPct = totalVehicles > 0 ? Math.round((operationalVehicles / totalVehicles) * 100) : 100;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">Total Active Fleet</span>
          <div className="text-2xl font-black text-slate-900">{totalVehicles} Units</div>
          <span className="text-[10px] text-emerald-600 font-bold">SUVs, Bikes, Armored</span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Car className="w-6 h-6" /></div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">Fleet Readiness Rate</span>
          <div className="text-2xl font-black text-emerald-600">{readinessPct}%</div>
          <span className="text-[10px] text-slate-500 font-semibold">{operationalVehicles} Ready on Duty</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">Fuel Consumption YTD</span>
          <div className="text-2xl font-black text-slate-900">UGX {(totalFuelUgx / 1000000).toFixed(2)}M</div>
          <span className="text-[10px] text-blue-600 font-bold">{fuelLogsLength} Refill Vouchers</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><Fuel className="w-6 h-6" /></div>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 block">Workshop & Maintenance</span>
          <div className="text-2xl font-black text-rose-600">{inServiceVehicles} Units</div>
          <span className="text-[10px] text-slate-500 font-semibold">{maintenanceLogsLength} Active Work Orders</span>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600"><Wrench className="w-6 h-6" /></div>
      </div>
    </div>
  );
};
