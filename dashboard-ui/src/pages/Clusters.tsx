import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardAPI } from "../api/dashboard";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";

interface Cluster {
  id: string;
  label: string;
  journeys: { id: string; title: string }[];
}

export default function Clusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);

  useEffect(() => {
    DashboardAPI.journeyClusters().then((data) => {
      setClusters(data as Cluster[]);
    });
  }, []);

  return (
    <div>
      <PageHeader title="Journey Clusters" subtitle="Grouped by similarity and intent" />

      <div className="grid grid-cols-1 gap-4">
        {clusters.map(c => (
          <Link key={c.id} to={`/clusters/${c.id}`}>
            <Card>
              <h2 className="text-lg font-medium">{c.label}</h2>
              <p className="text-gray-500 mt-2">{c.journeys.length} journeys</p>

              <ul className="mt-3 text-sm text-gray-700 list-disc pl-5">
                {c.journeys.map(j => (
                  <li key={j.id}>{j.title}</li>
                ))}
              </ul>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
