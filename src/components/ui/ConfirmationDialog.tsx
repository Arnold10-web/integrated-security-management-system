import React, { useEffect, useCallback } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20",
    accentBar: "from-rose-500 via-red-500 to-orange-500",
  },
  warning: {
    icon: AlertCircle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20",
    accentBar: "from-amber-500 via-orange-500 to-yellow-500",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20",
    accentBar: "from-blue-500 via-cyan-500 to-teal-500",
  },
};

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    },
    [onCancel, onConfirm]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className={`h-1.5 bg-gradient-to-r ${config.accentBar}`} />
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${config.iconBg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{message}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${config.confirmBtn}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
