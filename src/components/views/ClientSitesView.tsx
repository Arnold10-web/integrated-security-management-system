import React, { useState } from "react";
import {
  Building,
  MapPin,
  Dog,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Map as MapIcon,
  Star,
  Radio,
  Award,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ClientSite, SiteZone, SITE_ZONES } from "../../types";
import { UGANDA_REGIONS } from "../../constants/regions";
import { useAuthStore } from "../../stores/authStore";
import { MARKETING_ROLES } from "../../services/rbacService";

const SITE_MANAGER_ROLES: string[] = MARKETING_ROLES;

const SLA_COLORS: Record<string, string> = {
  Compliant: "#10b981",
  Understaffed: "#f59e0b",
  "Attention Needed": "#ef4444",
};

interface ClientSitesViewProps {
  sites: ClientSite[];
  onAddSite: (newSite: Omit<ClientSite, "id">) => void;
  onUpdateSite?: (id: string, updates: Partial<ClientSite>) => void;
  onDeleteSite?: (id: string) => void;
}

const unarmed = (total: number, armed: number) => Math.max(0, total - (armed || 0));

export const ClientSitesView: React.FC<ClientSitesViewProps> = ({ sites, onAddSite, onUpdateSite, onDeleteSite }) => {
  const activeRole = useAuthStore((s) => s.currentUser?.role);
  const canManage = activeRole !== undefined && SITE_MANAGER_ROLES.includes(activeRole);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSite, setEditSite] = useState<ClientSite | null>(null);

  // Form states
  const [clientName, setClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [location, setLocation] = useState("");
  const [zone, setZone] = useState<SiteZone>("Central Business");
  const [region, setRegion] = useState("");
  const [dayShiftGuards, setDayShiftGuards] = useState(6);
  const [nightShiftGuards, setNightShiftGuards] = useState(6);
  const [dayShiftArmed, setDayShiftArmed] = useState(2);
  const [nightShiftArmed, setNightShiftArmed] = useState(2);
  const [armedGuardsRequired, setArmedGuardsRequired] = useState(2);
  const [k9Required, setK9Required] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const slaClass = (status: ClientSite["slaStatus"]) =>
    status === "Compliant"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Understaffed"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-700";

  const renderStars = (rating: number) => (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
    </span>
  );

  const analytics = React.useMemo(() => {
    const totalSites = sites.length;
    const daySlots = sites.reduce((a, s) => a + s.dayShiftGuards, 0);
    const nightSlots = sites.reduce((a, s) => a + s.nightShiftGuards, 0);
    const dayArmed = sites.reduce((a, s) => a + (s.dayShiftArmed || 0), 0);
    const nightArmed = sites.reduce((a, s) => a + (s.nightShiftArmed || 0), 0);
    const totalSlots = daySlots + nightSlots;
    const totalArmed = dayArmed + nightArmed;
    const armedPct = totalSlots ? Math.round((totalArmed / totalSlots) * 100) : 0;
    const compliant = sites.filter((s) => s.slaStatus === "Compliant").length;
    const understaffed = sites.filter((s) => s.slaStatus === "Understaffed").length;
    const attention = sites.filter((s) => s.slaStatus === "Attention Needed").length;
    const atRisk = sites.filter((s) => s.slaStatus !== "Compliant");
    const rated = sites.filter((s) => s.satisfactionRating);
    const avgSatisfaction = rated.length
      ? (rated.reduce((a, s) => a + (s.satisfactionRating || 0), 0) / rated.length).toFixed(1)
      : "—";
    const zoneData = SITE_ZONES.map((z) => {
      const inZone = sites.filter((s) => s.zone === z);
      const day = inZone.reduce((a, s) => a + s.dayShiftGuards, 0);
      const night = inZone.reduce((a, s) => a + s.nightShiftGuards, 0);
      const dArmed = inZone.reduce((a, s) => a + (s.dayShiftArmed || 0), 0);
      const nArmed = inZone.reduce((a, s) => a + (s.nightShiftArmed || 0), 0);
      return {
        zone: z,
        sites: inZone.length,
        armed: dArmed + nArmed,
        unarmed: Math.max(0, day + night - dArmed - nArmed),
      };
    }).filter((d) => d.sites > 0);
    const slaData = [
      { name: "Compliant", value: compliant },
      { name: "Understaffed", value: understaffed },
      { name: "Attention Needed", value: attention },
    ].filter((d) => d.value > 0);
    return { totalSites, totalSlots, totalArmed, armedPct, compliant, atRisk, avgSatisfaction, zoneData, slaData };
  }, [sites]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !siteName) return;
    onAddSite({
      clientName,
      siteName,
      location,
      zone,
      region: region || undefined,
      dayShiftGuards: Number(dayShiftGuards),
      nightShiftGuards: Number(nightShiftGuards),
      dayShiftArmed: Math.min(Number(dayShiftArmed), Number(dayShiftGuards)),
      nightShiftArmed: Math.min(Number(nightShiftArmed), Number(nightShiftGuards)),
      armedGuardsRequired: Number(armedGuardsRequired),
      k9Required,
      contactPerson,
      contactPhone,
      slaStatus: "Compliant",
    });
    setShowAddModal(false);
    setClientName("");
    setSiteName("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <Building className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Clients & Site Post Directory</h2>
            <p className="text-xs text-slate-500">
              Contract SLAs, day/night shift guard quotas with armed splits, zone & K9 requirements, post contact heads.
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Site Post</span>
          </button>
        )}
      </div>

      {/* Client Portfolio Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Client Portfolio Analytics</h3>
            <p className="text-xs text-slate-500">
              Armed coverage, SLA health and zone distribution across the client portfolio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-2xl font-black text-slate-900">{analytics.totalSites}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Active Site Posts</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="text-2xl font-black text-slate-900">{analytics.totalSlots}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Guard Slots / Shift</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="text-2xl font-black text-purple-700">{analytics.totalArmed}</div>
            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-1">
              Armed Posts · {analytics.armedPct}% coverage
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-2xl font-black text-emerald-700">
              {analytics.compliant}
              <span className="text-sm text-emerald-400 font-bold">/{analytics.totalSites}</span>
            </div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">
              SLA Compliant · Rating {analytics.avgSatisfaction}/5
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Guard Strength by Zone (Armed vs Unarmed)
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.zoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zone" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="armed" name="Armed" stackId="a" fill="#7c3aed" radius={[0, 0, 4, 4]} />
                <Bar dataKey="unarmed" name="Unarmed" stackId="a" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">SLA Health Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.slaData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} label>
                  {analytics.slaData.map((entry) => (
                    <Cell key={entry.name} fill={SLA_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {analytics.atRisk.length > 0 && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              SLA Attention — {analytics.atRisk.length} site(s) require action
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {analytics.atRisk.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">
                    {s.siteName} <span className="text-slate-400 font-normal">· {s.clientName}</span>
                  </span>
                  <span className={`font-bold shrink-0 ml-2 ${s.slaStatus === "Understaffed" ? "text-amber-600" : "text-rose-600"}`}>
                    {s.slaStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sites.map((site) => (
          <div key={site.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded">
                    {site.clientName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    <Layers className="w-3 h-3" /> {site.zone}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1.5">{site.siteName}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {site.location}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${slaClass(site.slaStatus)}`}>
                  {site.slaStatus}
                </span>
                {site.satisfactionRating ? renderStars(site.satisfactionRating) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-600">
              {site.region && (
                <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                  <MapIcon className="w-3 h-3 text-slate-400" /> {site.region}
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <Radio className="w-3 h-3 text-slate-400" /> {site.deploymentStatus || "Not Deployed"}
              </span>
              {site.wonBy && (
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2 py-1">
                  <Award className="w-3 h-3" /> Won by {site.wonBy}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">☀️ Day Shift</span>
                <span className="font-extrabold text-slate-900 text-sm">{site.dayShiftGuards} Guards</span>
                <span className="block text-[11px] mt-0.5">
                  <span className="text-emerald-600 font-bold">{site.dayShiftArmed || 0} Armed</span>
                  <span className="text-slate-400"> • </span>
                  <span className="text-slate-500 font-semibold">
                    {unarmed(site.dayShiftGuards, site.dayShiftArmed)} Unarmed
                  </span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">🌙 Night Shift</span>
                <span className="font-extrabold text-slate-900 text-sm">{site.nightShiftGuards} Guards</span>
                <span className="block text-[11px] mt-0.5">
                  <span className="text-emerald-600 font-bold">{site.nightShiftArmed || 0} Armed</span>
                  <span className="text-slate-400"> • </span>
                  <span className="text-slate-500 font-semibold">
                    {unarmed(site.nightShiftGuards, site.nightShiftArmed)} Unarmed
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-400 font-medium block">Site Contact Person</span>
                <span className="font-semibold text-slate-800">{site.contactPerson}</span>
                <span className="text-[11px] text-slate-500 block">{site.contactPhone}</span>
              </div>

              {site.k9Required && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs">
                  <Dog className="w-3.5 h-3.5" /> K9 Unit Mandated
                </span>
              )}
            </div>
            {canManage && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setEditSite(site)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => { if (window.confirm(`Delete site ${site.siteName}?`)) onDeleteSite?.(site.id); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Add Site */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">Onboard New Client Site Post</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Chartered"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Site Post Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Vault Branch"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Speke Road Plot 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zone</label>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value as SiteZone)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SITE_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Region (optional)</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">— Not assigned —</option>
                    {UGANDA_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day Guards</label>
                  <input
                    type="number"
                    min={1}
                    value={dayShiftGuards}
                    onChange={(e) => setDayShiftGuards(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Night Guards</label>
                  <input
                    type="number"
                    min={1}
                    value={nightShiftGuards}
                    onChange={(e) => setNightShiftGuards(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Armed Quota</label>
                  <input
                    type="number"
                    min={0}
                    value={armedGuardsRequired}
                    onChange={(e) => setArmedGuardsRequired(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day Shift Armed</label>
                  <input
                    type="number"
                    min={0}
                    max={Number(dayShiftGuards)}
                    value={dayShiftArmed}
                    onChange={(e) => setDayShiftArmed(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Night Shift Armed</label>
                  <input
                    type="number"
                    min={0}
                    max={Number(nightShiftGuards)}
                    value={nightShiftArmed}
                    onChange={(e) => setNightShiftArmed(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Chief Security Officer"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+256 700 112233"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={k9Required}
                  onChange={(e) => setK9Required(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>K9 Canine Patrol Mandated by Contract SLA</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Site Post
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Site */}
      {editSite && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">Edit Site Post</h3>
              <button onClick={() => setEditSite(null)} className="text-slate-400 text-sm font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                onUpdateSite?.(editSite.id, {
                  clientName: fd.get("clientName") as string,
                  siteName: fd.get("siteName") as string,
                  location: fd.get("location") as string,
                  zone: fd.get("zone") as SiteZone,
                  region: (fd.get("region") as string) || undefined,
                  dayShiftGuards: Number(fd.get("dayShiftGuards")),
                  nightShiftGuards: Number(fd.get("nightShiftGuards")),
                  dayShiftArmed: Number(fd.get("dayShiftArmed")),
                  nightShiftArmed: Number(fd.get("nightShiftArmed")),
                  armedGuardsRequired: Number(fd.get("armedGuardsRequired")),
                  k9Required: fd.get("k9Required") === "on",
                  contactPerson: fd.get("contactPerson") as string,
                  contactPhone: fd.get("contactPhone") as string,
                  slaStatus: fd.get("slaStatus") as ClientSite["slaStatus"],
                  deploymentStatus: fd.get("deploymentStatus") as ClientSite["deploymentStatus"],
                  satisfactionRating: fd.get("satisfactionRating") ? Number(fd.get("satisfactionRating")) : undefined,
                });
                setEditSite(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Client Organization</label>
                  <input
                    name="clientName"
                    type="text"
                    required
                    defaultValue={editSite.clientName}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Site Post Name</label>
                  <input
                    name="siteName"
                    type="text"
                    required
                    defaultValue={editSite.siteName}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Location Address</label>
                <input
                  name="location"
                  type="text"
                  required
                  defaultValue={editSite.location}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zone</label>
                  <select
                    name="zone"
                    defaultValue={editSite.zone}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {SITE_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Region</label>
                  <select
                    name="region"
                    defaultValue={editSite.region || ""}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">— Not assigned —</option>
                    {UGANDA_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day Guards</label>
                  <input
                    name="dayShiftGuards"
                    type="number"
                    min={1}
                    defaultValue={editSite.dayShiftGuards}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Night Guards</label>
                  <input
                    name="nightShiftGuards"
                    type="number"
                    min={1}
                    defaultValue={editSite.nightShiftGuards}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Armed Quota</label>
                  <input
                    name="armedGuardsRequired"
                    type="number"
                    min={0}
                    defaultValue={editSite.armedGuardsRequired}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Day Shift Armed</label>
                  <input
                    name="dayShiftArmed"
                    type="number"
                    min={0}
                    defaultValue={editSite.dayShiftArmed || 0}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Night Shift Armed</label>
                  <input
                    name="nightShiftArmed"
                    type="number"
                    min={0}
                    defaultValue={editSite.nightShiftArmed || 0}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SLA Status</label>
                  <select
                    name="slaStatus"
                    defaultValue={editSite.slaStatus}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Compliant">Compliant</option>
                    <option value="Understaffed">Understaffed</option>
                    <option value="Attention Needed">Attention Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deployment Status</label>
                  <select
                    name="deploymentStatus"
                    defaultValue={editSite.deploymentStatus || "Not Deployed"}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Not Deployed">Not Deployed</option>
                    <option value="Deployed">Deployed</option>
                    <option value="Partially Deployed">Partially Deployed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satisfaction Rating (1-5)</label>
                  <input
                    name="satisfactionRating"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={editSite.satisfactionRating ?? ""}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pb-2.5">
                    <input
                      name="k9Required"
                      type="checkbox"
                      defaultChecked={editSite.k9Required}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>K9 Patrol</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    name="contactPerson"
                    type="text"
                    defaultValue={editSite.contactPerson}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    name="contactPhone"
                    type="text"
                    defaultValue={editSite.contactPhone}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditSite(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
