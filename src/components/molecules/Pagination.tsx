import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Optional override for the "x–y of z" summary, e.g. "12 guards" */
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({ page, pageSize, total, onPageChange, itemName = "items" }) => {
  const pages = Math.max(Math.ceil(total / pageSize), 1);
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers: (number | "…")[] = [];
  const windowSize = 1;
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= windowSize) {
      pageNumbers.push(p);
    } else if (pageNumbers[pageNumbers.length - 1] !== "…") {
      pageNumbers.push("…");
    }
  }

  const btnBase =
    "flex items-center justify-center min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
      <p className="text-[11px] font-semibold text-slate-500">
        Showing <span className="font-black text-slate-700">{start}–{end}</span> of{" "}
        <span className="font-black text-slate-700">{total}</span> {itemName}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs font-bold text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${
                p === page
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={`${btnBase} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
