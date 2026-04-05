import { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

const API_BASE = "http://localhost:3000";

export default function FlowGraph({ projectId }: { projectId: string }) {
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flows`)
      .then(res => res.json())
      .then(setGraph);
  }, [projectId]);

  if (!graph || graph.pages.length === 0) return null;

  const nodes = graph.pages.map((p: any, i: number) => ({
    id: p.url,
    position: { x: 100, y: i * 150 },
    data: { label: p.url },
    style: {
      padding: 12,
      borderRadius: 8,
      border: "1px solid #7B2FF7",
      background: "#F8F4FF",
      color: "#7B2FF7",
      fontWeight: 600
    }
  }));

  const edges = graph.edges.map((e: any, index: number) => ({
    id: `edge-${index}`,
    source: e.from,
    target: e.to,
    label: e.action,
    animated: true,
    style: { stroke: "#2FF7D1" },
    labelStyle: { fill: "#2FF7D1", fontWeight: 600 }
  }));

  return (
    <div
      style={{
        height: "600px",
        border: "1px solid #eee",
        borderRadius: "12px",
        marginTop: "16px"
      }}
    >
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
