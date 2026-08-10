import React from "react";
import { Bike, Car, CheckCircle2 } from "lucide-react";
import { DriverRecord } from "../../types";

interface FleetDriversTabProps {
  drivers: DriverRecord[];
  activeRole: string;
  onApproveDriver: (id: string) => void;
}

function licenceDaysLeft(expiry: string): number {
  const today = new Date();
  const d = new Date(expiry);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24));
}

export const FleetDriversTab: React.FC<FleetDriversTabProps> = ({ drivers, activeRole, onApproveDriver }) => {
  const isFleetManager = activeRole === "Fleet Manager";
  const sorted = [...drivers].sort((a, b) => (a.status === "Pending FM Approval" ? -1 : 1) - (b.status === "Pending FM Approval" ? -1 : 1));
  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No drivers or riders registered yet.</div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {sorted.map((drv) => {
        const isRider = drv.roleType === "Rider";
        const pending = drv.status === "Pending FM Approval";
        const expLeft = licenceDaysLeft(drv.licenceExpiryDate);
        const expCritical = expLeft < 0;
        const expWarn = expLeft <= 60;
        return (
          <div key={drv.id} className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${pending ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm">
                  {drv.fullName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{drv.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {drv.forceNumber ? (
                      <span className="font-mono text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">Force No. {drv.forceNumber}</span>
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">{drv.driverCode}</span>
                    )}
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${isRider ? "bg-orange-100 text-orange-700 border border-orange-300" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                      {isRider ? <Bike className="w-3 h-3" /> : <Car className="w-3 h-3" />}
                      {isRider ? "Rider" : "Driver"}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${pending ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{drv.status}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600"><span>Licence Class:</span><span className="font-bold text-slate-900">{drv.licenceClass}</span></div>
              <div className="flex justify-between text-slate-600"><span>Licence Number:</span><span className="font-mono text-slate-800 font-bold">{drv.licenceNumber}</span></div>
              <div className="flex justify-between text-slate-600">
                <span>Licence Expiry:</span>
                <span className={`font-bold ${expCritical ? "text-rose-600" : expWarn ? "text-amber-600" : "text-slate-800"}`}>
                  {drv.licenceExpiryDate} {expCritical ? "(EXPIRED)" : expWarn ? `(${expLeft}d)` : ""}
                </span>
              </div>
              <div className="flex justify-between text-slate-600"><span>{isRider ? "Assigned Motorcycle:" : "Assigned Vehicle:"}</span><span className="font-mono font-bold text-blue-700">{drv.assignedVehiclePlate}</span></div>
              {drv.contactPhone && <div className="flex justify-between text-slate-600"><span>Contact:</span><span className="font-bold text-slate-800">{drv.contactPhone}</span></div>}
              <div className="flex justify-between text-slate-600"><span>Safety Rating Score:</span><span className="font-black text-emerald-600">{drv.safetyScorePct}% Outstanding</span></div>
            </div>
            {pending && isFleetManager && (
              <button
                onClick={() => onApproveDriver(drv.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve {isRider ? "Rider" : "Driver"} Onboarding
              </button>
            )}
            {pending && !isFleetManager && (
              <p className="text-center text-[10px] font-bold text-amber-600">Awaiting Fleet Manager approval</p>
            )}
            {!pending && (
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Training Badges</span>
                <div className="flex flex-wrap gap-1">
                  {drv.trainingBadges.map((badge, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">{badge}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
