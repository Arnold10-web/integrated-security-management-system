import React, { useState } from "react";
import { BookOpen } from "lucide-react";
import type { TrainingCohort } from "../../types";

interface AddCohortModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (cohort: Omit<TrainingCohort, "id">) => void;
}

export const AddCohortModal: React.FC<AddCohortModalProps> = ({ show, onClose, onSubmit }) => {
  const [cohortName, setCohortName] = useState("");
  const [cohortCode, setCohortCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("Kyankwanzi Security Academy & Firing Range");
  const [leadInstructor, setLeadInstructor] = useState("David Opio (Senior Training Instructor)");
  const [totalRecruitsCount, setTotalRecruitsCount] = useState(50);
  const [curriculumModulesText, setCurriculumModulesText] = useState(
    "Physical Conditioning, AK-47 Marksmanship, VIP Escort, Customer Relations, VHF Radio Code"
  );

  const resetFields = () => {
    setCohortName("");
    setCohortCode("");
    setStartDate("");
    setEndDate("");
    setLocation("Kyankwanzi Security Academy & Firing Range");
    setLeadInstructor("David Opio (Senior Training Instructor)");
    setTotalRecruitsCount(50);
    setCurriculumModulesText("Physical Conditioning, AK-47 Marksmanship, VIP Escort, Customer Relations, VHF Radio Code");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortName || !cohortCode) return;
    onSubmit({
      code: cohortCode.toUpperCase(),
      name: cohortName,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      location,
      leadInstructor,
      totalRecruits: Number(totalRecruitsCount),
      passedOutCount: 0,
      status: "In Session",
      curriculumModules: curriculumModulesText.split(",").map((m) => m.trim()),
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
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Create New Security Guard Intake Cohort
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Cohort Code (e.g. INTAKE-2026-D)</label>
            <input
              type="text" required placeholder="INTAKE-2026-D"
              value={cohortCode} onChange={(e) => setCohortCode(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cohort Name</label>
            <input
              type="text" required placeholder="e.g. Q3 High-Risk Escort Training Cohort"
              value={cohortName} onChange={(e) => setCohortName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pass-Out / Graduation Date</label>
              <input
                type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Academy & Firing Range Location</label>
            <input
              type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lead Training Instructor</label>
            <input
              type="text" required value={leadInstructor} onChange={(e) => setLeadInstructor(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Curriculum Modules (comma-separated)</label>
            <input
              type="text" required value={curriculumModulesText} onChange={(e) => setCurriculumModulesText(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => { resetFields(); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer">
              Create Cohort
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
