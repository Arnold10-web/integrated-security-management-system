import React from "react";
import { Search, Plus } from "lucide-react";

interface FleetSearchBarProps {
  activeTab: string;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onAddClick: () => void;
  canAdd?: boolean;
}

const addLabels: Record<string, string> = {
  trips: "Log Journey Sheet",
  fuel: "Issue Fuel Requisition",
  maintenance: "Schedule Workshop Service",
  drivers: "Add Driver Profile",
  inspections: "Record Daily Inspection",
  breakdowns: "Report Vehicle Breakdown",
};

export const FleetSearchBar: React.FC<FleetSearchBarProps> = ({ activeTab, searchTerm, onSearchChange, onAddClick, canAdd = true }) => {
  const label = addLabels[activeTab];
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search vehicle plate, driver, destination..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {label && canAdd && (
        <button
          onClick={onAddClick}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            activeTab === "breakdowns"
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{label}</span>
        </button>
      )}
    </div>
  );
};
