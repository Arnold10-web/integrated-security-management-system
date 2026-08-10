import React, { useState } from "react";
import { AlertTriangle, MapPin, Table, Grid, FolderArchive } from "lucide-react";
import type { Guard } from "../../types";
import { StatusBadge } from "../atoms/StatusBadge";

interface GuardsTableProps {
  guards: Guard[];
  onViewBiodata: (guard: Guard) => void;
  onIssueWarning: (guard: Guard) => void;
  onArchiveGuard?: (id: string) => void;
  viewMode: "spreadsheet" | "grid";
  onViewModeChange: (mode: "spreadsheet" | "grid") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: "ALL" | "DESERTERS" | "ACTIVE" | "ARCHIVED";
  onStatusFilterChange: (filter: "ALL" | "DESERTERS" | "ACTIVE" | "ARCHIVED") => void;
}

export const GuardsTable: React.FC<GuardsTableProps> = ({
  guards,
  onViewBiodata,
  onIssueWarning,
  onArchiveGuard,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [rankFilter, setRankFilter] = useState<string>("ALL");

  const rankColors: Record<string, string> = {
    "Site In-Charge": "text-cyan-700",
    "Inspector": "text-purple-700",
    "K9 Handler": "text-emerald-700",
    Armorer: "text-amber-700",
  };

  const availableRanks = Array.from(new Set(guards.map((g) => g.designation))).sort();

  const stageBadge = (g: Guard) => {
    const stage = g.lifecycleStage ?? "DEPLOYED";
    const colors: Record<string, string> = {
      ENROLLED: "bg-slate-100 text-slate-700 border-slate-300",
      HANDED_TO_OPERATIONS: "bg-indigo-100 text-indigo-800 border-indigo-300",
      IN_TRAINING: "bg-amber-100 text-amber-800 border-amber-300",
      PASSED_OUT: "bg-sky-100 text-sky-800 border-sky-300",
      DEPLOYED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${colors[stage] ?? colors.DEPLOYED}`}>
        {stage.replaceAll("_", " ")}
      </span>
    );
  };

  const filteredGuards = guards.filter((g) => {
    const isDeserterGuard = g.status === "Deserted" || g.isDeserter;
    if (statusFilter === "DESERTERS" && !isDeserterGuard) return false;
    if (statusFilter === "ACTIVE" && isDeserterGuard) return false;
    if (rankFilter !== "ALL" && g.designation !== rankFilter) return false;

    const query = searchTerm.toLowerCase();
    return (
      g.fullName.toLowerCase().includes(query) ||
      g.guardCode.toLowerCase().includes(query) ||
      g.assignedSite.toLowerCase().includes(query) ||
      g.designation.toLowerCase().includes(query) ||
      (g.location && g.location.toLowerCase().includes(query)) ||
      (g.zone && g.zone.toLowerCase().includes(query)) ||
      (g.bankAccount && g.bankAccount.toLowerCase().includes(query)) ||
      (g.bankName && g.bankName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {statusFilter === "DESERTERS"
                ? "Deserters Registry"
                : "Guard Officers & Personnel Master Directory"}
            </h2>
            {statusFilter === "DESERTERS" && (
              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                High Alert Notice
              </span>
            )}
          </div>
        </div>
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => onViewModeChange("spreadsheet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "spreadsheet" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Table className="w-3.5 h-3.5 text-blue-600" />
            <span>Tabular Master View</span>
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-purple-600" />
            <span>Profile Grid View</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by Name, Force No, Location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          {(["ALL", "ACTIVE", "DESERTERS", "ARCHIVED"] as const).map((f) => {
            const labels = { ALL: `All (${guards.length})`, ACTIVE: `Active (${guards.length - guards.filter((g) => g.status === "Deserted" || g.isDeserter || g.status === "Archived").length})`, DESERTERS: `Deserters (${guards.filter((g) => g.status === "Deserted" || g.isDeserter).length})`, ARCHIVED: `Archived (${guards.filter((g) => g.status === "Archived").length})` };
            const colors: Record<string, string> = {
              ALL: statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              ACTIVE: statusFilter === "ACTIVE" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
              DESERTERS: statusFilter === "DESERTERS" ? "bg-red-700 text-white" : "bg-red-50 text-red-800 hover:bg-red-100",
              ARCHIVED: statusFilter === "ARCHIVED" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200",
            };
            return (
              <button
                key={f}
                onClick={() => onStatusFilterChange(f)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${colors[f]}`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {availableRanks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Rank:</span>
          <button
            onClick={() => setRankFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
              rankFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Ranks ({guards.length})
          </button>
          {availableRanks.map((r) => {
            const count = guards.filter((g) => g.designation === r).length;
            return (
              <button
                key={r}
                onClick={() => setRankFilter(rankFilter === r ? "ALL" : r)}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                  rankFilter === r
                    ? "bg-cyan-700 text-white"
                    : "bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100"
                }`}
              >
                {r} ({count})
              </button>
            );
          })}
        </div>
      )}

      {viewMode === "spreadsheet" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white p-3 text-xs font-bold flex items-center justify-between border-b border-slate-800">
            <span>HR PERSONNEL MASTER REGISTER</span>
            <span className="text-[10px] text-slate-400">Records: {filteredGuards.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-300">
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap bg-blue-50 text-blue-900 sticky left-0 z-10">NAME</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">FORCE/NO</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap bg-blue-50/80 text-blue-950">LOCATION</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">TEL NO</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">BANK ACCOUNT</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">BANK NAME</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap text-center">PROBATION</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">STATION</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap">DESIGNATION</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap text-center">STATUS</th>
                  <th className="p-3 border-r border-slate-300 whitespace-nowrap text-center">LIFECYCLE STAGE</th>
                  <th className="p-3 whitespace-nowrap text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700 text-[11px]">
                {filteredGuards.map((g, idx) => {
                  const isDeserter = g.status === "Deserted" || g.isDeserter;
                  return (
                    <tr key={g.id} className={`hover:bg-slate-50 transition-colors ${isDeserter ? "bg-red-50/50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                      <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={() => onViewBiodata(g)}>
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[10px] shrink-0 border border-slate-200">
                            {g.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{g.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700 border-r border-slate-200 whitespace-nowrap">{g.guardCode}</td>
                      <td className="p-3 font-bold text-blue-950 bg-blue-50/30 border-r border-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{g.location || "Kampala Central (CBD)"}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">{g.phone}</td>
                      <td className="p-3 font-mono text-slate-900 font-semibold border-r border-slate-200 whitespace-nowrap">{g.bankAccount || "N/A"}</td>
                      <td className="p-3 font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">{g.bankName || "N/A"}</td>
                      <td className="p-3 text-center border-r border-slate-200 whitespace-nowrap font-bold">
                        {g.finishedProbation ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">YES</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px]">NO</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 border-r border-slate-200 whitespace-nowrap">{g.assignedSite}</td>
                      <td className="p-3 border-r border-slate-200 whitespace-nowrap font-bold text-slate-800">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className={`${rankColors[g.designation] ?? "text-slate-800"}`}>{g.designation}</span>
                          {g.zone && <span className="text-[10px] text-slate-400 font-medium">Zone: {g.zone}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 whitespace-nowrap">
                        <StatusBadge status={isDeserter ? "Deserter" : g.status} />
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 whitespace-nowrap">{stageBadge(g)}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onIssueWarning(g)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            <span>Issue Warning</span>
                          </button>
                          {onArchiveGuard && (
                            <button
                              onClick={() => { if (window.confirm(`Archive guard ${g.fullName} (${g.guardCode})?`)) onArchiveGuard(g.id); }}
                              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-300 font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                            >
                              <FolderArchive className="w-3 h-3 text-gray-700" />
                              <span>Archive</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuards.map((guard) => {
            const isDeserter = guard.status === "Deserted" || guard.isDeserter;
            return (
              <div
                key={guard.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm space-y-4 relative overflow-hidden ${isDeserter ? "border-red-300 bg-red-50/20" : "border-slate-200"}`}
              >
                {isDeserter && (
                  <div className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 text-center tracking-widest">
                    DESERTER
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewBiodata(guard)}>
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {guard.fullName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm hover:underline">{guard.fullName}</h3>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{guard.guardCode}</span>
                    </div>
                  </div>
                  <StatusBadge status={isDeserter ? "Deserted" : guard.status} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${guard.designation === "Site In-Charge" ? "bg-cyan-50 border-cyan-200 text-cyan-800" : guard.designation === "Inspector" ? "bg-purple-50 border-purple-200 text-purple-800" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                    {guard.designation}
                  </span>
                  {guard.zone && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-500">
                      Zone: {guard.zone}
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Station:</span>
                    <span className="font-bold text-slate-900">{guard.assignedSite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Location:</span>
                    <span className="text-slate-700">{guard.location || "Kampala Central"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Bank:</span>
                    <span className="font-bold text-slate-800">{guard.bankName || "Stanbic"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Pipeline:</span>
                    {stageBadge(guard)}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onIssueWarning(guard)}
                    className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    Issue Warning
                  </button>
                  {onArchiveGuard && (
                    <button
                      onClick={() => { if (window.confirm(`Archive guard ${guard.fullName} (${guard.guardCode})?`)) onArchiveGuard(guard.id); }}
                      className="py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <FolderArchive className="w-3.5 h-3.5 inline mr-1" />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
