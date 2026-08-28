import React, { useCallback, useEffect, useState } from "react";
import {
  Cpu,
  ShieldCheck,
  Database,
  Clock,
  RefreshCw,
  Zap,
  Play,
  Plus,
  Trash2,
  Power,
} from "lucide-react";
import { domainApi } from "../../services/domainApi";

interface CronJobRecord {
  id: string;
  name: string;
  description?: string | null;
  cronExpression: string;
  category?: string | null;
  enabled: boolean;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  lastDetail?: string | null;
  nextRunAt?: string | null;
  _count?: { runs?: number };
}

interface CronRunRecord {
  id: string;
  jobId: string;
  status: string;
  detail?: string | null;
  durationMs?: number | null;
  startedAt?: string;
  finishedAt?: string | null;
  createdAt?: string;
}

const CATEGORY_STYLES: Record<string, string> = {
  Maintenance: "bg-amber-100 text-amber-800 border-amber-300",
  Security: "bg-cyan-100 text-cyan-800 border-cyan-300",
  Notifications: "bg-blue-100 text-blue-800 border-blue-300",
  Finance: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export const AutomationEnginePanel: React.FC = () => {
  const [jobs, setJobs] = useState<CronJobRecord[]>([]);
  const [runs, setRuns] = useState<CronRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    cronExpression: "0 0 * * *",
    category: "Maintenance",
  });

  const load = useCallback(async () => {
    try {
      const j = await domainApi.cronJobs.list();
      setJobs(j);
      let all: CronRunRecord[] = [];
      for (const job of j) {
        if ((job._count?.runs ?? 0) > 0) {
          try {
            const rr = await domainApi.cronJobs.runs(job.id);
            all = all.concat(rr);
          } catch {
            /* skip jobs without runs */
          }
        }
      }
      all.sort((a, b) => (b.createdAt || b.startedAt || "").localeCompare(a.createdAt || a.startedAt || ""));
      setRuns(all.slice(0, 50));
    } catch (e: any) {
      setNotice(`Could not load automation jobs: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const runNow = async (id: string) => {
    setBusyId(id);
    try {
      const res = await domainApi.cronJobs.runNow(id);
      flash(`Job executed → ${res.ok ? res.detail : "failed"}`);
      await load();
    } catch (e: any) {
      flash(`Run failed: ${e?.message || String(e)}`);
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (job: CronJobRecord) => {
    try {
      const res = await domainApi.cronJobs.update(job.id, { enabled: !job.enabled });
      flash(`${job.name} ${res.enabled ? "enabled" : "paused"}.`);
      await load();
    } catch (e: any) {
      flash(`Update failed: ${e?.message || String(e)}`);
    }
  };

  const remove = async (id: string, name: string) => {
    try {
      await domainApi.cronJobs.remove(id);
      flash(`Permanently removed "${name}".`);
      await load();
    } catch (e: any) {
      flash(`Remove failed: ${e?.message || String(e)}`);
    }
  };

  const create = async () => {
    if (!form.name.trim()) return;
    try {
      await domainApi.cronJobs.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        cronExpression: form.cronExpression.trim(),
        category: form.category,
        enabled: true,
      });
      setShowCreate(false);
      setForm({ name: "", description: "", cronExpression: "0 0 * * *", category: "Maintenance" });
      flash("Custom automation routine created and registered with the scheduler.");
      await load();
    } catch (e: any) {
      flash(`Create failed: ${e?.message || String(e)}`);
    }
  };

  const enabled = jobs.filter((j) => j.enabled).length;
  const failures = jobs.filter((j) => j.lastStatus === "FAILED").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {notice && (
        <div className="px-4 py-3 rounded-2xl bg-slate-900 text-cyan-100 border border-cyan-500/30 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Routines</span>
            <Cpu className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">{jobs.length} Jobs</div>
          <p className="text-[11px] text-slate-400 mt-1">{enabled} Active • {jobs.length - enabled} Paused</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Execution History</span>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">{runs.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Persisted audit run records</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Last Failures</span>
            <Database className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black">{failures}</div>
          <p className="text-[11px] text-slate-400 mt-1">Jobs with failed last run</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Auto-Refresh</span>
            <Clock className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`mt-2 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${autoRefresh ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            {autoRefresh ? "Live · 15s on" : "Off · click to enable"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!showCreate ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Custom Routine
          </button>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 w-full">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Register New Automation Routine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Routine name"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
              <input
                value={form.cronExpression}
                onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))}
                placeholder="Cron expression (5-field) e.g. 0 9 * * 1"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none"
              />
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
              >
                {["Maintenance", "Security", "Notifications", "Finance"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={create}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
              >
                Register Routine
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live jobs table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black">Registered Automation Routines</h3>
            <p className="text-xs text-slate-400">Real scheduler backed by the IT cron engine — run, pause, resume or remove routines</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
            {loading ? "Loading..." : `${jobs.length} Routines`}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-xs font-semibold text-slate-400">Loading scheduler state…</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="p-3.5">Routine</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Cron Schedule</th>
                  <th className="p-3.5">Last Run</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{job.name}</div>
                      {job.description && <div className="text-[11px] text-slate-500 max-w-xs truncate">{job.description}</div>}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${CATEGORY_STYLES[job.category || ""] || "bg-slate-100 text-slate-700 border-slate-300"}`}>
                        {job.category || "General"}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 font-bold">{job.cronExpression}</td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString() : "—"}
                      {job.lastStatus && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black ${job.lastStatus === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                          {job.lastStatus}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => toggle(job)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${job.enabled ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-600 border border-slate-300"}`}
                      >
                        <Power className="w-3 h-3" /> {job.enabled ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => runNow(job.id)}
                          disabled={busyId === job.id}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-[11px] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {busyId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          Run Now
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(job.id, job.name)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer"
                          title="Remove routine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Live runs table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black">Automation Execution Audit Trail</h3>
            <p className="text-xs text-slate-400">Persisted results of every scheduled & on-demand run</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
            {runs.length} Runs
          </span>
        </div>
        <div className="overflow-x-auto">
          {runs.length === 0 ? (
            <div className="p-10 text-center text-xs font-semibold text-slate-400">
              No runs recorded yet — use <span className="font-black">Run Now</span> or wait for the next scheduled tick.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="p-3.5">When</th>
                  <th className="p-3.5">Routine</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
                {runs.map((r) => {
                  const job = jobs.find((j) => j.id === r.jobId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-500">{new Date(r.createdAt || r.startedAt || "").toLocaleString()}</td>
                      <td className="p-3.5 font-black text-slate-900">{job?.name || r.jobId}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${r.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : r.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{r.durationMs != null ? `${(r.durationMs / 1000).toFixed(2)}s` : "—"}</td>
                      <td className="p-3.5 text-slate-600 max-w-sm truncate">{r.detail || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        Routines here run through the real IT cron scheduler — paused jobs remain registered but are not triggered until resumed.
      </div>
    </div>
  );
};
