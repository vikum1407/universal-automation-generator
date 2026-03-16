import { useEffect, useState } from "react";
import { DashboardAPI } from "../api/dashboard";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";

export default function Insights() {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    DashboardAPI.journeyInsights().then((data) => {
      setInsights(data as string[]);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Insights" subtitle="AI‑generated QA insights" />

      <Card>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {insights.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
