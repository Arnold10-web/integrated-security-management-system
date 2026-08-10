import React from "react";
import {
  AlertOctagon,
  Clock,
  Fuel,
  ShieldCheck,
} from "lucide-react";
import {
  Vehicle,
  MaintenanceServiceLog,
  DriverRecord,
  DailyVehicleInspection,
  FleetBreakdownEmergency,
} from "../../types";

interface FleetModalsPanelProps {
  showAddVehicleModal: boolean;
  setShowAddVehicleModal: (v: boolean) => void;
  showTripModal: boolean;
  setShowTripModal: (v: boolean) => void;
  showFuelModal: boolean;
  setShowFuelModal: (v: boolean) => void;
  showMaintModal: boolean;
  setShowMaintModal: (v: boolean) => void;
  showDriverModal: boolean;
  setShowDriverModal: (v: boolean) => void;
  showInspectionModal: boolean;
  setShowInspectionModal: (v: boolean) => void;
  showBreakdownModal: boolean;
  setShowBreakdownModal: (v: boolean) => void;
  showIntervalModal: boolean;
  setShowIntervalModal: (v: boolean) => void;
  showOilModal: boolean;
  setShowOilModal: (v: boolean) => void;
  showTyreModal: boolean;
  setShowTyreModal: (v: boolean) => void;

  handleAddVehicleSubmit: (e: React.FormEvent) => void;
  handleAddTripSubmit: (e: React.FormEvent) => void;
  handleAddFuelSubmit: (e: React.FormEvent) => void;
  handleAddMaintSubmit: (e: React.FormEvent) => void;
  handleAddDriverSubmit: (e: React.FormEvent) => void;
  handleAddInspectionSubmit: (e: React.FormEvent) => void;
  handleAddBreakdownSubmit: (e: React.FormEvent) => void;
  handleScheduleIntervalSubmit: (e: React.FormEvent) => void;
  handleLogOilChangeSubmit: (e: React.FormEvent) => void;
  handleLogTyreCheckSubmit: (e: React.FormEvent) => void;

  vehicles: Vehicle[];
  localVehicles: Vehicle[];

  plateNumber: string;
  setPlateNumber: (v: string) => void;
  vehicleType: Vehicle["vehicleType"];
  setVehicleType: (v: Vehicle["vehicleType"]) => void;
  makeModel: string;
  setMakeModel: (v: string) => void;
  driverAssigned: string;
  setDriverAssigned: (v: string) => void;
  deploymentBranch: string;
  setDeploymentBranch: (v: string) => void;

  selectedVehicleId: string;
  setSelectedVehicleId: (v: string) => void;
  tripDriver: string;
  setTripDriver: (v: string) => void;
  tripDestination: string;
  setTripDestination: (v: string) => void;
  tripPurpose: string;
  setTripPurpose: (v: string) => void;
  startMileage: number;
  setStartMileage: (v: number) => void;

  fuelLitres: number;
  setFuelLitres: (v: number) => void;
  fuelCost: number;
  setFuelCost: (v: number) => void;
  stationName: string;
  setStationName: (v: string) => void;

  maintType: MaintenanceServiceLog["serviceType"];
  setMaintType: (v: MaintenanceServiceLog["serviceType"]) => void;
  maintDesc: string;
  setMaintDesc: (v: string) => void;
  workshop: string;
  setWorkshop: (v: string) => void;

  driverName: string;
  setDriverName: (v: string) => void;
  licenceNo: string;
  setLicenceNo: (v: string) => void;
  licenceClass: DriverRecord["licenceClass"];
  setLicenceClass: (v: DriverRecord["licenceClass"]) => void;
  driverRoleType: NonNullable<DriverRecord["roleType"]>;
  setDriverRoleType: (v: NonNullable<DriverRecord["roleType"]>) => void;

  inspectVehicle: string;
  setInspectVehicle: (v: string) => void;
  brakesCheck: DailyVehicleInspection["brakesCheck"];
  setBrakesCheck: (v: DailyVehicleInspection["brakesCheck"]) => void;
  tyresCheck: DailyVehicleInspection["tyresCheck"];
  setTyresCheck: (v: DailyVehicleInspection["tyresCheck"]) => void;
  defectsNoted: string;
  setDefectsNoted: (v: string) => void;

  breakdownVehicle: string;
  setBreakdownVehicle: (v: string) => void;
  breakdownLocation: string;
  setBreakdownLocation: (v: string) => void;
  issueType: FleetBreakdownEmergency["issueType"];
  setIssueType: (v: FleetBreakdownEmergency["issueType"]) => void;
  breakdownDesc: string;
  setBreakdownDesc: (v: string) => void;

  targetVehId: string;
  setTargetVehId: (v: string) => void;
  intervalKmInput: number;
  setIntervalKmInput: (v: number) => void;
  targetServiceKmInput: number;
  setTargetServiceKmInput: (v: number) => void;
  targetWorkshopInput: string;
  setTargetWorkshopInput: (v: string) => void;
  targetScopeInput: string;
  setTargetScopeInput: (v: string) => void;

  oilChangeKmInput: number;
  setOilChangeKmInput: (v: number) => void;
  oilGradeInput: string;
  setOilGradeInput: (v: string) => void;
  oilCostUgxInput: number;
  setOilCostUgxInput: (v: number) => void;

  tyreTreadMmInput: number;
  setTyreTreadMmInput: (v: number) => void;
  tyrePressurePsiInput: number;
  setTyrePressurePsiInput: (v: number) => void;
  tyreNotesInput: string;
  setTyreNotesInput: (v: string) => void;
}

export const FleetModalsPanel: React.FC<FleetModalsPanelProps> = ({
  showAddVehicleModal,
  setShowAddVehicleModal,
  showTripModal,
  setShowTripModal,
  showFuelModal,
  setShowFuelModal,
  showMaintModal,
  setShowMaintModal,
  showDriverModal,
  setShowDriverModal,
  showInspectionModal,
  setShowInspectionModal,
  showBreakdownModal,
  setShowBreakdownModal,
  showIntervalModal,
  setShowIntervalModal,
  showOilModal,
  setShowOilModal,
  showTyreModal,
  setShowTyreModal,
  handleAddVehicleSubmit,
  handleAddTripSubmit,
  handleAddFuelSubmit,
  handleAddMaintSubmit,
  handleAddDriverSubmit,
  handleAddInspectionSubmit,
  handleAddBreakdownSubmit,
  handleScheduleIntervalSubmit,
  handleLogOilChangeSubmit,
  handleLogTyreCheckSubmit,
  vehicles,
  localVehicles,
  plateNumber,
  setPlateNumber,
  vehicleType,
  setVehicleType,
  makeModel,
  setMakeModel,
  driverAssigned,
  setDriverAssigned,
  deploymentBranch,
  setDeploymentBranch,
  selectedVehicleId,
  setSelectedVehicleId,
  tripDriver,
  setTripDriver,
  tripDestination,
  setTripDestination,
  tripPurpose,
  setTripPurpose,
  startMileage,
  setStartMileage,
  fuelLitres,
  setFuelLitres,
  fuelCost,
  setFuelCost,
  stationName,
  setStationName,
  maintType,
  setMaintType,
  maintDesc,
  setMaintDesc,
  workshop,
  setWorkshop,
  driverName,
  setDriverName,
  licenceNo,
  setLicenceNo,
  licenceClass,
  setLicenceClass,
  driverRoleType,
  setDriverRoleType,
  inspectVehicle,
  setInspectVehicle,
  brakesCheck,
  setBrakesCheck,
  tyresCheck,
  setTyresCheck,
  defectsNoted,
  setDefectsNoted,
  breakdownVehicle,
  setBreakdownVehicle,
  breakdownLocation,
  setBreakdownLocation,
  issueType,
  setIssueType,
  breakdownDesc,
  setBreakdownDesc,
  targetVehId,
  setTargetVehId,
  intervalKmInput,
  setIntervalKmInput,
  targetServiceKmInput,
  setTargetServiceKmInput,
  targetWorkshopInput,
  setTargetWorkshopInput,
  targetScopeInput,
  setTargetScopeInput,
  oilChangeKmInput,
  setOilChangeKmInput,
  oilGradeInput,
  setOilGradeInput,
  oilCostUgxInput,
  setOilCostUgxInput,
  tyreTreadMmInput,
  setTyreTreadMmInput,
  tyrePressurePsiInput,
  setTyrePressurePsiInput,
  tyreNotesInput,
  setTyreNotesInput,
}) => {
  return (
    <>
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Register New Fleet Unit</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="text-slate-400 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UBM 331E"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as Vehicle["vehicleType"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Patrol SUV">Patrol SUV</option>
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Armored Escort">Armored Escort</option>
                    <option value="Crew Van">Crew Van</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Make & Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Land Cruiser Prado 4x4"
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Driver</label>
                  <input
                    type="text"
                    placeholder="Officer Name"
                    value={driverAssigned}
                    onChange={(e) => setDriverAssigned(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deployment Branch</label>
                  <input
                    type="text"
                    value={deploymentBranch}
                    onChange={(e) => setDeploymentBranch(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Log Journey Modal */}
      {showTripModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Log New Vehicle Journey</h3>
              <button onClick={() => setShowTripModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddTripSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.makeModel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Officer</label>
                  <input
                    type="text"
                    required
                    value={tripDriver}
                    onChange={(e) => setTripDriver(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={startMileage}
                    onChange={(e) => setStartMileage(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination & Route</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kampala HQ -> Speke Resort"
                  value={tripDestination}
                  onChange={(e) => setTripDestination(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose of Trip</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Patrol shift rotation and cash transfer escort."
                  value={tripPurpose}
                  onChange={(e) => setTripPurpose(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTripModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Authorize & Start Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Fuel Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Issue Fuel Requisition Voucher</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddFuelSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.makeModel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Quantity (Litres)</label>
                  <input
                    type="number"
                    required
                    value={fuelLitres}
                    onChange={(e) => setFuelLitres(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Cost (UGX)</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Partner Station Name</label>
                <input
                  type="text"
                  required
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Issue Fuel Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Schedule Workshop Service Work Order</h3>
              <button onClick={() => setShowMaintModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddMaintSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.makeModel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Type</label>
                <select
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value as MaintenanceServiceLog["serviceType"])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  <option value="Routine Oil & Filter">Routine Oil & Filter</option>
                  <option value="Brake & Suspension">Brake & Suspension</option>
                  <option value="Tyre Replacement">Tyre Replacement</option>
                  <option value="Engine Overhaul">Engine Overhaul</option>
                  <option value="Electrical & Beacon">Electrical & Beacon</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Workshop Partner Name</label>
                <input
                  type="text"
                  required
                  value={workshop}
                  onChange={(e) => setWorkshop(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Description / Scope</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 10,000km routine service and brake pad replacement."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Create Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add New Driver Officer Profile</h3>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Driver Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Peter Wandera"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={driverRoleType}
                    onChange={(e) => setDriverRoleType(e.target.value as NonNullable<DriverRecord["roleType"]>)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Driver">Driver (Car / Van)</option>
                    <option value="Rider">Rider (Motorcycle)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driving Licence Class</label>
                  <select
                    value={licenceClass}
                    onChange={(e) => setLicenceClass(e.target.value as DriverRecord["licenceClass"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Class B & DL (Light/Heavy)">Class B & DL (Light/Heavy)</option>
                    <option value="Class A (Motorcycles)">Class A (Motorcycles)</option>
                    <option value="Class CM (Armored/Heavy)">Class CM (Armored/Heavy)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Licence Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UG-DL-99120"
                  value={licenceNo}
                  onChange={(e) => setLicenceNo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Driver Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Inspection Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Record Daily Vehicle Pre-Shift Inspection</h3>
              <button onClick={() => setShowInspectionModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddInspectionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Inspected Vehicle</label>
                <select
                  value={inspectVehicle}
                  onChange={(e) => setInspectVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.plateNumber}>
                      {v.plateNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brakes Condition</label>
                  <select
                    value={brakesCheck}
                    onChange={(e) => setBrakesCheck(e.target.value as DailyVehicleInspection["brakesCheck"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Defect Noted">Defect Noted</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tyres Condition</label>
                  <select
                    value={tyresCheck}
                    onChange={(e) => setTyresCheck(e.target.value as DailyVehicleInspection["tyresCheck"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Low Pressure">Low Pressure</option>
                    <option value="Worn Out">Worn Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Defects & Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Note any fluid drops, tire wear, beacon issues..."
                  value={defectsNoted}
                  onChange={(e) => setDefectsNoted(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInspectionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Inspection Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Breakdown Modal */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5" />
                Report Fleet Breakdown Emergency
              </h3>
              <button onClick={() => setShowBreakdownModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddBreakdownSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Plate</label>
                <select
                  value={breakdownVehicle}
                  onChange={(e) => setBreakdownVehicle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.plateNumber}>
                      {v.plateNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value as FleetBreakdownEmergency["issueType"])}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value="Engine Breakdown">Engine Breakdown</option>
                    <option value="Puncture / Tyre Burst">Puncture / Tyre Burst</option>
                    <option value="Collision / Accident">Collision / Accident</option>
                    <option value="Battery Failure">Battery Failure</option>
                    <option value="Fuel Exhaustion">Fuel Exhaustion</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jinja Highway KM 22"
                    value={breakdownLocation}
                    onChange={(e) => setBreakdownLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Emergency Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe failure details, safety condition..."
                  value={breakdownDesc}
                  onChange={(e) => setBreakdownDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Dispatch Towing & Emergency Backup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Schedule Mileage Service Interval Modal */}
      {showIntervalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Schedule Mileage Service Interval
              </h3>
              <button onClick={() => setShowIntervalModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleScheduleIntervalSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Vehicle</label>
                <select
                  value={targetVehId}
                  onChange={(e) => {
                    setTargetVehId(e.target.value);
                    const v = localVehicles.find((x) => x.id === e.target.value);
                    if (v) {
                      setIntervalKmInput(v.serviceIntervalKm || 5000);
                      setTargetServiceKmInput(v.nextServiceDueKm);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {localVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.makeModel} ({v.mileageKm.toLocaleString()} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Interval (KM)</label>
                  <select
                    value={intervalKmInput}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setIntervalKmInput(val);
                      const v = localVehicles.find((x) => x.id === targetVehId);
                      if (v) setTargetServiceKmInput(v.mileageKm + val);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  >
                    <option value={3000}>3,000 KM (Motorcycles / Heavy Offroad)</option>
                    <option value={5000}>5,000 KM (Standard SUV Patrol)</option>
                    <option value={7500}>7,500 KM (Tactical Escort)</option>
                    <option value={10000}>10,000 KM (Long-haul Troop Van)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Service Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={targetServiceKmInput}
                    onChange={(e) => setTargetServiceKmInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Workshop Partner</label>
                <input
                  type="text"
                  required
                  value={targetWorkshopInput}
                  onChange={(e) => setTargetWorkshopInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Scope & Checklist Notes</label>
                <textarea
                  rows={2}
                  value={targetScopeInput}
                  onChange={(e) => setTargetScopeInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIntervalModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Service Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Log Oil Change Modal */}
      {showOilModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-600" />
                Log Engine Oil & Filter Service
              </h3>
              <button onClick={() => setShowOilModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleLogOilChangeSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Vehicle</label>
                <select
                  value={targetVehId}
                  onChange={(e) => {
                    setTargetVehId(e.target.value);
                    const v = localVehicles.find((x) => x.id === e.target.value);
                    if (v) setOilChangeKmInput(v.mileageKm);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {localVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.makeModel} ({v.mileageKm.toLocaleString()} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Odometer at Oil Change (KM)</label>
                  <input
                    type="number"
                    required
                    value={oilChangeKmInput}
                    onChange={(e) => setOilChangeKmInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Cost (UGX)</label>
                  <input
                    type="number"
                    required
                    value={oilCostUgxInput}
                    onChange={(e) => setOilCostUgxInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Oil Grade & Filter Specifications</label>
                <input
                  type="text"
                  required
                  value={oilGradeInput}
                  onChange={(e) => setOilGradeInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOilModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Record Oil Change & Reset Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Record Tyre Check Modal */}
      {showTyreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Record Tyre Inspection & Tread Depth
              </h3>
              <button onClick={() => setShowTyreModal(false)} className="text-slate-400 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleLogTyreCheckSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Vehicle</label>
                <select
                  value={targetVehId}
                  onChange={(e) => {
                    setTargetVehId(e.target.value);
                    const v = localVehicles.find((x) => x.id === e.target.value);
                    if (v) setTyreTreadMmInput(v.tyreTreadDepthMm || 6.5);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                >
                  {localVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.makeModel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Average Tread Depth (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tyreTreadMmInput}
                    onChange={(e) => setTyreTreadMmInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">&gt; 5.0mm = Pass, 3-4.9mm = Inspect, &lt; 3.0mm = Replace</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tyre Pressure (PSI)</label>
                  <input
                    type="number"
                    required
                    value={tyrePressurePsiInput}
                    onChange={(e) => setTyrePressurePsiInput(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wheel Alignment & Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={tyreNotesInput}
                  onChange={(e) => setTyreNotesInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTyreModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Save Tyre Inspection Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
