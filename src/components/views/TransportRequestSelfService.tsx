/**
 * Self-service Transport Requests for staff outside the Fleet department
 * (e.g. General Manager / Director): submit a request and track its status.
 * Fleet staff use the full FleetView workspace instead.
 */

import React, { useMemo, useState } from "react";
import { Car, Plus, X } from "lucide-react";
import { useDomainStore } from "../../stores/domainStore";
import { useAuthStore } from "../../stores/authStore";
import type { TransportRequest } from "../../types";

const STATUS_TONE: Record<TransportRequest["status"], string> = {
  "Pending Fleet": "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Declined: "bg-rose-100 text-rose-700",
};

export const TransportRequestSelfService: React.FC = () => {
  const domain = useDomainStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [showModal, setShowModal] = useState(false);

  const myRequests = useMemo(() => {
    const name = currentUser?.name ?? "";
    return domain.transportRequests.filter((t) => t.requestedBy === currentUser?.id || (name !== "" && t.requestedByName === name));
  }, [domain.transportRequests, currentUser]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-wrap justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Fleet</div>
          <h1 className="text-xl font-black mt-1 flex items-center gap-2">
            <Car className="w-5 h-5 text-cyan-400" /> My Transport Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">Request a company vehicle for official travel. The Fleet Manager reviews and assigns.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Request Transport
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-900 text-slate-300 uppercase text-[11px]">
            <tr>
              <th className="text-left px-3 py-2">Request</th>
              <th className="text-left px-3 py-2">Destination</th>
              <th className="text-left px-3 py-2">Purpose</th>
              <th className="text-left px-3 py-2">Travel Date</th>
              <th className="text-left px-3 py-2">Vehicle</th>
              <th className="text-left px-3 py-2">Passengers</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {myRequests.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono font-bold">{t.requestCode}</td>
                <td className="px-3 py-2">{t.destination}</td>
                <td className="px-3 py-2">{t.purpose}</td>
                <td className="px-3 py-2">{t.travelDate}</td>
                <td className="px-3 py-2">{t.vehicleType}</td>
                <td className="px-3 py-2">{t.passengersCount}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${STATUS_TONE[t.status]}`}>{t.status}</span>
                </td>
              </tr>
            ))}
            {myRequests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  No transport requests yet — submit one with “Request Transport”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              domain.addTransportRequest({
                requestedBy: currentUser?.id ?? "",
                requestedByName: currentUser?.name ?? "Directorate User",
                requesterDepartment: (currentUser as { department?: string })?.department ?? "Directorate",
                destination: fd.get("destination") as string,
                purpose: fd.get("purpose") as string,
                travelDate: fd.get("travelDate") as string,
                vehicleType: ((fd.get("vehicleType") as string) || "Any") as "Car" | "Motorcycle" | "Any",
                passengersCount: Number(fd.get("passengersCount") || 1),
              });
              setShowModal(false);
            }}
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-black">Request Transport</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div>
              <label className="font-bold block mb-1">Destination *</label>
              <input name="destination" required className="w-full p-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="font-bold block mb-1">Purpose *</label>
              <input name="purpose" required className="w-full p-2.5 border rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Travel Date *</label>
                <input name="travelDate" type="date" required className="w-full p-2.5 border rounded-xl" />
              </div>
              <div>
                <label className="font-bold block mb-1">Vehicle Type</label>
                <select name="vehicleType" className="w-full p-2.5 border rounded-xl bg-white">
                  <option>Any</option>
                  <option>Car</option>
                  <option>Motorcycle</option>
                </select>
              </div>
            </div>
            <div>
              <label className="font-bold block mb-1">Passengers</label>
              <input name="passengersCount" type="number" min={1} defaultValue={1} className="w-full p-2.5 border rounded-xl" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold cursor-pointer">Submit to Fleet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
