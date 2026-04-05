import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";

export default function InitializingProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation() as any;

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing project...");

  // Fake progress simulation (replace with real backend polling)
  useEffect(() => {
    const steps =
      state?.type === "ui"
        ? [
            "Scanning website...",
            "Extracting DOM structure...",
            "Detecting flows...",
            "Generating initial tests...",
            "Finalizing project..."
          ]
        : [
            "Parsing Swagger...",
            "Extracting endpoints...",
            "Generating test cases...",
            "Analyzing schemas...",
            "Finalizing project..."
          ];

    let stepIndex = 0;

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 20, 100));
      setStatusText(steps[stepIndex] || "Finalizing...");
      stepIndex++;

      if (stepIndex > steps.length) {
        clearInterval(interval);

        // TODO: Replace with real redirect to project dashboard
        navigate(`/projects/${id || "temp-id"}`);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [navigate, id, state]);

  return (
    <div className="max-w-2xl mx-auto py-20 space-y-10">
      <h1 className="text-h1 font-semibold text-neutral-dark dark:text-neutral-light text-center">
        Setting Up Your Project
      </h1>

      <Card className="p-10 space-y-8 text-center">

        <div className="text-lg font-medium text-neutral-dark dark:text-neutral-light">
          {statusText}
        </div>

        <div className="w-full bg-neutral-light dark:bg-slate-700 rounded h-3 overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-sm text-neutral-mid dark:text-slate-400">
          {progress}% complete
        </div>

        <div className="pt-6 space-y-3">
          <Skeleton height={16} className="w-3/4 mx-auto" />
          <Skeleton height={16} className="w-2/3 mx-auto" />
          <Skeleton height={16} className="w-1/2 mx-auto" />
        </div>

      </Card>
    </div>
  );
}
