import React from "react";
import type { DistributedInfo } from "../../api/types";

export function DistributedInfoPanel({ info }: { info: DistributedInfo | null }) {
  if (!info) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold">Distributed Execution</h2>
      <pre className="bg-gray-100 p-4 rounded mt-2">
        {JSON.stringify(info, null, 2)}
      </pre>
    </section>
  );
}
