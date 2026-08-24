import React, { useMemo } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line,
} from "recharts";
import { useDomainStore } from "../../../stores/domainStore";
import { monthlyTrend } from "../../../utils/executiveStats";
import type { StatsFilters } from "../../../utils/executiveStats";
import { PanelShell } from "./PanelShell";

const AXIS = { fontSize: 10, fontWeight: 700 as const, fill: "#64748b" };

/** Two-up trend charts: incidents per month, desertions per month with rate context. */
export const TrendsPanel: React.FC<{ filters: StatsFilters }> = ({ filters }) => {
  const incidents = useDomainStore((s) => s.incidents);
  const officers = useDomainStore((s) => s.securityOfficers);

  const incidentData = useMemo(
    () => monthlyTrend(incidents.map((i) => ({ date: i.incidentDate })), 6),
    [incidents]
  );

  const desertionData = useMemo(() => {
    const points = monthlyTrend(officers.filter((o) => o.isDeserter).map((o) => ({ date: o.desertionDate ?? o.terminationDate })), 6);
    return points;
  }, [officers]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <PanelShell icon={<BarChart3 className="w-4 h-4 text-cyan-600" />} title="Incidents per Month" badge="last 6 months" badgeTone="slate">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incidentData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: 700 }} />
              <Bar dataKey="count" name="Incidents" fill="#0891b2" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelShell>

      <PanelShell icon={<TrendingUp className="w-4 h-4 text-rose-500" />} title="Desertions per Month" badge="last 6 months" badgeTone="slate">
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={desertionData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(148,163,184,0.12)" }} contentStyle={{ fontSize: 11, borderRadius: 12, border: "1px solid #e2e8f0", fontWeight: 700 }} />
              <Bar dataKey="count" name="Desertions" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Line type="monotone" dataKey="count" name="Trend" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </PanelShell>
    </div>
  );
};
