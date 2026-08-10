import { create } from "zustand";
import type { AppNotification, NotificationRecord } from "../types";
import { domainApi } from "../services/domainApi";
import { getAccessToken } from "../services/apiClient";

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  hydrateNotifications: () => Promise<void>;
}

function persisted(): boolean {
  return Boolean(getAccessToken());
}

function mapServerRow(n: NotificationRecord): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    module: n.module ?? undefined,
    timestamp: n.createdAt,
    read: Boolean(n.readAt),
  };
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (n) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({
      notifications: [
        {
          ...n,
          id,
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...s.notifications,
      ],
    }));
    if (persisted()) {
      domainApi.notifications.create(n).catch(() => {});
    }
  },
  markAsRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    if (persisted()) {
      domainApi.notifications.markRead(id).catch(() => {});
    }
  },
  markAllAsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    if (persisted()) {
      domainApi.notifications.markAllRead().catch(() => {});
    }
  },
  clearNotification: (id) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }));
    if (persisted()) {
      domainApi.notifications.remove(id).catch(() => {});
    }
  },
  clearAll: () => set({ notifications: [] }),
  hydrateNotifications: async () => {
    if (!persisted()) return;
    try {
      const rows = await domainApi.notifications.list();
      set({ notifications: rows.map(mapServerRow) });
    } catch {
      /* keep current in-memory list if the fetch fails */
    }
  },
}));
