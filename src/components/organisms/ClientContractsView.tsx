import React, { useState } from "react";
import { Plus, ShieldCheck, Pencil, Ban, FolderArchive, FileText, ArrowUp, ArrowDown, Trash2, ImagePlus } from "lucide-react";
import type { ContractRecord, ContractScanPage, UserRole } from "../../types";
import { canAdvanceApproval, canEditContract, canProvideSiteSurvey, canVoidContract } from "../../utils/contracts";

interface ClientContractsViewProps {
  contracts: ContractRecord[];
  activeRole?: UserRole;
  title?: string;
  onAddContract?: (c: Omit<ContractRecord, "id">) => void;
  onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void;
  onAdvanceApproval?: (id: string) => void;
  onVoidContract?: (id: string, reason: string) => void;
  onArchiveContract?: (id: string) => void;
}

const stepLabel: Record<string, string> = {
  BD: "Awaiting Business Development Approval",
  Finance: "Awaiting Finance Validation",
  GM: "Awaiting GM Approval",
  Done: "Approved",
};

export const ClientContractsView: React.FC<ClientContractsViewProps> = ({
  contracts,
  activeRole,
  title = "Client Contracts & Approvals",
  onAddContract,
  onUpdateContract,
  onAdvanceApproval,
  onVoidContract,
  onArchiveContract,
}) => {
  const clientContracts = contracts.filter((c) => c.contractType === "Client Contract");
  const canCreate = ["Business Development Manager", "Sales and Marketing Supervisor"].includes(activeRole ?? "");

  const [showForm, setShowForm] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fCode, setFCode] = useState("");
  const [fParty, setFParty] = useState("");
  const [fCat, setFCat] = useState<ContractRecord["category"]>("Corporate Client Service Agreement");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fVal, setFVal] = useState(5000000);
  const [fSla, setFSla] = useState("");
  const [fPayment, setFPayment] = useState("");
  const [fBilling, setFBilling] = useState("");
  const [fRegion, setFRegion] = useState("");
  const [fSite, setFSite] = useState("");

  const [expandedScans, setExpandedScans] = useState<string | null>(null);

  const handleAddScan = (c: ContractRecord, file: File) => {
    if (!onUpdateContract) return;
    const reader = new FileReader();
    reader.onload = () => {
      const pages = c.scanPages ?? [];
      const page: ContractScanPage = {
        id: `scan-${Date.now()}`,
        pageNo: pages.length + 1,
        name: file.name || `Page ${pages.length + 1}`,
        dataUrl: String(reader.result),
      };
      onUpdateContract(c.id, { scanPages: [...pages, page] });
    };
    reader.readAsDataURL(file);
  };

  const handleMoveScan = (c: ContractRecord, index: number, dir: -1 | 1) => {
    if (!onUpdateContract) return;
    const pages = [...(c.scanPages ?? [])];
    const target = index + dir;
    if (target < 0 || target >= pages.length) return;
    [pages[index], pages[target]] = [pages[target], pages[index]];
    onUpdateContract(c.id, { scanPages: pages.map((p, i) => ({ ...p, pageNo: i + 1 })) });
  };

  const handleRemoveScan = (c: ContractRecord, id: string) => {
    if (!onUpdateContract) return;
    const pages = (c.scanPages ?? []).filter((p) => p.id !== id);
    onUpdateContract(c.id, { scanPages: pages.map((p, i) => ({ ...p, pageNo: i + 1 })) });
  };

  const printContractTemplate = (c: ContractRecord) => {
    const w = window.open("", "_blank", "width=900,height=750");
    if (!w) return;
    const fmt = (n?: number) => (n == null ? "—" : n.toLocaleString());
    w.document.write(`<!DOCTYPE html><html><head><title>${c.contractCode} — ${c.title}</title>
<style>
  body{font-family:'Times New Roman',serif;color:#111;margin:48px;line-height:1.6}
  .head{text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:16px;margin-bottom:28px}
  .head h1{margin:0;font-size:26px;letter-spacing:1px;color:#1e3a5f}
  .head p{margin:2px 0;font-size:12px}
  h2{font-size:16px;border-bottom:1px solid #999;padding-bottom:4px;margin-top:26px}
  .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc;font-size:13px}
  .row span:first-child{color:#444}
  .clause{font-size:13px;text-align:justify;margin:10px 0}
  .sig{margin-top:56px;display:flex;justify-content:space-between}
  .sig div{width:44%;text-align:center}
  .sig .line{border-top:1px solid #000;margin-top:44px;padding-top:6px;font-size:12px}
  @media print{body{margin:24px}}
</style></head><body>
<div class="head">
  <img src="/logo.png" alt="ISCMS" style="height:56px;object-fit:contain;margin-bottom:8px" onerror="this.style.display='none'"/>
  <h1>INTEGRATED SECURITY COMPANY LTD</h1>
  <p>Integrated Security Company Management System (ISCMS)</p>
  <p>Contract Reference: <b>${c.contractCode}</b></p>
</div>
<h2>1. Parties</h2>
<div class="row"><span>Service Provider</span><span>Integrated Security Company Ltd</span></div>
<div class="row"><span>Client / Counterparty</span><span>${c.partyName}</span></div>
<div class="row"><span>Contract Type</span><span>${c.contractType} — ${c.category}</span></div>
<div class="row"><span>Site / Post</span><span>${c.relatedSiteName || c.region || "—"}</span></div>
<h2>2. Term &amp; Value</h2>
<div class="row"><span>Commencement</span><span>${c.startDate}</span></div>
<div class="row"><span>Expiry</span><span>${c.endDate}</span></div>
<div class="row"><span>Contract Value</span><span>UGX ${fmt(c.valueUgx)} / ${c.billingCycle || "term"}</span></div>
<div class="row"><span>Payment Terms</span><span>${c.paymentTerms || "As agreed"}</span></div>
<div class="row"><span>Auto-Renewal</span><span>${c.autoRenew ? "Yes — automatic renewal" : "No — manual renewal required"}</span></div>
<h2>3. Scope of Service (SLA)</h2>
<div class="clause">${(c.slaTerms || "Security services to be rendered in line with the Service Level Agreement and prevailing regulatory requirements.").replace(/\n/g, "<br/>")}</div>
<h2>4. Records &amp; Approvals</h2>
<div class="row"><span>Prepared By</span><span>${c.preparedBy || c.createdBy || "—"}</span></div>
<div class="row"><span>Approved By</span><span>${c.approvedBy || "Pending approval"}</span></div>
<div class="row"><span>Approved On</span><span>${c.approvedAt || "—"}</span></div>
<div class="row"><span>Managed By</span><span>${c.managedBy || "Records Officer"}</span></div>
<div class="row"><span>Document Reference</span><span>${c.documentRef || c.contractCode}</span></div>
<div class="clause">This printed copy is generated from the Integrated Security Company Management System records vault. It reproduces the currently approved terms and should be read together with the signed counterpart and attached scanned pages.</div>
<div class="sig">
  <div><b>For the Client / Counterparty</b><div class="line">Name, Signature &amp; Date</div></div>
  <div><b>For Integrated Security Company Ltd</b><div class="line">Name, Signature &amp; Date</div></div>
</div>
<p style="text-align:center;font-size:11px;color:#777;margin-top:40px">Generated ${new Date().toISOString().split("T")[0]} • ISCMS Records Vault</p>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    w.document.close();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddContract?.({
      contractCode: fCode || `CTR-CLI-${Date.now()}`,
      title: fTitle,
      contractType: "Client Contract",
      partyName: fParty,
      category: fCat,
      startDate: fStart || new Date().toISOString().split("T")[0],
      endDate: fEnd || "2027-12-31",
      valueUgx: fVal,
      status: "Draft",
      documentRef: `DOC-SLA-${fCode || Date.now()}.pdf`,
      managedBy: "Records Officer",
      region: fRegion,
      slaTerms: fSla,
      paymentTerms: fPayment,
      billingCycle: fBilling,
      relatedSiteName: fSite,
    });
    setShowForm(false);
    setFTitle(""); setFCode(""); setFParty(""); setFStart(""); setFEnd("");
    setFSla(""); setFPayment(""); setFBilling(""); setFRegion(""); setFSite("");
  };

  const editByRole = (c: ContractRecord) => {
    if (!activeRole || !onUpdateContract) return;
    if (activeRole === "Finance Manager") {
      const v = window.prompt("Update contract value (UGX):", String(c.valueUgx ?? ""));
      if (v !== null && !isNaN(Number(v))) {
        onUpdateContract(c.id, { valueUgx: Number(v) });
      }
    } else {
      const v = window.prompt("Update SLA scope:", c.slaTerms || "");
      if (v !== null) onUpdateContract(c.id, { slaTerms: v });
    }
  };

  const handleSiteSurvey = (c: ContractRecord) => {
    if (!onUpdateContract) return;
    const v = window.prompt("Record site survey (feasibility / staffing assessment):", c.siteSurvey || "");
    if (v?.trim()) {
      onUpdateContract(c.id, { ...({ action: "survey", siteSurvey: v.trim() } as Partial<ContractRecord>) });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
          <p className="text-xs text-slate-500">
            Commercial agreements in the Records vault — track approval steps and expiry.
          </p>
        </div>
        {canCreate && onAddContract && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Client Contract
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {clientContracts.map((c) => (
          <div key={c.id} className="border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-indigo-300 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[9px] rounded-md">{c.contractCode}</span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-1">{c.title}</h4>
                <p className="text-[11px] text-indigo-700 font-bold">{c.partyName}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                c.status === "Active" ? "bg-emerald-100 text-emerald-800"
                : c.status === "Draft" ? "bg-indigo-100 text-indigo-800"
                : c.status === "Expiring Soon" ? "bg-amber-100 text-amber-800"
                : c.status === "Expired" ? "bg-red-100 text-red-800"
                : c.status === "Archived" ? "bg-slate-100 text-slate-600"
                : c.status === "Terminated" ? "bg-slate-200 text-slate-700"
                : "bg-sky-100 text-sky-800"
              }`}>{c.status}</span>
            </div>

            <div className="text-[10px] font-bold text-slate-500">
              {c.relatedSiteName && <p>Site: {c.relatedSiteName}</p>}
              <p>{c.startDate} → {c.endDate}</p>
              {c.valueUgx ? <p className="text-slate-800">{c.valueUgx.toLocaleString()} UGX / {c.billingCycle || "term"}</p> : null}
            </div>

            {c.contractType === "Client Contract" && c.status === "Draft" && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-indigo-800">
                {stepLabel[c.approvalStep ?? "BD"] ?? c.approvalStep}
              </div>
            )}

            {c.siteSurvey && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                <p className="text-[9px] font-black uppercase tracking-wide text-emerald-700">
                  Site Survey {c.siteSurveyAt ? `· ${c.siteSurveyAt}` : ""} {c.siteSurveyBy ? `· by ${c.siteSurveyBy}` : ""}
                </p>
                <p className="text-[10px] text-slate-700 mt-0.5 leading-snug">{c.siteSurvey}</p>
              </div>
            )}

            <div className="flex items-center gap-1.5 pt-1">
              {canAdvanceApproval(c, activeRole) && onAdvanceApproval && (
                <button
                  onClick={() => onAdvanceApproval(c.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" /> Approve Step
                </button>
              )}
              {canProvideSiteSurvey(activeRole) && onUpdateContract && (
                <button
                  onClick={() => handleSiteSurvey(c)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg cursor-pointer"
                  title="Record site survey supporting info (not an approval)"
                >
                  <ShieldCheck className="w-3 h-3" /> {c.siteSurvey ? "Update Survey" : "Site Survey"}
                </button>
              )}
              {canEditContract(c, activeRole) && onUpdateContract && (
                <button
                  onClick={() => editByRole(c)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
              {canVoidContract(c, activeRole) && onVoidContract && (
                <button
                  onClick={() => {
                    const reason = window.prompt(`Void ${c.title}? Reason:`, "");
                    if (reason?.trim()) onVoidContract(c.id, reason.trim());
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  <Ban className="w-3 h-3" /> Void
                </button>
              )}
              {activeRole === "Records Officer" && onArchiveContract && c.status !== "Archived" && (
                <button
                  onClick={() => onArchiveContract(c.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                >
                  <FolderArchive className="w-3 h-3" /> Archive
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => printContractTemplate(c)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg cursor-pointer"
              >
                <FileText className="w-3 h-3" /> Print Template
              </button>
              {onUpdateContract && (
                <button
                  onClick={() => setExpandedScans(expandedScans === c.id ? null : c.id)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 font-bold text-[10px] rounded-lg cursor-pointer ${
                    expandedScans === c.id ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  }`}
                >
                  <ImagePlus className="w-3 h-3" /> Scans ({c.scanPages?.length ?? 0})
                </button>
              )}
            </div>

            {expandedScans === c.id && onUpdateContract && (
              <div className="border border-indigo-200 rounded-xl bg-indigo-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wide text-indigo-800">Scan Pages — Records Vault</span>
                  <label className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer">
                    <Plus className="w-3 h-3" /> Add Page
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAddScan(c, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {(c.scanPages ?? []).length === 0 ? (
                  <p className="text-[10px] text-indigo-700/70 italic">No scanned pages yet. Add scans of the signed document, one page per upload.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(c.scanPages ?? []).map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2 bg-white border border-indigo-100 rounded-lg p-1.5">
                        {p.dataUrl && (
                          <img src={p.dataUrl} alt={p.name} className="w-10 h-12 object-cover rounded-md border border-slate-200 bg-white" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-800 block truncate">Page {p.pageNo} — {p.name}</span>
                          <span className="text-[9px] text-slate-400">{p.dataUrl ? `${Math.round(p.dataUrl.length / 1024)} KB` : "preview"}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => handleMoveScan(c, idx, -1)} disabled={idx === 0}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" title="Move up">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleMoveScan(c, idx, 1)} disabled={idx === (c.scanPages?.length ?? 1) - 1}
                            className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" title="Move down">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (window.confirm(`Remove page ${p.pageNo} (${p.name})?`)) handleRemoveScan(c, p.id); }}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-50 cursor-pointer" title="Delete page">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {clientContracts.length === 0 && (
          <p className="text-xs text-slate-400 col-span-full">No client contracts recorded yet.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">New Client Contract (Draft)</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={submit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contract Title</label>
                  <input type="text" required value={fTitle} onChange={(e) => setFTitle(e.target.value)}
                    placeholder="e.g. Bank HQ Guarding SLA" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contract Code</label>
                  <input type="text" value={fCode} onChange={(e) => setFCode(e.target.value)}
                    placeholder="e.g. CTR-CLI-2026-11" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Company</label>
                <input type="text" required value={fParty} onChange={(e) => setFParty(e.target.value)}
                  placeholder="e.g. East African Banking Corp" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select value={fCat} onChange={(e) => setFCat(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                    <option value="Corporate Client Service Agreement">Corporate Client Service Agreement</option>
                    <option value="Retail Site Agreement">Retail Site Agreement</option>
                    <option value="Vendor SLA">Vendor SLA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Region</label>
                  <input type="text" value={fRegion} onChange={(e) => setFRegion(e.target.value)}
                    placeholder="e.g. Kampala Central" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date</label>
                  <input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Value (UGX)</label>
                  <input type="number" value={fVal} onChange={(e) => setFVal(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billing Cycle</label>
                  <select value={fBilling} onChange={(e) => setFBilling(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                    <option value="">— Select —</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Related Site</label>
                <input type="text" value={fSite} onChange={(e) => setFSite(e.target.value)}
                  placeholder="e.g. BEA HQ Nakasero" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Terms</label>
                <input type="text" value={fPayment} onChange={(e) => setFPayment(e.target.value)}
                  placeholder="e.g. Monthly in advance" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">SLA / Service Scope</label>
                <textarea rows={2} value={fSla} onChange={(e) => setFSla(e.target.value)}
                  placeholder="Guard numbers, patrols, response times..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer">Save Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
