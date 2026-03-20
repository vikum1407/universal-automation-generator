import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ScoreGauge({ score }: { score: any }) {
  const value = score?.value ?? 0;

  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value }
  ];

  const color =
    value >= 80 ? "#22c55e" : // green-500
    value >= 60 ? "#f59e0b" : // amber-500
    "#ef4444";               // red-500

  return (
    <div className="bg-white border rounded-lg shadow p-6 flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-4">Stability Score</h2>

      <div className="w-60 h-40">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              <Cell fill={color} />
              <Cell fill="#e5e7eb" /> {/* gray-200 */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-4xl font-bold -mt-4">{value}</div>
    </div>
  );
}
