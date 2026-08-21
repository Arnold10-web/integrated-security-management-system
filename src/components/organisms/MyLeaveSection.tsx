import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  PlaneTakeoff,
  Hourglass,
  CheckCircle2,
  XCircle,
  History,
  Loader2,
} from "lucide-react";
import { Modal, Pagination } from "../molecules";
import { domainApi, type MyLeaveSummary } from "../../services/domainApi";
import type { LeaveRequest, User } from "../../types";
import { toast } from "../../stores/toastStore";

const LEAVE_TYPES: LeaveRequest["leaveType"][] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Maternity/Paternity",
  "Compassionate Leave",
  "Unpaid Leave",
  "Compensatory Leave",
  "Study Leave",
];

const PAGE_SIZE = 6;

const statusPill = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Pending GM Approval":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
};

interface MyLeaveSectionProps {
  currentUser: User;
}

export const MyLeaveSection: React.FC<MyLeaveSectionProps> = ({ currentUser }) => {
  const [summary, setSummary] = useState<MyLeaveSummary | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leaveType: "Annual Leave" as LeaveRequest["leaveType"],
    startDate: "",
    endDate: "",
    reason: "",
    contactAddress: "",
  });

  const refresh = useCallback(async () => {
    try {
      const res = await domainApi.myLeave.summary();
      setRequests(res.requests ?? []);
      setSummary(res.summary ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your leave records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const durationDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.startDate, form.endDate]);

  const overBalance =
    form.leaveType === "Annual Leave" && summary ? durationDays > summary.remaining : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim() || durationDays < 1 || overBalance) return;
    setSubmitting(true);
    try {
      await domainApi.myLeave.request({
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        durationDays,
        reason: form.reason.trim(),
        contactAddress: form.contactAddress.trim() || undefined,
      });
      toast.success("Leave Requested", `${form.leaveType} submitted for HR approval.`);
      setForm({ leaveType: "Annual Leave", startDate: "", endDate: "", reason: "", contactAddress: "" });
      setShowForm(false);
      await refresh();
    } catch (err) {
      toast.error("Request Failed", err instanceof Error ? err.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      await domainApi.myLeave.cancel(id);
      toast.info("Leave Withdrawn", "Your pending leave request was withdrawn.");
      await refresh();
    } catch (err) {
      toast.error("Withdraw Failed", err instanceof Error ? err.message : "Could not withdraw request");
    }
  };

  const totalPages = Math.max(Math.ceil(requests.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRequests = requests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const cards = [
    {
      label: "Annual Entitlement",
      value: summary ? `${summary.entitlement} days` : "—",
      sub: summary ? `Leave year ${summary.year}` : "",
      icon: PlaneTakeoff,
      tone: "bg-slate-900 text-white",
      iconTone: "bg-cyan-500/20 text-cyan-300",
    },
    {
      label: "Days Spent",
      value: summary ? `${summary.taken} days` : "—",
      sub: "Approved leave taken this year",
      icon: CheckCircle2,
      tone: "bg-white text-slate-900",
      iconTone: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Pending Approval",
      value: summary ? `${summary.pending} days` : "—",
      sub: "Awaiting HR / GM decision",
      icon: Hourglass,
      tone: "bg-white text-slate-900",
      iconTone: "bg-amber-100 text-amber-700",
    },
    {
      label: "Days Remaining",
      value: summary ? `${summary.remaining} days` : "—",
      sub: "Available to request now",
      icon: CalendarDays,
      tone: "bg-white text-slate-900",
      iconTone: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <CalendarDays className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">My Leave</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Request leave and track your annual entitlement — {currentUser.name} · {currentUser.role}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`${c.tone} rounded-2xl p-5 border border-slate-200 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-black uppercase tracking-wider ${c.tone.includes("white") ? "text-slate-500" : "text-slate-300"}`}>
                {c.label}
              </span>
              <div className={`p-2 rounded-xl ${c.iconTone}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black tracking-tight">{c.value}</p>
            {c.sub && (
              <p className={`text-[10px] mt-1 font-semibold ${c.tone.includes("white") ? "text-slate-400" : "text-slate-400"}`}>{c.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-extrabold text-slate-900">My Leave History</h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black">{requests.length} request(s)</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your leave records…
          </div>
        ) : error ? (
          <p className="py-6 text-center text-xs font-bold text-red-500">{error}</p>
        ) : requests.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-slate-400">
            You have not requested any leave yet. Click “Request Leave” to submit your first application.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Balance at Request</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pagedRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-black text-slate-900">{r.leaveType}</span>
                        <span className="block text-[10px] text-slate-400 italic">“{r.reason}”</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700">
                        {r.startDate} → {r.endDate}
                      </td>
                      <td className="p-3 font-black text-slate-900">{r.durationDays}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${statusPill(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="p-3 text-[11px] font-bold text-slate-600">
                        {r.entitlement != null && r.balance != null
                          ? `${r.entitlement - r.balance} spent · ${r.balance} left`
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        {["Pending HR Approval", "Pending GM Approval"].includes(r.status) ? (
                          <button
                            onClick={() => handleWithdraw(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Withdraw
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageSize={PAGE_SIZE} total={requests.length} onPageChange={setPage} itemName="requests" />
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Request Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Leave Type</label>
            <select
              value={form.leaveType}
              onChange={(e) => setForm({ ...form, leaveType: e.target.value as LeaveRequest["leaveType"] })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={form.startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                required
                value={form.endDate}
                min={form.startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Reason</label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Briefly state the reason for your leave…"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Contact Address While Away (optional)</label>
            <input
              value={form.contactAddress}
              onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
              placeholder="Where can HR reach you?"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Duration</span>
            <span className="font-black text-slate-900">{durationDays} day(s)</span>
          </div>
          {summary && (
            <div className={`rounded-xl p-3 flex items-center justify-between text-xs border ${
              overBalance ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
            }`}>
              <span className={`font-bold ${overBalance ? "text-red-700" : "text-blue-700"}`}>
                Annual balance: {summary.remaining} of {summary.entitlement} day(s) remaining
              </span>
              {overBalance && <span className="font-black text-red-700">Exceeds balance!</span>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || durationDays < 1 || overBalance}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
