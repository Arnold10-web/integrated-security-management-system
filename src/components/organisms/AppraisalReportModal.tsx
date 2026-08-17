import React from "react";
import { Award, CheckCircle2, AlertTriangle } from "lucide-react";
import type { StaffAppraisal } from "../../types";
import { useDomainStore } from "../../stores/domainStore";

interface AppraisalReportModalProps {
  appraisal: StaffAppraisal | null;
  onClose: () => void;
}

export const AppraisalReportModal: React.FC<AppraisalReportModalProps> = ({ appraisal, onClose }) => {
  const disciplinary = useDomainStore((s) => s.disciplinaryActions);
  if (!appraisal) return null;

  const history = disciplinary.filter((d) => d.guardId === appraisal.guardId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-900 text-white">
              <Award className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Official Staff Performance Appraisal Certificate</h3>
              <p className="text-xs text-slate-500">Integrated Security Company Ltd • HR Archives Ref: {appraisal.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>
        </div>

        <div className="space-y-4 text-xs bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
          <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Officer Name & Code</span>
              <p className="font-black text-slate-900 text-sm">{appraisal.guardName}</p>
              <p className="font-mono text-purple-700 font-bold mt-0.5">{appraisal.forceNumber}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Designation & Site</span>
              <p className="font-extrabold text-slate-800">{appraisal.designation}</p>
              <p className="text-slate-600">{appraisal.siteName}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Review Period</span>
              <span className="font-black text-purple-900 text-xs">{appraisal.reviewPeriod}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Grade</span>
              <span className="font-black text-indigo-900 text-xs">{appraisal.overallRating}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Evaluation Date</span>
              <span className="font-bold text-slate-800 text-xs">{appraisal.evaluationDate}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-black text-slate-900 block text-xs uppercase tracking-wider">Performance Metric Scorecard</span>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              {[
                { label: "Discipline & Attendance", score: appraisal.disciplineScore },
                { label: "Punctuality", score: appraisal.punctualityScore },
                { label: "Client Civility", score: appraisal.clientRatingScore },
                { label: "Uniform & Turnout", score: appraisal.appearanceScore },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                  <span className="font-bold text-slate-700">{item.label}:</span>
                  <span className="text-amber-500 font-bold">
                    {"★".repeat(item.score)}{"☆".repeat(5 - item.score)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-900 text-white p-4 rounded-xl space-y-2 shadow-sm">
            <span className="font-black uppercase tracking-wider text-[11px] text-purple-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-300" />
              Agreed Professional Development Goals
            </span>
            <p className="text-purple-50 font-medium leading-relaxed whitespace-pre-line text-xs pl-1">
              {appraisal.agreedDevelopmentGoals || "Standard operational excellence targets set."}
            </p>
          </div>

          {history.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <span className="font-black uppercase tracking-wider text-[11px] text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Disciplinary History for Review Period — auto-surfaced
              </span>
              <div className="space-y-1.5">
                {history.map((d) => (
                  <div key={d.id} className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-slate-900 uppercase">{d.actionType}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase">{d.status}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{d.reason}</p>
                    {(d.offenceCategory || d.offenceDate) && (
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                        {d.offenceCategory ? `${d.offenceCategory}${d.offence ? ` — ${d.offence}` : ""}` : ""}
                        {d.offenceDate ? `${d.offenceCategory ? " · " : ""}${d.offenceDate}${d.zone ? ` · ${d.zone}` : ""}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider mb-1">Supervisor Comments</span>
              <p className="text-slate-700 italic">"{appraisal.supervisorComments || appraisal.comments}"</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider mb-1">Staff Acknowledgment</span>
              <p className="text-slate-700 italic">"{appraisal.staffFeedbackComments || "Reviewed and accepted without reservation."}"</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-semibold">
            <div>
              <p className="border-b border-slate-300 pb-1 mb-1 font-bold text-slate-800">{appraisal.evaluatorName} ({appraisal.evaluatorTitle || "HR Evaluator"})</p>
              <span>Evaluator Signature & Date</span>
            </div>
            <div>
              <p className="border-b border-slate-300 pb-1 mb-1 font-bold text-slate-800">{appraisal.guardName}</p>
              <span>Staff Member Signature & Date</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Close Report</button>
        </div>
        </div>
      </div>
    </div>
  );
};
