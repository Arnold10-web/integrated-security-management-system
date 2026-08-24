/**
 * Executive statistics engine — the single source of truth for every
 * dashboard/report number in ISCMS (metric registry pattern).
 *
 * Rules:
 *  - Every metric has exactly ONE definition here (id → compute).
 *  - Views render registry values; they never re-derive numbers.
 *  - All functions are pure so they can be unit-tested deterministically.
 */

import type {
  SecurityOfficer,
  User,
  ClientSite,
  Complaint,
  Incident,
  TrainingCohort,
  RecruitTrainee,
} from "../types";

/* ─────────────────────────── Filters ─────────────────────────── */

export type PeriodKey = "month" | "quarter" | "year" | "all";

export interface StatsFilters {
  period: PeriodKey;
  /** ISO date the window ends at (defaults to now); enables deterministic tests */
  referenceDate?: string;
  /** Region filter; null/undefined = all regions */
  region?: string | null;
}

const DAY_MS = 86_400_000;

function refEnd(filters: StatsFilters): Date {
  return filters.referenceDate ? new Date(filters.referenceDate) : new Date();
}

function periodStart(filters: StatsFilters): Date | null {
  if (filters.period === "all") return null;
  const end = refEnd(filters);
  const d = new Date(end);
  if (filters.period === "month") d.setMonth(d.getMonth() - 1);
  else if (filters.period === "quarter") d.setMonth(d.getMonth() - 3);
  else d.setFullYear(d.getFullYear() - 1);
  return d;
}

/** True when an ISO date string falls inside the filtered window (inclusive). */
export function inPeriod(dateIso: string | undefined | null, filters: StatsFilters): boolean {
  if (!dateIso) return false;
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return false;
  const start = periodStart(filters);
  if (start && t < start.getTime()) return false;
  return t <= refEnd(filters).getTime();
}

function inRegion(recordRegion: string | undefined | null, filters: StatsFilters): boolean {
  if (!filters.region) return true;
  return !!recordRegion && recordRegion === filters.region;
}

/** Days between two ISO dates; negative-safe, NaN-free. */
export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.max(0, Math.round((b - a) / DAY_MS));
}

function average(values: number[]): number {
  const clean = values.filter((v) => !Number.isNaN(v));
  if (clean.length === 0) return NaN;
  return clean.reduce((s, v) => s + v, 0) / clean.length;
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/* ─────────────────────────── Sections ─────────────────────────── */

export interface RegionCount { region: string; count: number }

export interface OfficerStats {
  total: number;
  onDuty: number;
  desertedTotal: number;
  desertedInPeriod: number;
  joinedInPeriod: number;
  /** desertions ÷ (desertions + active joiners) within the window, as % */
  desertionRatePct: number;
  /** average days between joinDate and desertionDate */
  avgTenureAtDesertionDays: number;
  /** average days between joinDate and passedOutDate (school time) */
  avgDaysToPassOut: number;
  probationPending: number;
  armedQualifiedPct: number;
  k9QualifiedPct: number;
  medicalClearedPct: number;
  warningLetterFlagged: number;
  byRegion: RegionCount[];
  byDesignation: RegionCount[];
}

export function officerStats(officers: SecurityOfficer[], filters: StatsFilters): OfficerStats {
  const scoped = officers.filter((o) => inRegion(o.region ?? o.location, filters));
  const deserted = scoped.filter((o) => o.isDeserter);
  const desertedInPeriod = deserted.filter((o) => inPeriod(o.desertionDate ?? o.terminationDate, filters));
  const joinedInPeriod = scoped.filter((o) => inPeriod(o.joinDate, filters));
  const tenures = deserted.map((o) => daysBetween(o.joinDate, o.desertionDate ?? o.terminationDate ?? "")).filter((v) => !Number.isNaN(v));
  const schoolDays = scoped
    .filter((o) => o.passedOutDate)
    .map((o) => daysBetween(o.joinDate, o.passedOutDate!))
    .filter((v) => !Number.isNaN(v));

  const groupBy = (items: SecurityOfficer[], key: (o: SecurityOfficer) => string | undefined): RegionCount[] => {
    const map = new Map<string, number>();
    for (const item of items) {
      const k = key(item);
      if (!k) continue;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count);
  };

  const denom = desertedInPeriod.length + joinedInPeriod.filter((o) => !o.isDeserter).length;

  return {
    total: scoped.length,
    onDuty: scoped.filter((o) => o.status === "On Duty").length,
    desertedTotal: deserted.length,
    desertedInPeriod: desertedInPeriod.length,
    joinedInPeriod: joinedInPeriod.length,
    desertionRatePct: pct(desertedInPeriod.length, denom),
    avgTenureAtDesertionDays: Math.round(average(tenures)),
    avgDaysToPassOut: Math.round(average(schoolDays)),
    probationPending: scoped.filter((o) => !o.finishedProbation).length,
    armedQualifiedPct: pct(scoped.filter((o) => o.armedQualified).length, scoped.length),
    k9QualifiedPct: pct(scoped.filter((o) => o.k9Qualified).length, scoped.length),
    medicalClearedPct: pct(scoped.filter((o) => o.medicalCleared).length, scoped.length),
    warningLetterFlagged: scoped.filter((o) => (o.warningLettersCount ?? 0) >= 2).length,
    byRegion: groupBy(scoped, (o) => o.region),
    byDesignation: groupBy(scoped, (o) => o.designation?.replace(/_/g, " ")),
  };
}

export interface TrainingStats {
  cohortsInSession: number;
  recruitsInTraining: number;
  graduated: number;
  deferred: number;
  disqualified: number;
  passOutRatePct: number;
  /** average cohort length in days (startDate → endDate) */
  avgCohortDurationDays: number;
  cohortDurations: { code: string; name: string; days: number; status: string }[];
}

export function trainingStats(cohorts: TrainingCohort[], trainees: RecruitTrainee[]): TrainingStats {
  const durations = cohorts
    .map((c) => ({ code: c.code, name: c.name, days: daysBetween(c.startDate, c.endDate), status: c.status }))
    .filter((c) => !Number.isNaN(c.days));
  const graduated = trainees.filter((t) => t.overallStatus === "Graduated & Certified").length;
  return {
    cohortsInSession: cohorts.filter((c) => c.status === "In Session").length,
    recruitsInTraining: trainees.filter((t) => t.overallStatus === "Under Training").length,
    graduated,
    deferred: trainees.filter((t) => t.overallStatus === "Deferred").length,
    disqualified: trainees.filter((t) => t.overallStatus === "Disqualified").length,
    passOutRatePct: pct(graduated, trainees.length),
    avgCohortDurationDays: Math.round(average(durations.map((d) => d.days))),
    cohortDurations: durations.sort((a, b) => b.days - a.days),
  };
}

export interface SiteClientStats {
  uniqueClients: number;
  sites: number;
  compliant: number;
  understaffed: number;
  attentionNeeded: number;
  compliancePct: number;
  byRegion: RegionCount[];
}

export function siteClientStats(sites: ClientSite[], filters: StatsFilters): SiteClientStats {
  const scoped = sites.filter((s) => inRegion(s.region, filters));
  const compliant = scoped.filter((s) => s.slaStatus === "Compliant").length;
  return {
    uniqueClients: new Set(scoped.map((s) => s.clientName)).size,
    sites: scoped.length,
    compliant,
    understaffed: scoped.filter((s) => s.slaStatus === "Understaffed").length,
    attentionNeeded: scoped.filter((s) => s.slaStatus === "Attention Needed").length,
    compliancePct: pct(compliant, scoped.length),
    byRegion: [...scoped.reduce((m, s) => {
      if (s.region) m.set(s.region, (m.get(s.region) ?? 0) + 1);
      return m;
    }, new Map<string, number>())].map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count),
  };
}

export interface StaffRegisterStats {
  total: number;
  active: number;
  suspendedOrInactive: number;
  byDepartment: RegionCount[];
  byRegion: RegionCount[];
}

/** Staff = the HR staff register (non-security-officer system accounts). */
export function staffRegisterStats(users: User[], officers: SecurityOfficer[], filters: StatsFilters): StaffRegisterStats {
  const officerForceNumbers = new Set(officers.map((o) => o.forceNumber));
  const staff = users.filter(
    (u) => inRegion(u.region, filters) && !(u.forceNumber && officerForceNumbers.has(u.forceNumber))
  );
  const groupBy = (key: (u: User) => string | undefined): RegionCount[] =>
    [...staff.reduce((m, u) => {
      const k = key(u);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
      return m;
    }, new Map<string, number>())].map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count);

  return {
    total: staff.length,
    active: staff.filter((u) => u.status === "Active").length,
    suspendedOrInactive: staff.filter((u) => u.status !== "Active").length,
    byDepartment: groupBy((u) => u.department),
    byRegion: groupBy((u) => u.region),
  };
}

export interface ComplaintStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  referred: number;
  byCategory: RegionCount[];
}

export function complaintStats(complaints: Complaint[], filters: StatsFilters): ComplaintStats {
  const scoped = complaints.filter((c) => inPeriod(c.reportedDate, filters) && inRegion(c.region, filters));
  const byCategory = new Map<string, number>();
  for (const c of scoped) byCategory.set(c.category, (byCategory.get(c.category) ?? 0) + 1);
  return {
    total: scoped.length,
    open: scoped.filter((c) => c.status === "Open").length,
    investigating: scoped.filter((c) => c.status === "Investigating").length,
    resolved: scoped.filter((c) => c.status === "Resolved").length,
    referred: scoped.filter((c) => c.status === "Referred").length,
    byCategory: [...byCategory.entries()].map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count),
  };
}

export interface IncidentStats {
  totalInPeriod: number;
  open: number;
  underInvestigation: number;
  escalated: number;
  criticalOpen: number;
  /** average age in days of currently-open incidents */
  avgAgeOpenDays: number;
  /** average days from incidentDate to resolvedAt for incidents resolved in-window */
  avgResolutionDays: number;
  bySeverityCritical: number;
}

export function incidentStats(incidents: Incident[], filters: StatsFilters): IncidentStats {
  const scoped = incidents.filter((i) => inRegion(i.region, filters));
  const inWindow = scoped.filter((i) => inPeriod(i.incidentDate, filters));
  const openish = scoped.filter((i) => i.status !== "Resolved");
  const resolvedInWindow = scoped.filter((i) => i.resolvedAt && inPeriod(i.resolvedAt, filters));
  const endIso = refEnd(filters).toISOString();
  return {
    totalInPeriod: inWindow.length,
    open: scoped.filter((i) => i.status === "Open").length,
    underInvestigation: scoped.filter((i) => i.status === "Under Investigation").length,
    escalated: scoped.filter((i) => i.status === "Escalated").length,
    criticalOpen: openish.filter((i) => i.severity === "Critical").length,
    avgAgeOpenDays: Math.round(average(openish.map((i) => daysBetween(i.incidentDate, endIso)))),
    avgResolutionDays: Math.round(average(resolvedInWindow.map((i) => daysBetween(i.incidentDate, i.resolvedAt!)))),
    bySeverityCritical: inWindow.filter((i) => i.severity === "Critical").length,
  };
}

/* ─────────────────────────── Trends ─────────────────────────── */

export interface TrendPoint { key: string; label: string; count: number }

/** Buckets dated records into the last `months` calendar months ending at the reference date. */
export function monthlyTrend(
  items: { date?: string | null }[],
  months: number,
  referenceDate?: string
): TrendPoint[] {
  const end = referenceDate ? new Date(referenceDate) : new Date();
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      key,
      label: d.toLocaleString("en-GB", { month: "short", year: "numeric" }),
      count: 0,
    });
  }
  const index = new Map(points.map((p) => [p.key, p]));
  for (const item of items) {
    if (!item.date) continue;
    const t = new Date(item.date);
    if (Number.isNaN(t.getTime())) continue;
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
    const point = index.get(key);
    if (point) point.count += 1;
  }
  return points;
}

/* ─────────────────────────── Regional breakdown ─────────────────────────── */

export interface RegionalRow {
  region: string;
  officers: number;
  deserted: number;
  sites: number;
  clients: number;
  complaints: number;
  incidents: number;
}

export function regionalBreakdown(bundle: StatsBundle, filters: StatsFilters): RegionalRow[] {
  const map = new Map<string, RegionalRow>();
  const row = (region: string): RegionalRow => {
    if (!map.has(region)) map.set(region, { region, officers: 0, deserted: 0, sites: 0, clients: 0, complaints: 0, incidents: 0 });
    return map.get(region)!;
  };
  for (const o of bundle.officers) {
    if (!inRegion(o.region, filters)) continue;
    row(o.region!).officers += 1;
    if (o.isDeserter) row(o.region!).deserted += 1;
  }
  const seenClients = new Map<string, Set<string>>();
  for (const s of bundle.sites) {
    if (!inRegion(s.region, filters)) continue;
    row(s.region!).sites += 1;
    const set = seenClients.get(s.region!) ?? new Set<string>();
    set.add(s.clientName);
    seenClients.set(s.region!, set);
  }
  for (const [region, set] of seenClients) row(region).clients = set.size;
  for (const c of bundle.complaints) {
    if (!inPeriod(c.reportedDate, filters) || !inRegion(c.region, filters) || c.status === "Resolved") continue;
    row(c.region!).complaints += 1;
  }
  for (const i of bundle.incidents) {
    if (!inPeriod(i.incidentDate, filters) || !inRegion(i.region, filters) || i.status === "Resolved") continue;
    row(i.region!).incidents += 1;
  }
  return [...map.values()].sort((a, b) => b.officers - a.officers);
}

/* ─────────────────────────── Metric registry ─────────────────────────── */

export interface StatsBundle {
  officers: SecurityOfficer[];
  users: User[];
  sites: ClientSite[];
  complaints: Complaint[];
  incidents: Incident[];
  trainingCohorts: TrainingCohort[];
  recruitTrainees: RecruitTrainee[];
}

export type MetricSection = "Workforce" | "Training School" | "Operations" | "Discipline" | "Clients & Sites";

export interface MetricDef<T = unknown> {
  id: string;
  label: string;
  section: MetricSection;
  owner: string;
  unit: "count" | "pct" | "days";
  description: string;
  compute: (bundle: StatsBundle, filters: StatsFilters) => T;
}

/**
 * The registry. One definition per metric — dashboards pick headline ids,
 * departmental dashboards own their section deeply, reports render everything.
 */
export const METRIC_REGISTRY: MetricDef<any>[] = [
  // Workforce (owner: HR Manager)
  { id: "workforce.totalOfficers", label: "Security Officers", section: "Workforce", owner: "HR Manager", unit: "count", description: "Total security officers on the register.", compute: (b, f) => officerStats(b.officers, f).total },
  { id: "workforce.onDuty", label: "On Duty Now", section: "Workforce", owner: "HR Manager", unit: "count", description: "Officers currently marked On Duty.", compute: (b, f) => officerStats(b.officers, f).onDuty },
  { id: "workforce.desertionRate", label: "Desertion Rate", section: "Workforce", owner: "HR Manager", unit: "pct", description: "Desertions vs intake in the selected period.", compute: (b, f) => officerStats(b.officers, f).desertionRatePct },
  { id: "workforce.avgTenureAtDesertion", label: "Avg Tenure at Desertion", section: "Workforce", owner: "HR Manager", unit: "days", description: "Average days served before deserting.", compute: (b, f) => officerStats(b.officers, f).avgTenureAtDesertionDays },
  { id: "workforce.avgDaysToPassOut", label: "Avg Days to Pass Out", section: "Workforce", owner: "Training Officer", unit: "days", description: "Average days from enrolment to passing out.", compute: (b, f) => officerStats(b.officers, f).avgDaysToPassOut },
  { id: "workforce.probationPending", label: "Probation Pending", section: "Workforce", owner: "HR Manager", unit: "count", description: "Officers who have not finished probation.", compute: (b, f) => officerStats(b.officers, f).probationPending },
  { id: "workforce.warningFlagged", label: "Repeat Warning Letters", section: "Discipline", owner: "HR Manager", unit: "count", description: "Officers with 2+ warning letters.", compute: (b, f) => officerStats(b.officers, f).warningLetterFlagged },

  // Training school (owner: Training Officer)
  { id: "training.recruits", label: "Recruits In Training", section: "Training School", owner: "Training Officer", unit: "count", description: "Trainees currently under training.", compute: (b) => trainingStats(b.trainingCohorts, b.recruitTrainees).recruitsInTraining },
  { id: "training.passOutRate", label: "Pass-out Rate", section: "Training School", owner: "Training Officer", unit: "pct", description: "Graduated & certified share of all trainees.", compute: (b) => trainingStats(b.trainingCohorts, b.recruitTrainees).passOutRatePct },
  { id: "training.cohortDuration", label: "Avg Cohort Duration", section: "Training School", owner: "Training Officer", unit: "days", description: "Average days a cohort spends at the school.", compute: (b) => trainingStats(b.trainingCohorts, b.recruitTrainees).avgCohortDurationDays },

  // Operations (owner: Operations Manager)
  { id: "ops.openIncidents", label: "Open Incidents", section: "Operations", owner: "Operations Manager", unit: "count", description: "Incidents not yet resolved.", compute: (b, f) => incidentStats(b.incidents, f).open + incidentStats(b.incidents, f).underInvestigation },
  { id: "ops.incidentAging", label: "Avg Open Incident Age", section: "Operations", owner: "Operations Manager", unit: "days", description: "Average age of unresolved incidents.", compute: (b, f) => incidentStats(b.incidents, f).avgAgeOpenDays },
  { id: "ops.avgResolution", label: "Avg Resolution Time", section: "Operations", owner: "Operations Manager", unit: "days", description: "Average days to resolve incidents closed this period.", compute: (b, f) => incidentStats(b.incidents, f).avgResolutionDays },
  { id: "ops.criticalOpen", label: "Critical Open", section: "Operations", owner: "Operations Manager", unit: "count", description: "Unresolved critical-severity incidents.", compute: (b, f) => incidentStats(b.incidents, f).criticalOpen },

  // Discipline
  { id: "discipline.complaintsOpen", label: "Open Complaints", section: "Discipline", owner: "HR Manager", unit: "count", description: "Complaints awaiting resolution.", compute: (b, f) => complaintStats(b.complaints, f).open + complaintStats(b.complaints, f).investigating },

  // Clients & sites
  { id: "clients.unique", label: "Clients", section: "Clients & Sites", owner: "Business Development Manager", unit: "count", description: "Distinct corporate clients under contract.", compute: (b, f) => siteClientStats(b.sites, f).uniqueClients },
  { id: "clients.sites", label: "Contract Sites", section: "Clients & Sites", owner: "Operations Manager", unit: "count", description: "Client sites under management.", compute: (b, f) => siteClientStats(b.sites, f).sites },
  { id: "clients.compliance", label: "SLA Compliance", section: "Clients & Sites", owner: "Operations Manager", unit: "pct", description: "Share of sites fully SLA-compliant.", compute: (b, f) => siteClientStats(b.sites, f).compliancePct },

  // Staff register (owner: HR Manager)
  { id: "staffregister.total", label: "Staff (Register)", section: "Workforce", owner: "HR Manager", unit: "count", description: "Non-officer employees on the HR staff register.", compute: (b, f) => staffRegisterStats(b.users, b.officers, f).total },
];

export function listMetrics(section?: MetricSection): MetricDef<any>[] {
  return section ? METRIC_REGISTRY.filter((m) => m.section === section) : METRIC_REGISTRY;
}

export function computeMetric(id: string, bundle: StatsBundle, filters: StatsFilters): unknown {
  const metric = METRIC_REGISTRY.find((m) => m.id === id);
  return metric ? metric.compute(bundle, filters) : undefined;
}
