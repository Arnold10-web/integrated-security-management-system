import { useMemo, useState } from "react";
import type { Vehicle, DriverRecord } from "../types";

export interface FleetAlert {
  id: string;
  vehicleId: string;
  plateNumber: string;
  category: "CRITICAL" | "MAINTENANCE" | "LICENCES";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  dueDateOrKm: string;
  actionText: string;
  onAction: () => void;
}

export function useFleetAlerts(
  vehicles: Vehicle[],
  drivers: DriverRecord[]
) {
  const [fleetAlertFilter, setFleetAlertFilter] = useState<"ALL" | "CRITICAL" | "MAINTENANCE" | "LICENCES">("ALL");
  const [dismissedFleetAlertIds, setDismissedFleetAlertIds] = useState<string[]>([]);
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);

  const fleetAlerts = useMemo(() => {
    const today = new Date("2026-07-26");
    const alerts: FleetAlert[] = [];

    vehicles.forEach((v) => {
      if (v.roadLicenceExpiryDate) {
        const licenceDate = new Date(v.roadLicenceExpiryDate);
        const diffDays = Math.ceil((licenceDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          const isExpired = diffDays < 0;
          alerts.push({
            id: `alert-licence-${v.id}`,
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            category: "LICENCES",
            severity: isExpired ? "CRITICAL" : diffDays <= 14 ? "HIGH" : "MEDIUM",
            title: isExpired ? "Road Licence EXPIRED" : "Road Licence Renewal Approaching",
            description: isExpired
              ? `Road licence for ${v.plateNumber} (${v.makeModel}) expired on ${v.roadLicenceExpiryDate}. Immediate renewal required.`
              : `Road licence for ${v.plateNumber} (${v.makeModel}) expires in ${diffDays} day(s) on ${v.roadLicenceExpiryDate}.`,
            dueDateOrKm: `Expiry: ${v.roadLicenceExpiryDate}`,
            actionText: "Filter Vehicle",
            onAction: () => {},
          });
        }
      }

      if (v.insuranceExpiryDate) {
        const insDate = new Date(v.insuranceExpiryDate);
        const diffDays = Math.ceil((insDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          const isExpired = diffDays < 0;
          alerts.push({
            id: `alert-ins-${v.id}`,
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            category: "LICENCES",
            severity: isExpired ? "CRITICAL" : diffDays <= 14 ? "HIGH" : "MEDIUM",
            title: isExpired ? "Insurance Policy EXPIRED" : "Insurance Policy Renewal Approaching",
            description: isExpired
              ? `Insurance coverage for ${v.plateNumber} expired on ${v.insuranceExpiryDate}. Dispatch restricted.`
              : `Insurance policy for ${v.plateNumber} expires in ${diffDays} day(s) on ${v.insuranceExpiryDate}.`,
            dueDateOrKm: `Expiry: ${v.insuranceExpiryDate}`,
            actionText: "Filter Vehicle",
            onAction: () => {},
          });
        }
      }

      if (v.nextServiceDueKm) {
        const kmRemaining = v.nextServiceDueKm - v.mileageKm;
        if (kmRemaining <= 1500) {
          const isOverdue = kmRemaining <= 0;
          alerts.push({
            id: `alert-maint-${v.id}`,
            vehicleId: v.id,
            plateNumber: v.plateNumber,
            category: "MAINTENANCE",
            severity: isOverdue ? "CRITICAL" : "HIGH",
            title: isOverdue ? "Maintenance Milestone EXCEEDED" : "Service Target Approaching",
            description: isOverdue
              ? `Odometer (${v.mileageKm.toLocaleString()} KM) exceeds service limit (${v.nextServiceDueKm.toLocaleString()} KM) by ${Math.abs(kmRemaining).toLocaleString()} KM.`
              : `Odometer (${v.mileageKm.toLocaleString()} KM) is within ${kmRemaining.toLocaleString()} KM of target service interval (${v.nextServiceDueKm.toLocaleString()} KM).`,
            dueDateOrKm: `Target: ${v.nextServiceDueKm.toLocaleString()} KM`,
            actionText: "Schedule Service",
            onAction: () => {},
          });
        }
      }

      if (v.oilStatus === "Overdue" || v.oilStatus === "Due Soon") {
        alerts.push({
          id: `alert-oil-${v.id}`,
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          category: "MAINTENANCE",
          severity: v.oilStatus === "Overdue" ? "CRITICAL" : "MEDIUM",
          title: v.oilStatus === "Overdue" ? "Engine Oil Change OVERDUE" : "Engine Oil Change Due Soon",
          description: `Last oil change at ${v.lastOilChangeKm ? v.lastOilChangeKm.toLocaleString() + ' KM' : 'unrecorded'}. Oil condition flagged as ${v.oilStatus}.`,
          dueDateOrKm: `Oil Status: ${v.oilStatus}`,
          actionText: "Log Oil Change",
          onAction: () => {},
        });
      }

      if (v.tyreStatus === "Replace Required" || v.tyreStatus === "Inspect Soon") {
        alerts.push({
          id: `alert-tyre-${v.id}`,
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          category: "MAINTENANCE",
          severity: v.tyreStatus === "Replace Required" ? "CRITICAL" : "MEDIUM",
          title: v.tyreStatus === "Replace Required" ? "Tyre Tread Depth CRITICAL" : "Tyre Tread Wear Inspection Due",
          description: `Tread depth is ${v.tyreTreadDepthMm ?? 2.0}mm. Safety status: ${v.tyreStatus}.`,
          dueDateOrKm: `Tread: ${v.tyreTreadDepthMm ?? 'N/A'}mm`,
          actionText: "Calibrate Tyres",
          onAction: () => {},
        });
      }

      if (v.conditionRating === "Needs Repair" || v.conditionRating === "Critical") {
        alerts.push({
          id: `alert-cond-${v.id}`,
          vehicleId: v.id,
          plateNumber: v.plateNumber,
          category: "CRITICAL",
          severity: "CRITICAL",
          title: `Vehicle Condition: ${v.conditionRating.toUpperCase()}`,
          description: `Unit ${v.plateNumber} condition is ${v.conditionRating}. Recommended for garage overhaul or replacement.`,
          dueDateOrKm: `Rating: ${v.conditionRating}`,
          actionText: "View Workshop Logs",
          onAction: () => {},
        });
      }
    });

    drivers.forEach((d) => {
      if (d.licenceExpiryDate) {
        const dDate = new Date(d.licenceExpiryDate);
        const diffDays = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 60) {
          const isExpired = diffDays < 0;
          alerts.push({
            id: `alert-driver-${d.id}`,
            vehicleId: d.assignedVehiclePlate || "driver",
            plateNumber: d.assignedVehiclePlate || "NO-PLATE",
            category: "LICENCES",
            severity: isExpired ? "CRITICAL" : "HIGH",
            title: isExpired ? "Driver Permit EXPIRED" : "Driver Permit Renewal Approaching",
            description: `Driver ${d.fullName} (Permit ${d.licenceNumber}) ${isExpired ? 'expired on' : 'expires in ' + diffDays + ' days on'} ${d.licenceExpiryDate}.`,
            dueDateOrKm: `Permit Expiry: ${d.licenceExpiryDate}`,
            actionText: "View Drivers",
            onAction: () => {},
          });
        }
      }
    });

    return alerts.filter((a) => !dismissedFleetAlertIds.includes(a.id));
  }, [vehicles, drivers, dismissedFleetAlertIds]);

  const filteredFleetAlerts = useMemo(() => {
    if (fleetAlertFilter === "ALL") return fleetAlerts;
    return fleetAlerts.filter((a) => a.category === fleetAlertFilter);
  }, [fleetAlerts, fleetAlertFilter]);

  const dismissAlert = (id: string) => {
    setDismissedFleetAlertIds((prev) => [...prev, id]);
  };

  return {
    fleetAlertFilter,
    setFleetAlertFilter,
    isAlertsCollapsed,
    setIsAlertsCollapsed,
    fleetAlerts,
    filteredFleetAlerts,
    dismissAlert,
  };
}
