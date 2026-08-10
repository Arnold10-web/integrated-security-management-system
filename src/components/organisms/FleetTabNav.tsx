import React from "react";
import { Car, Compass, Fuel, Wrench, UserCheck, ClipboardList, AlertOctagon, Navigation, RotateCw } from "lucide-react";

type FleetTab = "register" | "trips" | "fuel" | "maintenance" | "drivers" | "inspections" | "breakdowns" | "gps" | "replacement" | "reports";

interface FleetTabNavProps {
  activeTab: FleetTab;
  onTabChange: (tab: FleetTab) => void;
  vehicleCount: number;
  tripCount: number;
  fuelCount: number;
  maintenanceCount: number;
  driverCount: number;
  inspectionCount: number;
  breakdownCount: number;
}

const tabs: { key: FleetTab; label: string; icon: React.FC<{ className?: string }>; count?: number; danger?: boolean }[] = [
  { key: "register", label: "Fleet Register", icon: Car },
  { key: "trips", label: "Trips & Journeys", icon: Compass },
  { key: "fuel", label: "Fuel Control", icon: Fuel },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "drivers", label: "Drivers", icon: UserCheck },
  { key: "inspections", label: "Daily Inspections", icon: ClipboardList },
  { key: "breakdowns", label: "Breakdowns", icon: AlertOctagon, danger: true },
  { key: "gps", label: "GPS & Security", icon: Navigation },
  { key: "replacement", label: "Replacement Planning", icon: RotateCw },
];

export const FleetTabNav: React.FC<FleetTabNavProps> = ({
  activeTab, onTabChange, vehicleCount, tripCount, fuelCount, maintenanceCount, driverCount, inspectionCount, breakdownCount,
}) => {
  const countMap: Record<string, number> = {
    register: vehicleCount, trips: tripCount, fuel: fuelCount, maintenance: maintenanceCount,
    drivers: driverCount, inspections: inspectionCount, breakdowns: breakdownCount,
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-none">
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const cnt = countMap[tab.key];
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === tab.key
                ? tab.danger ? "bg-rose-600 text-white shadow-md" : "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <IconComp className={`w-4 h-4 ${activeTab !== tab.key && tab.danger ? "text-rose-300" : ""}`} />
            <span>{tab.label}{cnt !== undefined ? ` (${cnt})` : ""}</span>
          </button>
        );
      })}
    </div>
  );
};
