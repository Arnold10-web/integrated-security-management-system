import React, { useState } from "react";
import { UserCheck, IdCard } from "lucide-react";
import type { User } from "../../types";

type StaffTab = "primary" | "statutory" | "family" | "residence" | "referees" | "biodata";

interface StaffBiodataModalProps {
  staff: User | null;
  onClose: () => void;
  onUpdateUser?: (userId: string, updates: Partial<User>) => void;
  onIssueStaffId?: (userId: string, idCardNumber: string) => void;
}

export const StaffBiodataModal: React.FC<StaffBiodataModalProps> = ({ staff, onClose, onUpdateUser, onIssueStaffId }) => {
  const [tab, setTab] = useState<StaffTab>("primary");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<User>>(() => staff ? { ...staff } : {});
  if (!staff) return null;

  const f = (key: keyof User) => form[key] ?? "";

  const save = () => {
    const updates: Partial<User> = { ...form };
    const arrFields: Array<keyof User> = ["closeRelatives", "neighbours"];
    for (const k of arrFields) {
      const v = updates[k];
      if (typeof v === "string") {
        updates[k] = (v as string).split(",").map((x) => x.trim()).filter(Boolean) as never;
      }
    }
    onUpdateUser?.(staff.id, updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const issueCard = () => {
    const cardNum = `ID-UG-2026-${staff.forceNumber?.replace(/\D/g, "") || String(Math.floor(1000 + Math.random() * 9000))}`;
    onIssueStaffId?.(staff.id, cardNum);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Staff Personnel File — {staff.name}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {staff.forceNumber || "No force number assigned"} · {staff.department} · {staff.role}
                {staff.idCardStatus ? ` · ID: ${staff.idCardStatus}` : ""}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1">✕</button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
            {(["primary", "statutory", "family", "residence", "referees", "biodata"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  tab === t ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t === "primary" && "1. Personal & Duty"}
                {t === "statutory" && "2. Statutory & Finance"}
                {t === "family" && "3. Parents & Next of Kin"}
                {t === "residence" && "4. Residence & LC1"}
                {t === "referees" && "5. Referees & Contacts"}
                {t === "biodata" && "6. Ethnicity & Birth"}
              </button>
            ))}
          </div>

          <div className="space-y-4 text-xs max-h-[55vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border-2 border-indigo-400 shrink-0 shadow-sm flex items-center justify-center">
                {f("photoUrl") ? (
                  <img src={String(f("photoUrl"))} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-xs">No Photo</span>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">Official Passport Photo URL</label>
                <input type="url" value={String(f("photoUrl"))} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="https://..." className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono" />
              </div>
            </div>

            {tab === "primary" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Full Name" value={String(f("name"))} onChange={(v) => setForm({ ...form, name: v })} required />
                <InputField label="Force Number" value={String(f("forceNumber") ?? "")} onChange={(v) => setForm({ ...form, forceNumber: v })} />
                <InputField label="Email" value={String(f("email"))} onChange={(v) => setForm({ ...form, email: v })} />
                <InputField label="Phone" value={String(f("phone") ?? "")} onChange={(v) => setForm({ ...form, phone: v })} />
                <InputField label="Department" value={String(f("department"))} onChange={(v) => setForm({ ...form, department: v })} />
                <InputField label="Role / Designation" value={String(f("role"))} onChange={(v) => setForm({ ...form, role: v as User["role"] })} />
                <InputField label="Region" value={String(f("region") ?? "")} onChange={(v) => setForm({ ...form, region: v })} />
                <InputField label="Last Active" value={String(f("lastActive"))} onChange={(v) => setForm({ ...form, lastActive: v })} />
              </div>
            )}

            {tab === "statutory" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Date of Birth" value={String(f("dateOfBirth") ?? "")} onChange={(v) => setForm({ ...form, dateOfBirth: v })} type="date" />
                <SelectField label="Gender" value={String(f("gender") ?? "Male")} onChange={(v) => setForm({ ...form, gender: v })}
                  options={["Male", "Female"]} />
                <SelectField label="Marital Status" value={String(f("maritalStatus") ?? "Single")} onChange={(v) => setForm({ ...form, maritalStatus: v })}
                  options={["Single", "Married", "Widowed", "Divorced"]} />
                <InputField label="Education Level" value={String(f("educationLevel") ?? "")} onChange={(v) => setForm({ ...form, educationLevel: v })} />
              </div>
            )}

            {tab === "family" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Mother's Name" value={String(f("motherName") ?? "")} onChange={(v) => setForm({ ...form, motherName: v })} />
                <InputField label="Mother's Phone" value={String(f("motherPhone") ?? "")} onChange={(v) => setForm({ ...form, motherPhone: v })} />
                <InputField label="Father's Name" value={String(f("fatherName") ?? "")} onChange={(v) => setForm({ ...form, fatherName: v })} />
                <InputField label="Father's Phone" value={String(f("fatherPhone") ?? "")} onChange={(v) => setForm({ ...form, fatherPhone: v })} />
                <InputField label="Father's Residence" value={String(f("fatherResidence") ?? "")} onChange={(v) => setForm({ ...form, fatherResidence: v })} />
                <label className="flex items-center gap-2 cursor-pointer pt-5">
                  <input type="checkbox" checked={form.fatherAlive !== false} onChange={(e) => setForm({ ...form, fatherAlive: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-xs font-bold text-slate-700">Father is alive</span>
                </label>
                <InputField label="Next of Kin Name" value={String(f("nextOfKinName") ?? "")} onChange={(v) => setForm({ ...form, nextOfKinName: v })} />
                <SelectField label="Next of Kin Relationship" value={String(f("nextOfKinRelationship") ?? "Spouse")} onChange={(v) => setForm({ ...form, nextOfKinRelationship: v })}
                  options={["Spouse", "Parent", "Sibling", "Child", "Other"]} />
                <InputField label="Next of Kin Phone" value={String(f("nextOfKinPhone") ?? "")} onChange={(v) => setForm({ ...form, nextOfKinPhone: v })} />
                <InputField label="Next of Kin Residence" value={String(f("nextOfKinResidence") ?? "")} onChange={(v) => setForm({ ...form, nextOfKinResidence: v })} />
              </div>
            )}

            {tab === "residence" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="District" value={String(f("residenceDistrict") ?? "")} onChange={(v) => setForm({ ...form, residenceDistrict: v })} />
                <InputField label="Sub-County" value={String(f("residenceSubCounty") ?? "")} onChange={(v) => setForm({ ...form, residenceSubCounty: v })} />
                <InputField label="Parish" value={String(f("residenceParish") ?? "")} onChange={(v) => setForm({ ...form, residenceParish: v })} />
                <InputField label="Village" value={String(f("residenceVillage") ?? "")} onChange={(v) => setForm({ ...form, residenceVillage: v })} />
                <InputField label="LC1 Chairperson" value={String(f("lc1Chairperson") ?? "")} onChange={(v) => setForm({ ...form, lc1Chairperson: v })} />
                <InputField label="LC1 Contact" value={String(f("lc1Contact") ?? "")} onChange={(v) => setForm({ ...form, lc1Contact: v })} />
                <InputField label="LC2 Chairperson" value={String(f("lc2Chairperson") ?? "")} onChange={(v) => setForm({ ...form, lc2Chairperson: v })} />
                <div className="col-span-2">
                  <InputField label="Physical Address" value={String(f("physicalAddress") ?? "")} onChange={(v) => setForm({ ...form, physicalAddress: v })} />
                </div>
              </div>
            )}

            {tab === "referees" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Emergency Contact Phone" value={String(f("emergencyContactPhone") ?? "")} onChange={(v) => setForm({ ...form, emergencyContactPhone: v })} />
                <InputField label="Relatives / Referees" value={String(f("relativesOrReferees") ?? "")} onChange={(v) => setForm({ ...form, relativesOrReferees: v })} />
              </div>
            )}

            {tab === "biodata" && (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Surname at Birth" value={String(f("surnameAtBirth") ?? "")} onChange={(v) => setForm({ ...form, surnameAtBirth: v })} />
                <InputField label="Nationality" value={String(f("nationality") ?? "")} onChange={(v) => setForm({ ...form, nationality: v })} />
                <InputField label="Tribe" value={String(f("tribe") ?? "")} onChange={(v) => setForm({ ...form, tribe: v })} />
                <InputField label="Place of Birth" value={String(f("placeOfBirth") ?? "")} onChange={(v) => setForm({ ...form, placeOfBirth: v })} />
                <InputField label="Close Relatives (comma-separated, max 3)" value={Array.isArray(form.closeRelatives) ? form.closeRelatives.join(", ") : String(f("closeRelatives") ?? "")} onChange={(v) => setForm({ ...form, closeRelatives: v as never })} />
                <InputField label="Neighbours (comma-separated, max 2)" value={Array.isArray(form.neighbours) ? form.neighbours.join(", ") : String(f("neighbours") ?? "")} onChange={(v) => setForm({ ...form, neighbours: v as never })} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {onIssueStaffId ? (
                <button
                  onClick={issueCard}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  <IdCard className="w-4 h-4" />Issue Staff ID Card
                </button>
              ) : (
                <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold border border-slate-200" title="Only Records Officer may issue ID cards">Records Officer issues</span>
              )}
              {saved && <span className="text-[11px] font-bold text-emerald-600 animate-pulse">Saved ✓</span>}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button onClick={save}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Save Personnel File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }> = ({
  label, value, onChange, required, type = "text",
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
    <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold" />
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({
  label, value, onChange, options,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold">
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);
