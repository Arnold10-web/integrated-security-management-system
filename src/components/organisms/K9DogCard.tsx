import React from "react";
import { UserCheck, Scale, Syringe, Calendar, Activity, Stethoscope, Pencil, Trash2 } from "lucide-react";
import type { K9Dog, Guard } from "../../types";

interface K9DogCardProps {
  dog: K9Dog;
  guards: Guard[];
  onPairHandler: (k9Id: string, handlerId: string) => void;
  onOpenHealthModal: (dog: K9Dog) => void;
  onUpdateK9Dog?: (id: string, updates: Partial<K9Dog>) => void;
  onDeleteK9Dog?: (id: string) => void;
}

export const K9DogCard: React.FC<K9DogCardProps> = ({ dog, guards, onPairHandler, onOpenHealthModal, onUpdateK9Dog, onDeleteK9Dog }) => {
  const k9Handlers = guards.filter((g) => g.k9Qualified || g.designation === "K9 Handler");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 space-y-4">
      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center text-lg font-black shrink-0">
            🐕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">{dog.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {dog.code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {dog.breed} • {dog.ageYears} Yrs • {dog.specialization}
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            dog.status === "Active Duty"
              ? "bg-emerald-100 text-emerald-800"
              : dog.status === "In Training"
              ? "bg-blue-100 text-blue-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {dog.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div>
          <span className="text-slate-400 font-medium block text-[10px] uppercase">Microchip ID</span>
          <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">{dog.chipNumber}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block text-[10px] uppercase">Weight (kg)</span>
          <span className="font-bold text-slate-900 flex items-center gap-1">
            <Scale className="w-3 h-3 text-emerald-600" />
            {dog.currentWeightKg ? `${dog.currentWeightKg} kg` : "Unrecorded"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block text-[10px] uppercase">Kennel</span>
          <span className="font-semibold text-slate-700">{dog.kennelNumber}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/60 p-2.5 rounded-xl">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500">Condition:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
              dog.healthCondition === "Optimal / Fit for Duty" || !dog.healthCondition
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {dog.healthCondition || "Optimal / Fit for Duty"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Syringe className="w-3.5 h-3.5 text-teal-600" />
          <span
            className={`font-semibold text-[10px] ${
              dog.vaccinationStatus === "Rabies Booster Due"
                ? "text-rose-700 font-bold"
                : "text-slate-700"
            }`}
          >
            {dog.vaccinationStatus || "Fully Vaccinated"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            Assigned K9 Handler
          </span>
          <span className="text-[11px] text-slate-400">Last Vet Check: {dog.lastVetCheck}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
          <span className="font-semibold text-slate-900">
            {dog.assignedHandlerName ? dog.assignedHandlerName : "No Handler Paired"}
          </span>
          <select
            onChange={(e) => {
              if (e.target.value) onPairHandler(dog.id, e.target.value);
            }}
            defaultValue=""
            className="bg-white border border-slate-200 text-[11px] rounded-lg px-2 py-1 font-semibold text-blue-700 cursor-pointer focus:outline-none"
          >
            <option value="" disabled>
              Change Handler
            </option>
            {k9Handlers.map((h) => (
              <option key={h.id} value={h.id}>
                {h.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Rabies Due: <strong>{dog.rabiesVaccineDate}</strong></span>
        </div>

        <div className="flex items-center gap-1">
          {onUpdateK9Dog && (
            <button onClick={() => onOpenHealthModal(dog)} className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-blue-200" title="Log Health Check">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}
          {onUpdateK9Dog && (
            <button onClick={() => onUpdateK9Dog(dog.id, { status: dog.status === "Active Duty" ? "Medical Leave" : "Active Duty" })} className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer border border-emerald-200" title="Toggle Status">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDeleteK9Dog && (
            <button onClick={() => { if (window.confirm(`Delete K9 dog "${dog.name}"?`)) onDeleteK9Dog(dog.id); }} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer border border-rose-200" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
