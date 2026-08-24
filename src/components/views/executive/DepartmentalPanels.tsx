/**
 * Departmental deep-dive panels (Phase 1 placements of the executive stats
 * engine). Each panel owns the metrics registered under its department:
 *   - WorkforceAnalyticsPanel  → HR Manager (desertion, tenure, discipline load)
 *   - TrainingAnalyticsPanel   → Training Officer (cohort durations, pass-out)
 *   - OpsIncidentAgingPanel    → Operations Manager / Regional Managers
 * All numbers come from utils/executiveStats — no local re-derivation.
 */

import React from "react";
import { UserX, GraduationCap, TimerReset } from "lucide-react";
import { useDomainStore } from "../../../stores/domainStore";
import { useAuthStore } from "../../../stores/authStore";
import {
  officerStats,
  trainingStats,
  incidentStats,
  type StatsFilters,
} from "../../../utils/executiveStats";
import { PanelShell } from "./PanelShell";

const DEFAULT_FILTERS: StatsFilters = { period: "year", region: null };

function MetricRow({ label, value, unit, tone }: { label: string; value: number | string; unit?: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      <span className={`text-sm font-black ${tone ?? "text-slate-800"}`}>
        {value}
        {unit && <span className="text-[10px] font-bold text-slate-400 ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

/** HR Manager: desertion rate, tenure-at-desertion, discipline early-warning load. */
export const WorkforceAnalyticsPanel: React.FC<{ filters?: StatsFilters }> = ({ filters: filtersProp }) => {
  const filters = filtersProp ?? DEFAULT_FILTERS;
  const officers = useDomainStore((s) => s.securityOfficers);
  const s = officerStats(officers, filters);
  return (
    <PanelShell
      icon={<UserX className="w-4 h-4 text-rose-500" />}
      title="Workforce Deep-Dive — Desertion & Discipline"
      badge={`${s.desertedInPeriod}/${s.joinedInPeriod + s.desertedInPeriod}`}
      badgeTone={s.desertionRatePct > 10 ? "rose" : "slate"}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <MetricRow label="Desertion rate (period)" value={s.desertionRatePct} unit="%" tone={s.desertionRatePct > 10 ? "text-rose-600" : undefined} />
        <MetricRow label="Desertions in period" value={s.desertedInPeriod} tone={s.desertedInPeriod > 0 ? "text-rose-600" : undefined} />
        <MetricRow label="Avg tenure at desertion" value={Number.isNaN(s.avgTenureAtDesertionDays) ? "—" : s.avgTenureAtDesertionDays} unit="days" />
        <MetricRow label="Avg days to pass out" value={Number.isNaN(s.avgDaysToPassOut) ? "—" : s.avgDaysToPassOut} unit="days" />
        <MetricRow label="Probation pending" value={s.probationPending} />
        <MetricRow label="Officers with 2+ warning letters" value={s.warningLetterFlagged} tone={s.warningLetterFlagged > 0 ? "text-amber-600" : undefined} />
        <MetricRow label="Armed qualified" value={s.armedQualifiedPct} unit="%" />
        <MetricRow label="K9 / medical cleared" value={`${s.k9QualifiedPct}% / ${s.medicalClearedPct}%`} />
      </div>
    </PanelShell>
  );
};

/** Training Officer: cohort durations at the school and pass-out throughput. */
export const TrainingAnalyticsPanel: React.FC<{ filters?: StatsFilters }> = ({ filters: filtersProp }) => {
  const filters = filtersProp ?? DEFAULT_FILTERS;
  const cohorts = useDomainStore((s) => s.trainingCohorts);
  const trainees = useDomainStore((s) => s.recruitTrainees);
  const t = trainingStats(cohorts, trainees);
  return (
    <PanelShell
      icon={<GraduationCap className="w-4 h-4 text-violet-500" />}
      title="Training School Analytics"
      badge={`${t.recruitsInTraining} in training`}
      badgeTone="slate"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <MetricRow label="Cohorts in session" value={t.cohortsInSession} />
          <MetricRow label="Avg cohort duration" value={Number.isNaN(t.avgCohortDurationDays) ? "—" : t.avgCohortDurationDays} unit="days" />
          <MetricRow label="Pass-out rate" value={t.passOutRatePct} unit="%" />
          <MetricRow label="Deferred / disqualified" value={`${t.deferred} / ${t.disqualified}`} />
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-500 font-black uppercase text-[10px]">
                <th className="text-left px-3 py-2">Cohort</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Days at school</th>
              </tr>
            </thead>
            <tbody>
              {t.cohortDurations.slice(0, 5).map((c) => (
                <tr key={c.code} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-bold text-slate-700">{c.code}</td>
                  <td className="px-3 py-1.5 text-slate-500">{c.status}</td>
                  <td className="px-3 py-1.5 text-right font-black text-slate-800">{c.days}</td>
                </tr>
              ))}
              {t.cohortDurations.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400 font-medium">No cohorts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
};

/** Operations Manager / Regional Managers: incident aging & resolution speed. */
export const OpsIncidentAgingPanel: React.FC<{ filters?: StatsFilters }> = ({ filters: filtersProp }) => {
  const filters = filtersProp ?? DEFAULT_FILTERS;
  const incidents = useDomainStore((s) => s.incidents);
  const sites = useDomainStore((s) => s.sites);
  const i = incidentStats(incidents, filters);
  return (
    <PanelShell
      icon={<TimerReset className="w-4 h-4 text-cyan-600" />}
      title="Incident Aging"
      badge={`${i.open + i.underInvestigation} open`}
      badgeTone={i.criticalOpen > 0 ? "rose" : "slate"}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <MetricRow label="Open incidents" value={i.open} tone={i.open > 0 ? "text-amber-600" : undefined} />
        <MetricRow label="Under investigation" value={i.underInvestigation} />
        <MetricRow label="Critical unresolved" value={i.criticalOpen} tone={i.criticalOpen > 0 ? "text-rose-600" : undefined} />
        <MetricRow label="Escalated" value={i.escalated} />
        <MetricRow label="Avg age of open incidents" value={Number.isNaN(i.avgAgeOpenDays) ? "—" : i.avgAgeOpenDays} unit="days" />
        <MetricRow label="Avg resolution time" value={Number.isNaN(i.avgResolutionDays) ? "—" : i.avgResolutionDays} unit="days" />
      </div>
      <p className="mt-3 text-[11px] font-semibold text-slate-400">
        Across {sites.length} contract sites · resolved-in-window average from incidents closed this period.
      </p>
    </PanelShell>
  );
};
