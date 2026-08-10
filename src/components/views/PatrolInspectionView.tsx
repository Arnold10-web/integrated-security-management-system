import React, { useState } from "react";
import {
  Radio,
  Plus,
  Search,
  ClipboardList,
  FileCheck,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { PatrolInspectionLog, Guard, ClientSite, UserRole } from "../../types";

interface PatrolInspectionViewProps {
  inspections: PatrolInspectionLog[];
  guards: Guard[];
  sites: ClientSite[];
  activeRole: UserRole;
  onAddInspection: (newInspection: Omit<PatrolInspectionLog, "id">) => void;
  onUpdateInspection?: (id: string, updates: Partial<PatrolInspectionLog>) => void;
  onDeleteInspection?: (id: string) => void;
}

export const PatrolInspectionView: React.FC<PatrolInspectionViewProps> = ({
  inspections,
  guards,
  sites,
  onAddInspection,
  onUpdateInspection,
  onDeleteInspection,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PatrolInspectionLog>>({});

  // Form State
  const [selectedSite, setSelectedSite] = useState(sites[0]?.siteName || "");
  const supervisorName = "Richard Okello";
  const [selectedGuard, setSelectedGuard] = useState(guards[0]?.fullName || "");
  const [inspectionTime, setInspectionTime] = useState("02:30 AM");
  const [radioCheckStatus, setRadioCheckStatus] = useState<PatrolInspectionLog["radioCheckStatus"]>("Responsive & Clear");
  const [uniformTurnout, setUniformTurnout] = useState<PatrolInspectionLog["uniformTurnout"]>("Compliant");
  const [weaponEquipmentCheck, setWeaponEquipmentCheck] = useState<PatrolInspectionLog["weaponEquipmentCheck"]>("Secured & Safe");
  const [overallRating, setOverallRating] = useState<PatrolInspectionLog["overallRating"]>("Satisfactory");
  const [remarks, setRemarks] = useState("");

  const filtered = inspections.filter(
    (ins) =>
      ins.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.guardOnDuty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.inspectionCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite || !selectedGuard) return;

    onAddInspection({
      inspectionCode: `CHK-2026-${Math.floor(100 + Math.random() * 900)}`,
      siteName: selectedSite,
      supervisorName,
      guardOnDuty: selectedGuard,
      inspectionTime,
      radioCheckStatus,
      uniformTurnout,
      weaponEquipmentCheck,
      overallRating,
      remarks: remarks || "Standard night patrol check-in completed.",
    });

    setShowAddModal(false);
    setRemarks("");
  };

  const startEdit = (ins: PatrolInspectionLog) => {
    setEditingId(ins.id);
    setEditForm({
      siteName: ins.siteName,
      supervisorName: ins.supervisorName,
      guardOnDuty: ins.guardOnDuty,
      inspectionTime: ins.inspectionTime,
      radioCheckStatus: ins.radioCheckStatus,
      uniformTurnout: ins.uniformTurnout,
      weaponEquipmentCheck: ins.weaponEquipmentCheck,
      overallRating: ins.overallRating,
      remarks: ins.remarks,
    });
  };

  const saveEdit = (id: string) => {
    onUpdateInspection?.(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const responsiveCount = inspections.filter((i) => i.radioCheckStatus === "Responsive & Clear").length;
  const compliantTurnoutCount = inspections.filter((i) => i.uniformTurnout === "Compliant").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Field Patrols & Radio Check Inspections</h2>
            <p className="text-xs text-slate-500">
              Supervisor post visits, hourly radio frequency checks, uniform turnout audits, and field weapon verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Patrol Inspection</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Field Inspections</span>
          <div className="text-2xl font-black text-slate-900">{inspections.length} Conducted</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Radio Clear Check Rate</span>
          <div className="text-2xl font-black text-emerald-600">
            {inspections.length > 0 ? Math.round((responsiveCount / inspections.length) * 100) : 100}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Uniform Turnout Compliance</span>
          <div className="text-2xl font-black text-blue-600">
            {inspections.length > 0 ? Math.round((compliantTurnoutCount / inspections.length) * 100) : 100}%
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search site, supervisor, guard code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          Showing {filtered.length} of {inspections.length} logs
        </span>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            Supervisor Field Patrol Audit Register
          </h3>
          <span className="text-xs text-slate-500 font-medium">Night Patrol Operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Code / Time</th>
                <th className="p-3.5">Client Site Post</th>
                <th className="p-3.5">Guard On Duty</th>
                <th className="p-3.5">Supervisor</th>
                <th className="p-3.5">Radio Status</th>
                <th className="p-3.5">Turnout & Gear</th>
                <th className="p-3.5">Rating & Remarks</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic text-xs">No patrol inspections recorded yet.</td>
                </tr>
              ) : (filtered.map((ins) => {
                const isEditing = editingId === ins.id;
                return (
                <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{ins.inspectionCode}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{ins.inspectionTime}</div>
                  </td>
                  <td className="p-3.5 font-bold text-blue-800">
                    {isEditing ? (
                      <input value={editForm.siteName || ""} onChange={(e) => setEditForm((f) => ({ ...f, siteName: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-slate-800 outline-none w-full" />
                    ) : (
                      ins.siteName
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    {isEditing ? (
                      <select value={editForm.guardOnDuty || ins.guardOnDuty} onChange={(e) => setEditForm((f) => ({ ...f, guardOnDuty: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-semibold text-xs text-slate-800 outline-none">
                        {guards.map((g) => <option key={g.id} value={g.fullName}>{g.fullName}</option>)}
                      </select>
                    ) : (
                      ins.guardOnDuty
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-slate-600">
                    {isEditing ? (
                      <input value={editForm.supervisorName || ""} onChange={(e) => setEditForm((f) => ({ ...f, supervisorName: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-medium text-xs text-slate-800 outline-none w-full" />
                    ) : (
                      ins.supervisorName
                    )}
                  </td>
                  <td className="p-3.5">
                    {isEditing ? (
                      <select value={editForm.radioCheckStatus || ins.radioCheckStatus} onChange={(e) => setEditForm((f) => ({ ...f, radioCheckStatus: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none">
                        <option value="Responsive & Clear">Responsive & Clear</option>
                        <option value="Delayed Response">Delayed Response</option>
                        <option value="Unresponsive">Unresponsive</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        ins.radioCheckStatus === "Responsive & Clear"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : ins.radioCheckStatus === "Delayed Response"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        <Radio className="w-3 h-3" />
                        {ins.radioCheckStatus}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {isEditing ? (
                      <div className="space-y-1">
                        <select value={editForm.uniformTurnout || ins.uniformTurnout} onChange={(e) => setEditForm((f) => ({ ...f, uniformTurnout: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none w-full">
                          <option value="Compliant">Compliant</option>
                          <option value="Minor Flaw">Minor Flaw</option>
                          <option value="Non-Compliant">Non-Compliant</option>
                        </select>
                        <select value={editForm.weaponEquipmentCheck || ins.weaponEquipmentCheck} onChange={(e) => setEditForm((f) => ({ ...f, weaponEquipmentCheck: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none w-full">
                          <option value="Secured & Safe">Secured & Safe</option>
                          <option value="Defect Noted">Defect Noted</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold block w-max">Uniform: {ins.uniformTurnout}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold block w-max">Weapon: {ins.weaponEquipmentCheck}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    {isEditing ? (
                      <div className="space-y-1">
                        <select value={editForm.overallRating || ins.overallRating} onChange={(e) => setEditForm((f) => ({ ...f, overallRating: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none w-full">
                          <option value="Satisfactory">Satisfactory</option>
                          <option value="Needs Corrective Action">Needs Corrective Action</option>
                        </select>
                        <input value={editForm.remarks ?? ins.remarks} onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-800 outline-none w-full" />
                      </div>
                    ) : (
                      <>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider block w-max mb-1 ${
                        ins.overallRating === "Satisfactory"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {ins.overallRating}
                      </span>
                      <p className="text-[11px] text-slate-500 italic max-w-xs">{ins.remarks}</p>
                      </>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => saveEdit(ins.id)} className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" title="Save"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        {onUpdateInspection && (
                          <button onClick={() => startEdit(ins)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        )}
                        {onDeleteInspection && (
                          <button onClick={() => { if (window.confirm(`Delete inspection ${ins.inspectionCode}?`)) onDeleteInspection(ins.id); }} className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );}))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                Record Supervisor Field Patrol Inspection
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspected Site Post</label>
                <select
                  required
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.siteName}>
                      {s.siteName} ({s.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guard On Duty</label>
                  <select
                    required
                    value={selectedGuard}
                    onChange={(e) => setSelectedGuard(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {guards.map((g) => (
                      <option key={g.id} value={g.fullName}>
                        {g.fullName} ({g.guardCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inspection Time</label>
                  <input
                    type="text"
                    required
                    value={inspectionTime}
                    onChange={(e) => setInspectionTime(e.target.value)}
                    placeholder="e.g. 02:45 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Radio Check Response</label>
                  <select
                    value={radioCheckStatus}
                    onChange={(e) => setRadioCheckStatus(e.target.value as PatrolInspectionLog["radioCheckStatus"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Responsive & Clear">Responsive & Clear</option>
                    <option value="Delayed Response">Delayed Response</option>
                    <option value="Unresponsive">Unresponsive</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uniform Turnout</label>
                  <select
                    value={uniformTurnout}
                    onChange={(e) => setUniformTurnout(e.target.value as PatrolInspectionLog["uniformTurnout"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Compliant">Compliant</option>
                    <option value="Minor Flaw">Minor Flaw</option>
                    <option value="Non-Compliant">Non-Compliant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weapon & Equipment Check</label>
                  <select
                    value={weaponEquipmentCheck}
                    onChange={(e) =>
                      setWeaponEquipmentCheck(e.target.value as PatrolInspectionLog["weaponEquipmentCheck"])
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Secured & Safe">Secured & Safe</option>
                    <option value="Defect Noted">Defect Noted</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overall Supervisor Rating</label>
                  <select
                    value={overallRating}
                    onChange={(e) => setOverallRating(e.target.value as PatrolInspectionLog["overallRating"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Satisfactory">Satisfactory</option>
                    <option value="Needs Corrective Action">Needs Corrective Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor Field Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Post observations, flashlight status, perimeter integrity..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Submit Patrol Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
