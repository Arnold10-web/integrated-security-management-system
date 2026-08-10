import React, { useState } from "react";
import { MapPin, Users, Shield, Briefcase, Map as MapIcon, TrendingUp } from "lucide-react";
import { UGANDA_REGIONS, OUTERSTATION_SITES, formatRegionLabel } from "../../constants/regions";
import type { RegionalOffice, Guard, ClientSite, DutyRoster, ArmouryItem, K9Dog, Incident } from "../../types";

interface RegionsPanelProps {
  offices?: RegionalOffice[];
  title?: string;
  guards?: Guard[];
  sites?: ClientSite[];
  roster?: DutyRoster[];
  armoury?: ArmouryItem[];
  k9s?: K9Dog[];
  incidents?: Incident[];
  onRegionClick?: (regionName: string) => void;
}

/**
 * Interactive region panel with click-to-expand analytics.
 * Operations Manager can click on regions to view operational analytics.
 */
export const RegionsPanel: React.FC<RegionsPanelProps> = ({
  offices = [],
  title = "Company Operating Regions",
  guards = [],
  sites = [],
  roster = [],
  armoury = [],
  k9s = [],
  incidents = [],
  onRegionClick,
}) => {
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const byName = new Map(offices.map((o) => [o.regionName, o] as const));

  const getRegionGuardStats = (regionName: string) => {
    const regionGuards = guards.filter(g => g.region === regionName);
    const deployed = regionGuards.filter(g => g.lifecycleStage === "DEPLOYED").length;
    const onDuty = regionGuards.filter(g => g.status === "On Duty").length;
    const offDuty = regionGuards.filter(g => g.status === "Off Duty").length;
    const onLeave = regionGuards.filter(g => g.status === "On Leave").length;
    return {
      total: regionGuards.length,
      deployed,
      onDuty,
      offDuty,
      onLeave,
      activePercentage: regionGuards.length > 0 ? Math.round((deployed / regionGuards.length) * 100) : 0
    };
  };

  const getRegionSiteStats = (regionName: string) => {
    const regionSites = sites.filter(s => s.region === regionName);
    const deployedSites = regionSites.filter(s => s.deploymentStatus === "Deployed").length;
    const compliantSites = regionSites.filter(s => s.slaStatus === "Compliant").length;
    return {
      total: regionSites.length,
      deployed: deployedSites,
      compliant: compliantSites,
      compliancePercentage: regionSites.length > 0 ? Math.round((compliantSites / regionSites.length) * 100) : 0
    };
  };

  const getRegionAnalytics = (regionName: string) => {
    const guardStats = getRegionGuardStats(regionName);
    const siteStats = getRegionSiteStats(regionName);
    const regionIncidents = incidents.filter(i => i.region === regionName);
    const criticalIncidents = regionIncidents.filter(i => i.severity === "Critical").length;
    const armouryInRegion = armoury.filter(a => a.assignedToGuardId ? guards.find(g => g.id === a.assignedToGuardId)?.region === regionName : false).length;
    const k9sInRegion = k9s.filter(k => k.assignedHandlerId ? guards.find(g => g.id === k.assignedHandlerId)?.region === regionName : false).length;
    const activeRoster = roster.filter(r => r.region === regionName);
    
    return {
      guardStats,
      siteStats,
      criticalIncidents,
      armouryInRegion,
      k9sInRegion,
      activeRoster: activeRoster.length,
      incidentCount: regionIncidents.length,
      activeShiftPercentage: activeRoster.length > 0 ? Math.round((activeRoster.filter(r => r.status === "Present").length / activeRoster.length) * 100) : 0
    };
  };

  const handleRegionClick = (regionName: string) => {
    if (onRegionClick) {
      onRegionClick(regionName);
    } else {
      setExpandedRegion(expandedRegion === regionName ? null : regionName);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500">
            Click on any region for detailed analytics • Fixed order — Outerstations currently include {OUTERSTATION_SITES.join(", ")}
          </p>
        </div>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0">
        {UGANDA_REGIONS.map((region, index) => {
          const office = byName.get(region);
          const analytics = expandedRegion === region ? getRegionAnalytics(region) : null;
          const isExpanded = expandedRegion === region;

          return (
            <li
              key={region}
              className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/80 transition-all hover:shadow-md cursor-pointer ${isExpanded ? 'ring-2 ring-cyan-400 bg-cyan-50/50' : ''}"
              onClick={() => handleRegionClick(region)}
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-cyan-300 text-[10px] font-black flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {formatRegionLabel(region)}
                  </div>
                  {office ? (
                    <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5">
                      <div>RM: {office.regionalManagerName}</div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{office.activeGuardsCount} guards</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapIcon className="w-3 h-3" />
                        <span>{office.clientSitesCount} sites</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 mt-0.5">Region registry entry</div>
                  )}
                </div>
                {isExpanded ? (
                  <TrendingUp className="w-4 h-4 text-cyan-600 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </div>

              {isExpanded && analytics && (
                <div className="mt-2 p-3 rounded-xl bg-white border border-cyan-200 space-y-3">
                  <div className="text-[11px] font-black text-cyan-700 uppercase tracking-wider mb-2">
                    Regional Analytics
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] font-bold text-slate-700">Guard Strength</span>
                      </div>
                      <div className="text-lg font-black text-slate-900">{analytics.guardStats.total}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="text-emerald-600 font-bold">{analytics.guardStats.deployed} deployed</span>
                        <span className="mx-1">•</span>
                        <span>{analytics.guardStats.activePercentage}% active</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapIcon className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[10px] font-bold text-slate-700">Sites</span>
                      </div>
                      <div className="text-lg font-black text-slate-900">{analytics.siteStats.total}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="text-cyan-600 font-bold">{analytics.siteStats.compliant}% compliant</span>
                        <span className="mx-1">•</span>
                        <span>{analytics.siteStats.deployed} deployed</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-[10px] font-bold text-slate-700">Incidents</span>
                      </div>
                      <div className="text-lg font-black text-slate-900">{analytics.incidentCount}</div>
                      <div className="text-[10px] text-slate-500">
                        {analytics.criticalIncidents > 0 && (
                          <span className="text-red-600 font-bold">{analytics.criticalIncidents} critical</span>
                        )}
                        {analytics.criticalIncidents === 0 && analytics.incidentCount > 0 && (
                          <span className="text-amber-600 font-bold">All non-critical</span>
                        )}
                        {analytics.incidentCount === 0 && (
                          <span className="text-emerald-600 font-bold">Clear</span>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-[10px] font-bold text-slate-700">Operations</span>
                      </div>
                      <div className="text-lg font-black text-slate-900">{analytics.activeRoster}</div>
                      <div className="text-[10px] text-slate-500">
                        <span className="text-cyan-600 font-bold">{analytics.activeShiftPercentage}% active shift</span>
                      </div>
                    </div>
                  </div>

                  {analytics.armouryInRegion > 0 && (
                    <div className="p-2 rounded-lg bg-red-50/50 border border-red-200">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-[10px] font-bold text-slate-700">
                          Armoury: {analytics.armouryInRegion} items issued
                        </span>
                      </div>
                    </div>
                  )}

                  {analytics.k9sInRegion > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-700">
                          Canine Unit: {analytics.k9sInRegion} active
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-[10px] text-slate-400 italic">
                      Click to collapse • Regional analytics updated in real-time
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
