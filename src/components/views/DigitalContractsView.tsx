import React, { useEffect, useState, useCallback } from "react";
import {
  FileText, Upload, Download, Archive, Clock, Shield, AlertTriangle,
  Plus, Eye, Trash2, X, Send, CheckCircle, Stamp, History,
} from "lucide-react";
import { getAccessToken } from "../../services/apiClient";
import { SimpleTemplateUploader } from "../organisms/SimpleTemplateUploader";
import { DigitalContractWizard } from "../organisms/DigitalContractWizard";

type DigitalTemplate = {
  id: string;
  name: string;
  category: string;
  description?: string;
  pdfFileName: string;
  pageCount: number;
  version: number;
  isActive: boolean;
  createdAt: string;
};

type DigitalContract = {
  id: string;
  contractId: string;
  contractType: string;
  title: string;
  category: string;
  status: string;
  partyName?: string;
  clientAbbreviation?: string;
  forceNumber?: string;
  startDate?: string;
  endDate?: string;
  valueUgx?: number;
  isScanned: boolean;
  isArchived: boolean;
  createdAt: string;
  signers?: Array<{ signerName: string; signerTitle?: string; isCompleted: boolean; signingOrder: number }>;
  auditLogs?: Array<{ eventType: string; description?: string; performedBy?: string; ipAddress?: string; userAgent?: string; createdAt: string }>;
};

type ViewMode = "list" | "create-template" | "create-contract";

export const DigitalContractsView: React.FC = () => {
  const [templates, setTemplates] = useState<DigitalTemplate[]>([]);
  const [contracts, setContracts] = useState<DigitalContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "contracts">("templates");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [scanModal, setScanModal] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanTitle, setScanTitle] = useState("");
  const [scanPartyName, setScanPartyName] = useState("");
  const [scanAbbreviation, setScanAbbreviation] = useState("");
  const [scanCategory, setScanCategory] = useState("Client");
  const [scanUploading, setScanUploading] = useState(false);
  const [detailContract, setDetailContract] = useState<DigitalContract | null>(null);
  const [sendModal, setSendModal] = useState<DigitalContract | null>(null);

  const headers = useCallback(() => {
    const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
    return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, cRes] = await Promise.all([
        fetch("/api/digital-contract-templates", { headers: headers() as any }),
        fetch("/api/digital-contracts", { headers: headers() as any }),
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTemplates(tData.data || tData.templates || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setContracts(cData.data || cData.contracts || []);
      }
      if (!tRes.ok || !cRes.ok) setError("Some data failed to load");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FullySigned": return "bg-emerald-100 text-emerald-700";
      case "PendingSigning": return "bg-blue-100 text-blue-700";
      case "PendingApproval": return "bg-amber-100 text-amber-700";
      case "PartiallySigned": return "bg-orange-100 text-orange-700";
      case "Draft": return "bg-slate-100 text-slate-700";
      case "Archived": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Client": return "bg-blue-100 text-blue-700";
      case "Staff": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Client": return "bg-blue-100 text-blue-700";
      case "Staff": return "bg-green-100 text-green-700";
      case "Scanned": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleTemplateSave = async (name: string, category: string, description: string, pdfFile: File) => {
    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("name", name);
    formData.append("category", category);
    formData.append("description", description);

    const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
    const res = await fetch("/api/digital-contract-templates", {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save template");
    }
    setViewMode("list");
    fetchAll();
  };

  const handleContractCreated = () => {
    setViewMode("list");
    fetchAll();
  };

  const fetchContractDetail = async (contractId: string) => {
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch(`/api/digital-contracts/${contractId}`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
      if (!res.ok) throw new Error("Failed to fetch contract details");
      const data = await res.json();
      setDetailContract(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = async (contractId: string, title: string) => {
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch(`/api/digital-contracts/${contractId}/download`, {
        headers: t ? { Authorization: `Bearer ${t}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchive = async (contractId: string) => {
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch(`/api/digital-contracts/${contractId}/archive`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Archive failed");
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (contractId: string) => {
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch(`/api/digital-contracts/${contractId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve");
      }
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendForSigning = async (contractId: string) => {
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch(`/api/digital-contracts/${contractId}/send-for-signing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send for signing");
      }
      setSendModal(null);
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleScanUpload = async () => {
    if (!scanFile) return;
    setScanUploading(true);
    try {
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const formData = new FormData();
      formData.append("pdf", scanFile);
      formData.append("title", scanTitle || scanFile.name);
      formData.append("category", scanCategory);
      formData.append("partyName", scanPartyName);
      formData.append("clientAbbreviation", scanAbbreviation);

      const res = await fetch("/api/digital-contracts/scan-upload", {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      setScanModal(false);
      setScanFile(null);
      setScanTitle("");
      setScanPartyName("");
      setScanAbbreviation("");
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScanUploading(false);
    }
  };

  // ── Template Upload View ──
  if (viewMode === "create-template") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setViewMode("list")}
            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Back to Templates
          </button>
        </div>
        <SimpleTemplateUploader onSave={handleTemplateSave} onCancel={() => setViewMode("list")} />
      </div>
    );
  }

  // ── Contract Wizard View ──
  if (viewMode === "create-contract") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setViewMode("list")}
            className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Back to Contracts
          </button>
        </div>
        <DigitalContractWizard onCreated={handleContractCreated} onCancel={() => setViewMode("list")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-wrap justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Legal & Contracts</div>
          <h1 className="text-xl font-black mt-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" /> Digital Contracts
          </h1>
          <p className="text-xs text-slate-400 mt-1">PDF-based contracts with secure signing, tamper-evident PDFs, and eIDAS + ESIGN Act compliance.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="px-3 py-2 bg-white text-slate-900 rounded-lg text-xs font-semibold">
            Refresh
          </button>
          <button
            onClick={() => setScanModal(true)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Upload className="w-3 h-3" /> Upload Scanned
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === "templates" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}
        >
          <FileText className="w-3 h-3 inline mr-1" /> Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`px-4 py-2 rounded-lg text-xs font-semibold ${activeTab === "contracts" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}`}
        >
          <Clock className="w-3 h-3 inline mr-1" /> Contracts ({contracts.length})
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {/* Company Stamp Section */}
          <CompanyStampSection headers={headers} />

          {/* Templates Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between">
              <div>
                <h3 className="font-bold text-sm">Contract Templates</h3>
                <p className="text-xs text-slate-600 mt-1">Fixed PDF legal documents. Upload once, use for many contracts.</p>
              </div>
              <button
                onClick={() => setViewMode("create-template")}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Upload Template
              </button>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[11px]">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Pages</th>
                  <th className="text-left px-3 py-2">Version</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{t.name}</div>
                      <div className="text-slate-600 truncate max-w-[200px]">{t.pdfFileName}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getCategoryColor(t.category)}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-3 py-2">{t.pageCount}</td>
                    <td className="px-3 py-2">v{t.version}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <button className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[11px] inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      {loading ? "Loading..." : "No templates yet. Upload a fixed PDF template to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === "contracts" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between">
            <div>
              <h3 className="font-bold text-sm">Digital Contracts</h3>
              <p className="text-xs text-slate-600 mt-1">Contracts created from templates with secure sequential signing.</p>
            </div>
            <button
              onClick={() => setViewMode("create-contract")}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New Contract
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900 text-slate-300 uppercase text-[11px]">
                <tr>
                  <th className="text-left px-3 py-2">Contract ID</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Party</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-900 font-mono">{c.contractId}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getTypeColor(c.contractType)}`}>
                        {c.contractType}
                      </span>
                    </td>
                    <td className="px-3 py-2">{c.partyName || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right space-x-1">
                      <button
                        onClick={() => fetchContractDetail(c.id)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Details
                      </button>
                      {c.status === "Draft" && c.contractType === "Client" && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                      )}
                      {c.status === "PendingSigning" && (
                        <button
                          onClick={() => setSendModal(c)}
                          className="px-2 py-1 bg-cyan-600 text-white rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send
                        </button>
                      )}
                      {c.status === "FullySigned" && (
                        <button
                          onClick={() => handleDownload(c.id, c.title)}
                          className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      )}
                      {!c.isArchived && c.status !== "Draft" && (
                        <button
                          onClick={() => handleArchive(c.id)}
                          className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {contracts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      {loading ? "Loading..." : "No contracts yet. Create one from a template."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Contract Detail Modal ── */}
      {detailContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setDetailContract(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-sm">{detailContract.title}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">{detailContract.contractId}</p>
              </div>
              <button onClick={() => setDetailContract(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500 font-semibold">Type:</span> <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getTypeColor(detailContract.contractType)}`}>{detailContract.contractType}</span></div>
                <div><span className="text-slate-500 font-semibold">Status:</span> <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(detailContract.status)}`}>{detailContract.status}</span></div>
                {detailContract.partyName && <div><span className="text-slate-500 font-semibold">Party:</span> <span className="text-slate-900">{detailContract.partyName}</span></div>}
                {detailContract.clientAbbreviation && <div><span className="text-slate-500 font-semibold">Abbreviation:</span> <span className="text-slate-900">{detailContract.clientAbbreviation}</span></div>}
                {detailContract.forceNumber && <div><span className="text-slate-500 font-semibold">Force No:</span> <span className="text-slate-900">{detailContract.forceNumber}</span></div>}
                {detailContract.startDate && <div><span className="text-slate-500 font-semibold">Start:</span> <span className="text-slate-900">{new Date(detailContract.startDate).toLocaleDateString()}</span></div>}
                {detailContract.endDate && <div><span className="text-slate-500 font-semibold">End:</span> <span className="text-slate-900">{new Date(detailContract.endDate).toLocaleDateString()}</span></div>}
                {detailContract.valueUgx && <div><span className="text-slate-500 font-semibold">Value:</span> <span className="text-slate-900">UGX {detailContract.valueUgx.toLocaleString()}</span></div>}
              </div>
              {detailContract.signers && detailContract.signers.length > 0 && (
                <div>
                  <div className="text-slate-500 font-semibold mb-1">Signers</div>
                  <div className="space-y-1">
                    {detailContract.signers.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-bold">#{s.signingOrder}</span>
                        <span className="text-slate-900 font-semibold">{s.signerName}</span>
                        {s.signerTitle && <span className="text-slate-500">({s.signerTitle})</span>}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ml-auto ${s.isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {s.isCompleted ? "Signed" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {detailContract.auditLogs && detailContract.auditLogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-slate-500 font-semibold mb-1">
                    <History className="w-3 h-3" /> Audit Trail
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200 max-h-48 overflow-y-auto">
                    {detailContract.auditLogs.map((log, i) => (
                      <div key={i} className="px-3 py-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            log.eventType === "Signed" ? "bg-emerald-100 text-emerald-700" :
                            log.eventType === "Completed" ? "bg-green-100 text-green-700" :
                            log.eventType === "Archived" ? "bg-purple-100 text-purple-700" :
                            log.eventType === "Viewed" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-200 text-slate-600"
                          }`}>
                            {log.eventType}
                          </span>
                          <span className="text-slate-900 font-semibold">{log.description || log.eventType}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-slate-500">
                          {log.performedBy && <span>By: <span className="text-slate-700">{log.performedBy}</span></span>}
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          {log.ipAddress && <span className="font-mono text-[10px]">IP: {log.ipAddress}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailContract.status === "FullySigned" && (
                <button
                  onClick={() => { handleDownload(detailContract.id, detailContract.title); setDetailContract(null); }}
                  className="w-full mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download Signed PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Send for Signing Modal ── */}
      {sendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSendModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-2">Send for Signing</h3>
            <p className="text-xs text-slate-600 mb-4">
              This will initiate the signing workflow. Internal signers (GM, Finance Manager) will sign first, then the client signing link will be generated.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 mb-4 text-xs">
              <div className="font-bold text-slate-900 font-mono">{sendModal.contractId}</div>
              <div className="text-slate-600">{sendModal.title}</div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSendModal(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => handleSendForSigning(sendModal.id)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan Upload Modal ── */}
      {scanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setScanModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm">Upload Scanned Contract</h3>
              <button onClick={() => setScanModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setScanFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={scanTitle}
                  onChange={(e) => setScanTitle(e.target.value)}
                  placeholder="Contract title"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Client Name</label>
                <input
                  type="text"
                  value={scanPartyName}
                  onChange={(e) => setScanPartyName(e.target.value)}
                  placeholder="e.g., Uganda Revenue Authority"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Abbreviation (auto-generated)</label>
                <input
                  type="text"
                  value={scanAbbreviation}
                  onChange={(e) => setScanAbbreviation(e.target.value)}
                  placeholder="e.g., URA (auto-filled from name)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={scanCategory}
                  onChange={(e) => setScanCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="Client">Client</option>
                  <option value="Staff">Staff</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setScanModal(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={handleScanUpload}
                disabled={!scanFile || scanUploading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {scanUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Company Stamp Sub-Component ──
const CompanyStampSection: React.FC<{ headers: () => Record<string, string> }> = ({ headers }) => {
  const [hasStamp, setHasStamp] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);

  useEffect(() => {
    checkStamp();
  }, []);

  const checkStamp = async () => {
    try {
      const res = await fetch("/api/digital-contract-templates/stamp", { headers: headers() as any });
      if (res.ok) {
        const data = await res.json();
        setHasStamp(data.hasStamp);
      }
    } catch {}
  };

  const handleUpload = async () => {
    if (!stampFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("stamp", stampFile);
      const t = getAccessToken() || localStorage.getItem("iscms_access_token") || "";
      const res = await fetch("/api/digital-contract-templates/stamp", {
        method: "POST",
        headers: t ? { Authorization: `Bearer ${t}` } : {},
        body: formData,
      });
      if (res.ok) {
        setHasStamp(true);
        setStampFile(null);
      }
    } catch {}
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Remove the company stamp? It will no longer appear on finalized contracts.")) return;
    try {
      await fetch("/api/digital-contract-templates/stamp", {
        method: "DELETE",
        headers: headers() as any,
      });
      setHasStamp(false);
    } catch {}
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Stamp className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Company Stamp</h3>
            <p className="text-xs text-slate-500">
              {hasStamp
                ? "Stamp image uploaded. It will appear on all finalized contracts."
                : "No stamp uploaded. Upload a PNG/JPG of your company stamp."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasStamp ? (
            <>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Uploaded
              </span>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => setStampFile(e.target.files?.[0] || null)}
                className="text-xs"
              />
              <button
                onClick={handleUpload}
                disabled={!stampFile || uploading}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Stamp"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
