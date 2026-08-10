import React, { useState } from "react";
import { X, ShieldAlert } from "lucide-react";
import type { ArmouryItem, Guard } from "../../types";

interface IssueWeaponModalProps {
  show: boolean;
  onClose: () => void;
  items: ArmouryItem[];
  guards: Guard[];
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
}

export const IssueWeaponModal: React.FC<IssueWeaponModalProps> = ({
  show,
  onClose,
  items,
  guards,
  onIssueItem,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedGuardId, setSelectedGuardId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [ammoRoundsOut, setAmmoRoundsOut] = useState(30);
  const [dateOut, setDateOut] = useState(new Date().toISOString().split("T")[0]);
  const [timeOut, setTimeOut] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
  );
  const [signOutConfirmed, setSignOutConfirmed] = useState(true);
  const [armourerInCharge, setArmourerInCharge] = useState("James Mugisha");
  const [issueNotes, setIssueNotes] = useState("");

  const availableGuards = guards.filter((g) => g.status === "On Duty" || g.status === "Off Duty");

  const handleSelectGuardForIssue = (guardId: string) => {
    setSelectedGuardId(guardId);
    const guard = guards.find((g) => g.id === guardId);
    if (guard && guard.assignedSite) {
      setLocationName(guard.assignedSite);
    }
  };

  const resetForm = () => {
    setSelectedAssetId("");
    setSelectedGuardId("");
    setLocationName("");
    setIssueNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedGuardId) return;
    onIssueItem(
      selectedAssetId,
      selectedGuardId,
      locationName,
      Number(ammoRoundsOut),
      dateOut,
      timeOut,
      signOutConfirmed,
      armourerInCharge,
      issueNotes
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
              <h3 className="text-base font-black text-slate-900">Issue Weapon & Sign Out Log</h3>
              <p className="text-xs text-slate-500">Armory Dispatch Logbook Entry</p>
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
                2. Name of Guard *
              </label>
              <select
                required
                value={selectedGuardId}
                onChange={(e) => handleSelectGuardForIssue(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Assignee Guard --</option>
                {availableGuards.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.guardCode}) - {g.designation}
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="block font-bold text-slate-800">7. Guard Sign Out</span>
                <span className="text-[10px] text-slate-500">Guard accepts firearm & ammo</span>
              </div>
              <input
                type="checkbox"
                checked={signOutConfirmed}
                onChange={(e) => setSignOutConfirmed(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Confirm Issue & Log Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
