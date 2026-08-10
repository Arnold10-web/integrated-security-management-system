import React from "react";
import {
  HardDrive,
  Plus,
  Zap,
  CheckCircle2,
  Layers,
  Search,
  Cpu,
  Trash2,
  RefreshCw,
} from "lucide-react";
import type { ITAsset } from "../../types";

interface ITAssetPanelProps {
  itAssets: ITAsset[];
  filteredAssets: ITAsset[];
  assetSearch: string;
  assetCategoryFilter: string;
  assetConditionFilter: string;
  onSetAssetSearch: (val: string) => void;
  onSetAssetCategoryFilter: (val: string) => void;
  onSetAssetConditionFilter: (val: string) => void;
  onOpenAddAssetModal: () => void;
  onUpdateITAsset?: (id: string, updates: Partial<ITAsset>) => void;
  onDeleteITAsset?: (id: string) => void;
}

export const ITAssetPanel: React.FC<ITAssetPanelProps> = ({
  itAssets,
  filteredAssets,
  assetSearch,
  assetCategoryFilter,
  assetConditionFilter,
  onSetAssetSearch,
  onSetAssetCategoryFilter,
  onSetAssetConditionFilter,
  onOpenAddAssetModal,
  onUpdateITAsset,
  onDeleteITAsset,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
            <HardDrive className="w-3 h-3 text-indigo-400" />
            <span>IT DEPARTMENT HARDWARE & SOFTWARE REGISTER</span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            Organization-Owned Hardware & Software Inventory
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">
            IT-owned oversight for all company laptops, servers, CCTV NVRs, biometric terminals, patrol radios, software licenses, and SaaS subscriptions — distinct from Administration's store uniform and boot stock.
          </p>
        </div>

        <button
          onClick={onOpenAddAssetModal}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register IT Asset</span>
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total IT Assets</span>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{itAssets.length}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Hardware & Software items</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Valuation</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            UGX {itAssets.reduce((sum, a) => sum + (a.valueUgx || 0), 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Capital Tech Assets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Operational Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {Math.round((itAssets.filter((a) => a.condition === "Operational").length / (itAssets.length || 1)) * 100)}%
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {itAssets.filter((a) => a.condition === "Operational").length} Healthy / Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Software & Licenses</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {itAssets.filter((a) => a.category === "Software License & SaaS").length}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Kaspersky, VMS, M365</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search IT assets by code, name, serial/key, or location..."
              value={assetSearch}
              onChange={(e) => onSetAssetSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={assetCategoryFilter}
              onChange={(e) => onSetAssetCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Workstation / Laptop">Workstation / Laptop</option>
              <option value="CCTV & Surveillance">CCTV & Surveillance</option>
              <option value="Biometric & Access Control">Biometric & Access Control</option>
              <option value="Patrol Radio & Communications">Patrol Radio & Communications</option>
              <option value="Server & Networking">Server & Networking</option>
              <option value="Software License & SaaS">Software License & SaaS</option>
            </select>

            <select
              value={assetConditionFilter}
              onChange={(e) => onSetAssetConditionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Conditions</option>
              <option value="Operational">Operational</option>
              <option value="In Repair">In Repair</option>
              <option value="Upgrade Required">Upgrade Required</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {/* IT Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>IT Hardware & Software Master Inventory ({filteredAssets.length})</span>
          </h4>
          <span className="text-[11px] text-slate-500">IT Department Ownership Only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Asset Code & Category</th>
                <th className="px-4 py-3">Asset Description / Name</th>
                <th className="px-4 py-3">Serial No / License Key</th>
                <th className="px-4 py-3">Assigned Location / Person</th>
                <th className="px-4 py-3">Valuation (UGX)</th>
                <th className="px-4 py-3">Condition Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No IT assets found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{ast.assetCode}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {ast.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{ast.name}</div>
                      {ast.softwareVersionOrSpecs && (
                        <div className="text-[11px] text-slate-500 font-normal">{ast.softwareVersionOrSpecs}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {ast.serialNumberOrKey}
                      {ast.ipAddressOrHost && (
                        <div className="text-[10px] text-indigo-600 font-sans">Host: {ast.ipAddressOrHost}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{ast.assignedToPersonOrStation}</div>
                      <div className="text-[10px] text-slate-500">{ast.assignedDepartment}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      UGX {ast.valueUgx.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          ast.condition === "Operational"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ast.condition === "In Repair"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : ast.condition === "Upgrade Required"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {ast.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onUpdateITAsset && (
                          <button
                            onClick={() => {
                              const nextCondition =
                                ast.condition === "Operational"
                                  ? "In Repair"
                                  : ast.condition === "In Repair"
                                  ? "Upgrade Required"
                                  : "Operational";
                              onUpdateITAsset(ast.id, { condition: nextCondition });
                            }}
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                            title="Toggle Condition Status"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteITAsset && (
                          <button
                            onClick={() => onDeleteITAsset(ast.id)}
                            className="p-1.5 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                            title="Decommission Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
