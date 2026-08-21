import React, { useEffect, useState } from "react";
import { Calendar, UserCheck, UserX } from "lucide-react";
import type { LeaveRequest } from "../../types";
import { Pagination } from "../molecules";

type LeaveFilter = "ALL" | "Pending HR Approval" | "Pending GM Approval" | "Approved" | "Rejected";

const PAGE_SIZE = 9;

interface LeaveRequestPanelProps {
  leaveRequests: LeaveRequest[];
  filter: LeaveFilter;
  onFilterChange: (filter: LeaveFilter) => void;
  onApprove?: (id: string) => void;
  onGmApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const LeaveRequestPanel: React.FC<LeaveRequestPanelProps> = ({
  leaveRequests,
  filter,
  onFilterChange,
  onApprove,
  onGmApprove,
  onReject,
}) => {
  const [page, setPage] = useState(1);
  const filtered = leaveRequests.filter((l) => filter === "ALL" || l.status === filter);

  // Reset to the first page whenever the active filter changes.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const statusCounts: Record<LeaveFilter, number> = {
    ALL: leaveRequests.length,
    "Pending HR Approval": leaveRequests.filter((l) => l.status === "Pending HR Approval").length,
    "Pending GM Approval": leaveRequests.filter((l) => l.status === "Pending GM Approval").length,
    Approved: leaveRequests.filter((l) => l.status === "Approved").length,
    Rejected: leaveRequests.filter((l) => l.status === "Rejected").length,
  };

  const filterColors: Record<LeaveFilter, string> = {
    ALL: "bg-slate-900 text-white",
    "Pending HR Approval": "bg-amber-600 text-white",
    "Pending GM Approval": "bg-indigo-600 text-white",
    Approved: "bg-emerald-700 text-white",
    Rejected: "bg-red-700 text-white",
  };

  const filters: LeaveFilter[] = ["ALL", "Pending HR Approval", "Pending GM Approval", "Approved", "Rejected"];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Staff & Guard Leave Tracking Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record and approve Annual, Sick, Emergency, Compassionate, Unpaid, Paternity, Maternity, Compensatory & Study Leave with relief guard assignment and GM final approval.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f;
            const colors = isActive
              ? filterColors[f]
              : f === "ALL"
                ? "bg-slate-100 text-slate-600"
                : f === "Pending HR Approval"
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : f === "Pending GM Approval"
                    ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                    : f === "Approved"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200";
            return (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${colors}`}
              >
                {f === "ALL" ? "All" : f} ({statusCounts[f]})
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paged.map((leave) => (
          <div
            key={leave.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                    {leave.leaveType}
                  </span>
                  <span
                    className={`px-2 py-0.5 font-extrabold text-[9px] rounded-full uppercase tracking-wider ${
                      leave.category === "staff"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    title={leave.category === "staff" ? "Self-service staff leave" : "Guard duty-cover leave"}
                  >
                    {leave.category === "staff" ? "Staff Self-Service" : "Guard Cover"}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base mt-1">
                  {leave.guardName}
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {leave.forceNumber}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  leave.status === "Approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : leave.status === "Pending GM Approval"
                    ? "bg-indigo-100 text-indigo-700 animate-pulse"
                    : leave.status === "Pending HR Approval"
                    ? "bg-amber-100 text-amber-800 animate-pulse"
                    : leave.status === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {leave.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span className="font-bold text-slate-400">Duration:</span>
                <span className="font-black text-slate-900">
                  {leave.startDate} to {leave.endDate} ({leave.durationDays} Days)
                </span>
              </div>
              {leave.category !== "staff" && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-slate-400">Relief Officer:</span>
                  <span className="font-bold text-blue-700">
                    {leave.reliefGuardName || "Pending Duty Roster Cover"}
                  </span>
                </div>
              )}
              {leave.category === "staff" && leave.requesterRole && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-slate-400">Requested By:</span>
                  <span className="font-bold text-purple-700">{leave.requesterRole}</span>
                </div>
              )}
              <div className="pt-1 text-slate-600 italic">"{leave.reason}"</div>
              {leave.contactAddress && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-slate-400">Contact Address:</span>
                  <span className="font-bold text-slate-800">{leave.contactAddress}</span>
                </div>
              )}
              {(leave.entitlement !== undefined || leave.taken !== undefined || leave.balance !== undefined) && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-slate-400">HR Entitlement / Taken / Balance:</span>
                  <span className="font-bold text-slate-800">
                    {leave.entitlement ?? "—"} / {leave.taken ?? "—"} / {leave.balance ?? "—"} days
                  </span>
                </div>
              )}
              {leave.resumptionDate && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-bold text-slate-400">Resumption Date:</span>
                  <span className="font-bold text-slate-800">{leave.resumptionDate}</span>
                </div>
              )}
            </div>

            {leave.status === "Pending HR Approval" && onApprove && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onApprove(leave.id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>HR Approve</span>
                </button>
                {onReject && (
                  <button
                    onClick={() => onReject(leave.id)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            )}

            {leave.status === "Pending GM Approval" && onGmApprove && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onGmApprove(leave.id)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>GM Final Approve</span>
                </button>
                {onReject && (
                  <button
                    onClick={() => onReject(leave.id)}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            )}

            {leave.approvedBy && (
              <p className="text-[10px] font-semibold text-slate-400 text-right">
                Reviewed by: {leave.approvedBy}{leave.gmApprovedBy ? ` · GM: ${leave.gmApprovedBy}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl px-6 py-3 border border-slate-200 shadow-sm">
          <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} itemName="leave requests" />
        </div>
      )}
    </div>
  );
};
