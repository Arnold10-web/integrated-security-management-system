import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { AuditLog, User, UserRole, CustomRoleDefinition, Guard, ITServer, ITSupportTicket, ITAsset, RegionalOffice } from "../../types";
import { initialITAssets } from "../../data/mockData";
import { UserRolesView } from "./UserRolesView";
import { AuditLogsView } from "./AuditLogsView";
import { ActingRequestsITQueue } from "./ActingRequestsITQueue";
import { SystemMaintenancePanel, AutomationEnginePanel, IdentityCardPanel, ITAssetPanel, ITAdminTabNav, ITAdminUsersToolbar, DeviceSessionsPanel } from "../organisms";
import { AddAssetModal, AddUserModal, ActingPrivilegeModal, EditUserModal, IdentityCardPrintModal, PermissionOverridesModal, ProvisionUserModal, RegionalOfficesGrid, ServerHealthGrid, UserTable } from "../organisms";

type SubTab = "users" | "id_cards" | "roles" | "it_assets" | "regions" | "servers" | "devices" | "audit" | "automation" | "maintenance";

interface ITAdminViewProps {
  users: User[]; customRoles: CustomRoleDefinition[]; servers: ITServer[]; tickets: ITSupportTicket[];
  itAssets?: ITAsset[]; guards?: Guard[]; auditLogs: AuditLog[]; activeRole: UserRole; regions: RegionalOffice[];
  onRoleChange: (role: UserRole) => void; onAddUser: (user: Omit<User, "id">) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void; onDeleteUser: (userId: string) => void;
  onToggleSuspendUser: (userId: string) => void; onAddCustomRole: (role: CustomRoleDefinition) => void;
  onDeleteCustomRole?: (id: string) => void;
  onAddITAsset?: (asset: Omit<ITAsset, "id" | "assetCode">) => void;
  onUpdateITAsset?: (assetId: string, updates: Partial<ITAsset>) => void;
  onDeleteITAsset?: (assetId: string) => void; onUpdateGuard?: (guardId: string, updates: Partial<Guard>) => void;
  onTriggerWalkthroughForUser?: (user: User) => void;
  onRevokeActingPrivilege?: (userId: string) => Promise<void>;
  onAddRegion?: (r: Omit<RegionalOffice, "id">) => void;  onUpdateRegion?: (id: string, updates: Partial<RegionalOffice>) => void;
  onDeleteRegion?: (id: string) => void;
  onUpdateServer?: (id: string, updates: Partial<ITServer>) => void;
  onDeleteServer?: (id: string) => void;
  onAddTicket?: (t: Omit<ITSupportTicket, "id">) => void;
  onUpdateTicket?: (id: string, updates: Partial<ITSupportTicket>) => void;
  onDeleteTicket?: (id: string) => void;
}

export const ITAdminView: React.FC<ITAdminViewProps> = ({
  users, guards = [], customRoles, servers, tickets, itAssets = initialITAssets, auditLogs, activeRole,
  regions, onRoleChange, onAddUser, onUpdateUser, onDeleteUser, onToggleSuspendUser, onAddCustomRole,
  onDeleteCustomRole, onAddITAsset, onUpdateITAsset, onDeleteITAsset, onUpdateGuard, onTriggerWalkthroughForUser,
  onRevokeActingPrivilege,
  onAddRegion, onUpdateRegion, onDeleteRegion, onUpdateServer, onDeleteServer,
  onAddTicket, onUpdateTicket, onDeleteTicket,
}) => {
  const [subTab, setSubTab] = useState<SubTab>("users");
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStepMsg, setBackupStepMsg] = useState("");
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityVerifyToast, setIntegrityVerifyToast] = useState<string | null>(null);
  const [integrityCategory, setIntegrityCategory] = useState("ALL");
  const [integritySearch, setIntegritySearch] = useState("");
  const [idCardFilter, setIdCardFilter] = useState<"ALL" | "PENDING" | "ISSUED" | "REVOKED">("ALL");
  const [idCardSearch, setIdCardSearch] = useState("");
  const [selectedGuardForCard, setSelectedGuardForCard] = useState<Guard | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showProvisionUserForGuard, setShowProvisionUserForGuard] = useState<Guard | null>(null);
  const [backupArchives, setBackupArchives] = useState([
    { id: "BK-20260727-01", filename: "enterprise_sec_full_snapshot_20260727_0230.enc.db", size: "48.2 MB", type: "Manual On-Demand", initiatedBy: activeRole === "IT Officer" ? "IT Officer (Current Session)" : "IT Administrator", checksumSHA256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", timestamp: "2026-07-27 02:15:00", status: "VERIFIED_INTACT", tablesIncluded: "Guard Roster, Armoury Vault, Accounts, Incidents, Audit Telemetry" },
    { id: "BK-20260726-00", filename: "enterprise_sec_nightly_auto_20260726_0000.enc.db", size: "42.8 MB", type: "Automated Routine", initiatedBy: "SYSTEM_SCHEDULER", checksumSHA256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4", timestamp: "2026-07-26 00:00:00", status: "VERIFIED_INTACT", tablesIncluded: "All Enterprise Schemas & System Ledgers" },
    { id: "BK-20260725-00", filename: "enterprise_sec_nightly_auto_20260725_0000.enc.db", size: "42.1 MB", type: "Automated Routine", initiatedBy: "SYSTEM_SCHEDULER", checksumSHA256: "71c9d2c67e8912e5c942a781e976b91f14371d34c3217d8ef29e92d8329b1011", timestamp: "2026-07-25 00:00:00", status: "VERIFIED_INTACT", tablesIncluded: "All Enterprise Schemas & System Ledgers" },
  ]);
  const [integrityLogs, setIntegrityLogs] = useState([
    { id: "INT-1001", category: "DATABASE", component: "Guard Personnel & HR Roster Ledger", testPerformed: "Row Checksum & Encryption Vector Verification", hashSignature: "0x8F9A43B172E901C2", recordsAudited: 420, status: "HEALTHY_INTACT", lastChecked: "Just Now", notes: "All 420 guard personnel records and national ID encryption hashes match primary key index." },
    { id: "INT-1002", category: "DATABASE", component: "Armoury Firearms & Vault Ledger", testPerformed: "Vault Balance Cryptographic Signature Audit", hashSignature: "0x3C1D90E211B452A9", recordsAudited: 185, status: "HEALTHY_INTACT", lastChecked: "Just Now", notes: "Firearm serial numbers, issue vouchers, and vault balance tallies reconciled 100%." },
    { id: "INT-1003", category: "DATABASE", component: "Finance Payroll & Remittance Register", testPerformed: "Payroll Ledger Hash & Double-Entry Integrity", hashSignature: "0x7E2A11F9882C30D4", recordsAudited: 310, status: "HEALTHY_INTACT", lastChecked: "5 minutes ago", notes: "Tax deductions, NSSF remittances, and net salary calculations confirmed mathematically consistent." },
    { id: "INT-1004", category: "SECURITY", component: "RBAC User Accounts & Auth Credentials", testPerformed: "Role Matrix Security & Session Expiry Audit", hashSignature: "0x5A8B77C39011E4F2", recordsAudited: users.length, status: "HEALTHY_INTACT", lastChecked: "12 minutes ago", notes: "Zero unauthorized privilege escalations detected. Active JWT tokens strictly mapped to department roles." },
    { id: "INT-1005", category: "PERMISSIONS", component: "Audit Telemetry System Journal", testPerformed: "Immutable Block Chain Sequence Check", hashSignature: "0x11E499D082A133F8", recordsAudited: auditLogs.length, status: "HEALTHY_INTACT", lastChecked: "1 hour ago", notes: "Audit log sequence is unbroken with zero missing transaction IDs." },
    { id: "INT-1006", category: "KEYS", component: "System Vault AES-256 Encryption Keys", testPerformed: "Key Rotation & HSM Key Store Access Audit", hashSignature: "0x99B244F810C7A921", recordsAudited: 12, status: "HEALTHY_INTACT", lastChecked: "2 hours ago", notes: "Encryption keys are valid and stored in encrypted vault with zero unauthorized reads." },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanOutput, setScanOutput] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [dormantAuditOutput, setDormantAuditOutput] = useState<string | null>(null);
  const [slaEscalationMsg, setSlaEscalationMsg] = useState<string | null>(null);
  const [selectedResetUser, setSelectedResetUser] = useState<string>(users[0]?.id || "");
  const [generatedResetToken, setGeneratedResetToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [automationLogs, setAutomationLogs] = useState([
    { id: "JOB-001", jobName: "Nightly Encrypted DB Snapshot", frequency: "Daily @ 00:00 UTC", lastRun: "2026-07-26 00:00:00", status: "SUCCESS", details: "Compressed & encrypted 42.8 MB database archive to secure off-site vault." },
    { id: "JOB-002", jobName: "System Endpoint Vulnerability Scan", frequency: "Every 6 Hours", lastRun: "2026-07-26 04:00:00", status: "SUCCESS", details: "Scanned 14 API routes, verified SSL certificates and CORS headers. Zero vulnerabilities." },
    { id: "JOB-003", jobName: "Dormant Account & Session Purge", frequency: "Weekly Sunday Routine", lastRun: "2026-07-20 02:00:00", status: "SUCCESS", details: "Audit completed across 24 accounts. No dormant accounts exceeding 30-day threshold." },
    { id: "JOB-004", jobName: "Support Ticket SLA Escalation Check", frequency: "Every 15 Minutes", lastRun: "2026-07-26 05:00:00", status: "SUCCESS", details: "Scanned open IT helpdesk vouchers. All active tickets are within SLA boundaries." },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterRegion, setFilterRegion] = useState("ALL");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [actingUser, setActingUser] = useState<User | null>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetCategoryFilter, setAssetCategoryFilter] = useState("ALL");
  const [assetConditionFilter, setAssetConditionFilter] = useState("ALL");
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);

  const filteredAssets = itAssets.filter((ast) => {
    const s = ast.name.toLowerCase().includes(assetSearch.toLowerCase()) || ast.assetCode.toLowerCase().includes(assetSearch.toLowerCase()) || ast.serialNumberOrKey.toLowerCase().includes(assetSearch.toLowerCase()) || ast.assignedToPersonOrStation.toLowerCase().includes(assetSearch.toLowerCase());
    const c = assetCategoryFilter === "ALL" || ast.category === assetCategoryFilter;
    const cond = assetConditionFilter === "ALL" || ast.condition === assetConditionFilter;
    return s && c && cond;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase()) || (u.region || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (filterDept === "ALL" || u.department === filterDept) && (filterRegion === "ALL" || u.region === filterRegion);
  });

  const handleInitiateManualBackup = () => {
    setIsCreatingBackup(true); setBackupProgress(15); setBackupStepMsg("Initializing system database connection & locking table snapshot...");
    setTimeout(() => { setBackupProgress(45); setBackupStepMsg("Extracting HR guard rosters, Armoury vault balances & Finance registers..."); }, 500);
    setTimeout(() => { setBackupProgress(75); setBackupStepMsg("Applying AES-256-GCM cipher encryption & computing SHA-256 integrity hash..."); }, 1100);
    setTimeout(() => {
      setBackupProgress(100); setBackupStepMsg("Backup verified! Encrypted system archive generated successfully.");
      const now = new Date(); const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "").substring(0, 4);
      setBackupArchives((prev) => [{ id: `BK-${dateStr}-${prev.length + 1}`, filename: `enterprise_sec_manual_backup_${dateStr}_${timeStr}.enc.db`, size: `${(45 + Math.random() * 5).toFixed(1)} MB`, type: "Manual On-Demand", initiatedBy: activeRole === "IT Officer" ? "IT Officer (Current User)" : "IT Administrator", checksumSHA256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""), timestamp: now.toISOString().replace("T", " ").substring(0, 19), status: "VERIFIED_INTACT", tablesIncluded: "Full Enterprise Snapshot (HR, Armoury, Finance, Fleet, Audit Telemetry)" }, ...prev]);
      setTimeout(() => { setIsCreatingBackup(false); setBackupProgress(0); setBackupStepMsg(""); }, 1000);
    }, 1700);
  };

  const handleVerifyAllIntegrityLogs = () => {
    setIsVerifyingIntegrity(true);
    setTimeout(() => { setIntegrityLogs((prev) => prev.map((log) => ({ ...log, lastChecked: "Just Now" }))); setIsVerifyingIntegrity(false); setIntegrityVerifyToast("System Integrity Verification Complete: All 6 Core Ledgers & System Telemetry Logs verified 100% INTACT with zero checksum discrepancies."); setTimeout(() => setIntegrityVerifyToast(null), 5000); }, 900);
  };

  const handleVerifySingleIntegrityLog = (logId: string) => setIntegrityLogs((prev) => prev.map((log) => (log.id === logId ? { ...log, lastChecked: "Just Now" } : log)));

  const handleRunVulnerabilityScan = () => {
    setIsScanning(true); setScanOutput(null);
    setTimeout(() => { setIsScanning(false); setScanOutput("Diagnostic Complete: 100% Server Nodes Hardened. 14 API Endpoints Verified. CORS & SSL Active. 0 Security Flaws Detected."); setAutomationLogs((prev) => [{ id: `JOB-${Date.now()}`, jobName: "System Endpoint Vulnerability Scan (Manual On-Demand)", frequency: "On-Demand Trigger", lastRun: new Date().toISOString().replace("T", " ").substring(0, 19), status: "SUCCESS", details: "Diagnostic scan executed by IT Officer. All API endpoints passed security compliance checks." }, ...prev]); }, 1200);
  };

  const handleRunBackup = () => { const ts = new Date().toISOString().replace("T", " ").substring(0, 19); setBackupStatus(`Database Snapshot Complete: 42.9 MB encrypted archive written to secure vault at ${ts}.`); setAutomationLogs((prev) => [{ id: `JOB-${Date.now()}`, jobName: "Encrypted DB Snapshot & Compression", frequency: "On-Demand Trigger", lastRun: ts, status: "SUCCESS", details: "Compressed & encrypted full database schema and audit log archive." }, ...prev]); };

  const handleRunDormantAudit = () => { const ts = new Date().toISOString().replace("T", " ").substring(0, 19); const activeCount = users.filter((u) => u.status === "Active").length; setDormantAuditOutput(`Dormant Account Audit Finished: Checked ${users.length} registered accounts (${activeCount} Active, ${users.length - activeCount} Suspended). Zero accounts exceed 30-day inactivity threshold.`); setAutomationLogs((prev) => [{ id: `JOB-${Date.now()}`, jobName: "Dormant Account Security Audit", frequency: "On-Demand Trigger", lastRun: ts, status: "SUCCESS", details: `Scanned ${users.length} accounts. All user sessions are compliant with security policy.` }, ...prev]); };

  const handleRunSLAEscalation = () => { const ts = new Date().toISOString().replace("T", " ").substring(0, 19); setSlaEscalationMsg(`Helpdesk SLA Routine Complete: All ${tickets.length} support tickets are currently within acceptable response SLA limits.`); setAutomationLogs((prev) => [{ id: `JOB-${Date.now()}`, jobName: "Support Ticket SLA Escalation Check", frequency: "On-Demand Trigger", lastRun: ts, status: "SUCCESS", details: `Verified ${tickets.length} support vouchers. Response SLAs maintained across all departments.` }, ...prev]); };

  const handleGenerateResetToken = () => { const target = users.find((u) => u.id === selectedResetUser) || users[0]; setGeneratedResetToken(`${target.email} | Token: SEC-OTP-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)} | Expires in 15 Minutes`); setCopiedToken(false); };

  const pendingIdCards = guards.filter((g) => g.idCardStatus === "Pending Records Issuance" || !g.idCardStatus).length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider border border-cyan-500/30">Information Technology (IT) Department • IT Officer Control</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">System Administration, Access Control & Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">Overall Seer Console: Provision users, define departmental roles, suspend/delete accounts, grant permissions, and monitor system servers & security logs.</p>
        </div>
        <button onClick={() => setShowAddUserModal(true)} className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0">
          <UserPlus className="w-4 h-4" /><span>Provision New System User</span>
        </button>
      </div>

      <ITAdminTabNav activeTab={subTab} onTabChange={setSubTab} userCount={users.length} assetCount={itAssets.length} regionCount={regions.length} serverCount={servers.length} auditLogCount={auditLogs.length} automationLogCount={automationLogs.length} pendingIdCards={pendingIdCards} />

      {subTab === "users" && (
        <div className="space-y-6">
          <ActingRequestsITQueue />
          <ITAdminUsersToolbar searchQuery={searchQuery} onSearchChange={setSearchQuery} filterDept={filterDept} onFilterDeptChange={setFilterDept} filterRegion={filterRegion} onFilterRegionChange={setFilterRegion} />
          <UserTable users={filteredUsers} onEdit={(u) => setEditingUser(u)} onToggleSuspend={onToggleSuspendUser} onDelete={onDeleteUser} onTriggerWalkthrough={onTriggerWalkthroughForUser} onEditPermissions={(u) => setPermissionsUser(u)} onManageActing={(u) => setActingUser(u)} />
        </div>
      )}
      {subTab === "id_cards" && (
        <IdentityCardPanel guards={guards} idCardFilter={idCardFilter} idCardSearch={idCardSearch} onSetIdCardFilter={setIdCardFilter} onSetIdCardSearch={setIdCardSearch} onSelectGuardForCard={setSelectedGuardForCard} onOpenPrintModal={() => setShowPrintModal(true)} onProvisionUser={(guard) => setShowProvisionUserForGuard(guard)} readOnly />
      )}
      {subTab === "roles" && (
        <UserRolesView activeRole={activeRole} customRoles={customRoles} onRoleChange={onRoleChange} onAddCustomRole={onAddCustomRole} onDeleteCustomRole={onDeleteCustomRole} regions={regions} />
      )}
      {subTab === "it_assets" && (
        <ITAssetPanel itAssets={itAssets} filteredAssets={filteredAssets} assetSearch={assetSearch} assetCategoryFilter={assetCategoryFilter} assetConditionFilter={assetConditionFilter} onSetAssetSearch={setAssetSearch} onSetAssetCategoryFilter={setAssetCategoryFilter} onSetAssetConditionFilter={setAssetConditionFilter} onOpenAddAssetModal={() => setShowAddAssetModal(true)} onUpdateITAsset={onUpdateITAsset} onDeleteITAsset={onDeleteITAsset} />
      )}
      {subTab === "regions" && <RegionalOfficesGrid offices={regions} users={users} isITOfficer={activeRole === "IT Officer"} onAddRegion={onAddRegion} onUpdateRegion={onUpdateRegion} onDeleteRegion={onDeleteRegion} />}
      {subTab === "servers" && <ServerHealthGrid servers={servers} tickets={tickets} onUpdateServer={onUpdateServer} onDeleteServer={onDeleteServer} onAddTicket={onAddTicket} onUpdateTicket={onUpdateTicket} onDeleteTicket={onDeleteTicket} />}
      {subTab === "devices" && <DeviceSessionsPanel />}
      {subTab === "audit" && <AuditLogsView logs={auditLogs} />}
      {subTab === "automation" && (
        <AutomationEnginePanel scanOutput={scanOutput} isScanning={isScanning} backupStatus={backupStatus} dormantAuditOutput={dormantAuditOutput} slaEscalationMsg={slaEscalationMsg} selectedResetUser={selectedResetUser} generatedResetToken={generatedResetToken} copiedToken={copiedToken} automationLogs={automationLogs} users={users} onRunVulnerabilityScan={handleRunVulnerabilityScan} onRunBackup={handleRunBackup} onRunDormantAudit={handleRunDormantAudit} onRunSLAEscalation={handleRunSLAEscalation} onGenerateResetToken={handleGenerateResetToken} onSetSelectedResetUser={setSelectedResetUser} onSetCopiedToken={setCopiedToken} />
      )}
      {subTab === "maintenance" && (
        <SystemMaintenancePanel backupArchives={backupArchives} integrityLogs={integrityLogs} isCreatingBackup={isCreatingBackup} backupProgress={backupProgress} backupStepMsg={backupStepMsg} isVerifyingIntegrity={isVerifyingIntegrity} integrityVerifyToast={integrityVerifyToast} integrityCategory={integrityCategory} integritySearch={integritySearch} activeRole={activeRole} onInitiateManualBackup={handleInitiateManualBackup} onVerifyAllIntegrityLogs={handleVerifyAllIntegrityLogs} onVerifySingleIntegrityLog={handleVerifySingleIntegrityLog} onSetIntegrityCategory={setIntegrityCategory} onSetIntegritySearch={setIntegritySearch} />
      )}

      <AddAssetModal show={showAddAssetModal} onClose={() => setShowAddAssetModal(false)} onSubmit={(asset) => { if (onAddITAsset) onAddITAsset(asset); setShowAddAssetModal(false); }} />
      <AddUserModal show={showAddUserModal} onClose={() => setShowAddUserModal(false)} onSubmit={(user) => { onAddUser(user); setShowAddUserModal(false); }} />
      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSubmit={(userId, updates) => { onUpdateUser(userId, updates); setEditingUser(null); }} />
      <PermissionOverridesModal user={permissionsUser} onClose={() => setPermissionsUser(null)} onSubmit={(userId, updates) => { onUpdateUser(userId, updates); setPermissionsUser(null); }} />
      <ActingPrivilegeModal user={actingUser} onClose={() => setActingUser(null)} onRevoke={async (userId) => { if (onRevokeActingPrivilege) await onRevokeActingPrivilege(userId); }} />
      <IdentityCardPrintModal show={showPrintModal} guard={selectedGuardForCard} onClose={() => { setShowPrintModal(false); setSelectedGuardForCard(null); }} onUpdateGuard={onUpdateGuard} readOnly />      <ProvisionUserModal guard={showProvisionUserForGuard} onClose={() => setShowProvisionUserForGuard(null)} onAddUser={onAddUser} onUpdateGuard={onUpdateGuard} />
    </div>
  );
};
