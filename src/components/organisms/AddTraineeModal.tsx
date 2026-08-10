import React, { useState } from "react";
import { Users } from "lucide-react";
import type { RecruitTrainee, TrainingCohort } from "../../types";

interface AddTraineeModalProps {
  show: boolean;
  cohorts: TrainingCohort[];
  onClose: () => void;
  onSubmit: (trainee: Omit<RecruitTrainee, "id">) => void;
}

export const AddTraineeModal: React.FC<AddTraineeModalProps> = ({ show, cohorts, onClose, onSubmit }) => {
  const [traineeName, setTraineeName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [traineeAge, setTraineeAge] = useState(24);
  const [assignedCohortId, setAssignedCohortId] = useState(cohorts[0]?.id || "");
  const [assignedRegion, setAssignedRegion] = useState("Kampala Central");
  const [drillScore, setDrillScore] = useState(85);
  const [marksmanshipScore, setMarksmanshipScore] = useState(88);
  const [theoryScore, setTheoryScore] = useState(82);

  const resetFields = () => {
    setTraineeName("");
    setNationalId("");
    setTraineeAge(24);
    setAssignedCohortId(cohorts[0]?.id || "");
    setAssignedRegion("Kampala Central");
    setDrillScore(85);
    setMarksmanshipScore(88);
    setTheoryScore(82);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traineeName || !nationalId) return;
    const cohortObj = cohorts.find((c) => c.id === assignedCohortId);
    const generatedCode = `TRN-2026-${Math.floor(100 + Math.random() * 900)}`;
    onSubmit({
      traineeCode: generatedCode,
      fullName: traineeName,
      nationalIdNumber: nationalId.toUpperCase(),
      age: Number(traineeAge),
      cohortId: assignedCohortId,
      cohortName: cohortObj ? cohortObj.name : "Kyankwanzi Training Intake",
      assignedRegion,
      drillScore: Number(drillScore),
      marksmanshipScore: Number(marksmanshipScore),
      theoryScore: Number(theoryScore),
      overallStatus: "Under Training",
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Enroll New Recruit Guard Trainee
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Recruit Full Name</label>
            <input type="text" required placeholder="e.g. John Baptist Okello"
              value={traineeName} onChange={(e) => setTraineeName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">National ID Number (NIN)</label>
              <input type="text" required placeholder="CM00123456789X"
                value={nationalId} onChange={(e) => setNationalId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Age</label>
              <input type="number" min={18} max={45}
                value={traineeAge} onChange={(e) => setTraineeAge(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Intake Cohort</label>
            <select value={assignedCohortId} onChange={(e) => setAssignedCohortId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Deployment Region</label>
            <select value={assignedRegion} onChange={(e) => setAssignedRegion(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
              <option value="Kampala Central">Kampala Central</option>
              <option value="Entebbe & Wakiso">Entebbe & Wakiso</option>
              <option value="Jinja & Eastern">Jinja & Eastern</option>
              <option value="Mbarara & Western">Mbarara & Western</option>
              <option value="Gulu & Northern">Gulu & Northern</option>
              <option value="Mbale & Elgon">Mbale & Elgon</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-extrabold text-[10px] text-slate-600 mb-1">Drill Score (%)</label>
              <input type="number" min={0} max={100}
                value={drillScore} onChange={(e) => setDrillScore(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-center" />
            </div>
            <div>
              <label className="block font-extrabold text-[10px] text-slate-600 mb-1">Range Marksmanship</label>
              <input type="number" min={0} max={100}
                value={marksmanshipScore} onChange={(e) => setMarksmanshipScore(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-center" />
            </div>
            <div>
              <label className="block font-extrabold text-[10px] text-slate-600 mb-1">Theory Exam (%)</label>
              <input type="number" min={0} max={100}
                value={theoryScore} onChange={(e) => setTheoryScore(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-center" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => { resetFields(); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer">
              Enroll Guard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
