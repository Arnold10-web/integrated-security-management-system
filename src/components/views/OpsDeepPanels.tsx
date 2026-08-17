import React from "react";
import {
  ClipboardList, Activity, Shield, Dog, Target, GraduationCap, Users,
  ScrollText, FileWarning, Gauge, Briefcase, BookOpen,
} from "lucide-react";
import { useDomainStore } from "../../stores/domainStore";
import { useAuditStore } from "../../stores/auditStore";

const fn = (g: { forceNumber?: string }) => g.forceNumber;

const inRegion = (region: string | undefined, value: string | null | undefined, fallback: boolean): boolean =>
  fallback || !region || value === region;

export const CommandStrip: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const scoped = !region;
  const today = new Date().toISOString().split("T")[0];
  const todayRoster = domain.dutyRoster.filter((r) => r.shiftDate === today && inRegion(region, r.region, scoped));
  const scheduled = todayRoster.length;
  const present = todayRoster.filter((r) => r.status === "Present").length;
  const openOrders = domain.deploymentOrders.filter((o) => o.status === "Open" && inRegion(region, o.region, scoped)).length;
  const openIncidents = domain.incidents.filter((i) => (i.status === "Open" || i.status === "Under Investigation") && inRegion(region, i.region, scoped)).length;

  const strip = [
    { label: "Shifts Scheduled Today", value: scheduled, icon: ClipboardList, color: "bg-sky-100 text-sky-700" },
    { label: "On Duty / Present", value: `${present} / ${scheduled}`, icon: Shield, color: "bg-emerald-100 text-emerald-700" },
    { label: "Open Deployment Orders", value: openOrders, icon: Briefcase, color: "bg-amber-100 text-amber-700" },
    { label: "Open Incidents", value: openIncidents, icon: FileWarning, color: "bg-rose-100 text-rose-700" },
    { label: "Trainees In Progress", value: domain.recruitTrainees.filter((t) => t.overallStatus === "Under Training").length, icon: GraduationCap, color: "bg-indigo-100 text-indigo-700" },
    { label: "Operational Vehicles", value: domain.vehicles.filter((v) => v.status === "Operational").length, icon: Activity, color: "bg-cyan-100 text-cyan-700" },
  ];

  return (
    <section className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-black text-white uppercase tracking-wide">Command Strip</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {strip.map((s) => (
          <div key={s.label} className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
            <div className={`inline-flex p-2 rounded-xl ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">{s.value}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export const DeploymentOrdersPanel: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const orders = domain.deploymentOrders.filter((o) => inRegion(region, o.region, !region));
  const open = orders.filter((o) => o.status === "Open");
  return (
    <Panel icon={Briefcase} title="Deployment Orders" tone="bg-amber-100 text-amber-700">
      {orders.length === 0 ? (
        <Empty label="No deployment orders yet." />
      ) : (
        <div className="space-y-2">
          {open.length > 0 && (
            <p className="text-[11px] font-black text-amber-700 uppercase tracking-wide">{open.length} open</p>
          )}
          {orders.map((o) => (
            <div key={o.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-slate-800 truncate">
                  {o.orderCode} — {o.siteName}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  o.status === "Open" ? "bg-amber-100 text-amber-700"
                  : o.status === "Filled" ? "bg-emerald-100 text-emerald-700"
                  : o.status === "Cancelled" ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-700"
                }`}>{o.status}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 font-medium">
                {o.requiredHeadcount} required · {o.assignedGuardIds.length} assigned · {o.shiftType} · {o.region ?? "HQ"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

export const ShiftsAttendancePanel: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const today = new Date().toISOString().split("T")[0];
  const rows = domain.dutyRoster.filter((r) => r.shiftDate === today && inRegion(region, r.region, !region));
  const bySite = new Map<string, { scheduled: number; present: number; late: number; overtime: number }>();
  for (const r of rows) {
    const e = bySite.get(r.siteName) ?? { scheduled: 0, present: 0, late: 0, overtime: 0 };
    e.scheduled += 1;
    if (r.status === "Present") e.present += 1;
    if (r.status === "On Overtime") e.overtime += 1;
    bySite.set(r.siteName, e);
  }
  return (
    <Panel icon={ClipboardList} title="Shifts & Attendance Today" tone="bg-sky-100 text-sky-700">
      {rows.length === 0 ? (
        <Empty label="No shifts scheduled for today." />
      ) : (
        <div className="space-y-2">
          {[...bySite.entries()].map(([site, s]) => (
            <div key={site} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-800 truncate">{site}</p>
                <span className="text-[11px] font-black text-emerald-700">{s.present}/{s.scheduled} present</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.scheduled ? (s.present / s.scheduled) * 100 : 0}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 font-semibold">
                {s.overtime > 0 ? `${s.overtime} on overtime · ` : ""}{rows.filter((r) => r.siteName === site).length} scheduled today
              </p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

export const GuardLifecycleBoard: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const guards = domain.guards.filter((g) => inRegion(region, g.region ?? g.location, !region));
  const stages = ["ENROLLED", "HANDED_TO_OPERATIONS", "IN_TRAINING", "PASSED_OUT", "DEPLOYED"] as const;
  const counts = stages.map((s) => ({ stage: s, count: guards.filter((g) => g.lifecycleStage === s).length }));
  return (
    <Panel icon={Users} title="Guard Lifecycle Board" tone="bg-violet-100 text-violet-700">
      <div className="space-y-2">
        {counts.map((c, i) => (
          <div key={c.stage} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-[11px] font-bold text-slate-600 flex-1">{c.stage.replace(/_/g, " ")}</span>
            <span className="text-sm font-black text-slate-900">{c.count}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 font-semibold">
            {guards.length} total personnel — each identified by force number
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {guards.slice(0, 12).map((g) => (
              <span key={g.id} className="px-1.5 py-0.5 rounded-md bg-violet-50 border border-violet-100 text-[9px] font-black text-violet-700">
                {fn(g)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export const TrainingAcademyOversight: React.FC = () => {
  const domain = useDomainStore();
  const inSession = domain.trainingCohorts.filter((c) => c.status === "In Session");
  const trainees = domain.recruitTrainees;
  const under = trainees.filter((t) => t.overallStatus === "Under Training");
  const graduated = trainees.filter((t) => t.overallStatus === "Graduated & Certified");
  const avg = (scores: number[]) => (scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);
  return (
    <Panel icon={GraduationCap} title="Training Academy Oversight" tone="bg-indigo-100 text-indigo-700">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
          <p className="text-lg font-black text-indigo-700">{inSession.length}</p>
          <p className="text-[9px] text-indigo-500 font-bold uppercase">Cohorts</p>
        </div>
        <div className="p-2 rounded-xl bg-sky-50 border border-sky-100">
          <p className="text-lg font-black text-sky-700">{under.length}</p>
          <p className="text-[9px] text-sky-500 font-bold uppercase">In Training</p>
        </div>
        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-lg font-black text-emerald-700">{graduated.length}</p>
          <p className="text-[9px] text-emerald-500 font-bold uppercase">Passed Out</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-slate-500 font-semibold">
        Competency averages — Marksmanship {avg(trainees.map((t) => t.marksmanshipScore))}% · Drill {avg(trainees.map((t) => t.drillScore))}% · Theory {avg(trainees.map((t) => t.theoryScore))}%
      </p>
    </Panel>
  );
};

export const InvestigationsCollaboration: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const conductFlags = domain.disciplinaryActions.filter((d) => d.status !== "Finalized");
  const activeIncidents = domain.incidents.filter((i) => (i.status === "Open" || i.status === "Under Investigation") && inRegion(region, i.region, !region));
  const referredComplaints = domain.complaints.filter((c) => (c.referredForInvestigation || c.status === "Referred") && inRegion(region, c.region, !region));
  return (
    <Panel icon={ScrollText} title="Investigations Collaboration" tone="bg-rose-100 text-rose-700">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={conductFlags.length} label="Active Charges" />
        <Stat value={activeIncidents.length} label="Open Incidents" />
        <Stat value={referredComplaints.length} label="Referred Complaints" />
      </div>
      <p className="mt-2 text-[10px] text-slate-500 font-semibold">
        Ops adds notes/evidence and escalates; Investigations Officer owns finalization.
      </p>
    </Panel>
  );
};

export const ArmouryStatusPanel: React.FC = () => {
  const domain = useDomainStore();
  const total = domain.armoury.reduce((s, a) => s + a.totalQuantity, 0);
  const available = domain.armoury.reduce((s, a) => s + a.availableQuantity, 0);
  const issued = total - available;
  const needingService = domain.armoury.filter((a) => a.condition === "Requires Service").length;
  const out = domain.armouryLogs.filter((l) => l.status === "Checked Out");
  return (
    <Panel icon={Shield} title="Armoury Status" tone="bg-slate-200 text-slate-700">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={total} label="Total" />
        <Stat value={available} label="Available" />
        <Stat value={issued} label="Issued" />
      </div>
      <div className="mt-2 space-y-1">
        {needingService > 0 && <p className="text-[10px] font-black text-amber-700">⚠ {needingService} item(s) require service</p>}
        {out.length > 0 && (
          <p className="text-[10px] text-slate-500 font-semibold">
            {out.length} item(s) checked out ({out.map((o) => o.guardName.split(" ")[0]).join(", ")})
          </p>
        )}
      </div>
    </Panel>
  );
};

export const K9ReadinessPanel: React.FC = () => {
  const domain = useDomainStore();
  const active = domain.k9s.filter((k) => k.status === "Active Duty");
  const vetFlag = domain.k9s.filter((k) => k.healthCondition === "Under Veterinary Treatment" || k.vaccinationStatus === "Rabies Booster Due");
  const handlers = new Set(domain.k9s.map((k) => k.assignedHandlerName).filter(Boolean)).size;
  return (
    <Panel icon={Dog} title="K9 Readiness" tone="bg-amber-100 text-amber-700">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={active.length} label="Active Dogs" />
        <Stat value={handlers} label="Handlers" />
        <Stat value={vetFlag.length} label="Vet Flags" />
      </div>
      <div className="mt-2 space-y-1">
        {domain.k9s.map((k) => (
          <p key={k.id} className="text-[10px] text-slate-500 font-semibold flex justify-between">
            <span>{k.name} · {k.specialization}</span>
            <span className={k.healthCondition === "Optimal / Fit for Duty" ? "text-emerald-600" : "text-amber-600"}>{k.status}</span>
          </p>
        ))}
      </div>
    </Panel>
  );
};

export const StaffClientAnalytics: React.FC<{ region?: string }> = ({ region }) => {
  const domain = useDomainStore();
  const sites = domain.sites.filter((s) => inRegion(region, s.region, !region));
  const ratings = domain.performanceReviews;
  const scored = ratings.filter((r) => r.status === "Approved & Archived");
  const avgRating = scored.length
    ? Math.round(
        (scored.reduce(
          (a, b) => a + b.disciplineScore + b.punctualityScore + b.clientRatingScore + b.appearanceScore + b.incidentHandlingScore,
          0
        ) /
          scored.length /
          5) *
          10
      ) / 10
    : 0;
  const contractValue = domain.contracts
    .filter((c) => c.contractType === "Client Contract" && c.status !== "Terminated" && c.status !== "Expired" && c.status !== "Draft" && inRegion(region, c.region, !region))
    .reduce((s, c) => s + (c.valueUgx ?? 0), 0);
  const sitesWithIncidents = new Set(domain.incidents.map((i) => i.siteName)).size;
  return (
    <Panel icon={Target} title="Staff & Client Analytics" tone="bg-teal-100 text-teal-700">
      <div className="grid grid-cols-2 gap-2 text-center">
        <Stat value={scored.length ? `${avgRating}/5` : "—"} label="Avg Appraisal" />
        <Stat value={sites.length} label="Client Sites" />
        <Stat value={sitesWithIncidents} label="Sites w/ Incidents" />
        <Stat value={`UGX ${(contractValue / 1_000_000).toFixed(0)}M`} label="Contract Value" />
      </div>
    </Panel>
  );
};

export const RecruitmentPipeline: React.FC = () => {
  const domain = useDomainStore();
  const openPostings = domain.jobPostings.filter((j) => j.status === "Open");
  const totalPositions = openPostings.reduce((s, j) => s + j.positionsCount, 0);
  const candidates = domain.candidates;
  const graduated = domain.recruitTrainees.filter((t) => t.overallStatus === "Graduated & Certified");
  return (
    <Panel icon={Briefcase} title="Recruitment Pipeline" tone="bg-cyan-100 text-cyan-700">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={openPostings.length} label="Open Postings" />
        <Stat value={totalPositions} label="Guard Roles" />
        <Stat value={candidates.length} label="Candidates" />
      </div>
      <p className="mt-2 text-[10px] text-slate-500 font-semibold">
        {graduated.length} graduate(s) ready for deployment · {underTraining(domain)} in training
      </p>
    </Panel>
  );
};

function underTraining(domain: { recruitTrainees: { overallStatus: string }[] }) {
  return domain.recruitTrainees.filter((t) => t.overallStatus === "Under Training").length;
}

export const ActivityAuditFeed: React.FC = () => {
  const auditLogs = useAuditStore((s) => s.logs);
  const recent = auditLogs.slice(0, 10);
  return (
    <Panel icon={BookOpen} title="Activity & Audit Feed" tone="bg-emerald-100 text-emerald-700">
      <div className="space-y-1.5">
        {recent.length === 0 ? (
          <Empty label="No recent activity." />
        ) : (
          recent.map((l, i) => (
            <p key={`${l.timestamp}-${i}`} className="text-[10px] text-slate-500 font-medium leading-snug">
              <span className="font-black text-slate-700">{l.userRole}:</span> {l.action} — {l.details}
            </p>
          ))
        )}
      </div>
    </Panel>
  );
};

const Panel: React.FC<{ icon: React.ElementType; title: string; tone: string; children: React.ReactNode }> = ({ icon: Icon, title, tone, children }) => (
  <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className={`p-2 rounded-xl ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">{title}</h2>
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
    <p className="text-lg font-black text-slate-900">{value}</p>
    <p className="text-[9px] text-slate-400 font-bold uppercase">{label}</p>
  </div>
);

const Empty: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-xs text-slate-400 font-medium text-center py-6">{label}</p>
);

export const OpsDeepPanels: React.FC<{ region?: string }> = ({ region }) => (
  <div className="space-y-6">
    <CommandStrip region={region} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DeploymentOrdersPanel region={region} />
      <ShiftsAttendancePanel region={region} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GuardLifecycleBoard region={region} />
      <TrainingAcademyOversight />
      <InvestigationsCollaboration region={region} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ArmouryStatusPanel />
      <K9ReadinessPanel />
      <StaffClientAnalytics region={region} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RecruitmentPipeline />
      <ActivityAuditFeed />
    </div>
  </div>
);
