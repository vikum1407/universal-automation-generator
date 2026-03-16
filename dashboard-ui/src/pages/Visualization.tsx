import { PageHeader } from "../components/PageHeader";

export default function Visualization() {
  return (
    <div>
      <PageHeader title="Visualizations" subtitle="Journey and coverage maps" />

      <div className="space-y-6">
        <img src="/journeys.svg" alt="Journey Graph" className="w-full border rounded" />
        <img src="/coverage.svg" alt="Coverage Graph" className="w-full border rounded" />
      </div>
    </div>
  );
}
