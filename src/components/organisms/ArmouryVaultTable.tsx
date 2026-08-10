import React from "react";
import { Filter, CheckCircle2 } from "lucide-react";
import type { ArmouryItem } from "../../types";

interface ArmouryVaultTableProps {
  items: ArmouryItem[];
  filteredItems: ArmouryItem[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

export const ArmouryVaultTable: React.FC<ArmouryVaultTableProps> = ({
  filteredItems,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Armoury Vault & Storage Balance</h3>
          <p className="text-xs text-slate-500">Live vault counts for registered firearms, ammunition, and gear</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {["All", "Firearm", "Ammunition", "Body Armor", "Communications"].map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="py-3 px-4">Asset Tag</th>
              <th className="py-3 px-4">Firearm / Item Name</th>
              <th className="py-3 px-4">Serial Number</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Vault Qty / Available</th>
              <th className="py-3 px-4">Condition</th>
              <th className="py-3 px-4">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{item.assetTag}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                <td className="py-3 px-4 font-mono text-blue-700 font-bold">{item.serialNumber}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                    {item.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-extrabold text-slate-900">
                  {item.availableQuantity} / {item.totalQuantity}
                </td>
                <td className="py-3 px-4">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {item.condition}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      item.location === "Main Vault"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.location}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
