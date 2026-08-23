import React from "react";
import { UserCheck, Users, MapPin, ShieldCheck, KeyRound } from "lucide-react";
import type { SecurityOfficer } from "../../types";
import { useAuthStore } from "../../stores/authStore";

interface SecurityOfficerBiodataModalProps {
  securityOfficer: SecurityOfficer | null;
  onClose: () => void;
}

export const SecurityOfficerBiodataModal: React.FC<SecurityOfficerBiodataModalProps> = ({ securityOfficer, onClose }) => {
  const linkedUser = useAuthStore((s) => s.users.find((u) => u.id === securityOfficer?.linkedUserId));
  if (!securityOfficer) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
          <div className="flex items-start justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400 overflow-hidden shrink-0">
              {securityOfficer.photoUrl ? (
                <img src={securityOfficer.photoUrl} alt={securityOfficer.fullName} className="w-full h-full object-cover" />
              ) : (
                securityOfficer.fullName.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-mono font-black text-xs rounded-md border border-blue-200">FORCE/NO: {securityOfficer.forceNumber}</span>
                <span className={`px-2.5 py-0.5 font-extrabold text-[11px] rounded-full ${
                  securityOfficer.status === "On Duty" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                }`}>{securityOfficer.status}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{securityOfficer.fullName}</h2>
              <p className="text-xs text-slate-500 font-semibold">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${securityOfficer.designation === "Site In-Charge" ? "bg-cyan-50 border-cyan-200 text-cyan-800" : securityOfficer.designation === "Inspector" ? "bg-purple-50 border-purple-200 text-purple-800" : "bg-slate-100 border-slate-200 text-slate-700"}`}>
                  {securityOfficer.designation}
                </span>
                {" "}• Assigned to {securityOfficer.assignedSite}
                {securityOfficer.zone ? <span className="text-slate-400"> • Zone: {securityOfficer.zone}</span> : null}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer p-1">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="NIN (National ID)" value={securityOfficer.nationalId} color="blue" />
          <StatCard label="URA Tax ID (TIN)" value={securityOfficer.tin || "1001928475"} color="purple" />
          <StatCard label="NSSF Number" value={securityOfficer.nssfNo || "NS-9012384-01"} color="amber" />
        </div>

        <Section icon={<UserCheck className="w-4 h-4 text-blue-600" />} title="Demographics & Financial Details">
          <div className="grid grid-cols-3 gap-3 text-slate-700">
            <DataField label="Date of Birth" value={securityOfficer.dateOfBirth || "1992-05-14"} />
            <DataField label="Gender" value={securityOfficer.gender || "Male"} />
            <DataField label="Marital Status" value={securityOfficer.maritalStatus || "Single"} />
            <DataField label="Education Level" value={securityOfficer.educationLevel || "O-Level Certificate"} />
            <DataField label="Nationality" value={securityOfficer.nationality || "Ugandan"} />
            <DataField label="Tribe" value={securityOfficer.tribe || "—"} />
            <DataField label="Surname at Birth" value={securityOfficer.surnameAtBirth || "—"} />
            <DataField label="Place of Birth" value={securityOfficer.placeOfBirth || "—"} />
            <DataField label="Bank Name" value={securityOfficer.bankName || "Stanbic Bank"} />
            <DataField label="Bank Branch" value={securityOfficer.bankBranch || "—"} />
            <DataField label="Account Name" value={securityOfficer.bankAccountName || "—"} />
            <DataField label="Account Number" value={securityOfficer.bankAccount || "90300188201"} mono />
          </div>
        </Section>

        <Section icon={<Users className="w-4 h-4 text-purple-600" />} title="Parents & Next of Kin Information">
          <div className="grid grid-cols-2 gap-4 text-slate-700">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Mother's Details</span>
              <p className="font-bold text-slate-900">{securityOfficer.motherName || "Mary Akello"}</p>
              <p className="text-[11px] font-semibold text-slate-500">{securityOfficer.motherPhone || "+256 773 991122"}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-purple-800 uppercase block">Father's Details</span>
              <p className="font-bold text-slate-900">{securityOfficer.fatherName || "John Ssebaggala"}</p>
              <p className="text-[11px] font-semibold text-slate-500">{securityOfficer.fatherPhone || "+256 701 882233"}</p>
              <p className="text-[11px] font-semibold text-slate-500">
                {securityOfficer.fatherAlive === false ? "Deceased" : securityOfficer.fatherResidence || "Residence not recorded"}
              </p>
            </div>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 space-y-1 mt-2">
            <span className="text-[10px] font-extrabold text-blue-900 uppercase block">Recorded Next of Kin</span>
            <div className="grid grid-cols-3 gap-2">
              <DataField label="Name" value={securityOfficer.nextOfKinName || "Grace Ssebaggala"} />
              <DataField label="Relationship" value={securityOfficer.nextOfKinRelationship || "Spouse"} />
              <DataField label="Phone Tel" value={securityOfficer.nextOfKinPhone || securityOfficer.phone} />
            </div>
            <p className="text-[11px] text-slate-700 pt-1"><strong>Residence:</strong> {securityOfficer.nextOfKinResidence || "Plot 14, Bukoto Street, Kampala"}</p>
          </div>
        </Section>

        <Section icon={<MapPin className="w-4 h-4 text-emerald-600" />} title="Local Residence & LC1 Chairperson Vetting">
          <div className="grid grid-cols-4 gap-2 text-slate-700">
            <DataField label="District" value={securityOfficer.residenceDistrict || "Kampala City"} />
            <DataField label="Sub-County" value={securityOfficer.residenceSubCounty || "Nakawa Division"} />
            <DataField label="Parish" value={securityOfficer.residenceParish || "Bukoto II Parish"} />
            <DataField label="Village" value={securityOfficer.residenceVillage || "Kisuule Zone"} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">LC1 Chairperson</span>
              <p className="font-bold text-slate-900">{securityOfficer.lc1Chairperson || "Mzee Francis Ssemakula"}</p>
              <p className="font-mono text-slate-600 text-[11px]">{securityOfficer.lc1Contact || "+256 782 110022"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">LC2 Chairperson</span>
              <p className="font-bold text-slate-900">{securityOfficer.lc2Chairperson || "Not recorded"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Physical Address</span>
              <p className="font-bold text-slate-900">{securityOfficer.physicalAddress || "House No. B-24, Kisuule Zone"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Close Relatives</span>
              <p className="font-bold text-slate-900">{securityOfficer.closeRelatives?.length ? securityOfficer.closeRelatives.join(", ") : "Not recorded"}</p>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Neighbours</span>
              <p className="font-bold text-slate-900">{securityOfficer.neighbours?.length ? securityOfficer.neighbours.join(", ") : "Not recorded"}</p>
            </div>
          </div>
        </Section>

        <Section icon={<ShieldCheck className="w-4 h-4 text-amber-600" />} title="Character Referees & Relatives in Security Forces">
          <p className="font-medium text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
            {securityOfficer.relativesOrReferees || "Recorded HR Character References Verified by Vetting Officer."}
          </p>
        </Section>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Disciplinary: Warning Letters</h4>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black">{securityOfficer.warningLettersCount} issued</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Warning letters are issued only through the formal disciplinary chain: Investigations Officer → Regional Manager → Operations Manager → HR Manager (final). Use the Disciplinary Actions tab to initiate a case from this security officer’s profile.</p>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>IT Department Integration • System Account & Identity Card</span>
            </h4>
            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase border ${
              securityOfficer.idCardStatus === "Issued & Active"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {securityOfficer.idCardStatus || "Pending IT Issuance"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Force Number</span><p className="text-white font-bold">{securityOfficer.forceNumber}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">ID Card No.</span><p className="text-white font-bold">{securityOfficer.idCardNumber || "Pending..."}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Issued Date</span><p className="text-white font-bold">{securityOfficer.idCardIssuedDate || "N/A"}</p></div>
            <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Expiry Date</span><p className="text-white font-bold">{securityOfficer.idCardExpiryDate || "N/A"}</p></div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">System Account:</span>
              <span className={securityOfficer.hasSystemAccount ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {securityOfficer.hasSystemAccount ? "Active & Linked" : "Not Provisioned"}
              </span>
            </div>
            {securityOfficer.linkedUserId && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Linked Force Number:</span>
                <span className="text-white font-mono">{linkedUser?.forceNumber || "Unassigned"}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Medical Clearance:</span>
              <span className={securityOfficer.medicalCleared ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {securityOfficer.medicalCleared ? "Passed" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Armed/Weapons Qualified:</span>
              <span className={securityOfficer.armedQualified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {securityOfficer.armedQualified ? "Certified" : "Unarmed"}
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
