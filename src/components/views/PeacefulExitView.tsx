import React, { useState, useMemo } from "react";
import {
  FileCheck,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
} from "lucide-react";
import type { SecurityOfficer, ContractRecord } from "../../types";

interface ClearanceItem {
  id: string;
  department: string;
  signedBy: string;
  signedAt: string;
  status: "Pending" | "Completed";
}

interface OfficerClearance {
  officerId: string;
  items: ClearanceItem[];
  certificateIssued: boolean;
}

const DEPARTMENTS = [
  { id: "uniform", name: "Uniform", owner: "Admin" },
  { id: "firearms", name: "Firearms", owner: "Armorer" },
  { id: "id_card", name: "ID Card", owner: "Records Officer" },
  { id: "equipment", name: "Equipment", owner: "IT" },
  { id: "keys", name: "Keys", owner: "Fleet Manager" },
  { id: "finances", name: "Finances", owner: "Finance" },
  { id: "any_other", name: "Any Other", owner: "HR" },
];

function buildEmptyClearance(): ClearanceItem[] {
  return DEPARTMENTS.map((d) => ({
    id: d.id,
    department: d.name,
    signedBy: "",
    signedAt: "",
    status: "Pending" as const,
  }));
}

function isContractEndingSoon(endDate: string): boolean {
  const end = new Date(endDate);
  const now = new Date();
  const diffDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 90 && diffDays >= -30;
}

interface PeacefulExitViewProps {
  securityOfficers: SecurityOfficer[];
  contracts: ContractRecord[];
  activeRole: string | null;
}

export const PeacefulExitView: React.FC<PeacefulExitViewProps> = ({
  securityOfficers,
  contracts,
  activeRole,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [clearances, setClearances] = useState<Record<string, OfficerClearance>>({});
  const [signOfficerName, setSignOfficerName] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);

  const isHRManager = activeRole === "HR Manager";

  const eligibleOfficers = useMemo(() => {
    const today = new Date();
    return securityOfficers.filter((officer) => {
      if (officer.status === "Archived" || officer.status === "Deserted") return false;
      if (officer.terminationDate) {
        const tDate = new Date(officer.terminationDate);
        if (tDate <= today) return true;
      }
      const officerContracts = contracts.filter(
        (c) => c.relatedForceNumber === officer.forceNumber || c.partyName === officer.fullName
      );
      for (const c of officerContracts) {
        if (isContractEndingSoon(c.endDate) || c.status === "Expired" || c.status === "Terminated") {
          return true;
        }
      }
      if (officer.terminationCategory) return true;
      return false;
    });
  }, [securityOfficers, contracts]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return eligibleOfficers;
    const q = searchTerm.toLowerCase();
    return eligibleOfficers.filter(
      (o) =>
        o.fullName.toLowerCase().includes(q) ||
        o.forceNumber.toLowerCase().includes(q) ||
        o.assignedSite.toLowerCase().includes(q)
    );
  }, [eligibleOfficers, searchTerm]);

  const getClearance = (officerId: string): OfficerClearance => {
    if (!clearances[officerId]) {
      setClearances((prev) => ({
        ...prev,
        [officerId]: { officerId, items: buildEmptyClearance(), certificateIssued: false },
      }));
      return { officerId, items: buildEmptyClearance(), certificateIssued: false };
    }
    return clearances[officerId];
  };

  const markCompleted = (officerId: string, itemId: string) => {
    if (!signOfficerName.trim()) return;
    setClearances((prev) => {
      const existing = prev[officerId] || { officerId, items: buildEmptyClearance(), certificateIssued: false };
      return {
        ...prev,
        [officerId]: {
          ...existing,
          items: existing.items.map((item) =>
            item.id === itemId
              ? { ...item, status: "Completed", signedBy: signOfficerName, signedAt: new Date().toISOString() }
              : item
          ),
        },
      };
    });
  };

  const issueCertificate = (officerId: string) => {
    setClearances((prev) => ({
      ...prev,
      [officerId]: { ...prev[officerId], certificateIssued: true },
    }));
    setShowCertificate(true);
  };

  const selectedOfficer = selectedOfficerId ? securityOfficers.find((o) => o.id === selectedOfficerId) : null;
  const currentClearance = selectedOfficerId ? getClearance(selectedOfficerId) : null;
  const allCompleted = currentClearance?.items.every((i) => i.status === "Completed") ?? false;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 text-violet-400 border border-slate-800 shadow-md">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900">Peaceful Exit Clearance</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-black uppercase tracking-wider border border-violet-200">
                  HR MANAGER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Officer Clearance Checklist • Department Sign-off • Certificate of Clearance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-black">
            {eligibleOfficers.length} eligible
          </span>
        </div>
      </div>

      {!isHRManager && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          Only HR Manager can perform clearance sign-offs.
        </div>
      )}

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="w-full lg:w-80 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search officers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">No eligible officers found.</div>
            )}
            {filtered.map((officer) => {
              const clearance = clearances[officer.id];
              const completed = clearance?.items.filter((i) => i.status === "Completed").length ?? 0;
              const total = 7;
              const isSelected = selectedOfficerId === officer.id;
              return (
                <button
                  key={officer.id}
                  onClick={() => setSelectedOfficerId(officer.id)}
                  className={`w-full text-left p-3 hover:bg-violet-50/50 transition-colors cursor-pointer ${
                    isSelected ? "bg-violet-50 border-l-3 border-violet-600" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{officer.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{officer.forceNumber}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{officer.assignedSite}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {clearance?.certificateIssued ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">
                          Cleared
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500">
                          {completed}/{total}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          {selectedOfficer ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Name</span>
                    <span className="font-bold text-slate-900">{selectedOfficer.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Force Number</span>
                    <span className="font-mono font-bold text-blue-700">{selectedOfficer.forceNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Assigned Site</span>
                    <span className="font-bold text-slate-800">{selectedOfficer.assignedSite}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Join Date</span>
                    <span className="font-bold text-slate-700">{selectedOfficer.joinDate}</span>
                  </div>
                  {selectedOfficer.terminationDate && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Termination Date</span>
                      <span className="font-bold text-red-600">{selectedOfficer.terminationDate}</span>
                    </div>
                  )}
                  {selectedOfficer.terminationReason && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Reason</span>
                      <span className="font-bold text-slate-700">{selectedOfficer.terminationReason}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 block">Designation</span>
                    <span className="font-bold text-slate-800">{selectedOfficer.designation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Status</span>
                    <span className="font-bold text-slate-800">{selectedOfficer.status}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 mb-3">Clearance Checklist</h3>
                <div className="space-y-2">
                  {currentClearance?.items.map((item, idx) => {
                    const dept = DEPARTMENTS.find((d) => d.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          item.status === "Completed"
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900">{item.department}</p>
                            <p className="text-[10px] text-slate-400">Owner: {dept?.owner}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === "Completed" ? (
                            <div className="text-right">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {item.signedBy} — {new Date(item.signedAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : isHRManager ? (
                            <button
                              onClick={() => markCompleted(selectedOfficer.id, item.id)}
                              disabled={!signOfficerName.trim()}
                              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                                signOfficerName.trim()
                                  ? "bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              Sign Off
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isHRManager && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="mb-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department Head Name (for sign-offs)
                    </label>
                    <input
                      type="text"
                      value={signOfficerName}
                      onChange={(e) => setSignOfficerName(e.target.value)}
                      placeholder="e.g. Grace Nakato — HR Manager"
                      className="w-full max-w-md p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <button
                    onClick={() => selectedOfficerId && issueCertificate(selectedOfficerId)}
                    disabled={!allCompleted || currentClearance?.certificateIssued}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all ${
                      allCompleted && !currentClearance?.certificateIssued
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        : currentClearance?.certificateIssued
                          ? "bg-emerald-100 text-emerald-700 cursor-default"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {currentClearance?.certificateIssued ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Certificate Issued
                      </span>
                    ) : allCompleted ? (
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-4 h-4" /> Issue Certificate of Clearance
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Complete All Items First
                      </span>
                    )}
                  </button>
                </div>
              )}

              {currentClearance?.certificateIssued && showCertificate && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
                  <h4 className="text-sm font-black text-emerald-800 mb-2">Certificate of Clearance</h4>
                  <p className="text-xs text-emerald-700 mb-3">
                    This certifies that <strong>{selectedOfficer.fullName}</strong> (Force No. {selectedOfficer.forceNumber}) has been
                    cleared of all obligations to Integrated Security Company Ltd as of{" "}
                    {new Date().toLocaleDateString()}.
                  </p>
                  <div className="text-[10px] text-emerald-600 space-y-0.5">
                    {currentClearance.items.map((item) => (
                      <p key={item.id}>
                        {item.department}: Signed by {item.signedBy} on{" "}
                        {new Date(item.signedAt).toLocaleDateString()}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const w = window.open("", "_blank", "width=800,height=600");
                      if (w) {
                        w.document.write(`<!DOCTYPE html><html><head><title>Certificate of Clearance</title>
<style>body{font-family:'Times New Roman',serif;margin:48px;color:#111;line-height:1.6}
.header{text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:16px;margin-bottom:32px}
.header h1{margin:0;font-size:28px;letter-spacing:2px;color:#1e3a5f}
.header p{margin:4px 0;font-size:13px}
.body{font-size:14px;text-align:justify}
.footer{margin-top:64px;display:flex;justify-content:space-between}
.footer div{width:44%;text-align:center}
.footer .line{border-top:1px solid #000;margin-top:48px;padding-top:6px;font-size:12px}
.stamp{text-align:center;margin-top:32px;font-size:11px;color:#666}
@media print{body{margin:24px}}</style></head><body>
<div class="header"><h1>INTEGRATED SECURITY COMPANY LTD</h1><p>Certificate of Clearance — Peaceful Exit</p></div>
<div class="body"><p>To Whom It May Concern,</p>
<p>This is to certify that <strong>${selectedOfficer.fullName}</strong> (Force Number: ${selectedOfficer.forceNumber}), who served as ${selectedOfficer.designation} at ${selectedOfficer.assignedSite}, has been duly cleared of all obligations to Integrated Security Company Ltd effective ${new Date().toLocaleDateString()}.</p>
<p>All company property including uniform, firearms, identification card, equipment, keys, and financial obligations have been returned/settled as verified below:</p>
<ul>${currentClearance.items.map((i) => `<li><strong>${i.department}</strong> — Signed by ${i.signedBy} on ${new Date(i.signedAt).toLocaleDateString()}</li>`).join("")}</ul>
<p>We wish them all the best in their future endeavors.</p></div>
<div class="footer"><div><b>For Human Resources</b><div class="line">Name, Signature & Date</div></div><div><b>General Manager</b><div class="line">Name, Signature & Date</div></div></div>
<div class="stamp">Generated ${new Date().toISOString().split("T")[0]} • ISCMS Peaceful Exit Module</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);}</script>
</body></html>`);
                        w.document.close();
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> Print Certificate
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">Select an officer to begin clearance</p>
              <p className="text-xs text-slate-400 mt-1">
                Officers with expiring contracts or termination dates are listed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
