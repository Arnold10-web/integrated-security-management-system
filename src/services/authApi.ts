import { api, setAccessToken, getAccessToken } from "./apiClient";
import type { User } from "../types";

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    effectiveRole?: string;
    actingRole?: string | null;
    actingExpiresAt?: string | null;
    actingGrantedBy?: string | null;
    actingGrantedAt?: string | null;
    department: string;
    status: string;
    customPermissions?: Record<string, "view" | "full" | "none"> | null;
  };
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/auth/login", { email, password });
  setAccessToken(data.token);
  return data;
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
  role: string,
  department: string
): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/auth/register", { name, email, password, role, department });
  setAccessToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const token = getAccessToken();
    if (!token) return null;
    return await api.get<User>("/auth/me");
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function fetchUsers(): Promise<User[]> {
  return api.get<User[]>("/auth/users");
}

export async function updateUserApi(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  return api.put<User>(`/auth/users/${userId}`, updates);
}

export async function grantActingPrivilegeApi(
  userId: string,
  actingRole: string,
  expiresAt: string
): Promise<User> {
  return api.put<User>(`/auth/users/${userId}/acting`, { actingRole, expiresAt });
}

export async function revokeActingPrivilegeApi(userId: string): Promise<User> {
  return api.delete<User>(`/auth/users/${userId}/acting`);
}

export function logoutApi(): void {
  setAccessToken(null);
}
