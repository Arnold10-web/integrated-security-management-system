import React, { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, Info, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const iconMap: Record<string, React.FC<{ className?: string }>> = {
    info: Info, success: CheckCircle2, warning: AlertTriangle, error: AlertCircle,
  };
  const colorMap: Record<string, string> = {
    info: "text-blue-500", success: "text-emerald-500", warning: "text-amber-500", error: "text-rose-500",
  };
  const bgMap: Record<string, string> = {
    info: "bg-blue-50", success: "bg-emerald-50", warning: "bg-amber-50", error: "bg-rose-50",
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[18px]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-[70vh] flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-700">
              Notifications {notifications.length > 0 && `(${notifications.length})`}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = iconMap[n.type] || Info;
                const color = colorMap[n.type] || "text-blue-500";
                const bg = bgMap[n.type] || "bg-blue-50";
                return (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !n.read ? "bg-slate-50/80" : ""
                    }`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${bg} ${color} shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-slate-800 truncate">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {n.module && (
                            <span className="text-[9px] font-semibold text-slate-400 uppercase">{n.module}</span>
                          )}
                          <span className="text-[9px] text-slate-400">
                            {new Date(n.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-300 hover:text-slate-500 cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
