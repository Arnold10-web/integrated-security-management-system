/**
 * Canonical company regions for ISCMS.
 * Order is intentional and must be preserved in UI dropdowns and reports.
 * Source: Integrated Security Company.md (conversation-derived regions list).
 */

export const UGANDA_REGIONS = [
  "Albertine",
  "Mbarara",
  "Mukono",
  "Masaka",
  "Savannah",
  "Arua",
  "Gulu",
  "Jinja",
  "Kampala East",
  "Kampala West",
  "Kampala North",
  "Kampala Central",
  "Outerstations",
] as const;

export type CompanyRegion = (typeof UGANDA_REGIONS)[number];

/** Known outerstations (more may be added after consultation). */
export const OUTERSTATION_SITES = ["Mityana"] as const;

export type OuterstationSite = (typeof OUTERSTATION_SITES)[number];

export function isCompanyRegion(value: string): value is CompanyRegion {
  return (UGANDA_REGIONS as readonly string[]).includes(value);
}

export function formatRegionLabel(region: CompanyRegion): string {
  if (region === "Outerstations") {
    return `Outerstations (${OUTERSTATION_SITES.join(", ")} + more TBD)`;
  }
  return region;
}
