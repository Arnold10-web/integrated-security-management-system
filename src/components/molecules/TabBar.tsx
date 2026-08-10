import React from "react";
import type { LucideIcon } from "lucide-react";

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  color?: "default" | "emerald" | "amber" | "red" | "blue" | "purple";
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const activeColorMap = {
  default: "bg-slate-900 text-white",
  emerald: "bg-emerald-700 text-white",
  amber: "bg-amber-600 text-white",
  red: "bg-red-700 text-white",
  blue: "bg-blue-600 text-white",
  purple: "bg-purple-700 text-white",
};

const inactiveStyle = "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200";

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isActive ? activeColorMap[tab.color || "default"] : inactiveStyle
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
