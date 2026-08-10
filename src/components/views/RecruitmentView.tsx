import React, { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp, UserCheck, ClipboardList, ShieldCheck } from "lucide-react";
import type { JobPosting, Candidate, UserRole } from "../../types";
import { HR_STAFF_ROLES, OPS_MANAGEMENT_ROLES, CANDIDATE_REVIEW_ROLES } from "../../services/rbacService";

interface RecruitmentViewProps {
  jobPostings: JobPosting[];
  candidates: Candidate[];
  activeRole?: UserRole;
  onAddJobPosting: (posting: Omit<JobPosting, "id">) => void;
  onUpdateJobPosting: (id: string, updates: Partial<JobPosting>) => void;
  onAddCandidate: (candidate: Omit<Candidate, "id">) => void;
  onUpdateCandidate: (id: string, updates: Partial<Candidate>) => void;
}

const POSTING_ROLES: UserRole[] = HR_STAFF_ROLES;
const OPS_REVIEW_ROLES: UserRole[] = OPS_MANAGEMENT_ROLES;
const CANDIDATE_EDIT_ROLES: UserRole[] = CANDIDATE_REVIEW_ROLES;

export const RecruitmentView: React.FC<RecruitmentViewProps> = ({
  jobPostings, candidates, activeRole, onAddJobPosting, onUpdateJobPosting, onAddCandidate, onUpdateCandidate,
}) => {
  const canManagePostings = activeRole ? POSTING_ROLES.includes(activeRole) : true;
  const canReviewCandidates = activeRole ? CANDIDATE_EDIT_ROLES.includes(activeRole) : true;
  const isOpsReview = activeRole ? OPS_REVIEW_ROLES.includes(activeRole) : false;
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [interviewFor, setInterviewFor] = useState<Candidate | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [form, setForm] = useState({ title: "", code: "", department: "", location: "", description: "", requirements: "", positionsCount: 1, salaryRange: "", closesDate: "" });
  const [candForm, setCandForm] = useState({ fullName: "", email: "", phone: "", source: "", notes: "", roleType: "" as Candidate["roleType"] | "", licenceNumber: "", licenceClass: "" as Candidate["licenceClass"] | "", licenceExpiryDate: "", nationalId: "" });
  const roleIsDriving = candForm.roleType === "Driver" || candForm.roleType === "Rider";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddJobPosting({
      ...form,
      positionsCount: Number(form.positionsCount),
      postedDate: new Date().toISOString().split("T")[0],
      status: "Open",
    });
    setForm({ title: "", code: "", department: "", location: "", description: "", requirements: "", positionsCount: 1, salaryRange: "", closesDate: "" });
    setShowForm(false);
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    onAddCandidate({
      jobPostingId: selectedJob,
      fullName: candForm.fullName,
      email: candForm.email,
      phone: candForm.phone,
      source: candForm.source,
      notes: candForm.notes,
      roleType: candForm.roleType ? (candForm.roleType as Candidate["roleType"]) : undefined,
      nationalId: candForm.nationalId || undefined,
      ...(roleIsDriving
        ? {
            licenceNumber: candForm.licenceNumber || "PENDING",
            licenceClass: ((candForm.licenceClass || "Class B & DL (Light/Heavy)") as Candidate["licenceClass"]),
            licenceExpiryDate: candForm.licenceExpiryDate || "2030-12-31",
          }
        : {}),
      appliedDate: new Date().toISOString().split("T")[0],
      status: "New" as const,
    });
    setCandForm({ fullName: "", email: "", phone: "", source: "", notes: "", roleType: "", licenceNumber: "", licenceClass: "", licenceExpiryDate: "", nationalId: "" });
    setShowCandidateForm(false);
  };

  const statusColors: Record<string, string> = {
    Open: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    Closed: "bg-slate-200 text-slate-600 border-slate-300",
    "On Hold": "bg-amber-500/20 text-amber-600 border-amber-500/30",
  };

  const candidateStatusColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-700",
    Screening: "bg-purple-100 text-purple-700",
    Interviewed: "bg-amber-100 text-amber-700",
    Shortlisted: "bg-cyan-100 text-cyan-700",
    Offered: "bg-emerald-100 text-emerald-700",
    Hired: "bg-emerald-500 text-white",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Recruitment & Staffing</h1>
        <div className="flex items-center gap-2">
          {isOpsReview && (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black">
              <ShieldCheck className="w-3.5 h-3.5" /> Operations Review — shortlist & interview candidates
            </span>
          )}
          {canManagePostings && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-800">
              <Plus className="w-3.5 h-3.5" /> New Job Posting
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Create Job Posting</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none resize-none" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Requirements</label>
                <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} required rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Positions</label>
                  <input type="number" value={form.positionsCount} onChange={(e) => setForm({ ...form, positionsCount: Number(e.target.value) })} min={1} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salary Range</label>
                  <input value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Closes Date</label>
                  <input type="date" value={form.closesDate} onChange={(e) => setForm({ ...form, closesDate: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs cursor-pointer hover:bg-slate-800">Publish Job Posting</button>
            </form>
          </div>
        </div>
      )}

      {showCandidateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCandidateForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Add Candidate</h3>
              <button onClick={() => setShowCandidateForm(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCandidate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Posting</label>
                <select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                  <option value="">Select job...</option>
                  {jobPostings.filter((j) => j.status === "Open").map((j) => (
                    <option key={j.id} value={j.id}>{j.title} ({j.code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input value={candForm.fullName} onChange={(e) => setCandForm({ ...candForm, fullName: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" value={candForm.email} onChange={(e) => setCandForm({ ...candForm, email: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Type</label>
                  <select value={candForm.roleType} onChange={(e) => setCandForm({ ...candForm, roleType: e.target.value as Candidate["roleType"] })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                    <option value="">Select role...</option>
                    <option value="Security Guard">Security Guard</option>
                    <option value="Driver">Driver</option>
                    <option value="Rider">Rider</option>
                    <option value="Office / Admin">Office / Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input value={candForm.phone} onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source</label>
                  <input value={candForm.source} onChange={(e) => setCandForm({ ...candForm, source: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">National ID (NIN)</label>
                  <input value={candForm.nationalId} onChange={(e) => setCandForm({ ...candForm, nationalId: e.target.value })} placeholder={roleIsDriving ? "e.g. CM12345678ABC" : "Optional"} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              {roleIsDriving && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Driver / Rider Licence Details (captured at recruitment)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Licence Number</label>
                      <input value={candForm.licenceNumber} onChange={(e) => setCandForm({ ...candForm, licenceNumber: e.target.value })} required placeholder="e.g. UG-DL-882109" className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Licence Class</label>
                      <select value={candForm.licenceClass} onChange={(e) => setCandForm({ ...candForm, licenceClass: e.target.value as Candidate["licenceClass"] })} className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none">
                        <option value="Class B & DL (Light/Heavy)">Class B & DL (Light/Heavy)</option>
                        <option value="Class A (Motorcycles)">Class A (Motorcycles)</option>
                        <option value="Class CM (Armored/Heavy)">Class CM (Armored/Heavy)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Licence Expiry Date</label>
                    <input type="date" value={candForm.licenceExpiryDate} onChange={(e) => setCandForm({ ...candForm, licenceExpiryDate: e.target.value })} required className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none" />
                  </div>
                </div>
              )}
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs cursor-pointer hover:bg-slate-800">Add Candidate</button>
            </form>
          </div>
        </div>
      )}

      {interviewFor && (
        <CandidateInterviewModal
          candidate={interviewFor}
          onClose={() => setInterviewFor(null)}
          onSave={(updates) => {
            onUpdateCandidate(interviewFor.id, updates);
            setInterviewFor(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {jobPostings.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <p className="text-sm text-slate-400 font-semibold">No job postings yet. Create your first posting.</p>
          </div>
        ) : jobPostings.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === job.id ? null : job.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{job.title}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{job.code} • {job.department} • {job.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${statusColors[job.status] || "bg-slate-100 text-slate-600"}`}>{job.status}</span>
                <span className="text-xs font-bold text-slate-400">{job.candidates?.length || 0} candidates</span>
                {expanded === job.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>
            {expanded === job.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div><strong className="text-slate-800">Posted:</strong> {job.postedDate}</div>
                  <div><strong className="text-slate-800">Closes:</strong> {job.closesDate || "Open"}</div>
                  <div><strong className="text-slate-800">Positions:</strong> {job.positionsCount}</div>
                  <div><strong className="text-slate-800">Salary:</strong> {job.salaryRange || "Negotiable"}</div>
                </div>
                <p className="text-slate-600">{job.description}</p>
                <div className="flex items-center gap-2">
                  {canReviewCandidates && (
                    <button onClick={() => { setSelectedJob(job.id); setShowCandidateForm(true); }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl font-black text-[10px] cursor-pointer hover:bg-slate-800">
                      Add Candidate
                    </button>
                  )}
                  {canManagePostings && job.status === "Open" ? (
                    <button onClick={() => onUpdateJobPosting(job.id, { status: "Closed" })}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl font-black text-[10px] cursor-pointer">
                      Close Posting
                    </button>
                  ) : canManagePostings ? (
                    <button onClick={() => onUpdateJobPosting(job.id, { status: "Open" })}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] cursor-pointer">
                      Reopen Posting
                    </button>
                  ) : null}
                </div>
                {candidates.filter((c) => c.jobPostingId === job.id).length > 0 && (
                  <div className="mt-2">
                    <h4 className="font-bold text-slate-700 mb-2">Candidates</h4>
                    <div className="space-y-1">
                      {candidates.filter((c) => c.jobPostingId === job.id).map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <div>
                            <span className="font-bold text-slate-800">{c.fullName}</span>
                            <span className="text-slate-400 ml-2">{c.email}</span>
                            {c.roleType && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">{c.roleType}</span>
                            )}
                            {(c.roleType === "Driver" || c.roleType === "Rider") && c.licenceNumber && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                <span className="font-bold text-amber-700">Licence {c.licenceNumber}</span>
                                {" • "}{c.licenceClass}
                                {" • Expires "}{c.licenceExpiryDate}
                              </div>
                            )}
                            {c.roleType && (c.roleType === "Driver" || c.roleType === "Rider") && c.status === "Hired" && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700">Force No. issued • Sent to Fleet for approval</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {canReviewCandidates && (
                              <button
                                onClick={() => setInterviewFor(c)}
                                className="px-2 py-1 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100 flex items-center gap-1"
                              >
                                <ClipboardList className="w-3 h-3" /> Interview
                              </button>
                            )}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${candidateStatusColors[c.status] || "bg-slate-100 text-slate-600"}`}>{c.status}</span>
                            {canReviewCandidates && (
                              <select value={c.status} onChange={(e) => onUpdateCandidate(c.id, { status: e.target.value as any })}
                                className="text-[10px] p-1 bg-white border border-slate-200 rounded-lg font-semibold outline-none">
                                <option value="New">New</option>
                                <option value="Screening">Screening</option>
                                <option value="Interviewed">Interviewed</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Offered">Offered</option>
                                <option value="Hired">Hired</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const INTERVIEW_CRITERIA = [
  "Appearance & Turnout",
  "Communication Skills",
  "Security Industry Knowledge",
  "Job Knowledge",
  "Problem Solving",
  "Attitude & Conduct",
  "Teamwork",
  "Flexibility",
  "Security Procedures & Tools",
  "Follow Instructions",
  "Leadership Potential",
  "Confidence",
];

const CandidateInterviewModal: React.FC<{
  candidate: Candidate;
  onClose: () => void;
  onSave: (updates: Partial<Candidate>) => void;
}> = ({ candidate, onClose, onSave }) => {
  const [gender, setGender] = useState<string>(candidate.gender || "");
  const [age, setAge] = useState(candidate.age || "");
  const [address, setAddress] = useState(candidate.address || "");
  const [expectedSalary, setExpectedSalary] = useState(candidate.expectedSalary?.toString() || "");
  const [availability, setAvailability] = useState(candidate.availability || "");
  const [education, setEducation] = useState(candidate.education || "");
  const [certifications, setCertifications] = useState(candidate.certifications || "");
  const [yearsExperience, setYearsExperience] = useState(candidate.yearsExperience?.toString() || "");
  const [employerHistory, setEmployerHistory] = useState(candidate.employerHistory || "");
  const [reasonForLeaving, setReasonForLeaving] = useState(candidate.reasonForLeaving || "");
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    INTERVIEW_CRITERIA.forEach((c) => { initial[c] = candidate.interviewScores?.[c] ?? 3; });
    return initial;
  });
  const [interviewQuestions, setInterviewQuestions] = useState(candidate.notes || "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = Object.values(scores);
    const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    onSave({
      gender: gender ? (gender as Candidate["gender"]) : undefined,
      age: age || undefined,
      address: address || undefined,
      expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
      availability: availability || undefined,
      education: education || undefined,
      certifications: certifications || undefined,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      employerHistory: employerHistory || undefined,
      reasonForLeaving: reasonForLeaving || undefined,
      interviewScores: scores,
      interviewScore: avg,
      interviewDate: new Date().toISOString().split("T")[0],
      notes: interviewQuestions || undefined,
      status: "Interviewed",
    });
  };

  const inputCls = "w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none";
  const labelCls = "block font-bold text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            Employee Interview Form — {candidate.fullName}
          </h3>
          <button onClick={onClose} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4 text-xs">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-blue-800">Section 1 — Candidate Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                  <option value="">-- Select --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Age</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Expected Salary (UGX)</label>
                <input type="number" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Availability</label>
                <input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. Immediate" className={inputCls} />
              </div>
            </div>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-purple-800">Section 2 — Qualifications & Experience</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Education</label>
                <input value={education} onChange={(e) => setEducation(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Certifications</label>
                <input value={certifications} onChange={(e) => setCertifications(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Years of Experience</label>
                <input type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Previous Employers & Roles</label>
                <input value={employerHistory} onChange={(e) => setEmployerHistory(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Reason for Leaving Last Employer</label>
              <input value={reasonForLeaving} onChange={(e) => setReasonForLeaving(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-800">Section 3 — Interview Assessment (1 to 5)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERVIEW_CRITERIA.map((criterion) => (
                <div key={criterion} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-3 py-2">
                  <span className="font-bold text-slate-700">{criterion}</span>
                  <select
                    value={scores[criterion]}
                    onChange={(e) => setScores({ ...scores, [criterion]: Number(e.target.value) })}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-black outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-amber-800">Section 4 — Interview Questions & Notes</p>
            <textarea rows={3} value={interviewQuestions} onChange={(e) => setInterviewQuestions(e.target.value)}
              placeholder="Record interviewer questions and candidate responses..."
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-semibold outline-none resize-none" />
          </div>

          <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs cursor-pointer hover:bg-slate-800">
            Save Interview Assessment
          </button>
        </form>
      </div>
    </div>
  );
};
