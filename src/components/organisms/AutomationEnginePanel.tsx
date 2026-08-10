import React from "react";
import {
  Cpu,
  ShieldCheck,
  Database,
  Clock,
  ShieldAlert,
  RefreshCw,
  Zap,
  Users,
  Sparkles,
  Key,
  Copy,
} from "lucide-react";

interface AutomationLog {
  id: string;
  jobName: string;
  frequency: string;
  lastRun: string;
  status: string;
  details: string;
}

interface AutomationEnginePanelProps {
  scanOutput: string | null;
  isScanning: boolean;
  backupStatus: string | null;
  dormantAuditOutput: string | null;
  slaEscalationMsg: string | null;
  selectedResetUser: string;
  generatedResetToken: string | null;
  copiedToken: boolean;
  automationLogs: AutomationLog[];
  users: { id: string; name: string; role: string; department: string }[];
  onRunVulnerabilityScan: () => void;
  onRunBackup: () => void;
  onRunDormantAudit: () => void;
  onRunSLAEscalation: () => void;
  onGenerateResetToken: () => void;
  onSetSelectedResetUser: (val: string) => void;
  onSetCopiedToken: (val: boolean) => void;
}

export const AutomationEnginePanel: React.FC<AutomationEnginePanelProps> = ({
  scanOutput,
  isScanning,
  backupStatus,
  dormantAuditOutput,
  slaEscalationMsg,
  selectedResetUser,
  generatedResetToken,
  copiedToken,
  automationLogs,
  users,
  onRunVulnerabilityScan,
  onRunBackup,
  onRunDormantAudit,
  onRunSLAEscalation,
  onGenerateResetToken,
  onSetSelectedResetUser,
  onSetCopiedToken,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Routines</span>
            <Cpu className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">4 Active Jobs</div>
          <p className="text-[11px] text-slate-400 mt-1">100% Scheduled Operations Active</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Security Shield</span>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">0 Flaws</div>
          <p className="text-[11px] text-slate-400 mt-1">SSL Encrypted & API Hardened</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Auto DB Snapshot</span>
            <Database className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">42.8 MB</div>
          <p className="text-[11px] text-slate-400 mt-1">Daily @ 00:00 UTC (AES-256 Vault)</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Helpdesk SLAs</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">100% Met</div>
          <p className="text-[11px] text-slate-400 mt-1">Auto-escalates overdue vouchers</p>
        </div>
      </div>

      {/* Interactive Automation Routine Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Vulnerability Scanner */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">System Endpoint Vulnerability Scan</h3>
                <p className="text-[11px] text-slate-500">Auto-scans every 6 hours for unauthorized access & CORS leaks</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Active Routine
            </span>
          </div>

          {scanOutput && (
            <div className="p-3 bg-slate-900 text-cyan-300 font-mono text-[11px] rounded-xl border border-slate-800">
              {scanOutput}
            </div>
          )}

          <button
            type="button"
            onClick={onRunVulnerabilityScan}
            disabled={isScanning}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Executing Diagnostic Scan...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>⚡ Execute Instant On-Demand Diagnostic Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Database Backup Engine */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Encrypted DB Snapshot & Retention</h3>
                <p className="text-[11px] text-slate-500">Automated nightly snapshot at 00:00 UTC with 30-day rotation</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Active Routine
            </span>
          </div>

          {backupStatus && (
            <div className="p-3 bg-emerald-950 text-emerald-300 font-mono text-[11px] rounded-xl border border-emerald-800">
              {backupStatus}
            </div>
          )}

          <button
            type="button"
            onClick={onRunBackup}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4 text-slate-950" />
            <span>💾 Execute Instant Encrypted DB Backup</span>
          </button>
        </div>

        {/* Card 3: Dormant Account Audit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Dormant Account & Session Audit</h3>
                <p className="text-[11px] text-slate-500">Automated weekly scan to detect accounts inactive &gt; 30 days</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Active Routine
            </span>
          </div>

          {dormantAuditOutput && (
            <div className="p-3 bg-slate-900 text-purple-300 font-mono text-[11px] rounded-xl border border-slate-800">
              {dormantAuditOutput}
            </div>
          )}

          <button
            type="button"
            onClick={onRunDormantAudit}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>🔍 Execute Dormant Account Security Audit</span>
          </button>
        </div>

        {/* Card 4: Support Ticket SLA Escalator */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Helpdesk Ticket SLA Auto-Escalator</h3>
                <p className="text-[11px] text-slate-500">Checks open IT tickets every 15 mins & escalates overdue items</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              Active Routine
            </span>
          </div>

          {slaEscalationMsg && (
            <div className="p-3 bg-blue-950 text-blue-300 font-mono text-[11px] rounded-xl border border-blue-800">
              {slaEscalationMsg}
            </div>
          )}

          <button
            type="button"
            onClick={onRunSLAEscalation}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-cyan-300" />
            <span>⏱️ Run SLA Escalation Compliance Check</span>
          </button>
        </div>
      </div>

      {/* Automated Reset Token Generator Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Automated One-Time Passcode (OTP) Token Generator</h3>
            <p className="text-xs text-slate-500">Generate a temporary, encrypted single-use access link for staff credential reset.</p>
          </div>
          <Key className="w-5 h-5 text-cyan-600" />
        </div>

        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-700 block mb-1">Select User Account</label>
            <select
              value={selectedResetUser}
              onChange={(e) => onSetSelectedResetUser(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role} - {u.department})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onGenerateResetToken}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
          >
            ⚡ Generate 15-Min One-Time OTP Token
          </button>
        </div>

        {generatedResetToken && (
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-cyan-300 truncate">{generatedResetToken}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(generatedResetToken);
                onSetCopiedToken(true);
                setTimeout(() => onSetCopiedToken(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>{copiedToken ? "Copied!" : "Copy Token"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Automated System Jobs Execution Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black">Automated System Jobs Execution Log</h3>
            <p className="text-xs text-slate-400">Audit trail of scheduled system tasks and on-demand triggers</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
            Audit Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Job ID</th>
                <th className="p-3.5">Routine Name</th>
                <th className="p-3.5">Trigger Schedule</th>
                <th className="p-3.5">Last Run</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Execution Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {automationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{log.id}</td>
                  <td className="p-3.5 font-black text-slate-900">{log.jobName}</td>
                  <td className="p-3.5 text-slate-600 font-semibold">{log.frequency}</td>
                  <td className="p-3.5 font-mono text-slate-500">{log.lastRun}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
