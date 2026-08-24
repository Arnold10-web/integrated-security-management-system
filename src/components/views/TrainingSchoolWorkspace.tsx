/**
 * Training School workspace — tabbed dashboard shell for the Training Officer.
 *
 * Tabs keep each concern on its own screen instead of one long page:
 *   1. Pipeline     — Receive → Train → Pass Out over SecurityOfficer records
 *   2. Cohorts      — intake cohort cards (create/edit/archive)
 *   3. Assessments  — recruit trainee score records (inline editing, no recruit
 *                     creation and no force-number allocation from this role)
 *   4. Analytics    — executive stats panel (cohort durations, pass-out rate)
 */
import React, { useMemo, useState } from "react";
import { GraduationCap, BookOpen, ClipboardList, BarChart3 } from "lucide-react";
import { useDomainStore } from "../../stores/domainStore";
import { useAuthStore } from "../../stores/authStore";
import type { RecruitTrainee, TrainingCohort } from "../../types";
import { TrainingPipelineView } from "./TrainingPipelineView";
import { TrainingCohortCardGrid, AddCohortModal } from "../organisms";
import { TrainingAnalyticsPanel } from "./executive/DepartmentalPanels";
import { STAGE_BADGE_CLASS, STAGE_LABEL } from "../../utils/trainingPipeline";

type WorkspaceTab = "pipeline" | "cohorts" | "assessments" | "analytics";

const TABS: { key: WorkspaceTab; label: string; icon: React.ReactNode }[] = [
  { key: "pipeline", label: "Pipeline", icon: <GraduationCap className="w-4 h-4 text-emerald-400" /> },
  { key: "cohorts", label: "Cohorts", icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
  { key: "assessments", label: "Assessments", icon: <ClipboardList className="w-4 h-4 text-emerald-400" /> },
  { key: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
];

interface AssessmentRowProps {
  trainee: RecruitTrainee;
  onSave: (id: string, updates: Partial<RecruitTrainee>) => void;
}

/** Inline-editable score row for one recruit trainee record. */
const AssessmentRow: React.FC<AssessmentRowProps> = ({ trainee: t, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [drill, setDrill] = useState(t.drillScore);
  const [marks, setMarks] = useState(t.marksmanshipScore);
  const [theory, setTheory] = useState(t.theoryScore);

  const avg = Math.round((t.drillScore + t.marksmanshipScore + t.theoryScore) / 3);
  const stage = t.overallStatus as keyof typeof STAGE_LABEL;

  const save = () => {
    onSave(t.id, { drillScore: Number(drill), marksmanshipScore: Number(marks), theoryScore: Number(theory) });
    setEditing(false);
  };

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="font-bold text-slate-900">{t.fullName}</div>
        <div className="text-xs text-slate-500">{t.traineeCode}</div>
      </td>
      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{t.assignedForceNumber ?? "—"}</td>
      <td className="px-4 py-3 text-slate-700 text-xs">{t.cohortName}</td>
      {editing ? (
        <>
          <td className="px-2 py-3">
            <input type="number" min={0} max={100} value={drill} onChange={(e) => setDrill(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold" />
          </td>
          <td className="px-2 py-3">
            <input type="number" min={0} max={100} value={marks} onChange={(e) => setMarks(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold" />
          </td>
          <td className="px-2 py-3">
            <input type="number" min={0} max={100} value={theory} onChange={(e) => setTheory(Number(e.target.value))}
              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold" />
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 font-mono text-slate-700">{t.drillScore}</td>
          <td className="px-4 py-3 font-mono text-slate-700">{t.marksmanshipScore}</td>
          <td className="px-4 py-3 font-mono text-slate-700">{t.theoryScore}</td>
        </>
      )}
      <td className="px-4 py-3 font-mono font-black text-slate-900">{avg}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${STAGE_BADGE_CLASS[stage] ?? ""}`}>
          {STAGE_LABEL[stage] ?? t.overallStatus}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex justify-end gap-1">
            <button onClick={save} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white cursor-pointer hover:bg-emerald-700">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs cursor-pointer hover:bg-slate-50">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold cursor-pointer hover:bg-slate-50">
            Edit Scores
          </button>
        )}
      </td>
    </tr>
  );
};

export const TrainingSchoolWorkspace: React.FC = () => {
  const [tab, setTab] = useState<WorkspaceTab>("pipeline");
  const [showAddCohort, setShowAddCohort] = useState(false);
  const [assessmentCohortFilter, setAssessmentCohortFilter] = useState("ALL");
  const [assessmentQuery, setAssessmentQuery] = useState("");

  const domain = useDomainStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  // Recruit assessment records indexed by the officer force number HR assigned.
  const traineeByForceNumber = useMemo(
    () =>
      Object.fromEntries(
        domain.recruitTrainees
          .filter((t) => t.assignedForceNumber)
          .map((t) => [
            t.assignedForceNumber!,
            { drillScore: t.drillScore, marksmanshipScore: t.marksmanshipScore, theoryScore: t.theoryScore, cohortName: t.cohortName },
          ])
      ),
    [domain.recruitTrainees]
  );

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const counts: Record<WorkspaceTab, string> = {
    pipeline: `${domain.securityOfficers.filter((g) => g.lifecycleStage === "IN_TRAINING").length} in training`,
    cohorts: `${domain.trainingCohorts.length}`,
    assessments: `${domain.recruitTrainees.length}`,
    analytics: "",
  };

  const filteredAssessments = domain.recruitTrainees.filter((t) => {
    if (assessmentCohortFilter !== "ALL" && t.cohortId !== assessmentCohortFilter) return false;
    if (assessmentQuery && !t.fullName.toLowerCase().includes(assessmentQuery.toLowerCase()) && !t.traineeCode.toLowerCase().includes(assessmentQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Shared banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
              Operations Department • Security Officer Training Division
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-emerald-400" />
            Security Officer Training Academy
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            Officers arrive registered by HR — force number, bank and biodata are already on file. Receive sent
            recruits into training, record assessment scores, then pass them out on the same record.
            {currentUser?.name ? ` Signed in: ${currentUser.name}.` : ""}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-emerald-300 uppercase tracking-wider shrink-0 h-fit">
          Training School Officer
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
              tab === t.key
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {t.icon}
            <span>
              {t.label}
              {counts[t.key] && <span className={`ml-1 ${tab === t.key ? "text-slate-300" : "text-slate-400"}`}>({counts[t.key]})</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: Pipeline */}
      {tab === "pipeline" && (
        <TrainingPipelineView
          securityOfficers={domain.securityOfficers}
          traineeByForceNumber={traineeByForceNumber}
          onReceiveTrainee={(forceNumber) => domain.moveSecurityOfficerLifecycle(forceNumber, { lifecycleStage: "IN_TRAINING" })}
          onPassOutTrainee={(forceNumber) => {
            const g = domain.securityOfficers.find((x) => x.id === forceNumber);
            domain.moveSecurityOfficerLifecycle(forceNumber, {
              lifecycleStage: "PASSED_OUT",
              passedOutDate: todayISO(),
              certifications: Array.from(
                new Set([...(g?.certifications ?? []), "Pass-Out Drill Certification", "Tactical & Firearms Proficiency"])
              ),
            });
          }}
        />
      )}

      {/* Tab: Cohorts */}
      {tab === "cohorts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Intake Cohorts &amp; Curriculum</h2>
              <p className="text-xs text-slate-500 mt-0.5">Create intakes, assign instructors, and track cohort progress.</p>
            </div>
            <button
              onClick={() => setShowAddCohort(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shrink-0 cursor-pointer"
            >
              + Create Intake Cohort
            </button>
          </div>
          <TrainingCohortCardGrid
            cohorts={domain.trainingCohorts}
            onViewSecurityOfficers={(cohortId) => {
              setAssessmentCohortFilter(cohortId);
              setTab("assessments");
            }}
            onDeleteCohort={domain.deleteCohort}
            onUpdateCohort={domain.updateCohort}
          />
          <AddCohortModal show={showAddCohort} onClose={() => setShowAddCohort(false)} onSubmit={domain.addCohort} />
        </div>
      )}

      {/* Tab: Assessments */}
      {tab === "assessments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Recruit Assessment Records</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drill, marksmanship and theory scores per recruit. Pass-out happens on the Pipeline tab.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={assessmentCohortFilter}
                onChange={(e) => setAssessmentCohortFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="ALL">All Cohorts ({domain.trainingCohorts.length})</option>
                {domain.trainingCohorts.map((c: TrainingCohort) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search recruit or code…"
                value={assessmentQuery}
                onChange={(e) => setAssessmentQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold w-full sm:w-56 outline-none"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Recruit</th>
                    <th className="px-4 py-3 text-left">Force Number</th>
                    <th className="px-4 py-3 text-left">Cohort</th>
                    <th className="px-4 py-3 text-left">Drill</th>
                    <th className="px-4 py-3 text-left">Marks</th>
                    <th className="px-4 py-3 text-left">Theory</th>
                    <th className="px-4 py-3 text-left">Avg</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((t) => (
                    <AssessmentRow key={t.id} trainee={t} onSave={domain.updateTrainee} />
                  ))}
                  {filteredAssessments.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        No assessment records match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Analytics */}
      {tab === "analytics" && <TrainingAnalyticsPanel />}
    </div>
  );
};
