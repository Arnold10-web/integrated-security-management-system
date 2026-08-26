/**
 * Training School pipeline — the "Receive → Train → Pass Out" working surface.
 *
 * Rendered inside TrainingSchoolWorkspace (which owns the page banner and
 * navigation tabs). Canonical subject: the SecurityOfficer record HR creates at
 * recruitment (force number, bank details and biodata already exist before the
 * recruit arrives at the school). This view never creates officers or force
 * numbers:
 *   - "Receive" moves HANDED_TO_OPERATIONS → IN_TRAINING (lifecycle route)
 *   - "Pass Out" moves IN_TRAINING → PASSED_OUT on the same officer record,
 *     stamps passedOutDate, appends certifications; certificate download from
 *     the row afterwards.
 */
import React, { useMemo, useState } from "react";
import { Search, Inbox, Users, Award, FileDown } from "lucide-react";
import type { SecurityOfficer } from "../../types";
import {
  PIPELINE_TABS,
  STAGE_LABEL,
  STAGE_BADGE_CLASS,
  officerPipelineKpis,
  filterOfficers,
  canReceiveOfficer,
  canPassOutOfficer,
  type PipelineTab,
} from "../../utils/trainingPipeline";
import { downloadPassOutCertificate } from "../../utils/passOutCertificate";
import { formatDate } from "../../utils";

interface TrainingPipelineViewProps {
  securityOfficers: SecurityOfficer[];
  /** Recruit assessment records keyed by the officer they belong to. */
  traineeByForceNumber?: Record<
    string,
    { drillScore: number; marksmanshipScore: number; theoryScore: number; cohortName: string }
  >;
  onReceiveTrainee: (forceNumber: string) => void;
  onPassOutTrainee: (forceNumber: string) => void;
}

const stageOf = (g: SecurityOfficer): "Awaiting Reception" | "Under Training" | "Graduated & Certified" =>
  g.lifecycleStage === "HANDED_TO_OPERATIONS"
    ? "Awaiting Reception"
    : g.lifecycleStage === "PASSED_OUT"
      ? "Graduated & Certified"
      : "Under Training";

export const TrainingPipelineView: React.FC<TrainingPipelineViewProps> = ({
  securityOfficers,
  traineeByForceNumber = {},
  onReceiveTrainee,
  onPassOutTrainee,
}) => {
  const [tab, setTab] = useState<PipelineTab>("ALL");
  const [query, setQuery] = useState("");
  const [certTarget, setCertTarget] = useState<SecurityOfficer | null>(null);

  const kpis = useMemo(() => officerPipelineKpis(securityOfficers), [securityOfficers]);
  const filtered = useMemo(() => filterOfficers(securityOfficers, tab, query), [securityOfficers, tab, query]);

  const issueCertificate = async (g: SecurityOfficer) => {
    const scores = traineeByForceNumber[g.forceNumber];
    const drill = scores?.drillScore ?? 80;
    const marks = scores?.marksmanshipScore ?? 80;
    const theory = scores?.theoryScore ?? 80;
    await downloadPassOutCertificate({
      fullName: g.fullName,
      forceNumber: g.forceNumber,
      nationalId: g.nationalId,
      passedOutDate: g.passedOutDate ?? new Date().toISOString().slice(0, 10),
      cohortName: scores?.cohortName,
      drillScore: drill,
      marksmanshipScore: marks,
      theoryScore: theory,
      overallScore: Math.round((drill + marks + theory) / 3),
      trainingOfficerName: "Training Officer",
    });
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1" title="Officers sent here by Operations and waiting to be received into a cohort">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Awaiting Reception</span>
            <Inbox className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.awaiting}</div>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1" title="Currently enrolled in an active cohort at the academy">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Under Training</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.inTraining}</div>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1" title="Graduated and returned to Operations, which assigns their deployment">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Passed Out</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.passedOut}</div>
        </div>
      </div>

      {/* Incoming queue */}
      {kpis.awaiting > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-amber-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Incoming Queue
            </h2>
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              {kpis.awaiting} waiting
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {securityOfficers
              .filter(canReceiveOfficer)
              .map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-2 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {g.fullName}
                      <span className="ml-2 text-xs font-mono font-semibold text-slate-500">{g.forceNumber}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Registered by HR • joined {formatDate(g.joinDate)} • {g.location ?? "—"}
                    </div>
                  </div>
                  <button
                    onClick={() => onReceiveTrainee(g.id)}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition-all shrink-0 cursor-pointer"
                  >
                    Receive &amp; Admit
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {PIPELINE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold cursor-pointer transition-all ${
                tab === t
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
              }`}
            >
              {t === "ALL" ? "All" : STAGE_LABEL[t as keyof typeof STAGE_LABEL] ?? t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search name or force number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs"
          />
        </div>
      </div>

      {/* Pipeline table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Security Officer</th>
                <th className="px-4 py-3 text-left">Force Number</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Avg Score</th>
                <th className="px-4 py-3 text-left">Passed Out</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => {
                const scores = traineeByForceNumber[g.forceNumber];
                const avg = scores
                  ? Math.round((scores.drillScore + scores.marksmanshipScore + scores.theoryScore) / 3)
                  : null;
                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{g.fullName}</div>
                      <div className="text-xs text-slate-500">{scores?.cohortName ?? g.location ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{g.forceNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${STAGE_BADGE_CLASS[stageOf(g)]}`}>
                        {STAGE_LABEL[stageOf(g)]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{avg ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {g.passedOutDate ? formatDate(String(g.passedOutDate).slice(0, 10)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canReceiveOfficer(g) && (
                          <button
                            onClick={() => onReceiveTrainee(g.id)}
                            title="Admit into training — officer moves to the Under Training list"
                            className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white cursor-pointer hover:bg-slate-800"
                          >
                            Receive
                          </button>
                        )}
                        {canPassOutOfficer(g) && (
                          <button
                            onClick={() => onPassOutTrainee(g.id)}
                            title="Graduate this officer — marks them Passed Out with today's date, adds pass-out certifications, and returns them to Operations for deployment"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white cursor-pointer hover:bg-emerald-700"
                          >
                            Pass Out
                          </button>
                        )}
                        {g.lifecycleStage === "PASSED_OUT" && (
                          <button
                            onClick={() => issueCertificate(g)}
                            title="Download pass-out certificate (PDF)"
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Certificate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {query || tab !== "ALL"
                      ? "No officers match this filter."
                      : kpis.awaiting + kpis.inTraining + kpis.passedOut === 0
                        ? "No recruits have been sent yet. Officers appear here once Operations sends them to the school."
                        : "All officers accounted for."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
