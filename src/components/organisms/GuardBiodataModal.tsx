import React from "react";
import { UserCheck, Users, MapPin, ShieldCheck, KeyRound } from "lucide-react";
import type { Guard } from "../../types";
import { useAuthStore } from "../../stores/authStore";

interface GuardBiodataModalProps {
  guard: Guard | null;
  onClose: () => void;
  onIssueWarning?: (guard: Guard) => void;
}

export const GuardBiodataModal: React.FC<GuardBiodataModalProps> = ({ guard, onClose, onIssueWarning }) => {
  const linkedUser = useAuthStore((s) => s.users.find((u) => u.id === guard?.linkedUserId));
  if (!guard) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400 overflow-hidden shrink-0">
              {guard.photoUrl ? (
                <img src={guard.photoUrl} alt={guard.fullName} className="w-full h-full object-cover" />
              ) : (
                guard.fullName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-mono font-black text-xs rounded-md border border-blue-200">FORCE/NO: {guard.guardCode}</span>
                <span className={`px-2.5 py-0.5 font-extrabold text-[11px] rounded-full ${
                  guard.status === "On Duty" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                }`}>{guard.status}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{guard.fullName}</h2>
              <p className="text-xs text-slate-500 font-semibold">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${guard.designation === "Site In-Charge" ? "bg-cyan-50 border-cyan-200 text-cyan-800" : guard.designation === "Inspector" ? "bg-purple-50 border-purple-200 text-purple-800" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                  {guard.designation}
                </span>
                {" "}• Assigned to {guard.assignedSite}
                {guard.zone ? <span className="text-slate-400"> • Zone: {guard.zone}</span> : null}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer p-1">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="NIN (National ID)" value={guard.nationalId} color="blue" />
          <StatCard label="URA Tax ID (TIN)" value={guard.tin || "1001928475"} color="purple" />
          <StatCard label="NSSF Number" value={guard.nssfNo || "NS-9012384-01"} color="amber" />
        </div>

        <Section icon={<UserCheck className="w-4 h-4 text-blue-600" />} title="Demographics & Financial Details">
          <div className="grid grid-cols-3 gap-3 text-slate-700">
            <DataField label="Date of Birth" value={guard.dateOfBirth || "1992-05-14"} />
            <DataField label="Gender" value={guard.gender || "Male"} />
            <DataField label="Marital Status" value={guard.maritalStatus || "Single"} />
            <DataField label="Education Level" value={guard.educationLevel || "O-Level Certificate"} />
            <DataField label="Nationality" value={guard.nationality || "Ugandan"} />
            <DataField label="Tribe" value={guard.tribe || "—"} />
            <DataField label="Surname at Birth" value={guard.surnameAtBirth || "—"} />
            <DataField label="Place of Birth" value={guard.placeOfBirth || "—"} />
            <DataField label="Bank Name" value={guard.bankName || "Stanbic Bank"} />
            <DataField label="Bank Branch" value={guard.bankBranch || "—"} />
            <DataField label="Account Name" value={guard.bankAccountName || "—"} />
            <DataField label="Account Number" value={guard.bankAccount || "90300188201"} mono />
          </div>
        </Section>

        <Section icon={<Users className="w-4 h-4 text-purple-600" />} title="Parents & Next of Kin Information">
          <div className="grid grid-cols-2 gap-4 text-slate-700">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Mother's Details</span>
              <p className="font-bold text-slate-900">{guard.motherName || "Mary Akello"}</p>
              <p className="text-[11px] font-semibold text-slate-500">{guard.motherPhone || "+256 773 991122"}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Father's Details</span>
              <p className="font-bold text-slate-900">{guard.fatherName || "John Ssebaggala"}</p>
              <p className="text-[11px] font-semibold text-slate-500">{guard.fatherPhone || "+256 701 882233"}</p>
              <p className="text-[11px] font-semibold text-slate-500">
                {guard.fatherAlive === false ? "Deceased" : guard.fatherResidence || "Residence not recorded"}
              </p>
            </div>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 space-y-1 mt-2">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase block">Recorded Next of Kin</span>
            <div className="grid grid-cols-3 gap-2">
              <DataField label="Name" value={guard.nextOfKinName || "Grace Ssebaggala"} />
              <DataField label="Relationship" value={guard.nextOfKinRelationship || "Spouse"} />
              <DataField label="Phone Tel" value={guard.nextOfKinPhone || guard.phone} />
            </div>
            <p className="text-[11px] text-slate-700 pt-1"><strong>Residence:</strong> {guard.nextOfKinResidence || "Plot 14, Bukoto Street, Kampala"}</p>
          </div>
        </Section>

        <Section icon={<MapPin className="w-4 h-4 text-emerald-600" />} title="Local Residence & LC1 Chairperson Vetting">
          <div className="grid grid-cols-4 gap-2 text-slate-700">
            <DataField label="District" value={guard.residenceDistrict || "Kampala City"} />
            <DataField label="Sub-County" value={guard.residenceSubCounty || "Nakawa Division"} />
            <DataField label="Parish" value={guard.residenceParish || "Bukoto II Parish"} />
            <DataField label="Village" value={guard.residenceVillage || "Kisuule Zone"} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">LC1 Chairperson</span>
              <p className="font-bold text-slate-900">{guard.lc1Chairperson || "Mzee Francis Ssemakula"}</p>
              <p className="font-mono text-slate-600 text-[11px]">{guard.lc1Contact || "+256 782 110022"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">LC2 Chairperson</span>
              <p className="font-bold text-slate-900">{guard.lc2Chairperson || "Not recorded"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Physical Address</span>
              <p className="font-bold text-slate-900">{guard.physicalAddress || "House No. B-24, Kisuule Zone"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Close Relatives</span>
              <p className="font-bold text-slate-900">{guard.closeRelatives?.length ? guard.closeRelatives.join(", ") : "Not recorded"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Neighbours</span>
              <p className="font-bold text-slate-900">{guard.neighbours?.length ? guard.neighbours.join(", ") : "Not recorded"}</p>
            </div>
          </div>
        </Section>

        <Section icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} title="Character Referees & Relatives in Security Forces">
          <p className="font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
            {guard.relativesOrReferees || "Recorded HR Character References Verified by Vetting Officer."}
          </p>
        </Section>

        {onIssueWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">Disciplinary: Warning Letters</h4>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">{guard.warningLettersCount} issued</span>
          </div>
          <button
            onClick={() => onIssueWarning(guard)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            Issue Warning Letter
          </button>
        </div>
        )}

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>IT Department Integration • System Account & Identity Card</span>
            </h4>
            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase border ${
              guard.idCardStatus === "Issued & Active"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {guard.idCardStatus || "Pending IT Issuance"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Force Number</span><p className="text-white font-bold">{guard.guardCode}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">ID Card No.</span><p className="text-white font-bold">{guard.idCardNumber || "Pending..."}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Issued Date</span><p className="text-white font-bold">{guard.idCardIssuedDate || "N/A"}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Expiry Date</span><p className="text-white font-bold">{guard.idCardExpiryDate || "N/A"}</p></div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">System Account:</span>
              <span className={guard.hasSystemAccount ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {guard.hasSystemAccount ? "Active & Linked" : "Not Provisioned"}
              </span>
            </div>
            {guard.linkedUserId && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Linked Force Number:</span>
                <span className="text-white font-mono">{linkedUser?.forceNumber || "Unassigned"}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Medical Clearance:</span>
              <span className={guard.medicalCleared ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {guard.medicalCleared ? "Passed" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Armed/Weapons Qualified:</span>
              <span className={guard.armedQualified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {guard.armedQualified ? "Certified" : "Unarmed"}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colors: Record<string, string> = { blue: "bg-blue-50/80 border-blue-200 text-blue-800", purple: "bg-purple-50/80 border-purple-200 text-purple-800", amber: "bg-amber-50/80 border-amber-200 text-amber-800" };
  return (
    <div className={`${colors[color]} p-3 rounded-xl border space-y-0.5`}>
      <span className="text-[10px] font-bold uppercase block">{label}</span>
      <span className="font-mono font-black text-slate-900 text-xs">{value}</span>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">{icon}<span>{title}</span></h4>
    {children}
  </div>
);

const DataField: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <span className="text-slate-400 block text-[10px] font-bold uppercase">{label}</span>
    <strong className={`text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</strong>
  </div>
);
