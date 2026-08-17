import React, { useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet, Globe, ShieldAlert, LogOut, Activity, Search, RefreshCw, AlertTriangle, Laptop } from "lucide-react";
import { getAccessToken } from "../../services/apiClient";

type Session = {
  id: string; userId: string; email: string; role: string; ipAddress: string; userAgent?: string;
  device?: string; browser?: string; browserVersion?: string; os?: string; osVersion?: string;
  country?: string; city?: string; loginAt: string; lastActiveAt: string; logoutAt?: string; isActive: boolean;
  user?: { name: string; region?: string; department?: string; status?: string };
};
type Stats = {
  totalSessions: number; activeSessions: number; uniqueIps: number; loginsLast24h: number; failedLoginsLast24h: number;
  byDevice: { device: string; count: number }[]; byBrowser: { browser: string; count: number }[]; byOs: { os: string; count: number }[]; activeByRole: { role: string; count: number }[];
};
type Attempt = { id: string; email: string; ipAddress: string; success: boolean; reason?: string; createdAt: string; userAgent?: string; country?: string; city?: string };

function DeviceIcon({ device }: { device?: string }) {
  const d = (device || "Desktop").toLowerCase();
  if (d === "mobile") return <Smartphone className="w-4 h-4" />;
  if (d === "tablet") return <Tablet className="w-4 h-4" />;
  if (d === "desktop") return <Monitor className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
}
function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`;
  return `${Math.floor(sec/86400)}d ago`;
}

export const DeviceSessionsPanel: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"ALL"|"Active"|"Terminated">("ALL");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"sessions"|"attempts">("sessions");
  const [sysHealth, setSysHealth] = useState<{ uptime: string; nodeVersion: string; platform: string; cpuModel: string; memory: { rss:number; heapUsed:number }; db:{ users:number; activeSessions:number }; } | null>(null);

  const getAuthHeaders = (): HeadersInit => {
    // Always read fresh token — getAccessToken() may be stale on HMR or before hydrate
    const t = (typeof window !== "undefined" ? localStorage.getItem("iscms_access_token") || getAccessToken() || "" : getAccessToken() || "");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    const headers = getAuthHeaders();
    if (!headers || !("Authorization" in headers) || !(headers as Record<string,string>).Authorization) {
      // Token not yet available (login race) — retry shortly instead of showing empty
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (filterActive !== "ALL") q.set("isActive", filterActive === "Active" ? "true" : "false");
      const [sRes, statsRes, aRes, hRes] = await Promise.all([
        fetch(`/api/it/sessions?${q.toString()}`, { headers }),
        fetch(`/api/it/sessions/stats`, { headers }),
        fetch(`/api/it/login-attempts?limit=20`, { headers }),
        fetch(`/api/it/system-health`, { headers }),
      ]);
      if (sRes.ok) { const j = await sRes.json() as { data: Session[] }; setSessions(j.data); }
      else if (sRes.status === 401 || sRes.status === 403) { setError("Not authorized — please re-login as IT Officer. Session may have expired."); setSessions([]); }
      else { setError(`Sessions load failed (${sRes.status})`); }
      if (statsRes.ok) setStats(await statsRes.json());
      else if (statsRes.status === 401) setError("Not authorized — please re-login as IT Officer.");
      if (aRes.ok) { const j = await aRes.json() as { data: Attempt[] }; setAttempts(j.data); }
      if (hRes.ok) setSysHealth(await hRes.json());
    } catch (e) { console.error("DeviceSessions fetch failed", e); setError("Network error loading device sessions."); } finally { setLoading(false); }
  };
  // Initial load + retry if token appears late (login race / HMR)
  useEffect(() => {
    fetchAll();
    // If token was missing at mount, retry once after a tick and once after 1s
    const t1 = setTimeout(fetchAll, 400);
    const t2 = setTimeout(fetchAll, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  // Debounced search / filter — immediate on filter change, 400ms on text search
  useEffect(() => {
    const delay = search ? 400 : 0;
    const t = setTimeout(fetchAll, delay);
    return () => clearTimeout(t);
  }, [search, filterActive]);

  const terminate = async (id: string) => {
    if (!confirm("Terminate this session? User will be forced to re-login.")) return;
    const res = await fetch(`/api/it/sessions/${id}/terminate`, { method: "POST", headers: getAuthHeaders() });
    if (res.ok) fetchAll(); else alert("Failed to terminate");
  };

  const exportCsv = () => {
    const rows = sessions.map(s=> [s.email,s.role,s.ipAddress,s.device||"",s.browser||"",s.os||"",new Date(s.loginAt).toISOString(), s.isActive?'Active':'Terminated'].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = ['Email,Role,IP,Device,Browser,OS,LoginAt,Status', ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`device-sessions-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {sysHealth && (
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-3 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-400"/>Uptime {sysHealth.uptime} • Node {sysHealth.nodeVersion} • {sysHealth.platform} • {sysHealth.cpuModel.split(' ').slice(0,3).join(' ')}</span>
          <span className="text-slate-400">Heap {(sysHealth.memory.heapUsed/1024/1024).toFixed(1)} MB / RSS {(sysHealth.memory.rss/1024/1024).toFixed(0)} MB</span>
          <span className="text-slate-400">DB users {sysHealth.db.users} • active {sysHealth.db.activeSessions}</span>
        </div>
      )}
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-300 uppercase font-semibold tracking-wide">Active Sessions</div>
            <div className="text-2xl font-black mt-1">{stats.activeSessions} <span className="text-sm font-normal text-slate-300">/ {stats.totalSessions}</span></div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1"><Activity className="w-3 h-3"/> live now</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Unique IPs</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-600"/>{stats.uniqueIps}</div>
            <div className="text-xs text-slate-600 mt-1">{stats.loginsLast24h} logins 24h</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Failed 24h</div>
            <div className="text-2xl font-black mt-1 flex items-center gap-2"><ShieldAlert className={`w-5 h-5 ${stats.failedLoginsLast24h>5?'text-red-600':'text-amber-600'}`}/>{stats.failedLoginsLast24h}</div>
            <div className="text-xs text-slate-600 mt-1">{stats.failedLoginsLast24h>10?'⚠ Brute-force risk':'Normal'}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200 col-span-2 md:col-span-1">
            <div className="text-xs text-slate-600 uppercase font-semibold tracking-wide">By Device</div>
            <div className="mt-2 space-y-1 text-xs">
              {stats.byDevice.map(d=> <div key={d.device} className="flex justify-between"><span className="flex items-center gap-1"><DeviceIcon device={d.device}/>{d.device}</span><b>{d.count}</b></div>)}
              {stats.byDevice.length===0 && <span className="text-slate-500">No data</span>}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs text-slate-600 uppercase font-semibold tracking-wide">By Browser</div>
            <div className="mt-2 space-y-1 text-xs">
              {stats.byBrowser.slice(0,4).map(b=> <div key={b.browser} className="flex justify-between"><span>{b.browser}</span><b>{b.count}</b></div>)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Active by Role</div>
            <div className="mt-2 space-y-1 text-xs max-h-20 overflow-auto">
              {stats.activeByRole.slice(0,5).map(r=> <div key={r.role} className="flex justify-between"><span className="truncate">{r.role}</span><b>{r.count}</b></div>)}
            </div>
          </div>
        </div>
      )}

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs flex items-center gap-2"><AlertTriangle className="w-4 h-4"/>{error}</div>}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button onClick={()=>setTab("sessions")} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab==="sessions"?'bg-slate-900 text-white':'bg-white text-slate-700 border border-slate-200'}`}>Live Sessions & Devices</button>
        <button onClick={()=>setTab("attempts")} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab==="attempts"?'bg-slate-900 text-white':'bg-white text-slate-700 border border-slate-200'}`}>Login Attempts {stats && stats.failedLoginsLast24h>0 && <span className="ml-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">{stats.failedLoginsLast24h}</span>}</button>
        <button onClick={exportCsv} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">Export CSV</button>
        <button onClick={fetchAll} className="ml-auto px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"><RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/>Refresh</button>
      </div>

      {tab==="sessions" ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-100 bg-slate-50">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email, IP, browser, OS…" className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm"/>
            </div>
            <select value={filterActive} onChange={e=>setFilterActive(e.target.value as any)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold">
              <option value="ALL">All Sessions</option>
              <option value="Active">Active Only</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                <tr><th className="text-left px-3 py-2">User</th><th className="text-left px-3 py-2">IP Address</th><th className="text-left px-3 py-2">Device Details</th><th className="text-left px-3 py-2">Location</th><th className="text-left px-3 py-2">Login / Last Active</th><th className="text-left px-3 py-2">Status</th><th className="text-right px-3 py-2">Action</th></tr>
              </thead>
              <tbody>
                {sessions.map(s=>(
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900 text-xs">{s.user?.name || s.email}</div>
                      <div className="text-xs text-slate-600">{s.email} • {s.role}</div>
                      <div className="text-[11px] text-slate-600">{s.user?.department} {s.user?.region?`• ${s.user.region}`:''}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-cyan-600"/>{s.ipAddress}</div>
                      <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={s.userAgent}>{s.userAgent?.slice(0,60)}…</div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold"><DeviceIcon device={s.device}/>{s.device} • {s.browser} {s.browserVersion && <span className="text-slate-600">{s.browserVersion.split('.')[0]}</span>}</div>
                      <div className="text-slate-600">{s.os} {s.osVersion}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">{s.city || s.country ? `${s.city||''} ${s.country||''}`.trim() : <span className="text-slate-500">—</span>}</td>
                    <td className="px-3 py-2 text-xs">
                      <div>{new Date(s.loginAt).toLocaleString()}</div>
                      <div className="text-slate-600">active {timeAgo(s.lastActiveAt)}</div>
                    </td>
                    <td className="px-3 py-2">
                      {s.isActive ? <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Active</span> : <span className="px-2 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold">Terminated {s.logoutAt ? timeAgo(s.logoutAt) : ''}</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.isActive && <button onClick={()=>terminate(s.id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"><LogOut className="w-3 h-3"/>Terminate</button>}
                    </td>
                  </tr>
                ))}
                {loading && sessions.length===0 && <tr><td colSpan={7} className="text-center py-8 text-slate-600 text-sm">Loading device sessions…</td></tr>}
                {!loading && sessions.length===0 && !error && <tr><td colSpan={7} className="text-center py-8 text-slate-600 text-sm">No sessions found. Logins will appear here with IP + device details.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600"/> IT Officer sees every device that accessed the system. Use <b>Terminate</b> to force logout a suspicious session instantly.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-amber-900 text-amber-200 text-xs uppercase">
                <tr><th className="text-left px-3 py-2">Time</th><th className="text-left px-3 py-2">Email</th><th className="text-left px-3 py-2">IP</th><th className="text-left px-3 py-2">Result</th><th className="text-left px-3 py-2">Reason</th></tr>
              </thead>
              <tbody>
                {attempts.map(a=>(
                  <tr key={a.id} className={`border-b ${a.success?'border-emerald-100 bg-emerald-50/30':'border-red-100 bg-red-50/40'}`}>
                    <td className="px-3 py-2 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.ipAddress} <span className="text-slate-500">{a.country?`(${a.country})`:''}</span></td>
                    <td className="px-3 py-2">{a.success ? <span className="text-emerald-700 font-bold text-xs">Success</span> : <span className="text-red-700 font-bold text-xs">Failed</span>}</td>
                    <td className="px-3 py-2 text-xs">{a.reason || '—'}</td>
                  </tr>
                ))}
                {attempts.length===0 && <tr><td colSpan={5} className="text-center py-6 text-slate-600">No login attempts yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
