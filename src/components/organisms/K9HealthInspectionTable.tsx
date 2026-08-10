import React, { useState } from "react";
import { Pencil, Trash2, Save, X } from "lucide-react";
import type { K9HealthInspection, K9Dog } from "../../types";

interface K9HealthInspectionTableProps {
  inspections: K9HealthInspection[];
  dogs: K9Dog[];
  onUpdateInspection?: (id: string, updates: Partial<K9HealthInspection>) => void;
  onDeleteInspection?: (id: string) => void;
}

export const K9HealthInspectionTable: React.FC<K9HealthInspectionTableProps> = ({ inspections, onUpdateInspection, onDeleteInspection }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<K9HealthInspection>>({});

  const startEdit = (ins: K9HealthInspection) => {
    setEditingId(ins.id);
    setEditForm({
      weightKg: ins.weightKg,
      physicalCondition: ins.physicalCondition,
      vaccinationStatus: ins.vaccinationStatus,
      notes: ins.notes,
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

  if (inspections.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">
          No health inspection records available.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <th className="py-2.5 px-3">Code & Date</th>
            <th className="py-2.5 px-3">K9 Name</th>
            <th className="py-2.5 px-3">Handler / Handler</th>
            <th className="py-2.5 px-3">Weight (kg)</th>
            <th className="py-2.5 px-3">Vaccination Status</th>
            <th className="py-2.5 px-3">Physical Condition</th>
            <th className="py-2.5 px-3">Coat & Appetite</th>
            <th className="py-2.5 px-3">Inspecting Officer</th>
            <th className="py-2.5 px-3">Clinical Notes</th>
            <th className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {inspections.map((h) => {
            const isEditing = editingId === h.id;
            return (
            <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3 px-3">
                <span className="font-mono font-bold text-blue-700 block text-[11px]">{h.inspectionCode}</span>
                <span className="text-[10px] text-slate-400">{h.inspectionDate}</span>
              </td>
              <td className="py-3 px-3 font-bold text-slate-900">{h.k9Name}</td>
              <td className="py-3 px-3 text-slate-600 font-medium">{h.handlerName}</td>
              <td className="py-3 px-3 font-extrabold text-slate-800">
                {isEditing ? (
                  <input type="number" value={editForm.weightKg ?? h.weightKg} onChange={(e) => setEditForm((f) => ({ ...f, weightKg: Number(e.target.value) }))} className="p-1 w-20 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-slate-800 outline-none" />
                ) : (
                  <>{h.weightKg} kg
                  {h.temperatureCelsius && (
                    <span className="block text-[10px] font-normal text-slate-400">
                      {h.temperatureCelsius}°C
                    </span>
                  )}</>
                )}
              </td>
              <td className="py-3 px-3">
                {isEditing ? (
                  <select value={editForm.vaccinationStatus || h.vaccinationStatus} onChange={(e) => setEditForm((f) => ({ ...f, vaccinationStatus: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none">
                    <option value="Up to Date - Fully Vaccinated">Up to Date - Fully Vaccinated</option>
                    <option value="Rabies Booster Due">Rabies Booster Due</option>
                    <option value="Deworming Required">Deworming Required</option>
                    <option value="Pending Vet Booster">Pending Vet Booster</option>
                  </select>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    h.vaccinationStatus === "Up to Date - Fully Vaccinated"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {h.vaccinationStatus}
                  </span>
                )}
              </td>
              <td className="py-3 px-3">
                {isEditing ? (
                  <select value={editForm.physicalCondition || h.physicalCondition} onChange={(e) => setEditForm((f) => ({ ...f, physicalCondition: e.target.value as any }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-[10px] text-slate-800 outline-none">
                    <option value="Optimal / Fit for Duty">Optimal / Fit for Duty</option>
                    <option value="Minor Fatigue / Rest Prescribed">Minor Fatigue / Rest Prescribed</option>
                    <option value="Under Veterinary Treatment">Under Veterinary Treatment</option>
                    <option value="Unfit for Duty">Unfit for Duty</option>
                  </select>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                    h.physicalCondition === "Optimal / Fit for Duty"
                      ? "bg-blue-100 text-blue-800"
                      : h.physicalCondition === "Minor Fatigue / Rest Prescribed"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {h.physicalCondition}
                  </span>
                )}
              </td>
              <td className="py-3 px-3 text-[11px]">
                <span className="text-slate-700 font-medium block">{h.coatAndSkinCheck}</span>
                <span className="text-slate-400 text-[10px]">{h.appetiteAndHydration}</span>
              </td>
              <td className="py-3 px-3 font-semibold text-slate-800">{h.inspectingOfficer}</td>
              <td className="py-3 px-3 text-slate-500 italic max-w-xs">
                {isEditing ? (
                  <input value={editForm.notes ?? h.notes ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none w-full" />
                ) : (
                  <>{h.notes || "No extra notes"}</>
                )}
              </td>
              <td className="py-3 px-3 text-right">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => saveEdit(h.id)} className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" title="Save"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {onUpdateInspection && (
                      <button onClick={() => startEdit(h)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {onDeleteInspection && (
                      <button onClick={() => { if (window.confirm(`Delete inspection ${h.inspectionCode}?`)) onDeleteInspection(h.id); }} className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
};
