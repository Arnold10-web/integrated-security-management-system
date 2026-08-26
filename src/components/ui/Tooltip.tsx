import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
}

const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowStyles: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delayMs = 300,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  }, [delayMs]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    },
    []
  );

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            aria-live="polite"
            className={`absolute z-[110] pointer-events-none ${positionStyles[position]}`}
          >
            <div className="bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap max-w-[240px] text-wrap">
              {content}
            </div>
            <div
              className={`absolute w-0 h-0 border-4 ${arrowStyles[position]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};
