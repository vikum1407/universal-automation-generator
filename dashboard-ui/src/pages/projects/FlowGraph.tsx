import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";

const API_BASE = "http://localhost:3000";

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

const CustomNode = ({ data }: any) => (
  <div
    onClick={() => window.open(data.fullUrl, "_blank")}
    style={{
      padding: "10px 12px",
      borderRadius: "10px",
      border: `2px solid ${stringToColor(data.pageUrl)}`,
      background: "#F8F4FF",
      color: "#7B2FF7",
      fontWeight: 600,
      cursor: "pointer",
      width: "220px",
      textAlign: "left",
      whiteSpace: "normal",
      wordBreak: "break-word",
      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      fontSize: "12px"
    }}
    title={`${data.fullUrl}\n${data.selector || ""}`}
  >
    <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: 4 }}>
      {new URL(data.pageUrl).hostname}
    </div>
    <div>{data.label}</div>
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export default function FlowGraph({ projectId }: { projectId: string }) {
  const [graph, setGraph] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow`)
      .then(res => res.json())
      .then(setGraph);
  }, [projectId]);

  if (!graph || !graph.nodes?.length) return null;

  const nodes = graph.nodes.map((n: any, index: number) => ({
    id: n.id,
    position: {
      x: (index % 5) * 260,
      y: Math.floor(index / 5) * 160
    },
    data: {
      label: n.text || n.selector || "(element)",
      fullUrl: n.pageUrl,
      selector: n.selector,
      pageUrl: n.pageUrl
    },
    type: "customNode"
  }));

  const edges = graph.edges.map((e: any, index: number) => ({
    id: e.id || `edge-${index}`,
    source: e.from,
    target: e.to,
    label: e.action,
    animated: true,
    style: { stroke: "#7B2FF7", strokeWidth: 1.8 },
    labelStyle: { fill: "#7B2FF7", fontWeight: 600, fontSize: 11 }
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={{ customNode: CustomNode }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
