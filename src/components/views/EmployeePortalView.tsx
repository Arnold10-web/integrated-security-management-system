import React, { useEffect, useState } from "react";
import {
  Briefcase, FileText, Download, CheckCircle2, Clock, User,
  Shield, MapPin, Calendar, Award, Building2, Mail, Phone,
} from "lucide-react";
import { domainApi } from "../../services/domainApi";
import { useAuthStore } from "../../stores/authStore";

interface PortalData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    forceNumber: string | null;
    region: string | null;
    department: string | null;
  };
  officer: {
    forceNumber: string;
    fullName: string;
    designation: string;
    assignedSite: string | null;
    region: string | null;
    zone: string | null;
    joinDate: string | null;
    status: string;
    lifecycleStage: string;
    probationStatus: string;
    monthlySalaryUgx: number;
  } | null;
  contract: {
    contractCode: string;
    status: string;
    startDate: string;
    probationMonths: number;
    monthlySalaryUgx: number;
    pdfPath: string | null;
    pdfUrl: string | null;
    officerSignedAt: string | null;
    hrSignedAt: string | null;
  } | null;
}

export const EmployeePortalView: React.FC = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    domainApi.employeePortal.get()
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Unable to load employment information.</p>
      </div>
    );
  }

  const { user, officer, contract } = data;
  const initials = user.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase();
  const isOfficer = !!officer;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-slate-700 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-xl text-blue-300">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{user.name}</h1>
              <p className="text-sm text-slate-300 mt-1">
                {isOfficer ? officer.designation : user.role}
                {user.region ? ` • ${user.region}` : ""}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                {user.forceNumber && (
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {user.forceNumber}</span>
                )}
              </div>
            </div>
          </div>
          {contract?.pdfUrl && (
            <a
              href={contract.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Contract PDF
            </a>
          )}
        </div>
      </div>

      {/* Job Description (all staff) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" />
          Job Description
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role</p>
            <p className="font-bold text-slate-900 text-sm">{user.role}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Department</p>
            <p className="font-bold text-slate-900 text-sm">{user.department || "—"}</p>
          </div>
          {isOfficer && (
            <>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Site</p>
                <p className="font-bold text-slate-900 text-sm">{officer.assignedSite || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Region</p>
                <p className="font-bold text-slate-900 text-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {officer.region || "—"}
                </p>
              </div>
            </>
          )}
          {!isOfficer && (
            <>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Region</p>
                <p className="font-bold text-slate-900 text-sm">{user.region || "—"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Force Number</p>
                <p className="font-bold text-slate-900 text-sm font-mono">{user.forceNumber || "—"}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contract Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          Contract Status
        </h3>
        {contract ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Contract No.</p>
                <p className="font-mono font-bold text-slate-900 text-sm">{contract.contractCode}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Monthly Salary</p>
                <p className="font-bold text-emerald-700 text-sm">UGX {(contract.monthlySalaryUgx || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Start Date</p>
                <p className="font-bold text-slate-900 text-sm">{contract.startDate}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Probation</p>
                <p className="font-bold text-slate-900 text-sm">{contract.probationMonths} month(s)</p>
              </div>
            </div>

            {/* Status Trail */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["Draft", "Pending Officer Signature", "Pending HR Signature", "Fully Signed"] as const).map((step, i) => {
                const stepIdx = contract.status === "Fully Signed" ? 3 :
                  contract.status === "Pending HR Signature" ? 2 :
                  contract.status === "Pending Officer Signature" ? 1 : 0;
                const isComplete = i <= stepIdx;
                return (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                      isComplete
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}>
                      {isComplete && <CheckCircle2 className="w-3 h-3" />}
                      {step}
                    </div>
                    {i < 3 && <span className="text-slate-300 text-[10px]">→</span>}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Signature Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`rounded-xl border p-3 ${contract.officerSignedAt ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Employee Signature</p>
                {contract.officerSignedAt ? (
                  <p className="text-xs font-bold text-emerald-700">
                    Signed on {new Date(contract.officerSignedAt).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting signature
                  </p>
                )}
              </div>
              <div className={`rounded-xl border p-3 ${contract.hrSignedAt ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Employer Signature</p>
                {contract.hrSignedAt ? (
                  <p className="text-xs font-bold text-emerald-700">
                    Signed on {new Date(contract.hrSignedAt).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting signature
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-semibold">No employment contract on file</p>
            <p className="text-xs text-slate-400 mt-1">Contact HR for your contract details</p>
          </div>
        )}
      </div>

      {/* Probation Status (if available) */}
      {isOfficer && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Probation Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</p>
              <p className={`font-bold text-sm ${
                officer.probationStatus === "Completed" ? "text-emerald-700" :
                officer.probationStatus === "In Progress" ? "text-amber-700" :
                officer.probationStatus === "Failed" ? "text-rose-700" :
                "text-slate-900"
              }`}>
                {officer.probationStatus || "Not Started"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Employment Status</p>
              <p className="font-bold text-sm text-slate-900">{officer.status}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lifecycle</p>
              <p className="font-bold text-sm text-slate-900">{officer.lifecycleStage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
