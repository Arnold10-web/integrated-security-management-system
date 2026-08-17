import React, { useState } from "react";
import type { Guard } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { IdentityCardPanel } from "../organisms/IdentityCardPanel";
import { IdentityCardPrintModal } from "../organisms/IdentityCardPrintModal";
import { ContractInquiryPanel } from "./ContractInquiryPanel";
import { RecordsOfficerWorkspace } from "./WorkspaceStrips";

export const RecordsIdentityView: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const [idCardFilter, setIdCardFilter] = useState<"ALL" | "PENDING" | "ISSUED" | "REVOKED">("ALL");
  const [idCardSearch, setIdCardSearch] = useState("");
  const [selectedGuardForCard, setSelectedGuardForCard] = useState<Guard | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const guards = domain.guards;

  return (
    <div className="space-y-6 animate-fadeIn">
      <RecordsOfficerWorkspace />
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
      <ContractInquiryPanel />
    </div>
  );
};
