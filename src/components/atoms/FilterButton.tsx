import React from "react";

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "default" | "emerald" | "amber" | "red" | "blue" | "purple";
}

const colorMap = {
  default: "bg-slate-900 text-white",
  emerald: "bg-emerald-700 text-white",
  amber: "bg-amber-600 text-white",
  red: "bg-red-700 text-white",
  blue: "bg-blue-600 text-white",
  purple: "bg-purple-700 text-white",
};

const inactiveColor = "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200";

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  active,
  onClick,
  color = "default",
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
        active ? colorMap[color] : inactiveColor
      }`}
    >
      {label}
    </button>
  );
};
