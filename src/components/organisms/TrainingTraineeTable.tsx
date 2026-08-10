import React, { useState } from "react";
import { CheckCircle2, Award, Pencil, Trash2, Save, X } from "lucide-react";
import type { RecruitTrainee } from "../../types";

interface TrainingTraineeTableProps {
  trainees: RecruitTrainee[];
  onPassOut: (trainee: RecruitTrainee) => void;
  onViewCert: (trainee: RecruitTrainee) => void;
  onDeleteTrainee?: (id: string) => void;
  onUpdateTrainee?: (id: string, updates: Partial<RecruitTrainee>) => void;
}

export const TrainingTraineeTable: React.FC<TrainingTraineeTableProps> = ({ trainees, onPassOut, onViewCert, onDeleteTrainee, onUpdateTrainee }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RecruitTrainee>>({});

  const startEdit = (t: RecruitTrainee) => {
    setEditingId(t.id);
    setEditForm({
      fullName: t.fullName,
      drillScore: t.drillScore,
      marksmanshipScore: t.marksmanshipScore,
      theoryScore: t.theoryScore,
    });
  };

  const saveEdit = (id: string) => {
    onUpdateTrainee?.(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (trainees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No trainees match the current filters.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
            <th className="p-3.5">Force Number</th>
            <th className="p-3.5">Recruit Full Name</th>
            <th className="p-3.5">National ID (NIN)</th>
            <th className="p-3.5">Cohort Intake</th>
            <th className="p-3.5 text-center">Drill & Parade</th>
            <th className="p-3.5 text-center">Marksmanship</th>
            <th className="p-3.5 text-center">Theory Score</th>
            <th className="p-3.5">Status & Force No</th>
            <th className="p-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
          {trainees.map((t) => {
            const totalAvg = Math.round((t.drillScore + t.marksmanshipScore + t.theoryScore) / 3);
            const isEditing = editingId === t.id;
            return (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3.5 font-mono font-bold text-slate-900">{t.traineeCode}</td>
                <td className="p-3.5 font-bold text-slate-900">
                  {isEditing ? (
                    <input value={editForm.fullName || ""} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} className="p-1 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-slate-900 outline-none w-full" />
                  ) : (
                    <>
                      {t.fullName}
                      <div className="text-[10px] text-slate-400 font-normal">Assigned Region: {t.assignedRegion}</div>
                    </>
                  )}
                </td>
                <td className="p-3.5 font-mono text-slate-600 text-[11px]">{t.nationalIdNumber}</td>
                <td className="p-3.5 text-slate-700 font-medium max-w-xs truncate" title={t.cohortName}>
                  {t.cohortName}
                </td>
                <td className="p-3.5 text-center">
                  {isEditing ? (
                    <input type="number" min={0} max={100} value={editForm.drillScore ?? t.drillScore} onChange={(e) => setEditForm((f) => ({ ...f, drillScore: Number(e.target.value) }))} className="p-1 w-16 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-center text-slate-800 outline-none" />
                  ) : (
                    <span className="font-bold text-slate-800">{t.drillScore}%</span>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  {isEditing ? (
                    <input type="number" min={0} max={100} value={editForm.marksmanshipScore ?? t.marksmanshipScore} onChange={(e) => setEditForm((f) => ({ ...f, marksmanshipScore: Number(e.target.value) }))} className="p-1 w-16 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-center text-slate-800 outline-none" />
                  ) : (
                    <span className={`font-bold ${t.marksmanshipScore >= 85 ? "text-emerald-700" : "text-amber-700"}`}>{t.marksmanshipScore}%</span>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  {isEditing ? (
                    <input type="number" min={0} max={100} value={editForm.theoryScore ?? t.theoryScore} onChange={(e) => setEditForm((f) => ({ ...f, theoryScore: Number(e.target.value) }))} className="p-1 w-16 bg-slate-50 border border-slate-200 rounded font-bold text-xs text-center text-slate-800 outline-none" />
                  ) : (
                    <span className="font-bold text-slate-800">{t.theoryScore}%</span>
                  )}
                </td>
                <td className="p-3.5">
                  {t.overallStatus === "Graduated & Certified" ? (
                    <div className="space-y-0.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        GRADUATED
                      </span>
                      <div className="font-mono text-[10px] font-bold text-slate-900">
                        Force No: {t.assignedForceNumber}
                      </div>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 w-fit block">
                      UNDER TRAINING ({totalAvg}%)
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(t.id)} className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer" title="Save"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={cancelEdit} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        {onUpdateTrainee && (
                          <button onClick={() => startEdit(t)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        )}
                        {onDeleteTrainee && t.overallStatus !== "Graduated & Certified" && (
                          <button onClick={() => { if (window.confirm(`Delete trainee "${t.fullName}"?`)) onDeleteTrainee(t.id); }} className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                        {t.overallStatus === "Under Training" ? (
                          <button onClick={() => onPassOut(t)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1 ml-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Pass Out & Certify</span>
                          </button>
                        ) : (
                          <button onClick={() => onViewCert(t)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg border border-slate-300 transition-all cursor-pointer">
                            View Cert
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
