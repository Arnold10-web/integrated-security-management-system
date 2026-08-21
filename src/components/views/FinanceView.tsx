import React, { useState, useMemo } from "react";
import { DollarSign, CreditCard, Plus, CheckCircle2, Clock, Receipt, Search, FileText, PieChart as PieIcon, TrendingUp, AlertTriangle, Truck } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from "recharts";
import type { Invoice, Expense, CashierTransaction, UserRole, ContractRecord } from "../../types";
import { InvoicesTable, ExpensesTable, CashierTransactionsTable, CreateInvoiceModal, CashierDisbursementModal, ClientContractsView } from "../organisms";
import { FINANCE_INVOICE_ROLES, FINANCE_CASHIER_ROLES, FINANCE_CONTRACT_APPROVER_ROLES } from "../../services/rbacService";
import { useDomainStore } from "../../stores/domainStore";
import { useAuthStore } from "../../stores/authStore";

const INVOICE_ROLES: UserRole[] = FINANCE_INVOICE_ROLES;
const CASHIER_ROLES: UserRole[] = FINANCE_CASHIER_ROLES;
const CONTRACT_APPROVAL_ROLES: UserRole[] = FINANCE_CONTRACT_APPROVER_ROLES;

interface FinanceViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  cashierTxns: CashierTransaction[];
  activeRole: UserRole;
  onAddInvoice: (invoice: Omit<Invoice, "id">) => void;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => void;
  onDeleteInvoice?: (id: string) => void;
  onApproveInvoice?: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onDeleteExpense?: (id: string) => void;
  onDisburseAdvance: (txn: Omit<CashierTransaction, "id">) => void;
  onApproveCashierTxn?: (id: string) => void;
  onRejectCashierTxn?: (id: string) => void;
  contracts?: ContractRecord[];
  onUpdateContract?: (id: string, updates: Partial<ContractRecord>) => void;
  onAdvanceApproval?: (id: string) => void;
  onVoidContract?: (id: string, reason: string) => void;
}

interface FinanceViewWithTabProps extends FinanceViewProps {
  initialTab?: "invoices" | "expenses" | "cashier" | "contracts";
}

export const FinanceView: React.FC<FinanceViewWithTabProps> = ({
  invoices,
  expenses,
  cashierTxns,
  activeRole,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onApproveInvoice,
  onDeleteExpense,
  onDisburseAdvance,
  onApproveCashierTxn,
  onRejectCashierTxn,
  contracts,
  onUpdateContract,
  onAdvanceApproval,
  onVoidContract,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "cashier" | "contracts">(initialTab ?? "invoices");
  React.useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const currentUser = useAuthStore((s) => s.currentUser);
  const nonCompliant = useMemo(() => {
    const now = Date.now();
    return invoices.filter((inv) => {
      if (inv.status === "Paid") return false;
      const due = inv.dueDate ? new Date(inv.dueDate).getTime() : NaN;
      if (isNaN(due)) return false;
      return (now - due) / (86400000) >= 60;
    });
  }, [invoices]);
  const [search, setSearch] = useState("");

  const filteredInvoices = invoices.filter((inv) =>
    !search ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
    inv.siteName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredExpenses = expenses.filter((exp) =>
    !search ||
    exp.description.toLowerCase().includes(search.toLowerCase()) ||
    exp.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").reduce((sum, i) => sum + i.amount, 0);
  const totalDisbursedCashier = cashierTxns.reduce((sum, c) => sum + c.amount, 0);

  const revenueByStatus = (["Paid", "Pending", "Overdue"] as const).map((status) => ({
    name: status,
    value: invoices.filter((i) => i.status === status).reduce((sum, i) => sum + i.amount, 0),
  }));
  const statusColors: Record<string, string> = { Paid: "#10b981", Pending: "#f59e0b", Overdue: "#f43f5e" };
  const expenseByCategory = (["Fuel & Patrol", "Armoury Maintenance", "K9 Vet & Feeding", "Uniforms & Gear", "Administrative"] as const).map((cat) => ({
    category: cat,
    value: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  }));
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const netPosition = totalPaid - expenseTotal;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
              Finance Department
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Financial Accounting, Client Invoicing & Cashier Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee corporate billing, operational expenses, site SLA cost centers, and cashier disbursements for guard salary advances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTransportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            <Truck className="w-4 h-4" />
            <span>Request Transport</span>
          </button>
          {activeTab === "invoices" && INVOICE_ROLES.includes(activeRole) && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Raise Client Invoice</span>
            </button>
          )}

          {activeTab === "cashier" && CASHIER_ROLES.includes(activeRole) && (
            <button
              onClick={() => setShowCashierModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/30 cursor-pointer transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>Disburse Advance / Grant</span>
            </button>
          )}
        </div>
      </div>

      {!initialTab && (
      <>
      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Total Contract Billed</span>
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">UGX {totalBilled.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-medium">Sum of active billing cycles</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Collected Revenue</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">UGX {totalPaid.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-bold">100% Settled Invoices</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Outstanding Receivables</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-600">UGX {totalPending.toLocaleString()}</div>
          <span className="text-[10px] text-amber-600 font-bold">Pending client payments</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">Cashier Disbursed Advances</span>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900">UGX {totalDisbursedCashier.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 font-medium">Deducted from monthly payroll</span>
        </div>
      </div>

      {nonCompliant.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-black text-rose-900">Non-Compliant Clients — 2 months without payment</p>
              <p className="text-[11px] text-rose-700 mt-0.5">{nonCompliant.length} invoice(s) ≥60 days overdue, forwarded from Marketing collections for Finance follow-up.</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nonCompliant.slice(0,6).map((inv) => (
                  <span key={inv.id} className="px-2 py-0.5 rounded-full bg-white border border-rose-200 text-[10px] font-bold text-rose-800">{inv.clientName} · {inv.invoiceNumber} · {inv.dueDate}</span>
                ))}
                {nonCompliant.length>6 && <span className="text-[10px] text-rose-600 font-bold">+{nonCompliant.length-6} more</span>}
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-black shrink-0">{nonCompliant.length} Non-Compliant</span>
        </div>
      )}

      {/* Revenue & Expense Analytics */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-900">Revenue Collection & Cost Analytics</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${collectionRate >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
            {collectionRate}% Collection Rate
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Billed Revenue by Status</h4>
            {totalBilled > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenueByStatus} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {revenueByStatus.map((d) => <Cell key={d.name} fill={statusColors[d.name] ?? "#94a3b8"} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `UGX ${v.toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">No invoices recorded</div>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Expenses by Category</h4>
            {expenseTotal > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={expenseByCategory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 8 }} interval={0} angle={-15} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `UGX ${v.toLocaleString()}`} />
                  <Bar dataKey="value" name="Expense" radius={[4, 4, 0, 0]} fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">No expenses recorded</div>
            )}
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold"><PieIcon className="w-4 h-4" /><span>Net Operating Position</span></div>
            <div className={`text-3xl font-black ${netPosition >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {netPosition >= 0 ? "+" : ""}UGX {netPosition.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between"><span className="font-medium">Collected revenue</span><span className="font-black">UGX {totalPaid.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="font-medium">Approved expenses</span><span className="font-black">UGX {expenseTotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="font-medium">Cashier advances (recoverable)</span><span className="font-black">UGX {totalDisbursedCashier.toLocaleString()}</span></div>
            </div>
            <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold">{collectionRate}% of billed value collected — outstanding receivables UGX {totalPending.toLocaleString()}</p>
          </div>
        </div>
      </div>
      </>)}
      {!initialTab && (
      <>{/* Sub-tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === "invoices"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Client Billing & Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === "expenses"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Operational Expenses ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("cashier")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            activeTab === "cashier"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Cashier Salary Advances & Meal Ledger ({cashierTxns.length})</span>
        </button>

        {CONTRACT_APPROVAL_ROLES.includes(activeRole) && (
          <button
            onClick={() => setActiveTab("contracts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === "contracts"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Client Contracts & Billing Terms ({(contracts ?? []).filter((c) => c.contractType === "Client Contract").length})</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab === "invoices" ? "invoices by number, client..." : "expenses by description..."}`} className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
      </div>

      {activeTab === "invoices" && (
        <InvoicesTable invoices={filteredInvoices} activeRole={activeRole} onUpdateInvoice={onUpdateInvoice} onDeleteInvoice={onDeleteInvoice} onApproveInvoice={onApproveInvoice} />
      )}
      {activeTab === "expenses" && <ExpensesTable expenses={filteredExpenses} activeRole={activeRole} onDeleteExpense={onDeleteExpense} />}
      {activeTab === "cashier" && (
        <CashierTransactionsTable transactions={cashierTxns} activeRole={activeRole} onApprove={onApproveCashierTxn} onReject={onRejectCashierTxn} />
      )}
      {activeTab === "contracts" && (
        <ClientContractsView
          contracts={contracts ?? []}
          activeRole={activeRole}
          title="Client Contracts — Finance Validation"
          onUpdateContract={onUpdateContract}
          onAdvanceApproval={onAdvanceApproval}
          onVoidContract={onVoidContract}
        />
      )}
      </>)}
      {initialTab && (
        <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab}…`} className="w-full p-2.5 pl-9 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none" />
      </div>
      {activeTab === "invoices" && (
        <InvoicesTable invoices={filteredInvoices} activeRole={activeRole} onUpdateInvoice={onUpdateInvoice} onDeleteInvoice={onDeleteInvoice} onApproveInvoice={onApproveInvoice} />
      )}
      {activeTab === "expenses" && <ExpensesTable expenses={filteredExpenses} activeRole={activeRole} onDeleteExpense={onDeleteExpense} />}
      {activeTab === "cashier" && (
        <CashierTransactionsTable transactions={cashierTxns} activeRole={activeRole} onApprove={onApproveCashierTxn} onReject={onRejectCashierTxn} />
      )}
      {activeTab === "contracts" && (
        <ClientContractsView
          contracts={contracts ?? []}
          activeRole={activeRole}
          title="Client Contracts — Finance Validation"
          onUpdateContract={onUpdateContract}
          onAdvanceApproval={onAdvanceApproval}
          onVoidContract={onVoidContract}
        />
      )}
        </>
      )}
      {initialTab && <div className="text-[10px] text-slate-400 font-semibold pt-2 border-t border-slate-100">Dedicated page — use top navigation to switch between Invoices, Expenses, Cashier and Contracts.</div>}

      {showTransportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-white pb-2"><h3 className="text-lg font-black flex items-center gap-2"><Truck className="w-5 h-5" /> Request Transport</h3><button onClick={() => setShowTransportModal(false)} className="p-1.5 rounded-xl bg-slate-100 cursor-pointer">✕</button></div>
            <form onSubmit={(e) => { e.preventDefault(); const fd=new FormData(e.target as HTMLFormElement); useDomainStore.getState().addTransportRequest({requestedBy: currentUser?.id ?? "", requestedByName: currentUser?.name ?? "Finance User", requesterDepartment: (currentUser as any)?.department ?? "Finance", destination: fd.get("destination") as string, purpose: fd.get("purpose") as string, travelDate: fd.get("travelDate") as string, vehicleType: ((fd.get("vehicleType") as string) || "Any") as "Car" | "Motorcycle" | "Any", passengersCount: Number(fd.get("passengersCount")||1)}); setShowTransportModal(false); }} className="space-y-3 text-xs"><div><label className="font-bold block mb-1">Destination *</label><input name="destination" required className="w-full p-2.5 border rounded-xl" /></div><div><label className="font-bold block mb-1">Purpose *</label><input name="purpose" required className="w-full p-2.5 border rounded-xl" /></div><div className="grid grid-cols-2 gap-3"><div><label className="font-bold block mb-1">Travel Date *</label><input name="travelDate" type="date" required className="w-full p-2.5 border rounded-xl" /></div><div><label className="font-bold block mb-1">Vehicle Type</label><select name="vehicleType" className="w-full p-2.5 border rounded-xl bg-white"><option>Any</option><option>Car</option><option>Motorcycle</option></select></div></div><div><label className="font-bold block mb-1">Passengers</label><input name="passengersCount" type="number" min={1} defaultValue={1} className="w-full p-2.5 border rounded-xl" /></div><div className="flex justify-end gap-2 pt-3 border-t"><button type="button" onClick={() => setShowTransportModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">Cancel</button><button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Submit to Fleet</button></div></form>
          </div>
        </div>
      )}
      <CreateInvoiceModal show={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} onSubmit={onAddInvoice} />
      <CashierDisbursementModal show={showCashierModal} onClose={() => setShowCashierModal(false)} onSubmit={onDisburseAdvance} />
    </div>
  );
};
