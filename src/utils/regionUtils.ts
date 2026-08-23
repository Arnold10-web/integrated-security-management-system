import type { SecurityOfficer, ClientSite, Incident, DutyRoster, PatrolInspectionLog, SiteDeployment, DeploymentOrder, LeaveRequest, DisciplinaryAction, Complaint } from "../types";

/**
 * Region resolution helpers for the regional dashboard.
 *
 * Some entities (incidents, patrol inspections, deployments, leave requests,
 * disciplinary actions) do not carry a `region` field in the datastore, so we
 * resolve their region through a related entity (site or securityOfficer). Security Officers fall
 * back to the region of their assigned site when their own region is unset.
 */

const siteRegionCache = new Map<string, string>();

export function siteRegion(site?: ClientSite): string | undefined {
  return site?.region;
}

export function resolveSiteRegion(siteName: string, sites: ClientSite[]): string | undefined {
  const cached = siteRegionCache.get(siteName);
  if (cached) return cached;
  const match = sites.find((s) => s.siteName === siteName || s.siteName.toLowerCase() === siteName.toLowerCase());
  if (match?.region) siteRegionCache.set(siteName, match.region);
  return match?.region;
}

export function resolveSecurityOfficerRegion(securityOfficer: SecurityOfficer, sites: ClientSite[]): string | undefined {
  return securityOfficer.region ?? resolveSiteRegion(securityOfficer.assignedSite, sites);
}

export function resolveIncidentRegion(incident: Incident, sites: ClientSite[]): string | undefined {
  return incident.region ?? resolveSiteRegion(incident.siteName, sites);
}

export function resolveRosterRegion(entry: DutyRoster, sites: ClientSite[]): string | undefined {
  return entry.region ?? resolveSiteRegion(entry.siteName, sites);
}

export function resolvePatrolRegion(inspection: PatrolInspectionLog, sites: ClientSite[]): string | undefined {
  return resolveSiteRegion(inspection.siteName, sites);
}

export function resolveDeploymentRegion(deployment: SiteDeployment, sites: ClientSite[]): string | undefined {
  return resolveSiteRegion(deployment.siteName, sites);
}

export function resolveOrderRegion(order: DeploymentOrder): string | undefined {
  return order.region;
}

export function resolveLeaveRegion(leave: LeaveRequest, securityOfficers: SecurityOfficer[], sites: ClientSite[]): string | undefined {
  const securityOfficer = securityOfficers.find((g) => g.id === leave.forceNumber || g.forceNumber === leave.forceNumber);
  return securityOfficer ? resolveSecurityOfficerRegion(securityOfficer, sites) : undefined;
}

export function resolveDisciplinaryRegion(
  action: DisciplinaryAction,
  securityOfficers: SecurityOfficer[],
  sites: ClientSite[]
): string | undefined {
  const securityOfficer = securityOfficers.find((g) => g.id === action.forceNumber || g.forceNumber === action.forceNumber);
  return securityOfficer ? resolveSecurityOfficerRegion(securityOfficer, sites) : undefined;
}

export function resolveComplaintRegion(complaint: Complaint, sites: ClientSite[]): string | undefined {
  return complaint.region ?? resolveSiteRegion(complaint.siteName, sites);
}

/** Clears the site→region lookup cache (used when the store rehydrates). */
export function clearRegionCache(): void {
  siteRegionCache.clear();
}
