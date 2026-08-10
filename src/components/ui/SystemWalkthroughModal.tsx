import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  Users,
  KeyRound,
  DollarSign,
  Server,
  HelpCircle,
  Award,
  Layers,
  ChevronRight,
  UserCheck,
  Car,
  GraduationCap,
  Crosshair,
  Dog,
  Search,
  Briefcase,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { User } from "../../types";
import { K9_OPERATOR_ROLES, MARKETING_ROLES, OPS_MANAGEMENT_ROLES, TRAINING_OFFICER_ROLES, isRoleIn } from "../../services/rbacService";

interface SystemWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onNavigateTab?: (tab: string) => void;
}

export const SystemWalkthroughModal: React.FC<SystemWalkthroughModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const totalSteps = 5;

  const handleFinish = () => {
    if (dontShowAgain && currentUser?.id) {
      localStorage.setItem(`walkthrough_completed_${currentUser.id}`, "true");
    }
    onClose();
  };

  const handleJumpToTab = (tabId: string) => {
    handleFinish();
    if (onNavigateTab) {
      onNavigateTab(tabId);
    }
  };

  // Helper to render role-specific breakdown
  const renderRoleGuidance = () => {
    const role = currentUser.role;
    const dept = currentUser.department;

    if (role.includes("Records")) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span>RECORDS OFFICE • IDENTITY CARD GUIDE</span>
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold">Module: Identity Cards</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As the Records Officer, you are the issuing authority for official personnel identity cards.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Capture ID Holder Photo:</strong> Use a web camera or a phone camera connected to the laptop to take a passport-quality photo.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Holder & Issuer Signatures:</strong> The holder signs on screen, then you add your issuing signature before approving the card.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Print & Verification:</strong> Export the CR80 card at 300 DPI for the card printer. IT can verify any card's genuineness read-only.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("identity")}
              className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Identity Cards Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (dept === "Human Resources" || role.includes("HR") || role.includes("Records")) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
              <Users className="w-3 h-3 text-purple-400" />
              <span>HR & PERSONNEL WORKSPACE GUIDE</span>
            </span>
            <span className="text-xs text-purple-300 font-mono font-bold">Module: Guards & HR</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As an HR Officer, you oversee the recruitment, vetting, and biodata records of all security officers across Uganda.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>New Guard Onboarding:</strong> Register personnel with passport photos, NIN validation, and emergency referees.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Records Office Coordination:</strong> Once approved, the Records Officer captures the ID holder photo & signature and prepares the high-security PVC card. IT verifies issued cards for genuineness.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span><strong>Official Biodata File:</strong> View complete military-grade printable HR dossiers for vetting officers and client audits.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("hr")}
              className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore HR Personnel Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (dept === "IT" || role.includes("IT")) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-cyan-400" />
              <span>IT & SYSTEM ADMINISTRATION GUIDE</span>
            </span>
            <span className="text-xs text-cyan-300 font-mono font-bold">Module: IT Admin</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As an IT Officer / System Seer, you have system-wide oversight to provision user accounts, define custom RBAC permissions, verify issued identity cards, and monitor server health.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Identity Card Verification:</strong> Confirm a card is genuine — check the card number, holder photo, and holder & issuer signatures (issued by the Records Officer).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>User Account Provisioning:</strong> Create corporate emails and assign granular roles (Operations, Armoury, Finance, HR).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Infrastructure & HSTS:</strong> Oversee database backups, software assets, hardware inventory, and system tickets.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("it")}
              className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore IT & Security Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (role === "Guard Officer") {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-lime-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-lime-500/20 text-lime-300 border border-lime-500/40 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-lime-400" />
              <span>FIELD GUARD PORTAL GUIDE</span>
            </span>
            <span className="text-xs text-lime-300 font-mono font-bold">Module: Guard Portal</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As a Guard Officer you work from the field portal to manage your duty shift, credentials, and incident reporting.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
              <span><strong>Duty & Check-In:</strong> View your assigned site, shift, and supervisor; check in at post start.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
              <span><strong>Incident Reporting:</strong> Log incidents and emergency alerts straight to Operations dispatch.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
              <span><strong>Force Number:</strong> Your identity card and force number (e.g. PSG026/004) are your official Force Number credentials.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("guard_portal")}
              className="mt-2 w-full py-2 bg-lime-600 hover:bg-lime-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Your Guard Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (role === "Fleet Manager") {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-orange-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1">
              <Car className="w-3 h-3 text-orange-400" />
              <span>FLEET GUIDE</span>
            </span>
            <span className="text-xs text-orange-300 font-mono font-bold">Module: Fleet</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As Fleet Manager you own the vehicle & motorcycle register, fuel, maintenance, inspections, and the driver/rider roster.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span><strong>Driver & Rider Onboarding:</strong> Hired Driver/Rider candidates land here as <strong>Pending FM Approval</strong> — each auto-issued a Force Number (PSG series) by Records — ready for your approval to Active Duty.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span><strong>Licence Approvals & Expiry:</strong> Approve pending licences; the register flags CRITICAL (expired) and warn (≤60 days) expiry in colour.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span><strong>Fleet Ops:</strong> Trip logs, fuel vouchers, maintenance & workshop scheduling, pre-shift inspections, breakdown response.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("fleet")}
              className="mt-2 w-full py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Fleet Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (isRoleIn(role, TRAINING_OFFICER_ROLES)) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-violet-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-violet-400" />
              <span>TRAINING SCHOOL GUIDE</span>
            </span>
            <span className="text-xs text-violet-300 font-mono font-bold">Module: Training & Academy</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You manage the recruit-to-pass-out pipeline: drills, marksmanship, theory, and the pass-out where each graduate receives a Force Number.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span><strong>Recruit Pipeline:</strong> Track enrolled recruits, daily scores, and readiness assessments.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span><strong>Pass-Out & Force Numbers:</strong> On graduation, allocate the guard's PSG force number (e.g. PSG026/004) and issue the certificate.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span><strong>Transfer to Roster:</strong> Graduates move to the active HR Personnel Roster for deployment.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("operations")}
              className="mt-2 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Training School Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (role === "Armorer") {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-rose-400" />
              <span>ARMOURY CONTROL GUIDE</span>
            </span>
            <span className="text-xs text-rose-300 font-mono font-bold">Module: Armoury</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You hold custody of the weapon & ammunition register with strict issue/return accountability.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Weapon & Ammo Register:</strong> Maintain serial-numbered weapon records and per-issue round counts.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Issue / Return:</strong> Log every armed deployment and reconcile returned rounds against the vault ledger.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span><strong>Vault & Compliance:</strong> Monitor vault status, maintenance, and armory audit trails.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("operations")}
              className="mt-2 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Armoury Control Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (isRoleIn(role, K9_OPERATOR_ROLES)) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-pink-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center gap-1">
              <Dog className="w-3 h-3 text-pink-400" />
              <span>CANINE UNIT GUIDE</span>
            </span>
            <span className="text-xs text-pink-300 font-mono font-bold">Module: K9 Operations</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You oversee the canine registry, handler pairing, and K9 sweep deployments across high-value client sites.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span><strong>K9 Registry:</strong> Track dog records, certifications, vet care, and deployment readiness.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span><strong>Handler Pairing:</strong> Assign certified handlers to dogs and manage team rosters.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <span><strong>Explosive / Narcotics Sweeps:</strong> Log sweep missions, findings, and incident escalation.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("operations")}
              className="mt-2 w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Canine Unit Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (role === "Investigations Officer") {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-sky-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
              <Search className="w-3 h-3 text-sky-400" />
              <span>INVESTIGATIONS GUIDE</span>
            </span>
            <span className="text-xs text-sky-300 font-mono font-bold">Module: Investigations</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You run internal investigations: case tracking, evidence, witness statements, and findings that feed disciplinary actions.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Case Docket:</strong> Open cases from incidents, complaints, or whistleblower reports.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Evidence & Statements:</strong> Attach findings and link cases to the disciplinary workflow.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><strong>Outcomes:</strong> Close cases with recommendations for HR action or exoneration.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("investigations")}
              className="mt-2 w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Investigations Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (isRoleIn(role, MARKETING_ROLES)) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-fuchsia-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-fuchsia-400" />
              <span>MARKETING & SALES GUIDE</span>
            </span>
            <span className="text-xs text-fuchsia-300 font-mono font-bold">Module: Marketing & Client CRM</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You own the sales pipeline, client onboarding, site setup, and the contract approval chain.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
              <span><strong>Lead Pipeline:</strong> Track prospects from initial contact through proposal and negotiation.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
              <span><strong>Client & Site Onboarding:</strong> Enroll new clients and their site guard requirements (day/night/armed/K9).</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
              <span><strong>Contract Chain:</strong> Draft contracts and push them through Ops → Finance → GM approval.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("marketing")}
              className="mt-2 w-full py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Marketing & Sales Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (role === "Administrative Officer") {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-400" />
              <span>ADMINISTRATION GUIDE</span>
            </span>
            <span className="text-xs text-teal-300 font-mono font-bold">Module: Administrations</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            You run office & field administration: uniforms, equipment inventory, requisitions, and office assets.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Equipment & Uniforms:</strong> Track issue of uniforms, boots, radios, and protective gear to personnel.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Requisitions:</strong> Raise operational fund and material requests for Finance approval.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Office Assets:</strong> Maintain the office & IT-adjacent hardware/software asset ledger.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("administration")}
              className="mt-2 w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Administration Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (dept === "Operations" || isRoleIn(role, OPS_MANAGEMENT_ROLES)) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>OPERATIONS COMMAND GUIDE</span>
            </span>
            <span className="text-xs text-emerald-300 font-mono font-bold">Module: Operations & Dispatch</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Operations manages duty rosters, real-time guard deployment, patrol inspection logs, incident response, fleet, and K9/Armoury integration.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Duty Roster:</strong> Deploy guards to client sites (banks, embassies, industrial plants) with shift tracking.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Patrol Inspections:</strong> Record field supervisor check-ins, uniform integrity, and post readiness.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Incidents & Fleet:</strong> Log emergency alerts and coordinate quick response patrol vehicles.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("operations")}
              className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Operations Department Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    if (dept === "Finance" || role.includes("Accountant") || role.includes("Finance") || role.includes("Cashier") || role.includes("Auditor")) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span>FINANCE & ACCOUNTS WORKSPACE GUIDE</span>
            </span>
            <span className="text-xs text-amber-300 font-mono font-bold">Module: Financial Operations</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Finance oversees corporate billing, client invoicing, departmental requisitions, cashier petty cash vault, and revenue audits.
          </p>
          <ul className="space-y-1.5 text-xs text-slate-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Client Invoicing:</strong> Generate formal UGX invoices for contract guarding, K9 sweeps, and CIT services.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Requisitions Approval:</strong> Review and approve operational fund requests from Administrations & Fleet.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Cashier Petty Cash Vault:</strong> Track daily operational disbursements with automated receipt numbers.</span>
            </li>
          </ul>
          {onNavigateTab && (
            <button
              onClick={() => handleJumpToTab("finance")}
              className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Explore Finance Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Default General / Executive Guide
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-blue-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <Award className="w-3 h-3 text-blue-400" />
            <span>EXECUTIVE COMMAND DASHBOARD GUIDE</span>
          </span>
          <span className="text-xs text-blue-300 font-mono font-bold">Module: Executive Dashboard</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          As an Executive Director / General Manager, you have overall strategic oversight across all regional stations, armouries, financial health, and workforce analytics.
        </p>
        <ul className="space-y-1.5 text-xs text-slate-200">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span><strong>Live Security Metrics:</strong> Monitor active guard posts, K9 dogs on duty, fleet readiness, and incident alerts.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span><strong>System Audit Trail:</strong> Review timestamped security audit logs across all user actions for complete transparency.</span>
          </li>
        </ul>
        {onNavigateTab && (
          <button
            onClick={() => handleJumpToTab("dashboard")}
            className="mt-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Explore Executive Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 relative overflow-hidden">
          {/* Decorative Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-500" />

          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center font-black shadow-md border border-cyan-500/30">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  System Onboarding
                </h3>
                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-900 font-extrabold text-[10px] rounded-full uppercase border border-cyan-200">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Welcome to your onboarding for <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            title="Close Onboarding"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Timeline Progress Indicator */}
        <div className="flex items-center justify-between gap-2 px-1">
          {[
            { step: 1, title: "Welcome" },
            { step: 2, title: "Navigation" },
            { step: 3, title: "Your Role" },
            {
              step: 4,
              title:
                currentUser.department === "IT" || ["General Manager", "Director"].includes(currentUser.role) || currentUser.role.includes("Admin")
                  ? "Audit & Security"
                  : "Privacy & NDA",
            },
            { step: 5, title: "Help & Docs" },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => setCurrentStep(item.step)}
                className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
              >
                <div
                  className={`w-full h-2 rounded-full transition-all ${
                    isCurrent
                      ? "bg-cyan-500 shadow-sm"
                      : isDone
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}
                />
                <span
                  className={`text-[10px] font-bold transition-all hidden sm:block ${
                    isCurrent
                      ? "text-slate-900 font-extrabold"
                      : isDone
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* STEP CONTENT SWITCHER */}
        <div className="min-h-[280px] flex flex-col justify-between space-y-4">
          {/* STEP 1: WELCOME & ACCOUNT OVERVIEW */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-lg space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 inline-flex">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Integrated Security Company Management System (ISCMS)</span>
                    </span>
                    <h4 className="text-lg font-black text-white pt-1">
                      Welcome aboard, {currentUser.name}!
                    </h4>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center font-black text-cyan-300 text-base shadow-sm">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  You have been successfully onboarded into the Integrated Security Company Ltd centralized operations platform. This system handles end-to-end security operations across all regional stations in Uganda.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-2">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Force Number</span>
                    <strong className="text-amber-300 font-mono font-extrabold block truncate">{currentUser.forceNumber || "To be issued at Records"}</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Role</span>
                    <strong className="text-cyan-300 font-extrabold block truncate">{currentUser.role}</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Department</span>
                    <strong className="text-white font-extrabold block truncate">{currentUser.department}</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Corporate Email</span>
                    <strong className="text-slate-300 font-mono text-[10px] block truncate">{currentUser.email}</strong>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Station / Region</span>
                    <strong className="text-emerald-300 font-extrabold block truncate">{currentUser.region || "Kampala HQ"}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold block text-amber-950">Security Account Protection</strong>
                  <span>
                    Your user account is restricted to your designated department by Role-Based Access Control (RBAC). You can switch user accounts or lock your session using the red button in the top navigation bar at any time.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: NAVIGATION & TOP HEADER BAR */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-2">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-600" />
                  <span>Navigating Your System Header & Workspaces</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The top header bar provides real-time operational status, department switching, theme controls, and tab navigation tailored specifically to your active permissions.
                </p>
              </div>

              <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Top Bar Controls Breakdown</span>
                  <span className="text-[10px] text-slate-400 font-mono">Header UI Bar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-white font-extrabold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Role & Department Switcher</span>
                    </strong>
                    <p className="text-[11px] text-slate-400">
                      Located in the top left. Allows testing or switching between authorized department personnel profiles.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-white font-extrabold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Authorized Department Tabs</span>
                    </strong>
                    <p className="text-[11px] text-slate-400">
                      Only displays modules that your user role is explicitly permitted to access under security policies.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-white font-extrabold flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>System Onboarding Button</span>
                    </strong>
                    <p className="text-[11px] text-slate-400">
                      Click the "Onboarding" button in the top bar whenever you want to replay this guided tour.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-white font-extrabold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                      <span>Lock / Switch Department Button</span>
                    </strong>
                    <p className="text-[11px] text-slate-400">
                      Instantly locks your session or switches user profiles when handing over shifts to another officer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ROLE-TAILORED DEPT WORKSPACE */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Your Role-Specific Operational Workspace</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Based on your assigned role of <strong className="text-slate-900">{currentUser.role}</strong>, here is how your operational tools function:
                </p>
              </div>

              {renderRoleGuidance()}
            </div>
          )}

          {/* STEP 4: PRIVACY, CONFIDENTIALITY & AUDIT PROTOCOLS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-600" />
                  <span>
                    {currentUser.department === "IT" || ["General Manager", "Director"].includes(currentUser.role) || currentUser.role.includes("Admin")
                      ? "System Audit Logs & Technical Security Compliance"
                      : "Data Privacy, Confidentiality & Non-Disclosure Guidelines"}
                  </span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentUser.department === "IT" || ["General Manager", "Director"].includes(currentUser.role) || currentUser.role.includes("Admin")
                    ? "Every transaction, personnel enrollment, armory issue, and financial requisition is immutably logged for ISO compliance and internal investigation."
                    : "Integrated Security Company Ltd enforces strict operational data privacy. All personnel data, client site details, and firearm records are confidential."}
                </p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    {currentUser.department === "IT" || ["General Manager", "Director"].includes(currentUser.role) || currentUser.role.includes("Admin")
                      ? "REAL-TIME AUDIT TRAIL ENGINE"
                      : "OFFICIAL CONFIDENTIALITY & DATA INTEGRITY"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold rounded">
                    ENFORCED PROTOCOL
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {currentUser.department === "IT" || ["General Manager", "Director"].includes(currentUser.role) || currentUser.role.includes("Admin") ? (
                    <>
                      <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-extrabold">Automatic User Activity Tracking</strong>
                          <span className="text-slate-300 text-[11px]">
                            When you add a guard, refuel a vehicle, approve an invoice, or issue an identity card, the system logs your name, timestamp, and module.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-extrabold">Data Integrity & Secrecy</strong>
                          <span className="text-slate-300 text-[11px]">
                            Sensors and database entries are protected against unauthorized modification.
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-extrabold">Need-To-Know Data Isolation</strong>
                          <span className="text-slate-300 text-[11px]">
                            Your user account is isolated to your assigned department. You only see data directly relevant to your daily duties.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block font-extrabold">Clean Session Security</strong>
                          <span className="text-slate-300 text-[11px]">
                            Always log out or lock your session before leaving your workstation unattended.
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: HELP & SUPPORT */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-600" />
                  <span>Support & IT Tickets</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Need assistance or have technical issues? You can raise support tickets directly to the IT Department.
                </p>
              </div>

              <div className="text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <strong className="text-slate-900 font-extrabold block">IT Desk & Support Tickets</strong>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Submit helpdesk tickets to IT for password resets, printer issues, or system role changes.
                  </p>
                  {onNavigateTab && (
                    <button
                      onClick={() => handleJumpToTab("it")}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 hover:text-purple-900 pt-1 cursor-pointer"
                    >
                      <span>Open IT Support Center</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-950">You are all set to begin using the system!</span>
                <span className="font-bold text-cyan-700">Status: Verified Officer</span>
              </div>
            </div>
          )}

          {/* Footer Controls & Next/Prev Navigation */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
              />
              <span>Don't show onboarding automatically on login</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer mr-1"
                title="Skip onboarding and return to main dashboard"
              >
                Skip
              </button>

              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(totalSteps, prev + 1))}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Launch System</span>
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
