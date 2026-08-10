import React from "react";
import { Fuel } from "lucide-react";
import { FuelRequisitionLog } from "../../types";

interface FleetFuelTabProps {
  fuelLogs: FuelRequisitionLog[];
}

export const FleetFuelTab: React.FC<FleetFuelTabProps> = ({ fuelLogs }) => {
  if (fuelLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No fuel requisition logs recorded yet.</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Fuel className="w-4 h-4 text-amber-600" />
          Fuel Requisition & Consumption Register
        </h3>
        <span className="text-xs text-slate-500 font-semibold">Fuel Vouchers & Reconciliation</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Voucher Code</th>
              <th className="p-3.5">Vehicle</th>
              <th className="p-3.5">Driver Officer</th>
              <th className="p-3.5">Litres</th>
              <th className="p-3.5">Cost UGX</th>
              <th className="p-3.5">Fuel Station</th>
              <th className="p-3.5">Odometer at Refill</th>
              <th className="p-3.5">Reconciliation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {fuelLogs.map((fuel) => (
              <tr key={fuel.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{fuel.voucherCode}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{fuel.refillDate}</div>
                </td>
                <td className="p-3.5 font-mono text-blue-700 font-bold">{fuel.plateNumber}</td>
                <td className="p-3.5 font-bold text-slate-900">{fuel.driverName}</td>
                <td className="p-3.5 font-extrabold text-amber-700">{fuel.fuelLitres} L ({fuel.fuelType})</td>
                <td className="p-3.5 font-extrabold text-slate-900">UGX {fuel.costUgx.toLocaleString()}</td>
                <td className="p-3.5 text-slate-700 font-medium">{fuel.stationName}</td>
                <td className="p-3.5 font-mono">{fuel.mileageAtRefillKm.toLocaleString()} KM</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    fuel.reconciled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {fuel.reconciled ? "Reconciled" : "Pending Verification"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
