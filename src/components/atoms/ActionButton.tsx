import React from "react";
import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md";
}

const variantStyles = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  ghost: "bg-slate-100 hover:bg-slate-200 text-slate-700",
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  variant = "primary",
  size = "md",
}) => {
  const sizeClass = size === "sm" ? "px-2.5 py-1.5 text-[10px]" : "px-3.5 py-2 text-xs";
  return (
    <button
      onClick={onClick}
      className={`${sizeClass} ${variantStyles[variant]} font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
};
