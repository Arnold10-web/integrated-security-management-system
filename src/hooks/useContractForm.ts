import { useState } from "react";
import type { ContractRecord } from "../types";

export function useContractForm(initialContracts: ContractRecord[] = []) {
  const [contracts, setContracts] = useState<ContractRecord[]>(initialContracts);
  const [contractFilter, setContractFilter] = useState<"ALL" | "Staff Contract" | "Client Contract">("ALL");
  const [showContractModal, setShowContractModal] = useState(false);

  const [contractTitle, setContractTitle] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [contractType, setContractType] = useState<"Staff Contract" | "Client Contract">("Staff Contract");
  const [partyName, setPartyName] = useState("");
  const [category, setCategory] = useState<ContractRecord["category"]>("Guard Employment SLA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [valueUgx, setValueUgx] = useState<number>(12000000);
  const [documentRef, setDocumentRef] = useState("");
  const [notes, setNotes] = useState("");

  const handleAddContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newContract: ContractRecord = {
      id: `ctr-${Date.now()}`,
      contractCode: contractCode || `CTR-${Date.now()}`,
      title: contractTitle,
      contractType,
      partyName,
      category,
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || "2027-12-31",
      valueUgx,
      status: "Active",
      documentRef: documentRef || "DOC-SLA-NEW.pdf",
      managedBy: "HR Records Officer",
      notes,
    };
    setContracts([newContract, ...contracts]);
    setShowContractModal(false);
    setContractTitle("");
    setContractCode("");
    setPartyName("");
  };

  const filteredContracts = contracts.filter((c) => {
    if (contractFilter === "ALL") return true;
    return c.contractType === contractFilter;
  });

  return {
    contracts,
    setContracts,
    contractFilter,
    setContractFilter,
    showContractModal,
    setShowContractModal,
    contractTitle,
    setContractTitle,
    contractCode,
    setContractCode,
    contractType,
    setContractType,
    partyName,
    setPartyName,
    category,
    setCategory,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    valueUgx,
    setValueUgx,
    documentRef,
    setDocumentRef,
    notes,
    setNotes,
    handleAddContractSubmit,
    filteredContracts,
  };
}
