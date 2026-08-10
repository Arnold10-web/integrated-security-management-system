import React from "react";
import { Download, Pencil, ShieldCheck, FolderArchive, Ban } from "lucide-react";
import type { ContractRecord, UserRole } from "../../types";
import { toast } from "../../stores/toastStore";
import {
  canAdvanceApproval,
  canArchiveContract,
  canEditContract,
  canIssueContract,
  canVoidContract,
  contractApprovalRolesForStep,
} from "../../utils/contracts";

interface ContractsPanelProps {
  contracts: ContractRecord[];
  contractFilter: "ALL" | "Staff Contract" | "Client Contract";
  onFilterChange: (filter: "ALL" | "Staff Contract" | "Client Contract") => void;
  activeRole?: UserRole;
  onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void;
  onIssueContract?: (id: string) => void;
  onArchiveContract?: (id: string) => void;
  onVoidContract?: (id: string, reason: string) => void;
  onAdvanceApproval?: (id: string) => void;
}

export const ContractsPanel: React.FC<ContractsPanelProps> = ({
  contracts,
  contractFilter,
  onFilterChange,
  activeRole,
  onUpdateContract,
  onIssueContract,
  onArchiveContract,
  onVoidContract,
  onAdvanceApproval,
}) => {
  const filterOptions: { label: string; value: "ALL" | "Staff Contract" | "Client Contract"; color: string }[] = [
    { label: `All Contracts (${contracts.length})`, value: "ALL", color: "bg-slate-900 text-white" },
    {
      label: `Staff SLAs (${contracts.filter((c) => c.contractType === "Staff Contract").length})`,
      value: "Staff Contract",
      color: "bg-blue-600 text-white",
    },
    {
      label: `Client SLAs (${contracts.filter((c) => c.contractType === "Client Contract").length})`,
      value: "Client Contract",
      color: "bg-purple-700 text-white",
    },
  ];

  const filteredContracts = contracts.filter(
    (c) => contractFilter === "ALL" || c.contractType === contractFilter
  );

  const expiryInfo = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate + "T23:59:59");
    const days = Math.round((end.getTime() - today.getTime()) / 86400000);
    if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, tone: "bg-red-100 text-red-800 border-red-300" };
    if (days <= 60) return { label: `Expires in ${days} day${days === 1 ? "" : "s"}`, tone: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: `Expires in ${days} days`, tone: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  };

  const categoryBadge: Record<string, string> = {
    "Guard Employment SLA": "bg-blue-50 text-blue-800 border-blue-200",
    "Executive Employment": "bg-indigo-50 text-indigo-800 border-indigo-200",
    "Corporate Client Service Agreement": "bg-purple-50 text-purple-800 border-purple-200",
    "Retail Site Agreement": "bg-pink-50 text-pink-800 border-pink-200",
    "Vendor SLA": "bg-teal-50 text-teal-800 border-teal-200",
  };

  const stepLabel: Record<string, string> = {
    BD: "Awaiting Business Development",
    Operations: "Awaiting Operations",
    Finance: "Awaiting Finance",
    GM: "Awaiting GM Approval",
    Done: "Approved",
  };

  const promptStatus = (c: ContractRecord) => {
    const newStatus = prompt(
      "Set status (Draft / Active / Expiring Soon / Expired / Pending Renewal / Terminated / Archived):",
      c.status
    );
    const valid = ["Draft", "Active", "Expiring Soon", "Expired", "Pending Renewal", "Terminated", "Archived"];
    if (newStatus && valid.includes(newStatus)) {
      onUpdateContract?.(c.id, { status: newStatus as ContractRecord["status"] });
    }
  };

  const confirmVoid = (c: ContractRecord) => {
    const reason = window.prompt(`Void/terminate contract ${c.title}? Enter the reason:`, "");
    if (reason && reason.trim()) {
      onVoidContract?.(c.id, reason.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Contract Storage Vault & SLA Archives
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official depository of Staff Employment SLA Contracts and Commercial Client Service Agreements.
          </p>
          {activeRole && (
            <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-wide">
              Acting as {activeRole}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                contractFilter === opt.value
                  ? opt.color
                  : opt.value === "ALL"
                  ? "bg-slate-100 text-slate-600"
                  : opt.value === "Staff Contract"
                  ? "bg-blue-50 text-blue-800"
                  : "bg-purple-50 text-purple-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContracts.map((c) => {
          const exp = expiryInfo(c.endDate);
          const approvers = contractApprovalRolesForStep(c.approvalStep);
          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-blue-400 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded-md">
                    {c.contractCode}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1">{c.title}</h3>
                  <p className="text-xs text-blue-700 font-bold">{c.partyName}</p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${categoryBadge[c.category] ?? "bg-slate-50 text-slate-700 border-slate-200"}`}>
                      {c.category}
                    </span>
                    {c.region && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Region: {c.region}
                      </span>
                    )}
                    {c.autoRenew && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Auto-Renew
                      </span>
                    )}
                    {c.contractType === "Staff Contract" && c.relatedGuardCode && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {c.relatedGuardCode}
                      </span>
                    )}
                    {c.contractType === "Client Contract" && c.relatedSiteName && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                        Site: {c.relatedSiteName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      c.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : c.status === "Expiring Soon"
                        ? "bg-amber-100 text-amber-800"
                        : c.status === "Pending Renewal"
                        ? "bg-sky-100 text-sky-800"
                        : c.status === "Draft"
                        ? "bg-indigo-100 text-indigo-800"
                        : c.status === "Archived"
                        ? "bg-slate-100 text-slate-600"
                        : c.status === "Terminated"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {c.status}
                  </span>
                  {canEditContract(c, activeRole) && onUpdateContract && (
                    <button
                      onClick={() => promptStatus(c)}
                      className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                      title="Edit Contract"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {c.contractType === "Client Contract" && c.status === "Draft" && (
                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-[10px] font-bold text-indigo-800">
                  <span>
                    {c.approvalStep && stepLabel[c.approvalStep]
                      ? stepLabel[c.approvalStep]
                      : "Workflow"}: {c.approvalStep || "BD"}
                  </span>
                  <span className="text-indigo-500">Next: {approvers.join(" / ") || "None"}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5 font-medium text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-bold">{c.startDate} to {c.endDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Expiry:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${exp.tone}`}>{exp.label}</span>
                </div>
                {c.valueUgx && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Value:</span>
                    <span className="font-black text-slate-900">{c.valueUgx.toLocaleString()} UGX / {c.billingCycle || "term"}</span>
                  </div>
                )}
                {c.paymentTerms && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400 shrink-0">Payment:</span>
                    <span className="font-semibold text-right">{c.paymentTerms}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Ref Document:</span>
                  <span className="font-mono text-blue-600">{c.documentRef}</span>
                </div>
              </div>

              {(c.preparedBy || c.issuedBy || c.approvedBy) && (
                <div className="text-[10px] font-bold text-slate-500 space-y-0.5">
                  {c.preparedBy && <p>Prepared: {c.preparedBy}</p>}
                  {c.issuedBy && <p>Issued: {c.issuedBy}</p>}
                  {c.approvedBy && <p>Approved: {c.approvedBy} {c.approvedAt ? `(${c.approvedAt})` : ""}</p>}
                </div>
              )}

              {c.slaTerms && (
                <div className="text-[11px] leading-snug bg-purple-50/60 border border-purple-100 rounded-xl p-3 text-slate-700">
                  <span className="font-black text-purple-900 text-[9px] uppercase tracking-wider block mb-1">Service Scope / SLA</span>
                  {c.slaTerms}
                </div>
              )}

              {c.voidReason && c.status === "Terminated" && (
                <div className="text-[11px] leading-snug bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-slate-700">
                  <span className="font-black text-rose-900 text-[9px] uppercase tracking-wider block mb-1">Termination Reason</span>
                  {c.voidReason}
                </div>
              )}

              {c.notes && (
                <div className="text-[11px] leading-snug bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-slate-700">
                  <span className="font-black text-amber-900 text-[9px] uppercase tracking-wider block mb-1">Notes</span>
                  {c.notes}
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] font-bold">Managed: {c.managedBy}</span>
                <button
                  onClick={() => toast.info("Contract PDF queued for download", `Downloading archived digital PDF contract file: ${c.documentRef}`)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download PDF</span>
                </button>
              </div>

              {(canIssueContract(c, activeRole) || canAdvanceApproval(c, activeRole) || canArchiveContract(c, activeRole) || canVoidContract(c, activeRole)) && (
                <div className="flex items-center gap-2">
                  {canIssueContract(c, activeRole) && onIssueContract && (
                    <button
                      onClick={() => onIssueContract(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Issue Contract
                    </button>
                  )}
                  {canAdvanceApproval(c, activeRole) && onAdvanceApproval && (
                    <button
                      onClick={() => onAdvanceApproval(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      Approve Step
                    </button>
                  )}
                  {canArchiveContract(c, activeRole) && onArchiveContract && (
                    <button
                      onClick={() => onArchiveContract(c.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      <FolderArchive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                  {canVoidContract(c, activeRole) && onVoidContract && (
                    <button
                      onClick={() => confirmVoid(c)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" /> Void
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
