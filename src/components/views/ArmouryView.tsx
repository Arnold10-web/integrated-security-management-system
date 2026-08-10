import React, { useState, useMemo } from "react";
import { ShieldAlert, Plus, ArrowRightLeft, FileSpreadsheet } from "lucide-react";
import { ArmouryItem, ArmouryLog, Guard, UserRole } from "../../types";
import { IssueWeaponModal, ReturnWeaponModal, AddArmouryItemModal, ArmouryAlertsPanel, ArmouryDispatchTable, ArmouryVaultTable } from "../organisms";

interface ArmouryViewProps {
  items: ArmouryItem[];
  logs: ArmouryLog[];
  guards: Guard[];
  activeRole: UserRole;
  onIssueItem: (
    assetId: string,
    guardId: string,
    locationName: string,
    ammoRoundsOut: number,
    dateOut: string,
    timeOut: string,
    signOutConfirmed: boolean,
    armourerInCharge: string,
    notes: string
  ) => void;
  onReturnItem: (
    logId: string,
    ammoRoundsIn: number,
    dateIn: string,
    timeIn: string,
    signInConfirmed: boolean,
    substituteReceiver?: string,
    notes?: string
  ) => void;
  onAddItem: (newItem: Omit<ArmouryItem, "id">) => void;
}

export const ArmouryView: React.FC<ArmouryViewProps> = ({
  items,
  logs,
  guards,
  activeRole,
  onIssueItem,
  onReturnItem,
  onAddItem,
}) => {
  const isArmorer = activeRole === "Armorer";
  void activeRole;
  const [searchTerm, setSearchTerm] = useState("");
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedLogToReturn, setSelectedLogToReturn] = useState<ArmouryLog | null>(null);
  // Automated Armoury Notification & Return Warning Engine
  const [armouryAlertFilter, setArmouryAlertFilter] = useState<"ALL" | "OVERDUE_RETURNS" | "MAINTENANCE" | "RESERVES">("ALL");
  const [dismissedArmouryAlertIds, setDismissedArmouryAlertIds] = useState<string[]>([]);
  const [isArmouryAlertsCollapsed, setIsArmouryAlertsCollapsed] = useState<boolean>(false);

  const armouryAlerts = useMemo(() => {
    const today = new Date("2026-07-26");
    const alerts: Array<{
      id: string;
      category: "OVERDUE_RETURNS" | "MAINTENANCE" | "RESERVES";
      severity: "CRITICAL" | "HIGH" | "MEDIUM";
      title: string;
      description: string;
      badgeText: string;
      actionText: string;
      onAction: () => void;
    }> = [];

    // 1. Scan checked out logs for overdue firearm return deadlines or shift handovers
    logs.forEach((log) => {
      if (log.status === "Checked Out") {
        const outDate = new Date(log.dateOut);
        const diffDays = Math.floor((today.getTime() - outDate.getTime()) / (1000 * 3600 * 24));
        const isOverdue = diffDays >= 1 || log.dateOut < "2026-07-26";

        alerts.push({
          id: `alert-log-overdue-${log.id}`,
          category: "OVERDUE_RETURNS",
          severity: isOverdue ? "CRITICAL" : "HIGH",
          title: isOverdue ? "FIREARM RETURN OVERDUE (Past 12-Hour Shift Deadline)" : "Shift End Asset Return Approaching",
          description: `Firearm/Gear ${log.assetName} (${log.firearmSerialNumber}) issued to Guard ${log.guardName} at ${log.locationName} on ${log.dateOut} ${log.timeOut} has not been returned to the vault.`,
          badgeText: isOverdue ? `Overdue (${diffDays > 0 ? diffDays + ' Days' : 'Past Shift'})` : "Active Deployment",
          actionText: "Process Return Now",
          onAction: () => handleOpenReturnModal(log),
        });
      }
    });

    // 2. Scan armoury items for maintenance and service requirements
    items.forEach((item) => {
      if (item.condition === "Requires Service" || item.location === "Armoury Maintenance") {
        alerts.push({
          id: `alert-maint-item-${item.id}`,
          category: "MAINTENANCE",
          severity: "HIGH",
          title: `Armoury Asset Firing & Pin Maintenance Due`,
          description: `${item.name} (S/N: ${item.serialNumber}, Tag: ${item.assetTag}) marked as "${item.condition}". Armorer firing pin calibration & chamber clearing required.`,
          badgeText: `Condition: ${item.condition}`,
          actionText: "Search Asset",
          onAction: () => {
            setSearchTerm(item.serialNumber || item.assetTag);
          },
        });
      }

      // 3. Vault reserves & ammunition thresholds
      if (item.category === "Ammunition" && item.availableQuantity < item.totalQuantity * 0.25) {
        alerts.push({
          id: `alert-ammo-reserve-${item.id}`,
          category: "RESERVES",
          severity: "HIGH",
          title: `Low Ammunition Vault Reserve Alert`,
          description: `${item.name} available stock down to ${item.availableQuantity} rounds (Below 25% vault minimum threshold of ${item.totalQuantity} total rounds).`,
          badgeText: `${item.availableQuantity} Rounds Remaining`,
          actionText: "Inspect Reserve",
          onAction: () => {
            setSelectedCategory("Ammunition");
            setSearchTerm(item.name);
          },
        });
      } else if (item.availableQuantity === 0 && item.totalQuantity > 0) {
        alerts.push({
          id: `alert-stock-empty-${item.id}`,
          category: "RESERVES",
          severity: "MEDIUM",
          title: `Zero Available Vault Reserve (${item.assetTag})`,
          description: `All ${item.totalQuantity} units of ${item.name} are currently issued out on guard deployments.`,
          badgeText: "0 Available in Vault",
          actionText: "Filter Asset",
          onAction: () => {
            setSearchTerm(item.assetTag);
          },
        });
      }
    });

    return alerts.filter((a) => !dismissedArmouryAlertIds.includes(a.id));
  }, [logs, items, dismissedArmouryAlertIds]);

  const filteredArmouryAlerts = useMemo(() => {
    if (armouryAlertFilter === "ALL") return armouryAlerts;
    return armouryAlerts.filter((a) => a.category === armouryAlertFilter);
  }, [armouryAlerts, armouryAlertFilter]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredLogs = logs.filter((log) => {
    const term = logSearchTerm.toLowerCase();
    return (
      log.guardName.toLowerCase().includes(term) ||
      log.firearmSerialNumber.toLowerCase().includes(term) ||
      log.locationName.toLowerCase().includes(term) ||
      log.serialNumberLog.toLowerCase().includes(term) ||
      log.armourerInCharge.toLowerCase().includes(term)
    );
  });

  const handleOpenReturnModal = (log: ArmouryLog) => {
    setSelectedLogToReturn(log);
    setShowReturnModal(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "SL No",
      "Date Out",
      "Time Out",
      "Guard Name",
      "Location Name",
      "Asset Name",
      "Firearm Serial No",
      "Rounds Out",
      "Guard Sign Out",
      "Armourer In-Charge",
      "Date In",
      "Time In",
      "Rounds In",
      "Guard Sign In",
      "Substitute Receiver / Notes",
    ];

    const rows = logs.map((log, index) => [
      index + 1,
      log.dateOut,
      log.timeOut,
      `"${log.guardName}"`,
      `"${log.locationName}"`,
      `"${log.assetName}"`,
      `"${log.serialNumberLog}"`,
      log.ammoRoundsOut,
      log.signOutConfirmed ? "CONFIRMED" : "PENDING",
      `"${log.armourerInCharge}"`,
      log.dateIn || "STILL OUT",
      log.timeIn || "STILL OUT",
      log.ammoRoundsIn ?? "N/A",
      log.signInConfirmed ? "CONFIRMED" : "PENDING",
      `"${(log.substituteReceiver || log.notes || "None").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Armoury_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 text-amber-400 border border-slate-800 shadow-md">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900">Armoury Dispatch & Return Register</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                  ARMOURER REGISTER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Serialized Firearm Register • Guard Sign-out/Sign-in Logs • Ammunition Ledger • Armourer In-Charge Audits
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Register CSV</span>
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className={`px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${isArmorer ? "" : "hidden"}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Issue Weapon (Check Out)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className={`px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${isArmorer ? "" : "hidden"}`}
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset</span>
          </button>
        </div>
      </div>

      <ArmouryAlertsPanel
        alerts={armouryAlerts}
        filteredAlerts={filteredArmouryAlerts}
        filter={armouryAlertFilter}
        onFilterChange={setArmouryAlertFilter}
        dismissedAlertIds={dismissedArmouryAlertIds}
        onDismissAlert={(id) => setDismissedArmouryAlertIds((prev) => [...prev, id])}
        isCollapsed={isArmouryAlertsCollapsed}
        onToggleCollapse={() => setIsArmouryAlertsCollapsed(!isArmouryAlertsCollapsed)}
        canAct={isArmorer}
      />

      <ArmouryDispatchTable
        logs={filteredLogs}
        logSearchTerm={logSearchTerm}
        onSearchChange={setLogSearchTerm}
        canCheckIn={isArmorer}
        onOpenReturn={handleOpenReturnModal}
      />
      <ArmouryVaultTable
        items={items}
        filteredItems={filteredItems}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <IssueWeaponModal
        show={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        items={items}
        guards={guards}
        onIssueItem={onIssueItem}
      />
      <ReturnWeaponModal
        show={showReturnModal}
        log={selectedLogToReturn}
        onClose={() => setShowReturnModal(false)}
        onReturnItem={onReturnItem}
      />
      <AddArmouryItemModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItem={onAddItem}
      />
    </div>
  );
};
