import React, { useEffect, useState } from "react";
import {
  Clock, AlertTriangle, CheckCircle2,
  Calendar, ShieldAlert, Send, UserCheck, CalendarRange, XCircle, ClipboardList, FileText, Download, Briefcase, MapPin, User as UserIcon, Shield, Award,
} from "lucide-react";
import type { User, Incident, LeaveRequest, SecurityOfficer, DutyRoster, SecurityOfficerEmploymentContract } from "../../types";
import { domainApi } from "../../services/domainApi";
import { EmploymentContractModal } from "../organisms/EmploymentContractModal";

interface SecurityOfficerPortalViewProps {
  currentUser: User;
  onLogIncident: (newInc: Omit<Incident, "id">) => void;
  onAddLeaveRequest: (r: Omit<LeaveRequest, "id">) => void;
  onUpdateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  onDeleteLeaveRequest: (id: string) => void;
  leaveRequests: LeaveRequest[];
  securityOfficers: SecurityOfficer[];
  dutyRoster: DutyRoster[];
}

export const SecurityOfficerPortalView: React.FC<SecurityOfficerPortalViewProps> = ({
  currentUser, onLogIncident, onAddLeaveRequest, onDeleteLeaveRequest, leaveRequests, securityOfficers, dutyRoster,
}) => {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Incident["severity"]>("Medium");
  const [description, setDescription] = useState("");
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Annual Leave" as LeaveRequest["leaveType"], startDate: "", endDate: "", durationDays: 1, reason: "",
    reliefSecurityOfficerName: "", reliefForceNumber: "", contactAddress: "",
  });

  const mySecurityOfficer = securityOfficers.find((g) => g.linkedUserId === currentUser.id || g.fullName === currentUser.name);
  const forceNumber = mySecurityOfficer?.forceNumber || "SECURITY OFFICER-001";
  const [showContract, setShowContract] = useState(false);
  const [contract, setContract] = useState<SecurityOfficerEmploymentContract | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "employment">("dashboard");

  useEffect(() => {
    let cancelled = false;
    domainApi.securityOfficers.employmentContract.get(mySecurityOfficer?.forceNumber || "-")
      .then((c) => { if (!cancelled) setContract(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [mySecurityOfficer]);
  const securityOfficerName = mySecurityOfficer?.fullName || currentUser.name;

  const handleCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(new Date().toLocaleTimeString());
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onLogIncident({
      incidentCode: `INC-${Date.now().toString().slice(-4)}`,
      title,
      siteName: "Bank of East Africa Headquarters",
      reportedBySecurityOfficer: currentUser.name,
      incidentDate: new Date().toISOString().split("T")[0],
      severity,
      category: "Security Breach",
      description,
      status: "Open",
      evidenceAttached: false,
    });
    setTitle("");
    setDescription("");
    setShowIncidentModal(false);
  };

  const handleLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    onAddLeaveRequest({
      forceNumber: mySecurityOfficer?.id || "",
      securityOfficerName: securityOfficerName,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      durationDays: days,
      reason: leaveForm.reason,
      reliefSecurityOfficerName: leaveForm.reliefSecurityOfficerName,
      reliefForceNumber: leaveForm.reliefForceNumber,
      contactAddress: leaveForm.contactAddress || undefined,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending HR Approval",
    });
    setLeaveForm({ leaveType: "Annual Leave", startDate: "", endDate: "", durationDays: 1, reason: "", reliefSecurityOfficerName: "", reliefForceNumber: "", contactAddress: "" });
    setShowLeaveModal(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/30 shrink-0">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Active Duty
              </span>
              <span className="text-xs text-slate-400">Code: {forceNumber}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{currentUser.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Security Officer • Assigned Post: Bank of East Africa Headquarters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!checkedIn ? (
            <button onClick={handleCheckIn}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/30 cursor-pointer transition-all">
              <Clock className="w-4 h-4" />
              <span>Shift Check-In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Checked In at {checkInTime}</span>
            </div>
          )}

          <button onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30 cursor-pointer transition-all">
            <CalendarRange className="w-4 h-4" />
            <span>Request Leave</span>
          </button>

          <button onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/30 cursor-pointer transition-all">
            <AlertTriangle className="w-4 h-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Shield className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("employment")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "employment"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          My Employment
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Current Post</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">{mySecurityOfficer?.assignedSite || "—"}</div>
          <div className="text-[11px] text-slate-500">{mySecurityOfficer?.region || "Central (Kampala HQ)"} · {forceNumber}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Lifecycle</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">{mySecurityOfficer?.lifecycleStage || "DEPLOYED"}</div>
          <div className="text-[11px] text-slate-500">ID: {mySecurityOfficer?.idCardStatus || "Pending Records Issuance"}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Disciplinary Record</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`font-extrabold text-sm ${mySecurityOfficer?.status === "Suspended" || mySecurityOfficer?.terminationCategory ? "text-rose-700" : "text-emerald-700"}`}>
            {mySecurityOfficer?.terminationCategory || mySecurityOfficer?.status || "Good Standing"}
          </div>
          <div className="text-[11px] text-slate-500">{mySecurityOfficer?.warningLettersCount || 0} Warning Letters</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Duty Roster</span>
            <ClipboardList className="w-4 h-4 text-slate-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">Day Shift</div>
          <div className="text-[11px] text-slate-500">
            {dutyRoster.find((r) => r.securityOfficerName === securityOfficerName || r.forceNumber === mySecurityOfficer?.id)?.siteName || mySecurityOfficer?.assignedSite || "—"}
          </div>
        </div>

        <button onClick={() => setShowContract(true)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-left cursor-pointer hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Employment Contract</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">{contract ? contract.contractCode : "Not issued"}</div>
          <div className="text-[11px] text-slate-500">{contract ? (contract.status === "Fully Signed" ? "Fully signed — view PDF" : contract.status) : "Contact HR"}</div>
        </button>
      </div>
      )}

      {activeTab === "employment" && (
        <div className="space-y-5">
          {/* Employment Header Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-slate-700 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Award className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Employment Details</h2>
                  <p className="text-sm text-slate-300 mt-1">{mySecurityOfficer?.fullName || currentUser.name} • {forceNumber}</p>
                </div>
              </div>
              {contract?.pdfPath && (
                <a
                  href={`/uploads/${encodeURIComponent(contract.pdfPath)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download Contract PDF
                </a>
              )}
            </div>
          </div>

          {/* Contract Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Contract Status
            </h3>
            {contract ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contract No.</p>
                    <p className="font-mono font-bold text-slate-900 text-sm">{contract.contractCode}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Salary</p>
                    <p className="font-bold text-emerald-700 text-sm">UGX {(contract.monthlySalaryUgx || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</p>
                    <p className="font-bold text-slate-900 text-sm">{contract.startDate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation</p>
                    <p className="font-bold text-slate-900 text-sm">{contract.probationMonths} month(s)</p>
                  </div>
                </div>

                {/* Status Trail */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["Draft", "Pending Officer Signature", "Pending HR Signature", "Fully Signed"] as const).map((step, i) => {
                    const stepIdx = contract.status === "Fully Signed" ? 3 :
                      contract.status === "Pending HR Signature" ? 2 :
                      contract.status === "Pending Officer Signature" ? 1 : 0;
                    const isComplete = i <= stepIdx;
                    return (
                      <React.Fragment key={step}>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                          isComplete
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}>
                          {isComplete && <CheckCircle2 className="w-3 h-3" />}
                          {step}
                        </div>
                        {i < 3 && <span className="text-slate-300 text-[10px]">→</span>}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Signature Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`rounded-xl border p-3 ${contract.officerSignatureUrl ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Employee Signature</p>
                    {contract.officerSignatureUrl ? (
                      <p className="text-xs font-bold text-emerald-700">
                        Signed{contract.officerSignedAt ? ` on ${new Date(contract.officerSignedAt).toLocaleDateString()}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold">Awaiting signature</p>
                    )}
                  </div>
                  <div className={`rounded-xl border p-3 ${contract.hrSignatureUrl ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Employer Signature</p>
                    {contract.hrSignatureUrl ? (
                      <p className="text-xs font-bold text-emerald-700">
                        Signed by {contract.hrSignerName}{contract.hrSignedAt ? ` on ${new Date(contract.hrSignedAt).toLocaleDateString()}` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold">Awaiting employer signature</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">No employment contract has been issued yet.</p>
                <p className="text-xs text-slate-400">Contact HR to request a contract.</p>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Job Description
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Designation</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.designation || "Security Officer"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Site</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.assignedSite || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.status || "Active"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Region</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.region || "Central (Kampala HQ)"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Join Date</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.joinDate || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lifecycle Stage</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.lifecycleStage || "DEPLOYED"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation Status</p>
                    <p className="font-bold text-sm text-slate-900">{mySecurityOfficer?.finishedProbation ? "Completed" : "In Progress"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-emerald-600">UGX</span>
              Salary Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Monthly Salary</p>
                <p className="text-lg font-black text-emerald-800 mt-1">
                  UGX {(mySecurityOfficer?.monthlySalaryUgx || contract?.monthlySalaryUgx || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Force Number</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{forceNumber}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation Status</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{mySecurityOfficer?.finishedProbation ? "Completed" : "In Progress"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContract && (
        <EmploymentContractModal show={showContract} securityOfficer={mySecurityOfficer || null} onClose={() => setShowContract(false)} />
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Request Leave</h3>
            <p className="text-[10px] text-slate-400 font-semibold">Your request will go to your Regional Manager, then Operations, then HR, then the General Manager.</p>
            <form onSubmit={handleLeaveRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Leave Type</label>
                <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveRequest["leaveType"] })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Compassionate Leave">Compassionate Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                  <option value="Paternity Leave">Paternity Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                  <option value="Compensatory Leave">Compensatory Leave</option>
                  <option value="Study Leave">Study Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input type="date" required value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input type="date" required value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason</label>
                <textarea required rows={2} value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relief Security Officer Name</label>
                  <input value={leaveForm.reliefSecurityOfficerName} onChange={(e) => setLeaveForm({ ...leaveForm, reliefSecurityOfficerName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relief Security Officer Force Number</label>
                  <input value={leaveForm.reliefForceNumber} onChange={(e) => setLeaveForm({ ...leaveForm, reliefForceNumber: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Address (during leave)</label>
                <input value={leaveForm.contactAddress} onChange={(e) => setLeaveForm({ ...leaveForm, contactAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Regional Manager</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Leave Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-blue-600" />
          My Leave Requests
        </h2>
        {leaveRequests.filter((lr) => lr.forceNumber === mySecurityOfficer?.id || lr.securityOfficerName === currentUser.name).length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-4 text-center">No leave requests found.</p>
        ) : (
          <div className="space-y-2">
            {leaveRequests
              .filter((lr) => lr.forceNumber === mySecurityOfficer?.id || lr.securityOfficerName === currentUser.name)
              .map((lr) => (
                <div key={lr.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">{lr.leaveType} — {lr.startDate} to {lr.endDate} ({lr.durationDays} days)</p>
                    <p className="text-slate-500">{lr.reason}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                      lr.status === "Approved" ? "bg-emerald-100 text-emerald-700" :
                      lr.status.includes("Pending") ? "bg-amber-100 text-amber-700" :
                      lr.status === "Rejected" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{lr.status}</span>
                  </div>
                  {lr.status.includes("Pending") && (
                    <button
                      onClick={() => { if (window.confirm("Cancel this leave request?")) onDeleteLeaveRequest(lr.id); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer transition-all"
                      title="Cancel Request"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {showIncidentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Log Field Incident Report</h3>
            <form onSubmit={handleReportIncident} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Incident Title</label>
                <input type="text" required placeholder="e.g. Unauthorized Vehicle Attempt at Gate B"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as Incident["severity"])}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                  <option value="Low">Low - Minor Observation</option>
                  <option value="Medium">Medium - Suspicious Behavior</option>
                  <option value="High">High - Perimeter Breach</option>
                  <option value="Critical">Critical - Armed Conflict / Emergency</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea rows={3} required placeholder="Describe what occurred..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Incident Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
