import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Sun,
  SunMedium,
  Moon,
  X,
  CheckCircle2,
  Compass,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole, isActingInRole } from "../../services/rbacService";
import {
  APP_MODULES,
  APP_MODULE_GROUPS,
  getEffectiveModuleIds,
  getDefaultPathForRole,
  getModuleByPath,
  getModulesByGroup,
  getGroupById,
} from "../../constants/modules";
import { SystemWalkthroughModal } from "../ui/SystemWalkthroughModal";
import { ToastContainer } from "../ui/ToastContainer";
import { NotificationBell } from "../ui/NotificationBell";
import { useNotificationStore } from "../../stores/notificationStore";
import { CompanyLogo } from "../ui/CompanyLogo";
import { SYSTEM_SHORT, SYSTEM_NAME } from "../../constants/branding";

function getGreetingData() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: "Good morning",
      Icon: Sun,
      color: "text-amber-400",
      greetingMsg: "Wishing you a safe and highly productive morning on duty.",
    };
  }
  if (hour < 17) {
    return {
      text: "Good afternoon",
      Icon: SunMedium,
      color: "text-amber-300",
      greetingMsg: "Hope your shift and departmental operations are progressing smoothly.",
    };
  }
  return {
    text: "Good evening",
    Icon: Moon,
    color: "text-indigo-300",
    greetingMsg: "Ensuring secure operations and active surveillance through the evening.",
  };
}

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = useAuthStore((s) => s.currentUser);
  const showWelcomeBanner = useAuthStore((s) => s.showWelcomeBanner);
  const showWalkthroughModal = useAuthStore((s) => s.showWalkthroughModal);
  const logout = useAuthStore((s) => s.logout);
  const setShowWelcomeBanner = useAuthStore((s) => s.setShowWelcomeBanner);
  const setShowWalkthroughModal = useAuthStore((s) => s.setShowWalkthroughModal);
  const completeWalkthrough = useAuthStore((s) => s.completeWalkthrough);
  const getIdleTimeoutMs = useAuthStore((s) => s.getIdleTimeoutMs);

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const groupBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = () => {
    setOpenMenu(null);
    setMenuPos(null);
  };

  const toggleMenu = (id: string) => {
    if (openMenu === id) {
      closeMenu();
      return;
    }
    const btn = groupBtnRefs.current[id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setMenuPos({ left: rect.left, top: rect.bottom + 8, width: Math.max(rect.width, 248) });
    }
    setOpenMenu(id);
  };

  useEffect(() => {
    if (!openMenu) return undefined;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (groupBtnRefs.current[openMenu]?.contains(target)) return;
      closeMenu();
    };
    const onWindowScroll = () => closeMenu();
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("scroll", onWindowScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("scroll", onWindowScroll, true);
    };
  }, [openMenu]);

  useEffect(() => {
    setOpenMenu(null);
    setMenuPos(null);
  }, [pathname]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const resetIdleTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout("idle");
        navigate("/login", { replace: true });
      }, getIdleTimeoutMs());
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"] as const;
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    resetIdleTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetIdleTimer));
    };
  }, [currentUser, logout, navigate, getIdleTimeoutMs]);

  useEffect(() => {
    if (currentUser) {
      useDomainStore.getState().hydrateFromApi();
      useNotificationStore.getState().hydrateNotifications();
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const effectiveRole = getEffectiveRole(currentUser);
  const actingActive = isActingInRole(currentUser, effectiveRole);
  const allowedIds = getEffectiveModuleIds(effectiveRole, currentUser.customPermissions);
  const homePath = getDefaultPathForRole(effectiveRole);
  const currentModule = getModuleByPath(pathname);
  const activeGroup = currentModule?.group;

  const visibleGroups = APP_MODULE_GROUPS.map((group) => ({
    group,
    modules: getModulesByGroup(group.id).filter((tab) => allowedIds.includes(tab.id)),
  })).filter((g) => g.modules.length > 0);

  const openGroup = openMenu ? getGroupById(openMenu) : undefined;
  const openGroupModules = openGroup
    ? getModulesByGroup(openGroup.id).filter((tab) => allowedIds.includes(tab.id))
    : [];

  const handleLogout = () => {
    logout("manual");
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.Icon;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-cyan-100 selection:text-cyan-900">
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              className="flex items-center gap-3 cursor-pointer bg-transparent border-0 p-0 text-left"
              onClick={() => navigate(homePath)}
            >
              <CompanyLogo imgClassName="w-10 h-10 object-contain rounded-xl" iconClassName="w-6 h-6" />
              <div>
                <span className="font-black text-lg tracking-tight text-white block leading-none">
                  {SYSTEM_SHORT} <span className="text-cyan-400 text-xs font-semibold">ENTERPRISE</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {SYSTEM_NAME}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700/80 rounded-xl text-left">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  {currentUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-extrabold text-xs text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-bold">
                    {currentUser.department} • {effectiveRole}
                    {actingActive && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">Acting</span>
                    )}
                  </div>
                </div>
              </div>

              <NotificationBell />

              <button
                type="button"
                onClick={() => setShowWalkthroughModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                title="Launch Guided System Onboarding"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Onboarding</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                title="Logout of the system"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80">
            {visibleGroups.map(({ group, modules }) => {
              const GroupIcon = group.icon;
              const isActive = activeGroup === group.id;
              const single = modules.length === 1;
              return (
                <button
                  key={group.id}
                  type="button"
                  ref={(el) => {
                    groupBtnRefs.current[group.id] = el;
                  }}
                  onClick={() => {
                    if (single) {
                      navigate(modules[0].path);
                    } else {
                      toggleMenu(group.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  } ${openMenu === group.id ? "bg-slate-800 text-white" : ""}`}
                >
                  <GroupIcon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                  <span>{group.label}</span>
                  {!single && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${openMenu === group.id ? "rotate-180" : ""} ${isActive ? "text-slate-950" : "text-slate-500"}`}
                    />
                  )}
                  {group.utility && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                      TOOLS
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {openMenu && openGroup && openGroupModules.length > 0 && (() => {
            const GroupIcon = openGroup.icon;
            return (
              <div
                ref={menuRef}
                className="fixed z-50 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn"
                style={{ left: menuPos?.left ?? 0, top: menuPos?.top ?? 0, minWidth: menuPos?.width ?? 248 }}
              >
                <div className="px-4 py-3 bg-slate-900 text-white">
                  <div className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <GroupIcon className="w-3.5 h-3.5" />
                    <span>{openGroup.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Department workspace</div>
                </div>
                <div className="p-1.5">
                  {openGroupModules.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <NavLink
                        key={tab.id}
                        to={tab.path}
                        onClick={() => setOpenMenu(null)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-cyan-50 text-cyan-900"
                              : "text-slate-700 hover:bg-slate-100"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{tab.label}</span>
                        {tab.badge && (
                          <span className="ml-auto px-1.5 py-0.5 text-[9px] font-black rounded-full bg-amber-400 text-slate-950 max-w-[8rem] truncate">
                            {tab.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </header>

      {actingActive && currentUser.actingRole && currentUser.actingExpiresAt && (
        <div className="bg-amber-400 text-slate-950 border-b border-amber-500/60">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">Acting Privileges</span>
            <span>
              You are currently acting as <span className="underline">{currentUser.actingRole}</span> in place of your assigned{" "}
              {currentUser.role} role{currentUser.actingGrantedBy ? ` (granted by ${currentUser.actingGrantedBy})` : ""}.
            </span>
            <span className="text-slate-800">
              Expires {new Date(currentUser.actingExpiresAt).toLocaleString()} — privileges revert automatically on expiry.
            </span>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showWelcomeBanner && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-6 shadow-xl border border-slate-700/80 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-inner shrink-0 ${greeting.color}`}
                >
                  <GreetingIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {greeting.text}, <span className="text-cyan-400">{currentUser.name}</span>
                    </h2>

                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    {greeting.greetingMsg} Logged in as{" "}
                    <span className="font-bold text-white">{effectiveRole}</span> under the{" "}
                    <span className="font-bold text-cyan-300">{currentUser.department}</span>{" "}
                    department.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Active Station:{" "}
                        <strong className="text-slate-200">
                          {currentUser.region || "Kampala Central"}
                        </strong>
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Date:{" "}
                      <strong className="text-slate-200">
                        {new Date().toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWelcomeBanner(false)}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer self-start md:self-center shrink-0 border border-slate-700/50"
                title="Dismiss Welcome Message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <CompanyLogo imgClassName="w-4 h-4 object-contain" iconClassName="w-3 h-3" />
            <span>{SYSTEM_NAME} ({SYSTEM_SHORT})</span>
          </div>
          <p>© 2026 Integrated Security Company Ltd • Departmentally Secured RBAC Protocol</p>
        </div>
      </footer>

      <SystemWalkthroughModal
        isOpen={showWalkthroughModal}
        onClose={() => {
          completeWalkthrough();
        }}
        currentUser={currentUser}
        onNavigateTab={(tabId) => {
          const mod = APP_MODULES.find((m) => m.id === tabId);
          if (mod) navigate(mod.path);
        }}
      />

      <ToastContainer />
    </div>
  );
};
