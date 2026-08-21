import React, { useState } from "react";
import {
  Target,
  Share2,
  Plus,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  CalendarClock,
  PhoneCall,
  BellRing,
  DollarSign,
  Truck,
  MapPinned,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { Lead, Campaign, UserRole, ContractRecord, Invoice, LeadSource, LeadStage } from "../../types";
import { ClientContractsView } from "../organisms";
import { useDomainStore } from "../../stores/domainStore";
import { useAuthStore } from "../../stores/authStore";
import { MARKETING_ROLES } from "../../services/rbacService";
import { SiteSurveysPanel } from "./SiteSurveysPanel";

const LEAD_SOURCES: LeadSource[] = ["Website", "LinkedIn", "X", "TikTok", "Referral", "Walk-in", "Security Expo", "Direct Mail", "Other"];
const STAGE_FLOW: LeadStage[] = ["New", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
const OPEN_STAGES: LeadStage[] = ["New", "Contacted", "Qualified", "Proposal Sent"];

interface MarketingViewProps {
  activeRole: UserRole;
  leads: Lead[];
  campaigns: Campaign[];
  onAddLead: (lead: Omit<Lead, "id">) => void;
  onUpdateLead?: (id: string, updates: Partial<Lead>) => void;
  onDeleteLead?: (id: string) => void;
  onReassignLead?: (id: string, assignedTo: string, ownerId?: string) => void;
  onUpdateCampaign?: (id: string, updates: Partial<Campaign>) => void;
  onDeleteCampaign?: (id: string) => void;
  contracts?: ContractRecord[];
  onAddContract?: (c: Omit<ContractRecord, "id">) => void;
  onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void;
  onAdvanceApproval?: (id: string) => void;
  onVoidContract?: (id: string, reason: string) => void;
  collections?: Invoice[];
  onSendReminder?: (invoiceId: string, recipient?: string) => void;
  initialTab?: "pipeline" | "campaigns";
}

export const MarketingView: React.FC<MarketingViewProps> = ({
  activeRole,
  leads,
  campaigns,
  onAddLead,
  onUpdateLead,
  onDeleteLead,
  onReassignLead,
  onUpdateCampaign,
  onDeleteCampaign,
  contracts,
  onAddContract,
  onUpdateContract,
  onAdvanceApproval,
  onVoidContract,
  collections,
  onSendReminder,
  initialTab,
}) => {
  const canManageMarketing = MARKETING_ROLES.includes(activeRole);
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserName = currentUser?.name ?? "";
  const currentUserId = currentUser?.id ?? "";
  const users = useAuthStore((s) => s.users);
  const salesTeam = users.filter((u) => u.status === "Active" && MARKETING_ROLES.includes(u.role));
  const isBDM = activeRole === "Business Development Manager";
  const [showModal, setShowModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number>(15000000);
  const [source, setSource] = useState<LeadSource>("Walk-in");
  const [leadRegion, setLeadRegion] = useState<string>("Central (Kampala HQ)");
  const [leadSearch, setLeadSearch] = useState("");
  const [reassignLead, setReassignLead] = useState<Lead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState("");
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [reminderRecipient, setReminderRecipient] = useState("");

  const filteredLeads = leads.filter((l) =>
    !leadSearch ||
    l.companyName.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.contactPerson.toLowerCase().includes(leadSearch.toLowerCase())
  );

  const ownsLead = (lead: Lead) =>
    !!currentUserId && (lead.ownerId === currentUserId || lead.assignedTo === currentUserName);
  const isUnassignedLead = (lead: Lead) =>
    !lead.ownerId && (lead.assignedTo === "" || lead.assignedTo === "Unassigned");
  const canAdvanceLead = (lead: Lead) => ownsLead(lead) || isUnassignedLead(lead);

  const openLeads = leads.filter((l) => OPEN_STAGES.includes(l.stage));
  const totalPipelineValue = openLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
  const closedWonValue = leads.filter((l) => l.stage === "Closed Won").reduce((sum, l) => sum + l.estimatedValue, 0);
  const closedLostValue = leads.filter((l) => l.stage === "Closed Lost").reduce((sum, l) => sum + l.estimatedValue, 0);
  const totalLeadsCount = leads.length;

  const campaignRoi = campaigns.map((c) => ({
    name: c.name,
    leads: c.leadsGenerated,
    conversions: c.conversions,
    costPerLead: c.leadsGenerated > 0 ? Math.round(c.budget / c.leadsGenerated) : 0,
    conversionRate: c.leadsGenerated > 0 ? Math.round((c.conversions / c.leadsGenerated) * 100) : 0,
  }));
  const stageCounts = STAGE_FLOW.map((s) => ({
    name: s,
    value: leads.filter((l) => l.stage === s).length,
  }));
  const sourceCounts = LEAD_SOURCES.filter((src) => leads.some((l) => l.source === src)).map((src) => ({
    name: src,
    value: leads.filter((l) => l.source === src).length,
  }));
  const funnelRate = totalLeadsCount > 0 ? Math.round((leads.filter((l) => l.stage === "Closed Won").length / totalLeadsCount) * 100) : 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const followUps = leads
    .filter((l) => !["Closed Won", "Closed Lost"].includes(l.stage) && !!l.followUpDate)
    .map((l) => ({ lead: l, due: new Date(l.followUpDate as string) }))
    .filter((x) => !isNaN(x.due.getTime()))
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  const dueFollowUps = followUps.filter((x) => x.due.getTime() <= todayStart.getTime() + 7 * 86400000);
  const overdueCount = followUps.filter((x) => x.due.getTime() < todayStart.getTime()).length;

  const saveFollowUp = (reschedule: boolean) => {
    if (!followUpLead) return;
    const updates: Partial<Lead> = { lastContactedAt: new Date().toISOString() };
    if (reschedule && followUpDate) {
      const next = new Date(followUpDate);
      if (!isNaN(next.getTime())) updates.followUpDate = next.toISOString();
    }
    onUpdateLead?.(followUpLead.id, updates);
    setFollowUpLead(null);
  };

  const openScheduleModal = (lead: Lead) => {
    const base = lead.followUpDate ? new Date(lead.followUpDate) : new Date(Date.now() + 7 * 86400000);
    setFollowUpDate(base.toISOString().split("T")[0]);
    setFollowUpLead(lead);
  };

  const daysUntil = (d: Date) => Math.ceil((d.getTime() - Date.now()) / 86400000);

  const advanceToStage = (lead: Lead, next: LeadStage) => {
    if (next === "Closed Lost") {
      const reason = window.prompt(`Mark ${lead.companyName} as Closed Lost — reason for losing this deal?`) || "";
      onUpdateLead?.(lead.id, { stage: next, lostReason: reason });
    } else {
      onUpdateLead?.(lead.id, { stage: next });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !source) return;
    onAddLead({
      companyName,
      contactPerson,
      email: email || "contact@client.com",
      phone: phone || "+256 700 000000",
      estimatedValue,
      source,
      stage: "New",
      region: leadRegion,
      assignedTo: currentUserName || "Marketing",
    });
    setCompanyName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setLeadRegion("Central (Kampala HQ)");
    setSource("Walk-in");
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-black uppercase tracking-wider border border-blue-500/30">
              Marketing & Sales Department
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Commercial Lead Capture & Growth Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track security contract leads, marketing campaigns across LinkedIn, X, TikTok, and convert prospects into high-value clients.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTransportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Request Transport</span>
          </button>
          {canManageMarketing && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Capture Commercial Lead</span>
            </button>
          )}
        </div>
      </div>

      {(!initialTab || initialTab === "pipeline") && (
        <>
      {/* Site Survey — must precede contract drafting; requested by Marketing, completed by Operations */}
      <SiteSurveysPanel />
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
        <MapPinned className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-black text-amber-900">Site survey gates the contract</p>
          <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
            Request a survey from Operations before proposing a contract. The completed survey (premises, perimeter, risk, guards, equipment) guides the draft, and Ops will send back details here.
          </p>
        </div>
      </div>
        </>
      )}

      {/* KPI Overview */}
      {!initialTab && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Pipeline Deal Volume</span>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">UGX {totalPipelineValue.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-medium">Open prospects (New → Proposal Sent)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Closed Won Revenue</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">UGX {closedWonValue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Successfully onboarded contracts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Closed Lost Value</span>
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">UGX {closedLostValue.toLocaleString()}</div>
          <span className="text-[10px] text-rose-500 font-medium">Deals lost — reasons tracked</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Prospects</span>
            <Share2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalLeadsCount} Commercial Prospects</div>
          <span className="text-[10px] text-slate-400 font-medium">Tracked by source & owner</span>
        </div>
      </div>
      )}

      {/* Lead Pipeline Funnel Stages — owner-based pipeline */}
      {(!initialTab || initialTab === "pipeline") && (
        <>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Sales Pipeline Stage Funnel</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Owner-based model — only the assigned owner advances a lead; BDM controls ownership via reassignment.</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">New → Contacted → Qualified → Proposal Sent → Won / Lost</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="Search leads by company or contact..." className="w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGE_FLOW.map((stageName) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stageName);
            const terminal = stageName === "Closed Won" || stageName === "Closed Lost";
            return (
              <div key={stageName} className={`p-4 rounded-xl border space-y-3 ${terminal ? "bg-slate-50 border-slate-300" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700">{stageName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${terminal ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800"}`}>
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageLeads.map((lead) => {
                    const advanceOptions = STAGE_FLOW.filter((s) => STAGE_FLOW.indexOf(s) > STAGE_FLOW.indexOf(lead.stage));
                    const showAdvance = canAdvanceLead(lead) && advanceOptions.length > 0;
                    const showReassign = isBDM;
                    return (
                      <div key={lead.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-slate-900 text-xs truncate" title={lead.companyName}>{lead.companyName}</div>
                          <div className="flex items-center gap-1 shrink-0">
                            {canManageMarketing && (
                              <>
                                <button onClick={() => setEditLead(lead)} className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer" title="Edit Lead"><Pencil className="w-3 h-3" /></button>
                                <button onClick={() => { if (window.confirm(`Delete lead ${lead.companyName}?`)) onDeleteLead?.(lead.id); }} className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer" title="Delete Lead"><Trash2 className="w-3 h-3" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{lead.contactPerson}</div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-black uppercase tracking-wide">{lead.source}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold truncate max-w-[120px]" title={lead.assignedTo}>👤 {lead.assignedTo}</span>
                          {lead.followUpDate && (
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[9px] font-black ${
                                new Date(lead.followUpDate).getTime() < todayStart.getTime()
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                              title="Scheduled follow-up"
                            >
                              📅 {new Date(lead.followUpDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-black text-blue-700">
                          UGX {lead.estimatedValue.toLocaleString()}
                        </div>
                        {lead.lostReason && stageName === "Closed Lost" && (
                          <div className="text-[10px] text-rose-600 font-medium leading-tight">Lost: {lead.lostReason}</div>
                        )}
                        <div className="flex items-center gap-1 pt-1">
                          {showAdvance && (
                            <select
                              value=""
                              onChange={(e) => { const v = e.target.value as LeadStage; if (v) advanceToStage(lead, v); }}
                              className="flex-1 px-1.5 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-800 text-[10px] font-bold outline-none cursor-pointer"
                            >
                              <option value="" disabled>Advance ▾</option>
                              {advanceOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          )}
                          {showReassign && (
                            <button
                              onClick={() => setReassignLead(lead)}
                              className="px-1.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold cursor-pointer"
                              title="Reassign ownership (BDM only)"
                            >
                              Reassign
                            </button>
                          )}
                          <button
                            onClick={() => openScheduleModal(lead)}
                            className="px-1.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[10px] font-bold cursor-pointer"
                            title="Schedule or log a follow-up"
                          >
                            Follow-up
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {stageLeads.length === 0 && (
                    <div className="text-[11px] text-slate-400 text-center py-4 italic">No leads in stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Source Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-black text-slate-900">Lead Source Analytics</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Where prospects originate — Website captures automatically</span>
        </div>
        {sourceCounts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 lg:col-span-2">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sourceCounts} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {sourceCounts.map((sc) => {
                const pct = totalLeadsCount > 0 ? Math.round((sc.value / totalLeadsCount) * 100) : 0;
                return (
                  <div key={sc.name} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{sc.name}</span>
                    <span className="text-xs font-black text-slate-900">{sc.value} <span className="text-[10px] text-slate-400 font-bold">({pct}%)</span></span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 italic text-xs">Capture leads to see source breakdown.</div>
        )}
      </div>

      {/* Follow-up Radar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-black text-slate-900">Follow-up Radar</h3>
          </div>
          <span className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">{overdueCount} overdue</span>
            )}
            <span className="text-[10px] text-slate-400 font-medium">Next 7 days across the pipeline</span>
          </span>
        </div>
        {dueFollowUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dueFollowUps.map(({ lead, due }) => {
              const overdue = due.getTime() < todayStart.getTime();
              return (
                <div key={lead.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs text-slate-900 truncate" title={lead.companyName}>{lead.companyName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${overdue ? "bg-rose-100 text-rose-700" : "bg-teal-100 text-teal-700"}`}>
                      {overdue ? "Overdue" : daysUntil(due) === 0 ? "Today" : `in ${daysUntil(due)}d`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lead.contactPerson} · {lead.stage}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-600">Due {due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    <button
                      onClick={() => openScheduleModal(lead)}
                      className="px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold cursor-pointer"
                    >
                      <PhoneCall className="w-3 h-3 inline mr-1" />Log / Reschedule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 italic text-xs">No follow-ups scheduled in the next 7 days. Use the Follow-up button on any open lead to plan outreach.</div>
        )}
      </div>
        </>
      )}

      {/* Social Media & Marketing Campaigns Table */}
      {(!initialTab || initialTab === "campaigns") && (
        <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Social Media & Campaign Analytics</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">LinkedIn, X, TikTok & Security Expos</span>
            {canManageMarketing && (
              <button
                onClick={() => {
                  const name = prompt("Campaign name:");
                  if (!name) return;
                  const channel = prompt("Channel (LinkedIn / Twitter / X / TikTok / Security Expo / Direct Mail):", "LinkedIn") as Campaign["channel"] || "LinkedIn";
                  const budget = Number(prompt("Budget (UGX):", "5000000") || 0);
                  useDomainStore.getState().addCampaign({ name, channel, budget, leadsGenerated: 0, conversions: 0, proposedBy: "Marketing" });
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow cursor-pointer"
              >
                + New Campaign
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Campaign Name</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Leads Captured</th>
                <th className="p-3.5">Budget Allocated</th>
                <th className="p-3.5">Budget Approval</th>
                <th className="p-3.5">Conversions</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic text-xs">No campaigns created yet.</td>
                </tr>
              ) : (campaigns.map((cmp) => (
                <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{cmp.name}</td>
                  <td className="p-3.5 font-semibold text-blue-700">{cmp.channel}</td>
                  <td className="p-3.5 font-bold text-slate-800">{cmp.leadsGenerated} Leads</td>
                  <td className="p-3.5 font-bold text-slate-900">UGX {cmp.budget.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                      cmp.budgetStatus === "Approved"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}>
                      {cmp.budgetStatus ?? "Pending Approval"}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {cmp.conversions} Contracts Signed
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1">
                      {canManageMarketing && (
                        <>
                      <button
                        onClick={() => {
                          const newChannel = prompt("New channel:", cmp.channel);
                          if (newChannel) onUpdateCampaign?.(cmp.id, { channel: newChannel as Campaign["channel"] });
                        }}
                        className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
                        title="Edit Campaign"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Delete campaign ${cmp.name}?`)) onDeleteCampaign?.(cmp.id); }}
                        className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign ROI & Funnel Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">Acquisition Efficiency & Funnel Analytics</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
            {funnelRate}% Funnel Close Rate
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Campaign Leads vs Conversions</h4>
            {campaigns.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={campaignRoi} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} interval={0} angle={-15} textAnchor="end" height={44} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="leads" name="Leads Captured" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" name="Contracts Signed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">No campaigns recorded yet</div>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Pipeline Maturation (Lead Count by Stage)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stageCounts} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={44} />
                <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {campaignRoi.some((c) => c.leads > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {campaignRoi.filter((c) => c.leads > 0).sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 4).map((c) => (
              <div key={c.name} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate">{c.name}</div>
                <div className="text-sm font-black text-slate-900">{c.conversionRate}%</div>
                <div className="text-[10px] text-slate-400">Conversion — cost per lead UGX {c.costPerLead.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
      {(!initialTab || initialTab === "campaigns") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-[10px] text-slate-500 font-semibold">Dedicated page — use top navigation to switch between Pipeline and Campaigns.</div>
      )}

      {(!initialTab || initialTab === "pipeline") && (
        <>
      {/* Marketing-Led Collections & Payment Reminders */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">Collections Overview & Payment Reminders</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            Marketing-led receivables follow-up
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Client</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {(collections ?? []).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-blue-700">{inv.invoiceNumber}</td>
                  <td className="p-3.5 font-bold text-slate-900">{inv.clientName}</td>
                  <td className="p-3.5">{inv.dueDate}</td>
                  <td className="p-3.5 font-black text-slate-900">UGX {inv.amount.toLocaleString()}</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : inv.status === "Pending"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : inv.status === "Draft"
                        ? "bg-slate-100 text-slate-600 border border-slate-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    {(inv.status === "Pending" || inv.status === "Overdue") && (
                      <button
                        onClick={() => { setReminderInvoice(inv); setReminderRecipient(""); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold cursor-pointer transition-colors"
                        title="Send payment reminder (SMS + email)"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        Send Reminder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(collections ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic text-xs">No client invoices available for collections follow-up.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
      {(!initialTab || initialTab === "campaigns") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-[10px] text-slate-500 font-semibold">Dedicated page — use top navigation to switch between Pipeline and Campaigns.</div>
      )}
      {/* Client Contracts & Approvals */}
      <ClientContractsView
        contracts={contracts ?? []}
        activeRole={activeRole}
        onAddContract={onAddContract}
        onUpdateContract={onUpdateContract}
        onAdvanceApproval={onAdvanceApproval}
        onVoidContract={onVoidContract}
      />

      {/* EDIT LEAD MODAL */}
      {editLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Edit Commercial Prospect</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                onUpdateLead?.(editLead.id, {
                  companyName: fd.get("companyName") as string,
                  contactPerson: fd.get("contactPerson") as string,
                  email: fd.get("email") as string,
                  phone: fd.get("phone") as string,
                  estimatedValue: Number(fd.get("estimatedValue")),
                  source: fd.get("source") as LeadSource,
                  stage: fd.get("stage") as Lead["stage"],
                  assignedTo: (fd.get("assignedTo") as string) || editLead.assignedTo,
                  lostReason: fd.get("lostReason") as string,
                });
                setEditLead(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Organization Name</label>
                <input name="companyName" type="text" required defaultValue={editLead.companyName} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Contact Person</label>
                <input name="contactPerson" type="text" required defaultValue={editLead.contactPerson} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input name="email" type="email" defaultValue={editLead.email} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input name="phone" type="text" defaultValue={editLead.phone} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Value (UGX)</label>
                  <input name="estimatedValue" type="number" required defaultValue={editLead.estimatedValue} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Source</label>
                  <select name="source" defaultValue={editLead.source} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold">
                    {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stage</label>
                  <select name="stage" defaultValue={editLead.stage} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold">
                    {STAGE_FLOW.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner</label>
                  <input name="assignedTo" type="text" defaultValue={editLead.assignedTo} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                {editLead.stage === "Closed Lost" && (
                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Lost Reason</label>
                    <input name="lostReason" type="text" defaultValue={editLead.lostReason ?? ""} placeholder="Why was this deal lost?" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setEditLead(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAPTURE LEAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Add New Commercial Prospect</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acacia Diplomatic Complex"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Key Contact Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Ssemwogerere"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@client.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+256 700 000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Value (UGX)</label>
                  <input
                    type="number"
                    required
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                  >
                    {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Region</label>
                  <select
                    value={leadRegion}
                    onChange={(e) => setLeadRegion(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                  >
                    <option>Central (Kampala HQ)</option>
                    <option>Western (Mbarara Station)</option>
                    <option>Northern (Gulu Station)</option>
                    <option>Eastern (Jinja Station)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN LEAD MODAL */}
      {reassignLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Reassign Lead Ownership</h3>
            <p className="text-xs text-slate-500">
              Transfer <span className="font-black text-slate-800">{reassignLead.companyName}</span> to another sales rep or department.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                const newOwner = (fd.get("newOwner") as string) || "Unassigned";
                const ownerUser = newOwner !== "Unassigned" ? users.find((u) => u.name === newOwner) : undefined;
                onReassignLead?.(reassignLead.id, newOwner, ownerUser?.id);
                setReassignLead(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Owner</label>
                <input type="text" readOnly value={reassignLead.assignedTo || "Unassigned"} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-semibold" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign To</label>
                <select name="newOwner" required defaultValue="" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-semibold">
                  <option value="" disabled>Select owner…</option>
                  <option value="Unassigned">Unassigned</option>
                  {salesTeam.map((u) => (
                    <option key={u.id} value={u.name}>{u.name} · {u.role}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setReassignLead(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Reassign Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW-UP MODAL */}
      {followUpLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Follow-up on {followUpLead.companyName}</h3>
            <p className="text-xs text-slate-500">
              {followUpLead.contactPerson} · {followUpLead.stage} · Owned by {followUpLead.assignedTo}
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setFollowUpLead(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => saveFollowUp(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  title="Record contact now without rescheduling"
                >
                  Log Contact Only
                </button>
                <button
                  type="button"
                  onClick={() => saveFollowUp(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                  title="Log contact and schedule the next follow-up"
                >
                  Save Follow-up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSPORT REQUEST MODAL — available to every role */}
      {showTransportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5" /> Request Transport</h3>
              <button onClick={() => setShowTransportModal(false)} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer">✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                useDomainStore.getState().addTransportRequest({
                  requestedBy: currentUserId,
                  requestedByName: currentUserName || "Marketing User",
                  requesterDepartment: (currentUser as any)?.department ?? "Marketing",
                  destination: fd.get("destination") as string,
                  purpose: fd.get("purpose") as string,
                  travelDate: fd.get("travelDate") as string,
                  travelTime: (fd.get("travelTime") as string) || undefined,
                  returnTime: (fd.get("returnTime") as string) || undefined,
                  vehicleType: ((fd.get("vehicleType") as string) || "Any") as "Car" | "Motorcycle" | "Any",
                  passengersCount: Number(fd.get("passengersCount") || 1),
                });
                setShowTransportModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div><label className="font-bold text-slate-700 block mb-1">Destination *</label><input name="destination" required placeholder="e.g. Mbarara site" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
              <div><label className="font-bold text-slate-700 block mb-1">Purpose *</label><input name="purpose" required placeholder="e.g. Site inspection" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-slate-700 block mb-1">Travel Date *</label><input name="travelDate" type="date" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                <div><label className="font-bold text-slate-700 block mb-1">Vehicle Type</label><select name="vehicleType" className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"><option>Any</option><option>Car</option><option>Motorcycle</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="font-bold text-slate-700 block mb-1">Departure</label><input name="travelTime" type="time" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                <div><label className="font-bold text-slate-700 block mb-1">Return</label><input name="returnTime" type="time" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
              </div>
              <div><label className="font-bold text-slate-700 block mb-1">Passengers</label><input name="passengersCount" type="number" min={1} defaultValue={1} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200"><button type="button" onClick={() => setShowTransportModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">Cancel</button><button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold cursor-pointer">Submit to Fleet</button></div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT REMINDER MODAL */}
      {reminderInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Send Payment Reminder</h3>
            <p className="text-xs text-slate-500">
              {reminderInvoice.invoiceNumber} · {reminderInvoice.clientName} · UGX {reminderInvoice.amount.toLocaleString()} due {reminderInvoice.dueDate}
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Contact (SMS / Email recipient)</label>
                <input
                  type="text"
                  value={reminderRecipient}
                  onChange={(e) => setReminderRecipient(e.target.value)}
                  placeholder="e.g. +2567XXXXXXXX or client@company.ug"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">Reminder is dispatched via Africa's Talking SMS + SendGrid email when credentials are configured in .env.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setReminderInvoice(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    onSendReminder?.(reminderInvoice.id, reminderRecipient.trim() || undefined);
                    setReminderInvoice(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  <BellRing className="w-4 h-4" />
                  Dispatch Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
