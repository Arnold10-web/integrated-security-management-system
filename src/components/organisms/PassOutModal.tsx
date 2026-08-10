import React, { useState } from "react";
import { Award } from "lucide-react";
import type { RecruitTrainee } from "../../types";
import { nextForceNumber } from "../../utils/forceNumber";

interface PassOutModalProps {
  show: boolean;
  trainee: RecruitTrainee | null;
  onClose: () => void;
  onSubmit: (traineeId: string, forceNumber: string) => void;
  existingForceNumbers?: string[];
}

export const PassOutModal: React.FC<PassOutModalProps> = ({ show, trainee, onClose, onSubmit, existingForceNumbers = [] }) => {
  const [customForceNumber, setCustomForceNumber] = useState("");

  React.useEffect(() => {
    if (show && trainee) {
      setCustomForceNumber(nextForceNumber(existingForceNumbers));
    }
  }, [show, trainee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee || !customForceNumber) return;
    onSubmit(trainee.id, customForceNumber);
    setCustomForceNumber("");
    onClose();
  };

  if (!show || !trainee) return null;

  const totalAvg = Math.round((trainee.drillScore + trainee.marksmanshipScore + trainee.theoryScore) / 3);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Pass-Out & Force Number Allocation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
          <div className="font-bold text-emerald-900">{trainee.fullName}</div>
          <div className="text-emerald-700">NIN: {trainee.nationalIdNumber}</div>
          <div className="text-emerald-700 font-medium">Overall Score: {totalAvg}%</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Security Guard Force Number</label>
            <input
              type="text" required value={customForceNumber} onChange={(e) => setCustomForceNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500">
            Graduating this guard will issue an official Pass-Out Certificate, generate an active Force Number, and transfer the guard to the active HR Personnel Roster.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md cursor-pointer flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>Issue Pass-Out Certificate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
