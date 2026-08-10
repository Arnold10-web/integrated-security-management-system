import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import type { Guard } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { IdentityCardPanel } from "../organisms/IdentityCardPanel";
import { IdentityCardPrintModal } from "../organisms/IdentityCardPrintModal";

export const RecordsIdentityView: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const [idCardFilter, setIdCardFilter] = useState<"ALL" | "PENDING" | "ISSUED" | "REVOKED">("ALL");
  const [idCardSearch, setIdCardSearch] = useState("");
  const [selectedGuardForCard, setSelectedGuardForCard] = useState<Guard | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const guards = domain.guards;
  const pending = guards.filter((g) => g.idCardStatus === "Pending Records Issuance" || !g.idCardStatus).length;
  const active = guards.filter((g) => g.idCardStatus === "Issued & Active").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider border border-cyan-500/30 inline-flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              Records Department • Identity Cards
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Official Personnel Identity Card Issuance</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Capture the holder photo and signature, sign as the issuing Records Officer, and prepare the high-security PVC card for printing. IT retains read-only verification to confirm a card is genuine.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Roster</span>
            <span className="text-lg font-black text-white">{guards.length}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-amber-300 font-bold uppercase block">Pending ID</span>
            <span className="text-lg font-black text-amber-400">{pending}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-center min-w-[110px]">
            <span className="text-[10px] text-emerald-300 font-bold uppercase block">Active Cards</span>
            <span className="text-lg font-black text-emerald-400">{active}</span>
          </div>
        </div>
      </div>

      <IdentityCardPanel
        guards={guards}
        idCardFilter={idCardFilter}
        idCardSearch={idCardSearch}
        onSetIdCardFilter={setIdCardFilter}
        onSetIdCardSearch={setIdCardSearch}
        onSelectGuardForCard={setSelectedGuardForCard}
        onOpenPrintModal={() => setShowPrintModal(true)}
      />

      <IdentityCardPrintModal
        show={showPrintModal}
        guard={selectedGuardForCard}
        onClose={() => { setShowPrintModal(false); setSelectedGuardForCard(null); }}
        onUpdateGuard={domain.updateGuard}
        issuerName={currentUser?.name}
      />
    </div>
  );
};
