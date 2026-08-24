import React from "react";

/** Uniform panel chrome: icon + title + count badge on the left, actions top-right. */
export const PanelShell: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: number | string;
  badgeTone?: "amber" | "rose" | "emerald" | "slate";
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, badge, badgeTone = "amber", actions, children, className = "" }) => {
  const tones: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    rose: "bg-rose-100 text-rose-700 border-rose-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 shrink-0">{icon}</span>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide truncate">{title}</h2>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tones[badgeTone]}`}>{badge}</span>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
};
