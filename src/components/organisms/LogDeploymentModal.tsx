import React, { useState } from "react";
import { FileText } from "lucide-react";
import type { K9Log, K9Dog } from "../../types";

interface LogDeploymentModalProps {
  show: boolean;
  k9s: K9Dog[];
  onClose: () => void;
  onSubmit: (log: Omit<K9Log, "id">) => void;
}

export const LogDeploymentModal: React.FC<LogDeploymentModalProps> = ({ show, k9s, onClose, onSubmit }) => {
  const [selectedK9Id, setSelectedK9Id] = useState("");
  const [siteName, setSiteName] = useState("Entebbe Logistics & Cargo Hub");
  const [shiftType, setShiftType] = useState<string>("Day Shift");
  const [trainingScore, setTrainingScore] = useState<string>("Outstanding");
  const [vetNotes, setVetNotes] = useState("");

  const resetFields = () => {
    setSelectedK9Id("");
    setSiteName("Entebbe Logistics & Cargo Hub");
    setShiftType("Day Shift");
    setTrainingScore("Outstanding");
    setVetNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dog = k9s.find((d) => d.id === selectedK9Id);
    if (!dog) return;
    onSubmit({
      k9Id: dog.id,
      k9Name: `${dog.name} (${dog.breed})`,
      handlerName: dog.assignedHandlerName || "Canine Handler",
      siteName,
      deploymentDate: new Date().toISOString().split("T")[0],
      shiftType: shiftType as K9Log["shiftType"],
      trainingScore: trainingScore as K9Log["trainingScore"],
      vetNotes,
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Log K9 Patrol / Sweep Activity
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select K9 Canine</label>
            <select required value={selectedK9Id} onChange={(e) => setSelectedK9Id(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">-- Choose Canine --</option>
              {k9s.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.breed}) - Handler: {d.assignedHandlerName || "None"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Site / Location</label>
            <input type="text" required value={siteName} onChange={(e) => setSiteName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shift Type</label>
              <select value={shiftType} onChange={(e) => setShiftType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Day Shift">Day Shift</option>
                <option value="Night Shift">Night Shift</option>
                <option value="Emergency Response">Emergency Response</option>
                <option value="Joint Operation / VIP Escort">Joint Operation / VIP Escort</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Performance Rating</label>
              <select value={trainingScore} onChange={(e) => setTrainingScore(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Outstanding">Outstanding</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Needs Improvement">Needs Improvement</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Vet Observations</label>
            <textarea rows={2} value={vetNotes} onChange={(e) => setVetNotes(e.target.value)}
              placeholder="Canine alertness during sweep, physical condition..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Record Deployment Log</button>
          </div>
        </form>
      </div>
    </div>
  );
};
