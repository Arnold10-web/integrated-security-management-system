import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useToastStore } from "../../stores/toastStore";

const ICONS = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  error: <XCircle className="w-5 h-5 text-rose-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  info: <Info className="w-5 h-5 text-cyan-400" />,
};

const BORDERS = {
  success: "border-emerald-500/40",
  error: "border-rose-500/40",
  warning: "border-amber-500/40",
  info: "border-cyan-500/40",
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`bg-slate-900 border ${BORDERS[t.type]} rounded-2xl shadow-2xl p-3.5 text-white animate-fadeIn flex items-start gap-3`}
        >
          <span className="shrink-0 mt-0.5">{ICONS[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold leading-snug">{t.title}</p>
            {t.message && <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-relaxed">{t.message}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
