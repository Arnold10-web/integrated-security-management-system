import React, { useState } from "react";
import { HardDrive } from "lucide-react";
import type { ITAsset } from "../../types";

interface AddAssetModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (asset: Omit<ITAsset, "id" | "assetCode">) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ show, onClose, onSubmit }) => {
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState<ITAsset["category"]>("Workstation / Laptop");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetAssignedTo, setAssetAssignedTo] = useState("");
  const [assetDepartment, setAssetDepartment] = useState("Operations Department");
  const [assetPurchaseDate, setAssetPurchaseDate] = useState("2026-01-10");
  const [assetWarrantyDate, setAssetWarrantyDate] = useState("2028-01-10");
  const [assetValueUgx, setAssetValueUgx] = useState<number>(4500000);
  const [assetCondition, setAssetCondition] = useState<ITAsset["condition"]>("Operational");
  const [assetSpecs, setAssetSpecs] = useState("");
  const [assetHostIp, setAssetHostIp] = useState("");
  const [assetNotes, setAssetNotes] = useState("");

  const resetFields = () => {
    setAssetName("");
    setAssetCategory("Workstation / Laptop");
    setAssetSerial("");
    setAssetAssignedTo("");
    setAssetDepartment("Operations Department");
    setAssetPurchaseDate("2026-01-10");
    setAssetWarrantyDate("2028-01-10");
    setAssetValueUgx(4500000);
    setAssetCondition("Operational");
    setAssetSpecs("");
    setAssetHostIp("");
    setAssetNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: assetName,
      category: assetCategory,
      serialNumberOrKey: assetSerial,
      assignedToPersonOrStation: assetAssignedTo || "IT Store - Unassigned",
      assignedDepartment: assetDepartment,
      purchaseDate: assetPurchaseDate,
      warrantyExpiryDate: assetWarrantyDate,
      valueUgx: Number(assetValueUgx) || 0,
      condition: assetCondition,
      softwareVersionOrSpecs: assetSpecs,
      ipAddressOrHost: assetHostIp,
      notes: assetNotes,
    });
    resetFields();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            Register New IT Hardware / Software Asset
          </h3>
          <button onClick={onClose} className="text-slate-400 text-sm font-bold hover:text-slate-600 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Asset Name / Description</label>
            <input type="text" required placeholder="e.g., Lenovo ThinkPad P16 Workstation, Hikvision NVR, Kaspersky License"
              value={assetName} onChange={(e) => setAssetName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select value={assetCategory} onChange={(e) => setAssetCategory(e.target.value as ITAsset["category"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500">
                <option value="Workstation / Laptop">Workstation / Laptop</option>
                <option value="CCTV & Surveillance">CCTV & Surveillance</option>
                <option value="Biometric & Access Control">Biometric & Access Control</option>
                <option value="Patrol Radio & Communications">Patrol Radio & Communications</option>
                <option value="Server & Networking">Server & Networking</option>
                <option value="Software License & SaaS">Software License & SaaS</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Serial Number / Software Key</label>
              <input type="text" required placeholder="e.g., SN-88291X or LICENSE-KEY-123"
                value={assetSerial} onChange={(e) => setAssetSerial(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500 font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Person or Station</label>
              <input type="text" placeholder="e.g., Operations Manager / Kampala Vault Gate"
                value={assetAssignedTo} onChange={(e) => setAssetAssignedTo(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select value={assetDepartment} onChange={(e) => setAssetDepartment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500">
                <option value="Operations Department">Operations Department</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Purchase Date</label>
              <input type="date" value={assetPurchaseDate} onChange={(e) => setAssetPurchaseDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Asset Value (UGX)</label>
              <input type="number" value={assetValueUgx} onChange={(e) => setAssetValueUgx(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Condition Status</label>
              <select value={assetCondition} onChange={(e) => setAssetCondition(e.target.value as ITAsset["condition"])}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500">
                <option value="Operational">Operational</option>
                <option value="In Repair">In Repair</option>
                <option value="Upgrade Required">Upgrade Required</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">IP Address / Hostname (Optional)</label>
              <input type="text" placeholder="e.g., 192.168.10.45"
                value={assetHostIp} onChange={(e) => setAssetHostIp(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500 font-mono" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tech Specs / Software Version</label>
            <input type="text" placeholder="e.g., Core i7 32GB RAM, Firmware v4.2, 50-Node SaaS"
              value={assetSpecs} onChange={(e) => setAssetSpecs(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Warranty Details</label>
            <textarea rows={2} placeholder="Additional notes, warranty contact, or maintenance log..."
              value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-indigo-500" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-md">Save IT Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
};
