import React, { useState } from "react";
import { ShieldCheck, Plus, Download, Calendar, FolderArchive } from "lucide-react";
import {
  GuardsTable, LeaveRequestPanel, StaffAppraisalPanel, ContractsPanel, HRRemittancesPanel,
  GuardEnrollModal, GuardBiodataModal, GuardWarningModal, GuardLeaveModal,
  StaffAppraisalModal, AppraisalReportModal, ContractModal, GuardDeploymentPipeline,
} from "../organisms";
import { useGuardForm } from "../../hooks/useGuardForm";
import { Guard, UserRole, ContractRecord, HRRemittanceRecord, LeaveRequest, StaffAppraisal, PerformanceReviewRecord } from "../../types";
import { initialContractRecords, initialHRRemittanceRecords } from "../../data/mockData";
import { HR_STAFF_ROLES, HR_APPROVER_ROLES, EXECUTIVE_ROLES, GUARD_APPRAISAL_ROLES } from "../../services/rbacService";

interface Props { guards: Guard[]; activeRole?: UserRole; onAddGuard: (g: Omit<Guard, "id">) => void; onUpdateGuard?: (id: string, updates: Partial<Guard>) => void; onMoveLifecycle?: (id: string, updates: Partial<Guard>) => void; onIssueWarning?: (guard: Guard) => void; leaveRequests: LeaveRequest[]; performanceReviews: PerformanceReviewRecord[]; onAddLeaveRequest?: (r: Omit<LeaveRequest, "id">) => void; onUpdateLeaveRequest?: (id: string, updates: Partial<LeaveRequest>) => void; onHrApproveLeave?: (id: string, verification?: { entitlement?: number; taken?: number; balance?: number; resumptionDate?: string }) => void; onGmApproveLeave?: (id: string) => void; onDeleteLeaveRequest?: (id: string) => void; contracts: ContractRecord[]; onAddContract?: (c: Omit<ContractRecord, "id">) => void; onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void; onIssueContract?: (id: string) => void; onArchiveContract?: (id: string) => void; onVoidContract?: (id: string, reason: string) => void; onAdvanceApproval?: (id: string) => void; onArchiveGuard?: (id: string) => void; }

export const GuardsHRView: React.FC<Props> = ({ guards, activeRole, onAddGuard, onMoveLifecycle, leaveRequests, performanceReviews, onAddLeaveRequest, onUpdateLeaveRequest, onHrApproveLeave, onGmApproveLeave, contracts: contractsProp, onAddContract, onUpdateContract, onIssueContract, onArchiveContract, onVoidContract, onAdvanceApproval, onIssueWarning, onArchiveGuard }) => {
  const gf = useGuardForm(onAddGuard, guards.map((g) => g.guardCode));

  const ENROLL_ROLES: UserRole[] = HR_STAFF_ROLES;
  const APPROVE_LEAVE_ROLES: UserRole[] = HR_APPROVER_ROLES;
  const GM_APPROVE_LEAVE_ROLES: UserRole[] = EXECUTIVE_ROLES;
  const CONTRACT_ORIGINATORS: UserRole[] = HR_APPROVER_ROLES;
  const APPRAISAL_ROLES: UserRole[] = GUARD_APPRAISAL_ROLES;

  const [tab, setTab] = useState<"guards"|"leave"|"appraisals"|"contracts"|"remittances">("guards");
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState<"ALL"|"DESERTERS"|"ACTIVE"|"ARCHIVED">("ALL");
  const [vm, setVm] = useState<"spreadsheet"|"grid">("spreadsheet");
  const [showAdd, setShowAdd] = useState(false);
  const [selWarn, setSelWarn] = useState<Guard | null>(null);
  const [selBio, setSelBio] = useState<Guard | null>(null);

  const contracts = contractsProp ?? initialContractRecords;
  const [cf, setCf] = useState<"ALL"|"Staff Contract"|"Client Contract">("ALL");
  const [showContract, setShowContract] = useState(false);
  const [remits] = useState<HRRemittanceRecord[]>(initialHRRemittanceRecords);
  const [cycle, setCycle] = useState("July 2026");

  const [leaves, setLeaves] = useState<LeaveRequest[]>(leaveRequests);
  const [lf, setLf] = useState<"ALL"|"Approved"|"Pending HR Review"|"Pending GM Approval"|"Rejected">("ALL");
  const [showLeave, setShowLeave] = useState(false);
  const [lGuardId, setLGuardId] = useState(""); const [lType, setLType] = useState<LeaveRequest["leaveType"]>("Annual Leave");
  const [lStart, setLStart] = useState(""); const [lEnd, setLEnd] = useState(""); const [lDur, setLDur] = useState(14);
  const [lReason, setLReason] = useState(""); const [lRelief, setLRelief] = useState(""); const [lContact, setLContact] = useState("");

  const [apprs, setApprs] = useState<StaffAppraisal[]>(() =>
    performanceReviews.map((pr) => ({
      id: pr.id,
      guardId: pr.guardId,
      guardName: pr.guardName,
      guardCode: pr.guardCode,
      designation: '',
      siteName: '',
      reviewPeriod: pr.reviewPeriod as StaffAppraisal["reviewPeriod"],
      reviewType: (pr.reviewType || 'Annual Evaluation') as StaffAppraisal["reviewType"],
      evaluatorName: pr.evaluatorName,
      evaluatorTitle: '',
      evaluationDate: pr.evaluationDate,
      disciplineScore: pr.disciplineScore,
      punctualityScore: pr.punctualityScore,
      clientRatingScore: pr.clientRatingScore,
      appearanceScore: pr.appearanceScore,
      incidentHandlingScore: pr.incidentHandlingScore,
      overallRating: pr.overallRating as StaffAppraisal["overallRating"],
      recommendation: pr.recommendation as StaffAppraisal["recommendation"],
      comments: pr.comments || '',
      keyStrengths: pr.keyStrengths || '',
      growthAreas: pr.growthAreas || '',
      agreedDevelopmentGoals: pr.developmentGoals || '',
      supervisorComments: '',
      staffFeedbackComments: '',
      status: pr.status,
    }))
  );
  const [showAppr, setShowAppr] = useState(false);
  const [selAppr, setSelAppr] = useState<StaffAppraisal | null>(null);
  const [apSearch, setApSearch] = useState(""); const [apPeriodF, setApPeriodF] = useState("ALL"); const [apRateF, setApRateF] = useState("ALL");
  const [aGuardId, setAGuardId] = useState(""); const [aPeriod, setAPeriod] = useState<StaffAppraisal["reviewPeriod"]>("Annual 2026");
  const [aType, setAType] = useState<StaffAppraisal["reviewType"]>("Annual Evaluation");
  const [evalName, setEvalName] = useState("Sarah Akello"); const [evalTitle, setEvalTitle] = useState("HR & Performance Manager");
  const [disc, setDisc] = useState(5); const [punct, setPunct] = useState(5); const [client, setClient] = useState(4);
  const [appear, setAppear] = useState(5); const [incid, setIncid] = useState(4);
  const [aRec, setARec] = useState<StaffAppraisal["recommendation"]>("Promotion");
  const [strength, setStrength] = useState(""); const [growth, setGrowth] = useState(""); const [goals, setGoals] = useState("");
  const [superv, setSuperv] = useState(""); const [staffFb, setStaffFb] = useState("");

  const [ctTitle, setCtTitle] = useState(""); const [ctCode, setCtCode] = useState("");
  const [ctType, setCtType] = useState<"Staff Contract"|"Client Contract">("Staff Contract");
  const [ctParty, setCtParty] = useState(""); const [ctCat, setCtCat] = useState<ContractRecord["category"]>("Guard Employment SLA");
  const [ctStart, setCtStart] = useState(""); const [ctEnd, setCtEnd] = useState(""); const [ctVal, setCtVal] = useState(12000000);
  const [ctDoc, setCtDoc] = useState(""); const [ctNotes, setCtNotes] = useState("");
  const [ctSla, setCtSla] = useState(""); const [ctPayment, setCtPayment] = useState(""); const [ctBilling, setCtBilling] = useState("");
  const [ctRegion, setCtRegion] = useState(""); const [ctAutoRenew, setCtAutoRenew] = useState(false);
  const [ctGuardCode, setCtGuardCode] = useState(""); const [ctSiteName, setCtSiteName] = useState("");

  const fg = guards.filter((g) => {
    const isDes = g.status === "Deserted" || g.isDeserter;
    const isArch = g.status === "Archived";
    if (sf === "DESERTERS" && !isDes) return false;
    if (sf === "ACTIVE" && (isDes || isArch)) return false;
    if (sf === "ARCHIVED" && !isArch) return false;
    const q = search.toLowerCase();
    return g.fullName.toLowerCase().includes(q) || g.guardCode.toLowerCase().includes(q) || g.assignedSite.toLowerCase().includes(q);
  });
  const fls = leaves.filter((l) => lf === "ALL" || l.status === lf);
  const fcs = contracts.filter((c) => cf === "ALL" || c.contractType === cf);
  const fr = remits.filter((p) => p.cyclePeriod === cycle && (p.name.toLowerCase().includes(search.toLowerCase()) || p.forceNo.toLowerCase().includes(search.toLowerCase())));

  const subLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const g = guards.find((x) => x.id === lGuardId) || guards[0];
    const newLeave: LeaveRequest = { id: `lev-${Date.now()}`, guardId: g?.id || "grd-101", guardName: g?.fullName || "John Bosco Kateregga", guardCode: g?.guardCode || "SG-2024-001", leaveType: lType, startDate: lStart || "2026-08-01", endDate: lEnd || "2026-08-14", durationDays: Number(lDur) || 14, reason: lReason || "Scheduled annual leave.", reliefGuardName: lRelief || "Assigned Relief Officer", contactAddress: lContact, appliedDate: new Date().toISOString().split("T")[0], status: "Pending Regional Approval", notes: "Submitted via HR Portal." };
    if (onAddLeaveRequest) {
      onAddLeaveRequest({ guardId: newLeave.guardId, guardName: newLeave.guardName, guardCode: newLeave.guardCode, leaveType: newLeave.leaveType, startDate: newLeave.startDate, endDate: newLeave.endDate, durationDays: newLeave.durationDays, reason: newLeave.reason, reliefGuardName: newLeave.reliefGuardName, contactAddress: newLeave.contactAddress, appliedDate: newLeave.appliedDate, status: newLeave.status, notes: newLeave.notes });
    }
    setLeaves([newLeave, ...leaves]);
    setShowLeave(false); setLReason(""); setLContact("");
  };
  const subContract = (e: React.FormEvent) => {
    e.preventDefault();
    onAddContract?.({
      contractCode: ctCode || `CTR-${Date.now()}`,
      title: ctTitle,
      contractType: ctType,
      partyName: ctParty,
      category: ctCat,
      startDate: ctStart || new Date().toISOString().split("T")[0],
      endDate: ctEnd || "2027-12-31",
      valueUgx: ctVal,
      status: "Draft",
      documentRef: ctDoc || "DOC-SLA-NEW.pdf",
      managedBy: "Records Officer",
      notes: ctNotes,
      slaTerms: ctSla,
      paymentTerms: ctPayment,
      billingCycle: ctBilling,
      region: ctRegion,
      autoRenew: ctAutoRenew,
      relatedGuardCode: ctType === "Staff Contract" ? ctGuardCode || undefined : undefined,
      relatedSiteName: ctType === "Client Contract" ? ctSiteName || undefined : undefined,
    });
    setShowContract(false); setCtTitle(""); setCtCode(""); setCtParty("");
    setCtSla(""); setCtPayment(""); setCtBilling(""); setCtRegion(""); setCtAutoRenew(false);
    setCtGuardCode(""); setCtSiteName("");
  };
  const subAppr = (e: React.FormEvent) => {
    e.preventDefault();
    const g = guards.find((x) => x.id === aGuardId) || guards[0];
    const avg = (disc + punct + client + appear + incid) / 5;
    let or: StaffAppraisal["overallRating"] = "Satisfactory (C)";
    if (avg >= 4.5) or = "Outstanding (A)"; else if (avg >= 3.8) or = "Exceeds Expectations (B)";
    else if (avg >= 2.8) or = "Satisfactory (C)"; else if (avg >= 2.0) or = "Needs Improvement (D)"; else or = "Unsatisfactory (F)";
    setApprs([{ id: `apr-${Date.now()}`, guardId: g?.id || "grd-101", guardName: g?.fullName || "John Bosco Kateregga", guardCode: g?.guardCode || "SG-2024-001", designation: g?.designation || "Guard", siteName: g?.assignedSite || "Kampala Station", reviewPeriod: aPeriod, reviewType: aType, evaluatorName: evalName || "Sarah Akello", evaluatorTitle: evalTitle || "HR & Performance Manager", evaluationDate: new Date().toISOString().split("T")[0], disciplineScore: disc, punctualityScore: punct, clientRatingScore: client, appearanceScore: appear, incidentHandlingScore: incid, overallRating: or, recommendation: aRec, comments: "Annual performance review completed.", keyStrengths: strength || "Demonstrates strong integrity.", growthAreas: growth || "Continued training.", agreedDevelopmentGoals: goals || "1. Complete annual refresher.", supervisorComments: superv || "Satisfactory progress.", staffFeedbackComments: staffFb || "Agreed with outcomes.", status: "Approved & Archived" }, ...apprs]);
    setShowAppr(false); setStrength(""); setGrowth(""); setGoals(""); setSuperv(""); setStaffFb("");
  };
  const approveL = (id: string) => {
    setLeaves(leaves.map((l) => l.id === id ? { ...l, status: "Pending GM Approval" as const, approvedBy: activeRole || "HR Manager" } : l));
    onHrApproveLeave?.(id);
    onUpdateLeaveRequest?.(id, { status: "Pending GM Approval", approvedBy: activeRole || "HR Manager" });
  };
  const gmApproveL = (id: string) => {
    setLeaves(leaves.map((l) => l.id === id ? { ...l, status: "Approved" as const, approvedBy: activeRole || "General Manager", gmApprovedBy: activeRole || "General Manager" } : l));
    onGmApproveLeave?.(id);
    onUpdateLeaveRequest?.(id, { status: "Approved", approvedBy: activeRole || "General Manager", gmApprovedBy: activeRole || "General Manager" });
  };
  const rejectL = (id: string) => {
    setLeaves(leaves.map((l) => l.id === id ? { ...l, status: "Rejected" as const, approvedBy: activeRole || "HR Manager" } : l));
    onUpdateLeaveRequest?.(id, { status: "Rejected", approvedBy: activeRole || "HR Manager" });
  };

  const exportCSV = () => {
    const h = ["NAME","FORCE/NO","LOCATION","TEL NO","BANK ACCOUNT","BANK NAME","FINISHED PROBATION","ASSIGNED STATION","DESIGNATION","STATUS"];
    const rows = fg.map((g) => [`"${g.fullName}"`,`"${g.guardCode}"`,`"${g.location||'Kampala'}"`,`"${g.phone}"`,`"${g.bankAccount||'90300188201'}"`,`"${g.bankName||'Stanbic'}"`,`"${g.finishedProbation?'YES':'NO'}"`,`"${g.assignedSite}"`,`"${g.designation}"`,`"${g.status}"`]);
    const csv = "data:text/csv;charset=utf-8," + [h.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `HR_Guard_Personnel_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const tabs = ["guards","leave","appraisals","contracts","remittances"] as const;
  const lab: Record<string,string> = {guards:"HR Register",leave:"Leave Tracker",appraisals:"Appraisals",contracts:"Contracts",remittances:"Remittances"};

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-slate-700" />
          <h1 className="text-lg font-black text-slate-900 tracking-tight">HR & Personnel Directorate</h1>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{guards.length} Personnel</span>
        </div>
        <div className="flex items-center gap-2">
          {activeRole && ENROLL_ROLES.includes(activeRole) && <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"><Plus className="w-4 h-4" />Enroll New Guard</button>}
          {activeRole && ENROLL_ROLES.includes(activeRole) && <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"><Download className="w-4 h-4" />Export CSV</button>}
        </div>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${tab === t ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>{lab[t]}</button>
        ))}
      </div>
      {tab === "guards" && (
        <div className="space-y-4">
          <GuardDeploymentPipeline
            guards={fg}
            activeRole={activeRole ?? "General Manager"}
            onMoveLifecycle={onMoveLifecycle}
          />
          <GuardsTable guards={fg} viewMode={vm} onViewModeChange={setVm}
            searchTerm={search} onSearchChange={setSearch} statusFilter={sf} onStatusFilterChange={setSf}
            onViewBiodata={(g) => setSelBio(g)} onIssueWarning={(g) => setSelWarn(g)} onArchiveGuard={onArchiveGuard} />
        </div>
      )}
      {tab === "leave" && (
        <div className="space-y-3">
          {activeRole && ENROLL_ROLES.includes(activeRole) && <button onClick={() => setShowLeave(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"><Calendar className="w-4 h-4" />Log Leave</button>}
          <LeaveRequestPanel leaveRequests={fls} filter={lf} onFilterChange={setLf} onApprove={activeRole && APPROVE_LEAVE_ROLES.includes(activeRole) ? approveL : undefined} onGmApprove={activeRole && GM_APPROVE_LEAVE_ROLES.includes(activeRole) ? gmApproveL : undefined} onReject={activeRole && [...APPROVE_LEAVE_ROLES, ...GM_APPROVE_LEAVE_ROLES].includes(activeRole) ? rejectL : undefined} />
        </div>
      )}
      {tab === "appraisals" && <StaffAppraisalPanel appraisals={apprs} searchTerm={apSearch} onSearchChange={setApSearch} periodFilter={apPeriodF} onPeriodFilterChange={setApPeriodF} ratingFilter={apRateF} onRatingFilterChange={setApRateF} onViewReport={activeRole && APPRAISAL_ROLES.includes(activeRole) ? (a) => setSelAppr(a) : undefined} onAddNew={activeRole && APPRAISAL_ROLES.includes(activeRole) ? () => setShowAppr(true) : undefined} />}
      {tab === "contracts" && (
        <div className="space-y-3">
          {activeRole && CONTRACT_ORIGINATORS.includes(activeRole) && <button onClick={() => setShowContract(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"><FolderArchive className="w-4 h-4" />Add Contract Record</button>}
          <ContractsPanel contracts={fcs} contractFilter={cf} onFilterChange={setCf} activeRole={activeRole}
            onUpdateContract={onUpdateContract} onIssueContract={onIssueContract}
            onArchiveContract={onArchiveContract} onVoidContract={onVoidContract}
            onAdvanceApproval={onAdvanceApproval} />
        </div>
      )}
      {tab === "remittances" && <HRRemittancesPanel filteredRemittances={fr} cyclePeriod={cycle} onCyclePeriodChange={setCycle} searchTerm={search} onSearchChange={setSearch} />}
      <GuardWarningModal guard={selWarn} onClose={() => setSelWarn(null)} />
      {showAdd && <GuardEnrollModal form={gf.state} setForm={gf.set} onSubmit={gf.handleAddSubmit} onClose={() => { setShowAdd(false); gf.reset(); }} />}
      <GuardBiodataModal guard={selBio} onClose={() => setSelBio(null)} onIssueWarning={(g) => { setSelBio(null); onIssueWarning?.(g); }} />
      <GuardLeaveModal guards={guards} show={showLeave} onClose={() => setShowLeave(false)}
        leaveGuardId={lGuardId} setLeaveGuardId={setLGuardId} leaveType={lType} setLeaveType={setLType}
        leaveStartDate={lStart} setLeaveStartDate={setLStart} leaveEndDate={lEnd} setLeaveEndDate={setLEnd}
        leaveDurationDays={lDur} setLeaveDurationDays={setLDur} leaveReason={lReason} setLeaveReason={setLReason}
        leaveReliefGuardName={lRelief} setLeaveReliefGuardName={setLRelief}
        leaveContactAddress={lContact} setLeaveContactAddress={setLContact} onSubmit={subLeave} />
      <StaffAppraisalModal guards={guards} show={showAppr} onClose={() => setShowAppr(false)}
        appraisalGuardId={aGuardId} setAppraisalGuardId={setAGuardId} appraisalPeriod={aPeriod} setAppraisalPeriod={setAPeriod}
        appraisalType={aType} setAppraisalType={setAType} evaluatorNameInput={evalName} setEvaluatorNameInput={setEvalName}
        evaluatorTitleInput={evalTitle} setEvaluatorTitleInput={setEvalTitle} disciplineScore={disc} setDisciplineScore={setDisc}
        punctualityScore={punct} setPunctualityScore={setPunct} clientRatingScore={client} setClientRatingScore={setClient}
        appearanceScore={appear} setAppearanceScore={setAppear} incidentScore={incid} setIncidentScore={setIncid}
        appraisalRecommendation={aRec} setAppraisalRecommendation={setARec} keyStrengthsInput={strength} setKeyStrengthsInput={setStrength}
        growthAreasInput={growth} setGrowthAreasInput={setGrowth} agreedGoalsInput={goals} setAgreedGoalsInput={setGoals}
        supervisorCommentsInput={superv} setSupervisorCommentsInput={setSuperv} staffFeedbackInput={staffFb} setStaffFeedbackInput={setStaffFb}
        onSubmit={subAppr} />
      <AppraisalReportModal appraisal={selAppr} onClose={() => setSelAppr(null)} />
      <ContractModal show={showContract} onClose={() => setShowContract(false)}
        contractTitle={ctTitle} setContractTitle={setCtTitle} contractCode={ctCode} setContractCode={setCtCode}
        contractType={ctType} setContractType={setCtType} partyName={ctParty} setPartyName={setCtParty}
        category={ctCat} setCategory={setCtCat} startDate={ctStart} setStartDate={setCtStart}
        endDate={ctEnd} setEndDate={setCtEnd} valueUgx={ctVal} setValueUgx={setCtVal}
        documentRef={ctDoc} setDocumentRef={setCtDoc} notes={ctNotes} setNotes={setCtNotes}
        slaTerms={ctSla} setSlaTerms={setCtSla} paymentTerms={ctPayment} setPaymentTerms={setCtPayment}
        billingCycle={ctBilling} setBillingCycle={setCtBilling} region={ctRegion} setRegion={setCtRegion}
        autoRenew={ctAutoRenew} setAutoRenew={setCtAutoRenew} relatedGuardCode={ctGuardCode} setRelatedGuardCode={setCtGuardCode}
        relatedSiteName={ctSiteName} setRelatedSiteName={setCtSiteName} onSubmit={subContract} />
    </div>
  );
};
