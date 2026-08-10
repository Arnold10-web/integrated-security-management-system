import { useState } from "react";
import type {
  Vehicle,
  VehicleTripLog,
  FuelRequisitionLog,
  MaintenanceServiceLog,
  DriverRecord,
  DailyVehicleInspection,
  FleetBreakdownEmergency,
} from "../types";

export function useFleetForms(
  vehicles: Vehicle[],
  drivers: DriverRecord[],
  onAddVehicle: (v: Omit<Vehicle, "id">) => void,
  onLogFuel: (vehicleId: string, fuelPct: number) => void,
  setTripLogs: React.Dispatch<React.SetStateAction<VehicleTripLog[]>>,
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelRequisitionLog[]>>,
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceServiceLog[]>>,
  setDrivers: React.Dispatch<React.SetStateAction<DriverRecord[]>>,
  setDailyInspections: React.Dispatch<React.SetStateAction<DailyVehicleInspection[]>>,
  setBreakdowns: React.Dispatch<React.SetStateAction<FleetBreakdownEmergency[]>>,
  initialMaintenanceLogs: MaintenanceServiceLog[],
) {
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [showOilModal, setShowOilModal] = useState(false);
  const [showTyreModal, setShowTyreModal] = useState(false);
  const [targetVehId, setTargetVehId] = useState<string>(vehicles[0]?.id || "veh-1");

  // Preventive Maintenance Forms
  const [intervalKmInput, setIntervalKmInput] = useState(5000);
  const [targetServiceKmInput, setTargetServiceKmInput] = useState(70000);
  const [targetWorkshopInput, setTargetWorkshopInput] = useState("Speke Motors Central Workshop");
  const [targetScopeInput, setTargetScopeInput] = useState("Routine 5,000 KM Preventive Maintenance");
  const [oilChangeKmInput, setOilChangeKmInput] = useState(64200);
  const [oilGradeInput, setOilGradeInput] = useState("15W-40 Heavy Duty Synthetic Engine Oil");
  const [oilCostUgxInput, setOilCostUgxInput] = useState(350000);
  const [tyreTreadMmInput, setTyreTreadMmInput] = useState(6.5);
  const [tyrePressurePsiInput, setTyrePressurePsiInput] = useState(35);
  const [tyreNotesInput, setTyreNotesInput] = useState("All 4 tyres balanced, rotated, and pressure calibrated.");

  // Add Vehicle Form
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<Vehicle["vehicleType"]>("Patrol SUV");
  const [makeModel, setMakeModel] = useState("");
  const [driverAssigned, setDriverAssigned] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("2027-01-31");
  const [licenceExpiry, setLicenceExpiry] = useState("2026-12-31");
  const [deploymentBranch, setDeploymentBranch] = useState("Central Operations Depot");

  // Trip Form
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [tripDriver, setTripDriver] = useState(drivers[0]?.fullName || "");
  const [tripDestination, setTripDestination] = useState("");
  const [tripPurpose, setTripPurpose] = useState("");
  const [startMileage, setStartMileage] = useState(50000);
  const [authorizedBy, setAuthorizedBy] = useState("Operations Manager");

  // Fuel Form
  const [fuelDriver, setFuelDriver] = useState(drivers[0]?.fullName || "");
  const [fuelLitres, setFuelLitres] = useState(50);
  const [fuelCost, setFuelCost] = useState(250000);
  const [stationName, setStationName] = useState("Shell Uganda");

  // Maintenance Form
  const [maintType, setMaintType] = useState<MaintenanceServiceLog["serviceType"]>("Routine Oil & Filter");
  const [maintDesc, setMaintDesc] = useState("");
  const [workshop, setWorkshop] = useState("Speke Motors Central Workshop");
  const [maintCost, setMaintCost] = useState(750000);

  // Driver Form
  const [driverName, setDriverName] = useState("");
  const [licenceNo, setLicenceNo] = useState("");
  const [licenceClass, setLicenceClass] = useState<DriverRecord["licenceClass"]>("Class B & DL (Light/Heavy)");
  const [assignedPlate, setAssignedPlate] = useState(vehicles[0]?.plateNumber || "UBJ 441A");

  // Inspection Form
  const [inspectVehicle, setInspectVehicle] = useState(vehicles[0]?.plateNumber || "UBJ 441A");
  const [brakesCheck, setBrakesCheck] = useState<DailyVehicleInspection["brakesCheck"]>("Pass");
  const [tyresCheck, setTyresCheck] = useState<DailyVehicleInspection["tyresCheck"]>("Pass");
  const [lightsCheck, setLightsCheck] = useState<DailyVehicleInspection["lightsSirensCheck"]>("Pass");
  const [oilCheck, setOilCheck] = useState<DailyVehicleInspection["oilLevelCheck"]>("Pass");
  const [defectsNoted, setDefectsNoted] = useState("");

  // Breakdown Form
  const [breakdownVehicle, setBreakdownVehicle] = useState(vehicles[0]?.plateNumber || "UBJ 441A");
  const [breakdownDriver, setBreakdownDriver] = useState(drivers[0]?.fullName || "David Kateregga");
  const [breakdownLocation, setBreakdownLocation] = useState("");
  const [issueType, setIssueType] = useState<FleetBreakdownEmergency["issueType"]>("Engine Breakdown");
  const [breakdownDesc, setBreakdownDesc] = useState("");
  const [, setLocalTripLogs] = useState<VehicleTripLog[]>([]);
  const [, setLocalFuelLogs] = useState<FuelRequisitionLog[]>([]);
  const [, setLocalMaintenanceLogs] = useState<MaintenanceServiceLog[]>(initialMaintenanceLogs);

  const [, setLocalDrivers] = useState<DriverRecord[]>([]);
  const [, setLocalInspections] = useState<DailyVehicleInspection[]>([]);
  const [, setLocalBreakdowns] = useState<FleetBreakdownEmergency[]>([]);

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !makeModel) return;
    onAddVehicle({
      plateNumber,
      vehicleType,
      makeModel,
      driverAssigned: driverAssigned || "Unassigned Patrol Officer",
      fuelLevelPercentage: 100,
      mileageKm: 15000,
      status: "Operational",
      lastServiceDate: new Date().toISOString().split("T")[0],
      nextServiceDueKm: 20000,
      chassisNumber: chassisNumber || "CHASSIS-UG-" + Math.floor(100000 + Math.random() * 900000),
      insuranceExpiryDate: insuranceExpiry,
      roadLicenceExpiryDate: licenceExpiry,
      deploymentBranch: deploymentBranch,
      conditionRating: "Good",
      replacementStatus: "Active Fleet",
      gpsTrackerId: "GPS-UG-" + Math.floor(1000 + Math.random() * 9000),
      lifetimeMaintenanceCost: 0,
    });
    setShowAddVehicleModal(false);
    setPlateNumber("");
    setMakeModel("");
  };

  const handleAddTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    const newTrip: VehicleTripLog = {
      id: `TRP-${Date.now()}`,
      tripCode: `TRP-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      driverName: tripDriver,
      destination: tripDestination || "Kampala Industrial Post",
      purpose: tripPurpose || "Patrol Shift Rotation & Perimeter Check",
      startMileageKm: Number(startMileage),
      departureTime: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "In Transit",
      authorizedBy,
    };
    setLocalTripLogs((prev) => [newTrip, ...prev]);
    setTripLogs((prev) => [newTrip, ...prev]);
    setShowTripModal(false);
    setTripDestination("");
    setTripPurpose("");
  };

  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    const newFuel: FuelRequisitionLog = {
      id: `FUL-${Date.now()}`,
      voucherCode: `FVR-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      driverName: fuelDriver,
      fuelLitres: Number(fuelLitres),
      costUgx: Number(fuelCost),
      mileageAtRefillKm: veh?.mileageKm || 60000,
      fuelType: veh?.vehicleType === "Motorcycle" ? "Petrol" : "Diesel",
      stationName,
      refillDate: new Date().toISOString().split("T")[0],
      approvedBy: "Fleet Manager",
      reconciled: false,
    };
    setLocalFuelLogs((prev) => [newFuel, ...prev]);
    setFuelLogs((prev) => [newFuel, ...prev]);
    onLogFuel(veh?.id || "veh-1", 100);
    setShowFuelModal(false);
  };

  const handleAddMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    const newMaint: MaintenanceServiceLog = {
      id: `MNT-${Date.now()}`,
      serviceCode: `WO-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      serviceType: maintType,
      description: maintDesc || "Scheduled mileage maintenance and brake overhaul.",
      mileageAtServiceKm: veh?.mileageKm || 65000,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: "2026-11-01",
      costUgx: Number(maintCost),
      workshopName: workshop,
      status: "Scheduled",
    };
    setLocalMaintenanceLogs((prev) => [newMaint, ...prev]);
    setMaintenanceLogs((prev) => [newMaint, ...prev]);
    setShowMaintModal(false);
    setMaintDesc("");
  };

  const handleScheduleIntervalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: MaintenanceServiceLog = {
      id: `MNT-${Date.now()}`,
      serviceCode: `SCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: targetVehId || vehicles[0]?.id || "veh-1",
      plateNumber: vehicles.find((v) => v.id === targetVehId)?.plateNumber || "UBJ 441A",
      serviceType: "Routine Oil & Filter",
      description: `Preventive Maintenance Interval Scheduled: Every ${intervalKmInput.toLocaleString()} KM (Target Odometer: ${targetServiceKmInput.toLocaleString()} KM). Scope: ${targetScopeInput}`,
      mileageAtServiceKm: vehicles.find((v) => v.id === targetVehId)?.mileageKm || 64200,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: "2026-11-15",
      costUgx: 450000,
      workshopName: targetWorkshopInput,
      status: "Scheduled",
    };
    setLocalMaintenanceLogs((prev) => [newLog, ...prev]);
    setMaintenanceLogs((prev) => [newLog, ...prev]);
    setShowIntervalModal(false);
  };

  const handleLogOilChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextOilKm = Number(oilChangeKmInput) + 5000;
    const newLog: MaintenanceServiceLog = {
      id: `MNT-${Date.now()}`,
      serviceCode: `OIL-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: targetVehId || vehicles[0]?.id || "veh-1",
      plateNumber: vehicles.find((v) => v.id === targetVehId)?.plateNumber || "UBJ 441A",
      serviceType: "Routine Oil & Filter",
      description: `Engine Oil & Filter Changed at ${oilChangeKmInput.toLocaleString()} KM. Grade: ${oilGradeInput}. Next service target: ${nextOilKm.toLocaleString()} KM.`,
      mileageAtServiceKm: Number(oilChangeKmInput),
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      costUgx: Number(oilCostUgxInput),
      workshopName: targetWorkshopInput,
      status: "Completed",
    };
    setLocalMaintenanceLogs((prev) => [newLog, ...prev]);
    setMaintenanceLogs((prev) => [newLog, ...prev]);
    setShowOilModal(false);
  };

  const handleLogTyreCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const treadMm = Number(tyreTreadMmInput);
    const status: "Pass" | "Inspect Soon" | "Replace Required" =
      treadMm >= 5.0 ? "Pass" : treadMm >= 3.0 ? "Inspect Soon" : "Replace Required";
    const newLog: MaintenanceServiceLog = {
      id: `MNT-${Date.now()}`,
      serviceCode: `TYR-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: targetVehId || vehicles[0]?.id || "veh-1",
      plateNumber: vehicles.find((v) => v.id === targetVehId)?.plateNumber || "UBJ 441A",
      serviceType: "Tyre Replacement",
      description: `Tyre Tread & Alignment Audit: Average Tread Depth ${treadMm}mm (${status}). Inflation Pressure: ${tyrePressurePsiInput} PSI. ${tyreNotesInput}`,
      mileageAtServiceKm: vehicles.find((v) => v.id === targetVehId)?.mileageKm || 64200,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      costUgx: status === "Replace Required" ? 1800000 : 150000,
      workshopName: "Speke Tyre & Alignment Center",
      status: "Completed",
    };
    setLocalMaintenanceLogs((prev) => [newLog, ...prev]);
    setMaintenanceLogs((prev) => [newLog, ...prev]);
    setShowTyreModal(false);
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDriver: DriverRecord = {
      id: `drv-${Date.now()}`,
      driverCode: `DRV-2026-${Math.floor(100 + Math.random() * 900)}`,
      fullName: driverName,
      licenceNumber: licenceNo,
      licenceClass,
      licenceExpiryDate: "2027-06-30",
      assignedVehiclePlate: assignedPlate,
      dutyShift: "Day Shift Patrol",
      safetyScorePct: 85,
      totalTripsCompleted: 0,
      trainingBadges: ["Defensive Driving Certified"],
      status: "Active Duty",
    };
    setLocalDrivers((prev) => [newDriver, ...prev]);
    setDrivers((prev) => [newDriver, ...prev]);
    setShowDriverModal(false);
    setDriverName("");
    setLicenceNo("");
  };

  const handleAddInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.plateNumber === inspectVehicle);
    const newInsp: DailyVehicleInspection = {
      id: `dvi-${Date.now()}`,
      inspectionCode: `DVI-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: veh?.id || "veh-1",
      plateNumber: inspectVehicle,
      inspectorDriver: "Fleet Inspector",
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectionTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      brakesCheck,
      tyresCheck,
      lightsSirensCheck: lightsCheck,
      oilLevelCheck: oilCheck,
      coolantCheck: "Pass",
      batteryCheck: "Pass",
      overallCondition: defectsNoted ? "Requires Attention" : "Pass - Safe for Duty",
      defectsNoted: defectsNoted || "No defects reported.",
    };
    setLocalInspections((prev) => [newInsp, ...prev]);
    setDailyInspections((prev) => [newInsp, ...prev]);
    setShowInspectionModal(false);
    setDefectsNoted("");
  };

  const handleAddBreakdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBkdn: FleetBreakdownEmergency = {
      id: `bdn-${Date.now()}`,
      incidentCode: `BDE-2026-${Math.floor(100 + Math.random() * 900)}`,
      vehicleId: vehicles.find((v) => v.plateNumber === breakdownVehicle)?.id || "veh-1",
      plateNumber: breakdownVehicle,
      driverName: breakdownDriver,
      location: breakdownLocation || "Kampala Northern Bypass",
      issueType,
      description: breakdownDesc || "Vehicle reported mechanical fault en route.",
      reportedTime: new Date().toISOString().replace("T", " ").substring(0, 16),
      recoveryAssigned: "Towing Dispatch - Speke Motors Recovery",
      status: "Active Emergency",
    };
    setLocalBreakdowns((prev) => [newBkdn, ...prev]);
    setBreakdowns((prev) => [newBkdn, ...prev]);
    setShowBreakdownModal(false);
    setBreakdownDesc("");
  };

  return {
    showAddVehicleModal, setShowAddVehicleModal,
    showTripModal, setShowTripModal,
    showFuelModal, setShowFuelModal,
    showMaintModal, setShowMaintModal,
    showDriverModal, setShowDriverModal,
    showInspectionModal, setShowInspectionModal,
    showBreakdownModal, setShowBreakdownModal,
    showIntervalModal, setShowIntervalModal,
    showOilModal, setShowOilModal,
    showTyreModal, setShowTyreModal,
    targetVehId, setTargetVehId,
    intervalKmInput, setIntervalKmInput,
    targetServiceKmInput, setTargetServiceKmInput,
    targetWorkshopInput, setTargetWorkshopInput,
    targetScopeInput, setTargetScopeInput,
    oilChangeKmInput, setOilChangeKmInput,
    oilGradeInput, setOilGradeInput,
    oilCostUgxInput, setOilCostUgxInput,
    tyreTreadMmInput, setTyreTreadMmInput,
    tyrePressurePsiInput, setTyrePressurePsiInput,
    tyreNotesInput, setTyreNotesInput,
    plateNumber, setPlateNumber,
    vehicleType, setVehicleType,
    makeModel, setMakeModel,
    driverAssigned, setDriverAssigned,
    chassisNumber, setChassisNumber,
    insuranceExpiry, setInsuranceExpiry,
    licenceExpiry, setLicenceExpiry,
    deploymentBranch, setDeploymentBranch,
    selectedVehicleId, setSelectedVehicleId,
    tripDriver, setTripDriver,
    tripDestination, setTripDestination,
    tripPurpose, setTripPurpose,
    startMileage, setStartMileage,
    authorizedBy, setAuthorizedBy,
    fuelDriver, setFuelDriver,
    fuelLitres, setFuelLitres,
    fuelCost, setFuelCost,
    stationName, setStationName,
    maintType, setMaintType,
    maintDesc, setMaintDesc,
    workshop, setWorkshop,
    maintCost, setMaintCost,
    driverName, setDriverName,
    licenceNo, setLicenceNo,
    licenceClass, setLicenceClass,
    assignedPlate, setAssignedPlate,
    inspectVehicle, setInspectVehicle,
    brakesCheck, setBrakesCheck,
    tyresCheck, setTyresCheck,
    lightsCheck, setLightsCheck,
    oilCheck, setOilCheck,
    defectsNoted, setDefectsNoted,
    breakdownVehicle, setBreakdownVehicle,
    breakdownDriver, setBreakdownDriver,
    breakdownLocation, setBreakdownLocation,
    issueType, setIssueType,
    breakdownDesc, setBreakdownDesc,
    handleAddVehicleSubmit,
    handleAddTripSubmit,
    handleAddFuelSubmit,
    handleAddMaintSubmit,
    handleScheduleIntervalSubmit,
    handleLogOilChangeSubmit,
    handleLogTyreCheckSubmit,
    handleAddDriverSubmit,
    handleAddInspectionSubmit,
    handleAddBreakdownSubmit,
  };
}
