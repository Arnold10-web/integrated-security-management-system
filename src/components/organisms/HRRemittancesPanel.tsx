import React from "react";
import {
  FileSpreadsheet,
  Search,
  Calendar,
  Briefcase,
  FileCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { HRRemittanceRecord } from "../../types";

interface HRRemittancesPanelProps {
  filteredRemittances: HRRemittanceRecord[];
  cyclePeriod: string;
  onCyclePeriodChange: (period: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const HRRemittancesPanel: React.FC<HRRemittancesPanelProps> = ({
  filteredRemittances,
  cyclePeriod,
  onCyclePeriodChange,
  searchTerm,
  onSearchChange,
}) => {

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">
                HR Staff Allowances & Statutory Remittances Register
              </h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase tracking-wider">
                Exported Excel Format
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official security personnel ledger recording Days Normal, Days OT, Statutory Taxes (PAYE & NSSF), Operational Deductions (Shoes, Uniform, Advance, Food, Fine, Rent, Loan, Refund), Deployment Location, TIN, NSSF No, Net Disbursal, Tel No & Bank Details.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-700">Remittance Period:</span>
            <select
              value={cyclePeriod}
              onChange={(e) => onCyclePeriodChange(e.target.value)}
              className="bg-white border border-slate-300 font-extrabold text-xs text-slate-900 py-1 px-3 rounded-lg outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              <option value="July 2026">July 2026 (Current)</option>
              <option value="June 2026">June 2026 (Closed)</option>
              <option value="May 2026">May 2026 (Archived)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Gross Remittance</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {filteredRemittances.reduce((sum, p) => sum + p.grossPay, 0).toLocaleString()} UGX
            </p>
            <span className="text-[10px] text-slate-500 font-semibold">{filteredRemittances.length} Personnel Entries</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Statutory Taxes (PAYE + NSSF)</p>
            <p className="text-xl font-black text-amber-700 mt-1">
              {filteredRemittances.reduce((sum, p) => sum + p.paye + p.nssf, 0).toLocaleString()} UGX
            </p>
            <span className="text-[10px] text-amber-600 font-semibold">Remitted to URA & NSSF</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Operational Deductions</p>
            <p className="text-xl font-black text-rose-700 mt-1">
              {filteredRemittances.reduce((sum, p) => sum + p.totalDeductions, 0).toLocaleString()} UGX
            </p>
            <span className="text-[10px] text-rose-600 font-semibold">Advances, Uniforms, Fines, Loans</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between border border-emerald-950">
          <div>
            <p className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider">Total Net Payable</p>
            <p className="text-xl font-black text-white mt-1">
              {filteredRemittances.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()} UGX
            </p>
            <span className="text-[10px] text-emerald-200 font-semibold">Ready for Bank Disbursal</span>
          </div>
          <div className="p-3 bg-emerald-800 text-white rounded-xl">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Force No, Location, TIN, NSSF No, or Bank..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold">Matching Ledger Entries:</span>
          <span className="px-3 py-1 bg-slate-100 font-bold text-slate-900 rounded-lg border border-slate-200">
            {filteredRemittances.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-800 text-white p-3 text-xs font-bold flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>OFFICIAL HR MASTER REMITTANCE REGISTER (22 COLUMNS: NAME, FORCE NO, TAXES, DEDUCTIONS, BANK DETAILS)</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-normal">Horizontal Scroll Supported</span>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-300">
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap bg-emerald-50 text-emerald-900 sticky left-0 z-10 shadow-xs">1. name</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap bg-emerald-50 text-emerald-900">2. ForceNo</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-center">3. DaysNormal</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-center">4. DaysOT</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-amber-800 bg-amber-50/50">5. paye</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-amber-800 bg-amber-50/50">6. nssf</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">7. Shoes</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">8. Uniform</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">9. advance</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">10. Food</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">11. Fine</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">12. Rent</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">13. Loan</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-emerald-700 bg-emerald-50/40">14. Refund</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap bg-blue-50/60 text-blue-900">15. Location</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap text-rose-800 bg-rose-50/50">16. deductions</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">17. nssfno</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">18. TIN</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap bg-emerald-100 text-emerald-950 font-black">19. net pay</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">20. TelNo</th>
                <th className="p-2.5 border-r border-slate-300 whitespace-nowrap">21. Bank</th>
                <th className="p-2.5 whitespace-nowrap">22. Bankname</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700 text-[11px]">
              {filteredRemittances.map((p, idx) => (
                <tr key={p.id} className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100/80"}>
                  <td className="p-2.5 font-extrabold text-slate-900 border-r border-slate-200 whitespace-nowrap sticky left-0 bg-white z-10 shadow-xs">
                    {p.name}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-blue-700 border-r border-slate-200 whitespace-nowrap">
                    {p.forceNo}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                    {p.daysNormal}
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-800 bg-blue-50/30 border-r border-slate-200 whitespace-nowrap">
                    {p.daysOT}
                  </td>
                  <td className="p-2.5 font-mono text-amber-900 bg-amber-50/30 border-r border-slate-200 whitespace-nowrap">
                    {p.paye.toLocaleString()}
                  </td>
                  <td className="p-2.5 font-mono text-amber-900 bg-amber-50/30 border-r border-slate-200 whitespace-nowrap">
                    {p.nssf.toLocaleString()}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.shoes > 0 ? p.shoes.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.uniform > 0 ? p.uniform.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-rose-800 border-r border-slate-200 whitespace-nowrap">
                    {p.advance > 0 ? p.advance.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.food > 0 ? p.food.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-rose-900 font-bold border-r border-slate-200 whitespace-nowrap">
                    {p.fine > 0 ? p.fine.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.rent > 0 ? p.rent.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.loan > 0 ? p.loan.toLocaleString() : "-"}
                  </td>
                  <td className="p-2.5 font-mono text-emerald-800 font-bold bg-emerald-50/30 border-r border-slate-200 whitespace-nowrap">
                    {p.refund > 0 ? `+${p.refund.toLocaleString()}` : "-"}
                  </td>
                  <td className="p-2.5 font-semibold text-blue-950 bg-blue-50/20 border-r border-slate-200 whitespace-nowrap">
                    {p.location}
                  </td>
                  <td className="p-2.5 font-mono font-extrabold text-rose-800 bg-rose-50/30 border-r border-slate-200 whitespace-nowrap">
                    {p.totalDeductions.toLocaleString()}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                    {p.nssfNo}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">
                    {p.tin}
                  </td>
                  <td className="p-2.5 font-mono font-black text-emerald-950 bg-emerald-100/80 border-r border-slate-200 whitespace-nowrap text-sm">
                    {p.netPay.toLocaleString()} UGX
                  </td>
                  <td className="p-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {p.telNo}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                    {p.bank}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 whitespace-nowrap">
                    {p.bankName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
