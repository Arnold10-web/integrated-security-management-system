/**
 * Contract Inquiry panel (Workflow: any staff → Records Officer answers).
 * - Any role can raise an inquiry (Confirmation or Full Copy).
 * - Records Officer sees the full inbox and responds.
 * - Everyone else sees only their own inquiries with the response status.
 */

import React, { useMemo, useState } from "react";
import { Search, Plus, FileText, CheckCircle2, XCircle, Mail, FileCheck2 } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { useDomainStore } from "../../stores/domainStore";
import { getEffectiveRole } from "../../services/rbacService";
import type { ContractInquiry, UserRole } from "../../types";

const RECORDS_OFFICER: UserRole = "Records Officer";

const INQUIRY_STATUS_STYLE: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Answered: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export const ContractInquiryPanel: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const domain = useDomainStore();
  const activeRole = getEffectiveRole(currentUser) ?? null;

  const isRecordsOfficer = activeRole === RECORDS_OFFICER;
  const myId = currentUser?.id ?? "";
  const myName = currentUser?.name ?? "";

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const mine = useMemo(
    () => domain.contractInquiries.filter((i) => i.requestedBy === myId || i.requestedByName === myName),
    [domain.contractInquiries, myId, myName]
  );
  const visible = isRecordsOfficer ? domain.contractInquiries : mine;

  return (
    <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-600" />
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
            Contract Inquiry {isRecordsOfficer ? "Inbox" : "Outbox"}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-[10px] font-black border border-cyan-200">
            {domain.contractInquiries.filter((i) => isRecordsOfficer || i.requestedBy === myId || i.requestedByName === myName).length}
          </span>
        </div>
        {!isRecordsOfficer && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Inquiry
          </button>
        )}
      </div>

      {isRecordsOfficer && (
        <div className="mb-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
          <strong className="text-slate-800">Records path:</strong> confirm the contract exists (search by client /
          site / hints) and respond with <strong>Confirmation</strong> or a <strong>Full Copy</strong> (browser
          print-to-PDF from the contract file). No self-service contract search exists — this is the only lookup channel.
        </div>
      )}

      <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
        {visible.map((inq) => {
          const isResponding = respondingId === inq.id;
          return (
            <div key={inq.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-700 truncate">
                    {inq.inquiryCode} — {inq.clientName}
                    {inq.siteName ? ` / ${inq.siteName}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {inq.requestedByName} • {inq.requesterDepartment} • Purpose: {inq.purpose}
                  </p>
                  {inq.searchHints && (
                    <p className="text-[11px] text-slate-500 font-medium">Hints: {inq.searchHints}</p>
                  )}
                  {inq.status === "Answered" && (
                    <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      {inq.responseType} • by {inq.respondedBy} • {inq.respondedAt}
                      {inq.responseNotes ? ` — ${inq.responseNotes}` : ""}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${INQUIRY_STATUS_STYLE[inq.status] ?? ""}`}
                >
                  {inq.status}
                </span>
              </div>

              {isRecordsOfficer && inq.status === "Pending" && !isResponding && (
                <div className="mt-3">
                  <button
                    onClick={() => setRespondingId(inq.id)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[11px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Respond
                  </button>
                </div>
              )}

              {isResponding && (
                <RespondForm
                  inquiry={inq}
                  onClose={() => setRespondingId(null)}
                  onSubmit={(data) => {
                    domain.respondToContractInquiry(inq.id, data);
                    setRespondingId(null);
                  }}
                />
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-8">
            {isRecordsOfficer ? "No contract inquiries awaiting response." : "No inquiries yet. Ask Records to confirm a contract."}
          </p>
        )}
      </div>

      {showRequestModal && (
        <RequestInquiryModal
          requesterName={myName}
          requesterId={myId}
          requesterDept={currentUser?.department ?? ""}
          onClose={() => setShowRequestModal(false)}
          onSubmit={(data) => {
            domain.addContractInquiry(data);
            setShowRequestModal(false);
          }}
        />
      )}
    </section>
  );
};

/* ---------------- Respond Form ---------------- */

const RespondForm: React.FC<{
  inquiry: ContractInquiry;
  onClose: () => void;
  onSubmit: (data: { responseType: "Confirmation" | "Full Copy"; responseNotes?: string; responsePath?: string }) => void;
}> = ({ inquiry, onClose, onSubmit }) => {
  const [responseType, setResponseType] = useState<"Confirmation" | "Full Copy">("Confirmation");
  const [responseNotes, setResponseNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      responseType,
      responseNotes: responseNotes || undefined,
      responsePath: responseType === "Full Copy" ? `contract-${inquiry.clientName}-copy` : undefined,
    });
  };

  return (
    <div className="mt-3 p-3 rounded-2xl bg-white border border-cyan-200">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setResponseType("Confirmation")}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${responseType === "Confirmation" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200"}`}
          >
            <FileCheck2 className="w-3.5 h-3.5 inline mr-1" /> Confirmation
          </button>
          <button
            type="button"
            onClick={() => setResponseType("Full Copy")}
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${responseType === "Full Copy" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200"}`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Full Copy (print-to-PDF)
          </button>
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 uppercase">Response Notes</label>
          <textarea
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Contract confirmed — see attached copy. Expiry, parties, value…"
            className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Mark Answered
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------------- Request Modal ---------------- */

const RequestInquiryModal: React.FC<{
  requesterName: string;
  requesterId: string;
  requesterDept: string;
  onClose: () => void;
  onSubmit: (data: Omit<ContractInquiry, "id" | "inquiryCode" | "status">) => void;
}> = ({ requesterName, requesterId, requesterDept, onClose, onSubmit }) => {
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [searchHints, setSearchHints] = useState("");
  const [purpose, setPurpose] = useState<"Confirmation" | "Full Copy">("Confirmation");
  const [requesterDepartment, setRequesterDepartment] = useState(requesterDept || "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      requestedBy: requesterId,
      requestedByName: requesterName,
      requesterDepartment,
      clientName,
      siteName: siteName || undefined,
      searchHints: searchHints || undefined,
      purpose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-800">Contract Inquiry</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer" aria-label="Close">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Client *</label>
            <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / company name" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase">Site</label>
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Site name" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase">Department *</label>
              <input required value={requesterDepartment} onChange={(e) => setRequesterDepartment(e.target.value)} className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Search Hints</label>
            <input value={searchHints} onChange={(e) => setSearchHints(e.target.value)} placeholder="Contract ref, contact person, value range…" className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase">Purpose *</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setPurpose("Confirmation")}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${purpose === "Confirmation" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200"}`}
              >
                Confirm exists
              </button>
              <button
                type="button"
                onClick={() => setPurpose("Full Copy")}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${purpose === "Full Copy" ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200"}`}
              >
                Full copy
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer">
              Send to Records
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
