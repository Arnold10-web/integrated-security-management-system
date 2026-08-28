import React, { useState } from "react";
import type { SecurityOfficer } from "../../types";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { IdentityCardPanel } from "../organisms/IdentityCardPanel";
import { IdentityCardPrintModal } from "../organisms/IdentityCardPrintModal";
import { ContractInquiryPanel } from "./ContractInquiryPanel";

export const RecordsIdentityView: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const [idCardFilter, setIdCardFilter] = useState<"ALL" | "PENDING" | "ISSUED" | "REVOKED">("ALL");
  const [idCardSearch, setIdCardSearch] = useState("");
  const [selectedSecurityOfficerForCard, setSelectedSecurityOfficerForCard] = useState<SecurityOfficer | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const securityOfficers = domain.securityOfficers;

  return (
    <div className="space-y-6 animate-fadeIn">
      <IdentityCardPanel
        securityOfficers={securityOfficers}
        idCardFilter={idCardFilter}
        idCardSearch={idCardSearch}
        onSetIdCardFilter={setIdCardFilter}
        onSetIdCardSearch={setIdCardSearch}
        onSelectSecurityOfficerForCard={setSelectedSecurityOfficerForCard}
        onOpenPrintModal={() => setShowPrintModal(true)}
      />

      <IdentityCardPrintModal
        show={showPrintModal}
        securityOfficer={selectedSecurityOfficerForCard}
        onClose={() => { setShowPrintModal(false); setSelectedSecurityOfficerForCard(null); }}
        onUpdateSecurityOfficer={domain.updateSecurityOfficer}
        issuerName={currentUser?.name}
      />
      <ContractInquiryPanel />
    </div>
  );
};
