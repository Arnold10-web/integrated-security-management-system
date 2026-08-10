import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CashierTransaction, UserRole } from "../../types";

interface CashierTransactionsTableProps {
  transactions: CashierTransaction[];
  activeRole?: UserRole;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  "Pending Approval": "bg-amber-100 text-amber-800 border border-amber-300",
  Disbursed: "bg-emerald-100 text-emerald-800 border border-emerald-300",
  Rejected: "bg-rose-100 text-rose-800 border border-rose-300",
};

export const CashierTransactionsTable: React.FC<CashierTransactionsTableProps> = ({ transactions, activeRole, onApprove, onReject }) => {
  const isFinanceManager = activeRole === "Finance Manager";

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No cashier transactions recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Cashier Disbursement Desk & Guard Advances Ledger</h3>
        <span className="text-xs text-slate-500 font-medium">Pending items require Finance Manager sign-off</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Receipt #</th>
              <th className="p-3.5">Guard Personnel</th>
              <th className="p-3.5">Advance Type</th>
              <th className="p-3.5">Requested Date</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Cashier Status</th>
              {isFinanceManager && <th className="p-3.5 text-center">FM Approval</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {transactions.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-emerald-700">{c.id}</td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{c.guardName}</div>
                  <div className="text-[11px] text-slate-500">{c.guardCode}</div>
                  {c.phone && <div className="text-[11px] text-slate-500">{c.phone}</div>}
                </td>
                <td className="p-3.5 font-semibold text-purple-700">{c.type}</td>
                <td className="p-3.5">{c.date}</td>
                <td className="p-3.5 font-black text-slate-900">UGX {c.amount.toLocaleString()}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${STATUS_STYLES[c.status] ?? "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                    {c.status}
                  </span>
                  {c.approvedBy && <div className="text-[10px] text-emerald-600 font-bold mt-1">Approved by {c.approvedBy}</div>}
                  {c.rejectedBy && <div className="text-[10px] text-rose-600 font-bold mt-1">Rejected by {c.rejectedBy}</div>}
                  {c.notes && <div className="text-[10px] text-slate-400 mt-1 max-w-40">{c.notes}</div>}
                  {c.signatureUrl && <div className="text-[10px] font-bold text-slate-500 mt-1">✍ {c.signatureUrl}</div>}
                </td>
                {isFinanceManager && (
                  <td className="p-3.5">
                    {c.status === "Pending Approval" ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onApprove?.(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                          title="Approve disbursement"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => onReject?.(c.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                          title="Reject disbursement"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">{c.status}</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
