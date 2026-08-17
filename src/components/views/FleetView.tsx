import React, { useState, useMemo } from "react";
import { Car, Plus, FileSpreadsheet } from "lucide-react";
import { FleetMaintenancePanel, FleetDashboardPanel, FleetAlertsPanel } from "../organisms";
import { FleetModalsPanel } from "../organisms/FleetModalsPanel";
import { FleetKpiGrid, FleetTabNav, FleetSearchBar, FleetRegisterTab, FleetTripsTab, FleetFuelTab, FleetDriversTab, FleetInspectionsTab, FleetBreakdownsTab, FleetGpsTab, FleetReplacementTab } from "../organisms";
import { TransportInbox } from "./OperationsWorkspaceView";
import {
  Vehicle, VehicleTripLog, FuelRequisitionLog, MaintenanceServiceLog, DriverRecord,
  DailyVehicleInspection, FleetBreakdownEmergency, UserRole, TransportRequest,
} from "../../types";


type FleetTab = "register" | "trips" | "fuel" | "maintenance" | "drivers" | "inspections" | "breakdowns" | "gps" | "replacement" | "reports" | "requests";

interface FleetViewWithTabProps extends FleetViewProps {
  initialTab?: FleetTab;
}

interface FleetViewProps {
  vehicles: Vehicle[];
  activeRole: UserRole;
  onAddVehicle: (veh: Omit<Vehicle, "id">) => void;
  onUpdateVehicle?: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle?: (id: string) => void;
  onLogFuel?: (vehicleId: string, fuelPct: number) => void;
  tripLogs: VehicleTripLog[];
  fuelLogs: FuelRequisitionLog[];
  maintenanceLogs: MaintenanceServiceLog[];
  drivers: DriverRecord[];
  inspections: DailyVehicleInspection[];
  breakdowns: FleetBreakdownEmergency[];
  onAddTrip: (t: Omit<VehicleTripLog, "id" | "tripCode">) => void;
  onAddFuelLog: (f: Omit<FuelRequisitionLog, "id" | "voucherCode">) => void;
  onAddMaintenanceLog: (m: Omit<MaintenanceServiceLog, "id" | "serviceCode">) => void;
  onAddDriver: (d: Omit<DriverRecord, "id" | "driverCode">) => void;
  onUpdateDriver?: (id: string, updates: Partial<DriverRecord>) => void;
  onApproveDriver: (id: string) => void;
  onAddInspection: (i: Omit<DailyVehicleInspection, "id" | "inspectionCode">) => void;
  onAddBreakdown: (b: Omit<FleetBreakdownEmergency, "id" | "incidentCode">) => void;
  transportRequests?: TransportRequest[];
  onActTransportRequest?: (id: string, data: { action: "Approved" | "Declined"; assignedVehicleId?: string; assignedVehicle?: string; assignedDriverId?: string; assignedDriver?: string; assignedRiderId?: string; assignedRider?: string; declinedReason?: string }) => void;
}

export const FleetView: React.FC<FleetViewWithTabProps> = ({
  vehicles, activeRole, onAddVehicle,
  onUpdateVehicle: _onUpdateVehicle,
  onDeleteVehicle: _onDeleteVehicle,
  onLogFuel = (_v: string, _f: number) => {},
  tripLogs, fuelLogs, maintenanceLogs, drivers, inspections, breakdowns,
  onAddTrip, onAddFuelLog, onAddMaintenanceLog, onAddDriver,
  onUpdateDriver: _onUpdateDriver, onApproveDriver, onAddInspection, onAddBreakdown,
  transportRequests = [], onActTransportRequest,
  initialTab,
}) => {
  const canEditVehicles = activeRole === "Fleet Manager";
  const canLogFleet = canEditVehicles;
  const [activeTab, setActiveTab] = useState<FleetTab>(initialTab ?? "register");
  React.useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState("");
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(vehicles);

  React.useEffect(() => { setLocalVehicles(vehicles); }, [vehicles]);

  const [fleetAlertFilter, setFleetAlertFilter] = useState<"ALL" | "CRITICAL" | "MAINTENANCE" | "LICENCES">("ALL");
  const [dismissedFleetAlertIds, setDismissedFleetAlertIds] = useState<string[]>([]);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState<boolean>(false);

  const fleetAlerts = useMemo(() => {
    const today = new Date("2026-07-26");
    const alerts: Array<{ id: string; vehicleId: string; plateNumber: string; category: "CRITICAL" | "MAINTENANCE" | "LICENCES"; severity: "CRITICAL" | "HIGH" | "MEDIUM"; title: string; description: string; dueDateOrKm: string; actionText: string; onAction: () => void }> = [];
    localVehicles.forEach((v) => {
      if (v.roadLicenceExpiryDate) { const d = new Date(v.roadLicenceExpiryDate); const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24)); if (diff <= 60) { const exp = diff < 0; alerts.push({ id: `alert-licence-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "LICENCES", severity: exp ? "CRITICAL" : diff <= 14 ? "HIGH" : "MEDIUM", title: exp ? "Road Licence EXPIRED" : "Road Licence Renewal Approaching", description: exp ? `Road licence for ${v.plateNumber} (${v.makeModel}) expired on ${v.roadLicenceExpiryDate}. Immediate renewal required.` : `Road licence for ${v.plateNumber} (${v.makeModel}) expires in ${diff} day(s) on ${v.roadLicenceExpiryDate}.`, dueDateOrKm: `Expiry: ${v.roadLicenceExpiryDate}`, actionText: "Filter Vehicle", onAction: () => { setActiveTab("register"); setSearchTerm(v.plateNumber); } }); } }
      if (v.insuranceExpiryDate) { const d = new Date(v.insuranceExpiryDate); const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 3600 * 24)); if (diff <= 60) { const exp = diff < 0; alerts.push({ id: `alert-ins-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "LICENCES", severity: exp ? "CRITICAL" : diff <= 14 ? "HIGH" : "MEDIUM", title: exp ? "Insurance Policy EXPIRED" : "Insurance Policy Renewal Approaching", description: exp ? `Insurance coverage for ${v.plateNumber} expired on ${v.insuranceExpiryDate}. Dispatch restricted.` : `Insurance policy for ${v.plateNumber} expires in ${diff} day(s) on ${v.insuranceExpiryDate}.`, dueDateOrKm: `Expiry: ${v.insuranceExpiryDate}`, actionText: "Filter Vehicle", onAction: () => { setActiveTab("register"); setSearchTerm(v.plateNumber); } }); } }
      if (v.nextServiceDueKm) { const kmRemaining = v.nextServiceDueKm - v.mileageKm; if (kmRemaining <= 1500) { const overdue = kmRemaining <= 0; alerts.push({ id: `alert-maint-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "MAINTENANCE", severity: overdue ? "CRITICAL" : "HIGH", title: overdue ? "Maintenance Milestone EXCEEDED" : "Service Target Approaching", description: overdue ? `Odometer (${v.mileageKm.toLocaleString()} KM) exceeds service limit (${v.nextServiceDueKm.toLocaleString()} KM) by ${Math.abs(kmRemaining).toLocaleString()} KM.` : `Odometer (${v.mileageKm.toLocaleString()} KM) is within ${kmRemaining.toLocaleString()} KM of target service interval (${v.nextServiceDueKm.toLocaleString()} KM).`, dueDateOrKm: `Target: ${v.nextServiceDueKm.toLocaleString()} KM`, actionText: "Schedule Service", onAction: () => { setTargetVehId(v.id); setShowIntervalModal(true); } }); } }
      if (v.oilStatus === "Overdue" || v.oilStatus === "Due Soon") { alerts.push({ id: `alert-oil-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "MAINTENANCE", severity: v.oilStatus === "Overdue" ? "CRITICAL" : "MEDIUM", title: v.oilStatus === "Overdue" ? "Engine Oil Change OVERDUE" : "Engine Oil Change Due Soon", description: `Last oil change at ${v.lastOilChangeKm ? v.lastOilChangeKm.toLocaleString() + ' KM' : 'unrecorded'}. Oil condition flagged as ${v.oilStatus}.`, dueDateOrKm: `Oil Status: ${v.oilStatus}`, actionText: "Log Oil Change", onAction: () => { setTargetVehId(v.id); setShowOilModal(true); } }); }
      if (v.tyreStatus === "Replace Required" || v.tyreStatus === "Inspect Soon") { alerts.push({ id: `alert-tyre-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "MAINTENANCE", severity: v.tyreStatus === "Replace Required" ? "CRITICAL" : "MEDIUM", title: v.tyreStatus === "Replace Required" ? "Tyre Tread Depth CRITICAL" : "Tyre Tread Wear Inspection Due", description: `Tread depth is ${v.tyreTreadDepthMm ?? 2.0}mm. Safety status: ${v.tyreStatus}.`, dueDateOrKm: `Tread: ${v.tyreTreadDepthMm ?? 'N/A'}mm`, actionText: "Calibrate Tyres", onAction: () => { setTargetVehId(v.id); setShowTyreModal(true); } }); }
      if (v.conditionRating === "Needs Repair" || v.conditionRating === "Critical") { alerts.push({ id: `alert-cond-${v.id}`, vehicleId: v.id, plateNumber: v.plateNumber, category: "CRITICAL", severity: "CRITICAL", title: `Vehicle Condition: ${v.conditionRating.toUpperCase()}`, description: `Unit ${v.plateNumber} condition is ${v.conditionRating}. Recommended for garage overhaul or replacement.`, dueDateOrKm: `Rating: ${v.conditionRating}`, actionText: "View Workshop Logs", onAction: () => { setActiveTab("maintenance"); } }); }
    });
    drivers.forEach((d) => {
      if (d.licenceExpiryDate) { const dDate = new Date(d.licenceExpiryDate); const diff = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24)); if (diff <= 60) { const exp = diff < 0; alerts.push({ id: `alert-driver-${d.id}`, vehicleId: d.assignedVehiclePlate || "driver", plateNumber: d.assignedVehiclePlate || "NO-PLATE", category: "LICENCES", severity: exp ? "CRITICAL" : "HIGH", title: exp ? "Driver Permit EXPIRED" : "Driver Permit Renewal Approaching", description: `Driver ${d.fullName} (Permit ${d.licenceNumber}) ${exp ? 'expired on' : 'expires in ' + diff + ' days on'} ${d.licenceExpiryDate}.`, dueDateOrKm: `Permit Expiry: ${d.licenceExpiryDate}`, actionText: "View Drivers", onAction: () => { setActiveTab("drivers"); } }); } }
    });
    return alerts.filter((a) => !dismissedFleetAlertIds.includes(a.id));
  }, [localVehicles, drivers, dismissedFleetAlertIds]);

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
  const [intervalKmInput, setIntervalKmInput] = useState<number>(5000);
  const [targetServiceKmInput, setTargetServiceKmInput] = useState<number>(70000);
  const [targetWorkshopInput, setTargetWorkshopInput] = useState<string>("Speke Motors Central Workshop");
  const [targetScopeInput, setTargetScopeInput] = useState<string>("Routine 5,000 KM Preventive Maintenance");
  const [oilChangeKmInput, setOilChangeKmInput] = useState<number>(64200);
  const [oilGradeInput, setOilGradeInput] = useState<string>("15W-40 Heavy Duty Synthetic Engine Oil");
  const [oilCostUgxInput, setOilCostUgxInput] = useState<number>(350000);
  const [tyreTreadMmInput, setTyreTreadMmInput] = useState<number>(6.5);
  const [tyrePressurePsiInput, setTyrePressurePsiInput] = useState<number>(35);
  const [tyreNotesInput, setTyreNotesInput] = useState<string>("All 4 tyres balanced, rotated, and pressure calibrated.");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<Vehicle["vehicleType"]>("Patrol SUV");
  const [makeModel, setMakeModel] = useState("");
  const [driverAssigned, setDriverAssigned] = useState("");
  const [chassisNumber] = useState("");
  const [insuranceExpiry] = useState("2027-01-31");
  const [licenceExpiry] = useState("2026-12-31");
  const [deploymentBranch, setDeploymentBranch] = useState("Central Operations Depot");
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || "");
  const [tripDriver, setTripDriver] = useState(drivers[0]?.fullName || "");
  const [tripDestination, setTripDestination] = useState("");
  const [tripPurpose, setTripPurpose] = useState("");
  const [startMileage, setStartMileage] = useState(50000);
  const [authorizedBy] = useState("Operations Manager");
  const [fuelDriver] = useState(drivers[0]?.fullName || "");
  const [fuelLitres, setFuelLitres] = useState(50);
  const [fuelCost, setFuelCost] = useState(250000);
  const [stationName, setStationName] = useState("Shell Uganda");
  const [maintType, setMaintType] = useState<MaintenanceServiceLog["serviceType"]>("Routine Oil & Filter");
  const [maintDesc, setMaintDesc] = useState("");
  const [workshop, setWorkshop] = useState("Speke Motors Central Workshop");
  const [maintCost] = useState(750000);
  const [driverName, setDriverName] = useState("");
  const [licenceNo, setLicenceNo] = useState("");
  const [licenceClass, setLicenceClass] = useState<DriverRecord["licenceClass"]>("Class B & DL (Light/Heavy)");
  const [driverRoleType, setDriverRoleType] = useState<NonNullable<DriverRecord["roleType"]>>("Driver");
  const [assignedPlate] = useState(vehicles[0]?.plateNumber || "UBJ 441A");
  const [inspectVehicle, setInspectVehicle] = useState(vehicles[0]?.plateNumber || "UBJ 441A");
  const [brakesCheck, setBrakesCheck] = useState<DailyVehicleInspection["brakesCheck"]>("Pass");
  const [tyresCheck, setTyresCheck] = useState<DailyVehicleInspection["tyresCheck"]>("Pass");
  const [lightsCheck] = useState<DailyVehicleInspection["lightsSirensCheck"]>("Pass");
  const [oilCheck] = useState<DailyVehicleInspection["oilLevelCheck"]>("Pass");
  const [defectsNoted, setDefectsNoted] = useState("");
  const [breakdownVehicle, setBreakdownVehicle] = useState(vehicles[0]?.plateNumber || "UBJ 441A");
  const [breakdownDriver] = useState(drivers[0]?.fullName || "David Kateregga");
  const [breakdownLocation, setBreakdownLocation] = useState("");
  const [issueType, setIssueType] = useState<FleetBreakdownEmergency["issueType"]>("Engine Breakdown");
  const [breakdownDesc, setBreakdownDesc] = useState("");

  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !makeModel) return;
    onAddVehicle({
      plateNumber, vehicleType, makeModel, driverAssigned: driverAssigned || "Unassigned Patrol Officer",
      fuelLevelPercentage: 100, mileageKm: 15000, status: "Operational" as const,
      lastServiceDate: new Date().toISOString().split("T")[0], nextServiceDueKm: 20000,
      chassisNumber: chassisNumber || "CHASSIS-UG-" + Math.floor(100000 + Math.random() * 900000),
      insuranceExpiryDate: insuranceExpiry, roadLicenceExpiryDate: licenceExpiry,
      deploymentBranch, conditionRating: "Good" as const, replacementStatus: "Active Fleet" as const,
      gpsTrackerId: "GPS-UG-" + Math.floor(1000 + Math.random() * 9000), lifetimeMaintenanceCost: 0,
    });
    setShowAddVehicleModal(false); setPlateNumber(""); setMakeModel("");
  };

  const handleAddTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    onAddTrip({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      driverName: tripDriver,
      destination: tripDestination || "Kampala Industrial Post",
      purpose: tripPurpose || "Patrol Shift Rotation & Perimeter Check",
      startMileageKm: Number(startMileage),
      departureTime: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "In Transit" as const,
      authorizedBy,
    });
    setShowTripModal(false); setTripDestination(""); setTripPurpose("");
  };

  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    onAddFuelLog({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      driverName: fuelDriver,
      fuelLitres: Number(fuelLitres),
      costUgx: Number(fuelCost),
      mileageAtRefillKm: veh?.mileageKm || 60000,
      fuelType: (veh?.vehicleType === "Motorcycle" ? "Petrol" : "Diesel") as "Diesel" | "Petrol",
      stationName,
      refillDate: new Date().toISOString().split("T")[0],
      approvedBy: "Fleet Manager",
      reconciled: false,
    });
    onLogFuel(veh?.id || "veh-1", 100); setShowFuelModal(false);
  };

  const handleAddMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
    onAddMaintenanceLog({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      serviceType: maintType,
      description: maintDesc || "Scheduled mileage maintenance and brake overhaul.",
      mileageAtServiceKm: veh?.mileageKm || 65000,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: "2026-11-01",
      costUgx: Number(maintCost),
      workshopName: workshop,
      status: "Scheduled" as const,
    });
    setShowMaintModal(false); setMaintDesc("");
  };

  const handleScheduleIntervalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vId = targetVehId || localVehicles[0]?.id;
    const veh = localVehicles.find((v) => v.id === vId) || localVehicles[0];
    setLocalVehicles((prev) => prev.map((v) => v.id === vId ? { ...v, serviceIntervalKm: Number(intervalKmInput), nextServiceDueKm: Number(targetServiceKmInput), status: "Operational" as const } : v));
    onAddMaintenanceLog({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      serviceType: "Routine Oil & Filter" as const,
      description: `Preventive Maintenance Interval Scheduled: Every ${Number(intervalKmInput).toLocaleString()} KM (Target Odometer: ${Number(targetServiceKmInput).toLocaleString()} KM). Scope: ${targetScopeInput}`,
      mileageAtServiceKm: veh?.mileageKm || 64200,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: "2026-11-15",
      costUgx: 450000,
      workshopName: targetWorkshopInput,
      status: "Scheduled" as const,
    });
    setShowIntervalModal(false);
  };

  const handleLogOilChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vId = targetVehId || localVehicles[0]?.id;
    const veh = localVehicles.find((v) => v.id === vId) || localVehicles[0];
    const nextOilKm = Number(oilChangeKmInput) + (veh?.serviceIntervalKm || 5000);
    setLocalVehicles((prev) => prev.map((v) => v.id === vId ? { ...v, lastOilChangeKm: Number(oilChangeKmInput), lastOilChangeDate: new Date().toISOString().split("T")[0], oilStatus: "Good" as const, nextServiceDueKm: nextOilKm } : v));
    onAddMaintenanceLog({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      serviceType: "Routine Oil & Filter" as const,
      description: `Engine Oil & Filter Changed at ${Number(oilChangeKmInput).toLocaleString()} KM. Grade: ${oilGradeInput}. Next service target: ${nextOilKm.toLocaleString()} KM.`,
      mileageAtServiceKm: Number(oilChangeKmInput),
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      costUgx: Number(oilCostUgxInput),
      workshopName: targetWorkshopInput,
      status: "Completed" as const,
    });
    setShowOilModal(false);
  };

  const handleLogTyreCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vId = targetVehId || localVehicles[0]?.id;
    const veh = localVehicles.find((v) => v.id === vId) || localVehicles[0];
    const treadMm = Number(tyreTreadMmInput);
    const st: "Pass" | "Inspect Soon" | "Replace Required" = treadMm >= 5.0 ? "Pass" : treadMm >= 3.0 ? "Inspect Soon" : "Replace Required";
    setLocalVehicles((prev) => prev.map((v) => v.id === vId ? { ...v, lastTyreCheckDate: new Date().toISOString().split("T")[0], tyreTreadDepthMm: treadMm, tyreStatus: st } : v));
    onAddMaintenanceLog({
      vehicleId: veh?.id || "veh-1",
      plateNumber: veh?.plateNumber || "UBJ 441A",
      serviceType: "Tyre Replacement" as const,
      description: `Tyre Tread & Alignment Audit: Average Tread Depth ${treadMm}mm (${st}). Inflation Pressure: ${tyrePressurePsiInput} PSI. ${tyreNotesInput}`,
      mileageAtServiceKm: veh?.mileageKm || 64200,
      serviceDate: new Date().toISOString().split("T")[0],
      nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      costUgx: st === "Replace Required" ? 1800000 : 150000,
      workshopName: "Speke Tyre & Alignment Center",
      status: "Completed" as const,
    });
    setShowTyreModal(false);
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName) return;
    onAddDriver({
      fullName: driverName,
      roleType: driverRoleType,
      licenceNumber: licenceNo || "UG-DL-882109",
      licenceClass,
      licenceExpiryDate: "2028-06-30",
      assignedVehiclePlate: assignedPlate,
      dutyShift: "Day Shift Patrol",
      safetyScorePct: 100,
      totalTripsCompleted: 0,
      trainingBadges: ["Defensive Driving Certified"],
      status: "Pending FM Approval" as const,
    });
    setShowDriverModal(false); setDriverName(""); setLicenceNo(""); setDriverRoleType("Driver");
  };

  const handleAddInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.plateNumber === inspectVehicle) || vehicles[0];
    onAddInspection({
      vehicleId: veh?.id || "veh-1",
      plateNumber: inspectVehicle,
      inspectorDriver: veh?.driverAssigned || "Patrol Officer",
      inspectionDate: new Date().toISOString().split("T")[0],
      inspectionTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      brakesCheck,
      tyresCheck,
      lightsSirensCheck: lightsCheck,
      oilLevelCheck: oilCheck,
      coolantCheck: "Pass" as const,
      batteryCheck: "Pass" as const,
      overallCondition: brakesCheck === "Pass" && tyresCheck === "Pass" ? "Pass - Safe for Duty" : "Requires Attention",
      defectsNoted: defectsNoted || "All morning checks completed prior to patrol launch.",
    });
    setShowInspectionModal(false); setDefectsNoted("");
  };

  const handleAddBreakdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.plateNumber === breakdownVehicle) || vehicles[0];
    onAddBreakdown({
      vehicleId: veh?.id || "veh-1",
      plateNumber: breakdownVehicle,
      driverName: breakdownDriver,
      location: breakdownLocation || "Highway Checkpoint Post 4",
      issueType,
      description: breakdownDesc || "Engine warning light accompanied by power loss.",
      reportedTime: new Date().toISOString().replace("T", " ").substring(0, 16),
      recoveryAssigned: "Central Towing & Recovery Depot",
      backupVehicleDispatched: "UBJ 441A (Patrol SUV)",
      status: "Active Emergency" as const,
    });
    setShowBreakdownModal(false); setBreakdownDesc(""); setBreakdownLocation("");
  };

  const exportFleetCSV = (dataset: string) => {
    let headers: string[] = []; let rows: (string | number)[][] = [];
    if (dataset === "register") { headers = ["Plate Number", "Type", "Make & Model", "Assigned Driver", "Status", "Mileage (KM)", "Fuel %", "Chassis No", "Branch", "Insurance Expiry"]; rows = vehicles.map((v) => [v.plateNumber, v.vehicleType, `"${v.makeModel}"`, `"${v.driverAssigned}"`, v.status, v.mileageKm, v.fuelLevelPercentage, v.chassisNumber || "N/A", `"${v.deploymentBranch || "HQ"}"`, v.insuranceExpiryDate || "N/A"]); }
    else if (dataset === "trips") { headers = ["Trip Code", "Plate", "Driver", "Destination", "Purpose", "Start KM", "End KM", "Status", "Authorized By"]; rows = tripLogs.map((t) => [t.tripCode, t.plateNumber, `"${t.driverName}"`, `"${t.destination}"`, `"${t.purpose}"`, t.startMileageKm, t.endMileageKm || "In Transit", t.status, `"${t.authorizedBy}"`]); }
    else if (dataset === "fuel") { headers = ["Voucher Code", "Plate", "Driver", "Litres", "Cost UGX", "Station", "Refill Date", "Reconciled"]; rows = fuelLogs.map((f) => [f.voucherCode, f.plateNumber, `"${f.driverName}"`, f.fuelLitres, f.costUgx, `"${f.stationName}"`, f.refillDate, f.reconciled ? "YES" : "NO"]); }
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `Fleet_${dataset.toUpperCase()}_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const totalVehicles = vehicles.length;
  const operationalVehicles = vehicles.filter((v) => v.status === "Operational").length;
  const inServiceVehicles = vehicles.filter((v) => v.status === "In Service" || v.status === "Grounded").length;
  const totalFuelUgx = fuelLogs.reduce((acc, curr) => acc + curr.costUgx, 0);

  const fleet30DayData = useMemo(() => {
    const data = []; const baseDate = new Date("2026-07-26");
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate); d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const seed = ((i * 17) % 31) + 1;
      const fuelLitres = isWeekend ? 108 + (seed % 14) : 142 + (seed % 42);
      const distanceKm = isWeekend ? 890 + (seed * 11) : 1230 + (seed * 21);
      data.push({ date: dateStr, fuelLitres, distanceKm, efficiencyKmL: Number((distanceKm / fuelLitres).toFixed(2)), fuelCostUgx: fuelLitres * 5000, costPerKm: Math.round((fuelLitres * 5000) / distanceKm) });
    }
    return data;
  }, []);

  const total30DayFuel = useMemo(() => fleet30DayData.reduce((acc, curr) => acc + curr.fuelLitres, 0), [fleet30DayData]);
  const total30DayDistance = useMemo(() => fleet30DayData.reduce((acc, curr) => acc + curr.distanceKm, 0), [fleet30DayData]);
  const avg30DayEfficiency = useMemo(() => (total30DayDistance / total30DayFuel).toFixed(2), [total30DayDistance, total30DayFuel]);
  const total30DayCost = useMemo(() => fleet30DayData.reduce((acc, curr) => acc + curr.fuelCostUgx, 0), [fleet30DayData]);
  const avgCostPerKm = useMemo(() => Math.round(total30DayCost / total30DayDistance), [total30DayCost, total30DayDistance]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-600 text-white shadow-md"><Car className="w-8 h-8" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Fleet Management</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">Fleet Operating Center</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Comprehensive control for patrol SUVs, motorcycles, armored bullion escorts, fuel requisitions, journey sheets, and preventive maintenance.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => exportFleetCSV(activeTab === "trips" ? "trips" : activeTab === "fuel" ? "fuel" : "register")}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
            <FileSpreadsheet className="w-4 h-4" /><span>Export Fleet Register CSV</span>
          </button>
          {canEditVehicles && (
            <button onClick={() => setShowAddVehicleModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /><span>Register Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {!initialTab && <FleetKpiGrid totalVehicles={totalVehicles} operationalVehicles={operationalVehicles} totalFuelUgx={totalFuelUgx} fuelLogsLength={fuelLogs.length} inServiceVehicles={inServiceVehicles} maintenanceLogsLength={maintenanceLogs.length} />}

      {!initialTab && <FleetDashboardPanel totalVehicles={totalVehicles} operationalVehicles={operationalVehicles} inServiceVehicles={inServiceVehicles} totalFuelUgx={totalFuelUgx} fuelLogsLength={fuelLogs.length} maintenanceLogsLength={maintenanceLogs.length} fleet30DayData={fleet30DayData} total30DayFuel={total30DayFuel} total30DayDistance={total30DayDistance} avg30DayEfficiency={avg30DayEfficiency} total30DayCost={total30DayCost} avgCostPerKm={avgCostPerKm} />}

      {!initialTab && <FleetAlertsPanel alerts={fleetAlerts} filter={fleetAlertFilter} onFilterChange={setFleetAlertFilter} collapsed={isAlertsCollapsed} onToggleCollapse={() => setIsAlertsCollapsed(!isAlertsCollapsed)} onDismiss={(id) => setDismissedFleetAlertIds((prev) => [...prev, id])} />}

      {!initialTab && activeRole === "Fleet Manager" && onActTransportRequest && (
        <TransportInbox pending={transportRequests.filter((t) => t.status === "Pending Fleet")} vehicles={vehicles} drivers={drivers} onAct={onActTransportRequest} />
      )}

      {initialTab && <FleetSearchBar activeTab={activeTab} searchTerm={searchTerm} onSearchChange={setSearchTerm}
        canAdd={(["trips", "fuel", "maintenance"].includes(activeTab) ? canLogFleet : canEditVehicles)}
        onAddClick={() => {
        if (activeTab === "trips") setShowTripModal(true);
        else if (activeTab === "fuel") setShowFuelModal(true);
        else if (activeTab === "maintenance") setShowMaintModal(true);
        else if (activeTab === "drivers") setShowDriverModal(true);
        else if (activeTab === "inspections") setShowInspectionModal(true);
        else if (activeTab === "breakdowns") setShowBreakdownModal(true);
      }} />}

      {initialTab && activeTab === "register" && <FleetRegisterTab vehicles={vehicles} searchTerm={searchTerm} onLogFuel={canEditVehicles ? onLogFuel : undefined} onUpdateVehicle={canEditVehicles ? _onUpdateVehicle : undefined} onDeleteVehicle={canEditVehicles ? _onDeleteVehicle : undefined} />}
      {initialTab && activeTab === "trips" && <FleetTripsTab tripLogs={tripLogs} />}
      {initialTab && activeTab === "fuel" && <FleetFuelTab fuelLogs={fuelLogs} />}
      {initialTab && activeTab === "maintenance" && (
        <FleetMaintenancePanel vehicles={localVehicles} maintenanceLogs={maintenanceLogs} searchTerm={searchTerm} canManage={canLogFleet}
          onScheduleInterval={(vid) => { setTargetVehId(vid); setShowIntervalModal(true); }}
          onLogOilChange={(vid, km) => { setTargetVehId(vid); if (km > 0) setOilChangeKmInput(km); setShowOilModal(true); }}
          onRecordTyreCheck={(vid, td) => { setTargetVehId(vid); if (td > 0) setTyreTreadMmInput(td); setShowTyreModal(true); }}
          onNewWorkOrder={(vid) => { if (vid) setSelectedVehicleId(vid); setShowMaintModal(true); }}
          onAdjustSchedule={(vid, ikm, tkm) => { setTargetVehId(vid); setIntervalKmInput(ikm); setTargetServiceKmInput(tkm); setShowIntervalModal(true); }} />
      )}
      {initialTab && activeTab === "requests" && (
        <div className="space-y-4">
          {activeRole === "Fleet Manager" && onActTransportRequest ? (
            <TransportInbox pending={transportRequests.filter((t) => t.status === "Pending Fleet")} vehicles={vehicles} drivers={drivers} onAct={onActTransportRequest} />
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-sm text-slate-500">No transport requests — Fleet Manager inbox is available to Fleet Manager only.</div>
          )}
          {transportRequests.filter((t) => t.status !== "Pending Fleet").length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-700 mb-3">Recent Decisions</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {transportRequests.filter((t) => t.status !== "Pending Fleet").slice(0, 20).map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div><p className="text-xs font-bold text-slate-700">{t.requestCode} · {t.destination} · {t.status}</p><p className="text-[11px] text-slate-500">{t.requestedByName} · {t.purpose} {t.assignedVehicle ? `→ ${t.assignedVehicle}` : ""}{t.assignedDriver ? ` · ${t.assignedDriver}` : ""}{t.assignedRider ? ` · ${t.assignedRider}` : ""}{t.declinedReason ? ` · Declined: ${t.declinedReason}` : ""}</p></div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${t.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {initialTab && activeTab === "drivers" && <FleetDriversTab drivers={drivers} activeRole={activeRole} onApproveDriver={onApproveDriver} />}
      {initialTab && activeTab === "inspections" && <FleetInspectionsTab dailyInspections={inspections} />}
      {initialTab && activeTab === "breakdowns" && <FleetBreakdownsTab breakdowns={breakdowns} />}
      {initialTab && activeTab === "gps" && <FleetGpsTab vehicles={vehicles} />}
      {initialTab && activeTab === "replacement" && <FleetReplacementTab vehicles={vehicles} />}

      <FleetModalsPanel showAddVehicleModal={showAddVehicleModal} setShowAddVehicleModal={setShowAddVehicleModal} showTripModal={showTripModal} setShowTripModal={setShowTripModal} showFuelModal={showFuelModal} setShowFuelModal={setShowFuelModal} showMaintModal={showMaintModal} setShowMaintModal={setShowMaintModal} showDriverModal={showDriverModal} setShowDriverModal={setShowDriverModal} showInspectionModal={showInspectionModal} setShowInspectionModal={setShowInspectionModal} showBreakdownModal={showBreakdownModal} setShowBreakdownModal={setShowBreakdownModal} showIntervalModal={showIntervalModal} setShowIntervalModal={setShowIntervalModal} showOilModal={showOilModal} setShowOilModal={setShowOilModal} showTyreModal={showTyreModal} setShowTyreModal={setShowTyreModal} handleAddVehicleSubmit={handleAddVehicleSubmit} handleAddTripSubmit={handleAddTripSubmit} handleAddFuelSubmit={handleAddFuelSubmit} handleAddMaintSubmit={handleAddMaintSubmit} handleAddDriverSubmit={handleAddDriverSubmit} handleAddInspectionSubmit={handleAddInspectionSubmit} handleAddBreakdownSubmit={handleAddBreakdownSubmit} handleScheduleIntervalSubmit={handleScheduleIntervalSubmit} handleLogOilChangeSubmit={handleLogOilChangeSubmit} handleLogTyreCheckSubmit={handleLogTyreCheckSubmit} vehicles={vehicles} localVehicles={localVehicles} plateNumber={plateNumber} setPlateNumber={setPlateNumber} vehicleType={vehicleType} setVehicleType={setVehicleType} makeModel={makeModel} setMakeModel={setMakeModel} driverAssigned={driverAssigned} setDriverAssigned={setDriverAssigned} deploymentBranch={deploymentBranch} setDeploymentBranch={setDeploymentBranch} selectedVehicleId={selectedVehicleId} setSelectedVehicleId={setSelectedVehicleId} tripDriver={tripDriver} setTripDriver={setTripDriver} tripDestination={tripDestination} setTripDestination={setTripDestination} tripPurpose={tripPurpose} setTripPurpose={setTripPurpose} startMileage={startMileage} setStartMileage={setStartMileage} fuelLitres={fuelLitres} setFuelLitres={setFuelLitres} fuelCost={fuelCost} setFuelCost={setFuelCost} stationName={stationName} setStationName={setStationName} maintType={maintType} setMaintType={setMaintType} maintDesc={maintDesc} setMaintDesc={setMaintDesc} workshop={workshop} setWorkshop={setWorkshop} driverName={driverName} setDriverName={setDriverName} licenceNo={licenceNo} setLicenceNo={setLicenceNo} licenceClass={licenceClass} setLicenceClass={setLicenceClass} driverRoleType={driverRoleType} setDriverRoleType={setDriverRoleType} inspectVehicle={inspectVehicle} setInspectVehicle={setInspectVehicle} brakesCheck={brakesCheck} setBrakesCheck={setBrakesCheck} tyresCheck={tyresCheck} setTyresCheck={setTyresCheck} defectsNoted={defectsNoted} setDefectsNoted={setDefectsNoted} breakdownVehicle={breakdownVehicle} setBreakdownVehicle={setBreakdownVehicle} breakdownLocation={breakdownLocation} setBreakdownLocation={setBreakdownLocation} issueType={issueType} setIssueType={setIssueType} breakdownDesc={breakdownDesc} setBreakdownDesc={setBreakdownDesc} targetVehId={targetVehId} setTargetVehId={setTargetVehId} intervalKmInput={intervalKmInput} setIntervalKmInput={setIntervalKmInput} targetServiceKmInput={targetServiceKmInput} setTargetServiceKmInput={setTargetServiceKmInput} targetWorkshopInput={targetWorkshopInput} setTargetWorkshopInput={setTargetWorkshopInput} targetScopeInput={targetScopeInput} setTargetScopeInput={setTargetScopeInput} oilChangeKmInput={oilChangeKmInput} setOilChangeKmInput={setOilChangeKmInput} oilGradeInput={oilGradeInput} setOilGradeInput={setOilGradeInput} oilCostUgxInput={oilCostUgxInput} setOilCostUgxInput={setOilCostUgxInput} tyreTreadMmInput={tyreTreadMmInput} setTyreTreadMmInput={setTyreTreadMmInput} tyrePressurePsiInput={tyrePressurePsiInput} setTyrePressurePsiInput={setTyrePressurePsiInput} tyreNotesInput={tyreNotesInput} setTyreNotesInput={setTyreNotesInput} />
    </div>
  );
};
