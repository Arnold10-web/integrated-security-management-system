import React, { useState } from "react";
import { AlertTriangle, Plus, Paperclip } from "lucide-react";
import { Incident } from "../../types";

interface IncidentsViewProps {
  incidents: Incident[];
  onAddIncident: (inc: Omit<Incident, "id">) => void;
  onResolveIncident: (id: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onAddIncident,
  onResolveIncident,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIncidents = incidents.filter((inc) =>
    !search ||
    inc.title.toLowerCase().includes(search.toLowerCase()) ||
    inc.siteName.toLowerCase().includes(search.toLowerCase()) ||
    inc.incidentCode.toLowerCase().includes(search.toLowerCase()) ||
    inc.reportedByGuard.toLowerCase().includes(search.toLowerCase())
  );

  // Form states
  const [title, setTitle] = useState("");
  const siteName = "Speke Resort & Conference Center";
  const reportedBy = "Moses Musoke";
  const [category, setCategory] = useState<Incident["category"]>("Security Breach");
  const [severity, setSeverity] = useState<Incident["severity"]>("Medium");
  const [description, setDescription] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    onAddIncident({
      incidentCode: `INC-2026-00${Math.floor(Math.random() * 90 + 10)}`,
      title,
      siteName,
      reportedByGuard: reportedBy,
      incidentDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      category,
      severity,
      description,
      status: "Under Investigation",
      evidenceAttached: true,
    });
    setShowAddModal(false);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Incidents, Breaches & Client Complaints</h2>
            <p className="text-xs text-slate-500">
              Perimeter security breach reports, evidence photo logs, escalation workflows, investigation approvals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Security Incident</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents by title, site, code..." className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filteredIncidents.length} of {incidents.length}</span>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-center py-8 text-slate-400 italic text-xs">No incidents recorded yet.</div>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredIncidents.map((inc) => (
          <div key={inc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                    {inc.incidentCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === "Critical"
                        ? "bg-red-600 text-white"
                        : inc.severity === "High"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {inc.severity} Severity
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">{inc.title}</h3>
                <p className="text-xs text-slate-500">
                  Site: <strong>{inc.siteName}</strong> • Reported by: <strong>{inc.reportedByGuard}</strong> on {inc.incidentDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    inc.status === "Resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {inc.status}
                </span>
                {inc.status !== "Resolved" && (
                  <button
                    onClick={() => onResolveIncident(inc.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {inc.description}
            </p>

            {inc.evidenceAttached && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold pt-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Evidence Log Attached (Perimeter CCTV Snapshot #2026-401)</span>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Log Security Incident Report
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthorized entry attempt at north gate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Incident["category"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Security Breach">Security Breach</option>
                    <option value="Theft Attempt">Theft Attempt</option>
                    <option value="Weapon Discharge">Weapon Discharge</option>
                    <option value="K9 Alert">K9 Alert</option>
                    <option value="Unauthorized Entry">Unauthorized Entry</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as Incident["severity"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Event Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Include timeline, guard response, weapon/K9 involvement..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Submit Incident Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
