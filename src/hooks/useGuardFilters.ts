import { useState, useMemo } from "react";
import type { Guard } from "../types";

export function useGuardFilters(guards: Guard[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [guardStatusFilter, setGuardStatusFilter] = useState<"ALL" | "DESERTERS" | "ACTIVE">("ALL");

  const desertersCount = useMemo(
    () => guards.filter((g) => g.status === "Deserted" || g.isDeserter).length,
    [guards]
  );

  const filteredGuards = useMemo(() => {
    return guards.filter((g) => {
      const isDeserterGuard = g.status === "Deserted" || g.isDeserter;
      if (guardStatusFilter === "DESERTERS" && !isDeserterGuard) return false;
      if (guardStatusFilter === "ACTIVE" && isDeserterGuard) return false;

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
  }, [guards, guardStatusFilter, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    guardStatusFilter,
    setGuardStatusFilter,
    desertersCount,
    filteredGuards,
  };
}
