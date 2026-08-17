/**
 * Site Surveys panel (Workflow: Marketing requests → Ops/RM region-scoped survey → report).
 * - Any authenticated role can request a survey.
 * - Operations Manager / Regional Manager start (assign surveyedBy) and complete with the
 *   interactive survey fields; Regional Managers are scoped to their region.
 * - Completed surveys can be printed to PDF (browser print) as the report for contract drafting.
 */

import React, { useMemo, useState } from "react";
import { MapPin, Plus, Search, FileText, CheckCircle2, XCircle, ClipboardList, Printer } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole } from "../../services/rbacService";
import type { SiteSurvey, UserRole } from "../../types";

const OPS_MANAGER: UserRole = "Operations Manager";
const REGIONAL_MANAGER: UserRole = "Regional Manager";
const BDM: UserRole = "Business Development Manager";
const SMS: UserRole = "Sales and Marketing Supervisor";

const SURVEY_STATUS_STYLE: Record<string, string> = {
  Requested: "bg-amber-100 text-amber-700 border-amber-200",
  "In Progress": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

export const SiteSurveysPanel: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const activeRole = getEffectiveRole(currentUser) ?? null;

  const canAct =
    activeRole === OPS_MANAGER ||
    (activeRole === REGIONAL_MANAGER && !!currentUser?.region);

  const myId = currentUser?.id ?? "";
  const myName = currentUser?.name ?? "";

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const mine = useMemo(
    () => domain.siteSurveys.filter((s) => s.requestedBy === myId || s.requestedByName === myName),
    [domain.siteSurveys, myId, myName]
  );

  const visible = canAct ? domain.siteSurveys : mine;

  const canSeeRegion = (s: SiteSurvey) => {
    if (activeRole === OPS_MANAGER) return true;
    if (activeRole === REGIONAL_MANAGER) return !s.region || s.region === currentUser?.region;
    return s.requestedBy === myId || s.requestedByName === myName;
  };

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Site Surveys</h2>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200">
            {domain.siteSurveys.length}
          </span>
        </div>
        {(activeRole === BDM || activeRole === SMS) && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Request Survey
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
        {visible.filter(canSeeRegion).map((s) => {
          const isCompleting = completingId === s.id;
          return (
            <div key={s.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-700 truncate">
                    {s.surveyCode} — {s.clientName} / {s.siteName}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {s.requestedByName} • {s.requestedDepartment}
                    {s.region ? ` • ${s.region}` : ""}
                    {s.surveyedBy ? ` • Surveyor: ${s.surveyedBy}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${SURVEY_STATUS_STYLE[s.status] ?? ""}`}
                >
                  {s.status}
                </span>
              </div>

              {s.status === "Completed" && (
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-100">
                    <p className="text-sm font-black text-slate-800">{s.dayGuardsNeeded ?? 0}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Day Guards</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100">
                    <p className="text-sm font-black text-slate-800">{s.nightGuardsNeeded ?? 0}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Night Guards</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100">
                    <p className="text-sm font-black text-slate-800">{s.riskLevel ?? "—"}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Risk</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-100">
                    <p className="text-sm font-black text-slate-800">{s.entryPoints ?? "—"}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Entry Pts</p>
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {canAct && s.status === "Requested" && canSeeRegion(s) && (
                  <button
                    onClick={() => domain.startSiteSurvey(s.id, myName)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Start Survey
                  </button>
                )}
                {canAct && s.status === "In Progress" && canSeeRegion(s) && (
                  <button
                    onClick={() => setCompletingId(s.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Complete Survey
                  </button>
                )}
                {s.status === "Completed" && (
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> Print Report
                  </button>
                )}
                {(canAct || s.requestedBy === myId || s.requestedByName === myName) &&
                  (s.status === "Requested" || s.status === "In Progress") && (
                    <button
                      onClick={() => domain.cancelSiteSurvey(s.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      <XCircle className="w-3 h-3 inline mr-1" /> Cancel
                    </button>
                  )}
              </div>

              {isCompleting && (
                <SurveyCompleteForm
                  survey={s}
                  onClose={() => setCompletingId(null)}
                  onSubmit={(data) => {
                    domain.completeSiteSurvey(s.id, data);
                    setCompletingId(null);
                  }}
                />
              )}
            </div>
          );
        })}

        {visible.filter(canSeeRegion).length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-8">
            No site surveys. Request one to begin contract enablement.
          </p>
        )}
      </div>

      {showRequestModal && (
        <RequestSurveyModal
          requesterName={myName}
          requesterId={myId}
          requesterDept={currentUser?.department ?? ""}
          requesterRegion={currentUser?.region}
          onClose={() => setShowRequestModal(false)}
          onSubmit={(data) => {
            domain.addSiteSurvey(data);
            setShowRequestModal(false);
          }}
        />
      )}
    </section>
  );
};

/* ---------------- Request Modal ---------------- */

interface RequestSurveyModalProps {
  requesterName: string;
  requesterId: string;
  requesterDept: string;
  requesterRegion?: string;
  onClose: () => void;
  onSubmit: (data: Omit<SiteSurvey, "id" | "surveyCode" | "status">) => void;
}

const RequestSurveyModal: React.FC<RequestSurveyModalProps> = ({
  requesterName,
  requesterId,
  requesterDept,
  requesterRegion,
  onClose,
  onSubmit,
}) => {
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [region, setRegion] = useState(requesterRegion ?? "");
  const [requestedDepartment, setRequestedDepartment] = useState(requesterDept || "Operations");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      clientName,
      siteName,
      region: region || undefined,
      requestedBy: requesterId,
      requestedByName: requesterName,
      requestedDepartment,
    });
  };

  return (
    <Overlay title="Request Site Survey" icon={<Search className="w-4 h-4" />} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Client *</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Site *</label>
            <input
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Site / premises"
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Region</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Western (Mbarara Station)"
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Department *</label>
            <input
              required
              value={requestedDepartment}
              onChange={(e) => setRequestedDepartment(e.target.value)}
              className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">
            Request Survey
          </button>
        </div>
      </form>
    </Overlay>
  );
};

/* ---------------- Complete (fill) Form ---------------- */

interface SurveyCompleteFormProps {
  survey: SiteSurvey;
  onClose: () => void;
  onSubmit: (data: Partial<SiteSurvey>) => void;
}

const SurveyCompleteForm: React.FC<SurveyCompleteFormProps> = ({ survey, onClose, onSubmit }) => {
  const [premisesType, setPremisesType] = useState(survey.premisesType ?? "");
  const [perimeterStatus, setPerimeterStatus] = useState(survey.perimeterStatus ?? "");
  const [entryPoints, setEntryPoints] = useState(survey.entryPoints ?? 1);
  const [riskLevel, setRiskLevel] = useState(survey.riskLevel ?? "");
  const [highValueAssets, setHighValueAssets] = useState(survey.highValueAssets ?? "");
  const [dayGuardsNeeded, setDayGuardsNeeded] = useState(survey.dayGuardsNeeded ?? 0);
  const [nightGuardsNeeded, setNightGuardsNeeded] = useState(survey.nightGuardsNeeded ?? 0);
  const [armedDay, setArmedDay] = useState(survey.armedDay ?? false);
  const [armedNight, setArmedNight] = useState(survey.armedNight ?? false);
  const [equipmentNeeded, setEquipmentNeeded] = useState(survey.equipmentNeeded ?? "");
  const [k9Required, setK9Required] = useState(survey.k9Required ?? false);
  const [patrolVehicleRequired, setPatrolVehicleRequired] = useState(survey.patrolVehicleRequired ?? false);
  const [accessHours, setAccessHours] = useState(survey.accessHours ?? "");
  const [recommendation, setRecommendation] = useState(survey.recommendation ?? "");
  const [notes, setNotes] = useState(survey.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      premisesType,
      perimeterStatus,
      entryPoints,
      riskLevel,
      highValueAssets,
      dayGuardsNeeded,
      nightGuardsNeeded,
      armedDay,
      armedNight,
      equipmentNeeded,
      k9Required,
      patrolVehicleRequired,
      accessHours,
      recommendation,
      notes,
    });
  };

  const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${value ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"}`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> {label}
    </button>
  );

  return (
    <div className="mt-3 p-3 rounded-2xl bg-white border border-indigo-200">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Premises Type</label>
            <input value={premisesType} onChange={(e) => setPremisesType(e.target.value)} placeholder="Warehouse / office / plant…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Perimeter Status</label>
            <input value={perimeterStatus} onChange={(e) => setPerimeterStatus(e.target.value)} placeholder="Fence / wall / open…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Entry Points</label>
            <input type="number" min={0} value={entryPoints} onChange={(e) => setEntryPoints(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Risk Level</label>
            <input value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} placeholder="Low / Med / High" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Access Hours</label>
            <input value={accessHours} onChange={(e) => setAccessHours(e.target.value)} placeholder="24/7 / 08:00–18:00" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Day Guards Needed</label>
            <input type="number" min={0} value={dayGuardsNeeded} onChange={(e) => setDayGuardsNeeded(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Night Guards Needed</label>
            <input type="number" min={0} value={nightGuardsNeeded} onChange={(e) => setNightGuardsNeeded(Number(e.target.value))} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">High-Value Assets on Site</label>
          <input value={highValueAssets} onChange={(e) => setHighValueAssets(e.target.value)} placeholder="Cash, stock, machinery, vehicles…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Equipment Needed</label>
          <input value={equipmentNeeded} onChange={(e) => setEquipmentNeeded(e.target.value)} placeholder="CCTV, lighting, radio, metal detectors…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <Toggle label="Armed (day)" value={armedDay} onChange={setArmedDay} />
          <Toggle label="Armed (night)" value={armedNight} onChange={setArmedNight} />
          <Toggle label="K9 required" value={k9Required} onChange={setK9Required} />
          <Toggle label="Patrol vehicle" value={patrolVehicleRequired} onChange={setPatrolVehicleRequired} />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Recommendation</label>
          <input value={recommendation} onChange={(e) => setRecommendation(e.target.value)} placeholder="Recommended guard package & deployment…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer">
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Complete & Generate Report
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------------- Overlay ---------------- */

const Overlay: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; onClose: () => void }> = ({ title, icon, children, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">{icon ?? <ClipboardList className="w-4 h-4" />}</div>
          <h3 className="text-sm font-black text-slate-800">{title}</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer" aria-label="Close">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
