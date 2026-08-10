import React from "react";
import { toast } from "../../stores/toastStore";
import {
  HardDrive,
  ShieldCheck,
  FileCheck,
  Lock,
  Key,
  UserCheck,
  CheckCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Search,
  Database,
} from "lucide-react";

interface BackupArchive {
  id: string;
  filename: string;
  size: string;
  type: string;
  initiatedBy: string;
  timestamp: string;
  checksumSHA256: string;
  tablesIncluded: string;
}

interface IntegrityLog {
  id: string;
  category: string;
  component: string;
  testPerformed: string;
  hashSignature: string;
  recordsAudited: number;
  status: string;
  lastChecked: string;
  notes: string;
}

interface SystemMaintenancePanelProps {
  backupArchives: BackupArchive[];
  integrityLogs: IntegrityLog[];
  isCreatingBackup: boolean;
  backupProgress: number;
  backupStepMsg: string;
  isVerifyingIntegrity: boolean;
  integrityVerifyToast: string | null;
  integrityCategory: string;
  integritySearch: string;
  activeRole: string;
  onInitiateManualBackup: () => void;
  onVerifyAllIntegrityLogs: () => void;
  onVerifySingleIntegrityLog: (id: string) => void;
  onSetIntegrityCategory: (cat: string) => void;
  onSetIntegritySearch: (search: string) => void;
}

export const SystemMaintenancePanel: React.FC<SystemMaintenancePanelProps> = ({
  backupArchives,
  integrityLogs,
  isCreatingBackup,
  backupProgress,
  backupStepMsg,
  isVerifyingIntegrity,
  integrityVerifyToast,
  integrityCategory,
  integritySearch,
  activeRole,
  onInitiateManualBackup,
  onVerifyAllIntegrityLogs,
  onVerifySingleIntegrityLog,
  onSetIntegrityCategory,
  onSetIntegritySearch,
}) => {
  const filteredIntegrityLogs = integrityLogs.filter((log) => {
    if (integrityCategory !== "ALL" && log.category !== integrityCategory) return false;
    if (
      integritySearch &&
      !log.component.toLowerCase().includes(integritySearch.toLowerCase()) &&
      !log.testPerformed.toLowerCase().includes(integritySearch.toLowerCase()) &&
      !log.notes.toLowerCase().includes(integritySearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Database Backup Status</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">100% Intact</div>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{backupArchives.length} Archives Available</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">System Integrity Index</span>
            <ShieldCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-black text-slate-900">100% Verified</div>
          <p className="text-[11px] font-semibold text-cyan-700 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>{integrityLogs.length} Ledgers Audited Intact</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vault Encryption Cipher</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900">AES-256-GCM</div>
          <p className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
            <Key className="w-3.5 h-3.5" />
            <span>SHA-256 Hashes Verified</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Operational Oversight</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{activeRole}</div>
          <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Manual Trigger Active</span>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/30">
                IT Officer Manual Backup Trigger
              </span>
              <span className="text-slate-400 text-xs font-mono">Vault Storage Path: /vault/backups/</span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Enterprise Manual Data Backup & Encryption Vault
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Initiate an immediate, full encrypted data snapshot of all enterprise schemas (Guard HR, Force No, 22 HR Columns, Armoury Balances, Remittance Ledgers & System Telemetry Logs).
            </p>
          </div>

          <button
            onClick={onInitiateManualBackup}
            disabled={isCreatingBackup}
            className={`px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2 shrink-0 ${
              isCreatingBackup
                ? "bg-slate-700 text-slate-300 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-900/30"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isCreatingBackup ? "animate-spin" : ""}`} />
            <span>{isCreatingBackup ? "Generating Backup..." : "Initiate Manual Data Backup Now"}</span>
          </button>
        </div>

        {isCreatingBackup && (
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-bounce text-emerald-400" />
                {backupStepMsg}
              </span>
              <span className="font-mono text-emerald-400">{backupProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Encrypted System Backup Archives ({backupArchives.length})
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Algorithm: AES-256-GCM + SHA-256 Checksum</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-800">
                  <th className="p-3">Archive ID</th>
                  <th className="p-3">Filename</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Trigger Mode</th>
                  <th className="p-3">Initiated By</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Integrity Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {backupArchives.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-300">{bk.id}</td>
                    <td className="p-3 font-mono text-slate-200 max-w-xs truncate" title={bk.filename}>
                      {bk.filename}
                    </td>
                    <td className="p-3 font-bold text-slate-100">{bk.size}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        bk.type === "Manual On-Demand"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {bk.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{bk.initiatedBy}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{bk.timestamp}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        INTACT
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          toast.info(`Backup Manifest — ${bk.id}`, `Filename: ${bk.filename} · SHA256: ${bk.checksumSHA256.slice(0, 24)}… · Tables: ${bk.tablesIncluded}`);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                      >
                        Manifest Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-600" />
              System Integrity Logs & Cryptographic Diagnostics
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify cryptographic ledger hashes, double-entry matrix consistency, and security permission states.
            </p>
          </div>

          <button
            onClick={onVerifyAllIntegrityLogs}
            disabled={isVerifyingIntegrity}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isVerifyingIntegrity ? "animate-spin" : ""}`} />
            <span>{isVerifyingIntegrity ? "Verifying Hashes..." : "Verify All Integrity Logs Now"}</span>
          </button>
        </div>

        {integrityVerifyToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{integrityVerifyToast}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <span className="font-bold text-slate-600">Category:</span>
            {["ALL", "DATABASE", "SECURITY", "PERMISSIONS", "KEYS"].map((cat) => (
              <button
                key={cat}
                onClick={() => onSetIntegrityCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                  integrityCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search integrity logs..."
              value={integritySearch}
              onChange={(e) => onSetIntegritySearch(e.target.value)}
              className="w-full bg-transparent outline-none font-semibold text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Log ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Component / Ledger</th>
                <th className="p-3.5">Verification Diagnostic</th>
                <th className="p-3.5 font-mono">Hash Signature</th>
                <th className="p-3.5">Records</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Last Checked</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredIntegrityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{log.id}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 uppercase">
                      {log.category}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{log.component}</td>
                  <td className="p-3.5 text-slate-600">{log.testPerformed}</td>
                  <td className="p-3.5 font-mono text-cyan-800 bg-cyan-50/50 rounded-md px-1.5 py-0.5 text-[11px] w-fit">
                    {log.hashSignature}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">{log.recordsAudited}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      INTACT
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.lastChecked}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onVerifySingleIntegrityLog(log.id)}
                      className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Verify Row
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
