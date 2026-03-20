import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export function AssertionsPanel({
  assertions,
}: {
  assertions: {
    id: string;
    passed: boolean;
    message: string;
  }[];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Assertions</h2>

        {assertions.length === 0 && <div>No assertions found</div>}

        <div className="space-y-3">
          {assertions.map((a) => (
            <div
              key={a.id}
              className="border rounded-md p-3 flex justify-between items-center"
            >
              <div className="text-sm">{a.message}</div>

              <RiskBadge priority={a.passed ? "P2" : "P0"} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
