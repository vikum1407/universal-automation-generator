import type { WorkerNode } from "../../api/types";

export function WorkerHealthCard({ worker }: { worker: WorkerNode }) {
  const color =
    worker.status === "healthy"
      ? "bg-green-500"
      : worker.status === "degraded"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="p-3 border rounded bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{worker.name}</div>
        <div className={`h-3 w-3 rounded-full ${color}`} />
      </div>

      <div className="text-xs text-gray-600 mt-2">
        CPU: {worker.cpu}% • Memory: {worker.memory}% • Running:{" "}
        {worker.running_tests}
      </div>
    </div>
  );
}
