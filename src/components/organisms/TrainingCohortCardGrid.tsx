import React, { useState } from "react";
import { MapPin, ChevronRight, Pencil, Trash2, Save, X } from "lucide-react";
import type { TrainingCohort } from "../../types";

interface TrainingCohortCardGridProps {
  cohorts: TrainingCohort[];
  onViewGuards: (cohortId: string) => void;
  onDeleteCohort?: (id: string) => void;
  onUpdateCohort?: (id: string, updates: Partial<TrainingCohort>) => void;
}

export const TrainingCohortCardGrid: React.FC<TrainingCohortCardGridProps> = ({ cohorts, onViewGuards, onDeleteCohort, onUpdateCohort }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TrainingCohort>>({});

  const startEdit = (cohort: TrainingCohort) => {
    setEditingId(cohort.id);
    setEditForm({
      name: cohort.name,
      location: cohort.location,
      leadInstructor: cohort.leadInstructor,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      status: cohort.status,
    });
  };

  const saveEdit = (id: string) => {
    onUpdateCohort?.(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (cohorts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No intake cohorts created yet. Create your first cohort above.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cohorts.map((cohort) => (
        <div
          key={cohort.id}
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-400 transition-all"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[11px] font-black border border-emerald-200">
                {cohort.code}
              </span>
              <div className="flex items-center gap-1">
                {editingId === cohort.id ? (
                  <>
                    <button onClick={() => saveEdit(cohort.id)} className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" title="Save"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={cancelEdit} className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    {onUpdateCohort && (
                      <button onClick={() => startEdit(cohort)} className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                    )}
                    {onDeleteCohort && (
                      <button onClick={() => { if (window.confirm(`Delete cohort "${cohort.name}"?`)) onDeleteCohort(cohort.id); }} className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              {editingId === cohort.id ? (
                <input value={editForm.name || ""} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black text-sm text-slate-900 outline-none" />
              ) : (
                <h3 className="text-base font-black text-slate-900 leading-snug">{cohort.name}</h3>
              )}
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {editingId === cohort.id ? (
                  <input value={editForm.location || ""} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-semibold text-xs text-slate-800 outline-none flex-1" />
                ) : (
                  <span>{cohort.location}</span>
                )}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Lead Instructor:</span>
                {editingId === cohort.id ? (
                  <input value={editForm.leadInstructor || ""} onChange={(e) => setEditForm((f) => ({ ...f, leadInstructor: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-slate-800 outline-none text-right" />
                ) : (
                  <span className="font-bold text-slate-800">{cohort.leadInstructor}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Training Duration:</span>
                {editingId === cohort.id ? (
                  <div className="flex gap-1 items-center">
                    <input value={editForm.startDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} className="p-1 w-20 bg-slate-50 border border-slate-200 rounded font-mono font-semibold text-xs text-slate-800 outline-none" />
                    <span>to</span>
                    <input value={editForm.endDate || ""} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} className="p-1 w-20 bg-slate-50 border border-slate-200 rounded font-mono font-semibold text-xs text-slate-800 outline-none" />
                  </div>
                ) : (
                  <span className="font-mono font-semibold text-slate-800">{cohort.startDate} to {cohort.endDate}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Enrolled Recruits:</span>
                <span className="font-bold text-slate-900">{cohort.totalRecruits} Guards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Graduated & Passed Out:</span>
                <span className="font-bold text-emerald-600">{cohort.passedOutCount} Guards</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Curriculum Modules
              </span>
              <div className="flex flex-wrap gap-1">
                {cohort.curriculumModules.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Kyankwanzi Training Ledger</span>
            <button
              onClick={() => onViewGuards(cohort.id)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>View Guards</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
