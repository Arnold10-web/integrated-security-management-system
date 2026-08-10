import React, { useState } from "react";
import { Building2, MapPin, Plus, Edit3, Trash2, CheckCircle2 } from "lucide-react";
import type { RegionalOffice, User } from "../../types";

interface RegionalOfficesGridProps {
  offices: RegionalOffice[];
  users: User[];
  isITOfficer?: boolean;
  onAddRegion?: (r: Omit<RegionalOffice, "id">) => void;
  onUpdateRegion?: (id: string, updates: Partial<RegionalOffice>) => void;
  onDeleteRegion?: (id: string) => void;
}

export const RegionalOfficesGrid: React.FC<RegionalOfficesGridProps> = ({ offices, users, isITOfficer, onAddRegion, onUpdateRegion, onDeleteRegion }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RegionalOffice | null>(null);
  const [form, setForm] = useState({
    code: "", name: "", regionName: "", locationCity: "", regionalManagerName: "", phone: "", email: "",
    activeGuardsCount: 0, clientSitesCount: 0, armouryVaultStatus: "Fully Operational" as RegionalOffice["armouryVaultStatus"], vehiclesAssigned: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing && onUpdateRegion) {
      onUpdateRegion(editing.id, form);
    } else if (onAddRegion) {
      onAddRegion(form);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ code: "", name: "", regionName: "", locationCity: "", regionalManagerName: "", phone: "", email: "", activeGuardsCount: 0, clientSitesCount: 0, armouryVaultStatus: "Fully Operational", vehiclesAssigned: 0 });
  };

  const handleEdit = (r: RegionalOffice) => {
    setEditing(r);
    setForm({ code: r.code, name: r.name, regionName: r.regionName, locationCity: r.locationCity, regionalManagerName: r.regionalManagerName, phone: r.phone, email: r.email, activeGuardsCount: r.activeGuardsCount, clientSitesCount: r.clientSitesCount, armouryVaultStatus: r.armouryVaultStatus, vehiclesAssigned: r.vehiclesAssigned });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditing(null);
    setForm({ code: "", name: "", regionName: "", locationCity: "", regionalManagerName: "", phone: "", email: "", activeGuardsCount: 0, clientSitesCount: 0, armouryVaultStatus: "Fully Operational", vehiclesAssigned: 0 });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Regional Stations & Field Outpost Directory
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Regional staff keep their primary functional department while attached to specific regional stations.
          </p>
        </div>
        {isITOfficer && (
          <button onClick={handleNew}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shrink-0">
            <Plus className="w-4 h-4" /><span>New Region</span>
          </button>
        )}
      </div>

      {offices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="text-center py-8 text-slate-400 italic text-xs">No regional offices configured yet.</div>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offices.map((office) => {
          const staffInRegion = users.filter(
            (u) => (u.region || "").toLowerCase().includes(office.regionName.toLowerCase()) || (u.region || "").toLowerCase().includes(office.code.toLowerCase())
          );
          return (
            <div key={office.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between relative group">
              {isITOfficer && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(office)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (window.confirm(`Delete region ${office.name}?`)) onDeleteRegion?.(office.id); }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase border border-amber-300 font-mono">
                    {office.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">{office.regionName}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{office.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{office.locationCity}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Regional Manager:</span>
                  <span className="font-bold text-slate-900">{office.regionalManagerName}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Armoury Vault:</span>
                  <span className="font-bold text-emerald-700">{office.armouryVaultStatus}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-black">Guards</div>
                    <div className="text-sm font-black text-slate-900">{office.activeGuardsCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-black">Sites</div>
                    <div className="text-sm font-black text-slate-900">{office.clientSitesCount}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-black">Staff</div>
                    <div className="text-sm font-black text-cyan-700">{staffInRegion.length}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              {editing ? "Edit Region" : "Create New Region"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" placeholder="e.g. KMP-CENT" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region Name</label>
                  <input required value={form.regionName} onChange={(e) => setForm({ ...form, regionName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Station Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input required value={form.locationCity} onChange={(e) => setForm({ ...form, locationCity: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Manager</label>
                  <input required value={form.regionalManagerName} onChange={(e) => setForm({ ...form, regionalManagerName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Guards</label>
                  <input type="number" value={form.activeGuardsCount} onChange={(e) => setForm({ ...form, activeGuardsCount: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sites</label>
                  <input type="number" value={form.clientSitesCount} onChange={(e) => setForm({ ...form, clientSitesCount: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicles</label>
                  <input type="number" value={form.vehiclesAssigned} onChange={(e) => setForm({ ...form, vehiclesAssigned: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Armoury Status</label>
                <select value={form.armouryVaultStatus} onChange={(e) => setForm({ ...form, armouryVaultStatus: e.target.value as RegionalOffice["armouryVaultStatus"] })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl outline-none bg-white font-semibold">
                  <option value="Fully Operational">Fully Operational</option>
                  <option value="Restricted Vault">Restricted Vault</option>
                  <option value="Main Hub Vault">Main Hub Vault</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editing ? "Update Region" : "Create Region"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
