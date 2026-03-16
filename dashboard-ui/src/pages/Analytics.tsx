import { useEffect, useState } from "react";
import { DashboardAPI } from "../api/dashboard";
import type { JourneyCoverageMap } from "../api/dashboard";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";

interface Journey {
  id: string;
  title: string;
  risk?: { priority: "P0" | "P1" | "P2"; score?: number };
}

export default function Analytics() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [coverage, setCoverage] = useState<JourneyCoverageMap | null>(null);

  useEffect(() => {
    DashboardAPI.journeys().then((data) => {
      setJourneys(data as Journey[]);
    });
    DashboardAPI.journeyCoverage().then((data) => {
      setCoverage(data);
    });
  }, []);

  const total = journeys.length;
  const p0 = journeys.filter(j => j.risk?.priority === "P0").length;
  const p1 = journeys.filter(j => j.risk?.priority === "P1").length;
  const p2 = journeys.filter(j => j.risk?.priority === "P2").length;

  const pages = coverage ? Object.entries(coverage.pages) : [];
  const transitions = coverage ? Object.entries(coverage.transitions) : [];

  const maxPageCount = pages.reduce((m, [, c]) => Math.max(m, c), 0) || 1;
  const maxTransitionCount = transitions.reduce((m, [, c]) => Math.max(m, c), 0) || 1;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Risk distribution and journey coverage insights"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Total Journeys</h2>
          <div className="text-3xl font-bold">{total}</div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Risk Distribution</h2>
          <div className="space-y-2">
            <RiskBar label="P0" count={p0} total={total} color="bg-red-500" />
            <RiskBar label="P1" count={p1} total={total} color="bg-yellow-500" />
            <RiskBar label="P2" count={p2} total={total} color="bg-green-500" />
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Unique Pages & Transitions</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div><span className="font-semibold">{pages.length}</span> pages</div>
            <div><span className="font-semibold">{transitions.length}</span> transitions</div>
            <div><span className="font-semibold">{coverage?.journeys ?? 0}</span> journeys in map</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Page Frequency</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pages.map(([page, count]) => (
              <BarRow
                key={page}
                label={page}
                count={count}
                max={maxPageCount}
                color="bg-blue-500"
              />
            ))}
            {pages.length === 0 && (
              <div className="text-gray-500 text-sm">No page data available.</div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Transition Frequency</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transitions.map(([transition, count]) => (
              <BarRow
                key={transition}
                label={transition}
                count={count}
                max={maxTransitionCount}
                color="bg-purple-500"
              />
            ))}
            {transitions.length === 0 && (
              <div className="text-gray-500 text-sm">No transition data available.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function RiskBar({
  label,
  count,
  total,
  color
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className={`${color} h-2 rounded`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
  color
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max ? (count / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="truncate max-w-[70%]" title={label}>{label}</span>
        <span>{count}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div
          className={`${color} h-2 rounded`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
