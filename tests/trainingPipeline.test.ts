import { describe, it, expect } from "vitest";
import {
  officerPipelineKpis,
  officerReceiveUpdate,
  officerPassOutUpdate,
  filterOfficers,
  averageScoreOf,
} from "../src/utils/trainingPipeline";
import type { SecurityOfficer } from "../src/types";

const g = (over: Partial<SecurityOfficer> = {}): SecurityOfficer => ({
  id: "grd-1",
  forceNumber: "PSG026/001",
  fullName: "Test Officer",
  designation: "Security Officer",
  phone: "+256 700 000000",
  nationalId: "CM00000000XXXX",
  assignedSite: "Pending Assignment",
  status: "Off Duty",
  joinDate: "2026-07-01",
  warningLettersCount: 0,
  medicalCleared: true,
  armedQualified: false,
  k9Qualified: false,
  certifications: ["Basic Security Training (In Progress)"],
  lifecycleStage: "HANDED_TO_OPERATIONS",
  ...over,
});

describe("officer lifecycle pipeline (canonical)", () => {
  it("buckets officers by training-relevant lifecycle stage", () => {
    const kpis = officerPipelineKpis([
      g({ id: "1", lifecycleStage: "ENROLLED" }),
      g({ id: "2", lifecycleStage: "HANDED_TO_OPERATIONS" }),
      g({ id: "3", lifecycleStage: "IN_TRAINING" }),
      g({ id: "4", lifecycleStage: "IN_TRAINING" }),
      g({ id: "5", lifecycleStage: "PASSED_OUT" }),
      g({ id: "6", lifecycleStage: "DEPLOYED" }),
    ]);
    expect(kpis).toEqual({ awaiting: 1, inTraining: 2, passedOut: 1 });
  });

  it("receive moves HANDED_TO_OPERATIONS → IN_TRAINING (no record creation)", () => {
    expect(officerReceiveUpdate()).toEqual({ lifecycleStage: "IN_TRAINING" });
  });

  it("pass-out updates the EXISTING officer: stage + date, never mints a force number", () => {
    const upd = officerPassOutUpdate("2026-08-24");
    expect(upd.lifecycleStage).toBe("PASSED_OUT");
    expect(upd.passedOutDate).toBe("2026-08-24");
    expect(upd).not.toHaveProperty("forceNumber");
  });

  it("lists only the training window stages and filters by tab/query/number", () => {
    const list = [
      g({ id: "1", fullName: "Alpha One", forceNumber: "PSG026/010", lifecycleStage: "HANDED_TO_OPERATIONS" }),
      g({ id: "2", fullName: "Beta Two", forceNumber: "SG-2026-102", lifecycleStage: "IN_TRAINING" }),
      g({ id: "3", fullName: "Gamma Three", lifecycleStage: "ENROLLED" }),
      g({ id: "4", fullName: "Delta Four", lifecycleStage: "DEPLOYED" }),
    ];
    expect(filterOfficers(list, "ALL", "")).toHaveLength(2);
    expect(filterOfficers(list, "Under Training", "").map((x) => x.id)).toEqual(["2"]);
    expect(filterOfficers(list, "ALL", "beta").map((x) => x.id)).toEqual(["2"]);
    expect(filterOfficers(list, "ALL", "psg026").map((x) => x.id)).toEqual(["1"]);
  });

  it("averages assessment triples", () => {
    expect(averageScoreOf({ drill: 90, marksmanship: 80, theory: 70 })).toBe(80);
  });
});

