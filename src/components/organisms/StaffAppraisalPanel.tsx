import React from "react";
import { Award, Search, Calendar, TrendingUp, CheckCircle2 } from "lucide-react";
import type { StaffAppraisal } from "../../types";

interface StaffAppraisalPanelProps {
  appraisals: StaffAppraisal[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  periodFilter: string;
  onPeriodFilterChange: (period: string) => void;
  ratingFilter: string;
  onRatingFilterChange: (rating: string) => void;
  onViewReport: (appraisal: StaffAppraisal) => void;
  onAddNew: () => void;
}

export const StaffAppraisalPanel: React.FC<StaffAppraisalPanelProps> = ({
  appraisals,
  searchTerm,
  onSearchChange,
  periodFilter,
  onPeriodFilterChange,
  ratingFilter,
  onRatingFilterChange,
  onViewReport,
  onAddNew,
}) => {
  const uniquePeriods = ["ALL", ...new Set(appraisals.map((a) => a.reviewPeriod))];

  const filteredAppraisals = appraisals.filter((a) => {
    if (periodFilter !== "ALL" && a.reviewPeriod !== periodFilter) return false;
    if (ratingFilter !== "ALL" && !a.overallRating.startsWith(ratingFilter)) return false;
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      return (
        a.guardName.toLowerCase().includes(q) ||
        a.guardCode.toLowerCase().includes(q) ||
        a.siteName.toLowerCase().includes(q) ||
        a.evaluatorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const ratingOptions = [
    { label: "All Ratings", value: "ALL" },
    { label: "Outstanding (A)", value: "Outstanding" },
    { label: "Exceeds (B)", value: "Exceeds" },
    { label: "Satisfactory (C)", value: "Satisfactory" },
    { label: "Needs Improvement (D)", value: "Needs Improvement" },
    { label: "Unsatisfactory (F)", value: "Unsatisfactory" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-purple-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-1">
              <span>HR DEPARTMENT • ANNUAL PERFORMANCE EVALUATION MODULE</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Staff & Security Officer Performance Appraisals
            </h2>
            <p className="text-xs text-purple-200/80 mt-1 max-w-3xl leading-relaxed">
              Annual & periodic supervisor evaluations, feedback comments archive, 5-star metric scorecards, and agreed-upon professional development goals for career progression.
            </p>
          </div>
        </div>
        <button
          onClick={onAddNew}
          className="px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Award className="w-4 h-4 text-slate-950" />
          <span>Log Annual Performance Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Evaluations", value: appraisals.length, icon: Award, color: "text-purple-600" },
          { label: "Annual Reviews", value: appraisals.filter((a) => a.reviewPeriod.includes("Annual")).length, icon: Calendar, color: "text-indigo-600" },
          { label: "Promotions Recommended", value: appraisals.filter((a) => a.recommendation === "Promotion").length, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Development Plans", value: appraisals.filter((a) => a.agreedDevelopmentGoals).length, icon: CheckCircle2, color: "text-blue-600" },
        ].map((metric) => (
          <div key={metric.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{metric.label}</span>
              <metric.icon className={`w-4 h-4 ${metric.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search appraisals by guard name, code, site or evaluator..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={periodFilter}
              onChange={(e) => onPeriodFilterChange(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none text-xs"
            >
              {uniquePeriods.map((p) => (
                <option key={p} value={p}>{p === "ALL" ? "All Periods" : p}</option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => onRatingFilterChange(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none text-xs"
            >
              {ratingOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredAppraisals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-xs text-slate-500 font-medium">No appraisal records match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppraisals.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-purple-300 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900">{app.guardName}</h3>
                  <span className="text-xs font-mono font-bold text-purple-600">{app.guardCode}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  app.overallRating.startsWith("Outstanding") || app.overallRating.startsWith("Exceeds")
                    ? "bg-emerald-100 text-emerald-800"
                    : app.overallRating.startsWith("Satisfactory")
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
                }`}>{app.overallRating}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] flex items-center justify-between">
                <span className="font-bold text-slate-800">Evaluator: {app.evaluatorName}</span>
                {app.evaluatorTitle && <span className="text-slate-500 italic">({app.evaluatorTitle})</span>}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                <span className="font-extrabold text-slate-800 block text-[10px] uppercase tracking-wider">5-Star Scorecard</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  {[
                    { label: "Discipline", score: app.disciplineScore },
                    { label: "Punctuality", score: app.punctualityScore },
                    { label: "Client Rating", score: app.clientRatingScore },
                    { label: "Uniform/Turnout", score: app.appearanceScore },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="font-medium text-slate-600">{item.label}:</span>
                      <span className="text-amber-500 font-bold">{"★".repeat(item.score)}{"☆".repeat(5 - item.score)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {(app.keyStrengths || app.growthAreas) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {app.keyStrengths && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-[11px]">
                      <span className="font-bold text-emerald-900 block text-[10px] uppercase tracking-wider mb-0.5">Strengths</span>
                      <p className="text-emerald-950 font-medium">{app.keyStrengths}</p>
                    </div>
                  )}
                  {app.growthAreas && (
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-[11px]">
                      <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-0.5">Growth Areas</span>
                      <p className="text-amber-950 font-medium">{app.growthAreas}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-bold">
                  Rec: {app.recommendation}
                </span>
                <button
                  onClick={() => onViewReport(app)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Full Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
