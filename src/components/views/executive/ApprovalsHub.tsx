import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, FileSignature, ClipboardList, Receipt, Megaphone, CalendarClock, Inbox } from "lucide-react";
import { useDomainStore } from "../../../stores/domainStore";
import { PanelShell } from "./PanelShell";

type TabKey = "contracts" | "requisitions" | "expenses" | "budgets" | "leave";

interface QueueItem {
  id: string;
  title: string;
  meta: string;
  amountLabel?: string;
  ageDays: number;
  onApprove: () => void;
  onReject?: (reason: string) => void;
}

const REASON_REQUIRED_HINT = "Rejection reason (required)…";

/**
 * Unified decision queue for the Directorate (§33 no-threshold approvals).
 * The workflow-engine inbox is intentionally NOT part of this hub.
 * Director sees the same queues read-only unless acting-delegated.
 */
export const ApprovalsHub: React.FC<{ canAct: boolean; search: string }> = ({ canAct, search }) => {
  const domain = useDomainStore();
  const [tab, setTab] = useState<TabKey>("contracts");
  const [actingId, setActingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const close = () => { setActingId(null); setComment(""); };

  const contracts = useMemo(
    () =>
      domain.contracts
        .filter((c) => c.status === "Draft" && c.approvalStep === "GM")
        .map<QueueItem>((c) => ({
          id: c.id,
          title: `${c.contractCode} — ${c.title}`,
          meta: `${c.contractType} · ${c.partyName}${c.region ? ` · ${c.region}` : ""} · drafted by ${c.preparedBy ?? "—"}`,
          amountLabel: c.valueUgx ? `UGX ${c.valueUgx.toLocaleString()}` : undefined,
          ageDays: ageInDays(c.startDate),
          onApprove: () => domain.advanceContractApproval(c.id),
          onReject: (reason) => domain.voidContract(c.id, reason),
        })),
    [domain]
  );

  const requisitions = useMemo(
    () =>
      domain.adminRequisitions
        .filter((r) => r.status === "Pending Approval")
        .map<QueueItem>((r) => ({
          id: r.id,
          title: `${r.reqCode} — ${r.itemDescription}`,
          meta: `${r.requestedBy} · ${r.department} · Qty ${r.quantity} · ${r.priority} priority`,
          amountLabel: `UGX ${r.estimatedCostUgx.toLocaleString()}`,
          ageDays: ageInDays(r.dateRequested),
          onApprove: () => domain.approveRequisition(r.id),
          onReject: (reason) => domain.rejectRequisition(r.id, reason),
        })),
    [domain]
  );

  const expenses = useMemo(
    () =>
      domain.expenses
        .filter((x) => x.status === "Pending GM Approval")
        .map<QueueItem>((x) => ({
          id: x.id,
          title: x.description,
          meta: `${x.category} · submitted by ${x.submittedBy ?? x.approvedBy ?? "—"}`,
          amountLabel: `UGX ${Number(x.amount).toLocaleString()}`,
          ageDays: ageInDays(x.date),
          onApprove: () => domain.gmApproveExpense(x.id),
          onReject: canAct ? () => domain.rejectExpense(x.id) : undefined,
        })),
    [domain]
  );

  const budgets = useMemo(
    () =>
      domain.campaigns
        .filter((c) => c.budgetStatus === "Pending Approval")
        .map<QueueItem>((c) => ({
          id: c.id,
          title: c.name,
          meta: `${c.channel} · proposed by ${c.proposedBy ?? "Marketing"} · ${c.leadsGenerated} leads`,
          amountLabel: `UGX ${Number(c.budget).toLocaleString()}`,
          ageDays: Number.NaN,
          onApprove: () => domain.gmApproveCampaignBudget(c.id),
        })),
    [domain]
  );

  const leave = useMemo(
    () =>
      domain.leaveRequests
        .filter((l) => l.status === "Pending GM Approval")
        .map<QueueItem>((l) => ({
          id: l.id,
          title: `${l.securityOfficerName} (${l.forceNumber})`,
          meta: `${l.leaveType} · ${l.startDate} → ${l.endDate} · ${l.durationDays} day${l.durationDays === 1 ? "" : "s"}${l.reliefSecurityOfficerName ? ` · relief: ${l.reliefSecurityOfficerName}` : ""}`,
          ageDays: Number.NaN,
          onApprove: () => domain.gmApproveLeave(l.id),
          onReject: (reason) => domain.rejectLeaveRequest(l.id, reason),
        })),
    [domain]
  );

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; items: QueueItem[]; needsReason: boolean }[] = [
    { key: "contracts", label: "Contracts", icon: <FileSignature className="w-3.5 h-3.5" />, items: contracts, needsReason: true },
    { key: "requisitions", label: "Requisitions", icon: <ClipboardList className="w-3.5 h-3.5" />, items: requisitions, needsReason: true },
    { key: "expenses", label: "Expenses", icon: <Receipt className="w-3.5 h-3.5" />, items: expenses, needsReason: false },
    { key: "budgets", label: "Campaign Budgets", icon: <Megaphone className="w-3.5 h-3.5" />, items: budgets, needsReason: false },
    { key: "leave", label: "Final Leave", icon: <CalendarClock className="w-3.5 h-3.5" />, items: leave, needsReason: true },
  ];

  const totalPending = tabs.reduce((s, t) => s + t.items.length, 0);
  const active = tabs.find((t) => t.key === tab)!;
  const q = search.trim().toLowerCase();
  const rows = q
    ? active.items.filter((i) => `${i.title} ${i.meta} ${i.amountLabel ?? ""}`.toLowerCase().includes(q))
    : active.items;

  return (
    <PanelShell
      icon={<Inbox className="w-4 h-4 text-amber-600" />}
      title="Approvals Hub"
      badge={totalPending}
      badgeTone={totalPending > 0 ? "amber" : "emerald"}
      actions={
        !canAct ? (
          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase border border-slate-200">
            Read-only (Director)
          </span>
        ) : undefined
      }
    >
      {/* Tab strip with per-queue counts */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); close(); }}
            aria-pressed={tab === t.key}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-colors cursor-pointer ${
              tab === t.key
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {t.icon}
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              t.items.length > 0
                ? tab === t.key ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-400"
            }`}>
              {t.items.length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2.5 max-h-[26rem] overflow-y-auto pr-1">
        {rows.map((item) => {
          const isActing = actingId === item.id;
          const stale = !Number.isNaN(item.ageDays) && item.ageDays > 14;
          return (
            <div
              key={`${active.key}-${item.id}`}
              className={`p-3.5 rounded-xl border bg-slate-50/70 transition-colors ${
                stale ? "border-rose-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.meta}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {item.amountLabel && (
                    <span className="text-xs font-black text-slate-700">{item.amountLabel}</span>
                  )}
                  {stale && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase border border-rose-200">
                      {item.ageDays}d waiting
                    </span>
                  )}
                </div>
              </div>

              {isActing ? (
                <div className="mt-3 space-y-2">
                  <input
                    autoFocus
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={REASON_REQUIRED_HINT}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { item.onApprove(); close(); }}
                      disabled={canAct === false}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Confirm Approve
                    </button>
                    {item.onReject && (
                      <button
                        onClick={() => {
                          if (active.needsReason && !comment.trim()) return;
                          item.onReject!(comment || "Rejected by Directorate");
                          close();
                        }}
                        disabled={!canAct}
                        className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-3.5 h-3.5 inline mr-1" /> Confirm Reject
                      </button>
                    )}
                    <button
                      onClick={close}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => (canAct ? item.onApprove() : setActingId(item.id))}
                    disabled={!canAct}
                    title={canAct ? "Approve" : "Directors approve via delegation only"}
                    className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Approve
                  </button>
                  {item.onReject && (
                    <button
                      onClick={() => canAct && setActingId(item.id)}
                      disabled={!canAct}
                      className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 rounded-xl text-xs font-bold cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" /> Reject…
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">
              {q ? `No "${search}" matches in ${active.label}.` : `${active.label}: all clear — nothing awaits your decision.`}
            </p>
          </div>
        )}
      </div>
    </PanelShell>
  );
};

function ageInDays(dateIso?: string): number {
  if (!dateIso) return Number.NaN;
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return Number.NaN;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
