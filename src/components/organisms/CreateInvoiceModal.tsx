import React, { useState } from "react";
import type { Invoice } from "../../types";

interface CreateInvoiceModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (invoice: Omit<Invoice, "id">) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ show, onClose, onSubmit }) => {
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [amount, setAmount] = useState<number>(5000000);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);

  const resetFields = () => {
    setClientName("");
    setSiteName("");
    setAmount(5000000);
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !siteName) return;
    onSubmit({
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      clientName,
      siteName,
      date: new Date().toISOString().substring(0, 10),
      dueDate,
      amount,
      status: "Draft",
      itemsCount: 12,
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Raise Corporate Client Invoice</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Client Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Bank of East Africa"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Site Post Location</label>
            <input
              type="text"
              required
              placeholder="e.g. Head Office Post A"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (UGX)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { resetFields(); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Confirm & Issue Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
