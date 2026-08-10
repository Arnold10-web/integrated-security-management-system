import React from "react";
import { Search, FileSpreadsheet, CheckSquare, FileCheck } from "lucide-react";
import type { ArmouryLog } from "../../types";

interface ArmouryDispatchTableProps {
  logs: ArmouryLog[];
  logSearchTerm: string;
  onSearchChange: (v: string) => void;
  onOpenReturn: (log: ArmouryLog) => void;
  canCheckIn?: boolean;
}

export const ArmouryDispatchTable: React.FC<ArmouryDispatchTableProps> = ({
  logs,
  logSearchTerm,
  onSearchChange,
  onOpenReturn,
  canCheckIn = true,
}) => {
  const filteredLogs = logs.filter((log) => {
    const term = logSearchTerm.toLowerCase();
    return (
      log.guardName.toLowerCase().includes(term) ||
      log.firearmSerialNumber.toLowerCase().includes(term) ||
      log.locationName.toLowerCase().includes(term) ||
      log.serialNumberLog.toLowerCase().includes(term) ||
      log.armourerInCharge.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
      <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black tracking-tight">Armoury Dispatch & Return Logbook</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict audit log with all 15 required Armorer fields including Serial Number, Guard Name, Location, Firearm Serial, Ammunition Rounds, Signatures & Substitutes.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search register logs..."
            value={logSearchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-y border-slate-200">
              <th className="py-3 px-3">SL No</th>
              <th className="py-3 px-3">Name of Guard</th>
              <th className="py-3 px-3">Name of Location</th>
              <th className="py-3 px-3">Firearm Serial No</th>
              <th className="py-3 px-3">Rounds Out</th>
              <th className="py-3 px-3">Date Out</th>
              <th className="py-3 px-3">Time Out</th>
              <th className="py-3 px-3">Sign Out</th>
              <th className="py-3 px-3">Date In</th>
              <th className="py-3 px-3">Time In</th>
              <th className="py-3 px-3">Rounds In</th>
              <th className="py-3 px-3">Sign In</th>
              <th className="py-3 px-3">Substitute Receiver</th>
              <th className="py-3 px-3">Armoury Incharge</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                  {log.serialNumberLog}
                </td>
                <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                  {log.guardName}
                </td>
                <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate" title={log.locationName}>
                  {log.locationName}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                  {log.firearmSerialNumber}
                  <div className="text-[10px] font-sans font-normal text-slate-400">{log.assetName}</div>
                </td>
                <td className="py-3 px-3 font-black text-amber-700 whitespace-nowrap">
                  {log.ammoRoundsOut} rounds
                </td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {log.dateOut}
                </td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {log.timeOut}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  {log.signOutConfirmed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckSquare className="w-3 h-3 text-emerald-600" />
                      Signed
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Pending</span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {log.dateIn || <span className="text-amber-600 font-bold">On Field</span>}
                </td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {log.timeIn || <span className="text-amber-600 font-bold">Issued</span>}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  {log.ammoRoundsIn !== undefined ? (
                    <span className={`font-bold ${log.ammoRoundsIn === log.ammoRoundsOut ? "text-emerald-700" : "text-red-600"}`}>
                      {log.ammoRoundsIn} rounds
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-3 whitespace-nowrap">
                  {log.signInConfirmed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      <FileCheck className="w-3 h-3 text-blue-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Not Returned</span>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate" title={log.substituteReceiver || "Self"}>
                  {log.substituteReceiver || "Self"}
                </td>
                <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                  {log.armourerInCharge}
                </td>
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  {log.status === "Checked Out" ? (
                    canCheckIn ? (
                      <button
                        onClick={() => onOpenReturn(log)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-lg shadow-xs transition-all cursor-pointer"
                      >
                        Armourer Check In
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                        Awaiting Armourer Check In
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                      Archived / Cleared
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
