import React from "react";
import type { ContractRecord } from "../../types";

interface ContractModalProps {
  show: boolean;
  onClose: () => void;
  contractTitle: string;
  setContractTitle: (v: string) => void;
  contractCode: string;
  setContractCode: (v: string) => void;
  contractType: "Staff Contract" | "Client Contract";
  setContractType: (v: "Staff Contract" | "Client Contract") => void;
  partyName: string;
  setPartyName: (v: string) => void;
  category: ContractRecord["category"];
  setCategory: (v: ContractRecord["category"]) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  valueUgx: number;
  setValueUgx: (v: number) => void;
  documentRef: string;
  setDocumentRef: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  slaTerms: string;
  setSlaTerms: (v: string) => void;
  paymentTerms: string;
  setPaymentTerms: (v: string) => void;
  billingCycle: string;
  setBillingCycle: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  autoRenew: boolean;
  setAutoRenew: (v: boolean) => void;
  relatedForceNumber: string;
  setRelatedForceNumber: (v: string) => void;
  relatedSiteName: string;
  setRelatedSiteName: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  show, onClose,
  contractTitle, setContractTitle,
  contractCode, setContractCode,
  contractType, setContractType,
  partyName, setPartyName,
  category, setCategory,
  startDate, setStartDate,
  endDate, setEndDate,
  valueUgx, setValueUgx,
  documentRef, setDocumentRef,
  notes, setNotes,
  slaTerms, setSlaTerms,
  paymentTerms, setPaymentTerms,
  billingCycle, setBillingCycle,
  region, setRegion,
  autoRenew, setAutoRenew,
  relatedForceNumber, setRelatedForceNumber,
  relatedSiteName, setRelatedSiteName,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900">Record New Contract</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contract Title / Name</label>
              <input type="text" required value={contractTitle} onChange={(e) => setContractTitle(e.target.value)}
                placeholder="e.g. Guard Service SLA" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contract Code</label>
              <input type="text" value={contractCode} onChange={(e) => setContractCode(e.target.value)}
                placeholder="e.g. CTR-0726" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contract Type</label>
              <select value={contractType} onChange={(e) => setContractType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="Staff Contract">Staff Contract</option>
                <option value="Client Contract">Client Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="Guard Employment SLA">Guard Employment SLA</option>
                <option value="Executive Employment">Executive Employment</option>
                <option value="Corporate Client Service Agreement">Corporate Client Service Agreement</option>
                <option value="Retail Site Agreement">Retail Site Agreement</option>
                <option value="Vendor SLA">Vendor SLA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Party Name (Employee / Client Company / Vendor)</label>
            <input type="text" required value={partyName} onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. East African Banking Corp" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Contract Value (UGX)</label>
              <input type="number" value={valueUgx} onChange={(e) => setValueUgx(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Billing Cycle</label>
              <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                <option value="">— Select —</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Terms</label>
              <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. Monthly in advance, 30 days net" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Region</label>
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Kampala Central" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
          </div>

          {contractType === "Staff Contract" ? (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Related Guard / Force Number</label>
              <input type="text" value={relatedForceNumber} onChange={(e) => setRelatedForceNumber(e.target.value)}
                placeholder="e.g. FORCE-2026-001" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Related Client Site</label>
              <input type="text" value={relatedSiteName} onChange={(e) => setRelatedSiteName(e.target.value)}
                placeholder="e.g. BEA HQ Nakasero" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Service Scope / SLA</label>
            <textarea rows={2} value={slaTerms} onChange={(e) => setSlaTerms(e.target.value)}
              placeholder="e.g. 4 day guards, 2 night guards, patrols every 2 hours..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Document Reference</label>
              <input type="text" value={documentRef} onChange={(e) => setDocumentRef(e.target.value)}
                placeholder="e.g. DOC-SLA-2026.pdf" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 w-full cursor-pointer">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="w-4 h-4" />
                Auto-Renew
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes / Scope Summary</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Scope details, SLAs, or renewal conditions..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer">Save Contract Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};
