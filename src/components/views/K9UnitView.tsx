import React, { useState } from "react";
import { Dog, Plus, Stethoscope, Search, FileText, Activity, HeartPulse, Syringe } from "lucide-react";
import type { K9Dog, K9Log, K9HealthInspection, Guard } from "../../types";
import { K9DogCard, HealthInspectionModal, AddK9Modal, LogDeploymentModal, K9HealthInspectionTable } from "../organisms";

interface K9UnitViewProps {
  k9s: K9Dog[];
  logs: K9Log[];
  healthInspections?: K9HealthInspection[];
  guards: Guard[];
  onPairHandler: (k9Id: string, handlerId: string) => void;
  onAddDog: (newDog: Omit<K9Dog, "id">) => void;
  onUpdateK9Dog?: (id: string, updates: Partial<K9Dog>) => void;
  onDeleteK9Dog?: (id: string) => void;
  onLogDeployment: (newLog: Omit<K9Log, "id">) => void;
  onAddHealthInspection?: (newIns: Omit<K9HealthInspection, "id" | "inspectionCode">) => void;
  onUpdateK9HealthInspection?: (id: string, updates: Partial<K9HealthInspection>) => void;
  onDeleteK9HealthInspection?: (id: string) => void;
}

export const K9UnitView: React.FC<K9UnitViewProps> = ({
  k9s,
  logs,
  healthInspections = [],
  guards,
  onPairHandler,
  onAddDog,
  onUpdateK9Dog,
  onDeleteK9Dog,
  onLogDeployment,
  onAddHealthInspection,
  onUpdateK9HealthInspection,
  onDeleteK9HealthInspection,
}) => {
  const [activeTab, setActiveTab] = useState<"registry" | "health_history" | "deployment_logs">("registry");
  const [searchTerm, setSearchTerm] = useState("");
  const [healthSearchTerm, setHealthSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthK9Id, setHealthK9Id] = useState("");

  const filteredDogs = k9s.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.chipNumber.includes(searchTerm)
  );

  const filteredHealthLogs = healthInspections.filter(
    (h) =>
      h.k9Name.toLowerCase().includes(healthSearchTerm.toLowerCase()) ||
      h.inspectionCode.toLowerCase().includes(healthSearchTerm.toLowerCase()) ||
      h.inspectingOfficer.toLowerCase().includes(healthSearchTerm.toLowerCase()) ||
      h.handlerName.toLowerCase().includes(healthSearchTerm.toLowerCase())
  );

  const totalK9s = k9s.length;
  const activeDutyCount = k9s.filter((d) => d.status === "Active Duty").length;
  const fullyVaccinatedCount = k9s.filter(
    (d) => !d.vaccinationStatus || d.vaccinationStatus === "Up to Date - Fully Vaccinated"
  ).length;
  const boosterDueCount = k9s.filter((d) => d.vaccinationStatus === "Rabies Booster Due").length;
  const fitCount = k9s.filter((d) => !d.healthCondition || d.healthCondition === "Optimal / Fit for Duty").length;

  const openHealthModalForK9 = (dog: K9Dog) => {
    setHealthK9Id(dog.id);
    setShowHealthModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Dog className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Canine Unit & Kennels</h2>
            <p className="text-xs text-slate-500">
              Canine registry, recurring health inspection logs, vaccination passport, and patrol history.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (k9s.length > 0) setHealthK9Id(k9s[0].id);
              setShowHealthModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Record Health Check</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Log Patrol / Sweep</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New K9</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total K9 Fleet</span>
            <span className="text-2xl font-black text-slate-900">{totalK9s}</span>
            <span className="text-[11px] text-slate-500 block">{activeDutyCount} Active Duty</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Dog className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Fit for Duty</span>
            <span className="text-2xl font-black text-emerald-700">{fitCount} / {totalK9s}</span>
            <span className="text-[11px] text-emerald-600 block">Optimal Fitness</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Vaccine Coverage</span>
            <span className="text-2xl font-black text-slate-900">
              {Math.round((fullyVaccinatedCount / Math.max(1, totalK9s)) * 100)}%
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block">{fullyVaccinatedCount} Fully Protected</span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Syringe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Health Inspections</span>
            <span className="text-2xl font-black text-purple-700">{healthInspections.length}</span>
            <span className="text-[11px] text-amber-600 font-semibold block">{boosterDueCount} Booster Due</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section Sub-Nav */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("registry")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "registry"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Dog className="w-4 h-4 text-emerald-400" />
          <span>Canine Roster & Handlers ({k9s.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("health_history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "health_history"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Stethoscope className="w-4 h-4 text-blue-400" />
          <span>Health Inspection Ledger ({healthInspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("deployment_logs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "deployment_logs"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Patrol & Sweep Audits ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: Canine Roster Grid */}
      {activeTab === "registry" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by K9 name, code, microchip ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredDogs.length} of {k9s.length} Canines
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredDogs.map((dog) => (
              <K9DogCard key={dog.id} dog={dog} guards={guards} onPairHandler={onPairHandler} onOpenHealthModal={openHealthModalForK9} onUpdateK9Dog={onUpdateK9Dog} onDeleteK9Dog={onDeleteK9Dog} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Recurring Health Inspection Ledger */}
      {activeTab === "health_history" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-blue-600" />
                K9 Recurring Veterinary Health & Physical Inspection Audit Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Historical record of body weight, vaccination status, skin/coat check, and vet officer sign-offs.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search health records..."
                value={healthSearchTerm}
                onChange={(e) => setHealthSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          <K9HealthInspectionTable inspections={filteredHealthLogs} dogs={k9s} onUpdateInspection={onUpdateK9HealthInspection} onDeleteInspection={onDeleteK9HealthInspection} />
        </div>
      )}

      {/* Tab 3: K9 Deployment & Patrol History Ledger */}
      {activeTab === "deployment_logs" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">K9 Patrol & Training Audit History</h3>
            <p className="text-xs text-slate-500">Record of cargo sweeps, explosive alerts, and tactical drills</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">K9 Name</th>
                  <th className="py-2.5 px-3">Handler</th>
                  <th className="py-2.5 px-3">Site Location</th>
                  <th className="py-2.5 px-3">Shift</th>
                  <th className="py-2.5 px-3">Performance</th>
                  <th className="py-2.5 px-3">Vet & Patrol Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-3 font-semibold text-slate-800">{log.deploymentDate}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.k9Name}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{log.handlerName}</td>
                    <td className="py-3 px-3 text-slate-600">{log.siteName}</td>
                    <td className="py-3 px-3">{log.shiftType}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {log.trainingScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 italic max-w-xs">{log.vetNotes || "Normal patrol sweep"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HealthInspectionModal show={showHealthModal} k9s={k9s} initialK9Id={healthK9Id} onClose={() => setShowHealthModal(false)} onSubmit={(data) => onAddHealthInspection?.(data)} />
      <AddK9Modal show={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={onAddDog} />
      <LogDeploymentModal show={showLogModal} k9s={k9s} onClose={() => setShowLogModal(false)} onSubmit={onLogDeployment} />
    </div>
  );
};
