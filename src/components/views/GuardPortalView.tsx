import React, { useState } from "react";
import {
  Clock, AlertTriangle, CheckCircle2,
  Calendar, ShieldAlert, Send, UserCheck, CalendarRange, XCircle, ClipboardList,
} from "lucide-react";
import type { User, Incident, LeaveRequest, Guard, DutyRoster } from "../../types";

interface GuardPortalViewProps {
  currentUser: User;
  onLogIncident: (newInc: Omit<Incident, "id">) => void;
  onAddLeaveRequest: (r: Omit<LeaveRequest, "id">) => void;
  onUpdateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => void;
  onDeleteLeaveRequest: (id: string) => void;
  leaveRequests: LeaveRequest[];
  guards: Guard[];
  dutyRoster: DutyRoster[];
}

export const GuardPortalView: React.FC<GuardPortalViewProps> = ({
  currentUser, onLogIncident, onAddLeaveRequest, onDeleteLeaveRequest, leaveRequests, guards, dutyRoster,
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
    reliefGuardName: "", reliefGuardCode: "", contactAddress: "",
  });

  const myGuard = guards.find((g) => g.linkedUserId === currentUser.id || g.fullName === currentUser.name);
  const guardCode = myGuard?.guardCode || "GUARD-001";
  const guardName = myGuard?.fullName || currentUser.name;

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
      reportedByGuard: currentUser.name,
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
      guardId: myGuard?.id || "",
      guardName: guardName,
      guardCode: guardCode,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      durationDays: days,
      reason: leaveForm.reason,
      reliefGuardName: leaveForm.reliefGuardName,
      reliefGuardCode: leaveForm.reliefGuardCode,
      contactAddress: leaveForm.contactAddress || undefined,
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending Regional Approval",
    });
    setLeaveForm({ leaveType: "Annual Leave", startDate: "", endDate: "", durationDays: 1, reason: "", reliefGuardName: "", reliefGuardCode: "", contactAddress: "" });
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
              <span className="text-xs text-slate-400">Code: {guardCode}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{currentUser.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Guard • Assigned Post: Bank of East Africa Headquarters
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Current Post</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">{myGuard?.assignedSite || "—"}</div>
          <div className="text-[11px] text-slate-500">{myGuard?.region || "Central (Kampala HQ)"} · {guardCode}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Lifecycle</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">{myGuard?.lifecycleStage || "DEPLOYED"}</div>
          <div className="text-[11px] text-slate-500">ID: {myGuard?.idCardStatus || "Pending Records Issuance"}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Disciplinary Record</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className={`font-extrabold text-sm ${myGuard?.status === "Suspended" || myGuard?.terminationCategory ? "text-rose-700" : "text-emerald-700"}`}>
            {myGuard?.terminationCategory || myGuard?.status || "Good Standing"}
          </div>
          <div className="text-[11px] text-slate-500">{myGuard?.warningLettersCount || 0} Warning Letters</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Duty Roster</span>
            <ClipboardList className="w-4 h-4 text-slate-600" />
          </div>
          <div className="font-extrabold text-sm text-slate-900">Day Shift</div>
          <div className="text-[11px] text-slate-500">
            {dutyRoster.find((r) => r.guardName === guardName || r.guardId === myGuard?.id)?.siteName || myGuard?.assignedSite || "—"}
          </div>
        </div>
      </div>

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
                  <label className="font-bold text-slate-700 block mb-1">Relief Guard Name</label>
                  <input value={leaveForm.reliefGuardName} onChange={(e) => setLeaveForm({ ...leaveForm, reliefGuardName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relief Guard Force Number</label>
                  <input value={leaveForm.reliefGuardCode} onChange={(e) => setLeaveForm({ ...leaveForm, reliefGuardCode: e.target.value })}
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
        {leaveRequests.filter((lr) => lr.guardId === myGuard?.id || lr.guardName === currentUser.name).length === 0 ? (
          <p className="text-xs text-slate-400 font-semibold py-4 text-center">No leave requests found.</p>
        ) : (
          <div className="space-y-2">
            {leaveRequests
              .filter((lr) => lr.guardId === myGuard?.id || lr.guardName === currentUser.name)
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
