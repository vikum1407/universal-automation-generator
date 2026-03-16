import { Card } from "../../../components/Card";
import type { ReleaseHeatmapData, HeatmapCell } from "../hooks/useReleaseHeatmap";

type Props = {
  data: ReleaseHeatmapData;
};

function getColor(risk: HeatmapCell["risk"]) {
  if (risk === "high") return "bg-rose-500";
  if (risk === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export function HeatmapGrid({ data }: Props) {
  const { journeys, components, cells } = data;

  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach(c => {
    cellMap.set(`${c.journey}::${c.component}`, c);
  });

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Release Heatmap
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="py-2 pr-4 text-left text-gray-700 dark:text-slate-200">
                Journey
              </th>
              {components.map(c => (
                <th
                  key={c}
                  className="py-2 px-2 text-center text-gray-700 dark:text-slate-200 capitalize"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {journeys.map(j => (
              <tr key={j} className="border-t border-gray-100 dark:border-slate-800">
                <td className="py-2 pr-4 text-gray-800 dark:text-slate-100 capitalize">
                  {j}
                </td>
                {components.map(c => {
                  const cell = cellMap.get(`${j}::${c}`);
                  if (!cell) {
                    return (
                      <td key={c} className="py-2 px-2 text-center text-gray-400">
                        -
                      </td>
                    );
                  }
                  return (
                    <td key={c} className="py-2 px-2 text-center">
                      <div
                        className={`mx-auto w-7 h-7 rounded ${getColor(
                          cell.risk
                        )} text-[10px] flex items-center justify-center text-white`}
                        title={`${j} × ${c} — score ${cell.score}`}
                      >
                        {cell.score}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
