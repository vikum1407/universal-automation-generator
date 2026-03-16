import { Card } from "../../../components/Card";

type Props = {
  improvements: string[];
  regressions: string[];
  riskDrops: string[];
  riskSpikes: string[];
};

export function HighlightList({
  improvements,
  regressions,
  riskDrops,
  riskSpikes
}: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Highlights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            Improvements
          </p>
          <ul className="list-disc list-inside">
            {improvements.map(i => (
              <li key={i}>{i}</li>
            ))}
          </ul>

          <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-4">
            Risk Drops
          </p>
          <ul className="list-disc list-inside">
            {riskDrops.map(i => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-rose-600 dark:text-rose-400">
            Regressions
          </p>
          <ul className="list-disc list-inside">
            {regressions.map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <p className="font-semibold text-rose-600 dark:text-rose-400 mt-4">
            Risk Spikes
          </p>
          <ul className="list-disc list-inside">
            {riskSpikes.map(r => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
