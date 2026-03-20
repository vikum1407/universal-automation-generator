import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

export function TrendChart({
  riskTrend,
  flakiness
}: {
  riskTrend: any[];
  flakiness: any[];
}) {
  const merged = (riskTrend || []).map((r, i) => ({
    date: r.date,
    risk: r.value,
    flakiness: flakiness?.[i]?.value ?? null
  }));

  return (
    <div className="bg-white border rounded-lg shadow p-6 w-full h-80">
      <h3 className="text-lg font-semibold mb-4">Risk & Flakiness Trends</h3>

      <ResponsiveContainer>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300" />
          <XAxis dataKey="date" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip />
          <Legend />

          <Line
            type="monotone"
            dataKey="risk"
            stroke="#ef4444"   // red-500
            strokeWidth={2}
            dot={false}
            name="Risk Trend"
          />

          <Line
            type="monotone"
            dataKey="flakiness"
            stroke="#3b82f6"   // blue-500
            strokeWidth={2}
            dot={false}
            name="Flakiness Trend"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
