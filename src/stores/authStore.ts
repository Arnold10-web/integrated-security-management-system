import { create } from "zustand";
import type { User, UserRole, CustomRoleDefinition } from "../types";
import { initialUsers, initialCustomRoles } from "../data/mockData";
import {
  clearPersistedSession,
  getIdleTimeoutMs,
  isWalkthroughCompleted,
  persistSessionUserId,
  readPersistedSessionUserId,
} from "../services/authService";
import { loginApi, logoutApi, updateUserApi, fetchUsers, issueStaffIdApi, revokeActingPrivilegeApi, createActingRequestApi, fetchActingRequestsApi, executeActingRequestApi, denyActingRequestApi } from "../services/authApi";
import type { ActingPrivilegeRequest } from "../types";
import { useAuditStore } from "./auditStore";
import { useDomainStore } from "./domainStore";

interface AuthState {
  currentUser: User | null;
  users: User[];
  customRoles: CustomRoleDefinition[];
  idleNotice: string | null;
  showWelcomeBanner: boolean;
  showWalkthroughModal: boolean;
  useApi: boolean;

  hydrateSession: () => void;
  setUseApi: (v: boolean) => void;
  login: (user: User) => void;
  loginWithApi: (email: string, password: string) => Promise<boolean>;
  logout: (reason?: "manual" | "idle") => void;
  setIdleNotice: (msg: string | null) => void;
  setShowWelcomeBanner: (v: boolean) => void;
  setShowWalkthroughModal: (v: boolean) => void;
  completeWalkthrough: () => void;

  addUser: (user: Omit<User, "id">) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleSuspendUser: (userId: string) => void;
  issueStaffId: (userId: string, idCardNumber: string) => Promise<void>;
  addCustomRole: (role: CustomRoleDefinition) => void;
  deleteCustomRole: (id: string) => void;
  setCurrentUserRole: (role: UserRole) => void;
  revokeActingPrivilege: (userId: string) => Promise<void>;
  actingRequests: ActingPrivilegeRequest[];
  createActingRequest: (input: { targetUserId: string; actingRole: UserRole; expiresAt: string; reason: string }) => Promise<void>;
  fetchActingRequests: () => Promise<void>;
  executeActingRequest: (requestId: string) => Promise<void>;
  denyActingRequest: (requestId: string) => Promise<void>;

  getActiveRole: () => UserRole | null;
  getIdleTimeoutMs: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: initialUsers,
  customRoles: initialCustomRoles,
  actingRequests: [],
  idleNotice: null,
  showWelcomeBanner: true,
  showWalkthroughModal: false,
  useApi: false,

  setUseApi: (v) => set({ useApi: v }),

  hydrateSession: () => {
    const id = readPersistedSessionUserId();
    if (!id) return;
    const user = get().users.find((u) => u.id === id && u.status === "Active");
    if (user) {
      set({
        currentUser: user,
        showWalkthroughModal: !isWalkthroughCompleted(user.id),
      });
    }
  },

  login: (user) => {
    if (user.status === "Suspended") {
      set({ idleNotice: "This account is suspended. Contact IT Officer." });
      return;
    }
    persistSessionUserId(user.id);
    set({
      currentUser: user,
      idleNotice: null,
      showWelcomeBanner: true,
      showWalkthroughModal: !isWalkthroughCompleted(user.id),
    });
    useAuditStore.getState().addLog(
      "User Authentication",
      `User ${user.name} logged into ${user.department} portal as ${user.role}.`,
      "Security & Auth",
      user
    );
  },

  loginWithApi: async (email, password) => {
    try {
      const data = await loginApi(email, password);
      const user: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role as UserRole,
        effectiveRole: data.user.effectiveRole ? (data.user.effectiveRole as UserRole) : (data.user.role as UserRole),
        actingRole: data.user.actingRole ? (data.user.actingRole as UserRole) : undefined,
        actingExpiresAt: data.user.actingExpiresAt ?? undefined,
        actingGrantedBy: data.user.actingGrantedBy ?? undefined,
        actingGrantedAt: data.user.actingGrantedAt ?? undefined,
        department: data.user.department,
        status: data.user.status as User["status"],
        lastActive: new Date().toISOString(),
        customPermissions: data.user.customPermissions ?? undefined,
      };
      persistSessionUserId(user.id);
      set({
        currentUser: user,
        idleNotice: null,
        showWelcomeBanner: true,
        showWalkthroughModal: !isWalkthroughCompleted(user.id),
        useApi: true,
      });
      useAuditStore.getState().addLog(
        "User Authentication",
        `User ${user.name} logged into ${user.department} portal as ${user.role}.`,
        "Security & Auth",
        user
      );
      useDomainStore.getState().hydrateFromApi();
      fetchUsers().then((serverUsers) => {
        set({ users: serverUsers });
      }).catch(() => {});
      return true;
    } catch (err: any) {
      set({ idleNotice: err.message || "Login failed. Check credentials." });
      return false;
    }
  },

  logout: (reason = "manual") => {
    const { currentUser } = get();
    if (currentUser) {
      const action = reason === "idle" ? "Session Timeout" : "User Session End";
      const details =
        reason === "idle"
          ? `User session for ${currentUser.name} (${currentUser.role}) was automatically ended after 30 minutes of inactivity.`
          : `User ${currentUser.name} locked session and logged out.`;
      useAuditStore.getState().addLog(action, details, "Security & Auth", currentUser);
    }
    clearPersistedSession();
    logoutApi();
    set({
      currentUser: null,
      idleNotice:
        reason === "idle"
          ? "You have been automatically logged out due to 30 minutes of inactivity to secure your account on this device."
          : null,
    });
  },

  setIdleNotice: (msg) => set({ idleNotice: msg }),
  setShowWelcomeBanner: (v) => set({ showWelcomeBanner: v }),
  setShowWalkthroughModal: (v) => set({ showWalkthroughModal: v }),

  completeWalkthrough: () => {
    const user = get().currentUser;
    if (user) {
      try {
        localStorage.setItem(`walkthrough_completed_${user.id}`, "true");
      } catch {
        /* ignore */
      }
    }
    set({ showWalkthroughModal: false });
  },

  addUser: (newUser) => {
    const user: User = { ...newUser, id: `usr-${Date.now()}` };
    set((s) => ({ users: [...s.users, user] }));
    useAuditStore.getState().addLog(
      "User Provisioned",
      `Created new user ${user.name} (${user.email}) as ${user.role} in ${user.department}`,
      "User Management",
      get().currentUser
    );
  },

  updateUser: (userId, updates) => {
    const { useApi } = get();
    const target = get().users.find((u) => u.id === userId);
    if (useApi) {
      updateUserApi(userId, updates).catch(() => {});
    }
    set((s) => ({
      users: s.users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
      currentUser:
        s.currentUser?.id === userId ? { ...s.currentUser, ...updates } : s.currentUser,
    }));
    useAuditStore.getState().addLog(
      "User Modified",
      `Updated user account ${target?.name || userId} credentials/department`,
      "User Management",
      get().currentUser
    );
  },

  deleteUser: (userId) => {
    const target = get().users.find((u) => u.id === userId);
    set((s) => ({ users: s.users.filter((u) => u.id !== userId) }));
    useAuditStore.getState().addLog(
      "User Deleted",
      `Deleted user account ${target?.name || userId}`,
      "User Management",
      get().currentUser
    );
  },

  toggleSuspendUser: (userId) => {
    set((s) => ({
      users: s.users.map((u) => {
        if (u.id !== userId) return u;
        const nextStatus = u.status === "Suspended" ? "Active" : "Suspended";
        useAuditStore.getState().addLog(
          "Account Status Toggled",
          `${nextStatus} user account ${u.name}`,
          "User Management",
          s.currentUser
        );
        return { ...u, status: nextStatus };
      }),
    }));
  },

  issueStaffId: async (userId, idCardNumber) => {
    const { useApi } = get();
    const today = new Date().toISOString().split("T")[0];
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 3);
    const expStr = exp.toISOString().split("T")[0];
    const issuer = get().currentUser?.name ?? "Records Officer";
    let serverExpiry = expStr;
    if (useApi) {
      try {
        const updated = await issueStaffIdApi(userId, idCardNumber);
        serverExpiry = (updated as any).idCardExpiryDate ?? expStr;
      } catch {
        /* keep local expiry */
      }
    }
    set((s) => ({
      users: s.users.map((u) =>
        u.id === userId
          ? { ...u, idCardStatus: "Issued & Active", idCardNumber, idCardIssuedDate: today, idCardExpiryDate: serverExpiry, idCardIssuerName: issuer }
          : u
      ),
      currentUser:
        s.currentUser?.id === userId
          ? { ...s.currentUser, idCardStatus: "Issued & Active", idCardNumber, idCardIssuedDate: today, idCardExpiryDate: serverExpiry, idCardIssuerName: issuer }
          : s.currentUser,
    }));
    useAuditStore.getState().addLog(
      "Staff ID Card Issued",
      `Issued staff plastic ID ${idCardNumber} to ${get().users.find((u) => u.id === userId)?.name || userId} (expires ${serverExpiry})`,
      "Identity & Records",
      get().currentUser
    );
  },

  addCustomRole: (role) => {
    set((s) => ({ customRoles: [...s.customRoles, role] }));
    useAuditStore.getState().addLog(
      "Role Definition Created",
      `Created custom role ${role.roleName} for ${role.department}`,
      "RBAC Security",
      get().currentUser
    );
  },

  deleteCustomRole: (id) => {
    const target = get().customRoles.find((r) => r.id === id);
    set((s) => ({ customRoles: s.customRoles.filter((r) => r.id !== id) }));
    useAuditStore.getState().addLog(
      "Role Definition Deleted",
      `Deleted custom role ${target?.roleName || id}`,
      "RBAC Security",
      get().currentUser
    );
  },

  setCurrentUserRole: (role) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set({ currentUser: { ...currentUser, role } });
  },

  revokeActingPrivilege: async (userId) => {
    const { useApi } = get();
    if (useApi) {
      const updated = await revokeActingPrivilegeApi(userId);
      const normalized: Partial<User> = {
        actingRole: undefined,
        actingExpiresAt: undefined,
        actingGrantedBy: undefined,
        actingGrantedAt: undefined,
        effectiveRole: (updated as any).effectiveRole as UserRole,
      };
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, ...normalized } : u)),
        currentUser:
          s.currentUser?.id === userId ? { ...s.currentUser, ...normalized } : s.currentUser,
      }));
    } else {
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId
            ? { ...u, actingRole: undefined, actingExpiresAt: undefined, actingGrantedBy: undefined, actingGrantedAt: undefined }
            : u
        ),
      }));
    }
    useAuditStore.getState().addLog(
      "Acting Privileges Revoked",
      `Revoked acting privileges from ${get().users.find((u) => u.id === userId)?.name || userId}`,
      "RBAC Security",
      get().currentUser
    );
  },

  /* §11 — HR Manager initiates (who/role/why); IT Officer executes on the request. */
  createActingRequest: async ({ targetUserId, actingRole, expiresAt, reason }) => {
    const { useApi } = get();
    if (useApi) {
      await createActingRequestApi({ targetUserId, actingRole, expiresAt, reason });
      await get().fetchActingRequests();
    } else {
      const request: ActingPrivilegeRequest = {
        id: `arp-${Date.now()}`,
        targetUserId,
        targetName: get().users.find((u) => u.id === targetUserId)?.name || targetUserId,
        actingRole,
        reason,
        expiresAt,
        status: "Pending",
        requestedById: get().currentUser?.id || "system",
        requestedByName: get().currentUser?.name || "HR Manager",
        createdAt: new Date().toISOString(),
      };
      set((s) => ({ actingRequests: [request, ...s.actingRequests] }));
    }
    useAuditStore.getState().addLog(
      "Acting Privileges Requested",
      `HR Manager requested ${actingRole} acting coverage for ${get().users.find((u) => u.id === targetUserId)?.name || targetUserId} until ${expiresAt} — ${reason}`,
      "HR",
      get().currentUser
    );
  },

  fetchActingRequests: async () => {
    if (!get().useApi) return;
    try {
      const requests = await fetchActingRequestsApi();
      set({ actingRequests: requests });
    } catch {
      /* keep existing list */
    }
  },

  executeActingRequest: async (requestId) => {
    const { useApi } = get();
    const request = get().actingRequests.find((r) => r.id === requestId);
    if (useApi) {
      const updated = await executeActingRequestApi(requestId);
      const normalized: Partial<User> = {
        actingRole: (updated as any).actingRole as UserRole,
        actingExpiresAt: (updated as any).actingExpiresAt,
        actingGrantedBy: (updated as any).actingGrantedBy,
        actingGrantedAt: (updated as any).actingGrantedAt,
        effectiveRole: (updated as any).effectiveRole as UserRole,
      };
      set((s) => ({
        users: s.users.map((u) => (u.id === (updated as any).id ? { ...u, ...normalized } : u)),
      }));
      await get().fetchActingRequests();
    } else if (request) {
      set((s) => ({
        users: s.users.map((u) =>
          u.id === request.targetUserId
            ? { ...u, actingRole: request.actingRole, actingExpiresAt: request.expiresAt, actingGrantedAt: new Date().toISOString(), actingGrantedBy: s.currentUser?.name ?? "IT Officer" }
            : u
        ),
        actingRequests: s.actingRequests.map((r) => (r.id === requestId ? { ...r, status: "Granted", grantedByName: s.currentUser?.name ?? "IT Officer", grantedAt: new Date().toISOString() } : r)),
      }));
    }
    useAuditStore.getState().addLog(
      "Acting Privileges Granted",
      `IT Officer executed HR request — granted ${request?.actingRole || ""} to ${request?.targetName || requestId}`,
      "RBAC Security",
      get().currentUser
    );
  },

  denyActingRequest: async (requestId) => {
    const { useApi } = get();
    if (useApi) {
      await denyActingRequestApi(requestId);
      await get().fetchActingRequests();
    } else {
      set((s) => ({
        actingRequests: s.actingRequests.map((r) => (r.id === requestId ? { ...r, status: "Denied", grantedByName: s.currentUser?.name ?? "IT Officer", grantedAt: new Date().toISOString() } : r)),
      }));
    }
    useAuditStore.getState().addLog(
      "Acting Privileges Denied",
      `IT Officer denied an HR acting-privilege request (${requestId})`,
      "RBAC Security",
      get().currentUser
    );
  },

  getActiveRole: () => get().currentUser?.role ?? null,
  getIdleTimeoutMs: () => getIdleTimeoutMs(),
}));
