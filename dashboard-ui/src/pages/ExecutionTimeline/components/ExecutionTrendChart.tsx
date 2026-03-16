import { Card } from "../../../components/Card";

export default function ExecutionTrendChart({ trends }: { trends: any }) {
  if (!trends) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Execution Trends</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendBlock title="Pass Rate Trend" data={trends.passRateTrend} />
        <TrendBlock title="Failure Trend" data={trends.failureTrend} />
        <TrendBlock title="Release Readiness Score" data={trends.rrsTrend} />
        <TrendBlock title="Execution Stability" data={trends.executionStability} />
      </div>
    </Card>
  );
}

function TrendBlock({ title, data }: { title: string; data: any[] }) {
  return (
    <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded">
      <h3 className="font-semibold mb-2">{title}</h3>
      <pre className="text-xs bg-gray-900 text-gray-200 p-3 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
