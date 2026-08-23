import React, { useState } from "react";
import type { CashierTransaction } from "../../types";

interface RegisterRow {
  securityOfficerName: string;
  forceNumber: string;
  phone: string;
  amount: number | "";
}

interface CashierDisbursementModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (txn: Omit<CashierTransaction, "id">) => void;
  onSubmitBatch?: (type: CashierTransaction["type"], items: Array<{ securityOfficerName: string; forceNumber?: string; amount: number; phone?: string; signatureUrl?: string; notes?: string }>) => void;
}

const emptyRow = (): RegisterRow => ({ securityOfficerName: "", forceNumber: "", phone: "", amount: "" });

export const CashierDisbursementModal: React.FC<CashierDisbursementModalProps> = ({ show, onClose, onSubmit, onSubmitBatch }) => {
  const [mode, setMode] = useState<"single" | "register">("single");
  const [securityOfficerName, setSecurityOfficerName] = useState("");
  const [forceNumber, setSecurityOfficerCode] = useState("");
  const [txnType, setTxnType] = useState<CashierTransaction["type"]>("Salary Advance");
  const [advanceAmount, setAdvanceAmount] = useState<number>(100000);
  const [phone, setPhone] = useState("");
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<RegisterRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  const resetFields = () => {
    setSecurityOfficerName("");
    setSecurityOfficerCode("");
    setTxnType("Salary Advance");
    setAdvanceAmount(100000);
    setPhone("");
    setSignature("");
    setNotes("");
    setRows([emptyRow(), emptyRow(), emptyRow()]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register") {
      if (!onSubmitBatch) return;
      const items = rows
        .filter((r) => r.securityOfficerName.trim() && Number(r.amount) > 0)
        .map((r) => ({
          securityOfficerName: r.securityOfficerName.trim(),
          forceNumber: r.forceNumber.trim() || undefined,
          amount: Number(r.amount),
          phone: r.phone.trim() || undefined,
        }));
      if (items.length === 0) return;
      onSubmitBatch(txnType, items);
      resetFields();
      onClose();
      return;
    }
    if (!securityOfficerName) return;
    onSubmit({
      securityOfficerName,
      forceNumber: forceNumber || "SG-2024-001",
      type: txnType,
      amount: advanceAmount,
      date: new Date().toISOString().substring(0, 10),
      status: "Pending Approval",
      processedBy: "Finance Desk",
      phone: phone || undefined,
      signatureUrl: signature || undefined,
      notes: notes || undefined,
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  const inputCls = "w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none";
  const cellCls = "w-full p-2 bg-white border border-slate-200 rounded-lg outline-none text-xs";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl ${mode === "register" ? "max-w-3xl" : "max-w-lg"} w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-black text-slate-900">Process Security Officer Cashier Disbursement</h3>
          {onSubmitBatch && (
            <div className="flex bg-slate-100 rounded-xl p-1 shrink-0">
              <button type="button" onClick={() => setMode("single")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${mode === "single" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
                Single Entry
              </button>
              <button type="button" onClick={() => setMode("register")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${mode === "register" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>
                Salary Advance Register
              </button>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === "register" ? (
            <>
              <p className="text-[11px] text-slate-500 font-semibold">Paper register digitised — one row per officer. All entries post as <b>Pending Approval</b> for the Finance Manager.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Register Type</label>
                  <select value={txnType} onChange={(e) => setTxnType(e.target.value as CashierTransaction["type"])}
                    className={`${inputCls} bg-white font-semibold`}>
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Meal Allowance">Meal Allowance</option>
                    <option value="Housing Grant">Housing Grant</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                  </select>
                </div>
                <div className="flex items-end justify-end gap-2 pb-1">
                  <button type="button" onClick={() => setRows([...rows, emptyRow()])}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer">
                    + Add Row
                  </button>
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rows.slice(0, -1))}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Force Number</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2 w-32">Amount (UGX)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 text-[11px] font-black text-slate-400">{i + 1}</td>
                        <td className="px-2 py-1.5"><input className={cellCls} placeholder="Full name" value={row.securityOfficerName}
                          onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, securityOfficerName: e.target.value } : r)))} /></td>
                        <td className="px-2 py-1.5"><input className={cellCls} placeholder="PSG026/…" value={row.forceNumber}
                          onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, forceNumber: e.target.value } : r)))} /></td>
                        <td className="px-2 py-1.5"><input className={cellCls} placeholder="07…" value={row.phone}
                          onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, phone: e.target.value } : r)))} /></td>
                        <td className="px-2 py-1.5"><input className={cellCls} type="number" min="0" placeholder="0" value={row.amount}
                          onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, amount: e.target.value === "" ? "" : Number(e.target.value) } : r)))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] font-bold text-emerald-700">
                {rows.filter((r) => r.securityOfficerName.trim() && Number(r.amount) > 0).length} valid row(s) · Total UGX{" "}
                {rows.reduce((sum, r) => sum + (Number(r.amount) > 0 && r.securityOfficerName.trim() ? Number(r.amount) : 0), 0).toLocaleString("en-UG")}
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Security Officer Full Name</label>
                <input type="text" required placeholder="e.g. Emmanuel Omondi" value={securityOfficerName}
                  onChange={(e) => setSecurityOfficerName(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Disbursement Type</label>
                  <select value={txnType} onChange={(e) => setTxnType(e.target.value as CashierTransaction["type"])}
                    className={`${inputCls} bg-white font-semibold`}>
                    <option value="Salary Advance">Salary Advance</option>
                    <option value="Meal Allowance">Meal Allowance</option>
                    <option value="Housing Grant">Housing Grant</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (UGX)</label>
                  <input type="number" required value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              {txnType === "Salary Advance" && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800">Salary Advance Register Entry</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                      <input type="tel" placeholder="e.g. 0772 123 456" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Security Officer Signature (typed)</label>
                      <input type="text" placeholder="Full name as signed on register" value={signature} onChange={(e) => setSignature(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Notes</label>
                    <input type="text" placeholder="e.g. Advance against July payroll, to be recovered" value={notes} onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => { resetFields(); onClose(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer">
              {mode === "register" ? "Post Register" : "Disburse Funds"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
