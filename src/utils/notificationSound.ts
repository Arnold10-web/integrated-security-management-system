import { useAuthStore } from "../stores/authStore";

const KEY_PREFIX = "iscms.notificationSound";

function preferenceKey(): string | null {
  const id = useAuthStore.getState().currentUser?.id;
  return id ? `${KEY_PREFIX}.${id}` : null;
}

export function isNotificationSoundEnabled(): boolean {
  const key = preferenceKey();
  if (!key) return true;
  return localStorage.getItem(key) !== "off";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  const key = preferenceKey();
  if (!key) return;
  localStorage.setItem(key, enabled ? "on" : "off");
}

/* Subtle two-tone chime via the Web Audio API (no audio asset required). */
export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
    window.setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    /* audio unavailable — fail silently */
  }
}
