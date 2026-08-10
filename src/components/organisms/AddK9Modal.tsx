import React, { useState } from "react";
import { Dog } from "lucide-react";
import type { K9Dog } from "../../types";

interface AddK9ModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (dog: Omit<K9Dog, "id">) => void;
}

export const AddK9Modal: React.FC<AddK9ModalProps> = ({ show, onClose, onSubmit }) => {
  const [dogCode, setDogCode] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState<string>("Belgian Malinois");
  const [chipNumber, setChipNumber] = useState("");
  const [ageYears, setAgeYears] = useState(3);
  const [kennelNumber, setKennelNumber] = useState("Kennel A-01");
  const [specialization, setSpecialization] = useState<string>("Explosive Detection");
  const [initialWeight, setInitialWeight] = useState(28.0);

  const resetFields = () => {
    setDogCode("");
    setDogName("");
    setDogBreed("Belgian Malinois");
    setChipNumber("");
    setAgeYears(3);
    setKennelNumber("Kennel A-01");
    setSpecialization("Explosive Detection");
    setInitialWeight(28.0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dogName || !chipNumber || !dogCode) return;
    onSubmit({
      code: dogCode,
      name: dogName,
      breed: dogBreed as K9Dog["breed"],
      chipNumber,
      ageYears: Number(ageYears),
      status: "Active Duty",
      kennelNumber,
      rabiesVaccineDate: new Date().toISOString().split("T")[0],
      lastVetCheck: new Date().toISOString().split("T")[0],
      specialization: specialization as K9Dog["specialization"],
      currentWeightKg: Number(initialWeight),
      healthCondition: "Optimal / Fit for Duty",
      vaccinationStatus: "Up to Date - Fully Vaccinated",
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
            <Dog className="w-5 h-5 text-emerald-600" />
            Register New Canine into K9 Unit
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">K9 System Code</label>
              <input type="text" required placeholder="e.g. K9-MAL-05" value={dogCode} onChange={(e) => setDogCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">K9 Name</label>
              <input type="text" required placeholder="e.g. Duke" value={dogName} onChange={(e) => setDogName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Breed</label>
              <select value={dogBreed} onChange={(e) => setDogBreed(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="Belgian Malinois">Belgian Malinois</option>
                <option value="German Shepherd">German Shepherd</option>
                <option value="Labrador Retriever">Labrador Retriever</option>
                <option value="Bloodhound">Bloodhound</option>
                <option value="Dutch Shepherd">Dutch Shepherd</option>
                <option value="Rottweiler">Rottweiler</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Microchip ISO ID</label>
              <input type="text" required placeholder="e.g. 9851410023999" value={chipNumber} onChange={(e) => setChipNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age (Yrs)</label>
              <input type="number" required value={ageYears} onChange={(e) => setAgeYears(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kennel No.</label>
              <input type="text" value={kennelNumber} onChange={(e) => setKennelNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (Kg)</label>
              <input type="number" step="0.1" value={initialWeight} onChange={(e) => setInitialWeight(parseFloat(e.target.value) || 28)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Specialization</label>
            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="Explosive Detection">Explosive Detection</option>
              <option value="Narcotics Detection">Narcotics Detection</option>
              <option value="Patrol & Apprehension">Patrol & Apprehension</option>
              <option value="Tracking & Trailing">Tracking & Trailing</option>
              <option value="Search & Rescue">Search & Rescue</option>
              <option value="Firearms Detection">Firearms Detection</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer">Save K9 Passport</button>
          </div>
        </form>
      </div>
    </div>
  );
};
