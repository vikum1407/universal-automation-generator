import React from "react";
import type { CPUProfileNode } from "../../api/types";

function renderNode(node: CPUProfileNode, depth: number): React.ReactNode {
  return (
    <div key={node.name + depth} className="ml-4 mt-1">
      <div
        className="h-4 bg-red-300 rounded"
        style={{ width: `${node.value}px` }}
      >
        <span className="text-xs ml-1">{node.name}</span>
      </div>

      {node.children?.map((c) => renderNode(c, depth + 1))}
    </div>
  );
}

export function CPUFlamegraph({ root }: { root: CPUProfileNode | null }) {
  if (!root) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">CPU Flamegraph</h2>
      <div className="p-3 border rounded bg-white shadow-sm overflow-x-auto">
        {renderNode(root, 0)}
      </div>
    </section>
  );
}
