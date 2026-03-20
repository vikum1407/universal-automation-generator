import { useEffect, useState } from "react";
import { StabilityAPI } from "../api/stability";
import type { DashboardResponse } from "../api/stability";

import { ScoreGauge } from "../components/ScoreGauge";
import { ReadinessIndicator } from "../components/ReadinessIndicator";
import { GuardrailCard } from "../components/GuardrailCard";
import { TrendChart } from "../components/TrendChart";
import { StabilizationPanel } from "../components/StabilizationPanel";

export function DashboardPage({ project }: { project: string }) {
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    StabilityAPI.getDashboard(project).then(setData);
  }, [project]);

  if (!data) return <div className="p-8 dark:text-gray-200">Loading dashboard…</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-12 dark:bg-gray-900 dark:text-gray-200 min-h-screen">
      <h1 className="text-3xl font-bold">{data.project} Stability Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreGauge score={data.score} />
        <ReadinessIndicator readiness={data.readiness} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Guardrails</h2>
        <div className="flex flex-wrap gap-4">
          {data.guardrails.map((g: any, i: number) => (
            <GuardrailCard key={i} guardrail={g} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Trends</h2>
        <TrendChart
          riskTrend={data.contexts.guardrails.riskTrend}
          flakiness={data.contexts.guardrails.flakiness}
        />
      </div>

      <StabilizationPanel project={project} />
    </div>
  );
}
