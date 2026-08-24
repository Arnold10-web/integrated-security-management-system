/**
 * Executive Directorate dashboard (General Manager / Director) — rebuilt v3.4.
 *
 * Layout contract (decision-first vertical rhythm):
 *   R0 compact header + sticky global filter bar
 *   R1 Approvals Hub — the Directorate's actual job, above everything
 *   R2 six-tile statistics band (registry-driven headlines only)
 *   R3 trends (incidents / desertions)
 *   R4 regional data cards
 *
 * Every number comes from utils/executiveStats (metric registry); this view
 * never derives its own figures. Deep analytics live on department-head
 * dashboards and the Reports page.
 */

import React, { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import type { UserRole } from "../../../types";
import {
  officerStats,
  staffRegisterStats,
  siteClientStats,
  complaintStats,
  incidentStats,
  trainingStats,
  regionalBreakdown,
  type StatsBundle,
  type StatsFilters,
} from "../../../utils/executiveStats";
import { useDomainStore } from "../../../stores/domainStore";
import { useAuthStore } from "../../../stores/authStore";
import { FilterBar, type ExecutiveFilters } from "./FilterBar";
import { ApprovalsHub } from "./ApprovalsHub";
import { StatsBand } from "./StatsBand";
import { TrendsPanel } from "./TrendsPanel";
import { RegionalDataCards } from "./RegionalDataCards";

export const ExecutiveDashboardView: React.FC<{ activeRole: UserRole }> = ({ activeRole }) => {
  const domain = useDomainStore();
  const staffRegisterUsers = useAuthStore((s) => s.users);
  const [filters, setFilters] = React.useState<ExecutiveFilters>({ period: "year", region: null, search: "" });

  const canAct = activeRole === "General Manager";

  const statsFilters: StatsFilters = useMemo(
    () => ({ period: filters.period === "all" ? "all" : filters.period, region: filters.region }),
    [filters.period, filters.region]
  );

  const bundle: StatsBundle = useMemo(
    () => ({
      officers: domain.securityOfficers,
      users: staffRegisterUsers,
      sites: domain.sites,
      complaints: domain.complaints,
      incidents: domain.incidents,
      trainingCohorts: domain.trainingCohorts,
      recruitTrainees: domain.recruitTrainees,
    }),
    [domain.securityOfficers, staffRegisterUsers, domain.sites, domain.complaints, domain.incidents, domain.trainingCohorts, domain.recruitTrainees]
  );

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const o of domain.securityOfficers) if (o.region) set.add(o.region);
    for (const s of domain.sites) if (s.region) set.add(s.region);
    return [...set].sort();
  }, [domain.securityOfficers, domain.sites]);

  // Header summary — same registry functions the panels use.
  const headerSummary = useMemo(() => ({
    officers: officerStats(bundle.officers, statsFilters).total,
    staff: staffRegisterStats(bundle.users, bundle.officers, statsFilters).total,
    clients: siteClientStats(bundle.sites, statsFilters).uniqueClients,
    complaints: complaintStats(bundle.complaints, statsFilters).open,
    incidents: incidentStats(bundle.incidents, statsFilters).criticalOpen,
    training: trainingStats(bundle.trainingCohorts, bundle.recruitTrainees).recruitsInTraining,
  }), [bundle, statsFilters]);

  return (
    <div className="space-y-5">
      {/* R0 — compact executive header */}
      <div className="bg-slate-900 rounded-2xl px-6 py-4 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">Executive Directorate</h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-black uppercase border border-amber-400/20">
                  {activeRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Decisions first · company posture at a glance · {headerSummary.officers} officers ·{" "}
                {headerSummary.staff} staff · {headerSummary.clients} clients
              </p>
            </div>
          </div>
          {/* Sticky-capable filter bar */}
          <div className="md:sticky md:top-4 z-10 w-full md:w-auto">
            <FilterBar filters={filters} regions={regions} onChange={(next) => setFilters((f) => ({ ...f, ...next }))} />
          </div>
        </div>
      </div>

      {/* R1 — decisions */}
      <ApprovalsHub canAct={canAct} search={filters.search} />

      {/* R2 — headline statistics */}
      <StatsBand bundle={bundle} filters={statsFilters} />

      {/* R3 — trends */}
      <TrendsPanel filters={statsFilters} />

      {/* R4 — regional picture */}
      <RegionalDataCards bundle={bundle} filters={statsFilters} />
    </div>
  );
};
