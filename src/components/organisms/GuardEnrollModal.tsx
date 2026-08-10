import React from "react";
import { UserCheck } from "lucide-react";
import type { GuardFormState } from "../../hooks/useGuardForm";
import { SITE_ZONES } from "../../types";

interface GuardEnrollModalProps {
  form: GuardFormState;
  setForm: (partial: Partial<GuardFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const GuardEnrollModal: React.FC<GuardEnrollModalProps> = ({ form, setForm, onSubmit, onClose }) => {
  const presetPhotos = [
    { label: "Officer A", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80" },
    { label: "Officer B", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
    { label: "Officer C (Female)", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80" },
    { label: "Officer D (Female)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>Enroll New Security Guard Officer & Capture HR Biodata</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Standard HR Recruitment Form (NIN, TIN, NSSF, Parents, Next of Kin, LC1 Village & Referees)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer p-1">✕</button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          {(["primary", "statutory", "family", "residence", "referees", "biodata"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setForm({ recruitmentTab: tab })}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                form.recruitmentTab === tab ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "primary" && "1. Primary & Duty"}
              {tab === "statutory" && "2. NIN, TIN & NSSF"}
              {tab === "family" && "3. Parents & Next of Kin"}
              {tab === "residence" && "4. Residence & LC1"}
              {tab === "referees" && "5. Referees & Quals"}
              {tab === "biodata" && "6. Ethnicity & Birth"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {form.recruitmentTab === "primary" && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden border-2 border-amber-400 shrink-0 shadow-sm flex items-center justify-center">
                  {form.photoUrl ? (
                    <img src={form.photoUrl} alt="Personnel Photo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">No Photo</span>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">Official Passport Photo URL</label>
                  <input type="url" value={form.photoUrl} onChange={(e) => setForm({ photoUrl: e.target.value })}
                    placeholder="https://..." className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono" />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-bold self-center">Presets:</span>
                    {presetPhotos.map((p) => (
                      <button key={p.label} type="button" onClick={() => setForm({ photoUrl: p.url })}
                        className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded text-[10px] font-bold cursor-pointer">{p.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Force Number" value={form.guardCode} onChange={(v) => setForm({ guardCode: v })} required />
                <InputField label="Full Name" value={form.fullName} onChange={(v) => setForm({ fullName: v })} required />
                <SelectField label="Designation" value={form.designation} onChange={(v) => setForm({ designation: v as GuardFormState["designation"] })}
                  options={["Guard", "Site In-Charge", "Inspector", "K9 Handler", "Armorer"]} />
                <InputField label="Phone Number" value={form.phone} onChange={(v) => setForm({ phone: v })} required />
                <InputField label="National ID (NIN)" value={form.nationalId} onChange={(v) => setForm({ nationalId: v })} required />
                <SelectField label="Assigned Site" value={form.assignedSite} onChange={(v) => setForm({ assignedSite: v })}
                  options={["Bank of East Africa Headquarters", "Nakumatt Jubilee Mall", "Speke Resort Munyonyo", "Entebbe International Airport", "Shell Uganda Fuel Depot - Jinja", "Uganda Telecom Towers"]} />
                <SelectField label="Region" value={form.region} onChange={(v) => setForm({ region: v })}
                  options={["Central (Kampala HQ)", "Western (Mbarara Station)", "Northern (Gulu Station)", "Eastern (Jinja Station)"]} />
                {(form.designation === "Inspector" || form.designation === "Site In-Charge") && (
                  <SelectField label="Zone" value={form.zone || "Central Business"} onChange={(v) => setForm({ zone: v })}
                    options={SITE_ZONES as unknown as string[]} />
                )}
                <InputField label="Location" value={form.guardLocation} onChange={(v) => setForm({ guardLocation: v })} />
                <SelectField label="Assigned Gender" value={form.gender || "Male"} onChange={(v) => setForm({ gender: v as "Male" | "Female" })}
                  options={["Male", "Female"]} />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <CheckboxField label="Finished Probation" checked={form.finishedProbation} onChange={(v) => setForm({ finishedProbation: v })} />
                <CheckboxField label="Armed Qualified" checked={form.armedQualified} onChange={(v) => setForm({ armedQualified: v })} />
                <CheckboxField label="K9 Qualified" checked={form.k9Qualified} onChange={(v) => setForm({ k9Qualified: v })} />
              </div>
            </div>
          )}

          {form.recruitmentTab === "statutory" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="TIN (Tax ID)" value={form.tin} onChange={(v) => setForm({ tin: v })} />
                <InputField label="NSSF Number" value={form.nssfNo} onChange={(v) => setForm({ nssfNo: v })} />
                <InputField label="Date of Birth" value={form.dateOfBirth} onChange={(v) => setForm({ dateOfBirth: v })} type="date" />
                <SelectField label="Marital Status" value={form.maritalStatus || "Single"} onChange={(v) => setForm({ maritalStatus: v as "Single" | "Married" | "Widowed" | "Divorced" })}
                  options={["Single", "Married", "Widowed", "Divorced"]} />
                <InputField label="Bank Name" value={form.bankName} onChange={(v) => setForm({ bankName: v })} />
                <InputField label="Bank Branch" value={form.bankBranch} onChange={(v) => setForm({ bankBranch: v })} />
                <InputField label="Account Name" value={form.bankAccountName} onChange={(v) => setForm({ bankAccountName: v })} />
                <InputField label="Account Number" value={form.bankAccount} onChange={(v) => setForm({ bankAccount: v })} />
              </div>
              <InputField label="Education Level" value={form.educationLevel} onChange={(v) => setForm({ educationLevel: v })} />
            </div>
          )}

          {form.recruitmentTab === "family" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Mother's Name" value={form.motherName} onChange={(v) => setForm({ motherName: v })} />
                <InputField label="Mother's Phone" value={form.motherPhone} onChange={(v) => setForm({ motherPhone: v })} />
                <InputField label="Father's Name" value={form.fatherName} onChange={(v) => setForm({ fatherName: v })} />
                <InputField label="Father's Phone" value={form.fatherPhone} onChange={(v) => setForm({ fatherPhone: v })} />
                <InputField label="Next of Kin Name" value={form.nextOfKinName} onChange={(v) => setForm({ nextOfKinName: v })} />
                <SelectField label="Relationship" value={form.nextOfKinRelationship} onChange={(v) => setForm({ nextOfKinRelationship: v })}
                  options={["Spouse", "Parent", "Sibling", "Child", "Other"]} />
                <InputField label="Next of Kin Phone" value={form.nextOfKinPhone} onChange={(v) => setForm({ nextOfKinPhone: v })} />
                <InputField label="Next of Kin Residence" value={form.nextOfKinResidence} onChange={(v) => setForm({ nextOfKinResidence: v })} />
              </div>
            </div>
          )}

          {form.recruitmentTab === "residence" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="District" value={form.residenceDistrict} onChange={(v) => setForm({ residenceDistrict: v })} />
                <InputField label="Sub-County" value={form.residenceSubCounty} onChange={(v) => setForm({ residenceSubCounty: v })} />
                <InputField label="Parish" value={form.residenceParish} onChange={(v) => setForm({ residenceParish: v })} />
                <InputField label="Village" value={form.residenceVillage} onChange={(v) => setForm({ residenceVillage: v })} />
                <InputField label="LC1 Chairperson" value={form.lc1Chairperson} onChange={(v) => setForm({ lc1Chairperson: v })} />
                <InputField label="LC1 Contact" value={form.lc1Contact} onChange={(v) => setForm({ lc1Contact: v })} />
                <div className="col-span-2">
                  <InputField label="Physical Address" value={form.physicalAddress} onChange={(v) => setForm({ physicalAddress: v })} />
                </div>
              </div>
            </div>
          )}

          {form.recruitmentTab === "referees" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(v) => setForm({ emergencyContactPhone: v })} />
                <InputField label="Relatives / Referees" value={form.relativesOrReferees} onChange={(v) => setForm({ relativesOrReferees: v })} />
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800">Certifications (auto-assigned on enrollment):</p>
                <p className="text-slate-600">Basic Security Training, Crowd Control & Ethics</p>
              </div>
            </div>
          )}

          {form.recruitmentTab === "biodata" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Surname at Birth" value={form.surnameAtBirth} onChange={(v) => setForm({ surnameAtBirth: v })} />
                <InputField label="Nationality" value={form.nationality} onChange={(v) => setForm({ nationality: v })} />
                <InputField label="Tribe" value={form.tribe} onChange={(v) => setForm({ tribe: v })} />
                <InputField label="Place of Birth" value={form.placeOfBirth} onChange={(v) => setForm({ placeOfBirth: v })} />
                <InputField label="LC2 Chairperson" value={form.lc2Chairperson} onChange={(v) => setForm({ lc2Chairperson: v })} />
                <InputField label="Father's Residence" value={form.fatherResidence} onChange={(v) => setForm({ fatherResidence: v })} />
                <InputField label="Close Relatives (comma-separated, max 3)" value={form.closeRelatives} onChange={(v) => setForm({ closeRelatives: v })} />
                <InputField label="Neighbours (comma-separated, max 2)" value={form.neighbours} onChange={(v) => setForm({ neighbours: v })} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.fatherAlive} onChange={(e) => setForm({ fatherAlive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-bold text-slate-700">Father is alive</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Enlist & Capture Biodata</span>
            </button>
          </div>
        </form>
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
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold" />
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: string[] }> = ({
  label, value, onChange, options,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold">
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const CheckboxField: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
    <span className="text-xs font-bold text-slate-700">{label}</span>
  </label>
);
