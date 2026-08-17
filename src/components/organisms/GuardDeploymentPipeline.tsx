import React, { useState } from "react";
import { ArrowRight, GraduationCap, Home, UserCheck, UserPlus, ShieldCheck, Truck, AlertTriangle, X } from "lucide-react";
import type { Guard, GuardLifecycleStage, UserRole } from "../../types";
import { HR_STAFF_ROLES, OPS_MANAGEMENT_ROLES, TRAINING_OFFICER_ROLES, DEPLOYMENT_OPERATIONS_ROLES, DESERTION_REPORTING_ROLES, isRoleIn } from "../../services/rbacService";

const HR_HANDOFF_ROLES: UserRole[] = HR_STAFF_ROLES;
const OPS_ROLES: UserRole[] = OPS_MANAGEMENT_ROLES;
const TRAINING_ROLES: UserRole[] = TRAINING_OFFICER_ROLES;
const DESERTION_ROLES: UserRole[] = DESERTION_REPORTING_ROLES;

type OwnerKey = "HR" | "Operations" | "Training";

const OWNER_LABELS: Record<OwnerKey, { name: string; roles: string; color: string; chip: string }> = {
  HR: {
    name: "HR Directorate",
    roles: "HR Manager / HR Assistant / Records Officer",
    color: "bg-emerald-600",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  Operations: {
    name: "Operations",
    roles: "Operations Manager / Regional Manager",
    color: "bg-blue-600",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Training: {
    name: "Training School",
    roles: "Training Officer",
    color: "bg-amber-600",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

const INTAKE_STEP = {
  kind: "intake" as const,
  step: 1,
  label: "Recruit Intake",
  desc: "OM identifies the headcount need, interviews & selects recruit candidates. No Guard record yet — HR enrollment creates one.",
  icon: <UserPlus className="w-4 h-4" />,
  owner: "Operations" as OwnerKey,
};

const STAGES: {
  kind: "stage";
  stage: GuardLifecycleStage;
  step: number;
  label: string;
  desc: string;
  icon: React.ReactNode;
  owner: OwnerKey;
  next: GuardLifecycleStage | null;
  nextOwner: OwnerKey | null;
  action: string;
}[] = [
  {
    kind: "stage",
    stage: "ENROLLED",
    step: 2,
    label: "Enrolled",
    desc: "Guard record created by HR — biodata, NIN, bank & ID fields captured.",
    icon: <UserCheck className="w-4 h-4" />,
    owner: "HR",
    next: "HANDED_TO_OPERATIONS",
    nextOwner: "Operations",
    action: "Hand Over to Ops",
  },
  {
    kind: "stage",
    stage: "HANDED_TO_OPERATIONS",
    step: 3,
    label: "With Operations",
    desc: "HR handed the guard to Operations for training pipeline.",
    icon: <Home className="w-4 h-4" />,
    owner: "Operations",
    next: "IN_TRAINING",
    nextOwner: "Training",
    action: "Send to Training",
  },
  {
    kind: "stage",
    stage: "IN_TRAINING",
    step: 4,
    label: "At Training School",
    desc: "Recruit undergoing Academy training & pass-out assessments.",
    icon: <GraduationCap className="w-4 h-4" />,
    owner: "Training",
    next: "PASSED_OUT",
    nextOwner: "Operations",
    action: "Mark Passed Out",
  },
  {
    kind: "stage",
    stage: "PASSED_OUT",
    step: 5,
    label: "Passed Out",
    desc: "Returned to Operations — ready for deployment to region / site.",
    icon: <ShieldCheck className="w-4 h-4" />,
    owner: "Operations",
    next: "DEPLOYED",
    nextOwner: "Operations",
    action: "Deploy to Region / Site",
  },
  {
    kind: "stage",
    stage: "DEPLOYED",
    step: 6,
    label: "Deployed",
    desc: "Assigned to a region / client site and rostered for duty.",
    icon: <Truck className="w-4 h-4" />,
    owner: "Operations",
    next: null,
    nextOwner: null,
    action: "",
  },
];

interface GuardDeploymentPipelineProps {
  guards: Guard[];
  activeRole: UserRole;
  /** Legacy prop: transition via generic guard update (HR-restricted route). */
  onTransition?: (guardId: string, nextStage: GuardLifecycleStage) => void;
  /** Recommended: lifecycle-aware transition (PUT /api/guards/:id/lifecycle). */
  onMoveLifecycle?: (guardId: string, updates: Partial<Guard>) => void;
  onViewBiodata?: (guard: Guard) => void;
}

interface DesertionDraft {
  guard: Guard;
  reason: string;
  date: string;
}

export const GuardDeploymentPipeline: React.FC<GuardDeploymentPipelineProps> = ({
  guards,
  activeRole,
  onTransition,
  onMoveLifecycle,
  onViewBiodata,
}) => {
  const [desertionDraft, setDesertionDraft] = useState<DesertionDraft | null>(null);

  const stageOf = (g: Guard): GuardLifecycleStage => g.lifecycleStage ?? "DEPLOYED";

  const canTransitionFrom = (stage: GuardLifecycleStage): GuardLifecycleStage | null => {
    if (stage === "ENROLLED" && HR_HANDOFF_ROLES.includes(activeRole)) return "HANDED_TO_OPERATIONS";
    if (stage === "HANDED_TO_OPERATIONS" && OPS_ROLES.includes(activeRole)) return "IN_TRAINING";
    if (stage === "IN_TRAINING" && TRAINING_ROLES.includes(activeRole)) return "PASSED_OUT";
    if (stage === "PASSED_OUT" && OPS_ROLES.includes(activeRole)) return "DEPLOYED";
    return null;
  };

  const move = (guardId: string, updates: Partial<Guard>) => {
    if (onMoveLifecycle) {
      onMoveLifecycle(guardId, updates);
    } else if (onTransition && updates.lifecycleStage) {
      onTransition(guardId, updates.lifecycleStage);
    }
  };

  const recordDesertion = () => {
    if (!desertionDraft) return;
    move(desertionDraft.guard.id, {
      terminationCategory: "Deserted",
      terminationReason: desertionDraft.reason || "Unannounced absence from duty",
      terminationDate: desertionDraft.date,
      status: "Deserted",
      isDeserter: true,
      desertionDate: desertionDraft.date,
      desertionNotes: desertionDraft.reason,
    });
    setDesertionDraft(null);
  };

  const deserters = guards.filter((g) => g.status === "Deserted" || g.isDeserter);
  const canRecordDesertion = DESERTION_ROLES.includes(activeRole);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-slate-700" />
            Guard deployment
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Recruit <span className="text-slate-400">→</span> HR enrolls <span className="text-slate-400">→</span> Operations <span className="text-slate-400">→</span> Training <span className="text-slate-400">→</span> Passed out <span className="text-slate-400">→</span> Deployed
          </p>
        </div>
        {(() => {
          const ownerKey = isRoleIn(activeRole, HR_STAFF_ROLES) ? "HR" : isRoleIn(activeRole, TRAINING_OFFICER_ROLES) ? "Training" : "Operations";
          const owner = OWNER_LABELS[ownerKey];
          return (
            <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${owner.chip}`}>{owner.name}: you</span>
          );
        })()}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 overflow-x-auto pb-1">
        <span className={`px-2 py-1 rounded-full border font-semibold ${isRoleIn(activeRole, HR_STAFF_ROLES) ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>HR</span>
        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
        <span className={`px-2 py-1 rounded-full border font-semibold ${isRoleIn(activeRole, DEPLOYMENT_OPERATIONS_ROLES) ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>Operations</span>
        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
        <span className={`px-2 py-1 rounded-full border font-semibold ${isRoleIn(activeRole, TRAINING_OFFICER_ROLES) ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200"}`}>Training</span>
        <span className="ml-2 text-[10px] text-slate-400 hidden sm:inline">Ownership</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1">
        {[INTAKE_STEP, ...STAGES].map((node, idx) => {
          const isIntake = node.kind === "intake";
          const stageGuards = isIntake ? [] : guards.filter((g) => stageOf(g) === node.stage);
          const next = isIntake ? null : canTransitionFrom(node.stage);
          return (
            <div key={isIntake ? "intake" : node.stage} className="relative min-w-[180px] max-w-[200px] flex-1 snap-start rounded-lg border border-slate-200 bg-white p-3 space-y-2 flex flex-col">
              {idx < (1 + STAGES.length) - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 z-10 bg-white rounded-full border border-slate-200" />
              )}
              <div className="flex items-center justify-between gap-1">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full ${isIntake ? "bg-slate-100 text-slate-600 border border-slate-200" : node.stage === "DEPLOYED" ? "bg-slate-900 text-white" : node.stage === "IN_TRAINING" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-white text-slate-700 border border-slate-200"}`}>
                  {node.icon}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {node.step}/6
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{node.label}</div>
                <div className="text-[11px] text-slate-500">{isIntake ? "Pre-record" : `${stageGuards.length} in stage`}</div>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{isIntake ? "Recruitment precedes HR enrollment." : node.desc}</p>

              <div className="flex-1 space-y-1.5">
                {isIntake ? (
                  <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200 p-2">Recruitment — no record yet</div>
                ) : (
                  <>
                {stageGuards.length === 0 && (
                  <div className="text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg p-2">Empty</div>
                )}
                {stageGuards.slice(0, 3).map((g) => {
                  const isDeserter = g.status === "Deserted" || g.isDeserter;
                  return (
                    <div key={g.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg border border-slate-100 px-2 py-1.5">
                      <div className="min-w-0">
                        <div className={`text-[11px] font-semibold truncate cursor-pointer hover:underline ${isDeserter ? "text-red-700" : "text-slate-800"}`} onClick={() => onViewBiodata?.(g)}>{g.fullName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{g.forceNumber}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {next && (
                          <button
                            onClick={() => move(g.id, { lifecycleStage: next })}
                            title={`${node.action} — next owner: ${node.nextOwner ? OWNER_LABELS[node.nextOwner].name : "—"}`}
                            className="px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 cursor-pointer"
                          >
                            {node.action}
                          </button>
                        )}
                        {canRecordDesertion && !isDeserter && (
                          <button
                            onClick={() => setDesertionDraft({ guard: g, reason: "", date: new Date().toISOString().split("T")[0] })}
                            title="Record desertion (HR confirms final termination)"
                            className="px-2 py-1 rounded-md bg-white text-red-600 border border-red-200 text-[10px] font-semibold hover:bg-red-50 cursor-pointer"
                          >
                            Desertion
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {stageGuards.length > 3 && (
                  <div className="text-[10px] text-slate-500 font-medium px-1">+{stageGuards.length - 3} more</div>
                )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${deserters.length > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${deserters.length > 0 ? "text-red-600" : "text-slate-400"}`} />
          <span className="text-xs font-bold text-slate-800">Deserters registry</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${deserters.length > 0 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-500"}`}>{deserters.length}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {deserters.length === 0 && <span className="text-[10px] text-slate-500 italic">No deserters recorded.</span>}
          {deserters.slice(0, 6).map((g) => (
            <button key={g.id} onClick={() => onViewBiodata?.(g)} className="px-2 py-0.5 rounded-full bg-red-100 border border-red-200 text-[10px] font-bold text-red-800 hover:bg-red-200 transition-colors cursor-pointer" title={g.desertionDate ? `Deserted on ${g.desertionDate}` : "Deserted"}>
              {g.fullName}
            </button>
          ))}
          {deserters.length > 6 && <span className="text-[10px] text-slate-500">+{deserters.length - 6} more</span>}
        </div>
      </div>

      {/* Record Desertion modal */}
      {desertionDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 relative">
              <button
                onClick={() => setDesertionDraft(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="sticky top-0 bg-white z-10 pb-2 flex items-center gap-2 border-b border-slate-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-slate-900">Record Desertion</h3>
              </div>
              <p className="text-xs text-slate-500">
                Recording <strong>{desertionDraft.guard.fullName}</strong> ({desertionDraft.guard.forceNumber}) as deserted.
                Operations reports the desertion; the HR Manager retains final termination authority.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Desertion Date</label>
                  <input
                    type="date"
                    value={desertionDraft.date}
                    onChange={(e) => setDesertionDraft({ ...desertionDraft, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Reason / Notes</label>
                  <textarea
                    value={desertionDraft.reason}
                    onChange={(e) => setDesertionDraft({ ...desertionDraft, reason: e.target.value })}
                    rows={3}
                    placeholder="e.g. Unannounced absence from duty since..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDesertionDraft(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={recordDesertion}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm Desertion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
