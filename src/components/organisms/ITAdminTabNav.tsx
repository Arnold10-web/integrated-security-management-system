import React from "react";
import { Users, CreditCard, UserCheck, HardDrive, MapPin, Server, ShieldCheck, Cpu, Monitor } from "lucide-react";

type ITAdminTab = "users" | "id_cards" | "roles" | "it_assets" | "regions" | "servers" | "devices" | "audit" | "automation" | "maintenance";

interface ITAdminTabNavProps {
  activeTab: ITAdminTab;
  onTabChange: (tab: ITAdminTab) => void;
  userCount: number;
  assetCount: number;
  regionCount: number;
  serverCount: number;
  auditLogCount: number;
  automationLogCount: number;
  pendingIdCards: number;
}

const tabs: { key: ITAdminTab; label: string; icon: React.FC<{ className?: string }>; iconColor: string; count?: number; badge?: number; highlight?: boolean }[] = [
  { key: "users", label: "User Accounts & Rights", icon: Users, iconColor: "text-cyan-400" },
  { key: "id_cards", label: "Identity Cards & HR Coordination", icon: CreditCard, iconColor: "text-emerald-400", badge: 1, highlight: true },
  { key: "roles", label: "RBAC Matrix & Personas", icon: UserCheck, iconColor: "text-blue-400" },
  { key: "it_assets", label: "IT Hardware & Software Assets", icon: HardDrive, iconColor: "text-purple-400" },
  { key: "regions", label: "Regional Stations & Outer Locations", icon: MapPin, iconColor: "text-amber-400" },
  { key: "servers", label: "Server Health & IT Help Desk", icon: Server, iconColor: "text-emerald-400" },
  { key: "devices", label: "Device Sessions & IP Intelligence", icon: Monitor, iconColor: "text-cyan-400", highlight: true },
  { key: "audit", label: "Audit Telemetry Logs", icon: ShieldCheck, iconColor: "text-purple-400" },
  { key: "automation", label: "Automated IT Engine & Jobs", icon: Cpu, iconColor: "text-cyan-500" },
  { key: "maintenance", label: "System Maintenance & Integrity", icon: HardDrive, iconColor: "text-emerald-400" },
];

export const ITAdminTabNav: React.FC<ITAdminTabNavProps> = ({
  activeTab, onTabChange, userCount, assetCount, regionCount, serverCount, auditLogCount, automationLogCount, pendingIdCards,
}) => {
  const countMap: Record<string, number | undefined> = {
    users: userCount, it_assets: assetCount, regions: regionCount, servers: serverCount, audit: auditLogCount, automation: automationLogCount,
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
      {tabs.map((tab) => {
        const IconComp = tab.icon;
        const cnt = countMap[tab.key];
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === tab.key
                ? tab.key === "id_cards" ? "bg-slate-900 text-white shadow-md border-2 border-cyan-400"
                  : tab.key === "automation" ? "bg-slate-900 text-white shadow-md ring-2 ring-cyan-500/50"
                    : tab.key === "maintenance" ? "bg-slate-900 text-white shadow-md ring-2 ring-emerald-500/50"
                      : "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <IconComp className={`w-4 h-4 ${tab.iconColor}`} />
            <span>{tab.label}{cnt !== undefined ? ` (${cnt})` : ""}</span>
            {tab.badge && pendingIdCards > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded-full text-[9px]">{pendingIdCards} Pending</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
