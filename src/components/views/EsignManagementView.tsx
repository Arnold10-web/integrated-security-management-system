import React, { useEffect, useState } from "react";
import { FileText, Send, Download, Archive, Clock, Shield, AlertTriangle } from "lucide-react";
import { getAccessToken } from "../../services/apiClient";

type Template = { id: string; name: string; bodyHtml: string; version: number; createdAt: string };
type ContractRow = {
  id: string; contractCode: string; title: string; partyName: string; status: string; valueUgx?: number;
  endDate: string; templateId?: string; isArchived: boolean; documentHash?: string; finalizedPdfPath?: string;
};

export const EsignManagementView: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTplName, setNewTplName] = useState("");
  const [newTplBody, setNewTplBody] = useState("<h2>Contract: {{clientName}}</h2><p>Value: {{valueUgx}} UGX</p><p>Site: {{siteName}}</p>");
  const headers = () => {
    const t = getAccessToken() || (typeof window !== "undefined" ? localStorage.getItem("iscms_access_token") || "" : "");
    return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };
  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const [tRes, cRes] = await Promise.all([
        fetch("/api/esign/templates", { headers: headers() as any }),
        fetch("/api/esign/contracts", { headers: headers() as any }),
      ]);
      if (tRes.ok) setTemplates(await tRes.json().then((j: any) => j.data ?? j));
      if (cRes.ok) setContracts(await cRes.json().then((j: any) => j.data ?? j));
      if (!tRes.ok || !cRes.ok) setError("Some data failed to load (check documents permission)");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const createTemplate = async () => {
    if (!newTplName.trim()) return;
    const r = await fetch("/api/esign/templates", { method: "POST", headers: headers() as any, body: JSON.stringify({ name: newTplName, bodyHtml: newTplBody }) });
    if (r.ok) { setNewTplName(""); fetchAll(); } else setError(await r.text().then(t => t.slice(0,200)));
  };
  const archive = async (id: string) => {
    if (!confirm("Archive this contract?")) return;
    const r = await fetch(`/api/esign/contracts/archive/${id}`, { method: "POST", headers: headers() as any });
    if (r.ok) fetchAll(); else alert("Archive failed");
  };
  const download = async (id: string) => {
    const r = await fetch(`/api/esign/contracts/download/${id}`, { headers: headers() as any });
    if (!r.ok) { alert("Download failed"); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `contract_${id}.pdf`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-wrap justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Contract Lifecycle • E-Contracts</div>
          <h1 className="text-xl font-black mt-1 flex items-center gap-2"><Shield className="w-5 h-5 text-cyan-400"/> E-Contracts Management</h1>
          <p className="text-xs text-slate-400 mt-1">Templates with versioned snapshots, single-use signing links, and tamper-evident PDF hash.</p>
        </div>
        <button onClick={fetchAll} className="px-3 py-2 bg-white text-slate-900 rounded-lg text-xs font-semibold">Refresh</button>
      </div>
      {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><FileText className="w-4 h-4"/> Templates ({templates.length})</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-auto">
            {templates.map(t => (
              <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-xs text-slate-900">{t.name} <span className="text-slate-500">v{t.version}</span></div>
                <div className="text-[11px] text-slate-600 truncate">{t.bodyHtml.slice(0,80)}…</div>
              </div>
            ))}
            {templates.length===0 && <div className="text-xs text-slate-500">{loading ? "Loading…" : "No templates yet"}</div>}
          </div>
          <div className="mt-4 border-t pt-3">
            <input value={newTplName} onChange={e=>setNewTplName(e.target.value)} placeholder="New template name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs mb-2"/>
            <textarea value={newTplBody} onChange={e=>setNewTplBody(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"/>
            <button onClick={createTemplate} className="mt-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"><Send className="w-3 h-3"/> Create Template</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Clock className="w-4 h-4"/> Signing Contracts</h3>
          <p className="text-xs text-slate-600 mt-1">Create via <code className="bg-slate-100 px-1 rounded">POST /api/esign/contracts</code> with <code>templateId + variableData</code>. Link is 14d, single-use, audit-logged.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between">
          <h3 className="font-bold text-sm">Contracts ({contracts.length})</h3>
          <span className="text-xs text-slate-600">{loading ? "Loading…" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 text-slate-300 uppercase text-[11px]">
              <tr><th className="text-left px-3 py-2">Code / Title</th><th className="text-left px-3 py-2">Party</th><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Hash</th><th className="text-right px-3 py-2">Actions</th></tr>
            </thead>
            <tbody>
              {contracts.map(c=>(
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2"><div className="font-semibold text-slate-900">{c.contractCode}</div><div className="text-slate-600 truncate max-w-[200px]">{c.title}</div></td>
                  <td className="px-3 py-2">{c.partyName}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-1 rounded-full text-[11px] font-semibold ${c.isArchived?'bg-slate-200 text-slate-700':c.status==='Active'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{c.isArchived?'Archived':c.status}</span></td>
                  <td className="px-3 py-2 font-mono text-[11px] truncate max-w-[120px]">{c.documentHash?.slice(0,12) ?? "—"}</td>
                  <td className="px-3 py-2 text-right space-x-1">
                    {c.finalizedPdfPath && <button onClick={()=>download(c.id)} className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[11px] inline-flex items-center gap-1"><Download className="w-3 h-3"/>PDF</button>}
                    {!c.isArchived && <button onClick={()=>archive(c.id)} className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[11px] inline-flex items-center gap-1"><Archive className="w-3 h-3"/>Archive</button>}
                  </td>
                </tr>
              ))}
              {contracts.length===0 && <tr><td colSpan={5} className="text-center py-6 text-slate-500">No contracts. Create via Templates or Contracts API.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
