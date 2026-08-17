import React from "react";
import { FileText, Printer } from "lucide-react";
import type { Guard } from "../../types";
import { toast } from "../../stores/toastStore";

interface GuardWarningModalProps {
  guard: Guard | null;
  onClose: () => void;
}

export const GuardWarningModal: React.FC<GuardWarningModalProps> = ({ guard, onClose }) => {
  if (!guard) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            Disciplinary Warning Letter Generated
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2 text-slate-800">
          <p className="font-bold uppercase tracking-wider text-amber-900">
            Official Warning Letter #{guard.warningLettersCount}
          </p>
          <p>
            <strong>Employee:</strong> {guard.fullName} ({guard.forceNumber})
          </p>
          <p>
            <strong>Assigned Station:</strong> {guard.assignedSite}
          </p>
          <p className="pt-2 text-slate-700">
            This notice serves as an official written warning regarding shift discipline and post security adherence. Subsequent non-compliance may result in suspension or escalation to the HR Directorate.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              toast.success("Warning letter archived", `${guard.fullName} (${guard.forceNumber}) — warning letter printed and archived in the HR file.`);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print & HR Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
