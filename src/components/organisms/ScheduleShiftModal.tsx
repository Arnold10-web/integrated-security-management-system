import React, { useState } from "react";
import type { Guard, ClientSite, DutyRoster } from "../../types";

interface ScheduleShiftModalProps {
  show: boolean;
  guards: Guard[];
  sites: ClientSite[];
  onClose: () => void;
  onSubmit: (entry: Omit<DutyRoster, "id">) => void;
}

export const ScheduleShiftModal: React.FC<ScheduleShiftModalProps> = ({ show, guards, sites, onClose, onSubmit }) => {
  const [selectedGuardId, setSelectedGuardId] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [shiftType, setShiftType] = useState<DutyRoster["shiftType"]>("Day Shift (06:00-18:00)");

  const inferRegion = (loc: string): string => {
    const l = loc.toLowerCase();
    if (l.includes("jinja")) return "Jinja";
    if (l.includes("mbarara")) return "Mbarara";
    if (l.includes("gulu")) return "Gulu";
    if (l.includes("arua")) return "Arua";
    if (l.includes("masaka")) return "Masaka";
    return "Kampala Central";
  };

  const resetFields = () => {
    setSelectedGuardId("");
    setSelectedSiteId("");
    setShiftType("Day Shift (06:00-18:00)");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guard = guards.find((g) => g.id === selectedGuardId);
    const site = sites.find((s) => s.id === selectedSiteId);
    if (!guard || !site) return;

    onSubmit({
      guardId: guard.id,
      guardName: guard.fullName,
      siteId: site.id,
      siteName: site.siteName,
      region: inferRegion(guard.location ?? ""),
      shiftDate: new Date().toISOString().split("T")[0],
      shiftType,
      status: "Scheduled",
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Schedule Guard Duty Shift</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Guard Officer</label>
            <select
              required
              value={selectedGuardId}
              onChange={(e) => setSelectedGuardId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
            >
              <option value="">-- Choose Guard --</option>
              {guards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.fullName} ({g.forceNumber}) - {g.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Assign Client Site Post</label>
            <select
              required
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
            >
              <option value="">-- Choose Site --</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteName} ({s.clientName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Shift Type</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value as DutyRoster["shiftType"])}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
            >
              <option value="Day Shift (06:00-18:00)">Day Shift (06:00-18:00)</option>
              <option value="Night Shift (18:00-06:00)">Night Shift (18:00-06:00)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { resetFields(); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Assign Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
