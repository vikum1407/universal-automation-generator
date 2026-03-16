import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardAPI } from "../api/dashboard";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RiskBadge } from "../components/RiskBadge";

interface Journey {
  id: string;
  title: string;
  risk?: { priority: "P0" | "P1" | "P2" };
}

interface Cluster {
  id: string;
  label: string;
  journeys: Journey[];
}

export default function ClusterDetails() {
  const { id } = useParams();
  const [cluster, setCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    if (!id) return;
    DashboardAPI.cluster(id).then((data) => setCluster(data));
  }, [id]);

  if (!cluster) return <div className="text-gray-500">Loading cluster...</div>;

  const total = cluster.journeys.length;
  const p0 = cluster.journeys.filter(j => j.risk?.priority === "P0").length;
  const p1 = cluster.journeys.filter(j => j.risk?.priority === "P1").length;
  const p2 = cluster.journeys.filter(j => j.risk?.priority === "P2").length;

  return (
    <div>
      <PageHeader title={cluster.label} subtitle="Cluster details and journeys" />

      <Link
        to="/clusters"
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Back to Clusters
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Total Journeys</h2>
          <div className="text-3xl font-bold">{total}</div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Risk Distribution</h2>
          <div className="space-y-2">
            <RiskRow label="P0" count={p0} total={total} color="bg-red-500" />
            <RiskRow label="P1" count={p1} total={total} color="bg-yellow-500" />
            <RiskRow label="P2" count={p2} total={total} color="bg-green-500" />
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Cluster ID</h2>
          <div className="text-lg">{cluster.id}</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Journeys in this Cluster</h2>
        <div className="space-y-3">
          {cluster.journeys.map(j => (
            <Link key={j.id} to={`/journeys/${j.id}`}>
              <div className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{j.title}</span>
                  <RiskBadge priority={j.risk?.priority ?? "P2"} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RiskRow({
  label,
  count,
  total,
  color
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded">
        <div
          className={`${color} h-2 rounded`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
