import React, { useState } from "react";
import { Server, Globe, Terminal, CheckCircle2, Pencil, Trash2, Plus } from "lucide-react";
import type { ITServer, ITSupportTicket } from "../../types";

interface ServerHealthGridProps {
  servers: ITServer[];
  tickets: ITSupportTicket[];
  onUpdateServer?: (id: string, updates: Partial<ITServer>) => void;
  onDeleteServer?: (id: string) => void;
  onUpdateTicket?: (id: string, updates: Partial<ITSupportTicket>) => void;
  onDeleteTicket?: (id: string) => void;
  onAddTicket?: (t: Omit<ITSupportTicket, "id">) => void;
}

export const ServerHealthGrid: React.FC<ServerHealthGridProps> = ({
  servers, tickets,
  onUpdateServer, onDeleteServer,
  onUpdateTicket, onDeleteTicket, onAddTicket,
}) => {
  const [showHstsManifest, setShowHstsManifest] = useState(true);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketReporter, setTicketReporter] = useState("");
  const [ticketPriority, setTicketPriority] = useState<ITSupportTicket["priority"]>("Medium");

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketReporter) return;
    onAddTicket?.({
      ticketCode: "",
      reportedBy: ticketReporter,
      subject: ticketSubject,
      priority: ticketPriority,
      status: "Open",
      createdDate: new Date().toISOString().split("T")[0],
    });
    setShowAddTicket(false);
    setTicketSubject("");
    setTicketReporter("");
    setTicketPriority("Medium");
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 tracking-tight">HSTS & Secure Headers Enforced</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gateway enforces HTTP Strict Transport Security (HSTS) with <code className="text-cyan-300 font-mono">max-age=63072000</code>, CSP strict nonces, and real-time input sanitization.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>TLS 1.3 ACTIVE</span>
          </span>
        </div>

        <button type="button" onClick={() => setShowHstsManifest(!showHstsManifest)}
          className="text-xs font-black text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer pt-1">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>{showHstsManifest ? ">_ Hide Security Header Manifest" : ">_ Show Security Header Manifest"}</span>
        </button>

        {showHstsManifest && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2 animate-fadeIn">
            <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>HTTP/2 200 OK Response Headers</span>
              <span className="text-emerald-400 font-normal text-[11px] bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">Strict Enforce Mode</span>
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">Strict-Transport-Security:</strong> max-age=63072000; includeSubDomains; preload
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">Content-Security-Policy:</strong> default-src 'self'; script-src 'self'; object-src 'none';
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">X-Frame-Options:</strong> DENY
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">X-Content-Type-Options:</strong> nosniff
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">X-XSS-Protection:</strong> 1; mode=block
            </div>
            <div className="text-slate-300">
              <strong className="text-slate-100">Referrer-Policy:</strong> strict-origin-when-cross-origin
            </div>
          </div>
        )}
      </div>

      {servers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-center py-8 text-slate-400 italic text-xs">No servers registered.</div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {servers.map((srv) => (
          <div key={srv.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-slate-900 text-xs">{srv.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  srv.status === "Operational"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {srv.status}
                </span>
                {onUpdateServer && (
                  <button
                    onClick={() => {
                      const newStatus = prompt("New status (Operational / High Load / Maintenance):", srv.status);
                      if (newStatus && ["Operational","High Load","Maintenance"].includes(newStatus)) {
                        onUpdateServer(srv.id, { status: newStatus as ITServer["status"] });
                      }
                    }}
                    className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                    title="Edit Server"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {onDeleteServer && (
                  <button
                    onClick={() => { if (window.confirm(`Delete server ${srv.name}?`)) onDeleteServer(srv.id); }}
                    className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer"
                    title="Delete Server"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Node IP:</span>
                <span className="font-mono font-bold text-slate-800">{srv.ipAddress}</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>CPU Utilization:</span>
                  <span className="font-bold text-slate-800">{srv.cpuUsage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${srv.cpuUsage > 70 ? "bg-amber-500" : "bg-cyan-600"}`}
                    style={{ width: `${srv.cpuUsage}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>RAM Memory Usage:</span>
                  <span className="font-bold text-slate-800">{srv.memoryUsage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${srv.memoryUsage > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${srv.memoryUsage}%` }} />
                </div>
              </div>
              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-slate-400">System Uptime:</span>
                <span className="font-bold text-emerald-700">{srv.uptime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">IT Help Desk Support Queue</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Internal IT service requests</span>
            {onAddTicket && (
              <button
                onClick={() => setShowAddTicket(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ticket</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Ticket #</th>
                <th className="p-3.5">Reported By</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic text-xs">No support tickets created yet.</td>
                </tr>
              ) : (tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-cyan-700">{t.ticketCode}</td>
                  <td className="p-3.5 font-bold text-slate-900">{t.reportedBy}</td>
                  <td className="p-3.5 text-slate-800">{t.subject}</td>
                  <td className="p-3.5 font-bold text-amber-700">{t.priority}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1">
                      {onUpdateTicket && (
                        <button
                          onClick={() => {
                            const newStatus = prompt("New status (Open / In Progress / Resolved):", t.status);
                            if (newStatus && ["Open","In Progress","Resolved"].includes(newStatus)) {
                              onUpdateTicket(t.id, { status: newStatus as ITSupportTicket["status"] });
                            }
                          }}
                          className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                          title="Edit Ticket"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {onDeleteTicket && (
                        <button
                          onClick={() => { if (window.confirm(`Delete ticket ${t.ticketCode}?`)) onDeleteTicket(t.id); }}
                          className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Add IT Support Ticket</h3>
            <form onSubmit={handleAddTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Reported By</label>
                <input type="text" required value={ticketReporter} onChange={(e) => setTicketReporter(e.target.value)}
                  placeholder="e.g. Grace Kiconco" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject</label>
                <input type="text" required value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. CCTV NVR Storage Upgrade" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority</label>
                <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value as ITSupportTicket["priority"])}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-semibold outline-none">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAddTicket(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
