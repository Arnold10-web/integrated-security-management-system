/**
 * Training School pipeline — Training Officer workspace.
 *
 * The canonical subject is the SecurityOfficer record created by HR at
 * recruitment (force number, bank details, biodata already exist by the time a
 * recruit reaches the school). Stages map 1:1 onto SecurityOfficerLifecycleStage:
 *
 *   ENROLLED              → awaiting hand-over to Operations (HR owns)
 *   HANDED_TO_OPERATIONS  → sent to the Training School (Training receives)
 *   IN_TRAINING           → under training (Training advances to ready / drops)
 *   PASSED_OUT            → passed out; certificate issued, returned to Ops
 *   DEPLOYED              → deployed by Operations (outside training scope)
 */
import type { RecruitTrainee, SecurityOfficer } from "../types";

export type PipelineStage =
  | "Awaiting Reception"
  | "Under Training"
  | "Ready for Pass-Out"
  | "Graduated & Certified"
  | "Deferred"
  | "Disqualified";

export const PIPELINE_TABS = [
  "ALL",
  "Awaiting Reception",
  "Under Training",
  "Graduated & Certified",
] as const;
export type PipelineTab = (typeof PIPELINE_TABS)[number];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  "Awaiting Reception": "Awaiting Reception",
  "Under Training": "Under Training",
  "Ready for Pass-Out": "Ready for Pass-Out",
  "Graduated & Certified": "Passed Out",
  Deferred: "Deferred",
  Disqualified: "Dropped",
};

export const STAGE_BADGE_CLASS: Record<PipelineStage, string> = {
  "Awaiting Reception": "bg-amber-100 text-amber-800 border-amber-200",
  "Under Training": "bg-blue-100 text-blue-800 border-blue-200",
  "Ready for Pass-Out": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Graduated & Certified": "bg-green-100 text-green-800 border-green-200",
  Deferred: "bg-slate-100 text-slate-700 border-slate-200",
  Disqualified: "bg-red-100 text-red-800 border-red-200",
};

/* ── Officer-based pipeline (canonical) ─────────────────────────────────── */

/** Recruits waiting for the Training Officer to receive them. */
export const awaitingOfficers = (officers: SecurityOfficer[]) =>
  officers.filter((g) => g.lifecycleStage === "HANDED_TO_OPERATIONS");

/** Recruits currently under training at the school. */
export const inTrainingOfficers = (officers: SecurityOfficer[]) =>
  officers.filter((g) => g.lifecycleStage === "IN_TRAINING");

/** Officers who already passed out (returned to Operations for deployment). */
export const passedOutOfficers = (officers: SecurityOfficer[]) =>
  officers.filter((g) => g.lifecycleStage === "PASSED_OUT");

export const canReceiveOfficer = (g: Pick<SecurityOfficer, "lifecycleStage">) =>
  g.lifecycleStage === "HANDED_TO_OPERATIONS";
export const canAdvanceOfficer = canReceiveOfficer; // Receive == move into IN_TRAINING
export const canPassOutOfficer = (g: Pick<SecurityOfficer, "lifecycleStage">) =>
  g.lifecycleStage === "IN_TRAINING";

export interface OfficerPipelineKpis {
  awaiting: number;
  inTraining: number;
  passedOut: number;
}

export function officerPipelineKpis(officers: SecurityOfficer[]): OfficerPipelineKpis {
  return {
    awaiting: awaitingOfficers(officers).length,
    inTraining: inTrainingOfficers(officers).length,
    passedOut: passedOutOfficers(officers).length,
  };
}

/** Receive & admit at the school: HANDED_TO_OPERATIONS → IN_TRAINING. */
export function officerReceiveUpdate(): Partial<SecurityOfficer> {
  return { lifecycleStage: "IN_TRAINING" };
}

/** Pass-out on the EXISTING officer: stage, stamp date, add certification. */
export function officerPassOutUpdate(today: string): Partial<SecurityOfficer> {
  return {
    lifecycleStage: "PASSED_OUT",
    passedOutDate: today,
    finishedProbation: false,
  };
}

export const averageScoreOf = (scores: { drill: number; marksmanship: number; theory: number }) =>
  Math.round((scores.drill + scores.marksmanship + scores.theory) / 3);

/** Filter helper shared by the tab bar and search box (officer rows). */
export function filterOfficers(
  officers: SecurityOfficer[],
  tab: PipelineTab,
  query: string
): SecurityOfficer[] {
  const q = query.trim().toLowerCase();
  const stageFor = (g: SecurityOfficer): PipelineTab => {
    if (g.lifecycleStage === "HANDED_TO_OPERATIONS") return "Awaiting Reception";
    if (g.lifecycleStage === "IN_TRAINING") return "Under Training";
    if (g.lifecycleStage === "PASSED_OUT") return "Graduated & Certified";
    return "Awaiting Reception"; // ENROLLED not shown unless tab matches below
  };
  return officers.filter((g) => {
    // Only recruits inside/at-exit of the training window are listed.
    if (!["HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT"].includes(g.lifecycleStage ?? "")) return false;
    if (tab !== "ALL" && stageFor(g) !== tab) return false;
    if (
      q &&
      !g.fullName.toLowerCase().includes(q) &&
      !g.forceNumber.toLowerCase().includes(q)
    )
      return false;
    return true;
  });
}
