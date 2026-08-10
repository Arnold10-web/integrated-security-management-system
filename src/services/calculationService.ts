import type { StaffAppraisal } from "../types";

export function computeOverallRating(
  disciplineScore: number,
  punctualityScore: number,
  clientRatingScore: number,
  appearanceScore: number,
  incidentHandlingScore: number
): StaffAppraisal["overallRating"] {
  const avgScore =
    (disciplineScore + punctualityScore + clientRatingScore + appearanceScore + incidentHandlingScore) / 5;

  if (avgScore >= 4.5) return "Outstanding (A)";
  if (avgScore >= 3.8) return "Exceeds Expectations (B)";
  if (avgScore >= 2.8) return "Satisfactory (C)";
  if (avgScore >= 2.0) return "Needs Improvement (D)";
  return "Unsatisfactory (F)";
}
