import { useState } from "react";
import { StabilityAPI } from "../api/stability";

export function StabilizationPanel({ project }: { project: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleStabilize() {
    setLoading(true);
    const res = await StabilityAPI.runStabilization(project);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="border-2 border-blue-500 rounded-lg p-6 bg-white dark:bg-gray-800 shadow">
      <h2 className="text-xl font-semibold mb-4">Autonomous Stabilization</h2>

      <button
        onClick={handleStabilize}
        disabled={loading}
        className={`px-5 py-2 rounded text-white text-lg ${
          loading
            ? "bg-blue-300 dark:bg-blue-700 cursor-default"
            : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        }`}
      >
        {loading ? "Running..." : "Run Stabilization"}
      </button>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Result</h3>

          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded max-h-64 overflow-auto">
            {JSON.stringify(result.stabilization, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
