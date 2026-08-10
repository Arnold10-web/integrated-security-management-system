import React, { useState } from "react";
import { Clock, Plus, ShieldAlert, Dog, ShieldCheck, GraduationCap, FileText } from "lucide-react";
import type { DutyRoster, Guard, ClientSite, UserRole, ArmouryItem, ArmouryLog, K9Dog, K9Log, K9HealthInspection, PatrolInspectionLog, TrainingCohort, RecruitTrainee, ContractRecord } from "../../types";
import { ArmouryView } from "./ArmouryView";
import { K9UnitView } from "./K9UnitView";
import { PatrolInspectionView } from "./PatrolInspectionView";
import { TrainingSchoolView } from "./TrainingSchoolView";
import { ScheduleShiftModal, DutyRosterTable, GuardDeploymentPipeline, ClientContractsView } from "../organisms";
import { ARMOURY_OPERATOR_ROLES, K9_OPERATOR_ROLES, OPS_MANAGEMENT_ROLES, TRAINING_OFFICER_ROLES, isRoleIn } from "../../services/rbacService";

interface OperationsViewProps {
  roster: DutyRoster[];
  guards: Guard[];
  sites: ClientSite[];
  activeRole: UserRole;
  onUpdateRosterStatus: (rosterId: string, status: DutyRoster["status"]) => void;
  onAddRosterEntry: (newEntry: Omit<DutyRoster, "id">) => void;
  onUpdateGuard?: (guardId: string, updates: Partial<Guard>) => void;
  onMoveLifecycle?: (guardId: string, updates: Partial<Guard>) => void;

  // Armoury Props
  armoury: ArmouryItem[];
  armouryLogs: ArmouryLog[];
  onIssueArmouryItem: (
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
  onReturnArmouryItem: (
    logId: string,
    ammoRoundsIn: number,
    dateIn: string,
    timeIn: string,
    signInConfirmed: boolean,
    substituteReceiver?: string,
    notes?: string
  ) => void;
  onAddArmouryItem: (newItem: Omit<ArmouryItem, "id">) => void;

  // K9 Props
  k9s: K9Dog[];
  k9Logs: K9Log[];
  k9HealthInspections?: K9HealthInspection[];
  onPairK9Handler: (k9Id: string, handlerId: string) => void;
  onAddK9Dog: (newDog: Omit<K9Dog, "id">) => void;
  onUpdateK9Dog?: (id: string, updates: Partial<K9Dog>) => void;
  onDeleteK9Dog?: (id: string) => void;
  onLogK9Deployment: (newLog: Omit<K9Log, "id">) => void;
  onAddK9HealthInspection?: (newIns: Omit<K9HealthInspection, "id" | "inspectionCode">) => void;
  onUpdateK9HealthInspection?: (id: string, updates: Partial<K9HealthInspection>) => void;
  onDeleteK9HealthInspection?: (id: string) => void;

  // Patrol Inspection Props
  patrolInspections?: PatrolInspectionLog[];
  onAddPatrolInspection?: (newIns: Omit<PatrolInspectionLog, "id">) => void;
  onUpdatePatrolInspection?: (id: string, updates: Partial<PatrolInspectionLog>) => void;
  onDeletePatrolInspection?: (id: string) => void;

  // Training School Props
  trainingCohorts?: TrainingCohort[];
  recruitTrainees?: RecruitTrainee[];
  onAddCohort?: (newCohort: Omit<TrainingCohort, "id">) => void;
  onUpdateCohort?: (id: string, updates: Partial<TrainingCohort>) => void;
  onDeleteCohort?: (id: string) => void;
  onAddTrainee?: (newTrainee: Omit<RecruitTrainee, "id">) => void;
  onUpdateTrainee?: (id: string, updates: Partial<RecruitTrainee>) => void;
  onDeleteTrainee?: (id: string) => void;
  onGraduateTrainee?: (traineeId: string, forceNumber: string) => void;
  existingForceNumbers?: string[];

  initialSubTab?: "roster" | "armoury" | "k9" | "patrol" | "training" | "contracts";
  currentUserRegion?: string;

  // Client Contract Props (validation surface)
  contracts?: ContractRecord[];
  onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void;
  onAdvanceApproval?: (id: string) => void;
  onVoidContract?: (id: string, reason: string) => void;

  onViewBiodata?: (guard: Guard) => void;
}

const ARMOURY_ROLES: UserRole[] = ARMOURY_OPERATOR_ROLES;
const K9_ROLES: UserRole[] = K9_OPERATOR_ROLES;
const PATROL_ROLES: UserRole[] = OPS_MANAGEMENT_ROLES;
const TRAINING_ROLES: UserRole[] = TRAINING_OFFICER_ROLES;
const CONTRACT_APPROVAL_ROLES: UserRole[] = OPS_MANAGEMENT_ROLES;

export const OperationsView: React.FC<OperationsViewProps> = ({
  roster,
  guards,
  sites,
  activeRole,
  onUpdateRosterStatus,
  onAddRosterEntry,
  onUpdateGuard,
  onMoveLifecycle,
  armoury,
  armouryLogs,
  onIssueArmouryItem,
  onReturnArmouryItem,
  onAddArmouryItem,
  k9s,
  k9Logs,
  k9HealthInspections = [],
  onPairK9Handler,
  onAddK9Dog,
  onUpdateK9Dog,
  onDeleteK9Dog,
  onLogK9Deployment,
  onAddK9HealthInspection = () => {},
  onUpdateK9HealthInspection,
  onDeleteK9HealthInspection,
  patrolInspections = [],
  onAddPatrolInspection = () => {},
  onUpdatePatrolInspection,
  onDeletePatrolInspection,
  trainingCohorts = [],
  recruitTrainees = [],
  onAddCohort = () => {},
  onUpdateCohort,
  onDeleteCohort,
  onAddTrainee = () => {},
  onUpdateTrainee,
  onDeleteTrainee,
  onGraduateTrainee = () => {},
  existingForceNumbers = [],
  initialSubTab,
  currentUserRegion,
  contracts,
  onUpdateContract,
  onAdvanceApproval,
  onVoidContract,
  onViewBiodata,
}) => {
  const isTrainingOfficer = isRoleIn(activeRole, TRAINING_OFFICER_ROLES);
  const [activeSubTab, setActiveSubTab] = useState<
    "roster" | "armoury" | "k9" | "patrol" | "training" | "contracts"
  >(initialSubTab ?? (isTrainingOfficer ? "training" : "roster"));
  const [showAddModal, setShowAddModal] = useState(false);

  const isRegionScoped = activeRole === "Regional Manager" && !!currentUserRegion;
  const visibleRoster = isRegionScoped
    ? roster.filter((r) => !r.region || r.region === currentUserRegion)
    : roster;
  const visiblePipelineGuards = isRegionScoped
    ? guards.filter((g) => !g.location || g.location.toLowerCase().includes(currentUserRegion!.toLowerCase()))
    : guards;

  return (
    <div className="space-y-6">
      {/* Top Operations Department Command Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-black uppercase tracking-wider border border-blue-500/30">
            Operations Department
          </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Operations Department — Field Operations, Armoury & Canine & Fleet</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized operational management for shift rosters, armoury vault, canine unit patrols, training school, and fleet operations.
          </p>
        </div>

        {activeSubTab === "roster" && isRoleIn(activeRole, OPS_MANAGEMENT_ROLES) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Shift Roster</span>
          </button>
        )}
      </div>

      {/* Operations Department Division Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {!isTrainingOfficer && (
        <button
          onClick={() => setActiveSubTab("roster")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "roster"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>1. Duty Rosters & Shift Attendance ({roster.length})</span>
        </button>
        )}

        {!isTrainingOfficer && ARMOURY_ROLES.includes(activeRole) && (
        <button
          onClick={() => setActiveSubTab("armoury")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "armoury"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>2. Armoury Vault ({armoury.length})</span>
        </button>
        )}

        {!isTrainingOfficer && K9_ROLES.includes(activeRole) && (
        <button
          onClick={() => setActiveSubTab("k9")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "k9"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Dog className="w-4 h-4 text-emerald-400" />
          <span>3. Canine Unit & Kennels ({k9s.length})</span>
        </button>
        )}

        {!isTrainingOfficer && PATROL_ROLES.includes(activeRole) && (
        <button
          onClick={() => setActiveSubTab("patrol")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "patrol"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>4. Patrols & Radio Checks ({patrolInspections.length})</span>
        </button>
        )}

        {TRAINING_ROLES.includes(activeRole) && (
        <button
          onClick={() => setActiveSubTab("training")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "training"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span>5. Training Academy & Pass-Out School ({trainingCohorts.length})</span>
        </button>
        )}

        {!isTrainingOfficer && CONTRACT_APPROVAL_ROLES.includes(activeRole) && (
        <button
          onClick={() => setActiveSubTab("contracts")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
            activeSubTab === "contracts"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>6. Client Contracts & SLA Scope ({(contracts ?? []).filter((c) => c.contractType === "Client Contract").length})</span>
        </button>
        )}
      </div>

      {/* Roster Sub-tab */}
      {activeSubTab === "roster" && (
        <div className="space-y-6">
          {isRegionScoped && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2">
              <span className="uppercase tracking-wider">Regional view</span>
              <span>Showing duty roster for <span className="underline">{currentUserRegion}</span> only ({visibleRoster.length} shifts).</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">Active Scheduled Shifts</span>
              <div className="text-2xl font-black text-slate-900">{visibleRoster.length} Shifts</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">Officers Checked In</span>
              <div className="text-2xl font-black text-emerald-600">
                {visibleRoster.filter((r) => r.status === "Present").length} Present
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 block mb-1">Overtime Deployed</span>
              <div className="text-2xl font-black text-blue-600">
                {visibleRoster.filter((r) => r.status === "On Overtime").length} Officers
              </div>
            </div>
          </div>

          <GuardDeploymentPipeline
            guards={visiblePipelineGuards}
            activeRole={activeRole}
            onMoveLifecycle={onMoveLifecycle}
            onViewBiodata={onViewBiodata}
          />

          <DutyRosterTable roster={visibleRoster} onUpdateStatus={onUpdateRosterStatus} guards={guards} sites={sites} onUpdateGuard={onUpdateGuard} />
        </div>
      )}

      {/* Armoury Sub-tab */}
      {activeSubTab === "armoury" && (
        <ArmouryView
          items={armoury}
          logs={armouryLogs}
          guards={guards}
          activeRole={activeRole}
          onIssueItem={onIssueArmouryItem}
          onReturnItem={onReturnArmouryItem}
          onAddItem={onAddArmouryItem}
        />
      )}

      {/* K9 Sub-tab */}
      {activeSubTab === "k9" && (
        <K9UnitView
          k9s={k9s}
          logs={k9Logs}
          healthInspections={k9HealthInspections}
          guards={guards}
          onPairHandler={onPairK9Handler}
          onAddDog={onAddK9Dog}
          onUpdateK9Dog={onUpdateK9Dog}
          onDeleteK9Dog={onDeleteK9Dog}
          onLogDeployment={onLogK9Deployment}
          onAddHealthInspection={onAddK9HealthInspection}
          onUpdateK9HealthInspection={onUpdateK9HealthInspection}
          onDeleteK9HealthInspection={onDeleteK9HealthInspection}
        />
      )}

      {/* Patrol & Radio Checks Sub-tab */}
      {activeSubTab === "patrol" && (
        <PatrolInspectionView
          inspections={patrolInspections}
          guards={guards}
          sites={sites}
          activeRole={activeRole}
          onAddInspection={onAddPatrolInspection}
          onUpdateInspection={onUpdatePatrolInspection}
          onDeleteInspection={onDeletePatrolInspection}
        />
      )}

      {/* Training Academy & Pass-Out School Sub-tab */}
      {activeSubTab === "training" && (
        <TrainingSchoolView
          cohorts={trainingCohorts}
          trainees={recruitTrainees}
          activeRole={activeRole}
          onAddCohort={onAddCohort}
          onUpdateCohort={onUpdateCohort}
          onDeleteCohort={onDeleteCohort}
          onAddTrainee={onAddTrainee}
          onUpdateTrainee={onUpdateTrainee}
          onDeleteTrainee={onDeleteTrainee}
          onGraduateTrainee={onGraduateTrainee}
          existingForceNumbers={existingForceNumbers}
        />
      )}

      {/* Client Contracts & SLA Validation Sub-tab */}
      {activeSubTab === "contracts" && (
        <ClientContractsView
          contracts={contracts ?? []}
          activeRole={activeRole}
          title="Client Contracts — SLA Validation"
          onUpdateContract={onUpdateContract}
          onAdvanceApproval={onAdvanceApproval}
          onVoidContract={onVoidContract}
        />
      )}

      <ScheduleShiftModal show={showAddModal} guards={guards} sites={sites} onClose={() => setShowAddModal(false)} onSubmit={onAddRosterEntry} />
    </div>
  );
};
