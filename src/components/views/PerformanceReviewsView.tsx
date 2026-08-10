import React, { useState } from "react";
import { Star, Target, CheckCircle2, Plus, Search, FileText, Pencil } from "lucide-react";
import type { PerformanceReviewRecord, Guard } from "../../types";

interface PerformanceReviewsViewProps {
  reviews: PerformanceReviewRecord[];
  guards: Guard[];
  onAddReview: (r: Omit<PerformanceReviewRecord, "id">) => void;
  onUpdateReview?: (id: string, updates: Partial<PerformanceReviewRecord>) => void;
}

const periods = ["Q1 2026", "Mid-Year 2026", "Q3 2026", "Annual 2026"];
const reviewTypes = ["Annual Evaluation", "Mid-Year Review", "Quarterly Review", "Probation Assessment"];
const statuses: PerformanceReviewRecord["status"][] = ["Draft", "Pending Approval", "Approved & Archived"];

export const PerformanceReviewsView: React.FC<PerformanceReviewsViewProps> = ({ reviews, guards, onAddReview, onUpdateReview }) => {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [form, setForm] = useState({
    guardId: "", reviewPeriod: "Annual 2026", reviewType: "Annual Evaluation", evaluatorName: "",
    evaluationDate: new Date().toISOString().split("T")[0],
    disciplineScore: 3, punctualityScore: 3, clientRatingScore: 3, appearanceScore: 3, incidentHandlingScore: 3,
    comments: "", keyStrengths: "", growthAreas: "", developmentGoals: "",
    status: "Draft" as PerformanceReviewRecord["status"],
  });

  const filtered = reviews.filter((r) => {
    const s = r.guardName.toLowerCase().includes(search.toLowerCase()) || r.guardCode.toLowerCase().includes(search.toLowerCase());
    const p = filterPeriod === "ALL" || r.reviewPeriod === filterPeriod;
    const st = filterStatus === "ALL" || r.status === filterStatus;
    return s && p && st;
  });

  const avgScore = (r: PerformanceReviewRecord) =>
    ((r.disciplineScore + r.punctualityScore + r.clientRatingScore + r.appearanceScore + r.incidentHandlingScore) / 5).toFixed(1);

  const getOverallRating = (scores: { d: number; p: number; c: number; a: number; i: number }): PerformanceReviewRecord["overallRating"] => {
    const avg = (scores.d + scores.p + scores.c + scores.a + scores.i) / 5;
    if (avg >= 4.5) return "Outstanding (A)";
    if (avg >= 3.5) return "Exceeds Expectations (B)";
    if (avg >= 2.5) return "Satisfactory (C)";
    if (avg >= 1.5) return "Needs Improvement (D)";
    return "Unsatisfactory (F)";
  };

  const getRecommendation = (avg: number): PerformanceReviewRecord["recommendation"] => {
    if (avg >= 4.0) return "Promotion";
    if (avg >= 3.0) return "Salary Adjustment";
    if (avg >= 2.0) return "Contract Renewal";
    if (avg >= 1.5) return "Refresher Training";
    return "Routine Supervision";
  };

  const getStatusBadge = (s: string) => {
    const m: Record<string, string> = { "Draft": "bg-slate-100 text-slate-700", "Pending Approval": "bg-amber-100 text-amber-700", "Approved & Archived": "bg-emerald-100 text-emerald-700" };
    return m[s] || "bg-slate-100 text-slate-700";
  };

  const getOverallBadge = (r: string) => {
    const m: Record<string, string> = {
      "Outstanding (A)": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Exceeds Expectations (B)": "bg-blue-100 text-blue-700 border-blue-200",
      "Satisfactory (C)": "bg-slate-100 text-slate-700 border-slate-200",
      "Needs Improvement (D)": "bg-amber-100 text-amber-700 border-amber-200",
      "Unsatisfactory (F)": "bg-rose-100 text-rose-700 border-rose-200",
    };
    return m[r] || "bg-slate-100 text-slate-700";
  };

  const openEdit = (r: PerformanceReviewRecord) => {
    setEditId(r.id);
    setForm({
      guardId: r.guardId, reviewPeriod: r.reviewPeriod, reviewType: r.reviewType,
      evaluatorName: r.evaluatorName, evaluationDate: r.evaluationDate,
      disciplineScore: r.disciplineScore, punctualityScore: r.punctualityScore,
      clientRatingScore: r.clientRatingScore, appearanceScore: r.appearanceScore,
      incidentHandlingScore: r.incidentHandlingScore,
      comments: r.comments || "", keyStrengths: r.keyStrengths || "",
      growthAreas: r.growthAreas || "", developmentGoals: r.developmentGoals || "",
      status: r.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const guard = guards.find((g) => g.id === form.guardId);
    if (!guard) return;
    const scores = { d: form.disciplineScore, p: form.punctualityScore, c: form.clientRatingScore, a: form.appearanceScore, i: form.incidentHandlingScore };
    const avg = (scores.d + scores.p + scores.c + scores.a + scores.i) / 5;
    const payload = {
      guardId: form.guardId, guardName: guard.fullName, guardCode: guard.guardCode,
      reviewPeriod: form.reviewPeriod, reviewType: form.reviewType,
      evaluatorName: form.evaluatorName, evaluationDate: form.evaluationDate,
      disciplineScore: form.disciplineScore, punctualityScore: form.punctualityScore,
      clientRatingScore: form.clientRatingScore, appearanceScore: form.appearanceScore,
      incidentHandlingScore: form.incidentHandlingScore,
      overallRating: getOverallRating(scores), recommendation: getRecommendation(avg),
      comments: form.comments, keyStrengths: form.keyStrengths, growthAreas: form.growthAreas,
      developmentGoals: form.developmentGoals, status: form.status,
    };
    if (editId && onUpdateReview) {
      onUpdateReview(editId, payload);
    } else {
      onAddReview(payload);
    }
    setShowModal(false);
    setEditId(null);
    setForm({ guardId: "", reviewPeriod: "Annual 2026", reviewType: "Annual Evaluation", evaluatorName: "", evaluationDate: new Date().toISOString().split("T")[0], disciplineScore: 3, punctualityScore: 3, clientRatingScore: 3, appearanceScore: 3, incidentHandlingScore: 3, comments: "", keyStrengths: "", growthAreas: "", developmentGoals: "", status: "Draft" });
  };

  const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-32 text-slate-500 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${value >= 4 ? "bg-emerald-500" : value >= 3 ? "bg-blue-500" : value >= 2 ? "bg-amber-500" : "bg-rose-500"}`}
          style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-5 text-right font-bold text-slate-700">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700"><Star className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Guard Performance Reviews</h2>
            <p className="text-xs text-slate-500">Score-based evaluations with automated overall ratings and recommendations</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer shrink-0">
          <Plus className="w-4 h-4" /><span>New Performance Review</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none" />
        </div>
        <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none bg-white font-semibold">
          <option value="ALL">All Periods</option>
          {periods.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none bg-white font-semibold">
          <option value="ALL">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No performance reviews found</p>
          <p className="text-xs text-slate-400 mt-1">Create a new review to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const avg = parseFloat(avgScore(r));
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm">
                      {r.guardName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">{r.guardName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.guardCode}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${getOverallBadge(r.overallRating)} border`}>
                      {r.overallRating}
                    </div>
                    {onUpdateReview && (
                      <button type="button" onClick={() => openEdit(r)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-purple-600 cursor-pointer"
                        title="Edit review">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{r.reviewPeriod}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{r.reviewType}</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${getStatusBadge(r.status)}`}>{r.status}</span>
                </div>
                <div className="space-y-1">
                  <ScoreBar label="Discipline" value={r.disciplineScore} />
                  <ScoreBar label="Punctuality" value={r.punctualityScore} />
                  <ScoreBar label="Client Rating" value={r.clientRatingScore} />
                  <ScoreBar label="Appearance" value={r.appearanceScore} />
                  <ScoreBar label="Incident Handling" value={r.incidentHandlingScore} />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Avg: <strong className="text-slate-900">{avg}/5</strong></span>
                  <span className="text-slate-500">Evaluator: <strong className="text-slate-900">{r.evaluatorName}</strong></span>
                  <span className="text-slate-500"><strong className="text-slate-900">{r.recommendation}</strong></span>
                </div>
                {r.developmentGoals && (
                  <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-[10px] text-blue-800 flex items-start gap-1.5">
                    <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{r.developmentGoals}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              {editId ? "Edit Performance Review" : "New Performance Review"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guard</label>
                  <select required value={form.guardId} onChange={(e) => setForm({ ...form, guardId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                    <option value="">Select guard...</option>
                    {guards.map((g) => <option key={g.id} value={g.id}>{g.fullName} ({g.guardCode})</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Period</label>
                  <select value={form.reviewPeriod} onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                    {periods.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select value={form.reviewType} onChange={(e) => setForm({ ...form, reviewType: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                    {reviewTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Evaluator</label>
                  <input required value={form.evaluatorName} onChange={(e) => setForm({ ...form, evaluatorName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" placeholder="Evaluator name" />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {(["disciplineScore", "punctualityScore", "clientRatingScore", "appearanceScore", "incidentHandlingScore"] as const).map((field) => (
                  <div key={field} className="text-center">
                    <label className="text-[9px] font-black uppercase text-slate-500 block mb-1">
                      {field.replace("Score", "").replace(/([A-Z])/g, " $1").trim()}
                    </label>
                    <div className="flex items-center justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} type="button" onClick={() => setForm({ ...form, [field]: v })}
                          className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            form[field] >= v ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-400"
                          }`}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Comments</label>
                <textarea rows={2} value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Key Strengths</label>
                  <input value={form.keyStrengths} onChange={(e) => setForm({ ...form, keyStrengths: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Growth Areas</label>
                  <input value={form.growthAreas} onChange={(e) => setForm({ ...form, growthAreas: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Development Goals</label>
                <input value={form.developmentGoals} onChange={(e) => setForm({ ...form, developmentGoals: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
