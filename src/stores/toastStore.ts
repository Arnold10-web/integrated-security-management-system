import { create } from "zustand";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (title: string, opts?: { type?: ToastMessage["type"]; message?: string }) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (title, opts) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, title, type: opts?.type ?? "info", message: opts?.message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().show(title, { type: "success", message }),
  error: (title: string, message?: string) => useToastStore.getState().show(title, { type: "error", message }),
  info: (title: string, message?: string) => useToastStore.getState().show(title, { type: "info", message }),
  warning: (title: string, message?: string) => useToastStore.getState().show(title, { type: "warning", message }),
};
