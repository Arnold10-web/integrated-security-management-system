import React from "react";
import { Section } from "../types";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ListChecks, 
  Boxes,
} from "lucide-react";

interface SectionViewerProps {
  section: Section;
  searchTerm: string;
}

export const SectionViewer: React.FC<SectionViewerProps> = ({ section, searchTerm }) => {
  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-slate-900 rounded px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <article id={section.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-20">
      
      {/* Section Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {highlightText(section.title)}
        </h2>
        {section.subtitle && (
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {highlightText(section.subtitle)}
          </p>
        )}
      </div>

      {/* Content Blocks */}
      <div className="space-y-6 text-slate-700 leading-relaxed text-sm sm:text-base">
        {section.content.map((block, idx) => {
          if (block.type === "paragraph") {
            return (
              <p key={idx} className="text-slate-700">
                {block.boldLabel && (
                  <strong className="font-semibold text-slate-900 mr-1.5">
                    {block.boldLabel}
                  </strong>
                )}
                {highlightText(block.text)}
              </p>
            );
          }

          if (block.type === "list") {
            return (
              <div key={idx} className="bg-slate-50/70 rounded-lg p-4 sm:p-5 border border-slate-100 space-y-3">
                {block.title && (
                  <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-blue-600" />
                    {highlightText(block.title)}
                  </h3>
                )}
                <ul className="space-y-2">
                  {block.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>{highlightText(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          if (block.type === "modules") {
            return (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.modules.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-4 rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                        {highlightText(mod.name)}
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {mod.category}
                      </span>
                    </div>
                    <ul className="space-y-1.5 mt-3">
                      {mod.items.map((it, itIdx) => (
                        <li key={itIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{highlightText(it)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          }

          if (block.type === "callout") {
            const isWarning = block.variant === "warning";
            const isSuccess = block.variant === "success";

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isWarning
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : isSuccess
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-blue-50 border-blue-200 text-blue-900"
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm tracking-tight mb-1">
                    {highlightText(block.title)}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    {highlightText(block.text)}
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
};
