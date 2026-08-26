import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Printer,
} from "lucide-react";
import { api } from "../../services/apiClient";
import { toast } from "../../stores/toastStore";
import type { PassOutCertificate } from "../../types";

const STATUS_OPTIONS = ["All", "Active", "Archived", "Revoked"] as const;

export const PassOutCertificatesView: React.FC = () => {
  const [certificates, setCertificates] = useState<PassOutCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    api
      .get<PassOutCertificate[]>("/pass-out-certificates")
      .then(setCertificates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── derived ── */
  const cohortOptions = useMemo(() => {
    const set = new Set(certificates.map((c) => c.cohortCode));
    return ["All", ...Array.from(set).sort()];
  }, [certificates]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return certificates.filter((cert) => {
      if (cohortFilter !== "All" && cert.cohortCode !== cohortFilter) return false;
      if (q) {
        const searchable = `${cert.certificateId} ${cert.officerName} ${cert.forceNumber}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [certificates, searchQuery, cohortFilter]);

  const stats = useMemo(
    () => ({
      total: certificates.length,
      thisYear: certificates.filter((c) => c.createdAt.startsWith(new Date().getFullYear().toString())).length,
    }),
    [certificates]
  );

  const handleViewCertificate = (cert: PassOutCertificate) => {
    const w = window.open("", "_blank", "width=800,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Pass-Out Certificate — ${cert.certificateId}</title>
<style>
  body{font-family:'Times New Roman',serif;color:#111;margin:48px;line-height:1.6}
  .head{text-align:center;border-bottom:3px double #1e3a5f;padding-bottom:16px;margin-bottom:28px}
  .head h1{margin:0;font-size:26px;letter-spacing:1px;color:#1e3a5f}
  .head p{margin:2px 0;font-size:12px}
  .cert-id{text-align:center;font-size:11px;color:#888;margin-top:8px}
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
  <h1>INTEGRATED SECURITY COMPANY LTD</h1>
  <p>Security Officer Training Academy — Pass-Out Certificate</p>
  <div class="cert-id">Certificate No: <b>${cert.certificateId}</b></div>
</div>
<h2>1. Certificate Details</h2>
<div class="row"><span>Officer Name</span><span>${cert.officerName}</span></div>
<div class="row"><span>Force Number</span><span>${cert.forceNumber}</span></div>
<div class="row"><span>Training Cohort</span><span>${cert.cohortCode}</span></div>
<div class="row"><span>Training Period</span><span>${cert.trainingStart} to ${cert.trainingEnd}</span></div>
<div class="row"><span>Pass-Out Date</span><span>${cert.passOutDate}</span></div>
<h2>2. Certification</h2>
<p class="clause">This is to certify that the above-named Security Officer has successfully completed the prescribed training programme at the Integrated Security Company Ltd Training Academy and has met all requirements for operational deployment.</p>
<div class="sig">
  <div><b>Training Officer</b><div class="line">Name, Signature & Date</div></div>
  <div><b>Operations Manager</b><div class="line">Name, Signature & Date</div></div>
</div>
<p style="text-align:center;font-size:11px;color:#777;margin-top:40px">Generated ${new Date().toISOString().split("T")[0]} • ISCMS Records Vault</p>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`);
    w.document.close();
    toast.success("Certificate Viewed", `Opening certificate ${cert.certificateId} for print.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/20">
            <Award className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Pass-Out Certificates
            </h1>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Training Officer &amp; Records Officer — view, search and manage pass-out certificates.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Certificates</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[11px] font-semibold text-slate-500">All time</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Generated This Year</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.thisYear}</div>
          <p className="text-[11px] font-semibold text-emerald-600">{new Date().getFullYear()}</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unique Cohorts</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{cohortOptions.length - 1}</div>
          <p className="text-[11px] font-semibold text-slate-500">Training cohorts</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">Certificate Register</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Cohort filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-800 outline-none cursor-pointer">
                  {cohortOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt === "All" ? `All Cohorts (${certificates.length})` : opt}</option>
                  ))}
                </select>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Search cert ID, officer, force number..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold w-56 outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-extrabold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Certificate ID</th>
                <th className="px-4 py-3">Officer Name</th>
                <th className="px-4 py-3">Force Number</th>
                <th className="px-4 py-3">Cohort</th>
                <th className="px-4 py-3">Training Period</th>
                <th className="px-4 py-3">Pass-Out Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 mt-2 font-semibold">Loading certificates...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Award className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">
                      {searchQuery || cohortFilter !== "All"
                        ? `No certificates match "${searchQuery || cohortFilter}"`
                        : "No pass-out certificates generated yet."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Generate certificates from the Training Curriculum view.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-black text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded text-[10px]">
                        {cert.certificateId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900">{cert.officerName}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{cert.forceNumber}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        {cert.cohortCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600 font-mono">
                      {cert.trainingStart} → {cert.trainingEnd}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-700 font-semibold">{cert.passOutDate}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => handleViewCertificate(cert)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">
              Showing {filtered.length} of {certificates.length} certificate(s)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
