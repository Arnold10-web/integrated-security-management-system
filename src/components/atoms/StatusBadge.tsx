import React from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const variantMap: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  warning: "bg-amber-100 text-amber-800 border border-amber-300",
  danger: "bg-red-100 text-red-800 border border-red-300",
  info: "bg-blue-100 text-blue-800 border border-blue-300",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
};

function resolveVariant(status: string): BadgeVariant {
  const s = status.toLowerCase();
  if (
    s.includes("active") || s.includes("on duty") || s.includes("healthy") ||
    s.includes("approved") || s.includes("completed") || s.includes("operational") ||
    s.includes("returned") || s.includes("resolved") || s.includes("paid") ||
    s.includes("disbursed") || s.includes("graduated") || s.includes("certified") ||
    s.includes("passed") || s.includes("compliant") || s.includes("excellent")
  ) return "success";
  if (
    s.includes("pending") || s.includes("in progress") || s.includes("in service") ||
    s.includes("scheduled") || s.includes("in transit") || s.includes("under investigation") ||
    s.includes("draft") || s.includes("open") || s.includes("medium") ||
    s.includes("leave") || s.includes("off duty")
  ) return "warning";
  if (
    s.includes("suspended") || s.includes("deserted") || s.includes("rejected") ||
    s.includes("expired") || s.includes("critical") || s.includes("high") ||
    s.includes("grounded") || s.includes("terminated") || s.includes("decommissioned") ||
    s.includes("unfit") || s.includes("non-compliant") || s.includes("overdue")
  ) return "danger";
  if (
    s.includes("check") || s.includes("issued") || s.includes("escrow") ||
    s.includes("satisfactory") || s.includes("good")
  ) return "info";
  return "neutral";
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const variant = resolveVariant(status);
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${variantMap[variant]} ${className}`}
    >
      {status}
    </span>
  );
};
