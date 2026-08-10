import { useState } from "react";
import type { LeaveRequest, Guard } from "../types";

export function useLeaveRequestForm(guards: Guard[], initialLeaveRequests: LeaveRequest[] = []) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [leaveFilter, setLeaveFilter] = useState<"ALL" | "Approved" | "Pending HR Review" | "Rejected">("ALL");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [leaveGuardId, setLeaveGuardId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("Annual Leave");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveDurationDays, setLeaveDurationDays] = useState(14);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveReliefGuardName, setLeaveReliefGuardName] = useState("");

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const guard = guards.find((g) => g.id === leaveGuardId) || guards[0];
    const newLeave: LeaveRequest = {
      id: `lev-${Date.now()}`,
      guardId: guard ? guard.id : "grd-101",
      guardName: guard ? guard.fullName : "John Bosco Kateregga",
      guardCode: guard ? guard.guardCode : "SG-2024-001",
      leaveType,
      startDate: leaveStartDate || "2026-08-01",
      endDate: leaveEndDate || "2026-08-14",
      durationDays: Number(leaveDurationDays) || 14,
      reason: leaveReason || "Scheduled annual leave & family rest.",
      reliefGuardName: leaveReliefGuardName || "Assigned Relief Officer",
      appliedDate: new Date().toISOString().split("T")[0],
      status: "Pending HR Review",
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
    leaveGuardId,
    setLeaveGuardId,
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
    leaveReliefGuardName,
    setLeaveReliefGuardName,
    handleCreateLeaveRequest,
    handleApproveLeave,
    handleRejectLeave,
    filteredLeaveRequests,
  };
}
