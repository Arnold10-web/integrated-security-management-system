import React from "react";
import { Search } from "lucide-react";
import { UGANDA_REGIONS } from "../../data/mockData";

interface ITAdminUsersToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterDept: string;
  onFilterDeptChange: (val: string) => void;
  filterRegion: string;
  onFilterRegionChange: (val: string) => void;
}

const departments = [
  "Executive Directorate", "Human Resources", "Marketing & Sales",
  "Operations", "Finance & Cashier", "Administrations", "Information Technology",
];

export const ITAdminUsersToolbar: React.FC<ITAdminUsersToolbarProps> = ({
  searchQuery, onSearchChange, filterDept, onFilterDeptChange, filterRegion, onFilterRegionChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff user by name, email, region or role..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent outline-none font-medium text-slate-800"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Department:</span>
          <select value={filterDept} onChange={(e) => onFilterDeptChange(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
            <option value="ALL">All Departments</option>
            {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600">Region:</span>
          <select value={filterRegion} onChange={(e) => onFilterRegionChange(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none">
            <option value="ALL">All Regions</option>
            {UGANDA_REGIONS.map((reg) => (<option key={reg} value={reg}>{reg}</option>))}
          </select>
        </div>
      </div>
    </div>
  );
};
