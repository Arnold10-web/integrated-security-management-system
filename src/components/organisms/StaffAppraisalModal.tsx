import React from "react";
import { Award, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Guard, StaffAppraisal } from "../../types";
import { useDomainStore } from "../../stores/domainStore";

interface StaffAppraisalModalProps {
  guards: Guard[];
  show: boolean;
  onClose: () => void;
  appraisalGuardId: string;
  setAppraisalGuardId: (v: string) => void;
  appraisalPeriod: StaffAppraisal["reviewPeriod"];
  setAppraisalPeriod: (v: StaffAppraisal["reviewPeriod"]) => void;
  appraisalType: StaffAppraisal["reviewType"];
  setAppraisalType: (v: StaffAppraisal["reviewType"]) => void;
  evaluatorNameInput: string;
  setEvaluatorNameInput: (v: string) => void;
  evaluatorTitleInput: string;
  setEvaluatorTitleInput: (v: string) => void;
  disciplineScore: number;
  setDisciplineScore: (v: number) => void;
  punctualityScore: number;
  setPunctualityScore: (v: number) => void;
  clientRatingScore: number;
  setClientRatingScore: (v: number) => void;
  appearanceScore: number;
  setAppearanceScore: (v: number) => void;
  incidentScore: number;
  setIncidentScore: (v: number) => void;
  appraisalRecommendation: StaffAppraisal["recommendation"];
  setAppraisalRecommendation: (v: StaffAppraisal["recommendation"]) => void;
  keyStrengthsInput: string;
  setKeyStrengthsInput: (v: string) => void;
  growthAreasInput: string;
  setGrowthAreasInput: (v: string) => void;
  agreedGoalsInput: string;
  setAgreedGoalsInput: (v: string) => void;
  supervisorCommentsInput: string;
  setSupervisorCommentsInput: (v: string) => void;
  staffFeedbackInput: string;
  setStaffFeedbackInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const StarSelect: React.FC<{ value: number; onChange: (v: number) => void; label: string }> = ({ value, onChange, label }) => (
  <div>
    <label className="block text-slate-600 font-bold mb-0.5">{label}</label>
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-extrabold text-slate-900">
      <option value={5}>5 Stars - Excellent</option>
      <option value={4}>4 Stars - Good</option>
      <option value={3}>3 Stars - Average</option>
      <option value={2}>2 Stars - Below Target</option>
      <option value={1}>1 Star - Poor</option>
    </select>
  </div>
);

export const StaffAppraisalModal: React.FC<StaffAppraisalModalProps> = ({
  guards, show, onClose,
  appraisalGuardId, setAppraisalGuardId,
  appraisalPeriod, setAppraisalPeriod,
  appraisalType, setAppraisalType,
  evaluatorNameInput, setEvaluatorNameInput,
  evaluatorTitleInput, setEvaluatorTitleInput,
  disciplineScore, setDisciplineScore,
  punctualityScore, setPunctualityScore,
  clientRatingScore, setClientRatingScore,
  appearanceScore, setAppearanceScore,
  incidentScore, setIncidentScore,
  appraisalRecommendation, setAppraisalRecommendation,
  keyStrengthsInput, setKeyStrengthsInput,
  growthAreasInput, setGrowthAreasInput,
  agreedGoalsInput, setAgreedGoalsInput,
  supervisorCommentsInput, setSupervisorCommentsInput,
  staffFeedbackInput, setStaffFeedbackInput,
  onSubmit,
}) => {
  if (!show) return null;
  const selectedGuard = guards.find((g) => g.id === appraisalGuardId) ?? null;
  const disciplinaryHistory = useDomainStore((s) => s.disciplinaryActions.filter((d) => d.guardId === appraisalGuardId || d.forceNumber === selectedGuard?.forceNumber));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-700" />
              Staff Appraisal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Record annual performance scores, supervisor feedback, employee acknowledgment.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Officer / Staff</label>
              <select required value={appraisalGuardId} onChange={(e) => setAppraisalGuardId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="">-- Select Personnel --</option>
                {guards.map((g) => (
                  <option key={g.id} value={g.id}>{g.fullName} ({g.forceNumber}) • {g.designation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Review Period</label>
              <select value={appraisalPeriod} onChange={(e) => setAppraisalPeriod(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="Annual 2026">Annual 2026</option>
                <option value="Annual 2025">Annual 2025</option>
                <option value="Mid-Year 2026">Mid-Year 2026</option>
                <option value="Q3 2026">Q3 2026</option>
                <option value="Q1 2026">Q1 2026</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Review Type</label>
              <select value={appraisalType} onChange={(e) => setAppraisalType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="Annual Evaluation">Annual Evaluation</option>
                <option value="Mid-Year Review">Mid-Year Review</option>
                <option value="Quarterly Review">Quarterly Review</option>
                <option value="Probation Assessment">Probation Assessment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Evaluator / Supervisor Name</label>
              <input type="text" required value={evaluatorNameInput} onChange={(e) => setEvaluatorNameInput(e.target.value)}
                placeholder="e.g. Sarah Akello" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Evaluator Title</label>
              <input type="text" required value={evaluatorTitleInput} onChange={(e) => setEvaluatorTitleInput(e.target.value)}
                placeholder="e.g. HR & Performance Manager" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold" />
            </div>
          </div>

          {appraisalGuardId && (
            <div className={`rounded-xl border p-3 space-y-2 ${disciplinaryHistory.length > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${disciplinaryHistory.length > 0 ? "text-amber-600" : "text-emerald-600"}`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Disciplinary History — auto-surfaced for this review period</span>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${disciplinaryHistory.length > 0 ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"}`}>
                  {selectedGuard ? `${selectedGuard.warningLettersCount} warning letter(s)` : "—"} · {disciplinaryHistory.length} case(s)
                </span>
              </div>
              {disciplinaryHistory.length > 0 ? (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {disciplinaryHistory.slice(0, 4).map((d) => (
                    <div key={d.id} className="flex items-start justify-between gap-2 text-[11px] bg-white/70 rounded-lg px-2 py-1.5 border border-amber-200/60">
                      <span className="font-bold text-slate-800">{d.actionType} · {d.offence || d.reason}</span>
                      <span className="text-[10px] text-slate-500 font-semibold shrink-0">{d.status}{d.offenceDate ? ` · ${d.offenceDate}` : ""}</span>
                    </div>
                  ))}
                  {disciplinaryHistory.length > 4 && <p className="text-[10px] text-slate-500 font-semibold">+{disciplinaryHistory.length - 4} more case(s) on file.</p>}
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 font-medium">No disciplinary cases on file for this guard — evaluator cannot omit history; this banner confirms it.</p>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-black text-slate-800 block text-[11px] uppercase tracking-wider">5 Performance Indicator Criteria Scores (1 to 5 Stars)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StarSelect label="Discipline & Attendance" value={disciplineScore} onChange={setDisciplineScore} />
              <StarSelect label="Punctuality & Shift Alertness" value={punctualityScore} onChange={setPunctualityScore} />
              <StarSelect label="Client Rating & Civility" value={clientRatingScore} onChange={setClientRatingScore} />
              <StarSelect label="Uniform & Turnout" value={appearanceScore} onChange={setAppearanceScore} />
              <StarSelect label="Incident Handling" value={incidentScore} onChange={setIncidentScore} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Key Strengths</label>
              <input type="text" placeholder="e.g., Punctual, strong integrity" value={keyStrengthsInput}
                onChange={(e) => setKeyStrengthsInput(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Growth / Focus Areas</label>
              <input type="text" placeholder="e.g., Tactical communication" value={growthAreasInput}
                onChange={(e) => setGrowthAreasInput(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" />
            </div>
          </div>

          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200/80 space-y-1.5">
            <label className="block text-purple-900 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-700" />
              Agreed Professional Development Goals (Annual Targets)
            </label>
            <textarea rows={3} required placeholder="Record specific agreed goals..."
              value={agreedGoalsInput} onChange={(e) => setAgreedGoalsInput(e.target.value)}
              className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-slate-800 font-medium leading-relaxed resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Supervisor Assessment Comments</label>
              <textarea rows={2} required placeholder="Supervisor detailed feedback..."
                value={supervisorCommentsInput} onChange={(e) => setSupervisorCommentsInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 resize-none" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Staff Member Feedback / Acknowledgment</label>
              <textarea rows={2} placeholder="Employee's feedback..."
                value={staffFeedbackInput} onChange={(e) => setStaffFeedbackInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">HR Recommendation for Action</label>
            <select value={appraisalRecommendation} onChange={(e) => setAppraisalRecommendation(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-900">
              <option value="Promotion">Promotion (Supervisory / Station Officer role)</option>
              <option value="Salary Adjustment">Salary Adjustment / Merit Pay Increase</option>
              <option value="Contract Renewal">Contract Renewal</option>
              <option value="Refresher Training">Refresher Drills / Re-training</option>
              <option value="Routine Supervision">Routine Supervision</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md cursor-pointer">Save Appraisal & Lock Goals</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
