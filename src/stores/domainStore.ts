/**
 * Centralized domain state.
 * Replaces 25+ useState hooks previously drilled from App.tsx.
 */

import { create } from "zustand";
import type {
  Guard,
  ClientSite,
  ArmouryItem,
  ArmouryLog,
  K9Dog,
  K9Log,
  K9HealthInspection,
  Vehicle,
  Incident,
  DutyRoster,
  Invoice,
  Expense,
  CashierTransaction,
  Lead,
  Campaign,
  LeadSource,
  ITServer,
  ITSupportTicket,
  ITAsset,
  PatrolInspectionLog,
  AdminRequisition,
  TrainingCohort,
  RecruitTrainee,
  RegionalOffice,
  LeaveRequest,
  WorkflowDefinition,
  Approval,
  ApprovalAction,
  ContractRecord,
  DocumentRecord,
  JobPosting,
  Candidate,
  PerformanceReviewRecord,
  AppNotification,
  VehicleTripLog,
  FuelRequisitionLog,
  MaintenanceServiceLog,
  DriverRecord,
  DailyVehicleInspection,
  FleetBreakdownEmergency,
  Complaint,
  DisciplinaryAction,
  SiteDeployment,
  DeploymentOrder,
  TransportRequest,
  SiteSurvey,
  ContractInquiry,
} from "../types";
import {
  initialGuards,
  initialClientSites,
  initialArmouryItems,
  initialArmouryLogs,
  initialK9Dogs,
  initialK9Logs,
  initialK9HealthInspections,
  initialVehicles,
  initialIncidents,
  initialRoster,
  initialDeploymentOrders,
  initialInvoices,
  initialExpenses,
  initialCashierTransactions,
  initialLeads,
  initialCampaigns,
  initialITServers,
  initialITTickets,
  initialITAssets,
  initialPatrolInspections,
  initialAdminRequisitions,
  initialTrainingCohorts,
  initialRecruitTrainees,
  initialRegionalOffices,
  initialTripLogs,
  initialFuelRequisitions,
  initialMaintenanceLogs,
  initialDrivers,
  initialDailyInspections,
  initialBreakdowns,
  initialLeaveRequests,
  initialStaffAppraisals,
  initialDisciplinaryActions,
  initialContractRecords,
} from "../data/mockData";
import { useAuditStore } from "./auditStore";
import { useAuthStore } from "./authStore";
import { useNotificationStore } from "./notificationStore";
import { domainApi } from "../services/domainApi";
import { api } from "../services/apiClient";
import { nextForceNumber } from "../utils/forceNumber";

type LeaveBalanceComputed = { entitlement: number; taken: number; balance: number };

function computeMockLeaveBalance(
  leaveRequests: { guardId: string; status: string; durationDays: number }[],
  current?: { guardId: string; durationDays: number } | undefined
): LeaveBalanceComputed {
  const entitlement = 30;
  const prior = current
    ? leaveRequests.filter((l) => l.guardId === current.guardId && l.status === "Approved")
    : [];
  const taken = prior.reduce((sum, l) => sum + l.durationDays, 0) + (current?.durationDays ?? 0);
  return { entitlement, taken, balance: entitlement - taken };
}

type LoadingMap = Record<string, boolean>;
type ErrorMap = Record<string, string | null>;

async function syncApi(method: "post" | "put" | "delete", path: string, body?: unknown): Promise<void> {
  const { useApi } = useDomainStore.getState();
  if (!useApi) return;
  const key = `${method}:${path}`;
  useDomainStore.setState((s) => ({ loading: { ...s.loading, [key]: true }, error: { ...s.error, [key]: null } }));
  try {
    await api[method](path, body);
    useDomainStore.setState((s) => ({ loading: { ...s.loading, [key]: false } }));
  } catch (err: any) {
    const msg = err?.message ?? "Sync failed";
    console.error(`[domainStore] syncApi ${method.toUpperCase()} ${path} failed:`, err);
    useDomainStore.setState((s) => ({ loading: { ...s.loading, [key]: false }, error: { ...s.error, [key]: msg } }));
    throw err;
  }
}

function actor() {
  return useAuthStore.getState().currentUser;
}

function audit(action: string, details: string, module: string) {
  // Audit is now fire-and-forget but logged after successful state commit (caller must await syncApi first)
  try { useAuditStore.getState().addLog(action, details, module, actor()); } catch {}
}

function notif(type: AppNotification["type"], title: string, message: string, module: string) {
  try { useNotificationStore.getState().addNotification({ type, title, message, module }); } catch {}
}

const SOURCE_TO_CAMPAIGN_CHANNEL: Partial<Record<LeadSource, Campaign["channel"]>> = {
  LinkedIn: "LinkedIn",
  X: "Twitter / X",
  TikTok: "TikTok",
  "Security Expo": "Security Expo",
  "Direct Mail": "Direct Mail",
};

interface DomainState {
  loading: LoadingMap;
  error: ErrorMap;
  pagination: Record<string, { page: number; limit: number; total: number }>;
  useApi: boolean;
  regions: RegionalOffice[];
  regionalOffices: RegionalOffice[];
  guards: Guard[];
  sites: ClientSite[];
  armoury: ArmouryItem[];
  armouryLogs: ArmouryLog[];
  k9s: K9Dog[];
  k9Logs: K9Log[];
  k9HealthInspections: K9HealthInspection[];
  vehicles: Vehicle[];
  trips: VehicleTripLog[];
  fuelLogs: FuelRequisitionLog[];
  maintenanceLogs: MaintenanceServiceLog[];
  drivers: DriverRecord[];
  inspections: DailyVehicleInspection[];
  breakdowns: FleetBreakdownEmergency[];
  incidents: Incident[];
  dutyRoster: DutyRoster[];
  invoices: Invoice[];
  collections: Invoice[];
  expenses: Expense[];
  cashierTxns: CashierTransaction[];
  leads: Lead[];
  campaigns: Campaign[];
  itServers: ITServer[];
  itTickets: ITSupportTicket[];
  itAssets: ITAsset[];
  contracts: ContractRecord[];
  patrolInspections: PatrolInspectionLog[];
  adminRequisitions: AdminRequisition[];
  trainingCohorts: TrainingCohort[];
  recruitTrainees: RecruitTrainee[];

  // New entities
  leaveRequests: LeaveRequest[];
  workflows: WorkflowDefinition[];
  approvals: Approval[];
  documents: DocumentRecord[];
  jobPostings: JobPosting[];
  candidates: Candidate[];
  performanceReviews: PerformanceReviewRecord[];
  complaints: Complaint[];
  disciplinaryActions: DisciplinaryAction[];
  deployments: SiteDeployment[];
  deploymentOrders: DeploymentOrder[];
  transportRequests: TransportRequest[];

  // Guards / HR
  addGuard: (g: Omit<Guard, "id">) => void;
  updateGuard: (id: string, updates: Partial<Guard>) => void;
  deleteGuard: (id: string) => void;
  archiveGuard: (id: string) => void;
  issueWarning: (guardId: string, reason: string) => void;
  moveGuardLifecycle: (id: string, updates: Partial<Guard>) => void;
  issueGuardId: (id: string, data: { idCardNumber: string; idCardExpiryDate: string }) => void;

  // Sites
  addSite: (s: Omit<ClientSite, "id">) => void;
  updateSite: (id: string, updates: Partial<ClientSite>) => void;
  deleteSite: (id: string) => void;

  // Armoury
  addArmouryItem: (item: Omit<ArmouryItem, "id">) => void;
  issueArmouryItem: (
    assetId: string,
    guardId: string,
    locationName: string,
    ammoRoundsOut: number,
    dateOut: string,
    timeOut: string,
    signOutConfirmed: boolean,
    armourerInCharge: string,
    notes: string
  ) => void;
  returnArmouryItem: (
    logId: string,
    ammoRoundsIn: number,
    dateIn: string,
    timeIn: string,
    signInConfirmed: boolean,
    substituteReceiver?: string,
    notes?: string
  ) => void;

  // K9
  addK9Dog: (dog: Omit<K9Dog, "id">) => void;
  updateK9Dog: (id: string, updates: Partial<K9Dog>) => void;
  deleteK9Dog: (id: string) => void;
  pairK9Handler: (dogId: string, handlerId: string, handlerName: string) => void;
  logK9Deployment: (log: Omit<K9Log, "id">) => void;
  addK9HealthInspection: (ins: Omit<K9HealthInspection, "id" | "inspectionCode">) => void;
  updateK9HealthInspection: (id: string, updates: Partial<K9HealthInspection>) => void;
  deleteK9HealthInspection: (id: string) => void;

  // Fleet
  addVehicle: (v: Omit<Vehicle, "id">) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  logFuel: (vehicleId: string, fuelPct: number) => void;
  addTrip: (t: Omit<VehicleTripLog, "id" | "tripCode">) => void;
  addFuelLog: (f: Omit<FuelRequisitionLog, "id" | "voucherCode">) => void;
  addMaintenanceLog: (m: Omit<MaintenanceServiceLog, "id" | "serviceCode">) => void;
  addDriver: (d: Omit<DriverRecord, "id" | "driverCode">) => void;
  updateDriver: (id: string, updates: Partial<DriverRecord>) => void;
  approveDriver: (id: string) => void;
  addInspection: (i: Omit<DailyVehicleInspection, "id" | "inspectionCode">) => void;
  addBreakdown: (b: Omit<FleetBreakdownEmergency, "id" | "incidentCode">) => void;

  // Incidents & patrol
  addIncident: (i: Omit<Incident, "id">) => void;
  resolveIncident: (id: string, notes: string) => void;
  investigateIncident: (id: string) => void;
  escalateIncident: (id: string) => void;
  opsCloseIncident: (id: string) => void;
  addPatrolInspection: (p: Omit<PatrolInspectionLog, "id">) => void;
  updatePatrolInspection: (id: string, updates: Partial<PatrolInspectionLog>) => void;
  deletePatrolInspection: (id: string) => void;

  // Roster
  updateRosterStatus: (id: string, status: DutyRoster["status"]) => void;
  addRosterEntry: (e: Omit<DutyRoster, "id">) => void;

  // Finance
  addInvoice: (i: Omit<Invoice, "id">) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  approveInvoice: (id: string) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
  approveExpense: (id: string) => void;
  gmApproveExpense: (id: string) => void;
  rejectExpense: (id: string) => void;
  disburseAdvance: (t: Omit<CashierTransaction, "id">) => void;
  approveCashierTxn: (id: string) => void;
  rejectCashierTxn: (id: string) => void;

  // Marketing
  addLead: (l: Omit<Lead, "id" | "ownerId">) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  reassignLead: (id: string, assignedTo: string, ownerId?: string) => void;
  sendReminder: (invoiceId: string, recipient?: string) => void;

  // Admin
  addRequisition: (r: Omit<AdminRequisition, "id">) => void;
  approveRequisition: (id: string) => void;
  rejectRequisition: (id: string, reason: string) => void;

  // IT assets
  addITAsset: (a: Omit<ITAsset, "id" | "assetCode">) => void;
  updateITAsset: (id: string, updates: Partial<ITAsset>) => void;
  deleteITAsset: (id: string) => void;

  // Training
  addCohort: (c: Omit<TrainingCohort, "id">) => void;
  updateCohort: (id: string, updates: Partial<TrainingCohort>) => void;
  deleteCohort: (id: string) => void;
  addTrainee: (t: Omit<RecruitTrainee, "id">) => void;
  updateTrainee: (id: string, updates: Partial<RecruitTrainee>) => void;
  deleteTrainee: (id: string) => void;
  graduateTrainee: (traineeId: string, forceNumber: string) => void;

  // Leave
  addLeaveRequest: (r: Omit<LeaveRequest, "id">) => void;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  hrApproveLeave: (id: string, verification?: { entitlement?: number; taken?: number; balance?: number; resumptionDate?: string }) => void;
  gmApproveLeave: (id: string) => void;
  rejectLeaveRequest: (id: string, notes?: string) => void;
  deleteLeaveRequest: (id: string) => void;

  // Workflow
  addWorkflow: (wf: Omit<WorkflowDefinition, "id">) => void;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;
  actOnApproval: (id: string, action: "Approved" | "Rejected", comment?: string) => void;

  // Documents
  uploadDocument: (d: Omit<DocumentRecord, "id">) => void;
  updateDocument: (id: string, updates: Partial<DocumentRecord>) => void;
  deleteDocument: (id: string) => void;

  // Recruitment
  addJobPosting: (j: Omit<JobPosting, "id">) => void;
  updateJobPosting: (id: string, updates: Partial<JobPosting>) => void;
  addCandidate: (c: Omit<Candidate, "id">) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;

  // Performance
  addPerformanceReview: (r: Omit<PerformanceReviewRecord, "id">) => void;
  updatePerformanceReview: (id: string, updates: Partial<PerformanceReviewRecord>) => void;

  // Campaigns
  addCampaign: (c: Omit<Campaign, "id">) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  approveCampaignBudget: (id: string) => void;
  gmApproveCampaignBudget: (id: string) => void;

  // Complaints
  addComplaint: (c: Omit<Complaint, "id">) => void;
  updateComplaint: (id: string, updates: Partial<Complaint>) => void;
  resolveComplaint: (id: string, data: { resolutionNotes?: string; satisfactionRating?: number }) => void;
  referComplaint: (id: string, notes?: string) => void;

  // Disciplinary
  addDisciplinaryAction: (d: Omit<DisciplinaryAction, "id" | "createdAt">) => void;
  regionalApproveDisciplinary: (id: string) => void;
  opsApproveDisciplinary: (id: string) => void;
  hrApproveDisciplinary: (id: string) => void;
  rejectDisciplinaryAction: (id: string, notes?: string) => void;

  // Deployments
  addDeployment: (d: Omit<SiteDeployment, "id" | "deployedAt">) => void;
  endDeployment: (id: string) => void;
  addDeploymentOrder: (o: Omit<DeploymentOrder, "id" | "orderCode" | "status" | "assignedGuardIds">) => void;
  assignDeploymentOrder: (orderId: string, guardIds: string[]) => void;
  cancelDeploymentOrder: (orderId: string) => void;

  // Transport Requests
  addTransportRequest: (r: Omit<TransportRequest, "id" | "requestCode" | "status">) => void;
  actOnTransportRequest: (id: string, data: { action: "Approved" | "Declined"; assignedVehicleId?: string; assignedVehicle?: string; assignedDriverId?: string; assignedDriver?: string; assignedRiderId?: string; assignedRider?: string; declinedReason?: string }) => void;

  // Site Surveys
  siteSurveys: SiteSurvey[];
  addSiteSurvey: (r: Omit<SiteSurvey, "id" | "surveyCode" | "status">) => void;
  startSiteSurvey: (id: string, surveyedBy: string) => void;
  completeSiteSurvey: (id: string, data: Partial<SiteSurvey>) => void;
  cancelSiteSurvey: (id: string) => void;

  // Contract Inquiries
  contractInquiries: ContractInquiry[];
  addContractInquiry: (r: Omit<ContractInquiry, "id" | "inquiryCode" | "status">) => void;
  respondToContractInquiry: (id: string, data: { responseType: "Confirmation" | "Full Copy"; responseNotes?: string; responsePath?: string }) => void;

  // IT Servers
  updateITServer: (id: string, updates: Partial<ITServer>) => void;
  deleteITServer: (id: string) => void;

  // IT Tickets
  addITTicket: (t: Omit<ITSupportTicket, "id">) => void;
  updateITTicket: (id: string, updates: Partial<ITSupportTicket>) => void;
  deleteITTicket: (id: string) => void;

  // Contracts
  addContract: (c: Omit<ContractRecord, "id">) => void;
  updateContract: (id: string, updates: Partial<ContractRecord> & { action?: string }) => void;
  voidContract: (id: string, voidReason: string) => void;
  archiveContract: (id: string) => void;
  issueContract: (id: string) => void;
  advanceContractApproval: (id: string) => void;

  // Regions
  addRegion: (r: Omit<RegionalOffice, "id">) => void;
  updateRegion: (id: string, updates: Partial<RegionalOffice>) => void;
  deleteRegion: (id: string) => void;

  setUseApi: (v: boolean) => void;
  hydrateFromApi: () => Promise<void>;
}

export const useDomainStore = create<DomainState>((set, get) => ({
  loading: {},
  error: {},
  pagination: {},
  useApi: false,
  regions: initialRegionalOffices,
  regionalOffices: initialRegionalOffices,
  guards: initialGuards,
  sites: initialClientSites,
  armoury: initialArmouryItems,
  armouryLogs: initialArmouryLogs,
  k9s: initialK9Dogs,
  k9Logs: initialK9Logs,
  k9HealthInspections: initialK9HealthInspections,
  vehicles: initialVehicles,
  trips: initialTripLogs,
  fuelLogs: initialFuelRequisitions,
  maintenanceLogs: initialMaintenanceLogs,
  drivers: initialDrivers,
  inspections: initialDailyInspections,
  breakdowns: initialBreakdowns,
  incidents: initialIncidents,
  dutyRoster: initialRoster,
  invoices: initialInvoices,
  collections: initialInvoices,
  expenses: initialExpenses,
  cashierTxns: initialCashierTransactions,
  leads: initialLeads,
  campaigns: initialCampaigns,
  itServers: initialITServers,
  itTickets: initialITTickets,
  itAssets: initialITAssets,
  contracts: initialContractRecords,
  patrolInspections: initialPatrolInspections,
  adminRequisitions: initialAdminRequisitions,
  trainingCohorts: initialTrainingCohorts,
  recruitTrainees: initialRecruitTrainees,

  // New entity initial values
  leaveRequests: initialLeaveRequests,
  workflows: [],
  approvals: [],
  documents: [],
  jobPostings: [],
  candidates: [],
  complaints: [],
  disciplinaryActions: initialDisciplinaryActions,
  deployments: [],
  deploymentOrders: initialDeploymentOrders,
  siteSurveys: [],
  contractInquiries: [],
  transportRequests: [],
  performanceReviews: initialStaffAppraisals.map((a) => ({
    id: a.id,
    guardId: a.guardId,
    guardName: a.guardName,
    forceNumber: a.forceNumber,
    reviewPeriod: a.reviewPeriod,
    reviewType: a.reviewType || 'Annual Evaluation',
    evaluatorName: a.evaluatorName,
    evaluationDate: a.evaluationDate,
    disciplineScore: a.disciplineScore,
    punctualityScore: a.punctualityScore,
    clientRatingScore: a.clientRatingScore,
    appearanceScore: a.appearanceScore,
    incidentHandlingScore: a.incidentHandlingScore,
    overallRating: a.overallRating,
    recommendation: a.recommendation,
    comments: a.comments || '',
    keyStrengths: a.keyStrengths || '',
    growthAreas: a.growthAreas || '',
    developmentGoals: a.agreedDevelopmentGoals || '',
    status: a.status,
  })),

  addGuard: (newGuard) => {
    const guard: Guard = { ...newGuard, id: `grd-${Date.now()}` };
    set((s) => ({ guards: [...s.guards, guard] }));
    syncApi("post", "/guards", newGuard);
    audit(
      "Guard Enrollment",
      `Enrolled guard officer ${guard.fullName} (${guard.forceNumber}) to ${guard.assignedSite}.`,
      "Guard Personnel"
    );
    notif("success", "Guard Enrolled", `${guard.fullName} (${guard.forceNumber}) assigned to ${guard.assignedSite}`, "HR");
  },

  updateGuard: (guardId, updates) => {
    set((s) => ({
      guards: s.guards.map((g) => {
        if (g.id !== guardId) return g;
        // §5: a promotion changing the printed designation triggers a reissue
        // entry in the Records Officer queue.
        const reissue =
          updates.designation &&
          updates.designation !== g.designation &&
          (g.idCardStatus === "Issued & Active" || g.idCardStatus === "Reissue Required");
        return { ...g, ...updates, ...(reissue ? { idCardStatus: "Reissue Required" as const } : {}) };
      }),
    }));
    syncApi("put", `/guards/${guardId}`, updates);
    audit("Staff Record Updated", `Updated guard ID ${guardId} biodata/ID card status`, "HR & IT Operations");
    notif("info", "Guard Updated", `Record updated for guard ID ${guardId}`, "HR");
  },

  deleteGuard: (guardId) => {
    set((s) => ({ guards: s.guards.filter((g) => g.id !== guardId) }));
    syncApi("delete", `/guards/${guardId}`);
    audit("Guard Deleted", `Deleted guard record ID ${guardId}`, "HR");
    notif("warning", "Guard Deleted", `Guard record ${guardId} removed`, "HR");
  },

  archiveGuard: (guardId) => {
    set((s) => ({
      guards: s.guards.map((g) =>
        g.id === guardId ? { ...g, status: "Archived", lifecycleStage: "DEPLOYED" } : g
      ),
    }));
    syncApi("put", `/guards/${guardId}/archive`, { status: "Archived" });
    audit("Guard Archived", `Archived guard record ID ${guardId}`, "HR");
    notif("info", "Guard Archived", `Guard record ${guardId} moved to archive`, "HR");
  },

  issueWarning: (guardId, reason) => {
    set((s) => ({
      guards: s.guards.map((g) =>
        g.id === guardId ? { ...g, warningLettersCount: g.warningLettersCount + 1 } : g
      ),
    }));
    audit("Disciplinary Action", `Issued warning letter to Guard ID ${guardId} for reason: ${reason}`, "HR & Disciplinary");
    notif("warning", "Warning Issued", `Guard ID ${guardId}: ${reason}`, "HR");
  },

  moveGuardLifecycle: (guardId, updates) => {
    set((s) => ({
      guards: s.guards.map((g) => (g.id === guardId ? { ...g, ...updates } : g)),
    }));
    syncApi("put", `/guards/${guardId}/lifecycle`, updates);
    const detail = updates.terminationCategory
      ? `Guard ${guardId} ${updates.terminationCategory.toLowerCase()} — reason: ${updates.terminationReason}`
      : `Guard ${guardId} lifecycle → ${updates.lifecycleStage ?? updates.status ?? "updated"}`;
    audit("Guard Lifecycle Update", detail, "HR");
    notif("info", "Guard Lifecycle Updated", detail, "HR");
  },

  issueGuardId: (guardId, data) => {
    set((s) => ({
      guards: s.guards.map((g) =>
        g.id === guardId ? { ...g, idCardStatus: "Issued & Active", idCardNumber: data.idCardNumber, idCardExpiryDate: data.idCardExpiryDate, idCardIssuedDate: new Date().toISOString().split("T")[0] } : g
      ),
    }));
    syncApi("put", `/guards/${guardId}/issue-id`, data);
    audit("ID Card Issued", `Issued ID ${data.idCardNumber} to guard ${guardId}`, "Records");
    notif("success", "ID Issued", `${data.idCardNumber} issued`, "Records");
  },

  addSite: (newSite) => {
    const site: ClientSite = { ...newSite, id: `site-${Date.now()}` };
    set((s) => ({ sites: [...s.sites, site] }));
    syncApi("post", "/sites", newSite);
    audit("Site Contract Onboarded", `Added new contract site ${site.siteName} for ${site.clientName}.`, "Client CRM");
    notif("success", "Site Added", `${site.siteName} — ${site.clientName}`, "CRM");
  },

  updateSite: (siteId, updates) => {
    set((s) => ({
      sites: s.sites.map((site) => (site.id === siteId ? { ...site, ...updates } : site)),
    }));
    syncApi("put", `/sites/${siteId}`, updates);
    audit("Site Updated", `Updated site ID ${siteId}`, "Client CRM");
    notif("info", "Site Updated", `Site record ${siteId} updated`, "CRM");
  },

  deleteSite: (siteId) => {
    set((s) => ({ sites: s.sites.filter((site) => site.id !== siteId) }));
    syncApi("delete", `/sites/${siteId}`);
    audit("Site Deleted", `Deleted site ID ${siteId}`, "Client CRM");
    notif("warning", "Site Deleted", `Site record ${siteId} removed`, "CRM");
  },

  addArmouryItem: (newItem) => {
    const item: ArmouryItem = { ...newItem, id: `arm-${Date.now()}` };
    set((s) => ({ armoury: [...s.armoury, item] }));
    syncApi("post", "/armoury", newItem);
    audit("Armoury Acquisition", `Added new asset ${item.name} (${item.serialNumber}) to vault.`, "Armoury Management");
    notif("info", "Armoury Added", `${item.name} (${item.serialNumber})`, "Armoury");
  },

  issueArmouryItem: (
    assetId,
    guardId,
    locationName,
    ammoRoundsOut,
    dateOut,
    timeOut,
    signOutConfirmed,
    armourerInCharge,
    notes
  ) => {
    const { armoury, guards, armouryLogs } = get();
    const item = armoury.find((i) => i.id === assetId);
    const guard = guards.find((g) => g.id === guardId);
    if (!item || !guard) return;

    set((s) => ({
      armoury: s.armoury.map((i) =>
        i.id === assetId
          ? {
              ...i,
              availableQuantity: Math.max(0, i.availableQuantity - 1),
              location: "Issued Out",
              assignedToGuardId: guard.id,
              assignedToGuardName: guard.fullName,
            }
          : i
      ),
    }));

    const serialNumberLog = `SL-2026-${String(armouryLogs.length + 1).padStart(3, "0")}`;
    const newLog: ArmouryLog = {
      id: `ARM-LOG-${Date.now()}`,
      serialNumberLog,
      guardId: guard.id,
      guardName: guard.fullName,
      locationName: locationName || guard.assignedSite || "Assigned Duty Post",
      firearmSerialNumber: item.serialNumber,
      assetName: item.name,
      assetTag: item.assetTag,
      ammoRoundsOut,
      dateOut: dateOut || new Date().toISOString().split("T")[0],
      timeOut: timeOut || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      signOutConfirmed,
      armourerInCharge: armourerInCharge || "Armourer Officer",
      status: "Checked Out",
      notes,
    };
    set((s) => ({ armouryLogs: [newLog, ...s.armouryLogs] }));
    syncApi("post", "/armoury-logs", {
      assetId,
      guardId,
      locationName,
      ammoRoundsOut,
      dateOut,
      timeOut,
      signOutConfirmed,
      armourerInCharge,
      notes,
    });
    audit(
      "Armoury Issue",
      `Issued firearm ${item.serialNumber} to ${guard.fullName} at ${locationName} with ${ammoRoundsOut} rounds.`,
      "Armoury Management"
    );
    notif("warning", "Weapon Issued", `${item.serialNumber} → ${guard.fullName} at ${locationName}`, "Armoury");
  },

  returnArmouryItem: (logId, ammoRoundsIn, dateIn, timeIn, signInConfirmed, _substituteReceiver, notes) => {
    const log = get().armouryLogs.find((l) => l.id === logId);
    if (!log) return;

    set((s) => ({
      armouryLogs: s.armouryLogs.map((l) =>
        l.id === logId
          ? {
              ...l,
              ammoRoundsIn,
              dateIn: dateIn || new Date().toISOString().split("T")[0],
              timeIn: timeIn || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              signInConfirmed,
              status: "Returned",
              notes: notes ? `${l.notes} | Return Note: ${notes}` : l.notes,
            }
          : l
      ),
      armoury: s.armoury.map((i) =>
        i.serialNumber === log.firearmSerialNumber
          ? {
              ...i,
              availableQuantity: i.availableQuantity + 1,
              location: "Main Vault",
              assignedToGuardId: undefined,
              assignedToGuardName: undefined,
            }
          : i
      ),
    }));
    syncApi("put", `/armoury-logs/${logId}/return`, {
      ammoRoundsIn,
      dateIn,
      timeIn,
      signInConfirmed,
      substituteReceiver: _substituteReceiver,
      notes,
    });
    audit(
      "Armoury Return",
      `Firearm ${log.firearmSerialNumber} returned by ${log.guardName} with ${ammoRoundsIn} ammo rounds.`,
      "Armoury Management"
    );
    notif("success", "Weapon Returned", `${log.firearmSerialNumber} returned by ${log.guardName}`, "Armoury");
  },

  addK9Dog: (newDog) => {
    const dog: K9Dog = { ...newDog, id: `k9-${Date.now()}` };
    set((s) => ({ k9s: [...s.k9s, dog] }));
    syncApi("post", "/k9s", newDog);
    audit("K9 Enrollment", `Enrolled new K9 Canine ${dog.name} (${dog.breed}) into active duty.`, "K9 Unit");
    notif("success", "K9 Enrolled", `${dog.name} (${dog.breed})`, "K9 Unit");
  },

  updateK9Dog: (dogId, updates) => {
    set((s) => ({
      k9s: s.k9s.map((dog) => (dog.id === dogId ? { ...dog, ...updates } : dog)),
    }));
    syncApi("put", `/k9s/${dogId}`, updates);
    audit("K9 Dog Updated", `Updated K9 dog record ID ${dogId}`, "K9 Unit");
    notif("info", "K9 Updated", `K9 dog record ${dogId} updated`, "K9 Unit");
  },

  deleteK9Dog: (dogId) => {
    set((s) => ({ k9s: s.k9s.filter((dog) => dog.id !== dogId) }));
    syncApi("delete", `/k9s/${dogId}`);
    audit("K9 Dog Deleted", `Deleted K9 dog record ID ${dogId}`, "K9 Unit");
    notif("warning", "K9 Deleted", `K9 dog record ${dogId} removed`, "K9 Unit");
  },

  pairK9Handler: (dogId, handlerId, handlerName) => {
    set((s) => ({
      k9s: s.k9s.map((dog) =>
        dog.id === dogId
          ? { ...dog, assignedHandlerId: handlerId, assignedHandlerName: handlerName }
          : dog
      ),
    }));
    syncApi("put", `/k9s/${dogId}`, { assignedHandlerId: handlerId, assignedHandlerName: handlerName });
    audit("K9 Pairing", `Paired Canine Dog ID ${dogId} with Handler ${handlerName}.`, "K9 Unit");
    notif("info", "K9 Paired", `Dog paired with handler ${handlerName}`, "K9 Unit");
  },

  logK9Deployment: (newLog) => {
    const log: K9Log = { ...newLog, id: `k9-log-${Date.now()}` };
    set((s) => ({ k9Logs: [log, ...s.k9Logs] }));
    syncApi("post", "/k9-logs", newLog);
    audit("K9 Patrol Sweep", `Logged K9 patrol deployment for ${log.k9Name} at ${log.siteName}.`, "K9 Unit");
    notif("info", "K9 Deployed", `${log.k9Name} deployed to ${log.siteName}`, "K9 Unit");
  },

  addK9HealthInspection: (newIns) => {
    const codeNum = get().k9HealthInspections.length + 1;
    const inspection: K9HealthInspection = {
      ...newIns,
      id: `k9-med-${Date.now()}`,
      inspectionCode: `K9-MED-2026-${String(codeNum).padStart(2, "0")}`,
    };
    set((s) => ({
      k9HealthInspections: [inspection, ...s.k9HealthInspections],
      k9s: s.k9s.map((dog) =>
        dog.id === newIns.k9Id
          ? {
              ...dog,
              currentWeightKg: newIns.weightKg,
              healthCondition: newIns.physicalCondition,
              vaccinationStatus: newIns.vaccinationStatus,
              lastVetCheck: newIns.inspectionDate,
              ...(newIns.vaccinationStatus === "Up to Date - Fully Vaccinated"
                ? { rabiesVaccineDate: newIns.inspectionDate }
                : {}),
            }
          : dog
      ),
    }));
    syncApi("post", "/k9-health", newIns);
    audit(
      "K9 Health Inspection",
      `Recorded health check for K9 ${newIns.k9Name}: Weight ${newIns.weightKg}kg, Status '${newIns.physicalCondition}'.`,
      "K9 Unit & Kennels"
    );
    notif("info", "K9 Health Check", `${newIns.k9Name}: ${newIns.physicalCondition}`, "K9 Unit");
  },

  updateK9HealthInspection: (insId, updates) => {
    set((s) => ({
      k9HealthInspections: s.k9HealthInspections.map((ins) => (ins.id === insId ? { ...ins, ...updates } : ins)),
    }));
    syncApi("put", `/k9-health/${insId}`, updates);
    audit("K9 Health Inspection Updated", `Updated health inspection ID ${insId}`, "K9 Unit");
    notif("info", "Health Inspection Updated", `Inspection ${insId} updated`, "K9 Unit");
  },

  deleteK9HealthInspection: (insId) => {
    set((s) => ({ k9HealthInspections: s.k9HealthInspections.filter((ins) => ins.id !== insId) }));
    syncApi("delete", `/k9-health/${insId}`);
    audit("K9 Health Inspection Deleted", `Deleted health inspection ID ${insId}`, "K9 Unit");
    notif("warning", "Health Inspection Deleted", `Inspection ${insId} removed`, "K9 Unit");
  },

  addVehicle: (newVeh) => {
    const veh: Vehicle = { ...newVeh, id: `veh-${Date.now()}` };
    set((s) => ({ vehicles: [...s.vehicles, veh] }));
    syncApi("post", "/vehicles", newVeh);
    audit("Fleet Vehicle Added", `Registered fleet pickup ${veh.plateNumber} (${veh.makeModel}).`, "Fleet Management");
    notif("success", "Vehicle Added", `${veh.plateNumber} (${veh.makeModel})`, "Fleet");
  },

  updateVehicle: (vehicleId, updates) => {
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === vehicleId ? { ...v, ...updates } : v)),
    }));
    syncApi("put", `/vehicles/${vehicleId}`, updates);
    audit("Vehicle Updated", `Updated vehicle ID ${vehicleId}`, "Fleet Management");
    notif("info", "Vehicle Updated", `Vehicle ${vehicleId} updated`, "Fleet");
  },

  deleteVehicle: (vehicleId) => {
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== vehicleId) }));
    syncApi("delete", `/vehicles/${vehicleId}`);
    audit("Vehicle Deleted", `Deleted vehicle ID ${vehicleId}`, "Fleet Management");
    notif("warning", "Vehicle Deleted", `Vehicle ${vehicleId} removed`, "Fleet");
  },

  logFuel: (vehicleId, fuelPct) => {
    set((s) => ({
      vehicles: s.vehicles.map((v) =>
        v.id === vehicleId ? { ...v, fuelLevelPercentage: Math.min(100, fuelPct) } : v
      ),
    }));
    audit("Fuel Quick Fill", `Vehicle ID ${vehicleId} fuel set to ${fuelPct}%`, "Fleet Management");
    notif("info", "Fuel Updated", `Vehicle ${vehicleId} → ${fuelPct}%`, "Fleet");
  },

  addTrip: (newTrip) => {
    const codeNum = get().trips.length + 1;
    const trip: VehicleTripLog = {
      ...newTrip,
      id: `TRP-${Date.now()}`,
      tripCode: `TRP-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ trips: [trip, ...s.trips] }));
    syncApi("post", "/trips", newTrip);
    audit("Trip Logged", `Trip ${trip.tripCode} for ${trip.plateNumber} to ${trip.destination}`, "Fleet Management");
    notif("info", "Trip Logged", `${trip.plateNumber} → ${trip.destination}`, "Fleet");
  },

  addFuelLog: (newFuel) => {
    const codeNum = get().fuelLogs.length + 1;
    const fuel: FuelRequisitionLog = {
      ...newFuel,
      id: `FUL-${Date.now()}`,
      voucherCode: `FVR-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ fuelLogs: [fuel, ...s.fuelLogs] }));
    syncApi("post", "/fuel-logs", newFuel);
    audit("Fuel Requisition", `Refueled ${fuel.plateNumber} with ${fuel.fuelLitres}L at ${fuel.stationName} (UGX ${fuel.costUgx})`, "Fleet Management");
    notif("info", "Fuel Logged", `${fuel.fuelLitres}L at ${fuel.stationName} (UGX ${fuel.costUgx})`, "Fleet");
  },

  addMaintenanceLog: (newMaint) => {
    const codeNum = get().maintenanceLogs.length + 1;
    const maint: MaintenanceServiceLog = {
      ...newMaint,
      id: `MNT-${Date.now()}`,
      serviceCode: `WO-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ maintenanceLogs: [maint, ...s.maintenanceLogs] }));
    syncApi("post", "/maintenance", newMaint);
    audit("Maintenance Work Order", `Created work order ${maint.serviceCode} for ${maint.plateNumber} (${maint.serviceType})`, "Fleet Management");
    notif("info", "Work Order Created", `${maint.plateNumber}: ${maint.serviceType}`, "Fleet");
  },

  addDriver: (newDriver) => {
    const codeNum = get().drivers.length + 1;
    const known = [
      ...get().drivers.map((d) => d.forceNumber || d.driverCode),
      ...get().guards.map((g) => g.forceNumber),
    ];
    const driver: DriverRecord = {
      ...newDriver,
      id: `DRV-${Date.now()}`,
      driverCode: `DRV-UG-${String(codeNum).padStart(2, "0")}`,
      forceNumber: newDriver.forceNumber || nextForceNumber(known),
    };
    set((s) => ({ drivers: [driver, ...s.drivers] }));
    syncApi("post", "/drivers", newDriver);
    audit("Driver Enrolled", `Enrolled driver ${driver.fullName} (${driver.driverCode})`, "Fleet Management");
    notif("success", "Driver Added", `${driver.fullName} (${driver.driverCode})`, "Fleet");
  },

  updateDriver: (driverId, updates) => {
    set((s) => ({
      drivers: s.drivers.map((d) => (d.id === driverId ? { ...d, ...updates } : d)),
    }));
    syncApi("put", `/drivers/${driverId}`, updates);
    audit("Driver Record Updated", `Updated driver ID ${driverId}`, "Fleet Management");
    notif("info", "Driver Updated", `Driver record ${driverId} updated`, "Fleet");
  },

  approveDriver: (driverId) => {
    const drv = get().drivers.find((d) => d.id === driverId);
    if (!drv || drv.status === "Active Duty") return;
    const approvedBy = actor()?.name || "Fleet Manager";
    set((s) => ({
      drivers: s.drivers.map((d) =>
        d.id === driverId
          ? { ...d, status: "Active Duty" as const, approvedBy, approvedAt: new Date().toISOString().split("T")[0] }
          : d
      ),
    }));
    syncApi("put", `/drivers/${driverId}/approve`, {});
    audit("Driver Onboarding Approved", `Fleet Manager approved ${drv.fullName} (${drv.driverCode})`, "Fleet Management");
    notif("success", "Driver Approved", `${drv.fullName} (${drv.driverCode}) cleared for duty`, "Fleet");
  },

  addInspection: (newInsp) => {
    const codeNum = get().inspections.length + 1;
    const inspection: DailyVehicleInspection = {
      ...newInsp,
      id: `DVI-${Date.now()}`,
      inspectionCode: `DVI-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ inspections: [inspection, ...s.inspections] }));
    syncApi("post", "/inspections", newInsp);
    audit("Vehicle Inspection", `Daily inspection recorded for ${inspection.plateNumber} (${inspection.overallCondition})`, "Fleet Management");
    notif("info", "Inspection Logged", `${inspection.plateNumber}: ${inspection.overallCondition}`, "Fleet");
  },

  addBreakdown: (newBkdn) => {
    const codeNum = get().breakdowns.length + 1;
    const bkdn: FleetBreakdownEmergency = {
      ...newBkdn,
      id: `BRK-${Date.now()}`,
      incidentCode: `EMG-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ breakdowns: [bkdn, ...s.breakdowns] }));
    syncApi("post", "/breakdowns", newBkdn);
    audit("Breakdown Emergency", `Breakdown reported for ${bkdn.plateNumber} (${bkdn.issueType})`, "Fleet Management");
    notif("warning", "Breakdown Reported", `${bkdn.plateNumber}: ${bkdn.issueType}`, "Fleet");
  },

  addIncident: (newInc) => {
    const inc: Incident = { ...newInc, id: `inc-${Date.now()}` };
    set((s) => ({ incidents: [inc, ...s.incidents] }));
    syncApi("post", "/incidents", newInc);
    audit(
      "Incident Dispatched",
      `Reported ${inc.severity} priority incident at ${inc.siteName}: ${inc.category}`,
      "Incident Operations"
    );
    notif("warning", "Incident Reported", `${inc.severity} incident at ${inc.siteName}: ${inc.title}`, "Operations");
  },

  resolveIncident: (incId, resolutionNotes) => {
    set((s) => ({
      incidents: s.incidents.map((i) => (i.id === incId ? { ...i, status: "Resolved", resolvedBy: actor()?.name, resolutionNotes } : i)),
    }));
    syncApi("put", `/incidents/${incId}/resolve`, {});
    audit("Incident Resolved", `Resolved incident ID ${incId}: ${resolutionNotes}`, "Incident Operations");
    notif("success", "Incident Resolved", `Incident ${incId} closed: ${resolutionNotes}`, "Operations");
  },

  investigateIncident: (incId) => {
    set((s) => ({ incidents: s.incidents.map((i) => (i.id === incId ? { ...i, status: "Under Investigation", investigatedBy: actor()?.name } : i)) }));
    syncApi("put", `/incidents/${incId}/investigate`, {});
    audit("Incident Investigation", `Investigation opened for incident ${incId}`, "Incident Operations");
    notif("info", "Investigation Started", `Incident ${incId} under investigation`, "Operations");
  },

  escalateIncident: (incId) => {
    set((s) => ({ incidents: s.incidents.map((i) => (i.id === incId ? { ...i, status: "Escalated", escalatedBy: actor()?.name } : i)) }));
    syncApi("put", `/incidents/${incId}/escalate`, {});
    audit("Incident Escalated", `Incident ${incId} escalated to Operations Manager`, "Incident Operations");
    notif("warning", "Incident Escalated", `Incident ${incId} escalated`, "Operations");
  },

  opsCloseIncident: (incId) => {
    set((s) => ({ incidents: s.incidents.map((i) => (i.id === incId ? { ...i, status: "Resolved", resolvedBy: actor()?.name } : i)) }));
    syncApi("put", `/incidents/${incId}/ops-close`, {});
    audit("Incident Closed", `Operations Manager closed incident ${incId}`, "Incident Operations");
    notif("success", "Incident Closed", `Incident ${incId} closed by Operations`, "Operations");
  },

  addPatrolInspection: (newInsp) => {
    const insp: PatrolInspectionLog = { ...newInsp, id: `insp-${Date.now()}` };
    set((s) => ({ patrolInspections: [insp, ...s.patrolInspections] }));
    syncApi("post", "/patrol-inspections", newInsp);
    audit(
      "Patrol Inspection",
      `Logged patrol inspection at ${insp.siteName} by Supervisor ${insp.supervisorName}.`,
      "Operations"
    );
    notif("info", "Patrol Logged", `${insp.siteName} by ${insp.supervisorName}`, "Operations");
  },

  updatePatrolInspection: (insId, updates) => {
    set((s) => ({
      patrolInspections: s.patrolInspections.map((ins) => (ins.id === insId ? { ...ins, ...updates } : ins)),
    }));
    syncApi("put", `/patrol-inspections/${insId}`, updates);
    audit("Patrol Inspection Updated", `Updated patrol inspection ID ${insId}`, "Operations");
    notif("info", "Patrol Inspection Updated", `Inspection ${insId} updated`, "Operations");
  },

  deletePatrolInspection: (insId) => {
    set((s) => ({ patrolInspections: s.patrolInspections.filter((ins) => ins.id !== insId) }));
    syncApi("delete", `/patrol-inspections/${insId}`);
    audit("Patrol Inspection Deleted", `Deleted patrol inspection ID ${insId}`, "Operations");
    notif("warning", "Patrol Inspection Deleted", `Inspection ${insId} removed`, "Operations");
  },

  updateRosterStatus: (rosterId, newStatus) => {
    set((s) => ({
      dutyRoster: s.dutyRoster.map((r) => (r.id === rosterId ? { ...r, status: newStatus } : r)),
    }));
    syncApi("put", `/roster/${rosterId}`, { status: newStatus });
    audit("Roster Check-in", `Updated guard roster ID ${rosterId} status to ${newStatus}`, "Operations Roster");
    notif("info", "Roster Updated", `Roster ${rosterId} → ${newStatus}`, "Operations");
  },

  addRosterEntry: (newEntry) => {
    const entry: DutyRoster = { ...newEntry, id: `rost-${Date.now()}` };
    set((s) => ({ dutyRoster: [entry, ...s.dutyRoster] }));
    syncApi("post", "/roster", newEntry);
    audit(
      "Duty Roster Assignment",
      `Assigned ${entry.guardName} to ${entry.siteName} for ${entry.shiftType} shift.`,
      "Operations Roster"
    );
    notif("info", "Roster Entry", `${entry.guardName} → ${entry.siteName} (${entry.shiftType})`, "Operations");
  },

  addInvoice: (newInv) => {
    const inv: Invoice = { ...newInv, id: `inv-${Date.now()}` };
    set((s) => ({ invoices: [inv, ...s.invoices] }));
    syncApi("post", "/invoices", newInv);
    audit(
      "Invoice Issued",
      `Generated client billing invoice ${inv.invoiceNumber} for ${inv.clientName} (UGX ${inv.amount}).`,
      "Finance"
    );
    notif("info", "Invoice Issued", `${inv.invoiceNumber} — ${inv.clientName} (UGX ${inv.amount})`, "Finance");
  },

  updateInvoice: (invId, updates) => {
    set((s) => ({
      invoices: s.invoices.map((inv) => (inv.id === invId ? { ...inv, ...updates } : inv)),
    }));
    syncApi("put", `/invoices/${invId}`, updates);
    audit("Invoice Updated", `Updated invoice ID ${invId}`, "Finance");
    notif("info", "Invoice Updated", `Invoice ${invId} updated`, "Finance");
  },

  deleteInvoice: (invId) => {
    set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== invId) }));
    syncApi("delete", `/invoices/${invId}`);
    audit("Invoice Deleted", `Deleted invoice ID ${invId}`, "Finance");
    notif("warning", "Invoice Deleted", `Invoice ${invId} removed`, "Finance");
  },

  approveInvoice: (invId) => {
    set((s) => ({
      invoices: s.invoices.map((inv) =>
        inv.id === invId ? { ...inv, status: "Pending" as const, approvedBy: actor()?.name ?? "Finance Manager", approvedAt: new Date().toISOString(), sentAt: new Date().toISOString() } : inv
      ),
    }));
    api.put(`/invoices/${invId}/approve`, {}).catch(() => {});
    audit("Invoice Approved & Sent", `Approved invoice ID ${invId} for sending to client`, "Finance");
    notif("success", "Invoice Approved", `Invoice ${invId} approved and sent`, "Finance");
  },

  addExpense: (newExp) => {
    const exp: Expense = { ...newExp, id: `exp-${Date.now()}` };
    set((s) => ({ expenses: [exp, ...s.expenses] }));
    syncApi("post", "/expenses", newExp);
    audit("Expense Voucher", `Created operational expense voucher for ${exp.category} (UGX ${exp.amount}).`, "Finance");
    notif("info", "Expense Logged", `${exp.category} — UGX ${exp.amount}`, "Finance");
  },

  deleteExpense: (expId) => {
    set((s) => ({ expenses: s.expenses.filter((exp) => exp.id !== expId) }));
    syncApi("delete", `/expenses/${expId}`);
    audit("Expense Deleted", `Deleted expense ID ${expId}`, "Finance");
    notif("warning", "Expense Deleted", `Expense ${expId} removed`, "Finance");
  },

  approveExpense: (expId) => {
    set((s) => ({
      expenses: s.expenses.map((x) => (x.id === expId ? { ...x, status: "Approved", approvedBy: actor()?.name || "", approvalStep: "gm-approve" } : x)),
    }));
    syncApi("put", `/expenses/${expId}/approve`, {});
    audit("Expense Approved", `General Manager approved expense ${expId}`, "Finance");
    notif("success", "Expense Approved", "Expense approved by the General Manager", "Finance");
  },

  gmApproveExpense: (expId) => {
    set((s) => ({ expenses: s.expenses.map((x) => (x.id === expId ? { ...x, status: "Approved", gmApprovedBy: actor()?.name, approvalStep: "gm-approve" } : x)) }));
    syncApi("put", `/expenses/${expId}/gm-approve`, {});
    audit("Expense GM Approved", `GM approved expense ${expId}`, "Finance");
    notif("success", "GM Approved", `Expense ${expId} fully approved`, "Finance");
  },

  rejectExpense: (expId) => {
    set((s) => ({ expenses: s.expenses.map((x) => (x.id === expId ? { ...x, status: "Rejected", approvalStep: "rejected" } : x)) }));
    syncApi("put", `/expenses/${expId}/reject`, {});
    audit("Expense Rejected", `Expense ${expId} rejected`, "Finance");
    notif("error", "Expense Rejected", `Expense ${expId} rejected`, "Finance");
  },

  disburseAdvance: (newTxn) => {
    const txn: CashierTransaction = { ...newTxn, id: `txn-${Date.now()}` };
    set((s) => ({ cashierTxns: [txn, ...s.cashierTxns] }));
    syncApi("post", "/cashier-transactions", newTxn);
    audit(
      "Cashier Disbursement Request",
      `Recorded disbursement request for ${txn.guardName} (UGX ${txn.amount}) awaiting Finance Manager approval.`,
      "Cashier Desk"
    );
    notif("info", "Disbursement Requested", `UGX ${txn.amount} to ${txn.guardName} pending FM approval`, "Finance");
  },

  approveCashierTxn: (txnId) => {
    set((s) => ({
      cashierTxns: s.cashierTxns.map((t) =>
        t.id === txnId ? { ...t, status: "Disbursed" as const, approvedBy: actor()?.name ?? "Finance Manager", approvedAt: new Date().toISOString() } : t
      ),
    }));
    api.put(`/cashier-transactions/${txnId}/approve`, {}).catch(() => {});
    audit("Cashier Disbursement Approved", `Finance Manager approved cashier disbursement ${txnId}`, "Cashier Desk");
    notif("success", "Disbursement Approved", `Finance Manager approved ${txnId}`, "Finance");
  },

  rejectCashierTxn: (txnId) => {
    set((s) => ({
      cashierTxns: s.cashierTxns.map((t) =>
        t.id === txnId ? { ...t, status: "Rejected" as const, rejectedBy: actor()?.name ?? "Finance Manager" } : t
      ),
    }));
    api.put(`/cashier-transactions/${txnId}/reject`, {}).catch(() => {});
    audit("Cashier Disbursement Rejected", `Finance Manager rejected cashier disbursement ${txnId}`, "Cashier Desk");
    notif("warning", "Disbursement Rejected", `Finance Manager rejected ${txnId}`, "Finance");
  },

  addLead: (newLead) => {
    const owner = actor();
    const lead: Lead = {
      ...newLead,
      id: `lead-${Date.now()}`,
      stage: newLead.stage ?? "New",
      assignedTo: newLead.assignedTo || owner?.name || "Marketing",
      ownerId: owner?.id,
    };
    const channel = SOURCE_TO_CAMPAIGN_CHANNEL[lead.source];
    const campaign = channel ? get().campaigns.find((c) => c.channel === channel) : undefined;
    if (campaign) {
      const leadsGenerated = (campaign.leadsGenerated || 0) + 1;
      set((s) => ({
        campaigns: s.campaigns.map((c) => (c.id === campaign.id ? { ...c, leadsGenerated } : c)),
      }));
      syncApi("put", `/campaigns/${campaign.id}`, { leadsGenerated });
      audit("Campaign Lead Attributed", `New lead ${lead.companyName} attributed to campaign '${campaign.name}'`, "Marketing & Sales");
    }
    set((s) => ({ leads: [lead, ...s.leads] }));
    syncApi("post", "/leads", newLead);
    audit(
      "Lead Captured",
      `Added new commercial sales lead ${lead.companyName} (${lead.contactPerson}) via ${lead.source}.`,
      "Marketing & Sales"
    );
    notif("info", "Lead Added", `${lead.companyName} (${lead.contactPerson})`, "Marketing");
  },

  updateLead: (leadId, updates) => {
    const existing = get().leads.find((l) => l.id === leadId);
    set((s) => ({
      leads: s.leads.map((l) => (l.id === leadId ? { ...l, ...updates } : l)),
    }));
    if (existing && updates.stage === "Closed Won" && existing.stage !== "Closed Won") {
      const channel = SOURCE_TO_CAMPAIGN_CHANNEL[existing.source];
      const campaign = channel ? get().campaigns.find((c) => c.channel === channel) : undefined;
      if (campaign) {
        const conversions = (campaign.conversions || 0) + 1;
        set((s) => ({
          campaigns: s.campaigns.map((c) => (c.id === campaign.id ? { ...c, conversions } : c)),
        }));
        syncApi("put", `/campaigns/${campaign.id}`, { conversions });
        audit("Campaign Conversion Attributed", `Closed-won lead ${leadId} attributed as a conversion to campaign '${campaign.name}'`, "Marketing & Sales");
      }
    }
    syncApi("put", `/leads/${leadId}`, updates);
    audit("Lead Updated", `Updated lead ID ${leadId}`, "Marketing & Sales");
    notif("info", "Lead Updated", `Lead ${leadId} updated`, "Marketing");
  },

  deleteLead: (leadId) => {
    set((s) => ({ leads: s.leads.filter((l) => l.id !== leadId) }));
    syncApi("delete", `/leads/${leadId}`);
    audit("Lead Deleted", `Deleted lead ID ${leadId}`, "Marketing & Sales");
    notif("warning", "Lead Deleted", `Lead ${leadId} removed`, "Marketing");
  },

  reassignLead: (leadId, assignedTo, ownerId) => {
    set((s) => ({
      leads: s.leads.map((l) => (l.id === leadId ? { ...l, assignedTo, ownerId } : l)),
    }));
    syncApi("put", `/leads/${leadId}/reassign`, { assignedTo, ownerId });
    audit("Lead Reassigned", `BDM reassigned lead ${leadId} to ${assignedTo}`, "Marketing & Sales");
    notif("info", "Lead Reassigned", `Lead ${leadId} now owned by ${assignedTo}`, "Marketing");
  },

  sendReminder: (invoiceId, recipient) => {
    api.post(`/invoices/${invoiceId}/remind`, recipient ? { recipient } : {}).then(() => {
      notif("success", "Payment Reminder Sent", `Reminder triggered for invoice ${invoiceId}`, "Marketing");
    }).catch((e) => {
      notif("warning", "Reminder Skipped", e instanceof Error ? e.message : "Could not send reminder", "Marketing");
    });
    audit("Payment Reminder", `Marketing-led payment reminder triggered for invoice ${invoiceId}`, "Marketing & Sales");
  },

  addRequisition: (newReq) => {
    const req: AdminRequisition = { ...newReq, id: `req-${Date.now()}` };
    set((s) => ({ adminRequisitions: [req, ...s.adminRequisitions] }));
    syncApi("post", "/requisitions", newReq);
    audit(
      "Admin Requisition Raised",
      `Raised requisition ${req.reqCode} for ${req.itemDescription} (UGX ${req.estimatedCostUgx})`,
      "Administrations"
    );
    notif("warning", "Requisition Raised", `${req.reqCode} — ${req.itemDescription} (UGX ${req.estimatedCostUgx})`, "Admin");
  },

  approveRequisition: (reqId) => {
    set((s) => ({
      adminRequisitions: s.adminRequisitions.map((r) =>
        r.id === reqId ? { ...r, status: "Approved" as const } : r
      ),
    }));
    syncApi("put", `/requisitions/${reqId}/approve`, {});
    audit("Admin Requisition Approved", `GM approved requisition ${reqId}`, "Administrations");
    notif("success", "Requisition Approved", `Requisition ${reqId} approved by GM`, "Admin");
  },

  rejectRequisition: (reqId, reason) => {
    set((s) => ({
      adminRequisitions: s.adminRequisitions.map((r) =>
        r.id === reqId ? { ...r, status: "Rejected" as const, rejectionReason: reason } : r
      ),
    }));
    syncApi("put", `/requisitions/${reqId}/reject`, { reason });
    audit("Admin Requisition Rejected", `GM rejected requisition ${reqId}. Reason: ${reason}`, "Administrations");
    notif("warning", "Requisition Rejected", `Requisition ${reqId} rejected: ${reason}`, "Admin");
  },

  addITAsset: (newAsset) => {
    const codeNum = get().itAssets.length + 1;
    const isSoftware = newAsset.category === "Software License & SaaS";
    const prefix = isSoftware ? "IT-SW-2026-" : "IT-HW-2026-";
    const asset: ITAsset = {
      ...newAsset,
      id: `ita-${Date.now()}`,
      assetCode: `${prefix}${String(codeNum).padStart(2, "0")}`,
    };
    set((s) => ({ itAssets: [asset, ...s.itAssets] }));
    syncApi("post", "/it-assets", newAsset);
    audit(
      "IT Asset Registered",
      `Registered ${asset.category} '${asset.name}' assigned to ${asset.assignedToPersonOrStation}`,
      "IT Department"
    );
    notif("info", "IT Asset Added", `${asset.name} (${asset.assetCode})`, "IT");
  },

  updateITAsset: (assetId, updates) => {
    set((s) => ({
      itAssets: s.itAssets.map((a) => (a.id === assetId ? { ...a, ...updates } : a)),
    }));
    syncApi("put", `/it-assets/${assetId}`, updates);
    audit("IT Asset Updated", `Updated IT asset record ID ${assetId}`, "IT Department");
  },

  deleteITAsset: (assetId) => {
    set((s) => ({ itAssets: s.itAssets.filter((a) => a.id !== assetId) }));
    syncApi("delete", `/it-assets/${assetId}`);
    audit("IT Asset Removed", `Decommissioned / removed IT asset ID ${assetId}`, "IT Department");
  },

  // Campaigns
  addCampaign: (c) => {
    const campaign: Campaign = { ...c, budgetStatus: c.budgetStatus ?? "Pending Approval", id: `cmp-${Date.now()}` };
    set((s) => ({ campaigns: [campaign, ...s.campaigns] }));
    syncApi("post", "/campaigns", c);
    audit("Campaign Created", `Created campaign '${c.name}' with budget UGX ${c.budget.toLocaleString()}`, "Marketing & Sales");
    notif("success", "Campaign Created", `${c.name} — awaiting General Manager budget approval`, "Marketing");
  },

  updateCampaign: (id, updates) => {
    set((s) => ({
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
    syncApi("put", `/campaigns/${id}`, updates);
    audit("Campaign Updated", `Updated campaign ID ${id}`, "Marketing & Sales");
    notif("info", "Campaign Updated", `Campaign ${id} updated`, "Marketing");
  },

  deleteCampaign: (id) => {
    set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) }));
    syncApi("delete", `/campaigns/${id}`);
    audit("Campaign Deleted", `Deleted campaign ID ${id}`, "Marketing & Sales");
    notif("warning", "Campaign Deleted", `Campaign ${id} removed`, "Marketing");
  },

  approveCampaignBudget: (id) => {
    set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, budgetStatus: "Approved", budgetApprovedBy: actor()?.name, budgetApprovedAt: new Date().toISOString().split("T")[0] } : x)) }));
    syncApi("put", `/campaigns/${id}/approve-budget`, {});
    audit("Campaign Budget Approved", `General Manager approved budget for campaign ${id}`, "Finance");
    notif("success", "Budget Approved", "Campaign budget approved by the General Manager", "Finance");
  },

  gmApproveCampaignBudget: (id) => {
    set((s) => ({ campaigns: s.campaigns.map((x) => (x.id === id ? { ...x, budgetStatus: "Approved", budgetApprovedAt: new Date().toISOString() } : x)) }));
    syncApi("put", `/campaigns/${id}/gm-approve`, {});
    audit("Campaign Budget GM Approved", `GM approved final budget for campaign ${id}`, "Finance");
    notif("success", "GM Budget Approved", "Campaign budget fully approved", "Finance");
  },

  // Complaints
  addComplaint: (c) => {
    const complaint: Complaint = {
      ...c,
      id: `cmp-${Date.now()}`,
      complaintCode: c.complaintCode || `CMP-${Date.now()}`,
      status: "Open",
      ownedBy: "Marketing",
      reportedDate: c.reportedDate || new Date().toISOString(),
    };
    set((s) => ({ complaints: [complaint, ...s.complaints] }));
    syncApi("post", "/complaints", c);
    audit("Complaint Logged", `Logged ${c.category} complaint from ${c.clientName} (${c.siteName})`, "Marketing");
    notif("info", "Complaint Logged", `${c.clientName} — ${c.siteName}`, "Marketing");
  },

  updateComplaint: (id, updates) => {
    set((s) => ({ complaints: s.complaints.map((x) => (x.id === id ? { ...x, ...updates } : x)) }));
    syncApi("put", `/complaints/${id}`, updates);
    audit("Complaint Updated", `Updated complaint ${id}`, "Marketing");
  },

  resolveComplaint: (id, data) => {
    set((s) => ({
      complaints: s.complaints.map((x) => (x.id === id ? { ...x, status: "Resolved", ...data, resolvedBy: actor()?.name } : x)),
      sites: s.sites.map((site) => (data.satisfactionRating && site.siteName === get().complaints.find((c) => c.id === id)?.siteName
        ? { ...site, satisfactionRating: data.satisfactionRating }
        : site)),
    }));
    syncApi("put", `/complaints/${id}/resolve`, data);
    audit("Complaint Resolved", `Resolved complaint ${id} with rating ${data.satisfactionRating ?? "n/a"}`, "Marketing");
    notif("success", "Complaint Resolved", "Rating mirrored to client site", "Marketing");
  },

  referComplaint: (id, notes) => {
    set((s) => ({ complaints: s.complaints.map((x) => (x.id === id ? { ...x, status: "Referred", referredForInvestigation: true, resolutionNotes: notes } : x)) }));
    syncApi("put", `/complaints/${id}/refer`, { notes });
    audit("Complaint Referred", `Complaint ${id} referred to Investigations Officer`, "Marketing");
    notif("warning", "Complaint Referred", "Referred for investigation", "Marketing");
  },

  // Disciplinary
  addDisciplinaryAction: (d) => {
    const action: DisciplinaryAction = {
      ...d,
      id: `disc-${Date.now()}`,
      actionCode: d.actionCode || `DISC-${Date.now()}`,
      status: "Initiated",
      initiatedBy: actor()?.name || "system",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ disciplinaryActions: [action, ...s.disciplinaryActions] }));
    syncApi("post", "/disciplinary", d);
    audit("Disciplinary Action Initiated", `${d.actionType} for ${d.guardName} (${d.forceNumber}): ${d.reason}`, "HR");
    notif("warning", "Disciplinary Initiated", `${d.actionType} — ${d.guardName}`, "HR");
  },

  regionalApproveDisciplinary: (id) => {
    set((s) => ({ disciplinaryActions: s.disciplinaryActions.map((x) => (x.id === id ? { ...x, status: "Pending Ops Approval", regionalApprovedBy: actor()?.name } : x)) }));
    syncApi("put", `/disciplinary/${id}/regional-approve`, {});
    audit("Disciplinary Regional Approved", `Regional Manager approved disciplinary ${id}`, "Operations");
    notif("success", "Regional Approved", "Forwarded to Operations Manager", "Operations");
  },

  opsApproveDisciplinary: (id) => {
    set((s) => ({ disciplinaryActions: s.disciplinaryActions.map((x) => (x.id === id ? { ...x, status: "Pending HR Approval", operationsApprovedBy: actor()?.name } : x)) }));
    syncApi("put", `/disciplinary/${id}/ops-approve`, {});
    audit("Disciplinary Ops Approved", `Operations Manager approved disciplinary ${id}`, "Operations");
    notif("success", "Ops Approved", "Forwarded to HR for finalization", "Operations");
  },

  hrApproveDisciplinary: (id) => {
    set((s) => ({ disciplinaryActions: s.disciplinaryActions.map((x) => (x.id === id ? { ...x, status: "Finalized", hrApprovedBy: actor()?.name, approvedAt: new Date().toISOString() } : x)) }));
    syncApi("put", `/disciplinary/${id}/hr-approve`, {});
    audit("Disciplinary Finalized", `HR finalized disciplinary ${id}`, "HR");
    notif("success", "Disciplinary Finalized", "Guard record updated", "HR");
  },

  rejectDisciplinaryAction: (id, notes) => {
    set((s) => ({ disciplinaryActions: s.disciplinaryActions.map((x) => (x.id === id ? { ...x, status: "Rejected", resolutionNotes: notes } : x)) }));
    syncApi("put", `/disciplinary/${id}/reject`, { notes });
    audit("Disciplinary Rejected", `Disciplinary ${id} rejected`, "HR");
    notif("error", "Disciplinary Rejected", notes || "Action rejected", "HR");
  },

  // Deployments
  addDeployment: (d) => {
    const deployment: SiteDeployment = {
      ...d,
      id: `dep-${Date.now()}`,
      deploymentCode: d.deploymentCode || `DEP-${Date.now()}`,
      deployedAt: new Date().toISOString(),
      status: "Active",
    };
    set((s) => ({
      deployments: [deployment, ...s.deployments],
      guards: s.guards.map((g) => (g.id === d.guardId ? { ...g, lifecycleStage: "DEPLOYED", assignedSite: d.siteName } : g)),
      sites: s.sites.map((site) => (site.id === d.siteId ? { ...site, deploymentStatus: "Deployed" } : site)),
    }));
    syncApi("post", "/deployments", d);
    audit("Guard Deployed", `${d.guardName} deployed to ${d.siteName} (${d.shiftType})`, "Operations");
    notif("success", "Guard Deployed", `${d.guardName} → ${d.siteName}`, "Operations");
  },

  endDeployment: (id) => {
    set((s) => ({ deployments: s.deployments.map((x) => (x.id === id ? { ...x, status: "Completed" } : x)) }));
    syncApi("put", `/deployments/${id}/end`, {});
    audit("Deployment Ended", `Deployment ${id} completed`, "Operations");
    notif("info", "Deployment Ended", `Deployment ${id} completed`, "Operations");
  },

  addDeploymentOrder: (o) => {
    const order: DeploymentOrder = {
      ...o,
      id: `ord-${Date.now()}`,
      orderCode: `ORD-2026-${String(get().deploymentOrders.length + 1).padStart(3, "0")}`,
      status: "Open",
      assignedGuardIds: [],
    };
    set((s) => ({ deploymentOrders: [order, ...s.deploymentOrders] }));
    syncApi("post", "/deployment-orders", o);
    audit(
      "Deployment Order Issued",
      `Issued order ${order.orderCode} for ${order.requiredHeadcount} guard(s) at ${order.siteName} (${order.shiftType}) for RM fill`,
      "Operations"
    );
    notif("warning", "Deployment Order Issued", `${order.orderCode} — ${order.siteName}`, "Operations");
  },

  assignDeploymentOrder: (orderId, guardIds) => {
    const order = get().deploymentOrders.find((o) => o.id === orderId);
    if (!order || order.status !== "Open") return;
    const guards = get().guards.filter((g) => guardIds.includes(g.id)).slice(0, order.requiredHeadcount);
    if (guards.length === 0) return;

    const assignedGuardIds = guards.map((g) => g.id);
    const deployments = guards.map((g) => ({
      id: `dep-${Date.now()}-${g.id.slice(-4)}`,
      deploymentCode: `DEP-${Date.now()}-${g.id.slice(-4)}`,
      siteId: order.siteId,
      siteName: order.siteName,
      clientName: order.clientName,
      guardId: g.id,
      guardName: g.fullName,
      shiftType: order.shiftType,
      deployedBy: `${actor()?.name ?? "Regional Manager"} (via ${order.orderCode})`,
      deployedAt: new Date().toISOString().split("T")[0],
      status: "Active" as const,
    }));

    set((s) => ({
      deploymentOrders: s.deploymentOrders.map((x) =>
        x.id === orderId
          ? { ...x, assignedGuardIds, status: assignedGuardIds.length >= order.requiredHeadcount ? "Filled" : "Assigned" }
          : x
      ),
      deployments: [...deployments, ...s.deployments],
      guards: s.guards.map((g) =>
        assignedGuardIds.includes(g.id) ? { ...g, lifecycleStage: "DEPLOYED", assignedSite: order.siteName } : g
      ),
      sites: s.sites.map((site) => (site.id === order.siteId ? { ...site, deploymentStatus: "Deployed" } : site)),
    }));
    syncApi("put", `/deployment-orders/${orderId}/assign`, { guardIds: assignedGuardIds });
    audit(
      "Deployment Order Filled",
      `RM assigned ${guards.length} guard(s) to ${order.siteName} under ${order.orderCode}`,
      "Operations"
    );
    notif("success", "Order Filled", `${order.orderCode} — ${guards.length} guard(s) assigned`, "Operations");
  },

  cancelDeploymentOrder: (orderId) => {
    set((s) => ({
      deploymentOrders: s.deploymentOrders.map((x) => (x.id === orderId ? { ...x, status: "Cancelled" } : x)),
    }));
    syncApi("put", `/deployment-orders/${orderId}/cancel`, {});
    audit("Deployment Order Cancelled", `Deployment order ${orderId} cancelled`, "Operations");
    notif("warning", "Order Cancelled", `Deployment order ${orderId} cancelled`, "Operations");
  },

  // Transport Requests
  addTransportRequest: (r) => {
    const request: TransportRequest = {
      ...r,
      id: `tr-${Date.now()}`,
      requestCode: `TRP-${Date.now().toString().slice(-6)}`,
      status: "Pending Fleet",
    };
    set((s) => ({ transportRequests: [request, ...s.transportRequests] }));
    syncApi("post", "/transport-requests", r);
    audit(
      "Transport Requested",
      `${r.requestedByName} requested transport to ${r.destination} (${r.vehicleType}, ${r.passengersCount} pax)`,
      "Transport"
    );
    notif("warning", "Transport Requested", `Waiting on Fleet Manager for ${r.destination}`, "Transport");
  },

  actOnTransportRequest: (id, data) => {
    const request = get().transportRequests.find((x) => x.id === id);
    if (!request) return;
    const isApproved = data.action === "Approved";
    set((s) => ({
      transportRequests: s.transportRequests.map((x) =>
        x.id === id
          ? {
              ...x,
              status: isApproved ? "Approved" : "Declined",
              assignedVehicleId: data.assignedVehicleId,
              assignedVehicle: data.assignedVehicle,
              assignedDriverId: data.assignedDriverId,
              assignedDriver: data.assignedDriver,
              assignedRiderId: data.assignedRiderId,
              assignedRider: data.assignedRider,
              declinedReason: isApproved ? undefined : data.declinedReason,
              actedBy: actor()?.name,
              actedAt: new Date().toISOString(),
            }
          : x
      ),
    }));
    syncApi("put", `/transport-requests/${id}/act`, data);
    audit(
      isApproved ? "Transport Approved" : "Transport Declined",
      `${request.requestCode} ${isApproved ? `approved → ${data.assignedVehicle ?? "vehicle"} / ${data.assignedDriver ?? data.assignedRider ?? "driver"}` : `declined${data.declinedReason ? `: ${data.declinedReason}` : ""}`}`,
      "Transport"
    );
    notif(isApproved ? "success" : "error", isApproved ? "Transport Approved" : "Transport Declined", `${request.requestCode} → ${request.destination}`, "Transport");
  },

  // Site Surveys
  addSiteSurvey: (r) => {
    const survey: SiteSurvey = {
      ...r,
      id: `ss-${Date.now()}`,
      surveyCode: `SS-${Date.now().toString().slice(-6)}`,
      status: "Requested",
    };
    set((s) => ({ siteSurveys: [survey, ...s.siteSurveys] }));
    syncApi("post", "/site-surveys", r);
    audit(
      "Site Survey Requested",
      `${r.requestedByName} requested site survey for ${r.clientName} — ${r.siteName}`,
      "Operations"
    );
    notif("info", "Site Survey Requested", `${survey.surveyCode} for ${r.siteName}`, "Operations");
  },

  startSiteSurvey: (id, surveyedBy) => {
    set((s) => ({
      siteSurveys: s.siteSurveys.map((x) =>
        x.id === id ? { ...x, status: "In Progress" as const, surveyedBy } : x
      ),
    }));
    syncApi("put", `/site-surveys/${id}/start`, { surveyedBy });
    audit("Site Survey Started", `Survey ${id} started by ${surveyedBy}`, "Operations");
    notif("info", "Survey Started", `Survey ${id} is now In Progress`, "Operations");
  },

  completeSiteSurvey: (id, data) => {
    set((s) => ({
      siteSurveys: s.siteSurveys.map((x) =>
        x.id === id ? { ...x, ...data, status: "Completed" as const, reportPath: `survey-${id}-report` } : x
      ),
    }));
    syncApi("put", `/site-surveys/${id}/complete`, data);
    audit("Site Survey Completed", `Survey ${id} completed with recommendation`, "Operations");
    notif("success", "Survey Completed", `Survey ${id} report ready`, "Operations");
  },

  cancelSiteSurvey: (id) => {
    set((s) => ({
      siteSurveys: s.siteSurveys.map((x) => (x.id === id ? { ...x, status: "Cancelled" as const } : x)),
    }));
    syncApi("put", `/site-surveys/${id}/cancel`, {});
    audit("Site Survey Cancelled", `Survey ${id} cancelled`, "Operations");
    notif("warning", "Survey Cancelled", `Survey ${id} cancelled`, "Operations");
  },

  // Contract Inquiries
  addContractInquiry: (r) => {
    const inquiry: ContractInquiry = {
      ...r,
      id: `ci-${Date.now()}`,
      inquiryCode: `CI-${Date.now().toString().slice(-6)}`,
      status: "Pending",
    };
    set((s) => ({ contractInquiries: [inquiry, ...s.contractInquiries] }));
    syncApi("post", "/contract-inquiries", r);
    audit(
      "Contract Inquiry Raised",
      `${r.requestedByName} requested ${r.purpose} for ${r.clientName}`,
      "Records"
    );
    notif("info", "Inquiry Sent to Records", `${inquiry.inquiryCode} for ${r.clientName}`, "Records");
  },

  respondToContractInquiry: (id, data) => {
    set((s) => ({
      contractInquiries: s.contractInquiries.map((x) =>
        x.id === id
          ? {
              ...x,
              ...data,
              status: "Answered" as const,
              respondedBy: actor()?.name,
              respondedAt: new Date().toISOString().split("T")[0],
            }
          : x
      ),
    }));
    syncApi("put", `/contract-inquiries/${id}/respond`, data);
    audit("Contract Inquiry Answered", `Inquiry ${id} responded (${data.responseType})`, "Records");
    notif("success", "Inquiry Answered", `Inquiry ${id} → ${data.responseType}`, "Records");
  },

  // IT Servers
  updateITServer: (id, updates) => {
    set((s) => ({
      itServers: s.itServers.map((srv) => (srv.id === id ? { ...srv, ...updates } : srv)),
    }));
    syncApi("put", `/it-servers/${id}`, updates);
    audit("IT Server Updated", `Updated server ID ${id}`, "IT Department");
    notif("info", "Server Updated", `Server ${id} updated`, "IT");
  },

  deleteITServer: (id) => {
    set((s) => ({ itServers: s.itServers.filter((srv) => srv.id !== id) }));
    syncApi("delete", `/it-servers/${id}`);
    audit("IT Server Deleted", `Deleted server ID ${id}`, "IT Department");
    notif("warning", "Server Deleted", `Server ${id} removed`, "IT");
  },

  // IT Tickets
  addITTicket: (newTicket) => {
    const codeNum = get().itTickets.length + 1;
    const ticket: ITSupportTicket = {
      ...newTicket,
      id: `tkt-${Date.now()}`,
      ticketCode: `IT-2026-${String(codeNum).padStart(3, "0")}`,
    };
    set((s) => ({ itTickets: [ticket, ...s.itTickets] }));
    syncApi("post", "/it-tickets", newTicket);
    audit("IT Ticket Created", `Created support ticket '${ticket.subject}' for ${ticket.reportedBy}`, "IT Department");
    notif("info", "Ticket Created", `${ticket.subject} — ${ticket.priority}`, "IT");
  },

  updateITTicket: (id, updates) => {
    set((s) => ({
      itTickets: s.itTickets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    syncApi("put", `/it-tickets/${id}`, updates);
    audit("IT Ticket Updated", `Updated ticket ID ${id}`, "IT Department");
    notif("info", "Ticket Updated", `Ticket ${id} updated`, "IT");
  },

  deleteITTicket: (id) => {
    set((s) => ({ itTickets: s.itTickets.filter((t) => t.id !== id) }));
    syncApi("delete", `/it-tickets/${id}`);
    audit("IT Ticket Deleted", `Deleted ticket ID ${id}`, "IT Department");
    notif("warning", "Ticket Deleted", `Ticket ${id} removed`, "IT");
  },

  // Contracts
  addContract: (newContract) => {
    const contract: ContractRecord = {
      ...newContract,
      id: `ctr-${Date.now()}`,
    };
    set((s) => ({ contracts: [contract, ...s.contracts] }));
    syncApi("post", "/contracts", newContract);
    audit("Contract Added", `Archived contract '${contract.title}' (${contract.contractCode}) for ${contract.partyName}`, "HR");
    notif("success", "Contract Added", `${contract.title} — ${contract.partyName}`, "HR");
  },

  updateContract: (id, updates) => {
    const { action, ...rest } = updates;
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...rest } : c)),
    }));
    syncApi("put", `/contracts/${id}`, action ? { action, ...rest } : rest);
    audit("Contract Updated", `Updated contract ID ${id}`, "HR");
    notif("info", "Contract Updated", `Contract ${id} updated`, "HR");
  },

  voidContract: (id, voidReason) => {
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, status: "Terminated" as const, voidReason } : c)),
    }));
    syncApi("put", `/contracts/${id}`, { action: "void", voidReason });
    audit("Contract Terminated", `Terminated contract ID ${id}. Reason: ${voidReason}`, "HR");
    notif("warning", "Contract Terminated", `Contract ${id} voided`, "HR");
  },

  archiveContract: (id) => {
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, status: "Archived" as const } : c)),
    }));
    syncApi("put", `/contracts/${id}`, { action: "archive" });
    audit("Contract Archived", `Archived contract ID ${id}`, "HR");
    notif("info", "Contract Archived", `Contract ${id} moved to archive`, "HR");
  },

  issueContract: (id) => {
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, status: "Active" as const } : c)),
    }));
    syncApi("put", `/contracts/${id}`, { action: "issue" });
    audit("Staff Contract Issued", `Issued staff contract ID ${id}`, "HR");
    notif("success", "Contract Issued", `Contract ${id} issued`, "HR");
  },

  advanceContractApproval: (id) => {
    set((s) => ({
      contracts: s.contracts.map((c) => (c.id === id ? { ...c, approvalStep: "…" } : c)),
    }));
    syncApi("put", `/contracts/${id}`, { action: "approve" });
    audit("Contract Approval Advanced", `Advanced approval for contract ID ${id}`, "HR");
    notif("success", "Approval Advanced", `Contract ${id} moved to next approval step`, "HR");
  },

  addCohort: (newCohort) => {
    const cohort: TrainingCohort = { ...newCohort, id: `cohort-${Date.now()}` };
    set((s) => ({ trainingCohorts: [cohort, ...s.trainingCohorts] }));
    syncApi("post", "/cohorts", newCohort);
    audit(
      "Create Intake Cohort",
      `New recruit training cohort '${cohort.name}' (${cohort.code}) created under Training Academy.`,
      "Training Academy"
    );
    notif("success", "Cohort Created", `${cohort.name} (${cohort.code})`, "Training");
  },

  updateCohort: (cohortId, updates) => {
    set((s) => ({
      trainingCohorts: s.trainingCohorts.map((c) => (c.id === cohortId ? { ...c, ...updates } : c)),
    }));
    syncApi("put", `/cohorts/${cohortId}`, updates);
    audit("Training Cohort Updated", `Updated cohort ID ${cohortId}`, "Training Academy");
    notif("info", "Cohort Updated", `Cohort ${cohortId} updated`, "Training");
  },

  deleteCohort: (cohortId) => {
    set((s) => ({ trainingCohorts: s.trainingCohorts.filter((c) => c.id !== cohortId) }));
    syncApi("delete", `/cohorts/${cohortId}`);
    audit("Training Cohort Deleted", `Deleted cohort ID ${cohortId}`, "Training Academy");
    notif("warning", "Cohort Deleted", `Cohort ${cohortId} removed`, "Training");
  },

  addTrainee: (newTrainee) => {
    const trainee: RecruitTrainee = { ...newTrainee, id: `trn-${Date.now()}` };
    set((s) => ({ recruitTrainees: [trainee, ...s.recruitTrainees] }));
    syncApi("post", "/trainees", newTrainee);
    audit(
      "Enroll Recruit Guard",
      `Enrolled new recruit '${trainee.fullName}' (NIN: ${trainee.nationalIdNumber}) into ${trainee.cohortName}.`,
      "Training Academy"
    );
    notif("success", "Trainee Enrolled", `${trainee.fullName} → ${trainee.cohortName}`, "Training");
  },

  updateTrainee: (traineeId, updates) => {
    set((s) => ({
      recruitTrainees: s.recruitTrainees.map((t) => (t.id === traineeId ? { ...t, ...updates } : t)),
    }));
    syncApi("put", `/trainees/${traineeId}`, updates);
    audit("Trainee Updated", `Updated trainee ID ${traineeId}`, "Training Academy");
    notif("info", "Trainee Updated", `Trainee ${traineeId} updated`, "Training");
  },

  deleteTrainee: (traineeId) => {
    set((s) => ({ recruitTrainees: s.recruitTrainees.filter((t) => t.id !== traineeId) }));
    syncApi("delete", `/trainees/${traineeId}`);
    audit("Trainee Deleted", `Deleted trainee ID ${traineeId}`, "Training Academy");
    notif("warning", "Trainee Deleted", `Trainee ${traineeId} removed`, "Training");
  },

  graduateTrainee: (traineeId, forceNumber) => {
    const graduateDate = new Date().toISOString().split("T")[0];
    const trainee = get().recruitTrainees.find((t) => t.id === traineeId);
    if (!trainee) return;

    set((s) => ({
      recruitTrainees: s.recruitTrainees.map((t) =>
        t.id === traineeId
          ? {
              ...t,
              overallStatus: "Graduated & Certified",
              assignedForceNumber: forceNumber,
              dateGraduated: graduateDate,
            }
          : t
      ),
      trainingCohorts: s.trainingCohorts.map((c) =>
        c.id === trainee.cohortId ? { ...c, passedOutCount: c.passedOutCount + 1 } : c
      ),
      guards: [
        {
          id: `guard-${Date.now()}`,
          forceNumber: forceNumber,
          fullName: trainee.fullName,
          nationalId: trainee.nationalIdNumber,
          designation: "Guard" as const,
          assignedSite: "Standby Operations Reserve",
          location: trainee.assignedRegion || "Kampala Central",
          phone: "+256 700 000000",
          joinDate: graduateDate,
          status: "Off Duty" as const,
          bankName: "Stanbic Bank Uganda",
          bankAccount: `90300${Math.floor(1000000 + Math.random() * 9000000)}`,
          warningLettersCount: 0,
          medicalCleared: true,
          armedQualified: true,
          k9Qualified: false,
          certifications: ["Pass-Out Drill Certification", "Tactical & Firearms Proficiency"],
        },
        ...s.guards,
      ],
    }));

    syncApi("put", `/trainees/${traineeId}/graduate`, { forceNumber });
    audit(
      "Pass-Out Guard Certification",
      `Graduated guard '${trainee.fullName}', assigned Force Number '${forceNumber}', and transferred to active Guard HR Personnel Roster.`,
      "Training Academy"
    );
    notif("success", "Guard Graduated", `${trainee.fullName} → Force No. ${forceNumber}`, "Training");
  },

  addLeaveRequest: (r) => {
    const req: LeaveRequest = { ...r, id: `lr-${Date.now()}`, status: "Pending HR Approval", requestedByRole: actor()?.role };
    set((s) => ({ leaveRequests: [req, ...s.leaveRequests] }));
    syncApi("post", "/leave-requests", r);
    audit("Leave Request Submitted", `${req.guardName} requested ${req.leaveType} from ${req.startDate} to ${req.endDate}`, "HR");
    notif("info", "Leave Requested", `${req.guardName} — ${req.leaveType} (${req.startDate} to ${req.endDate})`, "HR");
    notif("info", "Pending HR Action", `${req.guardName} — pending approval for ${req.leaveType}`, "HR");
  },

  updateLeaveRequest: (id, updates) => {
    set((s) => ({
      leaveRequests: s.leaveRequests.map((lr) => (lr.id === id ? { ...lr, ...updates } : lr)),
    }));
    syncApi("put", `/leave-requests/${id}`, updates);
    audit("Leave Request Updated", `Updated leave request ID ${id}`, "HR");
    notif("info", "Leave Updated", `Leave request ${id} updated`, "HR");
  },

  hrApproveLeave: (id, verification) => {
    const lr = get().leaveRequests.find((lr) => lr.id === id);
    const approvalId = lr?.approvalId;
    if (approvalId) {
      get().actOnApproval(approvalId, "Approved", verification?.resumptionDate ? `Resumption: ${verification.resumptionDate}` : undefined);
    }
    const computed = verification
      ? { entitlement: verification.entitlement, taken: verification.taken, balance: verification.balance }
      : computeMockLeaveBalance(get().leaveRequests, lr);
    set((s) => ({
      leaveRequests: s.leaveRequests.map((lr) =>
        lr.id === id ? { ...lr, status: "Pending GM Approval" as const, ...computed } : lr
      ),
    }));
    audit("Leave HR Approved", `HR approved leave request ${id}, forwarded to GM`, "HR");
    notif("info", "HR Approved", `Leave request ${id} forwarded to GM for final approval`, "HR");
  },

  gmApproveLeave: (id) => {
    const lr = get().leaveRequests.find((lr) => lr.id === id);
    const approvalId = lr?.approvalId;
    if (approvalId) {
      get().actOnApproval(approvalId, "Approved");
    }
    set((s) => ({
      leaveRequests: s.leaveRequests.map((lr) =>
        lr.id === id
          ? { ...lr, status: "Approved" as const, approvedBy: actor()?.name, gmApprovedBy: actor()?.name }
          : lr
      ),
    }));
    audit("Leave GM Approved", `GM gave final approval to leave request ${id}`, "Directorate");
    notif("success", "Leave Approved", `Leave request ${id} fully approved`, "HR");
  },

  deleteLeaveRequest: (id) => {
    set((s) => ({ leaveRequests: s.leaveRequests.filter((lr) => lr.id !== id) }));
    syncApi("delete", `/leave-requests/${id}`);
    audit("Leave Request Cancelled", `Cancelled leave request ID ${id}`, "HR");
    notif("warning", "Leave Cancelled", `Leave request ${id} cancelled`, "HR");
  },

  rejectLeaveRequest: (id, notes) => {
    const lr = get().leaveRequests.find((lr) => lr.id === id);
    const requesterRole = lr?.requestedByRole;
    // §5: HR denial authority only applies to genuinely subordinate staff;
    // leave from the GM or peer department managers cannot be denied by HR.
    const HR_SUBORDINATE_ROLES = ["HR Assistant", "Records Officer", "Sales and Marketing Supervisor", "Guard Officer", "Armorer", "K9 Supervisor", "K9 Handler", "Accountant", "Assistant Accountant", "Cashier"];
    if (requesterRole && !HR_SUBORDINATE_ROLES.includes(requesterRole)) {
      notif("error", "Cannot Reject", "Leave requests from the General Manager or peer department managers cannot be denied by HR — escalate to the General Manager.", "HR");
      return;
    }
    const approvalId = lr?.approvalId;
    if (approvalId) {
      get().actOnApproval(approvalId, "Rejected", notes);
    } else {
      set((s) => ({
        leaveRequests: s.leaveRequests.map((lr) =>
          lr.id === id ? { ...lr, status: "Rejected" as const, notes: notes ?? lr.notes } : lr
        ),
      }));
    }
    audit("Leave Request Rejected", `Leave request ${id} rejected`, "HR");
    notif("error", "Leave Rejected", `Leave request ${id} was rejected`, "HR");
  },

  addWorkflow: (wf) => {
    const w = { ...wf, id: `wf-${Date.now()}`, isActive: true, steps: wf.steps.map((s) => ({ ...s, id: `ws-${Date.now()}-${s.stepOrder}` })) };
    set((s) => ({ workflows: [...s.workflows, w] }));
    syncApi("post", "/workflows", wf);
    audit("Workflow Created", `Created workflow '${wf.name}' (${wf.code}) for ${wf.module}`, "IT Admin");
    notif("info", "Workflow Created", `${wf.name} (${wf.code}) for ${wf.module}`, "IT");
  },

  updateWorkflow: (id, updates) => {
    set((s) => ({ workflows: s.workflows.map((w) => (w.id === id ? { ...w, ...updates } : w)) }));
    syncApi("put", `/workflows/${id}`, updates);
  },

  deleteWorkflow: (id) => {
    set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }));
    syncApi("delete", `/workflows/${id}`);
    audit("Workflow Deleted", `Deleted workflow ID ${id}`, "IT Admin");
    notif("warning", "Workflow Deleted", `Workflow ${id} removed`, "IT");
  },

  actOnApproval: (id, action, comment) => {
    const approval = get().approvals.find((a) => a.id === id);
    if (!approval) return;
    const prev = get().approvals;
    const newAction: ApprovalAction = {
      id: `aa-${Date.now()}`,
      approvalId: id,
      stepOrder: approval.currentStep,
      actorRole: actor()?.role || "system",
      actorName: actor()?.name || "system",
      action,
      comment,
      actedAt: new Date().toISOString(),
    };
    const applyLocal = (next: Partial<Approval>) => {
      set((s) => ({ approvals: s.approvals.map((a) => a.id === id ? { ...a, ...next, actions: [...a.actions, newAction] } : a) }));
    };
    if (action === "Rejected") {
      applyLocal({ status: "Rejected" });
    } else if (approval.currentStep >= approval.totalSteps) {
      applyLocal({ status: "Approved" });
    } else {
      applyLocal({ currentStep: approval.currentStep + 1 });
    }
    if (approval.referenceType === "LeaveRequest") {
      set((s) => ({
        leaveRequests: s.leaveRequests.map((lr) => {
          if (lr.approvalId !== id) return lr;
          let status = lr.status;
          if (action === "Rejected") status = "Rejected";
          else if (approval.currentStep >= approval.totalSteps) status = "Approved";
          else {
            const nextStep = approval.currentStep + 1;
            const wf = s.workflows.find((w) => w.id === approval.workflowId || w.code === approval.workflowCode);
            const stepDef = wf?.steps.find((st) => st.stepOrder === nextStep);
            status = stepDef?.name?.includes("GM") ? "Pending GM Approval" : "Pending HR Approval";
          }
          return { ...lr, status };
        }),
      }));
    }
    notif(action === "Approved" ? "success" : "error", `Approval ${action}`, `${approval.referenceType || "Request"} ${action.toLowerCase()}${comment ? `: ${comment}` : ""}`, "Workflow");

    const { useApi } = get();
    if (!useApi) return;
    api.put<{ status: string }>(`/approvals/${id}/act`, { action, comment })
      .then((res) => {
        set((s) => ({
          approvals: s.approvals.map((a) => {
            if (a.id !== id) return a;
            if (res.status === "Approved") return { ...a, status: "Approved" as const };
            if (res.status === "Rejected") return { ...a, status: "Rejected" as const };
            const match = /Advanced to step (\d+)/.exec(res.status);
            return match ? { ...a, currentStep: Number(match[1]) } : a;
          }),
        }));
      })
      .catch(() => {
        set({ approvals: prev });
        notif("error", "Sync Failed", `Could not persist approval action for ${approval.referenceType || "request"}`, "Workflow");
      });
  },

  uploadDocument: (d) => {
    const doc: DocumentRecord = { ...d, id: `doc-${Date.now()}`, createdAt: new Date().toISOString() };
    set((s) => ({ documents: [doc, ...s.documents] }));
    notif("success", "Document Uploaded", `${d.name} (${d.category})`, "Documents");
  },

  updateDocument: (id, updates) => {
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)) }));
    syncApi("put", `/documents/${id}`, updates);
    audit("Document Updated", `Updated document ${id}`, "Document Management");
    notif("info", "Document Updated", `Document ${id} updated`, "Documents");
  },

  deleteDocument: (id) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    syncApi("delete", `/documents/${id}`);
    audit("Document Deleted", `Deleted document ${id}`, "Document Management");
  },

  addJobPosting: (j) => {
    const posting: JobPosting = { ...j, id: `job-${Date.now()}`, candidates: [] };
    set((s) => ({ jobPostings: [posting, ...s.jobPostings] }));
    syncApi("post", "/job-postings", j);
    audit("Job Posting Created", `Created posting '${j.title}' (${j.code}) for ${j.department}`, "HR");
    notif("info", "Job Posted", `${j.title} (${j.code}) — ${j.department}`, "Recruitment");
  },

  updateJobPosting: (id, updates) => {
    set((s) => ({ jobPostings: s.jobPostings.map((j) => j.id === id ? { ...j, ...updates } : j) }));
    syncApi("put", `/job-postings/${id}`, updates);
  },

  addCandidate: (c) => {
    const cand: Candidate = { ...c, id: `cand-${Date.now()}` };
    set((s) => ({ candidates: [cand, ...s.candidates] }));
    syncApi("post", "/candidates", c);
    notif("info", "Candidate Added", `${cand.fullName} for position`, "Recruitment");
  },

  updateCandidate: (id, updates) => {
    const cand = get().candidates.find((c) => c.id === id);
    const hiringDriverOrRider = updates.status === "Hired" && (cand?.roleType === "Driver" || cand?.roleType === "Rider");
    set((s) => ({ candidates: s.candidates.map((c) => c.id === id ? { ...c, ...updates } : c) }));
    syncApi("put", `/candidates/${id}`, updates);
    if (hiringDriverOrRider && cand && !get().drivers.some((d) => d.sourceRef === id)) {
      const known = [
        ...get().drivers.map((d) => d.forceNumber || d.driverCode),
        ...get().guards.map((g) => g.forceNumber),
      ];
      const pending: DriverRecord = {
        id: `DRV-CAND-${Date.now()}`,
        driverCode: `DRV-CAND-PENDING`,
        forceNumber: nextForceNumber(known),
        fullName: cand.fullName,
        contactPhone: cand.phone,
        nationalId: cand.nationalId,
        licenceNumber: cand.licenceNumber || "PENDING",
        licenceClass: (cand.licenceClass as DriverRecord["licenceClass"]) || "Class B & DL (Light/Heavy)",
        licenceExpiryDate: cand.licenceExpiryDate || "2030-12-31",
        assignedVehiclePlate: "Unassigned",
        dutyShift: "On Call Standby",
        safetyScorePct: 0,
        totalTripsCompleted: 0,
        trainingBadges: [],
        sourceRef: id,
        status: "Pending FM Approval",
      };
      set((s) => ({ drivers: [pending, ...s.drivers] }));
      audit("Driver Pending FM Approval", `Hired ${cand.roleType} ${cand.fullName} awaiting Fleet Manager approval`, "Recruitment");
      notif("info", "Driver Onboarding Queued", `${cand.fullName} sent to Fleet Manager for approval`, "Recruitment");
    }
    notif("info", "Candidate Updated", `Candidate ${id} status updated`, "Recruitment");
  },

  addPerformanceReview: (r) => {
    const review: PerformanceReviewRecord = { ...r, id: `pr-${Date.now()}` };
    set((s) => ({ performanceReviews: [review, ...s.performanceReviews] }));
    syncApi("post", "/performance-reviews", r);
    audit("Performance Review Created", `Review for ${r.guardName} (${r.reviewPeriod})`, "HR");
    notif("success", "Performance Review Created", `${r.guardName} — ${r.reviewPeriod} (${r.overallRating})`, "HR");
  },

  updatePerformanceReview: (id, updates) => {
    set((s) => ({ performanceReviews: s.performanceReviews.map((r) => r.id === id ? { ...r, ...updates } : r) }));
    audit("Performance Review Updated", `Updated review ID ${id}`, "HR");
    notif("success", "Review Updated", `Performance review ${id} updated`, "HR");
  },

  addRegion: (r) => {
    const region: RegionalOffice = { ...r, id: `reg-${Date.now()}` };
    set((s) => ({ regions: [...s.regions, region] }));
    syncApi("post", "/regions", r);
    audit("Region Created", `Created new region '${region.name}' (${region.code})`, "IT Admin");
    notif("success", "Region Created", `${region.name} (${region.code})`, "IT");
  },

  updateRegion: (id, updates) => {
    set((s) => ({ regions: s.regions.map((r) => (r.id === id ? { ...r, ...updates } : r)) }));
    syncApi("put", `/regions/${id}`, updates);
    audit("Region Updated", `Updated region ID ${id}`, "IT Admin");
    notif("info", "Region Updated", `Region ${id} updated`, "IT");
  },

  deleteRegion: (id) => {
    set((s) => ({ regions: s.regions.filter((r) => r.id !== id) }));
    syncApi("delete", `/regions/${id}`);
    audit("Region Deleted", `Deleted region ID ${id}`, "IT Admin");
    notif("warning", "Region Deleted", `Region ID ${id} removed`, "IT");
  },

  setUseApi: (v) => set({ useApi: v }),

  hydrateFromApi: async () => {
    try {
      const [guards, sites, incidents, vehicles, invoices, expenses, leads, regions,
        regionalOffices, leaveRequests, workflows, approvals, documents, jobPostings, candidates,
        performanceReviews, k9s, k9Logs, k9HealthInspections, armoury, armouryLogs, cashierTxns, contracts,
        campaigns, complaints, disciplinaryActions, deployments, deploymentOrders,
        transportRequests,
        siteSurveys, contractInquiries,
        trips, fuelLogs, maintenanceLogs, drivers, inspections, breakdowns,
        dutyRoster, patrolInspections, adminRequisitions, trainingCohorts, recruitTrainees,
        itServers, itTickets, itAssets, collections] = await Promise.all([
        domainApi.guards.list().catch(() => []),
        domainApi.sites.list().catch(() => []),
        domainApi.incidents.list().catch(() => []),
        domainApi.vehicles.list().catch(() => []),
        domainApi.invoices.list().catch(() => []),
        domainApi.expenses.list().catch(() => []),
        domainApi.leads.list().catch(() => []),
        domainApi.regions.list().catch(() => []),
        domainApi.regionalOffices.list().catch(() => []),
        domainApi.leaveRequests.list().catch(() => []),
        domainApi.workflows.list().catch(() => []),
        domainApi.approvals.list().catch(() => []),
        domainApi.documents.list().catch(() => []),
        domainApi.jobPostings.list().catch(() => []),
        domainApi.candidates.list().catch(() => []),
        domainApi.performanceReviews.list().catch(() => []),
        domainApi.k9s.list().catch(() => []),
        domainApi.k9Logs.list().catch(() => []),
        domainApi.k9HealthInspections.list().catch(() => []),
        domainApi.armoury.list().catch(() => []),
        domainApi.armouryLogs.list().catch(() => []),
        domainApi.cashierTxns.list().catch(() => []),
        domainApi.contracts.list().catch(() => []),
        domainApi.campaigns.list().catch(() => []),
        domainApi.complaints.list().catch(() => []),
        domainApi.disciplinary.list().catch(() => []),
        domainApi.deployments.list().catch(() => []),
        domainApi.deploymentOrders.list().catch(() => []),
        domainApi.transportRequests.list().catch(() => []),
        domainApi.siteSurveys.list().catch(() => []),
        domainApi.contractInquiries.list().catch(() => []),
        domainApi.trips.list().catch(() => []),
        domainApi.fuelLogs.list().catch(() => []),
        domainApi.maintenanceLogs.list().catch(() => []),
        domainApi.drivers.list().catch(() => []),
        domainApi.inspections.list().catch(() => []),
        domainApi.breakdowns.list().catch(() => []),
        domainApi.dutyRoster.list().catch(() => []),
        domainApi.patrolInspections.list().catch(() => []),
        domainApi.requisitions.list().catch(() => []),
        domainApi.trainingCohorts.list().catch(() => []),
        domainApi.recruitTrainees.list().catch(() => []),
        domainApi.itServers.list().catch(() => []),
        domainApi.itTickets.list().catch(() => []),
        domainApi.itAssets.list().catch(() => []),
        domainApi.collections.list().catch(() => []),
      ]);
      set({
        useApi: true,
        guards: guards.length > 0 ? guards : get().guards,
        sites: sites.length > 0 ? sites : get().sites,
        incidents: incidents.length > 0 ? incidents : get().incidents,
        vehicles: vehicles.length > 0 ? vehicles : get().vehicles,
        invoices: invoices.length > 0 ? invoices : get().invoices,
        collections: collections.length > 0 ? collections : get().collections,
        expenses: expenses.length > 0 ? expenses : get().expenses,
        leads: leads.length > 0 ? leads : get().leads,
        regions: regions.length > 0 ? regions : get().regions,
        regionalOffices: regionalOffices.length > 0 ? regionalOffices : get().regionalOffices,
        leaveRequests: leaveRequests.length > 0 ? leaveRequests : get().leaveRequests,
        workflows: workflows.length > 0 ? workflows : get().workflows,
        approvals: approvals.length > 0 ? approvals : get().approvals,
        documents: documents.length > 0 ? documents : get().documents,
        jobPostings: jobPostings.length > 0 ? jobPostings : get().jobPostings,
        candidates: candidates.length > 0 ? candidates : get().candidates,
        performanceReviews: performanceReviews.length > 0 ? performanceReviews : get().performanceReviews,
        k9s: k9s.length > 0 ? k9s : get().k9s,
        k9Logs: k9Logs.length > 0 ? k9Logs : get().k9Logs,
        k9HealthInspections: k9HealthInspections.length > 0 ? k9HealthInspections : get().k9HealthInspections,
        armoury: armoury.length > 0 ? armoury : get().armoury,
        armouryLogs: armouryLogs.length > 0 ? armouryLogs : get().armouryLogs,
        cashierTxns: cashierTxns.length > 0 ? cashierTxns : get().cashierTxns,
        contracts: contracts.length > 0 ? contracts : get().contracts,
        campaigns: campaigns.length > 0 ? campaigns : get().campaigns,
        complaints: complaints.length > 0 ? complaints : get().complaints,
        disciplinaryActions: disciplinaryActions.length > 0 ? disciplinaryActions : get().disciplinaryActions,
        deployments: deployments.length > 0 ? deployments : get().deployments,
        deploymentOrders: deploymentOrders.length > 0 ? deploymentOrders : get().deploymentOrders,
        transportRequests: transportRequests.length > 0 ? transportRequests : get().transportRequests,
        siteSurveys: siteSurveys.length > 0 ? siteSurveys : get().siteSurveys,
        contractInquiries: contractInquiries.length > 0 ? contractInquiries : get().contractInquiries,
        trips: trips.length > 0 ? trips : get().trips,
        fuelLogs: fuelLogs.length > 0 ? fuelLogs : get().fuelLogs,
        maintenanceLogs: maintenanceLogs.length > 0 ? maintenanceLogs : get().maintenanceLogs,
        drivers: drivers.length > 0 ? drivers : get().drivers,
        inspections: inspections.length > 0 ? inspections : get().inspections,
        breakdowns: breakdowns.length > 0 ? breakdowns : get().breakdowns,
        dutyRoster: dutyRoster.length > 0 ? dutyRoster : get().dutyRoster,
        patrolInspections: patrolInspections.length > 0 ? patrolInspections : get().patrolInspections,
        adminRequisitions: adminRequisitions.length > 0 ? adminRequisitions : get().adminRequisitions,
        trainingCohorts: trainingCohorts.length > 0 ? trainingCohorts : get().trainingCohorts,
        recruitTrainees: recruitTrainees.length > 0 ? recruitTrainees : get().recruitTrainees,
        itServers: itServers.length > 0 ? itServers : get().itServers,
        itTickets: itTickets.length > 0 ? itTickets : get().itTickets,
        itAssets: itAssets.length > 0 ? itAssets : get().itAssets,
      });
    } catch {
      // API unavailable, keep mock data
    }
  },
}));
