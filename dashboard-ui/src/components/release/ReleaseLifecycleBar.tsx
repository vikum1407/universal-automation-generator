type Stage = {
  key: string;
  label: string;
  timestamp?: string;
};

export default function ReleaseLifecycleBar({
  createdAt,
  frozenAt,
  deployedAt,
  completedAt,
}: {
  createdAt?: string;
  frozenAt?: string;
  deployedAt?: string;
  completedAt?: string;
}) {
  const stages: Stage[] = [
    { key: "created", label: "Created", timestamp: createdAt },
    { key: "frozen", label: "Frozen", timestamp: frozenAt },
    { key: "deployed", label: "Deployed", timestamp: deployedAt },
    { key: "completed", label: "Completed", timestamp: completedAt },
  ];

  const activeIndex = stages.findIndex((s) => !s.timestamp);
  const lastCompletedIndex = activeIndex === -1 ? stages.length - 1 : activeIndex - 1;

  return (
    <div className="flex items-center gap-4 py-2">
      {stages.map((stage, idx) => {
        const isCompleted = idx <= lastCompletedIndex;
        const isCurrent = idx === activeIndex;

        return (
          <div key={stage.key} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isCompleted
                  ? "bg-green-500"
                  : isCurrent
                  ? "bg-yellow-500"
                  : "bg-gray-400"
              }`}
            />

            <div className="text-xs">
              <div className="font-medium">{stage.label}</div>
              {stage.timestamp && (
                <div className="text-gray-500">
                  {new Date(stage.timestamp).toLocaleString()}
                </div>
              )}
            </div>

            {idx < stages.length - 1 && (
              <div
                className={`w-10 h-0.5 ${
                  isCompleted ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
