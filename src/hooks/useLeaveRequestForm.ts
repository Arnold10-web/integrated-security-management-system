import { useState } from "react";
import type { LeaveRequest, SecurityOfficer } from "../types";

export function useLeaveRequestForm(securityOfficers: SecurityOfficer[], initialLeaveRequests: LeaveRequest[] = []) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [leaveFilter, setLeaveFilter] = useState<"ALL" | "Approved" | "Pending HR Approval" | "Rejected">("ALL");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [leaveForceNumber, setLeaveForceNumber] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("Annual Leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveDurationDays, setLeaveDurationDays] = useState(14);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveReliefSecurityOfficerName, setLeaveReliefSecurityOfficerName] = useState("");

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const securityOfficer = securityOfficers.find((g) => g.id === leaveForceNumber) || securityOfficers[0];
    const newLeave: LeaveRequest = {
      id: `lev-${Date.now()}`,
      securityOfficerName: securityOfficer ? securityOfficer.fullName : "John Bosco Kateregga",
      forceNumber: securityOfficer ? securityOfficer.forceNumber : "SG-2024-001",
      leaveType,
      startDate: leaveStartDate || "2026-08-01",
      endDate: leaveEndDate || "2026-08-14",
      durationDays: Number(leaveDurationDays) || 14,
      reason: leaveReason || "Scheduled annual leave & family rest.",
      reliefSecurityOfficerName: leaveReliefSecurityOfficerName || "Assigned Relief Officer",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending HR Approval",
      notes: "Submitted via HR Portal.",
    };
    setLeaveRequests([newLeave, ...leaveRequests]);
    setShowLeaveModal(false);
    setLeaveReason("");
  };

  const handleApproveLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "Approved", approvedBy: "HR Manager" } : l
      )
    );
  };

  const handleRejectLeave = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "Rejected", approvedBy: "HR Manager" } : l
      )
    );
  };

  const filteredLeaveRequests = leaveRequests.filter((l) => {
    if (leaveFilter === "ALL") return true;
    return l.status === leaveFilter;
  });

  return {
    leaveRequests,
    setLeaveRequests,
    leaveFilter,
    setLeaveFilter,
    showLeaveModal,
    setShowLeaveModal,
    leaveForceNumber,
    setLeaveForceNumber,
    leaveType,
    setLeaveType,
    leaveStartDate,
    setLeaveStartDate,
    leaveEndDate,
    setLeaveEndDate,
    leaveDurationDays,
    setLeaveDurationDays,
    leaveReason,
    setLeaveReason,
    leaveReliefSecurityOfficerName,
    setLeaveReliefSecurityOfficerName,
    handleCreateLeaveRequest,
    handleApproveLeave,
    handleRejectLeave,
    filteredLeaveRequests,
  };
}
