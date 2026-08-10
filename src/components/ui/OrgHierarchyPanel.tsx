import React from "react";
import { Network, ChevronRight } from "lucide-react";
import type { DepartmentDefinition } from "../../constants/organization";

interface OrgHierarchyPanelProps {
  department: DepartmentDefinition;
  /** Highlight direct reports under the department head. */
  compact?: boolean;
}

/**
 * Displays a department's reporting structure so Operations and Directorate
 * are no longer "chaotic" flat lists — constitution §7.
 */
export const OrgHierarchyPanel: React.FC<OrgHierarchyPanelProps> = ({
  department,
  compact = false,
}) => {
  const head = department.structure.find((n) => n.role === department.headRole);
  const directReports = department.structure.filter(
    (n) => n.reportsTo === department.headRole
  );
  const deeper = department.structure.filter(
    (n) => n.reportsTo && n.reportsTo !== department.headRole
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-slate-900 text-cyan-400">
          <Network className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            {department.name} — Reporting Structure
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Reporting hierarchy (who owns what / who approves what)
          </p>
        </div>
      </div>

      {head && (
        <div className="mb-3 p-3 rounded-xl bg-slate-900 text-white">
          <div className="text-[10px] font-black uppercase tracking-wider text-cyan-400 mb-0.5">
            Department Head
          </div>
          <div className="text-sm font-extrabold">{head.title}</div>
          {!compact && (
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{head.description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {directReports.map((node) => (
          <div
            key={node.role}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-cyan-300 transition-colors"
          >
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
              <ChevronRight className="w-3 h-3" />
              Reports to {department.headRole}
            </div>
            <div className="text-xs font-black text-slate-900">{node.title}</div>
            {!compact && (
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{node.description}</p>
            )}
          </div>
        ))}
      </div>

      {!compact && deeper.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Field & supporting roles
          </div>
          <div className="flex flex-wrap gap-1.5">
            {deeper.map((node) => (
              <span
                key={node.role}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-700"
                title={`${node.title} → reports to ${node.reportsTo}`}
              >
                {node.title}
                <span className="text-slate-400 font-medium">→ {node.reportsTo}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && department.fieldLadder && department.fieldLadder.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Field rank ladder (supervision chain)
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {department.fieldLadder.map((node, i) => (
              <React.Fragment key={node.rank}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                <span
                  className="inline-flex flex-col px-2.5 py-1.5 rounded-lg bg-cyan-50 border border-cyan-200 text-[11px] font-bold text-cyan-900"
                  title={node.description}
                >
                  {node.rank}
                  <span className="text-[10px] font-medium text-cyan-600/70">{node.description}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {department.notes && !compact && (
        <p className="mt-3 text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">
          {department.notes}
        </p>
      )}
    </div>
  );
};
