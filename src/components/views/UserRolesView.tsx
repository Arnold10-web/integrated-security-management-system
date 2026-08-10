import React, { useState } from "react";
import { UserCheck, Plus, Building, Key, Globe, Trash2 } from "lucide-react";
import type { CustomRoleDefinition, UserRole, RegionalOffice } from "../../types";

interface UserRolesViewProps {
  activeRole: UserRole;
  customRoles: CustomRoleDefinition[];
  onRoleChange: (role: UserRole) => void;
  onAddCustomRole: (role: CustomRoleDefinition) => void;
  onDeleteCustomRole?: (id: string) => void;
  regions?: RegionalOffice[];
}

export const UserRolesView: React.FC<UserRolesViewProps> = ({
  activeRole, customRoles, onRoleChange, onAddCustomRole, onDeleteCustomRole, regions = [],
}) => {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState("");
  const [deptInput, setDeptInput] = useState("Operations");
  const [descInput, setDescInput] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["operations"]);
  const [assignedRegions, setAssignedRegions] = useState<string[]>([]);

  const allDepartmentsRoles: {
    dept: string;
    roles: { name: UserRole; title: string; desc: string; modules: string[] }[];
  }[] = [
    {
      dept: "Executive Directorate (Top Management)",
      roles: [
        {
          name: "General Manager",
          title: "General Manager",
          desc: "Top executive overseeing enterprise strategy, financial summaries, company policies, and high-level macro KPIs.",
          modules: ["Dashboard Overview", "System Specs & Constitution"],
        },
        {
          name: "Director",
          title: "Director / Board Member",
          desc: "Executive board oversight, financial audit review, and strategic growth analysis.",
          modules: ["Executive Dashboard", "System Specs"],
        },
      ],
    },
    {
      dept: "Human Resources Department",
      roles: [
        {
          name: "HR Manager",
          title: "HR Manager",
          desc: "Overall HR governance, staff recruitment, onboarding approvals, warning letter issuing, and disciplinary oversight.",
          modules: ["Personnel Directory", "Guard Roster Attendance", "Warning Letters", "Staff Onboarding"],
        },
        {
          name: "HR Assistant",
          title: "HR Assistant",
          desc: "Assists with guard attendance tracking, leave requests, and initial document verification.",
          modules: ["Guard Directory", "Attendance Tracking", "Leave Log"],
        },
        {
          name: "Records Officer",
          title: "Records Officer",
          desc: "Maintains official staff files, certifications, medical clearances, and centralized contract data storage (Staff Employment SLAs & Client Service Contracts).",
          modules: ["Staff Certification Archives", "Medical Clearance Registry", "Contract Data Storage Vault"],
        },
      ],
    },
    {
      dept: "Marketing & Sales Department",
      roles: [
        {
          name: "Business Development Manager",
          title: "Business Development Manager",
          desc: "Commercial pipeline development, client lead conversion, sales proposal creation, and CRM tracking.",
          modules: ["Commercial Leads", "Client Proposals", "Sales Pipeline"],
        },
        {
          name: "Sales and Marketing Supervisor",
          title: "Sales and Marketing Supervisor",
          desc: "Campaigns, market outreach, corporate client pitch support, and sales pipeline execution.",
          modules: ["Corporate Client CRM", "Commercial Campaigns"],
        },
      ],
    },
    {
      dept: "Operations Department",
      roles: [
        {
          name: "Operations Manager",
          title: "Operations Manager",
          desc: "Field security operations oversight, duty roster deployments, incident management, and post assignment.",
          modules: ["Duty Roster", "Live Deployment", "Armoury Vault", "K9 Sweeps", "Incidents", "Patrols"],
        },
        {
          name: "Regional Manager",
          title: "Regional Operations Manager",
          desc: "Manages their assigned region, drafts shift rosters for guards, and oversees field attendance and regional incident logs.",
          modules: ["Regional Duty Roster", "Post Inspections", "Incidents"],
        },
        {
          name: "Armorer",
          title: "Armorer",
          desc: "Firearm vault management, serial number tracking, weapon issue & return sign-offs. Multiple armorers supported per region and office location.",
          modules: ["Armoury Firearms Vault", "Serial Audit", "Ammo Ledger"],
        },
        {
          name: "K9 Supervisor",
          title: "Canine Unit Lead",
          desc: "Supervises the canine unit, handler pairing, health tracking, and deployment certification.",
          modules: ["Canine Unit", "Handler Pairing", "Deployment Certification"],
        },
        {
          name: "K9 Handler",
          title: "K9 Handler",
          desc: "Field handler paired with an assigned canine, logging patrols and health status.",
          modules: ["Canine Patrol Log", "Handler Duties"],
        },
        {
          name: "Fleet Manager",
          title: "Fleet Manager",
          desc: "Owns the patrol fleet — vehicles, drivers, fuel, maintenance — reporting into Operations.",
          modules: ["Vehicle Register", "Fuel Logs", "Maintenance & Workshop"],
        },
        {
          name: "Training Officer",
          title: "Training Officer",
          desc: "Runs the training academy — cohorts, trainee records, and pass-out for deployment readiness.",
          modules: ["Training Cohorts", "Trainee Records", "Pass-Out School"],
        },
        {
          name: "Guard Officer",
          title: "Guard Field Officer",
          desc: "Personal shift duty view, station post assignment, and quick incident log submission.",
          modules: ["Personal Duty Shift", "Post Incident Log"],
        },
      ],
    },
    {
      dept: "Investigations Department",
      roles: [
        {
          name: "Investigations Officer",
          title: "Investigations Officer (Department Head)",
          desc: "Independent internal investigations — incident logbook, case tracking, evidence, complaints referred for investigation, and disciplinary charge-sheet initiation. Shares information with Operations but is not under Operations.",
          modules: ["Incident Logbook", "Referred Complaints", "Disciplinary Charge Sheet"],
        },
      ],
    },
    {
      dept: "Finance & Cashier Department",
      roles: [
        {
          name: "Finance Manager",
          title: "Finance Manager",
          desc: "Financial strategy, client invoice approval, company expense ledger authorization, and budget control.",
          modules: ["Client Billing", "Expense Approvals", "Financial Ledgers"],
        },
        {
          name: "Accountant",
          title: "Accountant",
          desc: "Generates client billing invoices, reconciles accounts receivable/payable, and drafts tax filings.",
          modules: ["Invoicing", "Accounts Receivable/Payable", "Tax Records"],
        },
        {
          name: "Assistant Accountant",
          title: "Assistant Accountant",
          desc: "Processes operational expense vouchers and supplier invoices, tracks client billing payments, guard salary advance requisitions, and petty cash logs.",
          modules: ["Expense Vouchers", "Vendor Invoices", "Guard Advances Ledger", "Payment Reconciliation"],
        },
        {
          name: "Internal Auditor",
          title: "Internal Auditor",
          desc: "Independent audit review of financial transactions, petty cash disbursements, and compliance checks.",
          modules: ["Financial Audit Trail", "Petty Cash Ledger Review", "Variance Logs"],
        },
        {
          name: "Cashier",
          title: "Cashier / Petty Cashier",
          desc: "Manages petty cash desk, issues guard salary advances, and logs instant cash transactions.",
          modules: ["Cashier Petty Cash Desk", "Advance Disbursement Log"],
        },
      ],
    },
    {
      dept: "Administrations Department",
      roles: [
        {
          name: "Administrative Officer",
          title: "Administrative Officer",
          desc: "Office logistics, internal requisitions, station supplies inventory, and fleet dispatch coordination.",
          modules: ["Admin Requisitions", "Station Supplies", "Vehicle Fleet Dispatch"],
        },
      ],
    },
    {
      dept: "Information Technology (IT) Department",
      roles: [
        {
          name: "IT Officer",
          title: "IT Officer (System Super Admin / Overall Seer)",
          desc: "Overall seer of the system: Grants rights & permissions, creates users & roles, suspends/deletes users, monitors system health, and performs live role testing.",
          modules: ["User Account Management", "Role Creation & RBAC Matrix", "Server Monitoring", "Security Audit Logs"],
        },
      ],
    },
  ];

  const toggleRegion = (r: string) => {
    setAssignedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput) return;

    const newRole: CustomRoleDefinition = {
      id: `role-${Date.now()}`,
      roleName: roleNameInput,
      department: deptInput,
      description: descInput || "Custom created role definition.",
      allowedModules: selectedModules,
      assignedRegions,
      createdDate: new Date().toISOString().split("T")[0],
    };

    onAddCustomRole(newRole);
    setShowRoleModal(false);
    setRoleNameInput("");
    setDescInput("");
  };

  const toggleModuleSelect = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-100 text-cyan-700">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Departmental Role-Based Access Control (RBAC) & Persona Testing
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              View authorized departmental scopes across Top Management, HR, Marketing, Operations, Finance, Administrations, and IT.
            </p>
          </div>
        </div>

        {activeRole === "IT Officer" && (
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Create New System Role</span>
          </button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="space-y-8">
        {allDepartmentsRoles.map((group) => (
          <div key={group.dept} className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {group.dept}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.roles.map((r) => {
                const isCurrent = activeRole === r.name;
                return (
                  <div
                    key={r.name}
                    className={`rounded-2xl p-5 border transition-all space-y-3 flex flex-col justify-between ${
                      isCurrent
                        ? "bg-slate-900 text-white border-slate-900 shadow-xl ring-2 ring-cyan-500"
                        : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm">{r.title}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black tracking-wider uppercase">
                            ACTIVE LOGIN
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isCurrent ? "text-slate-300" : "text-slate-500"}`}>
                        {r.desc}
                      </p>

                      <div className="pt-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                            isCurrent ? "text-slate-400" : "text-slate-400"
                          }`}
                        >
                          Accessible Department Modules:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {r.modules.map((m) => (
                            <span
                              key={m}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                isCurrent
                                  ? "bg-slate-800 text-cyan-300 border border-slate-700"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRoleChange(r.name)}
                      disabled={isCurrent}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-slate-800 text-slate-500 cursor-default"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                      }`}
                    >
                      {isCurrent ? "Active Logged Persona" : `Simulate Access as ${r.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom Roles Section */}
      {customRoles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Key className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Custom Defined Roles</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map((cr) => (
              <div key={cr.id} className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900">{cr.roleName}</span>
                    <p className="text-[10px] text-slate-400 font-semibold">{cr.department}</p>
                  </div>
                  {!cr.isSystemDefault && onDeleteCustomRole && (
                    <button onClick={() => { if (window.confirm(`Delete custom role "${cr.roleName}"?`)) onDeleteCustomRole(cr.id); }}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{cr.description}</p>
                <div className="flex flex-wrap gap-1">
                  {cr.allowedModules.map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">{m}</span>
                  ))}
                </div>
                {cr.assignedRegions && cr.assignedRegions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cr.assignedRegions.map((reg) => (
                      <span key={reg} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">{reg}</span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Created: {cr.createdDate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal to Create New Custom Role */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-600" />
                Define New Departmental Role
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Title / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Regional Risk Inspector"
                  value={roleNameInput}
                  onChange={(e) => setRoleNameInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={deptInput}
                  onChange={(e) => setDeptInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  <option value="Executive Directorate">Executive Directorate</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing & Sales">Marketing & Sales</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance & Cashier">Finance & Cashier</option>
                  <option value="Administrations">Administrations</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Scope & Description</label>
                <textarea
                  rows={2}
                  placeholder="Define responsibilities and authorization levels..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Accessible System Modules</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {[
                    { id: "dashboard", label: "Executive Dashboard" },
                    { id: "operations", label: "Operations" },
                    { id: "hr", label: "Human Resources" },
                    { id: "clients", label: "Client CRM & Sites" },
                    { id: "finance", label: "Finance & Cashier" },
                    { id: "marketing", label: "Marketing & Sales" },
                    { id: "fleet", label: "Fleet" },
                    { id: "administration", label: "Administrations" },
                    { id: "it", label: "IT System Admin" },
                  ].map((mod) => (
                    <label key={mod.id} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(mod.id)}
                        onChange={() => toggleModuleSelect(mod.id)}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span>{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Regional Access (optional)</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={assignedRegions.includes("ALL")}
                      onChange={() => {
                        if (assignedRegions.includes("ALL")) setAssignedRegions([]);
                        else setAssignedRegions(["ALL"]);
                      }}
                      className="rounded text-blue-600 focus:ring-0" />
                    <Globe className="w-3 h-3" />
                    <span>All Regions</span>
                  </label>
                  {regions.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={assignedRegions.includes(r.code) || assignedRegions.includes("ALL")}
                        onChange={() => toggleRegion(r.code)}
                        className="rounded text-blue-600 focus:ring-0" />
                      <span>{r.code} - {r.regionName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
