import { describe, it, expect } from "vitest";
import {
  inPeriod,
  daysBetween,
  monthlyTrend,
  officerStats,
  trainingStats,
  siteClientStats,
  staffRegisterStats,
  complaintStats,
  incidentStats,
  regionalBreakdown,
  listMetrics,
  computeMetric,
  type StatsBundle,
  type StatsFilters,
} from "../../src/utils/executiveStats";
import type { SecurityOfficer, User, ClientSite, Complaint, Incident, TrainingCohort, RecruitTrainee } from "../../src/types";

const registerUsers: User[] = [
    { id: "u1", name: "A", email: "a@x", role: "Cashier", department: "Finance", status: "Active" },
    { id: "u2", name: "B", email: "b@x", role: "HR Manager", department: "HR", status: "Active", region: "Kampala Central" },
  ];

const REF = "2026-08-24T12:00:00Z";
const FILTERS: StatsFilters = { period: "year", referenceDate: REF };
const MONTH_FILTERS: StatsFilters = { period: "month", referenceDate: REF };

const officer = (over: Partial<SecurityOfficer>): SecurityOfficer =>
  ({
    id: over.forceNumber ?? "PSG026/099",
    forceNumber: over.forceNumber ?? "PSG026/099",
    fullName: "Test Officer",
    designation: "Security Officer",
    status: "On Duty",
    medicalCleared: true,
    armedQualified: false,
    k9Qualified: false,
    joinDate: "2025-01-01",
    warningLettersCount: 0,
    certifications: [],
    ...over,
  }) as SecurityOfficer;

const bundle: StatsBundle = {
  officers: [],
  users: [],
  sites: [],
  complaints: [],
  incidents: [],
  trainingCohorts: [],
  recruitTrainees: [],
};

describe("date helpers", () => {
  it("daysBetween counts whole days", () => {
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
    expect(daysBetween("2026-01-31", "2026-01-01")).toBe(0);
  });

  it("inPeriod honours the window and reference date", () => {
    expect(inPeriod("2026-03-01", FILTERS)).toBe(true);
    expect(inPeriod("2024-01-01", FILTERS)).toBe(false);
    expect(inPeriod(undefined, FILTERS)).toBe(false);
  });

  it("monthlyTrend buckets into labelled months", () => {
    const points = monthlyTrend([{ date: "2026-08-02" }, { date: "2026-08-20" }, { date: "2026-07-11" }, { date: "2020-01-01" }], 3, REF);
    expect(points.map((p) => p.count)).toEqual([0, 1, 2]);
    expect(points[2].key).toBe("2026-08");
  });
});

describe("officerStats", () => {
  const officers: SecurityOfficer[] = [
    officer({ forceNumber: "F1", region: "Kampala Central", status: "On Duty" }),
    officer({ forceNumber: "F2", region: "Kampala Central", isDeserter: true, status: "Deserted", desertionDate: "2026-06-15", joinDate: "2025-06-01", finishedProbation: false }),
    officer({ forceNumber: "F3", region: "Jinja", joinDate: "2026-05-01", passedOutDate: "2026-07-01", warningLettersCount: 3 }),
  ];

  it("counts totals, desertions and rate within the window", () => {
    const s = officerStats(officers, FILTERS);
    expect(s.total).toBe(3);
    // F2 deserted in-window but joined before the window opened
    expect(s.desertedInPeriod).toBe(1);
    expect(s.joinedInPeriod).toBe(1);
    expect(s.desertionRatePct).toBe(50);
    expect(s.onDuty).toBe(2);
  });

  it("computes average tenure at desertion and school time", () => {
    const s = officerStats(officers, FILTERS);
    expect(s.avgTenureAtDesertionDays).toBe(daysBetween("2025-06-01", "2026-06-15"));
    expect(s.avgDaysToPassOut).toBe(61);
    expect(s.warningLetterFlagged).toBe(1);
  });

  it("groups by region sorted by headcount", () => {
    const s = officerStats(officers, FILTERS);
    expect(s.byRegion[0]).toEqual({ region: "Kampala Central", count: 2 });
  });

  it("respects the region filter", () => {
    const s = officerStats(officers, { ...FILTERS, region: "Jinja" });
    expect(s.total).toBe(1);
    expect(s.byRegion).toEqual([{ region: "Jinja", count: 1 }]);
  });
});

describe("trainingStats", () => {
  const cohorts: TrainingCohort[] = [
    { id: "c1", code: "C-01", name: "Intake One", startDate: "2026-01-01", endDate: "2026-04-01", location: "Kampala", leadInstructor: "X", totalRecruits: 10, passedOutCount: 8, status: "Passed Out & Certified", curriculumModules: [] },
    { id: "c2", code: "C-02", name: "Intake Two", startDate: "2026-06-01", endDate: "2026-09-01", location: "Kampala", leadInstructor: "Y", totalRecruits: 12, passedOutCount: 0, status: "In Session", curriculumModules: [] },
  ];
  const trainee = (status: RecruitTrainee["overallStatus"], id: string): RecruitTrainee =>
    ({ id, cohortId: "c1", overallStatus: status }) as RecruitTrainee;

  it("summarises throughput, pass-out rate and durations", () => {
    const s = trainingStats(cohorts, [
      trainee("Graduated & Certified", "t1"),
      trainee("Graduated & Certified", "t2"),
      trainee("Under Training", "t3"),
      trainee("Deferred", "t4"),
      trainee("Disqualified", "t5"),
    ]);
    expect(s.cohortsInSession).toBe(1);
    expect(s.recruitsInTraining).toBe(1);
    expect(s.passOutRatePct).toBe(40);
    expect(s.avgCohortDurationDays).toBe(91);
    // sorted by duration, longest first
    expect(s.cohortDurations[0]).toMatchObject({ code: "C-02", days: 92 });
  });
});

const testSites: ClientSite[] = [
  { id: "s1", clientName: "Bank A", siteName: "HQ", slaStatus: "Compliant", region: "Kampala Central" },
  { id: "s2", clientName: "Bank A", siteName: "Branch", slaStatus: "Understaffed", region: "Kampala Central" },
  { id: "s3", clientName: "Mall B", siteName: "Juba Mall", slaStatus: "Compliant", region: "Jinja" },
] as ClientSite[];

describe("siteClientStats / staffRegisterStats", () => {
  it("deduplicates clients and computes compliance", () => {
    const s = siteClientStats(testSites, FILTERS);
    expect(s.uniqueClients).toBe(2);
    expect(s.sites).toBe(3);
    expect(s.compliancePct).toBe(66.7);
  });

  it("excludes officer-linked accounts from the staff register", () => {
    const officers = [officer({ forceNumber: "F1" })];
    const s = staffRegisterStats(
      [...registerUsers, { id: "u3", name: "C", email: "c@x", role: "Security Officer", department: "Operations", status: "Active", forceNumber: "F1" } as User],
      officers,
      FILTERS
    );
    expect(s.total).toBe(2);
    expect(s.byDepartment.find((d) => d.region === "Operations")).toBeUndefined();
  });
});

describe("complaint + incident stats", () => {
  const complaints: Complaint[] = [
    { id: "k1", category: "Conduct of Security Officers", reportedDate: "2026-08-01", status: "Open" },
    { id: "k2", category: "Conduct of Security Officers", reportedDate: "2026-02-01", status: "Resolved" },
  ] as unknown as Complaint[];

  const incidents: Incident[] = [
    { id: "i1", incidentDate: "2026-08-10", status: "Open", severity: "Critical", region: "Jinja" },
    { id: "i2", incidentDate: "2026-08-12", status: "Resolved", severity: "Low", resolvedAt: "2026-08-16", region: "Jinja" },
    { id: "i3", incidentDate: "2025-09-01", status: "Resolved", severity: "Medium", resolvedAt: "2025-09-05", region: "Jinja" },
  ] as Incident[];

  it("filters complaints to the window", () => {
    const s = complaintStats(complaints, MONTH_FILTERS);
    expect(s.total).toBe(1);
    expect(s.open).toBe(1);
    const yearly = complaintStats(complaints, FILTERS);
    expect(yearly.total).toBe(2);
  });

  it("ages open incidents and measures resolution speed", () => {
    const s = incidentStats(incidents, FILTERS);
    expect(s.open).toBe(1);
    expect(s.criticalOpen).toBe(1);
    expect(s.avgResolutionDays).toBe(4);
    expect(s.avgAgeOpenDays).toBe(daysBetween("2026-08-10", REF));
  });
});

describe("regionalBreakdown + registry", () => {
  it("rolls up per-region rows with client dedupe", () => {
    const rows = regionalBreakdown(
      {
        ...bundle,
        officers: [officer({ forceNumber: "F1", region: "Jinja" }), officer({ forceNumber: "F2", region: "Jinja", isDeserter: true })],
        sites: [
          { id: "s1", clientName: "Bank A", siteName: "a", slaStatus: "Compliant", region: "Jinja" },
          { id: "s2", clientName: "Bank B", siteName: "b", slaStatus: "Compliant", region: "Jinja" },
        ] as ClientSite[],
        incidents: [{ id: "i1", incidentDate: REF, status: "Open", severity: "Low", region: "Jinja" }] as Incident[],
      },
      FILTERS
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ region: "Jinja", officers: 2, deserted: 1, sites: 2, clients: 2, incidents: 1 });
  });

  it("registry has unique ids and computes headline metrics", () => {
    const ids = listMetrics().map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(computeMetric("clients.unique", { ...bundle, sites: testSites }, FILTERS)).toBe(2);
    expect(listMetrics("Training School").every((m) => m.owner === "Training Officer")).toBe(true);
  });
});
