import React, { useState } from "react";
import { Pencil, Trash2, Send } from "lucide-react";
import type { Invoice, UserRole } from "../../types";
import { FINANCE_INVOICE_ROLES } from "../../services/rbacService";

interface InvoicesTableProps {
  invoices: Invoice[];
  activeRole?: UserRole;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => void;
  onDeleteInvoice?: (id: string) => void;
  onApproveInvoice?: (id: string) => void;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ invoices, activeRole, onUpdateInvoice, onDeleteInvoice, onApproveInvoice }) => {
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const canEdit =
    !activeRole ||
    FINANCE_INVOICE_ROLES.includes(activeRole);
  const isFinanceManager = activeRole === "Finance Manager";

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="text-center py-8 text-slate-400 italic text-xs">No invoices recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Corporate Invoicing & SLA Billing Directory</h3>
        <span className="text-xs text-slate-500 font-medium">Auto-calculated from site guard allocations</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
              <th className="p-3.5">Invoice #</th>
              <th className="p-3.5">Client & Site Post</th>
              <th className="p-3.5">Invoice Date</th>
              <th className="p-3.5">Due Date</th>
              <th className="p-3.5">Billing Amount</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 font-bold text-blue-700">{inv.invoiceNumber}</td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{inv.clientName}</div>
                  <div className="text-[11px] text-slate-500">{inv.siteName}</div>
                </td>
                <td className="p-3.5">{inv.date}</td>
                <td className="p-3.5">{inv.dueDate}</td>
                <td className="p-3.5 font-black text-slate-900">UGX {inv.amount.toLocaleString()}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : inv.status === "Pending"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : inv.status === "Draft"
                        ? "bg-slate-100 text-slate-600 border border-slate-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {inv.status}
                  </span>
                  {inv.approvedBy && inv.status !== "Draft" && (
                    <div className="text-[10px] text-emerald-600 font-bold mt-1">Approved by {inv.approvedBy}</div>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {canEdit && (
                      <>
                        <button
                          onClick={() => setEditingInvoice(inv)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) onDeleteInvoice?.(inv.id); }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {isFinanceManager && inv.status === "Draft" && (
                      <button
                        onClick={() => onApproveInvoice?.(inv.id)}
                        className="flex items-center gap-1 p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer"
                        title="Approve & send invoice"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Approve & Send
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Edit Invoice</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                onUpdateInvoice?.(editingInvoice.id, {
                  clientName: fd.get("clientName") as string,
                  invoiceNumber: fd.get("invoiceNumber") as string,
                  amount: Number(fd.get("amount")),
                  status: fd.get("status") as Invoice["status"],
                });
                setEditingInvoice(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Name</label>
                <input name="clientName" type="text" required defaultValue={editingInvoice.clientName} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Invoice Number</label>
                <input name="invoiceNumber" type="text" required defaultValue={editingInvoice.invoiceNumber} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (UGX)</label>
                <input name="amount" type="number" required defaultValue={editingInvoice.amount} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                {editingInvoice.status === "Draft" ? (
                  <div className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-500 font-semibold">
                    Draft — use Approve &amp; Send to release to the client
                  </div>
                ) : (
                  <select name="status" defaultValue={editingInvoice.status} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold">
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditingInvoice(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
