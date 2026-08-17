/**
 * Contracts Snapshot (Operations — view-only with value).
 * Active / expiring client contracts relevant to the user's region/sites, incl. value.
 * No self-service contract search: deeper info goes through the Records Officer inquiry path.
 */

import React, { useMemo, useState } from "react";
import { FileSignature, Search, AlertTriangle, FileText } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole } from "../../services/rbacService";
import { ContractInquiryPanel } from "./ContractInquiryPanel";
import type { UserRole } from "../../types";

const OPS_MANAGER: UserRole = "Operations Manager";

const CONTRACT_TONE: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Expiring Soon": "bg-amber-100 text-amber-700 border-amber-200",
  "Pending Renewal": "bg-amber-100 text-amber-700 border-amber-200",
  Expired: "bg-rose-100 text-rose-700 border-rose-200",
  Terminated: "bg-slate-100 text-slate-500 border-slate-200",
  Archived: "bg-slate-100 text-slate-500 border-slate-200",
  Draft: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export const ContractsSnapshotPanel: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const activeRole = getEffectiveRole(currentUser) ?? null;

  const [showInquiry, setShowInquiry] = useState(false);

  const visible = useMemo(() => {
    const contracts = domain.contracts.filter((c) => c.contractType === "Client Contract");
    if (activeRole === OPS_MANAGER && currentUser?.region) {
      const region = currentUser.region;
      const regionSites = domain.sites.filter((s) => s.region === region).map((s) => s.siteName);
      const relevant = contracts.filter(
        (c) => c.region === region || (c.relatedSiteName && regionSites.includes(c.relatedSiteName))
      );
      return relevant.length > 0 ? relevant : contracts;
    }
    return contracts;
  }, [domain.contracts, domain.sites, activeRole, currentUser?.region]);

  const activeCount = visible.filter((c) => c.status === "Active").length;
  const expiringCount = visible.filter((c) => c.status === "Expiring Soon" || c.status === "Pending Renewal").length;
  const totalValue = visible.reduce((sum, c) => sum + (c.valueUgx ?? 0), 0);

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Contracts Snapshot</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInquiry(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="w-4 h-4" /> Contract Inquiry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <p className="text-xl font-black text-emerald-700">{activeCount}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Active</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <p className="text-xl font-black text-amber-700">{expiringCount}</p>
          <p className="text-[10px] text-amber-600 font-bold uppercase">Expiring / Renewal</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <p className="text-xl font-black text-slate-700">UGX {(totalValue / 1_000_000).toFixed(1)}M</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase">Portfolio Value</p>
        </div>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {visible.slice(0, 40).map((c) => (
          <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-700 truncate">
                  {c.title} — {c.partyName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {c.contractCode} • {c.startDate} → {c.endDate}
                  {c.relatedSiteName ? ` • ${c.relatedSiteName}` : ""}
                  {c.region ? ` • ${c.region}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {c.valueUgx ? (
                <p className="text-[11px] font-black text-slate-700">UGX {(c.valueUgx / 1_000_000).toFixed(1)}M</p>
              ) : null}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${CONTRACT_TONE[c.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
              >
                {c.status}
              </span>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-8">No client contracts available.</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        Values shown for operational planning. Need details or a full copy? Use Contract Inquiry — handled by Records Officer.
      </div>

      {showInquiry && (
        <div className="mt-4">
          <ContractInquiryPanel />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setShowInquiry(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Inquiry
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
