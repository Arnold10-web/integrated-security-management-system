import React, { useState } from "react";
import { AlertTriangle, Check, ClipboardCheck, Loader2, UserCheck, X } from "lucide-react";

export interface ProbationSubject {
  id: string;
  name: string;
  identifier: string;
}

interface ProbationModalProps {
  subject: ProbationSubject | null;
  onClose: () => void;
  onSubmit: (data: { outcome: "Approved Employee" | "Extended" | "Failed"; consequence?: "Terminate" | "Reassign"; notes?: string }) => void;
  label?: string;
}

type Outcome = "Approved Employee" | "Extended" | "Failed";

export const ProbationModal: React.FC<ProbationModalProps> = ({ subject, onClose, onSubmit, label = "Probation Outcome" }) => {
  const [outcome, setOutcome] = useState<Outcome>("Approved Employee");
  const [consequence, setConsequence] = useState<"Terminate" | "Reassign">("Reassign");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!subject) return null;
  const { name, identifier } = subject;

  const submit = () => {
    if (outcome === "Failed" && consequence === "Terminate" && !notes.trim()) {
      setError("A termination reason is required (this becomes the termination reason on the personnel record).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onSubmit({
        outcome,
        consequence: outcome === "Failed" ? consequence : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to record probation outcome");
      setSubmitting(false);
    }
  };

  const outcomeCards: { value: Outcome; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      value: "Approved Employee",
      label: "Approve",
      desc: "Passed probation → full Approved Employee.",
      icon: <UserCheck className="w-4 h-4" />,
      color: outcome === "Approved Employee" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:border-emerald-300",
    },
    {
      value: "Extended",
      label: "Extend",
      desc: "Grant a further probation window.",
      icon: <ClipboardCheck className="w-4 h-4" />,
      color: outcome === "Extended" ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 hover:border-amber-300",
    },
    {
      value: "Failed",
      label: "Fail",
      desc: "Failed probation — demote/reassign or terminate.",
      icon: <AlertTriangle className="w-4 h-4" />,
      color: outcome === "Failed" ? "border-rose-500 bg-rose-50 text-rose-800" : "border-slate-200 hover:border-rose-300",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="bg-slate-900 text-white p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">{label}</h3>
              <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                {name} · {identifier}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs font-bold">{error}</div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs font-bold text-blue-800">
            The HR Manager finalizes this employee's probation. Choosing "Fail" moves them out of the
            active register — either demoted/reassigned under new terms or terminated with a recorded reason.
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Decision</p>
            <div className="grid grid-cols-3 gap-2">
              {outcomeCards.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setOutcome(c.value); setError(null); }}
                  className={`rounded-2xl border-2 p-3 text-left cursor-pointer transition-all ${c.color}`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs mb-1">
                    {c.icon}
                    {c.label}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold leading-tight">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {outcome === "Failed" && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Consequence</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConsequence("Reassign")}
                  className={`rounded-xl border-2 p-3 text-left cursor-pointer transition-all ${consequence === "Reassign" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-amber-300"}`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5 text-amber-700" /> Demote / Reassign</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Retains employment under amended terms.</p>
                </button>
                <button
                  onClick={() => setConsequence("Terminate")}
                  className={`rounded-xl border-2 p-3 text-left cursor-pointer transition-all ${consequence === "Terminate" ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-rose-300"}`}
                >
                  <p className="font-black text-xs text-slate-800 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Terminate</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Ends employment — reason recorded permanently.</p>
                </button>
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Notes / Reason {outcome === "Failed" && consequence === "Terminate" ? "(required)" : "(optional)"}
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={outcome === "Failed" && consequence === "Terminate" ? "e.g. Repeated breaches of duty during probation…" : "e.g. Satisfactory performance – approved; Needs more time – extended…"}
              className="mt-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-400 resize-y"
            />
          </label>

          <button
            onClick={submit}
            disabled={submitting}
            className={`w-full py-3 rounded-xl text-sm font-black shadow-md cursor-pointer disabled:opacity-50 text-white transition-colors ${
              outcome === "Failed" ? "bg-rose-600 hover:bg-rose-500" : outcome === "Extended" ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : <Check className="w-4 h-4 inline mr-1" />}
            {outcome === "Approved Employee" ? "Confirm Approved Employee" : outcome === "Extended" ? "Confirm Extension" : `Confirm Failed Probation — ${consequence}`}
          </button>
        </div>
      </div>
    </div>
  );
};
