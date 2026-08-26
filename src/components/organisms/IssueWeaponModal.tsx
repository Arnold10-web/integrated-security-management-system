import React, { useState } from "react";
import { X, ShieldAlert, Fingerprint, CheckCircle2 } from "lucide-react";
import type { ArmouryItem, SecurityOfficer } from "../../types";
import { FingerprintCaptureModal } from "./FingerprintCaptureModal";

interface IssueWeaponModalProps {
  show: boolean;
  onClose: () => void;
  items: ArmouryItem[];
  securityOfficers: SecurityOfficer[];
  onIssueItem: (
    assetId: string,
    forceNumber: string,
    locationName: string,
    ammoRoundsOut: number,
    dateOut: string,
    timeOut: string,
    signOutConfirmed: boolean,
    armourerInCharge: string,
    notes: string,
    signOutFingerprintHash?: string
  ) => void;
}

export const IssueWeaponModal: React.FC<IssueWeaponModalProps> = ({
  show,
  onClose,
  items,
  securityOfficers,
  onIssueItem,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedSecurityOfficerId, setSelectedSecurityOfficerId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [ammoRoundsOut, setAmmoRoundsOut] = useState(30);
  const [dateOut, setDateOut] = useState(new Date().toISOString().split("T")[0]);
  const [timeOut, setTimeOut] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  const [signOutConfirmed, setSignOutConfirmed] = useState(false);
  const [armourerInCharge, setArmourerInCharge] = useState("James Mugisha");
  const [issueNotes, setIssueNotes] = useState("");
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);

  const availableSecurityOfficers = securityOfficers.filter((g) => g.status === "On Duty" || g.status === "Off Duty");

  const handleSelectSecurityOfficerForIssue = (forceNumber: string) => {
    setSelectedSecurityOfficerId(forceNumber);
    const securityOfficer = securityOfficers.find((g) => g.id === forceNumber);
    if (securityOfficer && securityOfficer.assignedSite) {
      setLocationName(securityOfficer.assignedSite);
    }
  };

  const resetForm = () => {
    setSelectedAssetId("");
    setSelectedSecurityOfficerId("");
    setLocationName("");
    setIssueNotes("");
    setFingerprintHash(null);
    setSignOutConfirmed(false);
  };

  const handleFingerprintCaptured = (hash: string) => {
    setFingerprintHash(hash);
    setSignOutConfirmed(true);
    setShowFingerprintModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedSecurityOfficerId) return;
    onIssueItem(
      selectedAssetId,
      selectedSecurityOfficerId,
      locationName,
      Number(ammoRoundsOut),
      dateOut,
      timeOut,
      signOutConfirmed,
      armourerInCharge,
      issueNotes,
      fingerprintHash || undefined
    );
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Issue Weapon & Fingerprint Sign Out</h3>
              <p className="text-xs text-slate-500">Armory Dispatch Logbook — Biometric Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                1. Firearm / Asset (Serial Number) *
              </label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Available Weapon --</option>
                {items
                  .filter((i) => i.availableQuantity > 0)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.serialNumber}] {item.name} ({item.category})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                2. Name of Security Officer *
              </label>
              <select
                required
                value={selectedSecurityOfficerId}
                onChange={(e) => handleSelectSecurityOfficerForIssue(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Assignee Security Officer --</option>
                {availableSecurityOfficers.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.forceNumber}) - {g.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              3. Name of Location (Post / Duty Site) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bank of East Africa HQ - Main Gate"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                4. Rounds Out *
              </label>
              <input
                type="number"
                required
                min={0}
                value={ammoRoundsOut}
                onChange={(e) => setAmmoRoundsOut(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                5. Date Out *
              </label>
              <input
                type="date"
                required
                value={dateOut}
                onChange={(e) => setDateOut(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                6. Time Out *
              </label>
              <input
                type="text"
                required
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                placeholder="e.g. 05:45 AM"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="block font-bold text-slate-800">7. Fingerprint Sign Out</span>
                  <span className="text-[10px] text-slate-500">Biometric authentication via Mantra MFS100</span>
                </div>
                {fingerprintHash && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              {fingerprintHash ? (
                <div className="mt-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" />
                    Captured — {fingerprintHash.slice(0, 24)}...
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFingerprintModal(true)}
                  className="w-full mt-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  Capture Fingerprint & Sign Out
                </button>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                8. Armoury Incharge (Officer) *
              </label>
              <input
                type="text"
                required
                value={armourerInCharge}
                onChange={(e) => setArmourerInCharge(e.target.value)}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dispatch Notes / Deployment Orders
            </label>
            <textarea
              rows={2}
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
              placeholder="e.g. Cleared for high-value escort duty..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fingerprintHash}
              className={`px-5 py-2 rounded-xl font-bold shadow-md transition-all ${
                fingerprintHash
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Confirm Issue & Log Entry
            </button>
          </div>
        </form>
      </div>

      <FingerprintCaptureModal
        show={showFingerprintModal}
        onClose={() => setShowFingerprintModal(false)}
        onCapture={handleFingerprintCaptured}
        label="Sign Out"
      />
    </div>
  );
};
