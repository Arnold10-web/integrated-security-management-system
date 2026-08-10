import React from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import type { Expense, UserRole } from "../../types";
import { FINANCE_INVOICE_ROLES } from "../../services/rbacService";

interface ExpensesTableProps {
  expenses: Expense[];
  activeRole?: UserRole;
  onDeleteExpense?: (id: string) => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, activeRole, onDeleteExpense }) => {
  const canEdit =
    !activeRole ||
    FINANCE_INVOICE_ROLES.includes(activeRole);
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No expenses recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Operational Cost Centers & Expense Vouchers</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Voucher ID</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Approval Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-slate-800">{exp.id}</td>
                <td className="p-3.5 font-semibold text-blue-700">{exp.category}</td>
                <td className="p-3.5 text-slate-700">{exp.description}</td>
                <td className="p-3.5 font-black text-slate-900">UGX {exp.amount.toLocaleString()}</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">{exp.status}</span>
                  </div>
                </td>
                <td className="p-3.5 text-center">
                  {canEdit && (
                    <button
                      onClick={() => { if (window.confirm(`Delete expense ${exp.id}?`)) onDeleteExpense?.(exp.id); }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
