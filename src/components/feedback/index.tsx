import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-slate-200 rounded-xl w-full" />
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; message: string; actionText?: string; onAction?: () => void }> = ({
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
      <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
      <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorAlert: React.FC<{ title?: string; message: string }> = ({
  title = 'System Alert',
  message,
}) => {
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <h4 className="text-xs font-bold text-rose-900">{title}</h4>
        <p className="text-xs text-rose-700">{message}</p>
      </div>
    </div>
  );
};
