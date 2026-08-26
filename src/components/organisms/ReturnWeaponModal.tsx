import React, { useState, useEffect } from "react";
import { X, PackageCheck, Fingerprint, CheckCircle2 } from "lucide-react";
import type { ArmouryLog } from "../../types";
import { FingerprintCaptureModal } from "./FingerprintCaptureModal";

interface ReturnWeaponModalProps {
  show: boolean;
  log: ArmouryLog | null;
  onClose: () => void;
  onReturnItem: (
    logId: string,
    ammoRoundsIn: number,
    dateIn: string,
    timeIn: string,
    signInConfirmed: boolean,
    substituteReceiver?: string,
    notes?: string,
    fingerprintHash?: string
  ) => void;
}

export const ReturnWeaponModal: React.FC<ReturnWeaponModalProps> = ({
  show,
  log,
  onClose,
  onReturnItem,
}) => {
  const [ammoRoundsIn, setAmmoRoundsIn] = useState(30);
  const [dateIn, setDateIn] = useState(new Date().toISOString().split("T")[0]);
  const [timeIn, setTimeIn] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  const [signInConfirmed, setSignInConfirmed] = useState(false);
  const [substituteReceiver, setSubstituteReceiver] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);

  useEffect(() => {
    if (log) {
      setAmmoRoundsIn(log.ammoRoundsOut);
      setDateIn(new Date().toISOString().split("T")[0]);
      setTimeIn(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      setSubstituteReceiver("");
      setReturnNotes("Firearm & ammunition inspected, weapon cleared and safe.");
      setFingerprintHash(null);
      setSignInConfirmed(false);
    }
  }, [log]);

  const handleFingerprintCaptured = (hash: string) => {
    setFingerprintHash(hash);
    setSignInConfirmed(true);
    setShowFingerprintModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!log) return;
    onReturnItem(
      log.id,
      Number(ammoRoundsIn),
      dateIn,
      timeIn,
      signInConfirmed,
      substituteReceiver || "Self (Assigned Security Officer)",
      returnNotes,
      fingerprintHash || undefined
    );
    onClose();
  };

  if (!show || !log) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Weapon Return & Fingerprint Sign In</h3>
              <p className="text-xs text-slate-500">Log Serial: {log.serialNumberLog} — Biometric Authentication</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-400 block text-[10px]">Firearm Serial:</span>
            <span className="font-bold text-blue-700">{log.firearmSerialNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Issued To Security Officer:</span>
            <span className="font-bold text-slate-900">{log.securityOfficerName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Duty Location:</span>
            <span className="font-bold text-slate-800">{log.locationName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Rounds Issued Out:</span>
            <span className="font-bold text-amber-700">{log.ammoRoundsOut} rounds</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                1. Date In *
              </label>
              <input
                type="date"
                required
                value={dateIn}
                onChange={(e) => setDateIn(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                2. Time In *
              </label>
              <input
                type="text"
                required
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                placeholder="e.g. 18:15 PM"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                3. Round In (Ammo Returned) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={ammoRoundsIn}
                onChange={(e) => setAmmoRoundsIn(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              4. Substitute Receiver (If returned by replacement officer)
            </label>
            <input
              type="text"
              placeholder="e.g. Self (Leave blank if returned by assigned officer, or enter substitute officer name)"
              value={substituteReceiver}
              onChange={(e) => setSubstituteReceiver(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="block font-bold text-slate-800">5. Fingerprint Sign In</span>
                  <span className="text-[10px] text-slate-500">Biometric verification via Mantra MFS100</span>
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
                  Capture Fingerprint & Sign In
                </button>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                6. Armoury Incharge (Receiving Officer)
              </label>
              <input
                type="text"
                disabled
                value={log.armourerInCharge}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Armoury Inspection Notes
            </label>
            <textarea
              rows={2}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Weapon safety check, clean chamber, zero rounds spent..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Sign In & Close Register Entry
            </button>
          </div>
        </form>
      </div>

      <FingerprintCaptureModal
        show={showFingerprintModal}
        onClose={() => setShowFingerprintModal(false)}
        onCapture={handleFingerprintCaptured}
        label="Sign In"
      />
    </div>
  );
};
