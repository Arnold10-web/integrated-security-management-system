import React from "react";
import { ClipboardList } from "lucide-react";
import { DailyVehicleInspection } from "../../types";

interface FleetInspectionsTabProps {
  dailyInspections: DailyVehicleInspection[];
}

export const FleetInspectionsTab: React.FC<FleetInspectionsTabProps> = ({ dailyInspections }) => {
  if (dailyInspections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No daily vehicle inspections recorded yet.</div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          Daily Pre-Shift Vehicle & Safety Checklist Audit
        </h3>
        <span className="text-xs text-slate-500 font-semibold">Brakes, Tyres, Lights, Oil & Fluids</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Inspection Code</th>
              <th className="p-3.5">Vehicle</th>
              <th className="p-3.5">Inspector Officer</th>
              <th className="p-3.5">Brakes & Tyres</th>
              <th className="p-3.5">Lights & Sirens</th>
              <th className="p-3.5">Oil & Fluids</th>
              <th className="p-3.5">Overall Condition</th>
              <th className="p-3.5">Defects Noted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {dailyInspections.map((insp) => (
              <tr key={insp.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{insp.inspectionCode}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{insp.inspectionDate} {insp.inspectionTime}</div>
                </td>
                <td className="p-3.5 font-mono text-blue-700 font-bold">{insp.plateNumber}</td>
                <td className="p-3.5 font-bold text-slate-900">{insp.inspectorDriver}</td>
                <td className="p-3.5">
                  <div>Brakes: <span className="font-bold text-slate-900">{insp.brakesCheck}</span></div>
                  <div>Tyres: <span className="font-bold text-slate-900">{insp.tyresCheck}</span></div>
                </td>
                <td className="p-3.5 font-bold text-slate-800">{insp.lightsSirensCheck}</td>
                <td className="p-3.5 font-bold text-slate-800">{insp.oilLevelCheck}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    insp.overallCondition.includes("Safe") ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>{insp.overallCondition}</span>
                </td>
                <td className="p-3.5 text-slate-500 italic max-w-xs">{insp.defectsNoted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
