import React from "react";
import { Calendar } from "lucide-react";
import type { Guard, LeaveRequest } from "../../types";

interface GuardLeaveModalProps {
  guards: Guard[];
  show: boolean;
  onClose: () => void;
  leaveGuardId: string;
  setLeaveGuardId: (v: string) => void;
  leaveType: LeaveRequest["leaveType"];
  setLeaveType: (v: LeaveRequest["leaveType"]) => void;
  leaveStartDate: string;
  setLeaveStartDate: (v: string) => void;
  leaveEndDate: string;
  setLeaveEndDate: (v: string) => void;
  leaveDurationDays: number;
  setLeaveDurationDays: (v: number) => void;
  leaveReason: string;
  setLeaveReason: (v: string) => void;
  leaveReliefGuardName: string;
  setLeaveReliefGuardName: (v: string) => void;
  leaveContactAddress: string;
  setLeaveContactAddress: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const GuardLeaveModal: React.FC<GuardLeaveModalProps> = ({
  guards, show, onClose,
  leaveGuardId, setLeaveGuardId,
  leaveType, setLeaveType,
  leaveStartDate, setLeaveStartDate,
  leaveEndDate, setLeaveEndDate,
  leaveDurationDays, setLeaveDurationDays,
  leaveReason, setLeaveReason,
  leaveReliefGuardName, setLeaveReliefGuardName,
  leaveContactAddress, setLeaveContactAddress,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Log Staff Leave Application
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Officer / Staff</label>
            <select value={leaveGuardId} onChange={(e) => setLeaveGuardId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
              <option value="">-- Select Guard --</option>
              {guards.map((g) => (
                <option key={g.id} value={g.id}>{g.fullName} ({g.forceNumber}) - {g.assignedSite}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Leave Category</label>
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="Annual Leave">Annual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Maternity/Paternity">Maternity / Paternity</option>
                <option value="Compassionate Leave">Compassionate Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Compensatory Leave">Compensatory Leave</option>
                <option value="Study Leave">Study Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Duration (Days)</label>
              <input type="number" value={leaveDurationDays} onChange={(e) => setLeaveDurationDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input type="date" required value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">End Date</label>
              <input type="date" required value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Relief Guard Name (Station Cover)</label>
            <input type="text" placeholder="e.g. Peter Ssemwogerere" value={leaveReliefGuardName}
              onChange={(e) => setLeaveReliefGuardName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800" />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Contact Address (during leave)</label>
            <input type="text" placeholder="e.g. Bukoto Village, Nakawa, Kampala" value={leaveContactAddress}
              onChange={(e) => setLeaveContactAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800" />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Reason / HR Notes</label>
            <textarea rows={2} required placeholder="State reason for leave..."
              value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer">Submit Leave Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};
