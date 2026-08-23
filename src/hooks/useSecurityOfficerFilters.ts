import { useState, useMemo } from "react";
import type { SecurityOfficer } from "../types";

export function useSecurityOfficerFilters(securityOfficers: SecurityOfficer[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [securityOfficerStatusFilter, setSecurityOfficerStatusFilter] = useState<"ALL" | "DESERTERS" | "ACTIVE">("ALL");

  const desertersCount = useMemo(
    () => securityOfficers.filter((g) => g.status === "Deserted" || g.isDeserter).length,
    [securityOfficers]
  );

  const filteredSecurityOfficers = useMemo(() => {
    return securityOfficers.filter((g) => {
      const isDeserterSecurityOfficer = g.status === "Deserted" || g.isDeserter;
      if (securityOfficerStatusFilter === "DESERTERS" && !isDeserterSecurityOfficer) return false;
      if (securityOfficerStatusFilter === "ACTIVE" && isDeserterSecurityOfficer) return false;

      const query = searchTerm.toLowerCase();
      return (
        g.fullName.toLowerCase().includes(query) ||
        g.forceNumber.toLowerCase().includes(query) ||
        g.assignedSite.toLowerCase().includes(query) ||
        (g.location && g.location.toLowerCase().includes(query)) ||
        (g.bankAccount && g.bankAccount.toLowerCase().includes(query)) ||
        (g.bankName && g.bankName.toLowerCase().includes(query))
      );
    });
  }, [securityOfficers, securityOfficerStatusFilter, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    securityOfficerStatusFilter,
    setSecurityOfficerStatusFilter,
    desertersCount,
    filteredSecurityOfficers,
  };
}
