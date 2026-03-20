import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardAPI } from "../api/dashboard";
import { Card } from "../components/Card";
import { RiskBadge } from "../components/RiskBadge";

interface Project {
  id: string;
  title?: string;
  risk?: { priority: "P0" | "P1" | "P2" };
  summary?: string;
}

export default function Journeys() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    DashboardAPI.journeys().then((data) => {
      setProjects(data as Project[]);
    });
  }, []);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-gray-500 dark:text-slate-400">
          All tracked automation projects
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((p) => (
          <Link key={p.id} to={`/journeys/${p.id}`}>
            <Card>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">{p.title ?? p.id}</h2>
                <RiskBadge priority={p.risk?.priority ?? "P2"} />
              </div>
              <p className="text-gray-500 mt-2">{p.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
