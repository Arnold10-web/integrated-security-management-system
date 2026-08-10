import React, { useState } from "react";
import type { CashierTransaction } from "../../types";

interface CashierDisbursementModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (txn: Omit<CashierTransaction, "id">) => void;
}

export const CashierDisbursementModal: React.FC<CashierDisbursementModalProps> = ({ show, onClose, onSubmit }) => {
  const [guardName, setGuardName] = useState("");
  const [guardCode, setGuardCode] = useState("");
  const [txnType, setTxnType] = useState<CashierTransaction["type"]>("Salary Advance");
  const [advanceAmount, setAdvanceAmount] = useState<number>(100000);
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");

  const resetFields = () => {
    setGuardName("");
    setGuardCode("");
    setTxnType("Salary Advance");
    setAdvanceAmount(100000);
    setPhone("");
    setSignature("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName) return;
    onSubmit({
      guardName,
      guardCode: guardCode || "SG-2024-001",
      type: txnType,
      amount: advanceAmount,
      date: new Date().toISOString().substring(0, 10),
      status: "Pending Approval",
      processedBy: "Finance & Cashier Desk",
      phone: phone || undefined,
      signatureUrl: signature || undefined,
      notes: notes || undefined,
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Process Guard Cashier Disbursement</h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Guard Officer Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Emmanuel Omondi"
              value={guardName}
              onChange={(e) => setGuardName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Disbursement Type</label>
              <select
                value={txnType}
                onChange={(e) => setTxnType(e.target.value as CashierTransaction["type"])}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold"
              >
                <option value="Salary Advance">Salary Advance</option>
                <option value="Meal Allowance">Meal Allowance</option>
                <option value="Housing Grant">Housing Grant</option>
                <option value="Loan Repayment">Loan Repayment</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Amount (UGX)</label>
              <input
                type="number"
                required
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {txnType === "Salary Advance" && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800">Salary Advance Register Entry</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0772 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guard Signature (typed)</label>
                  <input
                    type="text"
                    placeholder="Full name as signed on register"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Advance against July payroll, to be recovered"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
            </div>
          )}

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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Disburse Funds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
