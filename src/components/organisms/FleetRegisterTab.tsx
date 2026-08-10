import React, { useState } from "react";
import { Fuel, Pencil, Trash2 } from "lucide-react";
import { Vehicle } from "../../types";

interface FleetRegisterTabProps {
  vehicles: Vehicle[];
  searchTerm: string;
  onLogFuel?: (vehicleId: string, fuelPct: number) => void;
  onUpdateVehicle?: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle?: (id: string) => void;
}

export const FleetRegisterTab: React.FC<FleetRegisterTabProps> = ({ vehicles, searchTerm, onLogFuel, onUpdateVehicle, onDeleteVehicle }) => {
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const filtered = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driverAssigned.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((veh) => (
        <div key={veh.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">{veh.plateNumber}</span>
              <h3 className="text-base font-black text-slate-900 mt-2">{veh.makeModel}</h3>
              <p className="text-xs font-semibold text-slate-500">{veh.vehicleType}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
              veh.status === "Operational"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : veh.status === "In Service"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-rose-100 text-rose-800 border border-rose-300"
            }`}>{veh.status}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600"><span>Driver Officer:</span><span className="font-bold text-slate-900">{veh.driverAssigned}</span></div>
            <div className="flex justify-between text-slate-600"><span>Deployment Post:</span><span className="font-bold text-blue-700">{veh.deploymentBranch || "Central HQ"}</span></div>
            <div className="flex justify-between text-slate-600"><span>Odometer Reading:</span><span className="font-mono font-bold text-slate-900">{veh.mileageKm.toLocaleString()} KM</span></div>
            <div className="flex justify-between text-slate-600"><span>Fuel Level:</span><span className="font-bold text-emerald-700">{veh.fuelLevelPercentage}% Tank Capacity</span></div>
            <div className="flex justify-between text-slate-600"><span>Chassis Serial No:</span><span className="font-mono text-[11px] text-slate-500">{veh.chassisNumber || "N/A"}</span></div>
            <div className="flex justify-between text-slate-600"><span>Insurance Expiry:</span><span className="font-bold text-slate-700">{veh.insuranceExpiryDate || "2026-12-31"}</span></div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {onLogFuel && (
              <button onClick={() => onLogFuel(veh.id, Math.min(100, veh.fuelLevelPercentage + 30))}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                <Fuel className="w-3.5 h-3.5" /> Log Refill
              </button>
            )}
            <span className="text-[11px] font-bold text-slate-400">GPS: {veh.gpsTrackerId || "ACTIVE"}</span>
            <div className="flex items-center gap-1">
              {(onUpdateVehicle || onDeleteVehicle) && (
                <>
                  {onUpdateVehicle && (
                    <button
                      onClick={() => setEditVehicle(veh)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                      title="Edit Vehicle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteVehicle && (
                    <button
                      onClick={() => { if (window.confirm(`Delete vehicle ${veh.plateNumber}?`)) onDeleteVehicle?.(veh.id); }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Edit Vehicle Modal */}
      {editVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Edit Vehicle</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                onUpdateVehicle?.(editVehicle.id, {
                  plateNumber: fd.get("plateNumber") as string,
                  makeModel: fd.get("makeModel") as string,
                  driverAssigned: fd.get("driverAssigned") as string,
                  status: fd.get("status") as Vehicle["status"],
                });
                setEditVehicle(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Plate Number</label>
                <input name="plateNumber" type="text" required defaultValue={editVehicle.plateNumber} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Make & Model</label>
                <input name="makeModel" type="text" required defaultValue={editVehicle.makeModel} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Driver Assigned</label>
                <input name="driverAssigned" type="text" defaultValue={editVehicle.driverAssigned} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select name="status" defaultValue={editVehicle.status} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold">
                  <option value="Operational">Operational</option>
                  <option value="In Service">In Service</option>
                  <option value="Grounded">Grounded</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditVehicle(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
