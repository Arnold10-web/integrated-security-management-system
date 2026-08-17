import React from "react";
import {
  CreditCard,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Guard } from "../../types";

interface IdentityCardPanelProps {
  guards: Guard[];
  idCardFilter: string;
  idCardSearch: string;
  onSetIdCardFilter: (val: "ALL" | "PENDING" | "ISSUED" | "REVOKED") => void;
  onSetIdCardSearch: (val: string) => void;
  onSelectGuardForCard: (guard: Guard) => void;
  onOpenPrintModal: () => void;
  onProvisionUser?: (guard: Guard) => void;
  /** When true (IT verification), card actions are view/verify only — no issuance or printing. */
  readOnly?: boolean;
}

export const IdentityCardPanel: React.FC<IdentityCardPanelProps> = ({
  guards,
  idCardFilter,
  idCardSearch,
  onSetIdCardFilter,
  onSetIdCardSearch,
  onSelectGuardForCard,
  onOpenPrintModal,
  onProvisionUser,
  readOnly = false,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {readOnly && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 rounded-2xl border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>IT VERIFICATION • OFFICIAL PERSONNEL IDENTITY CARDS</span>
            </div>
            <h3 className="text-base font-extrabold text-white">Identity Card Verification & Status View</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">Read-only verification: confirm a card is genuine by checking the issued card number, holder photo, and holder & issuer signatures before accepting it as authentic.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Roster</span>
              <span className="text-lg font-black text-white">{guards.length}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Pending ID</span>
              <span className="text-lg font-black text-amber-400">{guards.filter((g) => g.idCardStatus === "Pending Records Issuance" || g.idCardStatus === "Reissue Required" || !g.idCardStatus).length}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-center min-w-[100px]">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Active Cards</span>
              <span className="text-lg font-black text-emerald-400">{guards.filter((g) => g.idCardStatus === "Issued & Active").length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["ALL", "PENDING", "ISSUED", "REVOKED"] as const).map((filter) => {
            const isActive = idCardFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => onSetIdCardFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter === "ALL" && `All Personnel (${guards.length})`}
                {filter === "PENDING" && `Pending Records Issuance (${guards.filter((g) => g.idCardStatus === "Pending Records Issuance" || g.idCardStatus === "Reissue Required" || !g.idCardStatus).length})`}
                {filter === "ISSUED" && `Issued & Active (${guards.filter((g) => g.idCardStatus === "Issued & Active").length})`}
                {filter === "REVOKED" && `Revoked / Suspended (${guards.filter((g) => g.idCardStatus === "Revoked").length})`}
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={idCardSearch}
            onChange={(e) => onSetIdCardSearch(e.target.value)}
            placeholder="Search Name, Force No, NIN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Guards Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <span>Personnel Roster & Identity Card Status</span>
          </h4>          <span className="text-xs font-bold text-slate-500">
            Showing {guards.filter((g) => {
              if (idCardFilter === "PENDING" && g.idCardStatus !== "Pending Records Issuance" && g.idCardStatus !== "Reissue Required" && g.idCardStatus) return false;
              if (idCardFilter === "ISSUED" && g.idCardStatus !== "Issued & Active") return false;
              if (idCardFilter === "REVOKED" && g.idCardStatus !== "Revoked") return false;
              if (idCardSearch) {
                const query = idCardSearch.toLowerCase();
                return (
                  g.fullName.toLowerCase().includes(query) ||
                  g.forceNumber.toLowerCase().includes(query) ||
                  g.nationalId.toLowerCase().includes(query) ||
                      g.designation.toLowerCase().includes(query)
                );
              }
              return true;
            }).length} Employees
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Staff Officer & Photo</th>
                <th className="p-3.5">Force Number</th>
                <th className="p-3.5">National ID (NIN)</th>
                <th className="p-3.5">Designation & Station</th>
                <th className="p-3.5">ID Card Status</th>
                <th className="p-3.5">System User Account</th>
                <th className="p-3.5 text-right">{readOnly ? "Verification" : "Records Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {guards
                .filter((g) => {
                  if (idCardFilter === "PENDING" && g.idCardStatus !== "Pending Records Issuance" && g.idCardStatus !== "Reissue Required" && g.idCardStatus) return false;
                  if (idCardFilter === "ISSUED" && g.idCardStatus !== "Issued & Active") return false;
                  if (idCardFilter === "REVOKED" && g.idCardStatus !== "Revoked") return false;
                  if (idCardSearch) {
                    const query = idCardSearch.toLowerCase();
                    return (
                      g.fullName.toLowerCase().includes(query) ||
                      g.forceNumber.toLowerCase().includes(query) ||
                      g.nationalId.toLowerCase().includes(query) ||
                  g.designation.toLowerCase().includes(query)
                    );
                  }
                  return true;
                })
                .map((guard) => {
                  const isIssued = guard.idCardStatus === "Issued & Active";
                  const isRevoked = guard.idCardStatus === "Revoked";
                  const isReissue = guard.idCardStatus === "Reissue Required";
                  return (
                    <tr key={guard.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 overflow-hidden border-2 border-amber-400 shrink-0 shadow-xs flex items-center justify-center font-black text-white text-xs">
                            {guard.photoUrl ? (
                              <img src={guard.photoUrl} alt={guard.fullName} className="w-full h-full object-cover" />
                            ) : (
                              guard.fullName.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block">{guard.fullName}</span>
                            <span className="text-[11px] text-slate-500 font-semibold">{guard.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono font-black text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-lg text-xs">
                          {guard.forceNumber}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-extrabold text-slate-700">
                        {guard.nationalId}
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{guard.designation}</span>
                        <span className="text-[10px] text-slate-500">{guard.assignedSite}</span>
                      </td>

                      <td className="p-3.5">
                        {isIssued ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Issued & Active</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              {guard.idCardNumber || `ID-UG-2026-${guard.forceNumber.replace(/\D/g, "")}`}
                            </span>
                          </div>
                        ) : isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Revoked / Suspended</span>
                          </span>
                        ) : isReissue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-300">
                            <Clock className="w-3 h-3 text-orange-600" />
                            <span>Reissue Required</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Records Issuance</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {guard.hasSystemAccount ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 font-bold text-[11px] rounded-lg border border-blue-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>User Provisioned</span>
                          </span>
                        ) : onProvisionUser ? (
                          <button
                            onClick={() => onProvisionUser(guard)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded-lg shadow-xs transition-all cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>+ Create System User</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">— (Provisioned by IT)</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            onSelectGuardForCard(guard);
                            onOpenPrintModal();
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{readOnly ? "Verify / View ID Card" : isIssued ? "View / Print ID Card" : "Issue Identity Card"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
