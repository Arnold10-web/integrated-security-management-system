import React, { useState, useEffect } from "react";
import { Stethoscope } from "lucide-react";
import type { K9Dog, K9HealthInspection } from "../../types";

interface HealthInspectionModalProps {
  show: boolean;
  k9s: K9Dog[];
  initialK9Id: string;
  onClose: () => void;
  onSubmit: (ins: Omit<K9HealthInspection, "id" | "inspectionCode">) => void;
}

export const HealthInspectionModal: React.FC<HealthInspectionModalProps> = ({ show, k9s, initialK9Id, onClose, onSubmit }) => {
  const [healthK9Id, setHealthK9Id] = useState(initialK9Id || "");
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [weightKg, setWeightKg] = useState<number>(30.0);
  const [temperatureCelsius, setTemperatureCelsius] = useState<number>(38.5);
  const [vaccinationStatus, setVaccinationStatus] = useState<K9HealthInspection["vaccinationStatus"]>("Up to Date - Fully Vaccinated");
  const [physicalCondition, setPhysicalCondition] = useState<K9HealthInspection["physicalCondition"]>("Optimal / Fit for Duty");
  const [coatAndSkinCheck, setCoatAndSkinCheck] = useState<K9HealthInspection["coatAndSkinCheck"]>("Normal & Clean");
  const [appetiteAndHydration, setAppetiteAndHydration] = useState<K9HealthInspection["appetiteAndHydration"]>("Normal / Healthy");
  const [inspectingOfficer, setInspectingOfficer] = useState("Dr. Ronald Kato (K9 Chief Vet)");
  const [healthNotes, setHealthNotes] = useState("");

  useEffect(() => {
    if (show && initialK9Id) {
      setHealthK9Id(initialK9Id);
      const dog = k9s.find((d) => d.id === initialK9Id);
      if (dog && dog.currentWeightKg) setWeightKg(dog.currentWeightKg);
    }
  }, [show, initialK9Id, k9s]);

  const resetFields = () => {
    setHealthK9Id("");
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setWeightKg(30.0);
    setTemperatureCelsius(38.5);
    setVaccinationStatus("Up to Date - Fully Vaccinated");
    setPhysicalCondition("Optimal / Fit for Duty");
    setCoatAndSkinCheck("Normal & Clean");
    setAppetiteAndHydration("Normal / Healthy");
    setInspectingOfficer("Dr. Ronald Kato (K9 Chief Vet)");
    setHealthNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dog = k9s.find((d) => d.id === healthK9Id);
    if (!dog) return;

    onSubmit({
      k9Id: dog.id,
      k9Name: `${dog.name} (${dog.breed})`,
      handlerName: dog.assignedHandlerName || "Kennel Master",
      inspectionDate,
      weightKg: Number(weightKg),
      vaccinationStatus,
      physicalCondition,
      coatAndSkinCheck,
      appetiteAndHydration,
      temperatureCelsius: Number(temperatureCelsius),
      inspectingOfficer,
      notes: healthNotes || "Routine recurring health & physical inspection.",
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
            <Stethoscope className="w-5 h-5 text-blue-600" />
            Record Recurring K9 Health & Vet Inspection
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select K9 Canine</label>
            <select
              required
              value={healthK9Id}
              onChange={(e) => {
                setHealthK9Id(e.target.value);
                const dog = k9s.find((d) => d.id === e.target.value);
                if (dog && dog.currentWeightKg) setWeightKg(dog.currentWeightKg);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="" disabled>-- Choose K9 Canine --</option>
              {k9s.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.breed} - {d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Date</label>
              <input type="date" required value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (Kg)</label>
              <input type="number" step="0.1" required value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temp (°C)</label>
              <input type="number" step="0.1" value={temperatureCelsius} onChange={(e) => setTemperatureCelsius(parseFloat(e.target.value) || 38.5)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vaccination Status</label>
              <select value={vaccinationStatus} onChange={(e) => setVaccinationStatus(e.target.value as K9HealthInspection["vaccinationStatus"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Up to Date - Fully Vaccinated">Up to Date - Fully Vaccinated</option>
                <option value="Rabies Booster Due">Rabies Booster Due</option>
                <option value="Deworming Required">Deworming Required</option>
                <option value="Pending Vet Booster">Pending Vet Booster</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Condition</label>
              <select value={physicalCondition} onChange={(e) => setPhysicalCondition(e.target.value as K9HealthInspection["physicalCondition"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Optimal / Fit for Duty">Optimal / Fit for Duty</option>
                <option value="Minor Fatigue / Rest Prescribed">Minor Fatigue / Rest Prescribed</option>
                <option value="Under Veterinary Treatment">Under Veterinary Treatment</option>
                <option value="Unfit for Duty">Unfit for Duty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Coat & Skin Examination</label>
              <select value={coatAndSkinCheck} onChange={(e) => setCoatAndSkinCheck(e.target.value as K9HealthInspection["coatAndSkinCheck"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Normal & Clean">Normal & Clean</option>
                <option value="Skin Rash / Mange">Skin Rash / Mange</option>
                <option value="Ticks / Parasites Found">Ticks / Parasites Found</option>
                <option value="Wounds / Abrasions">Wounds / Abrasions</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Appetite & Hydration</label>
              <select value={appetiteAndHydration} onChange={(e) => setAppetiteAndHydration(e.target.value as K9HealthInspection["appetiteAndHydration"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Normal / Healthy">Normal / Healthy</option>
                <option value="Reduced Appetite">Reduced Appetite</option>
                <option value="Dehydrated">Dehydrated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inspecting Vet Officer / Handler</label>
            <input type="text" required value={inspectingOfficer} onChange={(e) => setInspectingOfficer(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Observations & Notes</label>
            <textarea rows={2} value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="Record muscle tone, dental check, parasite treatment, rest orders..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save Health Check Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
};
