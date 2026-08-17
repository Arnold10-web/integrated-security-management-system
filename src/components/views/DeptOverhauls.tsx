import React from "react";
import {
  Target, Share2, BellRing, Wallet, Receipt, AlertCircle, Package,
  ClipboardList, Building2, DollarSign, TrendingUp, BadgeCheck,
} from "lucide-react";
import { useDomainStore } from "../../stores/domainStore";

const Kpi: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; tone: string }> = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
    <div className={`inline-flex p-2 rounded-xl ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
  </div>
);

const StripShell: React.FC<{ icon: React.ElementType; badge: string; title: string; sub: string; children: React.ReactNode }> = ({ icon: Icon, badge, title, sub, children }) => (
  <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 rounded-2xl bg-cyan-900 text-cyan-300">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-black uppercase border border-cyan-800">
          {badge}
        </span>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">{title}</h1>
        <p className="text-xs text-slate-400 font-medium">{sub}</p>
      </div>
    </div>
    {children}
  </div>
);

/* ─────────────── Marketing workspace strip ─────────────── */

export const MarketingWorkspaceStrip: React.FC = () => {
  const domain = useDomainStore();
  const leads = domain.leads;
  const open = leads.filter((l) => ["New", "Contacted", "Qualified", "Proposal Sent"].includes(l.stage));
  const won = leads.filter((l) => l.stage === "Closed Won");
  const pipelineValue = open.reduce((s, l) => s + l.estimatedValue, 0);
  const wonValue = won.reduce((s, l) => s + l.estimatedValue, 0);
  const activeCampaigns = domain.campaigns.filter((c) => !c.budgetStatus || c.budgetStatus !== "Rejected");
  const overdue = domain.invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <StripShell icon={Target} badge="Marketing Workspace" title="Growth Pipeline" sub="Lead funnel, campaign reach, and collections across the sales cycle.">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={Target} label="Open Leads" value={open.length} tone="bg-sky-100 text-sky-700" />
        <Kpi icon={TrendingUp} label="Pipeline Value" value={`UGX ${(pipelineValue / 1_000_000).toFixed(0)}M`} tone="bg-indigo-100 text-indigo-700" />
        <Kpi icon={BadgeCheck} label="Won" value={won.length} tone="bg-emerald-100 text-emerald-700" />
        <Kpi icon={Share2} label="Active Campaigns" value={activeCampaigns.length} tone="bg-violet-100 text-violet-700" />
        <Kpi icon={BellRing} label="Campaign Leads" value={activeCampaigns.reduce((s, c) => s + c.leadsGenerated, 0)} tone="bg-amber-100 text-amber-700" />
        <Kpi icon={AlertCircle} label="Overdue Invoices" value={`UGX ${(overdue / 1_000_000).toFixed(1)}M`} tone="bg-rose-100 text-rose-700" />
      </div>
      <p className="mt-3 text-[10px] text-slate-400 font-semibold">
        Won value UGX {(wonValue / 1_000_000).toFixed(0)}M · conversion {open.length + won.length ? Math.round((won.length / (open.length + won.length)) * 100) : 0}% · owner-based stage advancement applies to BDM sales team.
      </p>
    </StripShell>
  );
};

/* ─────────────── Finance workspace strip ─────────────── */

export const FinanceWorkspaceStrip: React.FC = () => {
  const domain = useDomainStore();
  const invoices = domain.invoices;
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const receivables = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "Overdue").reduce((s, i) => s + i.amount, 0);
  const expenseTotal = domain.expenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = domain.expenses.filter((e) => e.status === "Pending").reduce((s, e) => s + e.amount, 0);
  const pendingCashier = domain.cashierTxns.filter((c) => c.status === "Pending Approval").reduce((s, c) => s + c.amount, 0);
  const cashierCount = domain.cashierTxns.filter((c) => c.status === "Pending Approval").length;
  const collectionRate = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;

  return (
    <StripShell icon={Wallet} badge="Finance Workspace" title="Cash Position" sub="Receivables, disbursements, and approvals awaiting decision.">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi icon={DollarSign} label="Collected" value={`UGX ${(totalPaid / 1_000_000).toFixed(0)}M`} tone="bg-emerald-100 text-emerald-700" />
        <Kpi icon={Receipt} label="Receivables" value={`UGX ${(receivables / 1_000_000).toFixed(0)}M`} tone="bg-amber-100 text-amber-700" />
        <Kpi icon={AlertCircle} label="Overdue" value={`UGX ${(overdue / 1_000_000).toFixed(1)}M`} tone="bg-rose-100 text-rose-700" />
        <Kpi icon={ClipboardList} label="Expenses (this period)" value={`UGX ${(expenseTotal / 1_000_000).toFixed(0)}M`} tone="bg-sky-100 text-sky-700" />
        <Kpi icon={Wallet} label="Pending Disbursements" value={`UGX ${(pendingCashier / 1_000_000).toFixed(1)}M · ${cashierCount}`} tone="bg-violet-100 text-violet-700" />
        <Kpi icon={AlertCircle} label="Pending Expense Approvals" value={`UGX ${(pendingExpenses / 1_000_000).toFixed(1)}M`} tone="bg-indigo-100 text-indigo-700" />
      </div>
      <p className="mt-3 text-[10px] text-slate-400 font-semibold">
        Collection rate {collectionRate}% · cashier advances are attributed to guards by force number for payroll reconciliation.
      </p>
    </StripShell>
  );
};

/* ─────────────── Administration workspace strip ─────────────── */

export const AdministrationWorkspaceStrip: React.FC = () => {
  const domain = useDomainStore();
  const requisitions = domain.adminRequisitions;
  const pending = requisitions.filter((r) => r.status === "Pending Approval");
  const pendingValue = pending.reduce((s, r) => s + r.estimatedCostUgx * r.quantity, 0);
  const approved = requisitions.filter((r) => r.status === "Approved");
  const approvedValue = approved.reduce((s, r) => s + r.estimatedCostUgx * r.quantity, 0);
  const staffActive = requisitions.length;

  return (
    <StripShell icon={Package} badge="Administration Workspace" title="Office Logistics & Supplies" sub="Internal requisitions routed for General Manager final approval.">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi icon={ClipboardList} label="Requisitions" value={staffActive} tone="bg-sky-100 text-sky-700" />
        <Kpi icon={AlertCircle} label="Awaiting GM" value={pending.length} tone="bg-amber-100 text-amber-700" />
        <Kpi icon={DollarSign} label="Awaiting Value" value={`UGX ${(pendingValue / 1_000_000).toFixed(1)}M`} tone="bg-rose-100 text-rose-700" />
        <Kpi icon={BadgeCheck} label="Approved" value={approved.length} tone="bg-emerald-100 text-emerald-700" />
        <Kpi icon={Building2} label="Client Sites" value={domain.sites.length} tone="bg-violet-100 text-violet-700" />
      </div>
      <p className="mt-3 text-[10px] text-slate-400 font-semibold">
        Approved value UGX {(approvedValue / 1_000_000).toFixed(0)}M · requisitions open to any staff; the General Manager is the final approver.
      </p>
    </StripShell>
  );
};
