import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { LoginPage } from "./pages/ModulePages";
import { AppShell } from "./components/layout/AppShell";
import { getDefaultPathForRole } from "./constants/modules";
import { getEffectiveRole } from "./services/rbacService";
import {
  DirectoratePage,
  OperationsPage,
  RegionDashboardPage,
  InvestigationsPage,
  HRPage,
  IdentityPage,
  ClientsPage,
  FinancePage,
  MarketingPage,
  FleetPage,
  AdministrationPage,
  ITPage,
  GuardPortalPage,
  ReportsPage,
  RecruitmentPage,
  DocumentsPage,
  WorkflowPage,
  PerformanceReviewsPage,
} from "./pages/ModulePages";

export default function App() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const hydrateSession = useAuthStore((s) => s.hydrateSession);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (currentUser && location.pathname === "/login") {
      navigate(getDefaultPathForRole(getEffectiveRole(currentUser)), { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  if (!currentUser) {
    return <LoginPage />;
  }

  const homePath = getDefaultPathForRole(getEffectiveRole(currentUser));

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={homePath} replace />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={homePath} replace />} />
        <Route path="/directorate" element={<DirectoratePage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/operations/regions/:regionName" element={<RegionDashboardPage />} />
        <Route path="/investigations" element={<InvestigationsPage />} />
        <Route path="/hr" element={<HRPage />} />
        <Route path="/identity" element={<IdentityPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/administration" element={<AdministrationPage />} />
        <Route path="/it" element={<ITPage />} />
        <Route path="/guard-portal" element={<GuardPortalPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/recruitment" element={<RecruitmentPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/performance-reviews" element={<PerformanceReviewsPage />} />
      </Route>
    </Routes>
  );
}
