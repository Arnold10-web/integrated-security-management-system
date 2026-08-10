import React, { useState } from "react";
import { Car, Fuel, Wrench, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, AreaChart, BarChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";

interface DashData {
  date: string; fuelLitres: number; distanceKm: number;
  efficiencyKmL: number; fuelCostUgx: number; costPerKm: number;
}

interface FleetDashboardPanelProps {
  totalVehicles: number;
  operationalVehicles: number;
  inServiceVehicles: number;
  totalFuelUgx: number;
  fuelLogsLength: number;
  maintenanceLogsLength: number;
  fleet30DayData: DashData[];
  total30DayFuel: number;
  total30DayDistance: number;
  avg30DayEfficiency: string;
  total30DayCost: number;
  avgCostPerKm: number;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-2 z-50 min-w-[200px]">
      <p className="font-extrabold text-blue-400 border-b border-slate-800 pb-1 flex items-center justify-between">
        <span>{label}</span><span className="text-[10px] text-slate-400">Fleet Operations</span>
      </p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            {entry.name}:
          </span>
          <span className="font-mono font-black text-white">
            {entry.name.includes("Cost") || entry.name.includes("Expenditure")
              ? `UGX ${Number(entry.value).toLocaleString()}`
              : entry.name.includes("Efficiency") || entry.name.includes("KM/L")
              ? `${entry.value} KM/L`
              : entry.name.includes("Distance") || entry.name.includes("Mileage")
              ? `${Number(entry.value).toLocaleString()} KM`
              : `${Number(entry.value).toLocaleString()} Litres`}
          </span>
        </div>
      ))}
    </div>
  );
};

export const FleetDashboardPanel: React.FC<FleetDashboardPanelProps> = ({
  totalVehicles, operationalVehicles, inServiceVehicles, totalFuelUgx,
  fuelLogsLength, maintenanceLogsLength, fleet30DayData,
  total30DayFuel, total30DayDistance, avg30DayEfficiency, total30DayCost, avgCostPerKm,
}) => {
  const [chartMetric, setChartMetric] = useState<"combined" | "efficiency" | "cost">("combined");

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Total Fleet Units</span>
            <div className="text-2xl font-black text-slate-900">{totalVehicles} Units</div>
            <span className="text-[10px] text-slate-500 font-semibold">Active Inventory</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Car className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Fleet Readiness Rate</span>
            <div className="text-2xl font-black text-emerald-600">{totalVehicles > 0 ? Math.round((operationalVehicles / totalVehicles) * 100) : 100}%</div>
            <span className="text-[10px] text-slate-500 font-semibold">{operationalVehicles} Ready on Duty</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Fuel Consumption YTD</span>
            <div className="text-2xl font-black text-slate-900">UGX {(totalFuelUgx / 1000000).toFixed(2)}M</div>
            <span className="text-[10px] text-blue-600 font-bold">{fuelLogsLength} Refill Vouchers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><Fuel className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">Workshop & Maintenance</span>
            <div className="text-2xl font-black text-rose-600">{inServiceVehicles} Units</div>
            <span className="text-[10px] text-slate-500 font-semibold">{maintenanceLogsLength} Active Work Orders</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600"><Wrench className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><BarChart3 className="w-5 h-5" /></div>
              <h3 className="text-base font-black text-slate-900">30-Day Fleet Fuel Consumption & Mileage Efficiency</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">Visualizing fuel issuance trends, total distance logged (KM), and overall km/litre fuel economy index across all vehicles.</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            {(["combined","efficiency","cost"] as const).map((m) => (
              <button key={m} onClick={() => setChartMetric(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chartMetric === m ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                {m === "combined" ? "Combined Trend" : m === "efficiency" ? "Efficiency Index (KM/L)" : "Fuel Expenditure"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Fleet Fuel Economy</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">{avg30DayEfficiency} KM/L</div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5"><TrendingUp className="w-3 h-3" /> Target &gt; 8.0 KM/L Optimal</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[10px] font-extrabold uppercase text-amber-600 block">30-Day Fuel Issued</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">{total30DayFuel.toLocaleString()} Litres</div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Across active units</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">30-Day Patrol Mileage</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{total30DayDistance.toLocaleString()} KM</div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Logbook Journey Total</span>
          </div>
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
            <span className="text-[10px] font-extrabold uppercase text-purple-600 block">Operational Cost / KM</span>
            <div className="text-xl font-black text-purple-900 mt-0.5">UGX {avgCostPerKm} / KM</div>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">UGX {(total30DayCost / 1000000).toFixed(2)}M Total</span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === "combined" ? (
              <ComposedChart data={fleet30DayData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs><linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} label={{ value: "Fuel (Litres)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#f59e0b" }} />
                <YAxis yAxisId="right" orientation="right" domain={[6, 12]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} label={{ value: "Efficiency (KM/L)", angle: 90, position: "insideRight", fontSize: 10, fill: "#10b981" }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Area yAxisId="left" type="monotone" dataKey="fuelLitres" name="Fuel Issued (Litres)" fill="url(#fuelGrad)" stroke="#f59e0b" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="efficiencyKmL" name="Fleet Efficiency (KM/L)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            ) : chartMetric === "efficiency" ? (
              <AreaChart data={fleet30DayData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs><linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                <YAxis domain={[5, 12]} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} />
                <ReferenceLine y={8.0} stroke="#2563eb" strokeDasharray="4 4" label={{ value: "Target Benchmark (8.0 KM/L)", fill: "#2563eb", fontSize: 10, position: "top" }} />
                <Area type="monotone" dataKey="efficiencyKmL" name="Efficiency (KM/L)" stroke="#10b981" strokeWidth={3} fill="url(#effGrad)" dot={{ r: 3 }} />
              </AreaChart>
            ) : (
              <BarChart data={fleet30DayData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} tickFormatter={(val) => `UGX ${(val / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="fuelCostUgx" name="Daily Fuel Expenditure" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-500 text-[11px] uppercase">Vehicle Category Efficiency Averages:</span>
          <div className="flex flex-wrap items-center gap-2">
            {[["Patrol SUVs","8.2 KM/L","blue"],["Motorcycles","32.5 KM/L","emerald"],["Armored CIT","4.8 KM/L","amber"],["Crew Vans","7.1 KM/L","purple"]].map(([cat, val, col]) => (
              <span key={cat as string} className={`px-2.5 py-1 rounded-lg bg-${col}-50 text-${col}-800 font-bold border border-${col}-200 text-[11px]`}>{cat}: {val}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
