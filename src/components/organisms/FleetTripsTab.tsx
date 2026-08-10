import React from "react";
import { Compass, Truck } from "lucide-react";
import { VehicleTripLog } from "../../types";

interface FleetTripsTabProps {
  tripLogs: VehicleTripLog[];
}

export const FleetTripsTab: React.FC<FleetTripsTabProps> = ({ tripLogs }) => {
  if (tripLogs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No trip logs recorded yet.</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-600" />
          Vehicle Journey & Trip Logbook
        </h3>
        <span className="text-xs text-slate-500 font-semibold">Active Transit Movement Sheets</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Code / Departure</th>
              <th className="p-3.5">Vehicle & Driver</th>
              <th className="p-3.5">Destination & Route</th>
              <th className="p-3.5">Purpose</th>
              <th className="p-3.5">Odometer KM</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Authorized By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {tripLogs.map((trip) => (
              <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{trip.tripCode}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{trip.departureTime}</div>
                </td>
                <td className="p-3.5">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{trip.plateNumber}</span>
                  <div className="text-slate-900 font-bold mt-1">{trip.driverName}</div>
                </td>
                <td className="p-3.5 font-bold text-slate-800">{trip.destination}</td>
                <td className="p-3.5 text-slate-600 max-w-xs">{trip.purpose}</td>
                <td className="p-3.5 font-mono">
                  <div>Start: {trip.startMileageKm.toLocaleString()} KM</div>
                  {trip.endMileageKm && <div className="text-slate-500 text-[10px]">End: {trip.endMileageKm.toLocaleString()} KM</div>}
                </td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                    trip.status === "In Transit" ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}>
                    <Truck className="w-3 h-3" />
                    {trip.status}
                  </span>
                </td>
                <td className="p-3.5 font-semibold text-slate-600">{trip.authorizedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
