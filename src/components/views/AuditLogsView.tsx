import React, { useEffect, useState } from "react";
import { Clock, Search, Download } from "lucide-react";
import { AuditLog } from "../../types";
import { Pagination } from "../molecules";

const PAGE_SIZE = 15;

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to the first page whenever the search term changes.
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(Math.ceil(filteredLogs.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">System Telemetry & Immutable Audit Ledger</h2>
            <p className="text-xs text-slate-500">
              Tamper-evident logs recording armoury checkouts, K9 handler reassignments, warnings, and shift check-ins.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `Security_Audit_Logs_${new Date().toISOString()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log File</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, details, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-500 text-slate-800"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">Total Telemetry Events: {logs.length}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Telemetry</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Activity Details</th>
                <th className="py-3 px-4">IP / Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic text-xs">No audit log entries match the search criteria.</td>
                </tr>
              ) : (pagedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 font-medium whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{log.userName}</div>
                    <div className="text-[10px] text-slate-400">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-400">192.168.10.42</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200">
            <Pagination page={safePage} pageSize={PAGE_SIZE} total={filteredLogs.length} onPageChange={setPage} itemName="events" />
          </div>
        )}
      </div>
    </div>
  );
};
