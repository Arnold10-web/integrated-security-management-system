import React, { useState } from "react";
import { MapPin } from "lucide-react";
import type { DutyRoster, Guard, ClientSite } from "../../types";

interface DutyRosterTableProps {
  roster: DutyRoster[];
  onUpdateStatus: (rosterId: string, status: DutyRoster["status"]) => void;
  guards?: Guard[];
  sites?: ClientSite[];
  onUpdateGuard?: (guardId: string, updates: Partial<Guard>) => void;
}

export const DutyRosterTable: React.FC<DutyRosterTableProps> = ({ roster, onUpdateStatus, guards = [], sites = [], onUpdateGuard }) => {
  const [reassignRoster, setReassignRoster] = useState<DutyRoster | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState("");

  if (roster.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No shifts scheduled for today.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Master Guard Duty Shift Roster</h3>
        <span className="text-xs text-slate-500 font-medium">Operations Shift Management</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Guard Personnel</th>
              <th className="p-3.5">Assigned Site Post</th>
              <th className="p-3.5">Shift Window</th>
              <th className="p-3.5">Attendance Status</th>
              <th className="p-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {roster.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-slate-900">{r.guardName}</td>
                <td className="p-3.5 text-blue-700 font-semibold">{r.siteName}</td>
                <td className="p-3.5">{r.shiftType}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      r.status === "Present"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : r.status === "Scheduled"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    {r.status === "Scheduled" && (
                      <button
                        onClick={() => {
                          onUpdateStatus(r.id, "Present");
                          const guard = guards.find((g) => g.id === r.guardId || g.fullName === r.guardName);
                          if (guard && onUpdateGuard) {
                            onUpdateGuard(guard.id, { lifecycleStage: "DEPLOYED", assignedSite: r.siteName });
                          }
                        }}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer shadow-xs"
                      >
                        Check-In
                      </button>
                    )}
                    {onUpdateGuard && (
                      <button
                        onClick={() => { setReassignRoster(r); setSelectedSiteId(""); }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Change Site
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reassignRoster && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReassignRoster(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-900 mb-4">Reassign Site for {reassignRoster.guardName}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Site</label>
                <p className="p-2.5 bg-slate-100 rounded-xl font-semibold text-slate-800">{reassignRoster.siteName}</p>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Site</label>
                <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                  <option value="">Select a site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.siteName} ({s.clientName})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button onClick={() => setReassignRoster(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button onClick={() => {
                  const site = sites.find((s) => s.id === selectedSiteId);
                  if (site && reassignRoster) {
                    const guard = guards.find((g) => g.id === reassignRoster.guardId || g.fullName === reassignRoster.guardName);
                    if (guard) onUpdateGuard?.(guard.id, { assignedSite: site.siteName });
                  }
                  setReassignRoster(null);
                }} disabled={!selectedSiteId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 disabled:opacity-50">Confirm Reassignment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
