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
  FinanceInvoicesPage,
  FinanceExpensesPage,
  FinanceCashierPage,
  FinanceContractsFinancePage,
  MarketingPage,
  MarketingPipelinePage,
  MarketingCampaignsPage,
  FleetPage,
  FleetRegisterPage,
  FleetTripsPage,
  FleetFuelPage,
  FleetMaintenancePage,
  FleetDriversPage,
  FleetInspectionsPage,
  FleetBreakdownsPage,
  FleetGpsPage,
  AdministrationPage,
  ITPage,
  GuardPortalPage,
  ReportsPage,
  RecruitmentPage,
  DocumentsPage,
  WorkflowPage,
  EsignPage,
  DisciplinaryPage,
  HRRegisterPage,
  HRLeavePage,
  HRAppraisalsPage,
  HRContractsPage,
  HRRemittancesPage,
  HRStaffPage,
  HRPayrollPage,
  RecordsContractsPage,
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
        <Route path="/hr" element={<Navigate to="/hr/register" replace />} />
        <Route path="/hr/register" element={<HRRegisterPage />} />
        <Route path="/hr/leave" element={<HRLeavePage />} />
        <Route path="/hr/appraisals" element={<HRAppraisalsPage />} />
        <Route path="/hr/contracts" element={<HRContractsPage />} />
        <Route path="/hr/remittances" element={<HRRemittancesPage />} />
        <Route path="/hr/staff" element={<HRStaffPage />} />
        <Route path="/hr/payroll" element={<HRPayrollPage />} />
        <Route path="/identity" element={<IdentityPage />} />
        <Route path="/records/contracts" element={<RecordsContractsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/finance/invoices" element={<FinanceInvoicesPage />} />
        <Route path="/finance/expenses" element={<FinanceExpensesPage />} />
        <Route path="/finance/cashier" element={<FinanceCashierPage />} />
        <Route path="/finance/contracts" element={<FinanceContractsFinancePage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/marketing/pipeline" element={<MarketingPipelinePage />} />
        <Route path="/marketing/campaigns" element={<MarketingCampaignsPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/register" element={<FleetRegisterPage />} />
        <Route path="/fleet/trips" element={<FleetTripsPage />} />
        <Route path="/fleet/fuel" element={<FleetFuelPage />} />
        <Route path="/fleet/maintenance" element={<FleetMaintenancePage />} />
        <Route path="/fleet/drivers" element={<FleetDriversPage />} />
        <Route path="/fleet/inspections" element={<FleetInspectionsPage />} />
        <Route path="/fleet/breakdowns" element={<FleetBreakdownsPage />} />
        <Route path="/fleet/gps" element={<FleetGpsPage />} />
        <Route path="/administration" element={<AdministrationPage />} />
        <Route path="/it" element={<ITPage />} />
        <Route path="/guard-portal" element={<GuardPortalPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/recruitment" element={<RecruitmentPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/esign" element={<EsignPage />} />
        <Route path="/disciplinary" element={<DisciplinaryPage />} />
      </Route>
    </Routes>
  );
}
