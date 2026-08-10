/**
 * Thin route pages: read Zustand stores and pass props to existing views.
 * Keeps god-view decomposition incremental while eliminating App.tsx prop drilling.
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useDomainStore } from "../stores/domainStore";
import { useAuditStore } from "../stores/auditStore";
import { getModuleById, getDefaultPathForRole } from "../constants/modules";
import { RegionsPanel } from "../components/ui/RegionsPanel";
import { RegionDashboardView } from "../components/views/RegionDashboardView";

import { DashboardView } from "../components/views/DashboardView";
import { OperationsView } from "../components/views/OperationsView";
import { IncidentsView } from "../components/views/IncidentsView";
import { GuardsHRView } from "../components/views/GuardsHRView";
import { ClientSitesView } from "../components/views/ClientSitesView";
import { FinanceView } from "../components/views/FinanceView";
import { MarketingView } from "../components/views/MarketingView";
import { FleetView } from "../components/views/FleetView";
import { AdminDeptView } from "../components/views/AdminDeptView";
import { ITAdminView } from "../components/views/ITAdminView";
import { RecordsIdentityView } from "../components/views/RecordsIdentityView";
import { GuardPortalView } from "../components/views/GuardPortalView";
import { LoginView } from "../components/views/LoginView";
import { ReportsView } from "../components/views/ReportsView";
import { RecruitmentView } from "../components/views/RecruitmentView";
import { DocumentManagementView } from "../components/views/DocumentManagementView";
import { WorkflowView } from "../components/views/WorkflowView";
import { PerformanceReviewsView } from "../components/views/PerformanceReviewsView";
import {
  ComplaintsPanel,
  DisciplinaryPanel,
  DeploymentsPanel,
  CampaignBudgetPanel,
  GuardAvailabilityByRegion,
  GuardLifecyclePanel,
  ExpenseApprovalPanel,
  CorporateGovernancePanel,
} from "../components/views/GovernancePanels";
import type { UserRole } from "../types";
import { getEffectiveRole } from "../services/rbacService";

function useActiveRole(): UserRole | null {
  const currentUser = useAuthStore((s) => s.currentUser);
  return currentUser ? getEffectiveRole(currentUser) : null;
}

export const DirectoratePage: React.FC = () => {
  const navigate = useNavigate();
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const auditLogs = useAuditStore((s) => s.logs);

  return (
    <div className="space-y-6">
      <CorporateGovernancePanel />
      <RegionsPanel
        offices={domain.regionalOffices}
        title="National Coverage — Operating Regions"
        onRegionClick={(regionName) => navigate(`/operations/regions/${encodeURIComponent(regionName)}`)}
      />
      <DashboardView
        guards={domain.guards}
        sites={domain.sites}
        incidents={domain.incidents}
        auditLogs={auditLogs}
        activeRole={activeRole}
        onNavigate={(tabId) => {
          const mod = getModuleById(tabId);
          if (mod) navigate(mod.path);
        }}
        armoury={domain.armoury}
        k9s={domain.k9s}
        leaveRequests={domain.leaveRequests}
        invoices={domain.invoices}
        performanceReviews={domain.performanceReviews}
      />
    </div>
  );
};

export const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const users = useAuthStore((s) => s.users);

  const existingForceNumbers = React.useMemo(
    () => [
      ...domain.guards.map((g) => g.guardCode),
      ...domain.drivers.map((d) => d.forceNumber || d.driverCode),
      ...users.map((u) => u.forceNumber || "").filter(Boolean),
    ],
    [domain.guards, domain.drivers, users]
  );

  return (
    <div className="space-y-6">
      <OperationsView
        roster={domain.dutyRoster}
        guards={domain.guards}
        sites={domain.sites}
        activeRole={activeRole}
        existingForceNumbers={existingForceNumbers}
        currentUserRegion={currentUser?.region}
        onUpdateRosterStatus={domain.updateRosterStatus}
        onAddRosterEntry={domain.addRosterEntry}
        onUpdateGuard={domain.updateGuard}
        onMoveLifecycle={domain.moveGuardLifecycle}
        armoury={domain.armoury}
        armouryLogs={domain.armouryLogs}
        onIssueArmouryItem={domain.issueArmouryItem}
        onReturnArmouryItem={domain.returnArmouryItem}
        onAddArmouryItem={domain.addArmouryItem}
        k9s={domain.k9s}
        k9Logs={domain.k9Logs}
        k9HealthInspections={domain.k9HealthInspections}
        onPairK9Handler={(dogId, handlerId) => {
          const guard = domain.guards.find((g) => g.id === handlerId);
          domain.pairK9Handler(dogId, handlerId, guard?.fullName ?? "Handler");
        }}
        onAddK9Dog={domain.addK9Dog}
        onUpdateK9Dog={domain.updateK9Dog}
        onDeleteK9Dog={domain.deleteK9Dog}
        onLogK9Deployment={domain.logK9Deployment}
        onAddK9HealthInspection={domain.addK9HealthInspection}
        onUpdateK9HealthInspection={domain.updateK9HealthInspection}
        onDeleteK9HealthInspection={domain.deleteK9HealthInspection}
        patrolInspections={domain.patrolInspections}
        onAddPatrolInspection={domain.addPatrolInspection}
        onUpdatePatrolInspection={domain.updatePatrolInspection}
        onDeletePatrolInspection={domain.deletePatrolInspection}
        trainingCohorts={domain.trainingCohorts}
        recruitTrainees={domain.recruitTrainees}
        onAddCohort={domain.addCohort}
        onUpdateCohort={domain.updateCohort}
        onDeleteCohort={domain.deleteCohort}
        onAddTrainee={domain.addTrainee}
        onUpdateTrainee={domain.updateTrainee}
        onDeleteTrainee={domain.deleteTrainee}
        onGraduateTrainee={domain.graduateTrainee}
        contracts={domain.contracts}
        onUpdateContract={domain.updateContract}
        onAdvanceApproval={domain.advanceContractApproval}
        onVoidContract={domain.voidContract}
      />
      <RegionsPanel
        offices={domain.regionalOffices}
        title="Operations Regions & Outerstations"
        onRegionClick={(regionName) => navigate(`/operations/regions/${encodeURIComponent(regionName)}`)}
      />
      <DeploymentsPanel />
    </div>
  );
};

export const RegionDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { regionName } = useParams<{ regionName: string }>();
  const domain = useDomainStore();
  const region = React.useMemo(() => decodeURIComponent(regionName ?? ""), [regionName]);

  return (
    <RegionDashboardView
      regionName={region}
      offices={domain.regionalOffices}
      guards={domain.guards}
      sites={domain.sites}
      incidents={domain.incidents}
      roster={domain.dutyRoster}
      patrolInspections={domain.patrolInspections}
      armoury={domain.armoury}
      k9s={domain.k9s}
      contracts={domain.contracts}
      leaveRequests={domain.leaveRequests}
      deployments={domain.deployments}
      deploymentOrders={domain.deploymentOrders}
      complaints={domain.complaints}
      disciplinaryActions={domain.disciplinaryActions}
      vehicles={domain.vehicles}
      onBack={() => navigate("/operations")}
    />
  );
};

export const InvestigationsPage: React.FC = () => {
  const domain = useDomainStore();

  return (
    <div className="space-y-6">
      <IncidentsView
        incidents={domain.incidents}
        onAddIncident={domain.addIncident}
        onResolveIncident={(id) => domain.resolveIncident(id, "Resolved via Investigations")}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DisciplinaryPanel />
        <ComplaintsPanel />
      </div>
    </div>
  );
};

export const HRPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DisciplinaryPanel />
        <GuardLifecyclePanel />
      </div>
      <GuardsHRView
      guards={domain.guards}
      activeRole={activeRole}
      onAddGuard={domain.addGuard}
      onUpdateGuard={domain.updateGuard}
      onMoveLifecycle={domain.moveGuardLifecycle}
      onIssueWarning={(_id) => { /* handled by internal modal */ }}
      leaveRequests={domain.leaveRequests}
      performanceReviews={domain.performanceReviews}
      onAddLeaveRequest={domain.addLeaveRequest}
      onUpdateLeaveRequest={domain.updateLeaveRequest}
      onHrApproveLeave={domain.hrApproveLeave}
      onGmApproveLeave={domain.gmApproveLeave}
      onDeleteLeaveRequest={domain.deleteLeaveRequest}
      contracts={domain.contracts}
      onAddContract={domain.addContract}
      onUpdateContract={domain.updateContract}
      onIssueContract={domain.issueContract}
      onArchiveContract={domain.archiveContract}
      onVoidContract={domain.voidContract}
      onAdvanceApproval={domain.advanceContractApproval}
      onArchiveGuard={domain.archiveGuard}
      />
    </div>
  );
};

export const IdentityPage: React.FC = () => {
  return <RecordsIdentityView />;
};

export const ClientsPage: React.FC = () => {
  const domain = useDomainStore();
  return (
    <ClientSitesView sites={domain.sites} onAddSite={domain.addSite} onUpdateSite={domain.updateSite} onDeleteSite={domain.deleteSite} />
  );
};

export const FinancePage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseApprovalPanel />
        <CampaignBudgetPanel />
      </div>
      <FinanceView
      activeRole={activeRole}
      invoices={domain.invoices}
      expenses={domain.expenses}
      cashierTxns={domain.cashierTxns}
      onAddInvoice={domain.addInvoice}
      onUpdateInvoice={domain.updateInvoice}
      onDeleteInvoice={domain.deleteInvoice}
      onApproveInvoice={domain.approveInvoice}
      onAddExpense={domain.addExpense}
      onDeleteExpense={domain.deleteExpense}
      onDisburseAdvance={domain.disburseAdvance}
      onApproveCashierTxn={domain.approveCashierTxn}
      onRejectCashierTxn={domain.rejectCashierTxn}
      contracts={domain.contracts}
      onUpdateContract={domain.updateContract}
      onAdvanceApproval={domain.advanceContractApproval}
      onVoidContract={domain.voidContract}
    />
    </div>
  );
};

export const MarketingPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <MarketingView
      activeRole={activeRole}
      leads={domain.leads}
      campaigns={domain.campaigns}
      onAddLead={domain.addLead}
      onUpdateLead={domain.updateLead}
      onDeleteLead={domain.deleteLead}
      onReassignLead={domain.reassignLead}
      onUpdateCampaign={domain.updateCampaign}
      onDeleteCampaign={domain.deleteCampaign}
      collections={domain.collections}
      onSendReminder={domain.sendReminder}
      contracts={domain.contracts}
      onAddContract={domain.addContract}
      onUpdateContract={domain.updateContract}
      onAdvanceApproval={domain.advanceContractApproval}
      onVoidContract={domain.voidContract}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CampaignBudgetPanel />
        <ComplaintsPanel />
      </div>
      <GuardAvailabilityByRegion />
    </div>
  );
};

export const FleetPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 text-xs">
        <span className="font-black text-cyan-400 uppercase tracking-wider text-[10px]">
          Organizational note
        </span>
        <p className="mt-1 text-slate-300">
          <strong className="text-white">Fleet Manager</strong> reports to the{" "}
          <strong className="text-white">Operations Manager</strong>. This Fleet module is the
          operational workspace for vehicles, fuel, and maintenance.
        </p>
      </div>
      <FleetView
        vehicles={domain.vehicles}
        activeRole={activeRole}
        onAddVehicle={domain.addVehicle}
        onUpdateVehicle={domain.updateVehicle}
        onDeleteVehicle={domain.deleteVehicle}
        onLogFuel={domain.logFuel}
        tripLogs={domain.trips}
        fuelLogs={domain.fuelLogs}
        maintenanceLogs={domain.maintenanceLogs}
        drivers={domain.drivers}
        inspections={domain.inspections}
        breakdowns={domain.breakdowns}
        onAddTrip={domain.addTrip}
        onAddFuelLog={domain.addFuelLog}
        onAddMaintenanceLog={domain.addMaintenanceLog}
        onAddDriver={domain.addDriver}
        onUpdateDriver={domain.updateDriver}
        onApproveDriver={domain.approveDriver}
        onAddInspection={domain.addInspection}
        onAddBreakdown={domain.addBreakdown}
      />
    </div>
  );
};

export const AdministrationPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <AdminDeptView
      activeRole={activeRole}
      requisitions={domain.adminRequisitions}
      onAddRequisition={domain.addRequisition}
      onApproveRequisition={domain.approveRequisition}
      onRejectRequisition={domain.rejectRequisition}
      onAddSite={domain.addSite}
    />
  );
};

export const ITPage: React.FC = () => {
  const navigate = useNavigate();
  const activeRole = useActiveRole();
  const setCurrentUserRole = useAuthStore((s) => s.setCurrentUserRole);
  const users = useAuthStore((s) => s.users);
  const customRoles = useAuthStore((s) => s.customRoles);
  const addUser = useAuthStore((s) => s.addUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);
  const toggleSuspendUser = useAuthStore((s) => s.toggleSuspendUser);
  const addCustomRole = useAuthStore((s) => s.addCustomRole);
  const deleteCustomRole = useAuthStore((s) => s.deleteCustomRole);
  const grantActingPrivilege = useAuthStore((s) => s.grantActingPrivilege);
  const revokeActingPrivilege = useAuthStore((s) => s.revokeActingPrivilege);
  const setShowWalkthroughModal = useAuthStore((s) => s.setShowWalkthroughModal);
  const domain = useDomainStore();
  const auditLogs = useAuditStore((s) => s.logs);

  return (
    <ITAdminView
      users={users}
      guards={domain.guards}
      customRoles={customRoles}
      servers={domain.itServers}
      tickets={domain.itTickets}
      itAssets={domain.itAssets}
      auditLogs={auditLogs}
      activeRole={activeRole}
      regions={domain.regions}
      onRoleChange={(newRole) => {
        setCurrentUserRole(newRole);
        navigate(getDefaultPathForRole(newRole));
      }}
      onAddUser={addUser}
      onUpdateUser={updateUser}
      onDeleteUser={deleteUser}
      onToggleSuspendUser={toggleSuspendUser}
      onAddCustomRole={addCustomRole}
      onDeleteCustomRole={deleteCustomRole}
      onAddITAsset={domain.addITAsset}
      onUpdateITAsset={domain.updateITAsset}
      onDeleteITAsset={domain.deleteITAsset}
      onUpdateGuard={domain.updateGuard}
      onTriggerWalkthroughForUser={() => setShowWalkthroughModal(true)}
      onGrantActingPrivilege={grantActingPrivilege}
      onRevokeActingPrivilege={revokeActingPrivilege}
      onAddRegion={domain.addRegion}
      onUpdateRegion={domain.updateRegion}
      onDeleteRegion={domain.deleteRegion}
      onUpdateServer={domain.updateITServer}
      onDeleteServer={domain.deleteITServer}
      onAddTicket={domain.addITTicket}
      onUpdateTicket={domain.updateITTicket}
      onDeleteTicket={domain.deleteITTicket}
    />
  );
};

export const ReportsPage: React.FC = () => {
  const domain = useDomainStore();
  return (
    <ReportsView
      guards={domain.guards}
      sites={domain.sites}
      incidents={domain.incidents}
      vehicles={domain.vehicles}
      invoices={domain.invoices}
      expenses={domain.expenses}
      leaveRequests={domain.leaveRequests}
      performanceReviews={domain.performanceReviews}
    />
  );
};

export const RecruitmentPage: React.FC = () => {
  const domain = useDomainStore();
  const activeRole = useActiveRole();
  return (
    <RecruitmentView
      jobPostings={domain.jobPostings}
      candidates={domain.candidates}
      activeRole={activeRole}
      onAddJobPosting={domain.addJobPosting}
      onUpdateJobPosting={domain.updateJobPosting}
      onAddCandidate={domain.addCandidate}
      onUpdateCandidate={domain.updateCandidate}
    />
  );
};

export const DocumentsPage: React.FC = () => {
  const domain = useDomainStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  return (
    <DocumentManagementView
      documents={domain.documents}
      onUploadDocument={domain.uploadDocument}
      onUpdateDocument={domain.updateDocument}
      onDeleteDocument={domain.deleteDocument}
      currentUser={currentUser}
    />
  );
};

export const WorkflowPage: React.FC = () => {
  const domain = useDomainStore();
  return (
    <WorkflowView
      workflows={domain.workflows}
      approvals={domain.approvals}
      onAddWorkflow={domain.addWorkflow}
      onUpdateWorkflow={domain.updateWorkflow}
      onDeleteWorkflow={domain.deleteWorkflow}
      onActOnApproval={domain.actOnApproval}
    />
  );
};

export const PerformanceReviewsPage: React.FC = () => {
  const domain = useDomainStore();
  return (
    <PerformanceReviewsView
      reviews={domain.performanceReviews}
      guards={domain.guards}
      onAddReview={domain.addPerformanceReview}
      onUpdateReview={domain.updatePerformanceReview}
    />
  );
};

export const GuardPortalPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const addIncident = useDomainStore((s) => s.addIncident);
  const addLeaveRequest = useDomainStore((s) => s.addLeaveRequest);
  const updateLeaveRequest = useDomainStore((s) => s.updateLeaveRequest);
  const deleteLeaveRequest = useDomainStore((s) => s.deleteLeaveRequest);
  const leaveRequests = useDomainStore((s) => s.leaveRequests);
  const guards = useDomainStore((s) => s.guards);
  const dutyRoster = useDomainStore((s) => s.dutyRoster);
  if (!currentUser) return null;
  return <GuardPortalView
    currentUser={currentUser}
    onLogIncident={addIncident}
    onAddLeaveRequest={addLeaveRequest}
    onUpdateLeaveRequest={updateLeaveRequest}
    onDeleteLeaveRequest={deleteLeaveRequest}
    leaveRequests={leaveRequests}
    guards={guards}
    dutyRoster={dutyRoster}
  />;
};

export const LoginPage: React.FC = () => {
  const loginWithApi = useAuthStore((s) => s.loginWithApi);
  const idleNotice = useAuthStore((s) => s.idleNotice);
  return <LoginView onLogin={loginWithApi} idleNotice={idleNotice} />;
};
