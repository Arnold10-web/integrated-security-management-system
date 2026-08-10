import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { ArmouryItem } from "../../types";

interface AddArmouryItemModalProps {
  show: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<ArmouryItem, "id">) => void;
}

export const AddArmouryItemModal: React.FC<AddArmouryItemModalProps> = ({ show, onClose, onAddItem }) => {
  const [newAssetTag, setNewAssetTag] = useState("");
  const [newSerial, setNewSerial] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ArmouryItem["category"]>("Firearm");
  const [newSpecs, setNewSpecs] = useState("9x19mm");
  const [newQty, setNewQty] = useState(1);

  const resetForm = () => {
    setNewAssetTag("");
    setNewSerial("");
    setNewName("");
    setNewCategory("Firearm");
    setNewSpecs("9x19mm");
    setNewQty(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial || !newName || !newAssetTag) return;
    onAddItem({
      assetTag: newAssetTag,
      serialNumber: newSerial,
      category: newCategory,
      name: newName,
      caliberOrSpecs: newSpecs,
      totalQuantity: Number(newQty),
      availableQuantity: Number(newQty),
      condition: "Excellent",
      location: "Main Vault",
    });
    resetForm();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-900" />
            Register New Asset into Armoury
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asset Tag</label>
              <input
                type="text"
                required
                placeholder="e.g. ARM-GLK-010"
                value={newAssetTag}
                onChange={(e) => setNewAssetTag(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                required
                placeholder="e.g. UG-POL-GLK9930"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Asset Name / Model</label>
            <input
              type="text"
              required
              placeholder="e.g. Glock 17 Gen 5 9mm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ArmouryItem["category"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Firearm">Firearm</option>
                <option value="Ammunition">Ammunition</option>
                <option value="Body Armor">Body Armor</option>
                <option value="Tactical Gear">Tactical Gear</option>
                <option value="Communications">Communications</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Quantity</label>
              <input
                type="number"
                min={1}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Specifications / Caliber</label>
            <input
              type="text"
              value={newSpecs}
              onChange={(e) => setNewSpecs(e.target.value)}
              placeholder="e.g. 9x19mm Parabellum"
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
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Save to Vault Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
