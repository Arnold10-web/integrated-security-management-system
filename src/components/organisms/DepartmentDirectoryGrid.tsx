import React from "react";

interface DeptDirEntry {
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  label: string;
  head: string;
  role: string;
}

interface DepartmentDirectoryGridProps {
  departments: DeptDirEntry[];
}

export const DepartmentDirectoryGrid: React.FC<DepartmentDirectoryGridProps> = ({ departments }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {departments.map((dept) => {
        const IconComp = dept.icon;
        return (
          <div key={dept.label} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 opacity-90">
            <div className="flex items-center justify-between">
              <div className={`w-7 h-7 rounded-lg ${dept.iconBg} flex items-center justify-center font-bold`}>
                <IconComp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{dept.role}</span>
            </div>
            <div className="font-extrabold text-xs text-slate-900">{dept.label}</div>
            <div className="text-[10px] text-slate-500 font-medium">{dept.head}</div>
          </div>
        );
      })}
    </div>
  );
};
