/**
 * Thin route pages: read Zustand stores and pass props to existing views.
 * Keeps god-view decomposition incremental while eliminating App.tsx prop drilling.
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DigitalContractsView } from "../components/views/DigitalContractsView";
import { useAuthStore } from "../stores/authStore";
import { useDomainStore } from "../stores/domainStore";
import { useAuditStore } from "../stores/auditStore";
import { getModuleById, getDefaultPathForRole } from "../constants/modules";
import { RegionsPanel } from "../components/ui/RegionsPanel";
import { RegionDashboardView } from "../components/views/RegionDashboardView";

import { DashboardView } from "../components/views/DashboardView";
import { OperationsWorkspaceView } from "../components/views/OperationsWorkspaceView";
import { ContractInquiryPanel } from "../components/views/ContractInquiryPanel";
import { GeneralManagerWorkspaceView } from "../components/views/GeneralManagerWorkspaceView";
import { IncidentsView } from "../components/views/IncidentsView";
import { GuardsHRView } from "../components/views/GuardsHRView";
import { ActingRequestPanel } from "../components/views/ActingRequestPanel";
import { ClientSitesView } from "../components/views/ClientSitesView";
import { FinanceView } from "../components/views/FinanceView";
import { MarketingView } from "../components/views/MarketingView";
import { FleetView } from "../components/views/FleetView";
import { AdminDeptView } from "../components/views/AdminDeptView";
import { ITAdminView } from "../components/views/ITAdminView";
import { RecordsIdentityView } from "../components/views/RecordsIdentityView";
import { FleetManagerWorkspaceView, InvestigationsWorkspace } from "../components/views/WorkspaceStrips";
import { MarketingWorkspaceStrip, FinanceWorkspaceStrip, AdministrationWorkspaceStrip } from "../components/views/DeptOverhauls";
import { GuardPortalView } from "../components/views/GuardPortalView";
import { LoginView } from "../components/views/LoginView";
import { ReportsView } from "../components/views/ReportsView";
import { RecruitmentView } from "../components/views/RecruitmentView";
import { DocumentManagementView } from "../components/views/DocumentManagementView";
import { WorkflowView } from "../components/views/WorkflowView";
import { PerformanceReviewsView } from "../components/views/PerformanceReviewsView";
import { Scale } from "lucide-react";
import {
  ComplaintsPanel,
  DisciplinaryPanel,
  CampaignBudgetPanel,
  GuardAvailabilityByRegion,
  CorporateGovernancePanel,
} from "../components/views/GovernancePanels";
import { ArmouryView } from "../components/views/ArmouryView";
import { K9UnitView } from "../components/views/K9UnitView";
import { TrainingSchoolView } from "../components/views/TrainingSchoolView";
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
      <GeneralManagerWorkspaceView />
      <ContractInquiryPanel />
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
        invoices={domain.invoices}
      />
    </div>
  );
};

export const OperationsPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const users = useAuthStore((s) => s.users);

  const existingForceNumbers = React.useMemo(
    () => [
      ...domain.guards.map((g) => g.forceNumber),
      ...domain.drivers.map((d) => d.forceNumber || d.driverCode),
      ...users.map((u) => u.forceNumber || "").filter(Boolean),
    ],
    [domain.guards, domain.drivers, users]
  );

  return (
    <div className="space-y-6">
      {activeRole === "Training Officer" && (
        <TrainingSchoolView
          cohorts={domain.trainingCohorts}
          trainees={domain.recruitTrainees}
          activeRole={activeRole}
          onAddCohort={domain.addCohort}
          onUpdateCohort={domain.updateCohort}
          onDeleteCohort={domain.deleteCohort}
          onAddTrainee={domain.addTrainee}
          onUpdateTrainee={domain.updateTrainee}
          onDeleteTrainee={domain.deleteTrainee}
          onGraduateTrainee={domain.graduateTrainee}
          existingForceNumbers={existingForceNumbers}
        />
      )}
      {activeRole === "Armorer" && (
        <ArmouryView
          items={domain.armoury}
          logs={domain.armouryLogs}
          guards={domain.guards}
          activeRole={activeRole}
          onIssueItem={domain.issueArmouryItem}
          onReturnItem={domain.returnArmouryItem}
          onAddItem={domain.addArmouryItem}
        />
      )}
      {(activeRole === "K9 Supervisor" || activeRole === "K9 Handler") && (
        <K9UnitView
          k9s={domain.k9s}
          logs={domain.k9Logs}
          healthInspections={domain.k9HealthInspections}
          guards={domain.guards}
          onPairHandler={(dogId, handlerId) => {
            const guard = domain.guards.find((g) => g.id === handlerId);
            domain.pairK9Handler(dogId, handlerId, guard?.fullName ?? "Handler");
          }}
          onAddDog={domain.addK9Dog}
          onUpdateK9Dog={domain.updateK9Dog}
          onDeleteK9Dog={domain.deleteK9Dog}
          onLogDeployment={domain.logK9Deployment}
          onAddHealthInspection={domain.addK9HealthInspection}
          onUpdateK9HealthInspection={domain.updateK9HealthInspection}
          onDeleteK9HealthInspection={domain.deleteK9HealthInspection}
        />
      )}
      {activeRole !== "Training Officer" && activeRole !== "Armorer" && activeRole !== "K9 Supervisor" && activeRole !== "K9 Handler" && (
        <OperationsWorkspaceView />
      )}
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
      <InvestigationsWorkspace />
      <IncidentsView
        incidents={domain.incidents}
        onAddIncident={domain.addIncident}
        onResolveIncident={(id) => domain.resolveIncident(id, "Resolved via Investigations")}
      />
      <ComplaintsPanel />
    </div>
  );
};

export const DisciplinaryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 text-white">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-slate-900">Disciplinary Actions — Charge Sheet (Cat 1 / Cat 2)</h1>
            <p className="text-xs text-slate-500">Chain: Investigations Officer → Regional Manager → Operations Manager → HR Manager (final). Investigations initiates; each approver reviews and forwards; HR Manager finalizes and closes.</p>
          </div>
        </div>
      </div>
      <DisciplinaryPanel />
    </div>
  );
};

export const RecordsContractsPage: React.FC = () => {
  const domain = useDomainStore();
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return domain.contracts;
    return domain.contracts.filter((c) =>
      [c.contractCode, c.title, c.partyName, c.relatedSiteName ?? "", c.category, c.documentRef].some((v) =>
        String(v).toLowerCase().includes(query)
      )
    );
  }, [domain.contracts, q]);
  const selected = selectedId ? domain.contracts.find((c) => c.id === selectedId) ?? null : null;

  const printContract = (c: (typeof domain.contracts)[number]) => {
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return;
    const fmt = (n?: number) => (n == null ? "—" : n.toLocaleString());
    w.document.write(`<!DOCTYPE html><html><head><title>${c.contractCode} — ${c.title}</title>
<style>body{font-family:'Times New Roman',serif;color:#111;margin:48px;line-height:1.6}.head{text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:16px;margin-bottom:28px}.head h1{margin:0;font-size:26px;letter-spacing:1px;color:#1e3a5f}.head p{margin:2px 0;font-size:12px}h2{font-size:16px;border-bottom:1px solid #999;padding-bottom:4px;margin-top:26px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc;font-size:13px}.row span:first-child{color:#444}.clause{font-size:13px;text-align:justify;margin:10px 0}.sig{margin-top:56px;display:flex;justify-content:space-between}.sig div{width:44%;text-align:center}.sig .line{border-top:1px solid #000;margin-top:44px;padding-top:6px;font-size:12px}@media print{body{margin:24px}}</style></head><body>
<div class="head"><h1>INTEGRATED SECURITY COMPANY LTD</h1><p>Contract Reference: <b>${c.contractCode}</b></p></div>
<h2>1. Parties</h2><div class="row"><span>Client / Counterparty</span><span>${c.partyName}</span></div><div class="row"><span>Type</span><span>${c.contractType} — ${c.category}</span></div><div class="row"><span>Site</span><span>${c.relatedSiteName || c.region || "—"}</span></div>
<h2>2. Term &amp; Value</h2><div class="row"><span>Period</span><span>${c.startDate} → ${c.endDate}</span></div><div class="row"><span>Value</span><span>UGX ${fmt(c.valueUgx)} / ${c.billingCycle || "term"}</span></div><div class="row"><span>Payment</span><span>${c.paymentTerms || "As agreed"}</span></div>
<h2>3. SLA</h2><div class="clause">${(c.slaTerms || "Per SLA.").replace(/\n/g, "<br/>")}</div>
<h2>4. Records</h2><div class="row"><span>Managed By</span><span>${c.managedBy}</span></div><div class="row"><span>Document Ref</span><span>${c.documentRef}</span></div><div class="row"><span>Status</span><span>${c.status}</span></div>
<div class="sig"><div><b>For Client</b><div class="line">Name, Signature & Date</div></div><div><b>For ISC</b><div class="line">Name, Signature & Date</div></div></div>
<p style="text-align:center;font-size:11px;color:#777;margin-top:40px">Generated ${new Date().toISOString().split("T")[0]} • ISCMS Records Vault</p>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">Records Vault — Contracts</h1>
            <p className="text-xs text-slate-500 mt-0.5">Search by client, site, contract code or category. Open a contract to confirm details or print a copy for the inquiry response.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black">{domain.contracts.length} contracts</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-black">{domain.contractInquiries.filter((i) => i.status === "Pending").length} pending inquiries</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, site, CTR code, category…" className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">⌕</span>
          </div>
          {q && <button onClick={() => setQ("")} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">Clear</button>}
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr><th className="p-3">Contract</th><th className="p-3">Client / Party</th><th className="p-3">Site</th><th className="p-3">Period</th><th className="p-3">Value</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50 ${selectedId === c.id ? "bg-cyan-50/60" : ""}`}>
                  <td className="p-3"><span className="font-mono font-black text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[10px]">{c.contractCode}</span><span className="block font-bold text-slate-900 mt-1">{c.title}</span><span className="block text-[10px] text-slate-500">{c.category}</span></td>
                  <td className="p-3 font-bold text-slate-800">{c.partyName}</td>
                  <td className="p-3 text-slate-600">{c.relatedSiteName || c.region || "—"}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-700">{c.startDate} → {c.endDate}</td>
                  <td className="p-3 font-bold text-slate-800">{c.valueUgx ? `${c.valueUgx.toLocaleString()} UGX` : "—"}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${c.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : c.status === "Draft" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{c.status}</span></td>
                  <td className="p-3 text-right space-x-1">
                    <button onClick={() => setSelectedId(c.id)} className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold">View</button>
                    <button onClick={() => printContract(c)} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-bold">Print</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-xs text-slate-400">No contracts match “{q}”.</td></tr>}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-slate-800">{selected.contractCode} — {selected.title}</p>
                <p className="text-[11px] text-slate-600 mt-1">{selected.partyName} • {selected.contractType} • {selected.category} • {selected.relatedSiteName || selected.region || "No site"}</p>
                <p className="text-[11px] text-slate-600">{selected.startDate} → {selected.endDate} • {selected.valueUgx ? `${selected.valueUgx.toLocaleString()} UGX` : "No value"} • {selected.paymentTerms || "—"}</p>
                {selected.slaTerms && <p className="text-[11px] text-slate-700 mt-2 leading-snug">SLA: {selected.slaTerms}</p>}
                <p className="text-[11px] text-slate-500 mt-1">Ref: {selected.documentRef} • Managed by {selected.managedBy} • Status {selected.status}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => printContract(selected)} className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold">Print / Save PDF</button>
                <button onClick={() => setSelectedId(null)} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold">Close</button>
              </div>
            </div>
            {selected.scanPages?.length ? <p className="text-[11px] text-slate-500 mt-2">{selected.scanPages.length} scanned page(s) in vault.</p> : null}
          </div>
        )}
      </div>
      <ContractInquiryPanel />
    </div>
  );
};

function HRGuardsViewWithTab({ initialTab }: { initialTab: "guards"|"leave"|"appraisals"|"contracts"|"remittances"|"staff"|"payroll" }) {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const staffUsers = useAuthStore((s) => s.users);
  const updateUser = useAuthStore((s) => s.updateUser);
  const issueStaffId = useAuthStore((s) => s.issueStaffId);
  return (
    <div className="space-y-6">
      <GuardsHRView
      guards={domain.guards}
      activeRole={activeRole}
      initialTab={initialTab}
      onAddGuard={domain.addGuard}
      onUpdateGuard={domain.updateGuard}
      onMoveLifecycle={domain.moveGuardLifecycle}
      leaveRequests={domain.leaveRequests}
      performanceReviews={domain.performanceReviews}
      onAddLeaveRequest={domain.addLeaveRequest}
      onUpdateLeaveRequest={domain.updateLeaveRequest}
       onHrApproveLeave={domain.hrApproveLeave}
       onGmApproveLeave={domain.gmApproveLeave}
       onDeleteLeaveRequest={domain.rejectLeaveRequest}
      contracts={domain.contracts}
      onAddContract={domain.addContract}
      onUpdateContract={domain.updateContract}
      onIssueContract={domain.issueContract}
      onArchiveContract={domain.archiveContract}
      onVoidContract={domain.voidContract}
      onAdvanceApproval={domain.advanceContractApproval}
      onArchiveGuard={domain.archiveGuard}
      staff={staffUsers}
      onUpdateUser={updateUser}
      onIssueStaffId={issueStaffId}
      />
    </div>
  );
}

export const HRPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const staffUsers = useAuthStore((s) => s.users);
  const updateUser = useAuthStore((s) => s.updateUser);
  const issueStaffId = useAuthStore((s) => s.issueStaffId);
  return (
    <div className="space-y-6">
      <ActingRequestPanel />
      <GuardsHRView
      guards={domain.guards}
      activeRole={activeRole}
      onAddGuard={domain.addGuard}
      onUpdateGuard={domain.updateGuard}
      onMoveLifecycle={domain.moveGuardLifecycle}
      leaveRequests={domain.leaveRequests}
      performanceReviews={domain.performanceReviews}
      onAddLeaveRequest={domain.addLeaveRequest}
      onUpdateLeaveRequest={domain.updateLeaveRequest}
       onHrApproveLeave={domain.hrApproveLeave}
       onGmApproveLeave={domain.gmApproveLeave}
       onDeleteLeaveRequest={domain.rejectLeaveRequest}
      contracts={domain.contracts}
      onAddContract={domain.addContract}
      onUpdateContract={domain.updateContract}
      onIssueContract={domain.issueContract}
      onArchiveContract={domain.archiveContract}
      onVoidContract={domain.voidContract}
      onAdvanceApproval={domain.advanceContractApproval}
      onArchiveGuard={domain.archiveGuard}
      staff={staffUsers}
      onUpdateUser={updateUser}
      onIssueStaffId={issueStaffId}
      />
    </div>
  );
};

export const HRRegisterPage: React.FC = () => <HRGuardsViewWithTab initialTab="guards" />;
export const HRLeavePage: React.FC = () => <HRGuardsViewWithTab initialTab="leave" />;
export const HRAppraisalsPage: React.FC = () => <HRGuardsViewWithTab initialTab="appraisals" />;
export const HRContractsPage: React.FC = () => <HRGuardsViewWithTab initialTab="contracts" />;
export const HRRemittancesPage: React.FC = () => <HRGuardsViewWithTab initialTab="remittances" />;
export const HRStaffPage: React.FC = () => <HRGuardsViewWithTab initialTab="staff" />;
export const HRPayrollPage: React.FC = () => <HRGuardsViewWithTab initialTab="payroll" />;

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
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <FinanceWorkspaceStrip />
      <FinanceOverviewCards />
    </div>
  );
};

const FinanceOverviewCards: React.FC = () => {
  const domain = useDomainStore();
  const totalBilled = domain.invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = domain.invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = domain.invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const totalDisbursedCashier = domain.cashierTxns.reduce((s, c) => s + c.amount, 0);
  const collectionRate = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-500">Total Billed</span><span className="text-slate-400 text-xs">UGX</span></div>
        <div className="text-lg font-black text-slate-900">UGX {totalBilled.toLocaleString()}</div>
        <span className="text-[10px] text-slate-400">Sum of billing cycles</span>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-500">Collected</span><span className="text-emerald-600 text-xs">✓</span></div>
        <div className="text-lg font-black text-emerald-700">UGX {totalPaid.toLocaleString()}</div>
        <span className="text-[10px] text-emerald-600 font-bold">{collectionRate}% collected</span>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-500">Outstanding</span><span className="text-amber-600 text-xs">◷</span></div>
        <div className="text-lg font-black text-amber-600">UGX {totalPending.toLocaleString()}</div>
        <span className="text-[10px] text-amber-600 font-bold">Pending / Overdue</span>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-500">Cashier Advances</span><span className="text-purple-600 text-xs">₵</span></div>
        <div className="text-lg font-black text-slate-900">UGX {totalDisbursedCashier.toLocaleString()}</div>
        <span className="text-[10px] text-slate-400">Recoverable via payroll</span>
      </div>
    </div>
  );
};

function FinanceViewWithTab({ initialTab }: { initialTab: "invoices" | "expenses" | "cashier" | "contracts" }) {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <FinanceView
      activeRole={activeRole}
      initialTab={initialTab}
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
  );
}

export const FinanceInvoicesPage: React.FC = () => <FinanceViewWithTab initialTab="invoices" />;
export const FinanceExpensesPage: React.FC = () => <FinanceViewWithTab initialTab="expenses" />;
export const FinanceCashierPage: React.FC = () => <FinanceViewWithTab initialTab="cashier" />;
export const FinanceContractsFinancePage: React.FC = () => <FinanceViewWithTab initialTab="contracts" />;

export const MarketingPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <MarketingWorkspaceStrip />
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
    </div>
  );
};

function MarketingViewWithTab({ initialTab }: { initialTab?: "pipeline" | "campaigns" }) {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <MarketingView
      activeRole={activeRole}
      initialTab={initialTab}
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
  );
}

export const MarketingPipelinePage: React.FC = () => <MarketingViewWithTab initialTab="pipeline" />;
export const MarketingCampaignsPage: React.FC = () => <MarketingViewWithTab initialTab="campaigns" />;

export const FleetPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  const pendingTransport = React.useMemo(
    () => domain.transportRequests.filter((t) => t.status === "Pending Fleet"),
    [domain.transportRequests]
  );
  return (
    <div className="space-y-4">
      {activeRole === "Fleet Manager" && (
        <FleetManagerWorkspaceView
          pendingTransport={pendingTransport}
          vehicles={domain.vehicles}
          drivers={domain.drivers}
          onAct={domain.actOnTransportRequest}
          onApproveDriver={domain.approveDriver}
        />
      )}
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
        transportRequests={domain.transportRequests}
        onActTransportRequest={domain.actOnTransportRequest}
      />
    </div>
  );
};

function FleetViewWithTab({ initialTab }: { initialTab: "register" | "trips" | "fuel" | "maintenance" | "drivers" | "inspections" | "breakdowns" | "gps" | "requests" }) {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <FleetView
      vehicles={domain.vehicles}
      activeRole={activeRole}
      initialTab={initialTab}
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
      transportRequests={domain.transportRequests}
      onActTransportRequest={domain.actOnTransportRequest}
    />
  );
}

export const FleetRegisterPage: React.FC = () => <FleetViewWithTab initialTab="register" />;
export const FleetTripsPage: React.FC = () => <FleetViewWithTab initialTab="trips" />;
export const FleetFuelPage: React.FC = () => <FleetViewWithTab initialTab="fuel" />;
export const FleetMaintenancePage: React.FC = () => <FleetViewWithTab initialTab="maintenance" />;
export const FleetDriversPage: React.FC = () => <FleetViewWithTab initialTab="drivers" />;
export const FleetInspectionsPage: React.FC = () => <FleetViewWithTab initialTab="inspections" />;
export const FleetRequestsPage: React.FC = () => <FleetViewWithTab initialTab="requests" />;
export const FleetBreakdownsPage: React.FC = () => <FleetViewWithTab initialTab="breakdowns" />;
export const FleetGpsPage: React.FC = () => <FleetViewWithTab initialTab="gps" />;

export const AdministrationPage: React.FC = () => {
  const activeRole = useActiveRole();
  const domain = useDomainStore();
  return (
    <div className="space-y-6">
      <AdministrationWorkspaceStrip />
      <AdminDeptView
        activeRole={activeRole}
        requisitions={domain.adminRequisitions}
        onAddRequisition={domain.addRequisition}
        onApproveRequisition={domain.approveRequisition}
        onRejectRequisition={domain.rejectRequisition}
        onAddSite={domain.addSite}
      />
    </div>
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

export const EsignPage: React.FC = () => {
  return <DigitalContractsView />;
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
