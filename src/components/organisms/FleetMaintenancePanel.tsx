import React from "react";
import {
  Wrench,
  Clock,
  Fuel,
  ShieldCheck,
  Plus,
  AlertTriangle,
  Settings,
  ClipboardList,
} from "lucide-react";
import type { Vehicle, MaintenanceServiceLog } from "../../types";

interface FleetMaintenancePanelProps {
  vehicles: Vehicle[];
  maintenanceLogs: MaintenanceServiceLog[];
  searchTerm: string;
  canManage?: boolean;
  onScheduleInterval: (vehicleId: string) => void;
  onLogOilChange: (vehicleId: string, currentKm: number) => void;
  onRecordTyreCheck: (vehicleId: string, treadDepth: number) => void;
  onNewWorkOrder: (vehicleId?: string) => void;
  onAdjustSchedule: (vehicleId: string, intervalKm: number, targetKm: number) => void;
}

export const FleetMaintenancePanel: React.FC<FleetMaintenancePanelProps> = ({
  vehicles,
  maintenanceLogs,
  searchTerm,
  canManage = true,
  onScheduleInterval,
  onLogOilChange,
  onRecordTyreCheck,
  onNewWorkOrder,
  onAdjustSchedule,
}) => {
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.makeModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Preventive Maintenance & Service Interval Control
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Schedule mileage-based service intervals, track oil change health, and monitor tyre tread wear across all security vehicles.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canManage && (
            <>
          <button
            onClick={() => onScheduleInterval(vehicles[0]?.id || "veh-1")}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Schedule Mileage Interval</span>
          </button>

          <button
            onClick={() => onLogOilChange(vehicles[0]?.id || "veh-1", 0)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            <span>Log Oil Change</span>
          </button>

          <button
            onClick={() => onRecordTyreCheck(vehicles[0]?.id || "veh-1", 0)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Record Tyre Check</span>
          </button>

          <button
            onClick={() => onNewWorkOrder()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Scheduled Mileage Intervals</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {vehicles.filter((v) => v.nextServiceDueKm - v.mileageKm <= 1000).length} Vehicles Due Soon
            </div>
            <span className="text-[10px] text-amber-600 font-bold">Within 1,000 KM threshold</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Oil Service Status</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {vehicles.filter((v) => v.oilStatus === "Overdue" || v.oilStatus === "Due Soon").length} Units Action Needed
            </div>
            <span className="text-[10px] text-rose-600 font-bold">
              {vehicles.filter((v) => v.oilStatus === "Overdue").length} Overdue Oil Changes
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Tyre Health Index</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {(vehicles.reduce((acc, curr) => acc + (curr.tyreTreadDepthMm || 6.0), 0) / vehicles.length).toFixed(1)} mm Avg Tread
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">
              {vehicles.filter((v) => v.tyreStatus === "Replace Required").length} Need Replacement
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Active Work Orders</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">
              {maintenanceLogs.filter((m) => m.status !== "Completed").length} Active Orders
            </div>
            <span className="text-[10px] text-blue-600 font-bold">Speke Motors Workshop</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVehicles.map((veh) => {
          const serviceInterval = veh.serviceIntervalKm || 5000;
          const mileageRem = veh.nextServiceDueKm - veh.mileageKm;
          const isOverdue = mileageRem < 0;
          const isDueSoon = mileageRem >= 0 && mileageRem <= 1000;
          const kmUsed = veh.mileageKm % serviceInterval;
          const pctUsed = Math.min(100, Math.max(0, Math.round((kmUsed / serviceInterval) * 100)));

          return (
            <div key={veh.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 font-mono text-xs font-extrabold">
                    {veh.plateNumber}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{veh.makeModel}</h4>
                    <p className="text-xs text-slate-500 font-medium">Assigned Driver: {veh.driverAssigned}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-black text-slate-900 block">{veh.mileageKm.toLocaleString()} KM</span>
                  <span className="text-[10px] text-slate-400 font-bold">Current Odometer</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Mileage Service Interval
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      isOverdue
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : isDueSoon
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {isOverdue ? `Overdue by ${Math.abs(mileageRem).toLocaleString()} KM` : isDueSoon ? `Due Soon (${mileageRem.toLocaleString()} KM left)` : `On Schedule (${mileageRem.toLocaleString()} KM left)`}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Target Service: {veh.nextServiceDueKm.toLocaleString()} KM</span>
                    <span>Interval: Every {serviceInterval.toLocaleString()} KM</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isOverdue ? "bg-rose-500" : isDueSoon ? "bg-amber-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${isOverdue ? 100 : pctUsed}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>Last Serviced: {veh.lastServiceDate || "2026-06-01"}</span>
                    <span>Interval Used: {pctUsed}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-amber-600" />
                      Engine Oil Status
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        veh.oilStatus === "Good"
                          ? "bg-emerald-100 text-emerald-800"
                          : veh.oilStatus === "Due Soon"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {veh.oilStatus || "Good"}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Last Changed:</span>
                      <span className="font-mono font-bold text-slate-900">{(veh.lastOilChangeKm || veh.mileageKm - 3200).toLocaleString()} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Date:</span>
                      <span className="font-medium text-slate-800">{veh.lastOilChangeDate || "2026-06-15"}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => onLogOilChange(veh.id, veh.mileageKm)}
                      className="w-full py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Log Oil Change
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Tyre Tread Health
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        veh.tyreStatus === "Pass"
                          ? "bg-emerald-100 text-emerald-800"
                          : veh.tyreStatus === "Inspect Soon"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {veh.tyreStatus || "Pass"}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Tread Depth:</span>
                      <span className="font-mono font-bold text-emerald-800">{veh.tyreTreadDepthMm || 6.5} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Check:</span>
                      <span className="font-medium text-slate-800">{veh.lastTyreCheckDate || "2026-07-10"}</span>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => onRecordTyreCheck(veh.id, veh.tyreTreadDepthMm || 6.5)}
                      className="w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ClipboardList className="w-3 h-3" /> Record Tyre Check
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {canManage && (
                  <>
                <button
                  onClick={() => onAdjustSchedule(veh.id, veh.serviceIntervalKm || 5000, veh.nextServiceDueKm)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-600" />
                  Adjust Service Schedule
                </button>

                <button
                  onClick={() => onNewWorkOrder(veh.id)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Issue Work Order
                </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Preventive Maintenance & Workshop Work Orders
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{maintenanceLogs.length} Total Service Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Work Order Code</th>
                <th className="p-3.5">Vehicle</th>
                <th className="p-3.5">Service Type</th>
                <th className="p-3.5">Work Scope Description</th>
                <th className="p-3.5">Workshop Partner</th>
                <th className="p-3.5">Cost UGX</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {maintenanceLogs.map((maint) => (
                <tr key={maint.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{maint.serviceCode}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{maint.serviceDate}</div>
                  </td>
                  <td className="p-3.5 font-mono text-blue-700 font-bold">{maint.plateNumber}</td>
                  <td className="p-3.5 font-bold text-slate-900">{maint.serviceType}</td>
                  <td className="p-3.5 text-slate-600 max-w-xs">{maint.description}</td>
                  <td className="p-3.5 text-slate-800 font-semibold">{maint.workshopName}</td>
                  <td className="p-3.5 font-extrabold text-slate-900">UGX {maint.costUgx.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        maint.status === "Completed"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : maint.status === "In Progress"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}
                    >
                      {maint.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
