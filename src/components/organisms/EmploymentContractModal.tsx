import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, Coins, Download, FileText, Loader2, PenLine, RefreshCw, X } from "lucide-react";
import type { SecurityOfficer, SecurityOfficerEmploymentContract as Contract } from "../../types";
import { domainApi } from "../../services/domainApi";
import { useAuthStore } from "../../stores/authStore";
import { SignaturePad } from "./SignaturePad";

interface EmploymentContractModalProps {
  show: boolean;
  securityOfficer: SecurityOfficer | null;
  onClose: () => void;
}

const STATUS_STEPS = ["Draft", "Officer Signed", "HR Signed", "Filed"] as const;

const stepIndex = (c: Contract | null): number => {
  if (!c) return -1;
  if (c.status === "Fully Signed") return 3;
  if (c.status === "Pending HR Signature" || (c.officerSignatureUrl && !c.hrSignatureUrl)) return 2;
  if (c.status === "Pending Officer Signature") return 1;
  return 0;
};

export const EmploymentContractModal: React.FC<EmploymentContractModalProps> = ({ show, securityOfficer, onClose }) => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const role = currentUser?.role ?? "";
  const isHR = role === "HR Manager" || role === "HR Assistant";
  const isHRManager = role === "HR Manager";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);

  // draft form state
  const [salary, setSalary] = useState(180000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [probationMonths, setProbationMonths] = useState(3);
  const [interpreterName, setInterpreterName] = useState("");
  const [interpreterLanguage, setInterpreterLanguage] = useState("");

  // signature state
  const [officerSig, setOfficerSig] = useState<string | null>(null);
  const [hrSig, setHrSig] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState("");
  const [witnessDesignation, setWitnessDesignation] = useState("");

  const load = useCallback(async () => {
    if (!securityOfficer) return;
    setLoading(true);
    setError(null);
    try {
      const c = await domainApi.securityOfficers.employmentContract.get(securityOfficer.forceNumber);
      setContract(c);
      if (!c) {
        setSalary(securityOfficer.monthlySalaryUgx ?? 180000);
        setStartDate(new Date().toISOString().split("T")[0]);
        setProbationMonths(3);
        setInterpreterName(""); setInterpreterLanguage("");
        setOfficerSig(null); setHrSig(null); setWitnessName(""); setWitnessDesignation("");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [securityOfficer]);

  useEffect(() => {
    if (show) load();
  }, [show, load]);

  if (!show || !securityOfficer) return null;

  const createDraft = async () => {
    setLoading(true); setError(null);
    try {
      const c = await domainApi.securityOfficers.employmentContract.create(securityOfficer.forceNumber, {
        monthlySalaryUgx: Number(salary) || 180000,
        startDate,
        probationMonths: Number(probationMonths) || 3,
        interpreterName: interpreterName || undefined,
        interpreterLanguage: interpreterLanguage || undefined,
      });
      setContract(c);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create contract");
    } finally {
      setLoading(false);
    }
  };

  const signOfficer = async () => {
    if (!officerSig) return;
    setLoading(true); setError(null);
    try {
      const c = await domainApi.securityOfficers.employmentContract.officerSign(securityOfficer.forceNumber, officerSig);
      setContract(c);
      setOfficerSig(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record officer signature");
    } finally {
      setLoading(false);
    }
  };

  const signHr = async () => {
    if (!hrSig) return;
    setLoading(true); setError(null);
    try {
      const c = await domainApi.securityOfficers.employmentContract.hrSign(securityOfficer.forceNumber, {
        signatureUrl: hrSig,
        signerName: currentUser?.name,
        witnessName: witnessName || undefined,
        witnessDesignation: witnessDesignation || undefined,
      });
      setContract(c);
      setHrSig(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record employer signature");
    } finally {
      setLoading(false);
    }
  };

  const idx = stepIndex(contract);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">Employment Contract</h3>
              <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                {securityOfficer.fullName} · {securityOfficer.forceNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-bold">{error}</div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm font-bold">Loading contract…</span>
            </div>
          )}

          {!loading && !contract && !isHR && (
            <div className="text-center py-8 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">No employment contract has been issued yet.</p>
              <p className="text-xs text-slate-400">The HR department drafts and executes contracts on behalf of the Company.</p>
            </div>
          )}

          {!loading && !contract && isHR && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-bold text-blue-800">
                Draft a Contract of Employment (Security Officer). The canonical PDF is generated automatically once both parties have signed on-screen.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1"><Coins className="w-3 h-3" /> Monthly Salary (UGX)</span>
                  <input type="number" min={1} value={salary} onChange={(e) => setSalary(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Start Date</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation (months)</span>
                  <input type="number" min={0} max={12} value={probationMonths} onChange={(e) => setProbationMonths(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-400" />
                </label>
                <div />
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Interpreter Name (optional)</span>
                  <input value={interpreterName} onChange={(e) => setInterpreterName(e.target.value)} placeholder="If the contract was interpreted"
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-400" />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Interpretation Language</span>
                  <input value={interpreterLanguage} onChange={(e) => setInterpreterLanguage(e.target.value)} placeholder="e.g. Luganda"
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-blue-400" />
                </label>
              </div>
              <button onClick={createDraft} disabled={loading || !startDate}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-md cursor-pointer disabled:opacity-50">
                Create Contract Draft
              </button>
            </div>
          )}

          {!loading && contract && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contract No.</p>
                  <p className="font-mono font-bold text-slate-900 text-sm">{contract.contractCode}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Salary</p>
                  <p className="font-bold text-emerald-700 text-sm">UGX {contract.monthlySalaryUgx.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</p>
                  <p className="font-bold text-slate-900 text-sm">{contract.startDate}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation</p>
                  <p className="font-bold text-slate-900 text-sm">{contract.probationMonths} month(s)</p>
                </div>
              </div>

              {/* Status trail */}
              <div className="flex items-center gap-1.5">
                {STATUS_STEPS.map((step, i) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${i <= idx && idx >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                      {i <= idx && idx >= 0 ? <Check className="w-3 h-3" /> : null}
                      {step}
                    </div>
                    {i < STATUS_STEPS.length - 1 && <span className="text-slate-300 text-[10px]">→</span>}
                  </React.Fragment>
                ))}
              </div>

              {contract.status !== "Fully Signed" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Officer signature */}
                  <div className={`rounded-2xl border p-4 ${contract.officerSignatureUrl ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <PenLine className="w-3.5 h-3.5" /> Employee Signature — {securityOfficer.fullName}
                    </p>
                    {contract.officerSignatureUrl ? (
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                        <Check className="w-4 h-4" /> Signed{contract.officerSignedAt ? ` on ${new Date(contract.officerSignedAt).toLocaleDateString()}` : ""}
                      </div>
                    ) : isHR ? (
                      <>
                        <SignaturePad onChange={setOfficerSig} holderName={securityOfficer.fullName} height={120} />
                        <button onClick={signOfficer} disabled={!officerSig || loading}
                          className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-40">
                          Record Employee Signature
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold">Awaiting employee signature.</p>
                    )}
                  </div>

                  {/* Employer signature */}
                  <div className={`rounded-2xl border p-4 ${contract.hrSignatureUrl ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <PenLine className="w-3.5 h-3.5" /> Employer Signature — Pyramid Security Group Ltd
                    </p>
                    {contract.hrSignatureUrl ? (
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                        <Check className="w-4 h-4" /> Signed by {contract.hrSignerName}{contract.hrSignedAt ? ` on ${new Date(contract.hrSignedAt).toLocaleDateString()}` : ""}
                      </div>
                    ) : isHRManager ? (
                      <>
                        <SignaturePad onChange={setHrSig} holderName={currentUser?.name ?? "HR Manager"} height={120} />
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} placeholder="Witness name"
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400" />
                          <input value={witnessDesignation} onChange={(e) => setWitnessDesignation(e.target.value)} placeholder="Witness designation"
                            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400" />
                        </div>
                        <button onClick={signHr} disabled={!hrSig || loading}
                          className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-40">
                          Record Employer Signature
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold">Only the HR Manager may execute the employer signature.</p>
                    )}
                  </div>

                  {(isHR || isHRManager) && (
                    <button onClick={load} className="md:col-span-2 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                      <RefreshCw className="w-3 h-3" /> Refresh status
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-black text-emerald-800 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" /> Fully Signed</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Both parties executed {contract.contractCode}. The canonical PDF is filed in the Records vault
                        {contract.checksum ? ` (sha256 ${contract.checksum.slice(0, 16)}…)` : ""}.
                      </p>
                    </div>
                    {contract.pdfPath && (
                      <a href={`/uploads/${encodeURIComponent(contract.pdfPath)}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer whitespace-nowrap">
                        <Download className="w-4 h-4" /> Contract PDF
                      </a>
                    )}
                  </div>
                  {(contract.interpreterName || contract.witnessName) && (
                    <div className="text-xs text-slate-500 font-semibold space-y-1">
                      {contract.interpreterName && (
                        <p>Interpreted to the employee in <span className="font-bold text-slate-700">{contract.interpreterLanguage || "a local language"}</span> by {contract.interpreterName}.</p>
                      )}
                      {contract.witnessName && (
                        <p>Witness: <span className="font-bold text-slate-700">{contract.witnessName}</span>{contract.witnessDesignation ? ` (${contract.witnessDesignation})` : ""}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
