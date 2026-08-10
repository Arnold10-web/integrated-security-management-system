import React, { useState } from "react";
import { Plus, X, CheckCircle2, XCircle, GitBranch, ChevronRight, Clock, Trash2 } from "lucide-react";
import type { WorkflowDefinition, Approval } from "../../types";

interface WorkflowViewProps {
  workflows: WorkflowDefinition[];
  approvals: Approval[];
  onAddWorkflow: (wf: Omit<WorkflowDefinition, "id">) => void;
  onUpdateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  onDeleteWorkflow: (id: string) => void;
  onActOnApproval: (id: string, action: "Approved" | "Rejected", comment?: string) => void;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  workflows, approvals, onAddWorkflow, onDeleteWorkflow, onActOnApproval,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [actionModal, setActionModal] = useState<{ id: string; action: "Approved" | "Rejected" } | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", description: "", module: "",
    steps: [{ stepOrder: 1, name: "", approverRole: "" }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWorkflow(form as Omit<WorkflowDefinition, "id">);
    setForm({ name: "", code: "", description: "", module: "", steps: [{ stepOrder: 1, name: "", approverRole: "" }] });
    setShowForm(false);
  };

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { stepOrder: form.steps.length + 1, name: "", approverRole: "" }] });
  };

  const statusColors: Record<string, string> = {
    Pending: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    Approved: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    Rejected: "bg-red-500/20 text-red-600 border-red-500/30",
  };

  const stepLabel = (step: number, total: number) => `Step ${step} of ${total}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">Workflow Engine</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-slate-800">
          <Plus className="w-3.5 h-3.5" /> New Workflow
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">Create Workflow</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Code</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Module</label>
                  <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none">
                    <option value="">Select module...</option>
                    <option value="Leave">Leave</option>
                    <option value="Expense">Expense</option>
                    <option value="Requisition">Requisition</option>
                    <option value="Incident">Incident</option>
                    <option value="Recruitment">Recruitment</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-slate-700 text-[10px] uppercase">Approval Steps</span>
                  <button type="button" onClick={addStep}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer">+ Add Step</button>
                </div>
                {form.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black mt-1.5">{step.stepOrder}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input value={step.name} onChange={(e) => {
                        const steps = [...form.steps];
                        steps[i].name = e.target.value;
                        setForm({ ...form, steps });
                      }} placeholder="Step name" required className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                      <input value={step.approverRole} onChange={(e) => {
                        const steps = [...form.steps];
                        steps[i].approverRole = e.target.value;
                        setForm({ ...form, steps });
                      }} placeholder="Approver role (e.g. Regional Manager)" required className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none" />
                    </div>
                    {form.steps.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}
                        className="text-red-400 hover:text-red-500 text-xs mt-2 cursor-pointer">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs cursor-pointer hover:bg-slate-800">Create Workflow</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Workflow Definitions</h2>
          {workflows.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <GitBranch className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No workflows defined</p>
            </div>
          ) : workflows.map((wf) => (
            <div key={wf.id} className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">{wf.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">{wf.code} • {wf.module}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${wf.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {wf.isActive ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => { if (window.confirm(`Delete workflow "${wf.name}"?`)) onDeleteWorkflow(wf.id); }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {wf.steps.map((s, i) => (
                  <React.Fragment key={s.id}>
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-slate-300 text-white flex items-center justify-center text-[8px] font-black">{s.stepOrder}</span>
                      {s.name}
                    </div>
                    {i < wf.steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Active Approvals</h2>
          {approvals.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
              <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-semibold">No pending approvals</p>
            </div>
          ) : approvals.map((a) => {
            const currentStepDef = workflows.find((w) => w.id === a.workflowId)?.steps.find((s) => s.stepOrder === a.currentStep);
            return (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900 text-xs">{a.workflowCode} — {a.referenceType}</p>
                    <p className="text-[10px] text-slate-400">Requested by {a.requestedByName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${statusColors[a.status] || "bg-slate-100"}`}>{a.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="font-semibold text-slate-500">{stepLabel(a.currentStep, a.totalSteps)}</span>
                  {currentStepDef && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">Waiting: {currentStepDef.approverRole}</span>
                  )}
                </div>
                {a.status === "Pending" && actionModal?.id !== a.id && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setActionModal({ id: a.id, action: "Approved" })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-600 transition-all">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => setActionModal({ id: a.id, action: "Rejected" })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-red-600 transition-all">
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
                {actionModal?.id === a.id && (
                  <div className="mt-2 flex items-center gap-2">
                    <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment (optional)" className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold outline-none" />
                    <button onClick={() => { onActOnApproval(a.id, actionModal.action, comment); setActionModal(null); setComment(""); }}
                      className="px-2 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black cursor-pointer">
                      Confirm
                    </button>
                    <button onClick={() => setActionModal(null)} className="text-[10px] text-slate-400 cursor-pointer">Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
