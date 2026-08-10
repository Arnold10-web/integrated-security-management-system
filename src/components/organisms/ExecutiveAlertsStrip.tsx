import React from "react";
import { AlertTriangle, AlertCircle, DollarSign } from "lucide-react";

interface ExecutiveAlertsStripProps {
  criticalIncidents: number;
  nonCompliantSites: number;
  suspendedGuards: number;
  overdueRevenue: number;
  onNavigate: (tabId: string) => void;
}

export const ExecutiveAlertsStrip: React.FC<ExecutiveAlertsStripProps> = ({
  criticalIncidents,
  nonCompliantSites,
  suspendedGuards,
  overdueRevenue,
  onNavigate,
}) => {
  if (!(criticalIncidents > 0 || nonCompliantSites > 0 || suspendedGuards > 0 || overdueRevenue > 0)) return null;

  return (
    <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 space-y-2">
      <div className="flex items-center gap-2 text-rose-700 text-xs font-black uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4" />
        <span>Items Requiring Executive Attention</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {criticalIncidents > 0 && (
          <button onClick={() => onNavigate("operations")} className="flex items-center gap-2 p-2.5 bg-rose-50 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors text-left cursor-pointer">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-[11px]">
              <span className="font-black text-rose-800">{criticalIncidents}</span>
              <span className="text-rose-600 ml-1">Critical Incident(s) Open</span>
              <span className="block text-[10px] text-rose-500 mt-0.5">Review →</span>
            </div>
          </button>
        )}
        {nonCompliantSites > 0 && (
          <button onClick={() => onNavigate("clients")} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors text-left cursor-pointer">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-[11px]">
              <span className="font-black text-amber-800">{nonCompliantSites}</span>
              <span className="text-amber-600 ml-1">Client Site(s) SLA Non-Compliant</span>
              <span className="block text-[10px] text-amber-500 mt-0.5">Review →</span>
            </div>
          </button>
        )}
        {suspendedGuards > 0 && (
          <button onClick={() => onNavigate("hr")} className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors text-left cursor-pointer">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
            <div className="text-[11px]">
              <span className="font-black text-orange-800">{suspendedGuards}</span>
              <span className="text-orange-600 ml-1">Guard(s) Suspended</span>
              <span className="block text-[10px] text-orange-500 mt-0.5">Review →</span>
            </div>
          </button>
        )}
        {overdueRevenue > 0 && (
          <button onClick={() => onNavigate("finance")} className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors text-left cursor-pointer">
            <DollarSign className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-[11px]">
              <span className="font-black text-red-800">UGX {overdueRevenue.toLocaleString()}</span>
              <span className="text-red-600 ml-1">Overdue Invoices</span>
              <span className="block text-[10px] text-red-500 mt-0.5">Review →</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
