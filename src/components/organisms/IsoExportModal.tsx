import React, { useState } from "react";
import { X, Download, CheckSquare, Loader2, Fingerprint } from "lucide-react";

export interface FingerExportRow {
  key: string; // forceNumber or userId
  label: string;
  fingerCount: number;
  hasAllTen: boolean;
}

interface IsoExportModalProps {
  show: boolean;
  rows: FingerExportRow[];
  onClose: () => void;
  onExport: (keys: string[]) => Promise<void>;
}

export const IsoExportModal: React.FC<IsoExportModalProps> = ({ show, rows, onClose, onExport }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  if (!show) return null;

  const toggle = (key: string) =>
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    rows.forEach((r) => (all[r.key] = true));
    setSelected(all);
  };

  const clear = () => setSelected({});

  const selectedCount = rows.filter((r) => selected[r.key]).length;

  const handleExport = async () => {
    setError("");
    setExporting(true);
    try {
      await onExport(rows.filter((r) => selected[r.key]).map((r) => r.key));
      setExporting(false);
    } catch (e: any) {
      setError(e.message || "Export failed");
      setExporting(false);
    }
  };

  const enrolledCount = rows.length;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Export Fingerprints (ISO/IEC 19794)</h3>
              <p className="text-xs text-slate-500">
                Bundles selected subjects into a single CBEFF .bir file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {enrolledCount} enrolled · <span className="font-bold text-indigo-600">{selectedCount}</span> selected
          </span>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer">
              <CheckSquare className="w-3 h-3 inline mr-1" />All
            </button>
            <button onClick={clear} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
          {rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              No personnel have enrolled fingerprints yet. Capture fingerprints first.
            </div>
          ) : (
            rows.map((r) => {
              const on = !!selected[r.key];
              return (
                <button
                  key={r.key}
                  onClick={() => toggle(r.key)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                    on ? "bg-indigo-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-colors ${
                        on ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                      }`}
                    >
                      {on && <span className="text-white text-[10px] leading-none">✓</span>}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 truncate">{r.label}</span>
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[14ch]">{r.key}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      r.hasAllTen ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.fingerCount}/10
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={selectedCount === 0 || exporting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Exporting ISO file..." : `Export ${selectedCount} Subject${selectedCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
};
