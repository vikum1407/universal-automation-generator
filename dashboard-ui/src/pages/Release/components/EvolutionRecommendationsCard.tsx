import { Card } from "../../../components/Card";

type Props = {
  recommendations: string[];
};

export function EvolutionRecommendationsCard({ recommendations }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-slate-100">
        Long‑term Recommendations
      </h2>

      {recommendations.length === 0 ? (
        <p className="text-sm text-gray-700 dark:text-slate-200">
          No specific long‑term risks detected. Keep monitoring trends across releases.
        </p>
      ) : (
        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-slate-200 space-y-1">
          {recommendations.map(r => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
