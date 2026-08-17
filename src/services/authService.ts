/**
 * Client auth session helpers.
 * TODO: migrate to httpOnly Secure cookie + CSRF; localStorage is XSS-exposed.
 * Keeping localStorage for now for backward compat, but idle timeout is enforced client-side
 * and server re-validates status/acting expiry per request (see server.ts authenticateToken).
 */

import type { User, UserRole } from "../types";
import { getDefaultPathForRole } from "../constants/modules";

const SESSION_KEY = "iscms_session_user_id";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  region?: string;
}

export function toSession(user: User): UserSession {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    department: user.department,
    region: user.region,
  };
}

export function persistSessionUserId(userId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {
    /* private mode / SSR */
  }
}

export function readPersistedSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getPostLoginPath(role: UserRole): string {
  return getDefaultPathForRole(role);
}

export function getIdleTimeoutMs(): number {
  return IDLE_TIMEOUT_MS;
}

export function isWalkthroughCompleted(userId: string): boolean {
  try {
    return localStorage.getItem(`walkthrough_completed_${userId}`) === "true";
  } catch {
    return false;
  }
}

export function markWalkthroughCompleted(userId: string): void {
  try {
    localStorage.setItem(`walkthrough_completed_${userId}`, "true");
  } catch {
    /* ignore */
  }
}
