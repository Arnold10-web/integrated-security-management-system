import React, { useState } from "react";
import {
  Building2,
  Package,
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  Globe,
} from "lucide-react";
import { AdminRequisition, ClientSite, type UserRole } from "../../types";
import { ADMIN_REQUISITION_ROLES, MARKETING_ROLES } from "../../services/rbacService";

const GM_APPROVE_ROLE: UserRole = "General Manager";
const SITE_CREATE_ROLES: UserRole[] = MARKETING_ROLES;

interface AdminDeptViewProps {
  activeRole: UserRole;
  requisitions: AdminRequisition[];
  onAddRequisition: (req: Omit<AdminRequisition, "id">) => void;
  onApproveRequisition: (id: string) => void;
  onRejectRequisition: (id: string, reason: string) => void;
  onAddSite?: (newSite: Omit<ClientSite, "id">) => void;
}

export const AdminDeptView: React.FC<AdminDeptViewProps> = ({
  activeRole,
  requisitions,
  onAddRequisition,
  onApproveRequisition,
  onRejectRequisition,
  onAddSite,
}) => {
  const canRaiseRequisition = ADMIN_REQUISITION_ROLES.includes(activeRole);
  const isGM = activeRole === GM_APPROVE_ROLE;
  const canApproveRequisition = isGM;
  const canCreateSite = SITE_CREATE_ROLES.includes(activeRole);
  const [showReqModal, setShowReqModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [deptInput, setDeptInput] = useState("Operations");
  const [requestedByInput, setRequestedByInput] = useState("Patrick Kigozi");
  const [descInput, setDescInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [costInput, setCostInput] = useState(250000);
  const [priorityInput, setPriorityInput] = useState<"High" | "Medium" | "Low">("Medium");

  // Site form state
  const [siteClientName, setSiteClientName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteContact, setSiteContact] = useState("");
  const [siteContactPhone, setSiteContactPhone] = useState("");
  const [siteLocation, setSiteLocation] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reqCode = `ADM-REQ-2026-${String(requisitions.length + 1).padStart(2, "0")}`;
    onAddRequisition({
      reqCode,
      department: deptInput,
      requestedBy: requestedByInput,
      itemDescription: descInput,
      quantity: qtyInput,
      estimatedCostUgx: costInput,
      priority: priorityInput,
      status: "Pending Approval",
      dateRequested: new Date().toISOString().split("T")[0],
    });
    setShowReqModal(false);
    setDescInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase border border-indigo-200">
                Administrations Department
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Administrative Officer Control</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Office Logistics, Supplies & Internal Requisitions
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage office logistics requisitions, station supplies inventory, facility maintenance, and fleet dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateSite && (
            <button
              onClick={() => setShowSiteModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Globe className="w-4 h-4" />
              <span>Create New Client Site</span>
            </button>
          )}
          {canRaiseRequisition && (
            <button
              onClick={() => setShowReqModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Raise New Admin Requisition</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Total Requisitions Raised</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{requisitions.length} Vouchers</div>
            <span className="text-[10px] text-indigo-600 font-bold">Admin Logistics Ledger</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Pending Requisitions</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {requisitions.filter((r) => r.status === "Pending Approval").length} Awaiting Approval
            </div>
            <span className="text-[10px] text-amber-600 font-bold">Requires GM Sign-off</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Total Value Approved</span>
            <div className="text-xl font-black text-emerald-600 mt-1">
              UGX {requisitions.filter((r) => r.status === "Approved" || r.status === "Procured").reduce((a, b) => a + b.estimatedCostUgx, 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">Procured Logistics Stock</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            Internal Logistics & Supply Requisition Vouchers
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{requisitions.length} Total Vouchers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="p-3.5">Req Code</th>
                <th className="p-3.5">Department & Requested By</th>
                <th className="p-3.5">Item Description & Qty</th>
                <th className="p-3.5">Est. Cost (UGX)</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700 font-medium">
              {requisitions.map((req) => (
                <tr
                  key={req.id}
                  className={`transition-colors ${
                    isGM && req.status === "Pending Approval"
                      ? "bg-amber-50/70 hover:bg-amber-50 ring-2 ring-inset ring-amber-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{req.reqCode}</div>
                    <div className="text-[10px] text-slate-400">{req.dateRequested}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{req.department}</div>
                    <div className="text-[10px] text-slate-500">{req.requestedBy}</div>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="font-bold text-slate-900">{req.itemDescription}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Quantity: {req.quantity} Units</div>
                  </td>
                  <td className="p-3.5 font-extrabold text-slate-900">
                    UGX {req.estimatedCostUgx.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        req.priority === "High"
                          ? "bg-rose-100 text-rose-800"
                          : req.priority === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        req.status === "Approved" || req.status === "Procured"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : req.status === "Pending Approval"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.status === "Rejected" && req.rejectionReason && (
                      <div className="text-[9px] text-rose-600 font-semibold mt-1 max-w-[180px] leading-tight">
                        {req.rejectionReason}
                        {req.rejectedBy ? ` — ${req.rejectedBy}` : ""}
                      </div>
                    )}
                    {req.status === "Approved" && req.approvedBy && (
                      <div className="text-[9px] text-emerald-700 font-semibold mt-1">
                        Approved by {req.approvedBy}
                        {req.approvedAt ? ` · ${req.approvedAt}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {req.status === "Pending Approval" && canApproveRequisition ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onApproveRequisition(req.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt(`Reject ${req.reqCode}? Reason required:`, "");
                            if (reason?.trim()) onRejectRequisition(req.id, reason.trim());
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-extrabold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Logged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Client Site */}
      {showSiteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Create New Client Site Post
              </h3>
              <button onClick={() => setShowSiteModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!siteClientName || !siteName) return;
                onAddSite?.({
                  clientName: siteClientName,
                  siteName,
                  location: siteLocation,
                  zone: "Central Business",
                  dayShiftGuards: 4,
                  nightShiftGuards: 4,
                  dayShiftArmed: 1,
                  nightShiftArmed: 1,
                  armedGuardsRequired: 1,
                  k9Required: false,
                  contactPerson: siteContact,
                  contactPhone: siteContactPhone,
                  slaStatus: "Compliant",
                });
                setShowSiteModal(false);
                setSiteClientName("");
                setSiteName("");
                setSiteContact("");
                setSiteContactPhone("");
                setSiteLocation("");
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Organization</label>
                  <input type="text" required value={siteClientName} onChange={(e) => setSiteClientName(e.target.value)} placeholder="e.g. Stanbic Bank" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Site Post Name</label>
                  <input type="text" required value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Main Branch Vault" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Location Address</label>
                <input type="text" required value={siteLocation} onChange={(e) => setSiteLocation(e.target.value)} placeholder="e.g. Plot 6, Kampala Road" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client Contact Person</label>
                  <input type="text" value={siteContact} onChange={(e) => setSiteContact(e.target.value)} placeholder="e.g. James Mugisha" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input type="text" value={siteContactPhone} onChange={(e) => setSiteContactPhone(e.target.value)} placeholder="+256 700 123456" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowSiteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer">Create Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to Raise Admin Requisition */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Raise Administration Logistics Requisition
              </h3>
              <button onClick={() => setShowReqModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department</label>
                <select
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance & Cashier">Finance & Cashier</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="Administrations">Administrations</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requested By (Staff Name)</label>
                <input
                  type="text"
                  required
                  value={requestedByInput}
                  onChange={(e) => setRequestedByInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Description & Specifications</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g., Heavy-Duty Flashlights, A4 Printing Paper, Biometric Terminal..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={qtyInput}
                    onChange={(e) => setQtyInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Cost (UGX)</label>
                  <input
                    type="number"
                    required
                    value={costInput}
                    onChange={(e) => setCostInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requisition Priority</label>
                <select
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
