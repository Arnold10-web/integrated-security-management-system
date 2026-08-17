import React from "react";
import {
  Truck, Users, ScrollText, CreditCard, FolderOpen, ClipboardCheck,
  CircleAlert, Car, Wrench, FileText,
} from "lucide-react";
import { useDomainStore } from "../../stores/domainStore";
import { useAuthStore } from "../../stores/authStore";
import { getEffectiveRole } from "../../services/rbacService";
import type { TransportRequest, Vehicle, DriverRecord, UserRole } from "../../types";
import { TransportInbox } from "./OperationsWorkspaceView";

const KPI: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; tone: string }> = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60">
    <div className={`inline-flex p-2 rounded-xl ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
  </div>
);

/* ─────────────── Fleet Manager Workspace ─────────────── */

interface FleetManagerWorkspaceViewProps {
  pendingTransport: TransportRequest[];
  vehicles: Vehicle[];
  drivers: DriverRecord[];
  onAct: (id: string, data: { action: "Approved" | "Declined"; assignedVehicleId?: string; assignedVehicle?: string; assignedDriverId?: string; assignedDriver?: string; assignedRiderId?: string; assignedRider?: string; declinedReason?: string }) => void;
  onApproveDriver: (id: string) => void;
}

export const FleetManagerWorkspaceView: React.FC<FleetManagerWorkspaceViewProps> = ({
  pendingTransport, vehicles, drivers, onAct, onApproveDriver,
}) => {
  const operational = vehicles.filter((v) => v.status === "Operational").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active Duty").length;
  const pendingDrivers = drivers.filter((d) => d.status === "Pending FM Approval");
  const fueling = vehicles.filter((v) => v.status === "Fueling Needed").length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-cyan-900 text-cyan-300">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-black uppercase border border-cyan-800">
              Fleet Manager Workspace
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">Fleet Command</h1>
            <p className="text-xs text-slate-400 font-medium">
              Transport requests awaiting grant, driver approvals, and fleet readiness at a glance.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPI icon={Car} label="Operational Vehicles" value={operational} tone="bg-emerald-100 text-emerald-700" />
          <KPI icon={Users} label="Active Drivers/Riders" value={activeDrivers} tone="bg-sky-100 text-sky-700" />
          <KPI icon={ClipboardCheck} label="Pending Transport" value={pendingTransport.length} tone="bg-amber-100 text-amber-700" />
          <KPI icon={CircleAlert} label="Fueling Needed" value={fueling} tone="bg-rose-100 text-rose-700" />
          <KPI icon={Users} label="Driver Approvals" value={pendingDrivers.length} tone="bg-violet-100 text-violet-700" />
        </div>
      </div>

      <TransportInbox pending={pendingTransport} vehicles={vehicles} drivers={drivers} onAct={onAct} />

      {pendingDrivers.length > 0 && (
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Driver / Rider Approval Queue</h2>
          </div>
          <div className="space-y-2">
            {pendingDrivers.map((d) => (
              <div key={d.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-slate-800">
                    {d.fullName} <span className="text-slate-400 font-bold">· {d.forceNumber ?? d.driverCode}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {d.roleType ?? "Driver"} · {d.licenceClass} (exp {d.licenceExpiryDate}) · assigned {d.assignedVehiclePlate}
                  </p>
                </div>
                <button
                  onClick={() => onApproveDriver(d.id)}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

/* ─────────────── Records Officer Workspace ─────────────── */

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

interface ExpiryAlertItem {
  id: string;
  kind: "Guard ID" | "Staff ID" | "Contract";
  name: string;
  reference: string;
  expiresOn: string;
  daysLeft: number;
}

export const RecordsOfficerWorkspace: React.FC = () => {
  const domain = useDomainStore();
  const staff = useAuthStore((s) => s.users);
  const activeRole = getEffectiveRole(useAuthStore((s) => s.currentUser)) as UserRole | null;
  const pendingIds = domain.guards.filter((g) => g.idCardStatus === "Pending Records Issuance" || g.idCardStatus === "Reissue Required" || !g.idCardStatus).length;
  const openInquiries = domain.contractInquiries.filter((c) => c.status === "Pending").length;
  const contracts = domain.contracts.filter((c) => c.contractType === "Client Contract" && c.status === "Active").length;

  const expiryAlerts: ExpiryAlertItem[] = [
    ...domain.guards
      .filter((g) => g.idCardStatus === "Issued & Active")
      .map((g) => {
        const daysLeft = daysUntil(g.idCardExpiryDate);
        return daysLeft !== null && daysLeft <= 90
          ? { id: g.id, kind: "Guard ID" as const, name: g.fullName, reference: g.forceNumber, expiresOn: g.idCardExpiryDate!, daysLeft }
          : null;
      }),
    ...staff
      .filter((u) => u.idCardStatus === "Issued & Active")
      .map((u) => {
        const daysLeft = daysUntil(u.idCardExpiryDate);
        return daysLeft !== null && daysLeft <= 90
          ? { id: u.id, kind: "Staff ID" as const, name: u.name, reference: u.forceNumber ?? "—", expiresOn: u.idCardExpiryDate!, daysLeft }
          : null;
      }),
    ...domain.contracts
      .filter((c) => c.status === "Active" || c.status === "Expiring Soon")
      .map((c) => {
        const daysLeft = daysUntil(c.endDate);
        return daysLeft !== null && daysLeft <= 90
          ? { id: c.id, kind: "Contract" as const, name: c.title, reference: c.contractCode, expiresOn: c.endDate, daysLeft }
          : null;
      }),
  ]
    .filter((i): i is ExpiryAlertItem => i !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-cyan-900 text-cyan-300">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-black uppercase border border-cyan-800">
            Records Officer Workspace
          </span>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">Personnel & Contract Records</h1>
          <p className="text-xs text-slate-400 font-medium">
            Every member of staff and guard is identified by a unique force number; every client contract is retrievable via inquiry.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={Users} label="Personnel (Guards)" value={domain.guards.length} tone="bg-sky-100 text-sky-700" />
        <KPI icon={Users} label="Staff Accounts" value={staff.filter((u) => u.status === "Active").length} tone="bg-indigo-100 text-indigo-700" />
        <KPI icon={CreditCard} label="Pending ID Issuance" value={pendingIds} tone="bg-amber-100 text-amber-700" />
        <KPI icon={FolderOpen} label="Open Inquiries" value={openInquiries} tone="bg-rose-100 text-rose-700" />
        <KPI icon={FileText} label="Active Contracts" value={contracts} tone="bg-emerald-100 text-emerald-700" />
      </div>

      {expiryAlerts.length > 0 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CircleAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Expiring Within 90 Days — {expiryAlerts.length} item{expiryAlerts.length === 1 ? "" : "s"} (IDs & contracts)
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {expiryAlerts.map((a) => (
              <div key={`${a.kind}-${a.id}`} className="bg-slate-800/80 border border-amber-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    a.kind === "Contract" ? "bg-emerald-900/70 text-emerald-300" : "bg-cyan-900/70 text-cyan-300"
                  }`}>
                    {a.kind}
                  </span>
                  <span className={`text-[11px] font-black ${a.daysLeft <= 30 ? "text-rose-400" : "text-amber-400"}`}>
                    {a.daysLeft} day{a.daysLeft === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs font-black text-white mt-2 leading-tight">{a.name}</p>
                <p className="text-[10px] text-slate-400 font-mono font-semibold mt-0.5">{a.reference}</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">Expires {a.expiresOn}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeRole === "Records Officer" && (
        <p className="mt-3 text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
          <ScrollText className="w-3.5 h-3.5 text-cyan-400" />
          You own the contract inquiry inbox and ID issuance queue below.
        </p>
      )}
    </div>
  );
};

/* ─────────────── Investigations Workspace ─────────────── */

export const InvestigationsWorkspace: React.FC = () => {
  const domain = useDomainStore();
  const openIncidents = domain.incidents.filter((i) => i.status === "Open" || i.status === "Under Investigation");
  const activeCharges = domain.disciplinaryActions.filter((d) => d.status !== "Finalized");
  const referred = domain.complaints.filter((c) => c.referredForInvestigation || c.status === "Referred");
  const resolved = domain.incidents.filter((i) => i.status === "Resolved").length;

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-cyan-900 text-cyan-300">
          <ScrollText className="w-6 h-6" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-300 text-[10px] font-black uppercase border border-cyan-800">
            Investigations Workspace
          </span>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">Case Board</h1>
          <p className="text-xs text-slate-400 font-medium">
            Operations collaborates by adding evidence and escalating; only the Investigations Officer finalizes.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={FileText} label="Open Incidents" value={openIncidents.length} tone="bg-rose-100 text-rose-700" />
        <KPI icon={ScrollText} label="Active Charge Sheets" value={activeCharges.length} tone="bg-amber-100 text-amber-700" />
        <KPI icon={ClipboardCheck} label="Referred Complaints" value={referred.length} tone="bg-violet-100 text-violet-700" />
        <KPI icon={Wrench} label="Resolved" value={resolved} tone="bg-emerald-100 text-emerald-700" />
      </div>
    </div>
  );
};

/* ─────────────── Notification banner (role-targeted summary) ─────────────── */

export const NotificationsBanner: React.FC<{ notifications: Array<{ id: string; title: string; message: string; type: string; read: boolean }> }> = ({ notifications }) => {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return null;
  return (
    <section className="bg-amber-50 rounded-3xl p-4 border border-amber-200">
      <div className="flex items-center gap-2 mb-2">
        <CircleAlert className="w-4 h-4 text-amber-600" />
        <h2 className="text-xs font-black text-amber-800 uppercase tracking-wide">Inbox — {unread.length} unread</h2>
      </div>
      <div className="space-y-1.5">
        {unread.slice(0, 4).map((n) => (
          <p key={n.id} className="text-[11px] text-amber-900 font-medium leading-snug">
            <span className="font-black uppercase text-[10px]">{n.title}</span> — {n.message}
          </p>
        ))}
      </div>
    </section>
  );
};
