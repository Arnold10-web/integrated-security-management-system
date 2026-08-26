import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastProps {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: number) => void;
}

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const BORDER_COLORS: Record<string, string> = {
  success: "border-emerald-500/40",
  error: "border-rose-500/40",
  warning: "border-amber-500/40",
  info: "border-cyan-500/40",
};

const ICON_COLORS: Record<string, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  warning: "text-amber-400",
  info: "text-cyan-400",
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
}) => {
  const Icon = ICONS[type] || Info;

  useEffect(() => {
    if (duration <= 0) return undefined;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-slate-900 border ${BORDER_COLORS[type]} rounded-2xl shadow-2xl p-3.5 text-white flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]`}
    >
      <span className={`shrink-0 mt-0.5 ${ICON_COLORS[type]}`}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-extrabold leading-snug">{title}</p>
        {message && (
          <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-relaxed">
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export interface ToastStackProps {
  toasts: Array<{
    id: number;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
  }>;
  onDismiss: (id: number) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
