import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Send,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  PlayCircle,
  FileText,
  Star,
} from "lucide-react";
import { api } from "../../services/apiClient";
import { useAuthStore } from "../../stores/authStore";
import { toast } from "../../stores/toastStore";
import type { TrainingCohort, TrainingCurriculum, TrainingCourseOutline } from "../../types";

/* ──────────── helpers ──────────── */
const STATUS_BADGE: Record<string, string> = {
  Draft: "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
};

/* ──────────── sub-components ──────────── */

/** Inline editable field */
const EditableField: React.FC<{
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
}> = ({ label, value, editing, onChange, multiline }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label}</label>
    {editing ? (
      multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-500"
        />
      )
    ) : (
      <p className="text-xs font-semibold text-slate-800">{value || "—"}</p>
    )}
  </div>
);

/** Session row for course outline */
const SessionRow: React.FC<{
  session: TrainingCourseOutline;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<TrainingCourseOutline>) => void;
  onCancelEdit: () => void;
}> = ({ session, editing, onEdit, onDelete, onUpdate, onCancelEdit }) => {
  const [draft, setDraft] = useState(session);

  useEffect(() => setDraft(session), [session]);

  if (editing) {
    return (
      <tr className="bg-cyan-50/40">
        <td className="px-3 py-2">
          <input type="number" min={1} value={draft.sessionNumber} onChange={(e) => setDraft({ ...draft, sessionNumber: Number(e.target.value) })}
            className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold" />
        </td>
        <td className="px-3 py-2">
          <input type="text" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" />
        </td>
        <td className="px-3 py-2">
          <input type="text" value={draft.instructor} onChange={(e) => setDraft({ ...draft, instructor: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" />
        </td>
        <td className="px-3 py-2">
          <input type="text" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" />
        </td>
        <td className="px-3 py-2">
          <input type="text" value={draft.materials ?? ""} onChange={(e) => setDraft({ ...draft, materials: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold" placeholder="Optional" />
        </td>
        <td className="px-3 py-2 text-right space-x-1">
          <button onClick={() => onUpdate(draft)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer">Save</button>
          <button onClick={onCancelEdit} className="px-2 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer">Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-2 font-mono text-xs font-bold text-slate-700">{String(session.sessionNumber).padStart(2, "0")}</td>
      <td className="px-3 py-2 text-xs font-semibold text-slate-800">{session.topic}</td>
      <td className="px-3 py-2 text-xs text-slate-600">{session.instructor}</td>
      <td className="px-3 py-2 text-[11px] text-slate-500 font-mono">{session.date}</td>
      <td className="px-3 py-2 text-[11px] text-slate-500 truncate max-w-[180px]">{session.materials || "—"}</td>
      <td className="px-3 py-2 text-right space-x-1">
        <button onClick={onEdit} className="px-2 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold cursor-pointer">Edit</button>
        <button onClick={onDelete} className="px-2 py-1 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold cursor-pointer">Del</button>
      </td>
    </tr>
  );
};

/* ──────────── Main View ──────────── */
export const TrainingCurriculumView: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);

  /* ── data state ── */
  const [cohorts, setCohorts] = useState<TrainingCohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<TrainingCurriculum | null>(null);
  const [sessions, setSessions] = useState<TrainingCourseOutline[]>([]);
  const [loading, setLoading] = useState(false);

  /* ── ui state ── */
  const [editingCurriculum, setEditingCurriculum] = useState(false);
  const [curriculumDraft, setCurriculumDraft] = useState({ title: "", description: "" });
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({ sessionNumber: 1, topic: "", instructor: "", date: "", materials: "" });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [creatingCurriculum, setCreatingCurriculum] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  /* ── fetch cohorts ── */
  useEffect(() => {
    api.get<TrainingCohort[]>("/cohorts").then(setCohorts).catch(() => {});
  }, []);

  /* ── fetch curriculum + sessions when cohort selected ── */
  const loadCurriculum = useCallback(async (cohortId: string) => {
    setLoading(true);
    try {
      const curricula = await api.get<TrainingCurriculum[]>("/training-curricula");
      const match = curricula.find((c) => c.cohortId === cohortId) ?? null;
      setCurriculum(match);
      if (match) {
        const outline = await api.get<TrainingCourseOutline[]>(`/training-course-outlines?curriculumId=${match.id}`);
        setSessions(outline);
      } else {
        setSessions([]);
      }
    } catch {
      setCurriculum(null);
      setSessions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCohortId) loadCurriculum(selectedCohortId);
  }, [selectedCohortId, loadCurriculum]);

  /* ── curriculum CRUD ── */
  const handleCreateCurriculum = async () => {
    if (!selectedCohortId) return;
    setCreatingCurriculum(true);
    try {
      const cohort = cohorts.find((c) => c.id === selectedCohortId);
      const created = await api.post<TrainingCurriculum>("/training-curricula", {
        cohortId: selectedCohortId,
        title: `${cohort?.name ?? "Training"} Curriculum`,
        description: `Curriculum for ${cohort?.name ?? "cohort"}`,
        modules: [],
        status: "Draft",
      });
      setCurriculum(created);
      toast.success("Curriculum Created", "Draft curriculum created for this cohort.");
    } catch {
      toast.error("Error", "Failed to create curriculum.");
    }
    setCreatingCurriculum(false);
  };

  const handleUpdateCurriculumStatus = async (newStatus: string) => {
    if (!curriculum) return;
    try {
      const updated = await api.put<TrainingCurriculum>(`/training-curricula/${curriculum.id}`, { status: newStatus });
      setCurriculum(updated);
      toast.success("Status Updated", `Curriculum marked as ${newStatus}.`);
    } catch {
      toast.error("Error", "Failed to update curriculum status.");
    }
  };

  const handleSaveCurriculum = async () => {
    if (!curriculum) return;
    try {
      const updated = await api.put<TrainingCurriculum>(`/training-curricula/${curriculum.id}`, {
        title: curriculumDraft.title,
        description: curriculumDraft.description,
      });
      setCurriculum(updated);
      setEditingCurriculum(false);
      toast.success("Saved", "Curriculum details updated.");
    } catch {
      toast.error("Error", "Failed to save curriculum.");
    }
  };

  /* ── session CRUD ── */
  const handleAddSession = async () => {
    if (!curriculum || !selectedCohortId) return;
    try {
      const created = await api.post<TrainingCourseOutline>("/training-course-outlines", {
        curriculumId: curriculum.id,
        cohortId: selectedCohortId,
        sessionNumber: newSession.sessionNumber,
        topic: newSession.topic,
        instructor: newSession.instructor,
        date: newSession.date,
        materials: newSession.materials || undefined,
      });
      setSessions((prev) => [...prev, created].sort((a, b) => a.sessionNumber - b.sessionNumber));
      setShowAddSession(false);
      setNewSession({ sessionNumber: sessions.length + 2, topic: "", instructor: "", date: "", materials: "" });
      toast.success("Session Added", `Session ${created.sessionNumber} added to course outline.`);
    } catch {
      toast.error("Error", "Failed to add session.");
    }
  };

  const handleUpdateSession = async (session: TrainingCourseOutline) => {
    if (!curriculum) return;
    try {
      const updated = await api.put<TrainingCourseOutline>(`/training-course-outlines/${session.id}`, {
        sessionNumber: session.sessionNumber,
        topic: session.topic,
        instructor: session.instructor,
        date: session.date,
        materials: session.materials,
      });
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => a.sessionNumber - b.sessionNumber));
      setEditingSessionId(null);
      toast.success("Updated", "Session updated.");
    } catch {
      toast.error("Error", "Failed to update session.");
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      await api.delete(`/training-course-outlines/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Deleted", "Session removed.");
    } catch {
      toast.error("Error", "Failed to delete session.");
    }
  };

  /* ── certificate generation ── */
  const handleGenerateCertificates = async () => {
    if (!selectedCohortId) return;
    try {
      const result = await api.post<{ certificates: unknown[]; count: number }>(`/training-cohorts/${selectedCohortId}/generate-certificates`);
      toast.success("Certificates Generated", `${result.count} pass-out certificate(s) generated.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate certificates.";
      toast.error("Error", msg);
    }
  };

  /* ── derived ── */
  const selectedCohort = cohorts.find((c) => c.id === selectedCohortId);

  const toggleModule = (idx: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  /* ──────────── JSX ──────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Training Curriculum & Course Outline
            </h1>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Define training modules, session schedules, and manage curriculum approval workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar — cohort list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">Training Cohorts</h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a cohort to manage its curriculum</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {cohorts.map((cohort) => (
                <button
                  key={cohort.id}
                  onClick={() => setSelectedCohortId(cohort.id)}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                    selectedCohortId === cohort.id
                      ? "bg-emerald-50/60 border-l-2 border-l-emerald-500"
                      : "hover:bg-slate-50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${selectedCohortId === cohort.id ? "text-emerald-600" : "text-slate-400"}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-800 truncate">{cohort.code}</p>
                      <p className="text-[10px] text-slate-500 truncate">{cohort.name}</p>
                      <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        cohort.status === "In Session"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>{cohort.status}</span>
                    </div>
                  </div>
                </button>
              ))}
              {cohorts.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-slate-400">No cohorts found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right main panel */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedCohortId ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-700">Select a Training Cohort</p>
              <p className="text-xs text-slate-400 mt-1">Choose a cohort from the list to view or create its curriculum.</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-12 text-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Loading curriculum...</p>
            </div>
          ) : !curriculum ? (
            /* No curriculum — show create button */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-black text-slate-700">No Curriculum for {selectedCohort?.code}</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Create a curriculum to define training modules and course sessions.</p>
              <button
                onClick={handleCreateCurriculum}
                disabled={creatingCurriculum}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {creatingCurriculum ? "Creating..." : "+ Create Curriculum"}
              </button>
            </div>
          ) : (
            <>
              {/* Curriculum details card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {editingCurriculum ? (
                          <input type="text" value={curriculumDraft.title} onChange={(e) => setCurriculumDraft({ ...curriculumDraft, title: e.target.value })}
                            className="text-sm font-black text-slate-900 border-b-2 border-emerald-400 outline-none bg-transparent" />
                        ) : (
                          <h2 className="text-sm font-black text-slate-900">{curriculum.title}</h2>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_BADGE[curriculum.status] ?? STATUS_BADGE.Draft}`}>
                          {curriculum.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                          v{curriculum.version}
                        </span>
                      </div>
                      {editingCurriculum ? (
                        <textarea value={curriculumDraft.description ?? ""} onChange={(e) => setCurriculumDraft({ ...curriculumDraft, description: e.target.value })}
                          rows={2} className="text-[11px] text-slate-500 mt-1 w-full border border-slate-200 rounded-lg px-2 py-1 outline-none resize-none" />
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-0.5">{curriculum.description || "No description"}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingCurriculum ? (
                      <>
                        <button onClick={handleSaveCurriculum} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer">Save</button>
                        <button onClick={() => setEditingCurriculum(false)} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingCurriculum(true); setCurriculumDraft({ title: curriculum.title, description: curriculum.description ?? "" }); }}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    {curriculum.status === "Draft" && (
                      <button onClick={() => handleUpdateCurriculumStatus("Under Review")}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                        <Send className="w-3 h-3" /> Mark as Under Review
                      </button>
                    )}
                    {curriculum.status === "Under Review" && (
                      <button onClick={() => handleUpdateCurriculumStatus("Approved")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                    )}
                    <button onClick={handleGenerateCertificates}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                      <Star className="w-3 h-3" /> Generate Pass-Out Certificates
                    </button>
                  </div>
                </div>

                {/* Curriculum Modules (if any) */}
                {Array.isArray(curriculum.modules) && curriculum.modules.length > 0 && (
                  <div className="px-5 py-4 border-b border-slate-100 space-y-3">
                    <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wide">Training Modules</h3>
                    <div className="space-y-2">
                      {(curriculum.modules as any[]).map((mod: any, idx: number) => (
                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                          <button onClick={() => toggleModule(idx)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition-colors">
                            {expandedModules.has(idx) ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                            <span className="text-xs font-black text-slate-800">{mod.title}</span>
                            {mod.duration && <span className="ml-auto text-[10px] text-slate-400 font-mono">{mod.duration}</span>}
                          </button>
                          {expandedModules.has(idx) && (
                            <div className="px-4 py-3 bg-white border-t border-slate-100 space-y-2">
                              {mod.topics?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Topics</p>
                                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                                    {mod.topics.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                  </ul>
                                </div>
                              )}
                              {mod.objectives?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Objectives</p>
                                  <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                                    {mod.objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Course Outline sessions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">Course Outline</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sessions.length} session(s) scheduled</p>
                  </div>
                  <button onClick={() => { setShowAddSession(true); setNewSession({ ...newSession, sessionNumber: sessions.length + 1 }); }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Session
                  </button>
                </div>

                {/* Add session form */}
                {showAddSession && (
                  <div className="px-5 py-4 bg-emerald-50/30 border-b border-emerald-100 space-y-3">
                    <p className="text-[11px] font-black text-emerald-800">New Session</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Session #</label>
                        <input type="number" min={1} value={newSession.sessionNumber} onChange={(e) => setNewSession({ ...newSession, sessionNumber: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Topic</label>
                        <input type="text" value={newSession.topic} onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold" placeholder="e.g. Firearms Handling" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Instructor</label>
                        <input type="text" value={newSession.instructor} onChange={(e) => setNewSession({ ...newSession, instructor: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold" placeholder="Trainer name" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Date</label>
                        <input type="text" value={newSession.date} onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold" placeholder="YYYY-MM-DD" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Materials</label>
                        <input type="text" value={newSession.materials} onChange={(e) => setNewSession({ ...newSession, materials: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold" placeholder="Optional" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddSession}
                        disabled={!newSession.topic || !newSession.instructor || !newSession.date}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-50">
                        Save Session
                      </button>
                      <button onClick={() => setShowAddSession(false)} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[11px] font-bold cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Sessions table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5 w-16">Session</th>
                        <th className="px-3 py-2.5">Topic</th>
                        <th className="px-3 py-2.5">Instructor</th>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Materials</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          editing={editingSessionId === session.id}
                          onEdit={() => setEditingSessionId(session.id)}
                          onCancelEdit={() => setEditingSessionId(null)}
                          onDelete={() => handleDeleteSession(session.id)}
                          onUpdate={handleUpdateSession}
                        />
                      ))}
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center">
                            <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-semibold">No sessions in the course outline yet.</p>
                            <p className="text-[10px] text-slate-300 mt-1">Click "Add Session" to schedule training sessions.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
