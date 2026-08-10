import { useState } from "react";
import type {
  VehicleTripLog,
  FuelRequisitionLog,
  MaintenanceServiceLog,
  DriverRecord,
  DailyVehicleInspection,
  FleetBreakdownEmergency,
} from "../types";

export function useFleetSubsystems() {
  const [tripLogs, setTripLogs] = useState<VehicleTripLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelRequisitionLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceServiceLog[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [dailyInspections, setDailyInspections] = useState<DailyVehicleInspection[]>([]);
  const [breakdowns, setBreakdowns] = useState<FleetBreakdownEmergency[]>([]);

  return {
    tripLogs, setTripLogs,
    fuelLogs, setFuelLogs,
    maintenanceLogs, setMaintenanceLogs,
    drivers, setDrivers,
    dailyInspections, setDailyInspections,
    breakdowns, setBreakdowns,
  };
}
