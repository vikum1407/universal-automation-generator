export function RiskBadge({ priority }: { priority: "P0" | "P1" | "P2" }) {
  const colors: Record<string, string> = {
    P0: "bg-red-100 text-red-700",
    P1: "bg-yellow-100 text-yellow-700",
    P2: "bg-green-100 text-green-700"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[priority]}`}>
      {priority}
    </span>
  );
}
